const express = require("express");
// const { getListings } = require("../../mainpage/getListings");
const { getPool } = require("../config/db");

const router = express.Router();

const LISTING_FIELDS = [
  "address",
  "campus",
  "roomnumber",
  "roomtype",
  "numrooms",
  "numroommates",
];

function normalizeRequiredString(value, fieldLabel) {
  if (typeof value !== "string" || !value.trim()) {
    return { error: `${fieldLabel} is required` };
  }
  return { value: value.trim() };
}

function normalizeOptionalString(value, fieldName) {
  if (value === null) return { value: null };
  if (typeof value !== "string") {
    return { error: `${fieldName} must be a string or null` };
  }
  const trimmed = value.trim();
  return { value: trimmed === "" ? null : trimmed };
}

function normalizeOptionalNonNegativeInteger(value, fieldName) {
  if (value === null) return { value: null };
  if (!Number.isInteger(value) || value < 0) {
    return { error: `${fieldName} must be a non-negative integer or null` };
  }
  return { value };
}

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
  const addressResult = normalizeRequiredString(req.body.address, "Address");
  if (addressResult.error) {
    return res.status(400).json({ error: addressResult.error });
  }

  const campusResult = normalizeOptionalString(req.body.campus ?? null, "campus");
  if (campusResult.error) {
    return res.status(400).json({ error: campusResult.error });
  }

  const roomnumberResult = normalizeOptionalString(req.body.roomnumber ?? null, "roomnumber");
  if (roomnumberResult.error) {
    return res.status(400).json({ error: roomnumberResult.error });
  }

  const roomtypeResult = normalizeOptionalString(req.body.roomtype ?? null, "roomtype");
  if (roomtypeResult.error) {
    return res.status(400).json({ error: roomtypeResult.error });
  }

  const numroomsResult = normalizeOptionalNonNegativeInteger(req.body.numrooms ?? null, "numrooms");
  if (numroomsResult.error) {
    return res.status(400).json({ error: numroomsResult.error });
  }

  const numroommatesResult = normalizeOptionalNonNegativeInteger(
    req.body.numroommates ?? null,
    "numroommates",
  );
  if (numroommatesResult.error) {
    return res.status(400).json({ error: numroommatesResult.error });
  }

  const address = addressResult.value;
  const campus = campusResult.value;
  const roomnumber = roomnumberResult.value;
  const roomtype = roomtypeResult.value;
  const numrooms = numroomsResult.value;
  const numroommates = numroommatesResult.value;

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

// PATCH /api/listings/:postid
router.patch("/listings/:postid", async (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const userid = Number(req.session.user.userid);
  const postid = Number(req.params.postid);

  if (!Number.isInteger(postid) || postid <= 0) {
    return res.status(400).json({ error: "Invalid listing id" });
  }

  const requestFields = Object.keys(req.body || {});
  const unknownFields = requestFields.filter((field) => !LISTING_FIELDS.includes(field));
  if (unknownFields.length > 0) {
    return res.status(400).json({ error: `Unknown field: ${unknownFields[0]}` });
  }

  const updatePayload = {};
  for (const field of LISTING_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(req.body, field)) {
      updatePayload[field] = req.body[field];
    }
  }

  if (Object.keys(updatePayload).length === 0) {
    return res.status(400).json({ error: "No editable fields provided" });
  }

  if (Object.prototype.hasOwnProperty.call(updatePayload, "address")) {
    const addressResult = normalizeRequiredString(updatePayload.address, "Address");
    if (addressResult.error) {
      return res.status(400).json({ error: addressResult.error });
    }
    updatePayload.address = addressResult.value;
  }

  const nullableStringFields = ["campus", "roomnumber", "roomtype"];
  for (const field of nullableStringFields) {
    if (Object.prototype.hasOwnProperty.call(updatePayload, field)) {
      const stringResult = normalizeOptionalString(updatePayload[field], field);
      if (stringResult.error) {
        return res.status(400).json({ error: stringResult.error });
      }
      updatePayload[field] = stringResult.value;
    }
  }

  const numericFields = ["numrooms", "numroommates"];
  for (const field of numericFields) {
    if (Object.prototype.hasOwnProperty.call(updatePayload, field)) {
      const numericResult = normalizeOptionalNonNegativeInteger(updatePayload[field], field);
      if (numericResult.error) {
        return res.status(400).json({ error: numericResult.error });
      }
      updatePayload[field] = numericResult.value;
    }
  }

  let connection;
  try {
    connection = await getPool().getConnection();

    const [listingRows] = await connection.query(
      `SELECT userid FROM createdroommatelistings WHERE postid = ?`,
      [postid],
    );

    if (listingRows.length === 0) {
      return res.status(404).json({ error: "Listing not found" });
    }

    if (Number(listingRows[0].userid) !== userid) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const updateFields = Object.keys(updatePayload);
    const setClause = updateFields.map((field) => `${field} = ?`).join(", ");
    const values = updateFields.map((field) => updatePayload[field]);

    await connection.query(
      `UPDATE createdroommatelistings SET ${setClause} WHERE postid = ?`,
      [...values, postid],
    );

    return res.json({
      message: "Listing updated successfully",
      postid,
    });
  } catch (error) {
    console.error("Edit listing error:", error);
    return res.status(500).json({ error: "Failed to update listing" });
  } finally {
    if (connection) connection.release();
  }
});

// DELETE /api/listings/:postid
router.delete("/listings/:postid", async (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const userid = Number(req.session.user.userid);
  const postid = Number(req.params.postid);

  if (!Number.isInteger(postid) || postid <= 0) {
    return res.status(400).json({ error: "Invalid listing id" });
  }

  let connection;
  try {
    connection = await getPool().getConnection();

    const [listingRows] = await connection.query(
      `SELECT userid FROM createdroommatelistings WHERE postid = ?`,
      [postid],
    );

    if (listingRows.length === 0) {
      return res.status(404).json({ error: "Listing not found" });
    }

    if (Number(listingRows[0].userid) !== userid) {
      return res.status(403).json({ error: "Forbidden" });
    }

    await connection.query(
      `DELETE FROM createdroommatelistings WHERE postid = ?`,
      [postid],
    );

    return res.json({
      message: "Listing deleted successfully",
      postid,
    });
  } catch (error) {
    console.error("Delete listing error:", error);
    return res.status(500).json({ error: "Failed to delete listing" });
  } finally {
    if (connection) connection.release();
  }
});

// POST /api/listings/:postid/save
router.post("/listings/:postid/save", async (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const userid = req.session.user.userid;
  const postid = Number(req.params.postid);

  if (!Number.isInteger(postid) || postid <= 0) {
    return res.status(400).json({ error: "Invalid listing id" });
  }

  let connection;
  try {
    connection = await getPool().getConnection();

    // Optional: prevent saving your own listing
    const [ownerRows] = await connection.query(
      `SELECT userid FROM createdroommatelistings WHERE postid = ?`,
      [postid],
    );

    if (ownerRows.length === 0) {
      return res.status(404).json({ error: "Listing not found" });
    }

    if (Number(ownerRows[0].userid) === Number(userid)) {
      return res
        .status(400)
        .json({ error: "You cannot save your own listing" });
    }

    // Prevent duplicate saves
    const [existingRows] = await connection.query(
      `
      SELECT saveid
      FROM savedroommatelistings
      WHERE userid = ? AND postid = ?
      `,
      [userid, postid],
    );

    if (existingRows.length > 0) {
      return res.status(409).json({ error: "Listing already saved" });
    }

    const [result] = await connection.query(
      `
      INSERT INTO savedroommatelistings (userid, postid)
      VALUES (?, ?)
      `,
      [userid, postid],
    );

    return res.status(201).json({
      message: "Listing saved successfully",
      saveid: result.insertId,
    });
  } catch (error) {
    console.error("Save listing error:", error);
    return res.status(500).json({ error: "Failed to save listing" });
  } finally {
    if (connection) connection.release();
  }
});

// DELETE /api/listings/:postid/save
router.delete("/listings/:postid/save", async (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const userid = req.session.user.userid;
  const postid = Number(req.params.postid);

  if (!Number.isInteger(postid) || postid <= 0) {
    return res.status(400).json({ error: "Invalid listing id" });
  }

  let connection;
  try {
    connection = await getPool().getConnection();

    const [listingRows] = await connection.query(
      `SELECT postid FROM createdroommatelistings WHERE postid = ?`,
      [postid],
    );

    if (listingRows.length === 0) {
      return res.status(404).json({ error: "Listing not found" });
    }

    const [result] = await connection.query(
      `
      DELETE FROM savedroommatelistings
      WHERE userid = ? AND postid = ?
      `,
      [userid, postid],
    );

    if (result.affectedRows > 0) {
      return res.status(200).json({
        message: "Listing unsaved successfully",
      });
    }

    return res.status(200).json({
      message: "Listing already unsaved",
    });
  } catch (error) {
    console.error("Unsave listing error:", error);
    return res.status(500).json({ error: "Failed to unsave listing" });
  } finally {
    if (connection) connection.release();
  }
});

// GET /api/saved-listings
router.get("/saved-listings", async (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const userid = req.session.user.userid;

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
      FROM savedroommatelistings s
      JOIN createdroommatelistings l
        ON s.postid = l.postid
      JOIN useraccounts u
        ON l.userid = u.userid
      WHERE s.userid = ?
      ORDER BY s.saveid DESC
      `,
      [userid],
    );

    return res.json({
      message: rows.length === 0 ? "No saved listings found" : "Success",
      listings: rows,
    });
  } catch (error) {
    console.error("Get saved listings error:", error);
    return res.status(500).json({ error: "Failed to fetch saved listings" });
  } finally {
    if (connection) connection.release();
  }
});

// GET /api/saved-listing-ids
router.get("/saved-listing-ids", async (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const userid = req.session.user.userid;

  let connection;
  try {
    connection = await getPool().getConnection();

    const [rows] = await connection.query(
      `
      SELECT postid
      FROM savedroommatelistings
      WHERE userid = ?
      ORDER BY saveid DESC
      `,
      [userid],
    );

    return res.json({
      savedPostIds: rows.map((row) => Number(row.postid)),
    });
  } catch (error) {
    console.error("Get saved listing ids error:", error);
    return res.status(500).json({ error: "Failed to fetch saved listing ids" });
  } finally {
    if (connection) connection.release();
  }
});
module.exports = router;
