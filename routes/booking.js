const express = require("express");
const router = express.Router();

const Booking = require("../models/booking");
const Listing = require("../models/listing");
const User = require("../models/user");

const { isLoggedIn } = require("../middleware");
const wrapAsync = require("../utils/wrapAsync");
const ExpressError = require("../utils/ExpressError");

const {
  sendBookingConfirmation,
  sendCancellationEmail
} = require("../utils/mailer");


// ================= CREATE BOOKING =================

router.post("/:listingId", isLoggedIn, wrapAsync(async (req, res) => {

  const { listingId } = req.params;
  const { checkIn, checkOut, guests } = req.body;

  const listing = await Listing.findById(listingId);

  if (!listing) {
    throw new ExpressError("Listing not found", 404);
  }

  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  const nights = Math.ceil(
    (checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)
  );

  if (nights <= 0) {
    req.flash("error", "Check-out date check-in se baad honi chahiye!");
    return res.redirect(`/listings/${listingId}`);
  }

  const totalPrice = nights * listing.price;

  const newBooking = new Booking({
    listing: listingId,
    user: req.user._id,
    checkIn: checkInDate,
    checkOut: checkOutDate,
    guests: guests || 1,
    totalPrice,
    status: "confirmed",
  });

  // Save booking
  await newBooking.save();

  // Send confirmation email
  try {
    const user = await User.findById(req.user._id);

    await sendBookingConfirmation(
      user.email,
      newBooking,
      listing
    );

    console.log("Confirmation email sent!");

  } catch (emailErr) {
    console.error("Email error:", emailErr.message);
  }

  req.flash(
    "success",
    `Booking confirmed! Confirmation email bhej diya gaya hai! 📧`
  );

  res.redirect("/bookings/my");

}));


// ================= MY BOOKINGS =================

router.get("/my", isLoggedIn, wrapAsync(async (req, res) => {

  const bookings = await Booking.find({
    user: req.user._id
  })
    .populate("listing")
    .sort({ createdAt: -1 });

  res.render("bookings/my-bookings", { bookings });

}));


// ================= CANCEL BOOKING =================

router.post("/:bookingId/cancel", isLoggedIn, wrapAsync(async (req, res) => {

  const booking = await Booking.findById(req.params.bookingId);

  if (!booking.user.equals(req.user._id)) {
    req.flash("error", "Ye tumhari booking nahi hai!");
    return res.redirect("/bookings/my");
  }

  booking.status = "cancelled";

  await booking.save();

  // Send cancellation email
  try {

    const user = await User.findById(req.user._id);

    const listing = await Listing.findById(booking.listing);

    await sendCancellationEmail(
      user.email,
      booking,
      listing
    );

    console.log("Cancellation email sent!");

  } catch (emailErr) {
    console.error("Email error:", emailErr.message);
  }

  req.flash(
    "success",
    "Booking cancelled! Email bhej diya gaya hai."
  );

  res.redirect("/bookings/my");

}));


module.exports = router;