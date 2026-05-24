const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./reviews.js");

const listingSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    // ✅ Single image rakho backward compatibility ke liye
    image: {
      filename: { type: String, default: "listingimage" },
      url: { type: String, default: "https://c.aiimagetovideo.com/img/fdd7f4ab8174.jpg" },
    },
    // ✅ Multiple images array
    images: [
      {
        filename: { type: String },
        url: { type: String },
      }
    ],
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price must be positive"],
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
    },
    country: {
      type: String,
      required: [true, "Country is required"],
      trim: true,
    },
    category: {
      type: String,
      enum: ["Beach", "Mountain", "City", "Countryside", "Desert", "Forest", "Lake", "Island"],
      default: "City",
    },
    geometry: {
      type: {
        type: String,
        enum: ["Point"],
      },
      coordinates: {
        type: [Number],
      },
    },
    reviews: [
      {
        type: Schema.Types.ObjectId,
        ref: "Review",
      },
    ],
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

listingSchema.post("findOneAndDelete", async (listing) => {
  if (listing) {
    await Review.deleteMany({ _id: { $in: listing.reviews } });
  }
});

module.exports = mongoose.model("Listing", listingSchema);