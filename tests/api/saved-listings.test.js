const { createApp } = require("../../app");
const { getPool } = require("../../src/config/db");
const { createAndLogin } = require("../helpers/auth.helper");
const { data, error } = require("../helpers/contract.helper");

async function savedRows() {
  const [rows] = await getPool().query("SELECT * FROM savedroommatelistings ORDER BY saveid");
  return rows;
}

async function save(agent, postid) {
  const result = data(await agent.post(`/api/listings/${postid}/save`), 201);
  expect(result).toEqual({ message: "Listing saved successfully", saveid: expect.any(Number) });
  expect(result.saveid).toBeGreaterThan(0);
  return result.saveid;
}

async function expectSaved(agent, postids) {
  const result = data(await agent.get("/api/saved-listings"));
  expect(result.message).toBe(postids.length ? "Success" : "No saved listings found");
  expect(result.listings.map((listing) => listing.postid)).toEqual(postids);
  expect(data(await agent.get("/api/saved-listing-ids"))).toEqual({ savedPostIds: postids });
}

describe("PR-016 saved listings API", () => {
  let owner;
  let reader;
  let other;
  let postid;
  let readerId;

  beforeEach(async () => {
    const app = createApp();
    ({ agent: owner } = await createAndLogin(app, { netid: "owner@rutgers.edu" }));
    ({ agent: reader } = await createAndLogin(app, { netid: "reader@rutgers.edu" }));
    ({ agent: other } = await createAndLogin(app, { netid: "other@rutgers.edu" }));
    readerId = data(await reader.get("/api/me")).user.userid;
    postid = data(await owner.post("/api/listings").send({ address: "1 College Ave" }), 201).postid;
  });

  it("persists saves and returns only the session user's listings, newest save first", async () => {
    await expectSaved(reader, []);
    const firstSave = await save(reader, postid);
    const secondPost = data(await owner.post("/api/listings").send({ address: "2 College Ave" }), 201).postid;
    const secondSave = await save(reader, secondPost);
    expect(await savedRows()).toEqual([
      expect.objectContaining({ saveid: firstSave, userid: readerId, postid }),
      expect.objectContaining({ saveid: secondSave, userid: readerId, postid: secondPost }),
    ]);
    await expectSaved(reader, [secondPost, postid]);
    await expectSaved(other, []);
    await expectSaved(owner, []);
  });

  it("rejects duplicate saves with 409 without inserting or changing rows", async () => {
    await save(reader, postid);
    const before = await savedRows();
    error(await reader.post(`/api/listings/${postid}/save`), 409, "Listing already saved");
    expect(await savedRows()).toEqual(before);
    await expectSaved(reader, [postid]);
  });

  it("rejects self-save with 400 and preserves another user's save", async () => {
    await save(reader, postid);
    const before = await savedRows();
    error(await owner.post(`/api/listings/${postid}/save`), 400, "You cannot save your own listing");
    expect(await savedRows()).toEqual(before);
    await expectSaved(owner, []);
    await expectSaved(reader, [postid]);
  });

  it("unsaves only the selected user/listing pair, remains idempotent, and permits saving again", async () => {
    await save(reader, postid);
    await save(other, postid);
    const secondPost = data(await owner.post("/api/listings").send({ address: "2 College Ave" }), 201).postid;
    await save(reader, secondPost);
    const before = await savedRows();
    const remaining = before.filter((row) => !(row.userid === readerId && row.postid === postid));
    expect(data(await reader.delete(`/api/listings/${postid}/save`))).toEqual({ message: "Listing unsaved successfully" });
    expect(await savedRows()).toEqual(remaining);
    await expectSaved(reader, [secondPost]);
    await expectSaved(other, [postid]);
    expect(data(await reader.delete(`/api/listings/${postid}/save`))).toEqual({ message: "Listing already unsaved" });
    expect(await savedRows()).toEqual(remaining);
    await expectSaved(reader, [secondPost]);
    const saveid = await save(reader, postid);
    expect(await savedRows()).toEqual([...remaining, expect.objectContaining({ saveid, userid: readerId, postid })]);
    await expectSaved(reader, [postid, secondPost]);
  });

  it("deleting a saved listing removes every user's dependent rows and preserves unrelated saves", async () => {
    await save(reader, postid);
    await save(other, postid);
    const secondPost = data(await owner.post("/api/listings").send({ address: "2 College Ave" }), 201).postid;
    await save(reader, secondPost);
    const before = await savedRows();
    expect(before.filter((row) => row.postid === postid)).toHaveLength(2);
    await expectSaved(reader, [secondPost, postid]);
    await expectSaved(other, [postid]);

    expect(data(await owner.delete(`/api/listings/${postid}`))).toEqual({ message: "Listing deleted successfully", postid });
    // Assert physical cleanup: an inner join alone could hide orphaned saved rows.
    expect(await savedRows()).toEqual(before.filter((row) => row.postid !== postid));
    const [deletedRows] = await getPool().query("SELECT postid FROM createdroommatelistings WHERE postid = ?", [postid]);
    expect(deletedRows).toEqual([]);
    await expectSaved(reader, [secondPost]);
    await expectSaved(other, []);
    expect(data(await owner.get("/api/listings")).map((row) => row.postid)).toEqual([secondPost]);
    error(await reader.post(`/api/listings/${postid}/save`), 404, "Listing not found");
    error(await reader.delete(`/api/listings/${postid}/save`), 404, "Listing not found");
    expect(await savedRows()).toEqual(before.filter((row) => row.postid !== postid));
  });
});
