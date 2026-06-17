import { v2 as cloudinary } from "cloudinary";
import productModel from "../models/productModel.js";
import multer from "multer";

const upload = multer();

// function for add product
const addProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      description2,
      price,
      category,
      subCategory,
      subCategory2,
      bestSeller,
      destacado,
      slug,
      metaDescription,
      metaTitle,
      quantity,
      variants,
      categorySlug,
      subcategorySlug,
      subCategorySlug2,
      anos,
      textPersonal,
    } = req.body;

    const parsedVariants = variants ? JSON.parse(variants) : [];

    const cleanVariants = parsedVariants.map((v) => ({
      size: v.size,
      color: v.color,
      stock: Number(v.stock),
    }));

    const totalStock = cleanVariants.reduce((acc, v) => acc + v.stock, 0);

    const image1 = req.files.image1 && req.files.image1[0];
    const image2 = req.files.image2 && req.files.image2[0];
    const image3 = req.files.image3 && req.files.image3[0];
    const image4 = req.files.image4 && req.files.image4[0];

    const images = [image1, image2, image3, image4].filter(Boolean);

    let imagesUrl = await Promise.all(
      images.map((item) =>
        cloudinary.uploader
          .upload(item.path, { resource_type: "image" })
          .then((res) => res.secure_url),
      ),
    );

    const product = new productModel({
      name,
      description,
      description2,
      price: Number(price),
      image: imagesUrl,
      category,
      subCategory,
      subCategory2,
      bestSeller: bestSeller === "true",
      destacado: destacado === "true",
      slug,
      metaDescription,
      metaTitle,
      variants: cleanVariants,
      quantity: cleanVariants.length ? totalStock : Number(quantity),
      date: Date.now(),
      categorySlug,
      subcategorySlug,
      subCategorySlug2,
      anos,
      textPersonal,
    });

    await product.save();

    res.json({ success: true, message: "Product added successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// function for list product

const listProducts = async (req, res) => {
  try {
    const products = await productModel.find({});
    res.json({ success: true, products });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// function for remove product

const removeProduct2 = async (req, res) => {
  try {
    await productModel.findByIdAndDelete(req.body.id);
    res.json({ success: true, message: "Product removed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
const removeProduct = async (req, res) => {
  try {
    // Buscar el producto por su ID
    const product = await productModel.findById(req.body.id);

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    // Eliminar imágenes de Cloudinary
    if (product.image && product.image.length) {
      await Promise.all(
        product.image.map(async (imageUrl) => {
          // Extraer public_id de la URL de Cloudinary
          const publicId = imageUrl.split("/").pop().split(".")[0]; // Obtener el public_id de la URL
          await cloudinary.uploader.destroy(publicId); // Eliminar usando el public_id
        }),
      );
    }

    // Eliminar el producto de la base de datos
    await productModel.findByIdAndDelete(req.body.id);

    res.json({ success: true, message: "Product removed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// function for single product

const singleProduct = async (req, res) => {
  try {
    const { id } = req.params; // Obtener el ID del producto de los parámetros de la URL
    const product = await productModel.findById(id); // Buscar el producto por ID
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
    res.json({ success: true, product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      description2,
      price,
      category,
      subCategory,
      subCategory2,
      bestSeller,
      destacado,
      slug,
      metaDescription,
      metaTitle,
      quantity,
      variants,
      categorySlug,
      subcategorySlug,
      subCategorySlug2,
      anos,
      textPersonal,
    } = req.body;

    //console.log("REQ BODY:", req.body);
    //console.log("VARIANTS RAW:", req.body.variants);

    const { id } = req.params;

    const parsedVariants = variants ? JSON.parse(variants) : [];

    const cleanVariants = parsedVariants.map((v) => ({
      size: v.size,
      color: v.color,
      stock: Number(v.stock),
    }));

    const totalStock = cleanVariants.reduce((acc, v) => acc + v.stock, 0);

    const product = await productModel.findById(id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    // 🟢 ACTUALIZACIÓN NORMAL
    product.name = name;
    product.description = description;
    product.description2 = description2;
    product.price = Number(price);
    product.category = category;
    product.subCategory = subCategory;
    product.subCategory2 = subCategory2;
    product.bestSeller = bestSeller === "true";
    product.destacado = destacado === "true";
    product.slug = slug;
    product.metaDescription = metaDescription;
    product.metaTitle = metaTitle;
    product.categorySlug = categorySlug;
    product.subcategorySlug = subcategorySlug;
    product.subCategorySlug2 = subCategorySlug2;
    // 🔥 NUEVO
    product.variants = cleanVariants;
    product.quantity = cleanVariants.length ? totalStock : Number(quantity);
    product.anos = anos;
    product.textPersonal = textPersonal;
    // 👉 imágenes (tu código lo dejas igual)
    const image1 = req.files.image1 && req.files.image1[0];
    const image2 = req.files.image2 && req.files.image2[0];
    const image3 = req.files.image3 && req.files.image3[0];
    const image4 = req.files.image4 && req.files.image4[0];

    const images = [image1, image2, image3, image4].filter(Boolean);

    if (images.length) {
      let imagesUrl = await Promise.all(
        images.map((item) =>
          cloudinary.uploader
            .upload(item.path, { resource_type: "image" })
            .then((res) => res.secure_url),
        ),
      );
      product.image = imagesUrl;
    }

    await product.save();

    res.json({ success: true, message: "Product updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// controllers/productController.js
const updateProductQuantity = async (req, res) => {
  try {
    const { id, quantity, size, color, realSize, realColor } = req.body;
    //console.log("Updating product quantity:", req.body);

    const product = await productModel.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Producto no encontrado",
      });
    }

    const qty = Number(quantity);

    if (!qty || qty <= 0) {
      return res.status(400).json({
        success: false,
        message: "Cantidad inválida",
      });
    }

    if (product.quantity < qty) {
      return res.status(400).json({
        success: false,
        message: "No hay suficiente stock disponible.",
      });
    }

    // =========================
    // USAR DATOS REALES SI EXISTEN
    // =========================
    const finalSize = realSize || size;
    const finalColor = realColor || color;

    if (finalSize && finalColor) {
      const variant = product.variants.find(
        (v) => v.size === finalSize && v.color === finalColor,
      );

      if (!variant) {
        return res.status(404).json({
          success: false,
          message: "Variante no encontrada",
        });
      }

      if (variant.stock < qty) {
        return res.status(400).json({
          success: false,
          message: "No hay stock en esta variante",
        });
      }

      variant.stock -= qty;
    }

    // STOCK GLOBAL
    product.quantity -= qty;

    await product.save();

    res.json({
      success: true,
      message: "Stock actualizado",
      product,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export {
  addProduct,
  listProducts,
  removeProduct,
  singleProduct,
  updateProduct,
  updateProductQuantity,
};
