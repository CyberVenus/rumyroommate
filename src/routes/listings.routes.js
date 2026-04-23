const express = require("express");
// const { getListings } = require("../../mainpage/getListings");
const { getPool } = require("../config/db");

const router = express.Router();

// GET /api/listings
router.get("/listings", async (req, res) => {
  let connection;

  try {
    connection = await getPool().getConnection();

    const [rows] = await connection.query(
      `
      SELECT
        l.postid,
        l.userid,
        l.createtime,
        l.address,
        l.campus,
        l.roomnumber,
        l.roomtype,
        l.numrooms,
        l.numroommates,
        u.realname,
        u.netid,
        u.major
      FROM createdroommatelistings l
      JOIN useraccounts u
        ON l.userid = u.userid
      ORDER BY l.postid DESC
      `,
    );

    return res.json(rows);
  } catch (error) {
    console.error("Get listings error:", error);
    return res.status(500).json({ error: "Failed to fetch listings" });
  } finally {
    if (connection) connection.release();
  }
});

// POST /api/listings
router.post("/listings", async (req, res) => {
  if (!req.session || !req.session.user) {
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
