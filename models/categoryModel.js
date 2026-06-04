import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },

  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "category",
    default: null // 👈 null = categoría raíz
  },

  isCampaign: { type: Boolean, default: false },
  showInNavbar: { type: Boolean, default: true },
  active: { type: Boolean, default: true },

  order: { type: Number, default: 0 }
}, { timestamps: true });

const Category =
  mongoose.models.category || mongoose.model("category", categorySchema);

export default Category;