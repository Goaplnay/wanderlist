const express = require("express");
const router = express.Router({ mergeParams: true }); // ✅ IMPORTANT

const Listing = require("../models/listing.js");
const Review = require("../models/reviews.js");
const ExpressError = require("../utils/ExpressError.js");
const { reviewSchema } = require("../schema.js");
const { isLoggedIn, isReviewAuthor } = require("../middleware.js");
// const validateReview = require("../middleware.js");  



// ======================
// VALIDATION MIDDLEWARE
// ======================
const validateReview = (req, res, next) => {
  const { error } = reviewSchema.validate(req.body);

  if (error) {
    const errorMessage = error.details.map(el => el.message).join(", ");
    throw new ExpressError(errorMessage, 400);
  }
  next();
};

// ======================
// CREATE REVIEW
// ======================
router.post("/", validateReview,isLoggedIn, async (req, res, next) => {
  try {
    const { id } = req.params;

    const listing = await Listing.findById(id);
    if (!listing) {
      throw new ExpressError("Listing not found", 404);
    }

    const newReview = new Review(req.body.review);
    newReview.author = req.user._id; // Set the author to the currently logged-in user
    console.log("New Review Author:", newReview.author);
    listing.reviews.push(newReview);

    await newReview.save();
    await listing.save();

    res.redirect(`/listings/${id}`);
  } catch (err) {
    next(err);
  }
});

// ======================
// DELETE REVIEW
// ======================
router.delete("/:reviewId", isLoggedIn,isReviewAuthor, async (req, res, next) => {
  try {
    const { id, reviewId } = req.params;

    await Listing.findByIdAndUpdate(id, {
      $pull: { reviews: reviewId },
    });

    await Review.findByIdAndDelete(reviewId);

    res.redirect(`/listings/${id}`);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
