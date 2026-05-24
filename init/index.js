const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");
const User = require("../models/user.js");

const MONGO_URI = "mongodb://127.0.0.1:27017/wanderlist";

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to DB");
}

const initDB = async () => {
  await Listing.deleteMany({});

  // Find an existing user to assign as owner
  const user = await User.findOne();

  if (!user) {
    console.log("No user found. Please create a user first.");
    return;
  }

  const sampleListings = initData.data.map((obj) => ({
    ...obj,
    owner: user._id,
  }));

  await Listing.insertMany(sampleListings);
  console.log("Database initialized with sample data");
};

main()
  .then(() => initDB())
  .catch((err) => console.log(err));