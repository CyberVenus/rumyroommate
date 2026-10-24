const { createApp } = require("../../app");
const { getPool } = require("../../src/config/db");
const { createAndLogin } = require("../helpers/auth.helper");
const { data, error } = require("../helpers/contract.helper");

const listing = {
  address: "1 College Ave", campus: "Busch", roomnumber: "101",
  roomtype: "Double", numrooms: 3, numroommates: 2,
};

async function listingRows() {
  const [rows] = await getPool().query("SELECT * FROM createdroommatelistings ORDER BY postid");
  return rows;
}

async function createListing(agent, payload = listing) {
  const created = data(await agent.post("/api/listings").send(payload), 201);
  expect(created).toEqual({ message: "Listing created successfully", postid: expect.any(Number) });
  expect(created.postid).toBeGreaterThan(0);
  return created.postid;
}

describe("PR-015 listings API", () => {
  let app;
  let owner;
  beforeEach(async () => {
    app = createApp();
    // Fixed identities and fresh sessions exercise the harness's per-test isolation.
    ({ agent: owner } = await createAndLogin(app, { netid: "owner@rutgers.edu" }));
  });

  it.each([
    ["all fields", { ...listing, address: " 1 College Ave ", campus: " Busch " }, listing],
    ["only address", { address: listing.address }, {
      address: listing.address, campus: null, roomnumber: null, roomtype: null,
      numrooms: null, numroommates: null,
    }],
    ["empty optional strings and zero/null counts", {
      address: listing.address, campus: "  ", roomnumber: "", roomtype: null,
      numrooms: 0, numroommates: null,
    }, {
      address: listing.address, campus: null, roomnumber: null, roomtype: null,
      numrooms: 0, numroommates: null,
    }],
  ])("creates and persists a listing with %s", async (_label, payload, expected) => {
    const { userid } = data(await owner.get("/api/me")).user;
    const postid = await createListing(owner, payload);
    const rows = await listingRows();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ postid, userid, preferenceids: null, ...expected });
    const visible = data(await owner.get("/api/listings"));
    expect(visible).toHaveLength(1);
    expect(visible[0]).toMatchObject({ postid, userid, ...expected });
  });

  it.each([
    ["missing address", { address: undefined }, "Address is required"],
    ["blank address", { address: "  " }, "Address is required"],
    ["non-string address", { address: 123 }, "Address is required"],
    ["invalid campus", { campus: 123 }, "campus must be a string or null"],
    ["invalid room number", { roomnumber: [] }, "roomnumber must be a string or null"],
    ["invalid room type", { roomtype: false }, "roomtype must be a string or null"],
    ["negative count", { numrooms: -1 }, "numrooms must be a non-negative integer or null"],
    ["fractional count", { numroommates: 1.5 }, "numroommates must be a non-negative integer or null"],
    ["numeric string", { numrooms: "3" }, "numrooms must be a non-negative integer or null"],
  ])("rejects creation with %s without changing stored listings", async (_label, overrides, message) => {
    await createListing(owner);
    const before = await listingRows();
    error(await owner.post("/api/listings").send({ ...listing, ...overrides }), 400, message);
    expect(await listingRows()).toEqual(before);
  });

  it("persists owner edits, preserves omitted fields, and leaves other listings unchanged", async () => {
    const postid = await createListing(owner);
    await createListing(owner, { ...listing, address: "2 College Ave" });
    const before = await listingRows();
    const patch = { address: " 3 College Ave ", campus: " Livingston ", numrooms: 0 };
    expect(data(await owner.patch(`/api/listings/${postid}`).send(patch))).toEqual({
      message: "Listing updated successfully", postid,
    });
    const expected = { ...before[0], address: "3 College Ave", campus: "Livingston", numrooms: 0 };
    expect(await listingRows()).toEqual([expected, before[1]]);
    expect(data(await owner.get("/api/listings"))).toEqual(expect.arrayContaining([
      expect.objectContaining({ ...listing, postid, address: "3 College Ave", campus: "Livingston", numrooms: 0 }),
    ]));

    expect(data(await owner.patch(`/api/listings/${postid}`).send({
      campus: "  ", roomnumber: null, roomtype: "", numrooms: null, numroommates: 0,
    }))).toEqual({ message: "Listing updated successfully", postid });
    expect(await listingRows()).toEqual([
      { ...expected, campus: null, roomnumber: null, roomtype: null, numrooms: null, numroommates: 0 },
      before[1],
    ]);
  });

  it.each([
    ["empty update", {}, "No editable fields provided"],
    ["unknown field", { userid: 999 }, "Unknown field: userid"],
    ["invalid field alongside a valid edit", { campus: "Livingston", numrooms: -1 }, "numrooms must be a non-negative integer or null"],
  ])("rejects an owner edit with %s without mutating the listing", async (_label, payload, message) => {
    const postid = await createListing(owner);
    const before = await listingRows();
    error(await owner.patch(`/api/listings/${postid}`).send(payload), 400, message);
    expect(await listingRows()).toEqual(before);
  });

  it.each(["patch", "delete"])("rejects non-owner %s with 403 and preserves both users' listings", async (method) => {
    const postid = await createListing(owner);
    const { agent: other } = await createAndLogin(app, { netid: "other@rutgers.edu" });
    await createListing(other, { ...listing, address: "2 College Ave" });
    const before = await listingRows();
    const request = other[method](`/api/listings/${postid}`);
    error(await (method === "patch" ? request.send({ address: "Unauthorized edit" }) : request), 403, "Forbidden");
    expect(await listingRows()).toEqual(before);
  });

  it("deletes only the owner's selected listing and returns 404 on a repeated delete", async () => {
    const postid = await createListing(owner);
    await createListing(owner, { ...listing, address: "2 College Ave" });
    const before = await listingRows();
    expect(data(await owner.delete(`/api/listings/${postid}`))).toEqual({
      message: "Listing deleted successfully", postid,
    });
    expect(await listingRows()).toEqual([before[1]]);
    const visible = data(await owner.get("/api/listings"));
    expect(visible.map((row) => row.postid)).toEqual([before[1].postid]);
    error(await owner.delete(`/api/listings/${postid}`), 404, "Listing not found");
    error(await owner.patch(`/api/listings/${postid}`).send({ campus: "Busch" }), 404, "Listing not found");
    expect(await listingRows()).toEqual([before[1]]);
  });

  it.each(["patch", "delete"])("returns 404 for %s of a missing listing without changing existing data", async (method) => {
    const postid = await createListing(owner);
    const before = await listingRows();
    const request = owner[method](`/api/listings/${postid + 1}`);
    error(await (method === "patch" ? request.send({ campus: "Busch" }) : request), 404, "Listing not found");
    expect(await listingRows()).toEqual(before);
  });
});
