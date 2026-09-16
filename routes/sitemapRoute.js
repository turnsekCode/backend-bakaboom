import express from "express";
import Product from "../models/productModel.js";

const router = express.Router();

const BASE_URL = "https://www.bakaboom.es";

router.get("/sitemap.xml", async (req, res) => {
  try {
    const products = await Product.find({
      slug: { $exists: true, $ne: "" },
      quantity: { $gt: 0 },
    }).select(
      "slug categorySlug subcategorySlug subCategorySlug2 date updatedAt"
    );

    const urls = new Map();

    const addUrl = ({
      loc,
      lastmod = new Date(),
      changefreq = "weekly",
      priority = "0.5",
    }) => {
      if (!urls.has(loc)) {
        urls.set(loc, {
          loc,
          lastmod,
          changefreq,
          priority,
        });
      }
    };

    /*
    =========================================
    RUTAS FIJAS
    =========================================
    */

    addUrl({
      loc: `${BASE_URL}/`,
      changefreq: "daily",
      priority: "1.0",
    });

    addUrl({
      loc: `${BASE_URL}/about`,
      priority: "0.4",
    });

    addUrl({
      loc: `${BASE_URL}/contacto`,
      priority: "0.5",
    });

    addUrl({
      loc: `${BASE_URL}/privacy_policy`,
      priority: "0.3",
    });

    addUrl({
      loc: `${BASE_URL}/delivery`,
      priority: "0.5",
    });

    addUrl({
      loc: `${BASE_URL}/terms`,
      priority: "0.3",
    });

    addUrl({
      loc: `${BASE_URL}/aviso-legal`,
      priority: "0.3",
    });

    /*
    =========================================
    RUTAS ESPECIALES
    =========================================
    */

    addUrl({
      loc: `${BASE_URL}/packs-bolsos-disenos-bakaboom`,
      priority: "0.7",
    });

    addUrl({
      loc: `${BASE_URL}/personalizacion-bidones-termos`,
      priority: "0.7",
    });

    addUrl({
      loc: `${BASE_URL}/personalizacion-jarras-vasos`,
      priority: "0.7",
    });

    addUrl({
      loc: `${BASE_URL}/camisetas-diseno-bakaboom`,
      priority: "0.7",
    });

    addUrl({
      loc: `${BASE_URL}/personalizacion-articulos`,
      priority: "0.7",
    });

    addUrl({
      loc: `${BASE_URL}/personalizacion-de-tasas-en-paterna`,
      priority: "0.7",
    });

    addUrl({
      loc: `${BASE_URL}/personalizacion-sudaderas-paterna`,
      priority: "0.7",
    });

    addUrl({
      loc: `${BASE_URL}/personalizacion-camisetas-paterna`,
      priority: "0.7",
    });

    /*
    =========================================
    CATEGORÍAS Y PRODUCTOS
    =========================================
    */

    products.forEach((product) => {
      const {
        slug,
        categorySlug,
        subcategorySlug,
        subCategorySlug2,
        date,
        updatedAt,
      } = product;

      const lastmod = updatedAt || date || new Date();

      /*
      =========================
      CATEGORÍA
      =========================
      */

      if (categorySlug) {
        addUrl({
          loc: `${BASE_URL}/categoria/${categorySlug}`,
          lastmod,
          changefreq: "weekly",
          priority: "0.8",
        });
      }

      /*
      =========================
      SUBCATEGORÍA
      =========================
      */

      if (categorySlug && subcategorySlug) {
        addUrl({
          loc: `${BASE_URL}/categoria/${categorySlug}/${subcategorySlug}`,
          lastmod,
          changefreq: "weekly",
          priority: "0.7",
        });
      }

      /*
      =========================
      SUBCATEGORÍA 2
      =========================
      */

      if (
        categorySlug &&
        subcategorySlug &&
        subCategorySlug2
      ) {
        addUrl({
          loc: `${BASE_URL}/categoria/${categorySlug}/${subcategorySlug}/${subCategorySlug2}`,
          lastmod,
          changefreq: "weekly",
          priority: "0.7",
        });
      }

      /*
      =========================
      PRODUCTO
      =========================
      */

      if (slug) {
        addUrl({
          loc: `${BASE_URL}/producto/${slug}`,
          lastmod,
          changefreq: "weekly",
          priority: "0.6",
        });
      }
    });

    /*
    =========================================
    GENERAR XML
    =========================================
    */

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
>
${Array.from(urls.values())
  .map(
    ({ loc, lastmod, changefreq, priority }) => `
  <url>
    <loc>${loc}</loc>
    <lastmod>${new Date(lastmod)
      .toISOString()
      .split("T")[0]}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
  )
  .join("")}
</urlset>`;

    res
      .header("Content-Type", "application/xml")
      .send(xml);
  } catch (error) {
    console.error("Error generando sitemap:", error);

    res.status(500).send("Error generando sitemap");
  }
});

export default router;