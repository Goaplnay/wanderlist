const express = require("express");
const router = express.Router();

const Listing = require("../models/listing");
const wrapAsync = require("../utils/wrapAsync");
const ExpressError = require("../utils/ExpressError");
const { listingSchema } = require("../schema");
const { isLoggedIn, isOwner } = require("../middleware");
const multer = require("multer");
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });


// ======================
// VALIDATION MIDDLEWARE
// ======================
const validateListing = (req, res, next) => {
  const { error } = listingSchema.validate(req.body);
  if (error) {
    const errorMessage = error.details.map(el => el.message).join(", ");
    throw new ExpressError(errorMessage, 400);
  }
  next();
};

// ======================
// ROUTES
// ======================

// INDEX
router.get("/", wrapAsync(async (req, res) => {
  const { search, category } = req.query;
  let filter = {};

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { location: { $regex: search, $options: "i" } },
      { country: { $regex: search, $options: "i" } },
    ];
  }

  if (category) {
    filter.category = category;
  }

  const allListings = await Listing.find(filter);
  res.render("listings/index", { allListings, search: search || "", category: category || "" });
}));
// NEW
router.get("/new", isLoggedIn, (req, res) => {
  res.render("listings/new.ejs");
});

// CREATE
// CREATE
router.post("/", isLoggedIn, upload.array("listing[images]", 5), validateListing, wrapAsync(async (req, res) => {
  const newListing = new Listing(req.body.listing);
  newListing.owner = req.user._id;

  if (req.files && req.files.length > 0) {
    // Pehli image main image banao
    newListing.image = {
      url: req.files[0].path,
      filename: req.files[0].filename,
    };
    // Saari images array mein save karo
    newListing.images = req.files.map(f => ({
      url: f.path,
      filename: f.filename,
    }));
  }

  await newListing.save();
  req.flash("success", "Listing created successfully!");
  res.redirect(`/listings/${newListing._id}`);
}));

// UPDATE
router.put("/:id", isLoggedIn, isOwner, upload.array("listing[images]", 5), validateListing, wrapAsync(async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findByIdAndUpdate(id, req.body.listing, {
    runValidators: true,
    new: true,
  });

  if (!listing) throw new ExpressError("Listing not found", 404);

  if (req.files && req.files.length > 0) {
    // Pehli image main image update karo
    listing.image = {
      url: req.files[0].path,
      filename: req.files[0].filename,
    };
    // Naye images add karo existing ke saath
    const newImages = req.files.map(f => ({
      url: f.path,
      filename: f.filename,
    }));
    listing.images.push(...newImages);
    await listing.save();
  }

  req.flash("success", "Listing updated successfully!");
  res.redirect(`/listings/${id}`);
}));

// SHOW
router.get("/:id", wrapAsync(async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id)
    .populate({ path: "reviews", populate: { path: "author" } })
    .populate("owner");

  if (!listing) {
    throw new ExpressError("Listing not found", 404);
  }

  res.render("listings/show", { listing });
}));

// EDIT
router.get("/:id/edit", isLoggedIn, isOwner, wrapAsync(async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);

  if (!listing) {
    throw new ExpressError("Listing not found", 404);
  }

  res.render("listings/edit", { listing });
}));

// UPDATE
router.put("/:id", isLoggedIn, isOwner, upload.single("listing[image]"), validateListing, wrapAsync(async (req, res) => {
  const { id } = req.params;

  // ✅ Geocoding
  const geoData = await geocoder.forwardGeocode({
    query: req.body.listing.location,
    limit: 1,
  }).send();

  const listing = await Listing.findByIdAndUpdate(id, req.body.listing, {
    runValidators: true,
    new: true,
  });

  listing.geometry = geoData.body.features[0].geometry;

  if (req.file) {
    listing.image = {
      url: req.file.path,
      filename: req.file.filename,
    };
  }

  await listing.save();
  req.flash("success", "Listing updated successfully!");
  res.redirect(`/listings/${id}`);
}));

// DELETE
router.delete("/:id", isLoggedIn, isOwner, wrapAsync(async (req, res) => {
  const { id } = req.params;
  const deletedListing = await Listing.findByIdAndDelete(id);

  if (!deletedListing) {
    throw new ExpressError("Listing not found", 404);
  }

  req.flash("success", "Listing deleted successfully!");
  res.redirect("/listings");
}));

module.exports = router;