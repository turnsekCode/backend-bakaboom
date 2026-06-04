import reviewModel from "../models/reviewModel.js";

const addReview = async (req, res) => {
  try {
    const { productId, name, email, rating, comment } = req.body;

    const exists = await reviewModel.findOne({
      productId,
      email,
    });

    if (exists) {
      return res.json({
        success: false,
        message: "Ya has enviado una valoración para este producto",
      });
    }

    const review = new reviewModel({
      productId,
      name,
      email,
      rating: Number(rating),
      comment,
      approved: false,
    });

    await review.save();

    res.json({
      success: true,
      message: "Valoración enviada. Pendiente de aprobación.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getApprovedReviews = async (req, res) => {
  try {
    const { productId } = req.params;

    const reviews = await reviewModel
      .find({
        productId,
        approved: true,
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      reviews,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getPendingReviews = async (req, res) => {
  try {
    const reviews = await reviewModel
      .find({ approved: false })
      .populate("productId", "name")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      reviews,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const approveReview = async (req, res) => {
  try {
    const { id } = req.params;

    await reviewModel.findByIdAndUpdate(id, {
      approved: true,
    });

    res.json({
      success: true,
      message: "Valoración aprobada",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    await reviewModel.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Valoración eliminada",
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
  addReview,
  getApprovedReviews,
  getPendingReviews,
  approveReview,
  deleteReview,
};
