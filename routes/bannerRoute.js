import express from "express";
import {
  addBanner,
  listBanners,
  removeBanner,
  singleBanner,
  updateBanner,
} from "../controllers/bannerController.js";

import upload from "../middleware/multer.js";
import adminAuth from "../middleware/adminAuth.js";

const bannerRouter = express.Router();

// ➕ CREATE
bannerRouter.post(
  "/add",
  adminAuth,
  upload.fields([
    { name: "imageDesktop", maxCount: 1 },
    { name: "imageMobile", maxCount: 1 },
  ]),
  addBanner,
);

// 📄 LIST
bannerRouter.get("/list", listBanners);

// ❌ REMOVE
bannerRouter.post("/remove", adminAuth, removeBanner);

// 🔍 SINGLE
bannerRouter.get("/single/:id", singleBanner);

// ✏️ UPDATE
bannerRouter.post(
  "/update/:id",
  adminAuth,
  upload.fields([
    { name: "imageDesktop", maxCount: 1 },
    { name: "imageMobile", maxCount: 1 },
  ]),
  updateBanner,
);

export default bannerRouter;
