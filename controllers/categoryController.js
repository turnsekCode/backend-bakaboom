import categoryModel from '../models/categoryModel.js';

/* =========================================
   🔧 UTIL: construir árbol de categorías
========================================= */
const buildTree = (categories, parentId = null) => {
  return categories
    .filter(cat => String(cat.parentId) === String(parentId))
    .sort((a, b) => a.order - b.order)
    .map(cat => ({
      ...cat._doc,
      children: buildTree(categories, cat._id)
    }));
};

/* =========================================
   ➕ CREATE categoría (raíz o hija)
========================================= */
const addCategory = async (req, res) => {
  try {
    const {
      name,
      slug,
      parentId = null,
      isCampaign,
      showInNavbar,
      active,
      order
    } = req.body;

    if (!name || !slug) {
      return res.status(400).json({
        success: false,
        message: "Name y slug son obligatorios"
      });
    }

    const existing = await categoryModel.findOne({ slug });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "El slug ya existe"
      });
    }

    const newCategory = new categoryModel({
      name,
      slug,
      parentId,
      isCampaign: isCampaign || false,
      showInNavbar: showInNavbar ?? true,
      active: active ?? true,
      order: order || 0
    });

    await newCategory.save();

    res.json({ success: true, data: newCategory });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =========================================
   📄 LIST (flat)
========================================= */
const listCategories = async (req, res) => {
  try {
    const categories = await categoryModel
      .find({ active: true })
      .sort({ order: 1 });

    res.json({ success: true, categories });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =========================================
   🌳 LIST (tree)
========================================= */
const listCategoriesTree = async (req, res) => {
  try {
    const categories = await categoryModel.find({ active: true });

    const tree = buildTree(categories);

    res.json({ success: true, categories: tree });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =========================================
   🔍 SINGLE
========================================= */
const singleCategory = async (req, res) => {
  try {
    const { categoryId } = req.body;

    const category = await categoryModel.findById(categoryId);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Categoría no encontrada"
      });
    }

    res.json({ success: true, category });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =========================================
   ✏️ UPDATE
========================================= */
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      slug,
      parentId,
      isCampaign,
      showInNavbar,
      active,
      order
    } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID requerido"
      });
    }

    // ❌ evitar que sea su propio padre
    if (id === parentId) {
      return res.status(400).json({
        success: false,
        message: "Una categoría no puede ser su propio padre"
      });
    }

    // ❌ evitar slug duplicado
    if (slug) {
      const existing = await categoryModel.findOne({ slug });
      if (existing && existing._id.toString() !== id) {
        return res.status(400).json({
          success: false,
          message: "El slug ya existe"
        });
      }
    }

    const updated = await categoryModel.findByIdAndUpdate(
      id,
      { name, slug, parentId, isCampaign, showInNavbar, active, order },
      { new: true }
    );

    res.json({ success: true, data: updated });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =========================================
   ❌ DELETE (con hijos en cascada)
========================================= */
const deleteWithChildren = async (id) => {
  const children = await categoryModel.find({ parentId: id });

  for (const child of children) {
    await deleteWithChildren(child._id);
  }

  await categoryModel.findByIdAndDelete(id);
};

const removeCategory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID requerido"
      });
    }

    await deleteWithChildren(id);

    res.json({ success: true });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =========================================
   📍 BREADCRUMBS (SEO 🔥)
========================================= */
const getBreadcrumbs = async (req, res) => {
  try {
    const { categoryId } = req.params;

    let breadcrumbs = [];
    let current = await categoryModel.findById(categoryId);

    while (current) {
      breadcrumbs.unshift(current);

      current = current.parentId
        ? await categoryModel.findById(current.parentId)
        : null;
    }

    res.json({ success: true, breadcrumbs });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =========================================
   EXPORTS
========================================= */
export {
  addCategory,
  listCategories,
  listCategoriesTree,
  singleCategory,
  updateCategory,
  removeCategory,
  getBreadcrumbs
};