import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: {type: String, required: true},
    description: {type: String, required: true},
    description2: {type: String, required: false},
    price: {type: Number, required: true},
    image: {type: Array, required: true},
    category: {type: String, required: true},
    slug: {type: String, required: true},
    categorySlug: {type: String, required: true},
    subcategorySlug: {type: String, required: false},
    subCategory: {type: String, required: false},
    subCategory2: {type: String, required: false},
    subCategorySlug2: {type: String, required: false},
    bestSeller: {type: Boolean},
    destacado: {type: Boolean, required: false},
    quantity: {type: Number, required: true, default: 1},
    metaDescription: {type: String, required: false},
    metaTitle: {type: String, required: false},
    date: {type: Number, required: true},
    variants: [
        {
            size: { type: String, required: true },   // S, M, L
            color: { type: String, required: true },  // rojo, azul
            stock: { type: Number, required: true },  // stock por variante
        }
    ],
    anos: {type: String, required: false},
    textPersonal: {type: String, required: false},
})

const productModel = mongoose.models.product || mongoose.model("product", productSchema);

export default productModel;