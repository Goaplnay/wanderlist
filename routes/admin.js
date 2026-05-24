const express = require("express");
const router = express.Router();
const Listing = require("../models/listing");
const User = require("../models/user");
const Review = require("../models/reviews");
const wrapAsync = require("../utils/wrapAsync");
const { isLoggedIn, isAdmin } = require("../middleware");

// DASHBOARD
router.get("/", isLoggedIn, isAdmin, wrapAsync(async (req, res) => {
  const totalListings = await Listing.countDocuments();
  const totalUsers = await User.countDocuments();
  const totalReviews = await Review.countDocuments();
  const recentListings = await Listing.find({}).sort({ createdAt: -1 }).limit(5).populate("owner");
  const recentUsers = await User.find({}).sort({ _id: -1 }).limit(5);
  const allUsers = await User.find({});

  res.render("admin/dashboard", {
    totalListings,
    totalUsers,
    totalReviews,
    recentListings,
    recentUsers,
    allUsers,
  });
}));

// DELETE ANY LISTING
router.delete("/listings/:id", isLoggedIn, isAdmin, wrapAsync(async (req, res) => {
  await Listing.findByIdAndDelete(req.params.id);
  req.flash("success", "Listing deleted by admin!");
  res.redirect("/admin");
}));

// DELETE ANY USER
router.delete("/users/:id", isLoggedIn, isAdmin, wrapAsync(async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  req.flash("success", "User deleted by admin!");
  res.redirect("/admin");
}));

// TOGGLE ADMIN
router.post("/users/:id/toggle-admin", isLoggedIn, isAdmin, wrapAsync(async (req, res) => {
  const user = await User.findById(req.params.id);
  user.isAdmin = !user.isAdmin;
  await user.save();
  req.flash("success", `${user.username} admin status updated!`);
  res.redirect("/admin");
}));

module.exports = router;