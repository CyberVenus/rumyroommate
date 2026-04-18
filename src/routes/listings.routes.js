const express = require("express");
const { getListings } = require("../../mainpage/getListings");
const { getPool } = require("../config/db");
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

// POST /api/listings
router.post("/listings", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const userid = req.session.user.userid;
  const {
    address,
    campus = null,
    roomnumber = null,
    roomtype = null,
    numrooms = null,
    numroommates = null,
  } = req.body;

  if (!address) {
    return res.status(400).json({ error: "Address is required" });
  }

  let connection;
  try {
    connection = await getPool().getConnection();

    const [result] = await connection.query(
      `
      INSERT INTO createdroommatelistings
      (userid, preferenceids, createtime, address, campus, roomnumber, roomtype, numrooms, numroommates)
      VALUES (?, ?, CURDATE(), ?, ?, ?, ?, ?, ?)
      `,
      [
        userid,
        null,
        address,
        campus,
        roomnumber,
        roomtype,
        numrooms,
        numroommates,
      ],
    );

    return res.status(201).json({
      message: "Listing created successfully",
      postid: result.insertId,
    });
  } catch (error) {
    console.error("Create listing error:", error);
    return res.status(500).json({ error: "Failed to create listing" });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;
