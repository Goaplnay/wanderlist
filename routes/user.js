const express = require("express");
const router = express.Router();
const passport = require("passport");
const User = require("../models/user");
const wrapAsync = require("../utils/wrapAsync");
const { saveRedirectUrl, isLoggedIn } = require("../middleware");
const Listing = require("../models/listing");

// ======================
// SIGNUP
// ======================
router.get("/signup", (req, res) => {
  res.render("users/signup");
});

router.post("/signup", wrapAsync(async (req, res, next) => {
  try {
    let { username, email, password } = req.body;
    const newUser = new User({ username, email });
    const registeredUser = await User.register(newUser, password);
    req.login(registeredUser, (err) => {
      if (err) return next(err);
      req.flash("success", "Welcome to Wanderlust!");
      res.redirect("/listings");
    });
  } catch (err) {
    req.flash("error", err.message);
    res.redirect("/signup");
  }
}));

// ======================
// LOGIN
// ======================
router.get("/login", (req, res) => {
  res.render("users/login");
});

router.post("/login",
  saveRedirectUrl,
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true
  }),
  (req, res) => {
    req.flash("success", "Welcome back!");
    res.redirect(res.locals.redirectUrl || "/listings");
  }
);

// ======================
// LOGOUT
// ======================
router.get("/logout", (req, res, next) => {
  req.logout(function(err) {
    if (err) return next(err);
    req.flash("success", "Logged out successfully!");
    res.redirect("/listings");
  });
});

// ======================
// PROFILE
// ======================
router.get("/profile", isLoggedIn, wrapAsync(async (req, res) => {
  const userListings = await Listing.find({ owner: req.user._id });
  res.render("users/profile", { userListings });
}));


module.exports = router;