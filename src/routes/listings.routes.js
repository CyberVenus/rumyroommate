const express = require("express");
const { getListings } = require("../../mainpage/getListings");
// or wherever you moved it

const router = express.Router();

// GET /api/listings
router.get("/listings", async (req, res) => {
  try {
    const listings = await getListings();
    return res.json(listings);
  } catch (e) {
    console.error("Get listings error:", e);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
