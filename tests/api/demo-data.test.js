const { createApp } = require("../../app");
const { getPool } = require("../../src/config/db");
const { seedDemo, users, password } = require("../../scripts/demo-data");
const { loginAs, createAndLogin } = require("../helpers/auth.helper");
const { data, error } = require("../helpers/contract.helper");

describe("PR-017 demo data", () => {
  it("supports login, browse, owner edit, non-owner rejection, save/unsave, deletion cleanup and logout", async () => {
    const seeded = await seedDemo(getPool());
    const app = createApp();
    const [owner, reader, other] = await Promise.all(users.map((u) => loginAs(app, { netid: u.netid, password })));
    const [postid, otherPost] = seeded.listings;
    await owner.get("/dashboard").expect(200);
    expect(data(await owner.get("/api/user-data")).roommatePreferences.roombudget).toBe(900);
    expect(data(await reader.get("/api/listings"))).toHaveLength(2);
    error(await reader.patch(`/api/listings/${postid}`).send({ address: "Forbidden edit" }), 403);
    error(await reader.delete(`/api/listings/${postid}`), 403);
    data(await owner.patch(`/api/listings/${postid}`).send({ address: "Edited demo address" }));
    expect(data(await owner.get("/api/listings")).find((p) => p.postid === postid).address).toBe("Edited demo address");
    data(await reader.delete(`/api/listings/${postid}/save`));
    expect(data(await reader.get("/api/saved-listing-ids")).savedPostIds).toEqual([]);
    data(await reader.post(`/api/listings/${postid}/save`), 201);
    const created = data(await owner.post("/api/listings").send({ address: "New demo listing" }), 201);
    data(await owner.delete(`/api/listings/${created.postid}`));
    data(await owner.delete(`/api/listings/${postid}`));
    expect(data(await reader.get("/api/saved-listings")).listings).toEqual([]);
    expect(data(await other.get("/api/saved-listing-ids")).savedPostIds).toEqual([otherPost]);
    const [rows] = await getPool().query("SELECT * FROM savedroommatelistings WHERE postid = ?", [postid]);
    expect(rows).toEqual([]);
    data(await owner.post("/api/logout"));
    error(await owner.get("/api/me"), 401);
  });

  it("resets repeatedly after demo edits while preserving unrelated users, listings and saves", async () => {
    const pool = getPool();
    const app = createApp();
    const { agent } = await createAndLogin(app, { netid: "real@rutgers.edu" });
    const unrelated = data(await agent.post("/api/listings").send({ address: "Keep me" }), 201).postid;
    const { agent: unrelatedReader } = await createAndLogin(app, { netid: "keep@rutgers.edu" });
    data(await unrelatedReader.post(`/api/listings/${unrelated}/save`), 201);
    const [unrelatedSaves] = await pool.query("SELECT userid, postid FROM savedroommatelistings ORDER BY saveid");
    let seeded = await seedDemo(pool);
    await expect(seedDemo(pool)).rejects.toThrow("already exist");
    for (let run = 0; run < 2; run++) {
      const demo = await loginAs(app, { netid: users[0].netid, password });
      data(await demo.post("/api/listings").send({ address: "Extra demo listing" }), 201);
      data(await agent.post(`/api/listings/${seeded.listings[0]}/save`), 201);
      await pool.query("INSERT INTO matchnotifications (notificationid, userid, postid) VALUES (1, ?, ?)", [seeded.users[0], unrelated]);
      seeded = await seedDemo(pool, { reset: true });
      const [accounts] = await pool.query("SELECT netid FROM useraccounts");
      expect(accounts).toHaveLength(5);
      const [posts] = await pool.query("SELECT postid FROM createdroommatelistings");
      expect(posts.map((p) => p.postid).sort()).toEqual([unrelated, ...seeded.listings].sort());
      const [saves] = await pool.query("SELECT userid, postid FROM savedroommatelistings ORDER BY saveid");
      expect(saves).toEqual([
        ...unrelatedSaves,
        { userid: seeded.users[1], postid: seeded.listings[0] },
        { userid: seeded.users[2], postid: seeded.listings[0] },
        { userid: seeded.users[2], postid: seeded.listings[1] },
      ]);
      expect(data(await agent.get("/api/listings")).find((p) => p.postid === unrelated).address).toBe("Keep me");
    }
  });

  it("runs the documented CLI seed/reset and rejects accidental reseeding or unknown arguments", () => {
    const { spawnSync } = require("child_process");
    const run = (args = [], env = process.env) => spawnSync(process.execPath, ["scripts/demo-data.js", ...args], {
      env, encoding: "utf8", timeout: 15000, windowsHide: true,
    });
    const seeded = run();
    expect(seeded.stderr).not.toContain("Demo setup failed");
    expect(seeded.status).toBe(0);
    expect(seeded.stdout).toContain("3 users, 2 listings, 3 saves");
    expect(run().status).toBe(1);
    expect(run(["--reset"]).status).toBe(0);
    expect(run(["--typo"]).status).toBe(1);
    const production = run(["--reset"], { ...process.env, NODE_ENV: "production" });
    expect(production.status).toBe(1);
    expect(production.stderr).toContain("disabled in production");
  });

  it("rolls back reset on an insertion failure and refuses production before connecting", async () => {
    const pool = getPool();
    await seedDemo(pool);
    const [before] = await pool.query("SELECT * FROM useraccounts ORDER BY userid");
    const [savesBefore] = await pool.query("SELECT * FROM savedroommatelistings ORDER BY saveid");
    const conn = await pool.getConnection();
    const failingPool = { getConnection: async () => ({
      beginTransaction: () => conn.beginTransaction(),
      rollback: () => conn.rollback(),
      release: () => conn.release(),
      query: (sql, args) => {
        if (sql.startsWith("INSERT INTO useraccounts")) throw new Error("Injected insertion failure");
        return conn.query(sql, args);
      },
    }) };
    await expect(seedDemo(failingPool, { reset: true })).rejects.toThrow("Injected insertion failure");
    expect((await pool.query("SELECT * FROM useraccounts ORDER BY userid"))[0]).toEqual(before);
    expect((await pool.query("SELECT * FROM savedroommatelistings ORDER BY saveid"))[0]).toEqual(savesBefore);
    await expect(seedDemo(null, { environment: "production" })).rejects.toThrow("disabled in production");
  });
});
