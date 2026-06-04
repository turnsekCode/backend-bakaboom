import { v2 as cloudinary } from "cloudinary";
import bannerModel from "../models/bannerModel.js";

// ➕ ADD BANNER
const addBanner = async (req, res) => {
  try {
    const {
      title,
      subtitle,
      linkUrl,
      active,
      order,
      startDate,
      endDate,
      location,
    } = req.body;

    const imageDesktop = req.files?.imageDesktop?.[0];
    const imageMobile = req.files?.imageMobile?.[0];

    if (!imageDesktop) {
      return res.status(400).json({
        success: false,
        message: "Image desktop is required",
      });
    }

    // Upload desktop image
    const desktopUrl = await cloudinary.uploader
      .upload(imageDesktop.path, { resource_type: "image" })
      .then((res) => res.secure_url);

    // Upload mobile image (optional)
    let mobileUrl = "";
    if (imageMobile) {
      mobileUrl = await cloudinary.uploader
        .upload(imageMobile.path, { resource_type: "image" })
        .then((res) => res.secure_url);
    }

    const banner = new bannerModel({
      title,
      subtitle,
      imageDesktop: desktopUrl,
      imageMobile: mobileUrl,
      linkUrl,
      active: active === "true",
      order: Number(order) || 0,
      startDate: startDate || null,
      endDate: endDate || null,
      location: location || "home_main",
      date: Date.now(),
    });

    await banner.save();

    res.json({ success: true, message: "Banner created successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 📄 LIST BANNERS
const listBanners = async (req, res) => {
  try {
    const banners = await bannerModel.find({});
    res.json({ success: true, banners });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ❌ REMOVE BANNER
const removeBanner = async (req, res) => {
  try {
    const { id } = req.body;

    const banner = await bannerModel.findById(id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found",
      });
    }

    await bannerModel.findByIdAndDelete(id);

    res.json({ success: true, message: "Banner removed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✏️ SINGLE BANNER
const singleBanner = async (req, res) => {
  try {
    const { id } = req.params;

    const banner = await bannerModel.findById(id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found",
      });
    }

    res.json({ success: true, banner });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 🔁 UPDATE BANNER
const updateBanner = async (req, res) => {
  try {
    const {
      title,
      subtitle,
      linkUrl,
      active,
      order,
      startDate,
      endDate,
      location,
    } = req.body;

    const { id } = req.params;

    const banner = await bannerModel.findById(id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found",
      });
    }

    const imageDesktop = req.files?.imageDesktop?.[0];
    const imageMobile = req.files?.imageMobile?.[0];

    // update fields
    banner.title = title;
    banner.subtitle = subtitle;
    banner.linkUrl = linkUrl;
    banner.active = active === "true";
    banner.order = Number(order) || 0;
    banner.startDate = startDate || null;
    banner.endDate = endDate || null;
    banner.location = location || "home_main";

    // images update if provided
    if (imageDesktop) {
      const desktopUrl = await cloudinary.uploader
        .upload(imageDesktop.path, { resource_type: "image" })
        .then((res) => res.secure_url);

      banner.imageDesktop = desktopUrl;
    }

    if (imageMobile) {
      const mobileUrl = await cloudinary.uploader
        .upload(imageMobile.path, { resource_type: "image" })
        .then((res) => res.secure_url);

      banner.imageMobile = mobileUrl;
    }

    await banner.save();

    res.json({ success: true, message: "Banner updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export {
  addBanner,
  listBanners,
  removeBanner,
  singleBanner,
  updateBanner,
};