const express = require("express");
const router = express.Router();

// INDEX - all posts
router.get("/", (req, res) => {
  res.send("GET all posts");
});

// SHOW - single post
router.get("/:id", (req, res) => {
  res.send(`GET post with id ${req.params.id}`);
});

// CREATE - new post
router.post("/", (req, res) => {
  res.send("POST create new post");
});

// UPDATE - update post
router.put("/:id", (req, res) => {
  res.send(`PUT update post with id ${req.params.id}`);
});

// DELETE - delete post
router.delete("/:id", (req, res) => {
  res.send(`DELETE post with id ${req.params.id}`);
});

module.exports = router;
