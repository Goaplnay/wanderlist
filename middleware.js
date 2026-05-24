const Listing = require("./models/listing");
const Review = require("./models/reviews");
const ExpressError = require("./utils/ExpressError");
const {listingSchema, reviewSchema } = require("./schema");
module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.session.redirectUrl = req.originalUrl; // ✅ returnTo → redirectUrl
    req.flash("error", "You must be signed in to access this page!");
    return res.redirect("/login");
  }
  next();
};
module.exports.saveRedirectUrl = (req, res, next) => {
  if(req.session.redirectUrl) {
    res.locals.redirectUrl = req.session.redirectUrl;
  }
    next();
};
module.exports.isOwner = async (req, res, next) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing.owner.equals(req.user._id)) {
    req.flash("error", "You don't have permission to do that!");
    return res.redirect(`/listings/${id}`);
  }
  
  next();
};

module.exports.isReviewAuthor = async (req, res, next) => {
  let {id, reviewId} = req.params;
  const review = await Review.findById(reviewId);
  if (!review.author.equals(req.user._id)) {
    req.flash("error", "You don't have permission to do that!");
    return res.redirect(`/listings/${review.listing._id}`);
  }
  next();
};
module.exports.isAdmin = (req, res, next) => {
  if (!req.isAuthenticated() || !req.user.isAdmin) {
    req.flash("error", "Admin access required!");
    return res.redirect("/listings");
  }
  next();
};