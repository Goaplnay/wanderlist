require("dotenv").config();

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");

const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const flash = require("connect-flash");

const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const User = require("./models/user.js");

// Routers
const listingsRouter = require("./routes/listing.js");
const reviewsRouter = require("./routes/review.js");
const usersRouter = require("./routes/user.js");
const chatbotRouter = require("./routes/chatbot.js");
const adminRouter = require("./routes/admin.js");
const bookingRouter = require("./routes/booking.js");

// ======================
// DATABASE
// ======================
mongoose
  .connect("mongodb://127.0.0.1:27017/wanderlist")
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log("MongoDB connection error:", err));

// ======================
// APP CONFIG
// ======================
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

// ======================
// SESSION
// ======================
const sessionOptions = {
  secret: process.env.SESSION_SECRET || "mysupersecretcode",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
};

app.use(session(sessionOptions));
app.use(flash());

// ======================
// PASSPORT CONFIG
// ======================
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// ======================
// GLOBAL LOCALS
// ======================
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currentUser = req.user;
  next();
});

// ======================
// ROUTES
// ======================
app.get("/", (req, res) => res.redirect("/listings"));
app.use("/chatbot", chatbotRouter);
app.use("/admin", adminRouter);
app.use("/bookings", bookingRouter);
app.use("/listings", listingsRouter);
app.use("/listings/:id/reviews", reviewsRouter);
app.use("/", usersRouter);

// ======================
// 404 HANDLER
// ======================
app.use((req, res, next) => {
  next(new ExpressError("Page Not Found", 404));
});

// ======================
// ERROR HANDLER
// ======================
app.use((err, req, res, next) => {
  const { statusCode = 500, message = "Something went wrong" } = err;
  res.status(statusCode).render("error", { message });
});

// ======================
// SERVER
// ======================
app.listen(8080, () => {
  console.log("Server is listening on port 8080");
});