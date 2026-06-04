import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema({
    title: { type: String, required: true }, // Nombre interno para identificar el banner
    subtitle: { type: String, required: false }, // Texto opcional sobre el banner
    
    // Imagen para escritorio
    imageDesktop: { type: String, required: true }, 
    
    // Imagen optimizada para móviles (opcional pero muy recomendado)
    imageMobile: { type: String, required: false }, 
    
    // Ruta a la que redirige (ej: /categoria/camisetas)
    linkUrl: { type: String, required: true }, 
    
    // Control de visibilidad
    active: { type: Boolean, default: true },
    
    // Orden de aparición (por si tienes varios en un slider)
    order: { type: Number, default: 0 },
    
    // Por si quieres que el banner expire automáticamente (ej: rebajas)
    startDate: { type: Date, required: false },
    endDate: { type: Date, required: false },
    
    // Ubicación del banner (por si quieres usar el mismo modelo para Home, Categorías, etc.)
    location: { 
        type: String, 
        default: 'home_main', 
        enum: ['home_main', 'home_secondary', 'category_top'] 
    },

    date: { type: Number, required: true, default: Date.now() }
});

const bannerModel = mongoose.models.banner || mongoose.model("banner", bannerSchema);

export default bannerModel;