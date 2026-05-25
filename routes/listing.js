const express = require("express");
const router = express.Router();

const Listing = require("../models/listing.js");
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const { listingSchema } = require("../schema.js");

const { isLoggedIn, isOwner } = require("../middleware.js");

const multer = require("multer");

const { storage } = require("../cloudConfig.js");

const upload = multer({ storage });

// ======================
// VALIDATION MIDDLEWARE
// ======================

const validateListing = (req, res, next) => {
  const { error } = listingSchema.validate(req.body);

  if (error) {
    const errorMessage = error.details
      .map((el) => el.message)
      .join(",");

    throw new ExpressError(errorMessage, 400);
  }

  next();
};

// ======================
// INDEX ROUTE
// ======================

router.get(
  "/",
  wrapAsync(async (req, res) => {
    const { search, category } = req.query;

    let filter = {};

    if (search) {
      filter.$or = [
        {
          title: {
            $regex: search,
            $options: "i",
          },
        },

        {
          location: {
            $regex: search,
            $options: "i",
          },
        },

        {
          country: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    if (category) {
      filter.category = category;
    }

    const allListings = await Listing.find(filter);

    res.render("listings/index", {
      allListings,
      search: search || "",
      category: category || "",
    });
  })
);

// ======================
// NEW ROUTE
// ======================

router.get("/new", isLoggedIn, (req, res) => {
  res.render("listings/new");
});

// ======================
// CREATE ROUTE
// ======================

router.post(
  "/",
  isLoggedIn,
  upload.array("listing[images]", 5),
  validateListing,

  wrapAsync(async (req, res) => {
    const newListing = new Listing(req.body.listing);

    newListing.owner = req.user._id;

    if (req.files && req.files.length > 0) {
      // Main image
      newListing.image = {
        url: req.files[0].path,
        filename: req.files[0].filename,
      };

      // Multiple images
      newListing.images = req.files.map((file) => ({
        url: file.path,
        filename: file.filename,
      }));
    }

    await newListing.save();

    req.flash("success", "Listing created successfully!");

    res.redirect(`/listings/${newListing._id}`);
  })
);

// ======================
// SHOW ROUTE
// ======================

router.get(
  "/:id",

  wrapAsync(async (req, res) => {
    const { id } = req.params;

    const listing = await Listing.findById(id)
      .populate({
        path: "reviews",
        populate: {
          path: "author",
        },
      })
      .populate("owner");

    if (!listing) {
      req.flash("error", "Listing not found!");

      return res.redirect("/listings");
    }

    res.render("listings/show", { listing });
  })
);

// ======================
// EDIT ROUTE
// ======================

router.get(
  "/:id/edit",
  isLoggedIn,
  isOwner,

  wrapAsync(async (req, res) => {
    const { id } = req.params;

    const listing = await Listing.findById(id);

    if (!listing) {
      req.flash("error", "Listing not found!");

      return res.redirect("/listings");
    }

    res.render("listings/edit", { listing });
  })
);

// ======================
// UPDATE ROUTE
// ======================

router.put(
  "/:id",
  isLoggedIn,
  isOwner,
  upload.array("listing[images]", 5),
  validateListing,

  wrapAsync(async (req, res) => {
    const { id } = req.params;

    const listing = await Listing.findByIdAndUpdate(
      id,
      req.body.listing,
      {
        runValidators: true,
        new: true,
      }
    );

    if (!listing) {
      throw new ExpressError("Listing not found", 404);
    }

    if (req.files && req.files.length > 0) {
      // Update main image
      listing.image = {
        url: req.files[0].path,
        filename: req.files[0].filename,
      };

      // Add new images
      const newImages = req.files.map((file) => ({
        url: file.path,
        filename: file.filename,
      }));

      listing.images.push(...newImages);

      await listing.save();
    }

    req.flash("success", "Listing updated successfully!");

    res.redirect(`/listings/${id}`);
  })
);

// ======================
// DELETE ROUTE
// ======================

router.delete(
  "/:id",
  isLoggedIn,
  isOwner,

  wrapAsync(async (req, res) => {
    const { id } = req.params;

    const deletedListing = await Listing.findByIdAndDelete(id);

    if (!deletedListing) {
      throw new ExpressError("Listing not found", 404);
    }

    req.flash("success", "Listing deleted successfully!");

    res.redirect("/listings");
  })
);

// ======================
// EXPORT
// ======================

module.exports = router;