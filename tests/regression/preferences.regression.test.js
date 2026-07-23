const { createApp } = require("../../app");
const { getPool } = require("../../src/config/db");
const { createAndLogin } = require("../helpers/auth.helper");

describe("registration and preferences regression coverage", () => {
  it("registration creates preference and habit rows", async () => {
    const app = createApp();
    const { netid } = await createAndLogin(app);

    const [[user]] = await getPool().query(
      "SELECT userid FROM useraccounts WHERE netid = ?",
      [netid],
    );

    const [preferenceRows] = await getPool().query(
      "SELECT userid FROM userpreferences WHERE userid = ?",
      [user.userid],
    );
    const [habitRows] = await getPool().query(
      "SELECT userid FROM userhabits WHERE userid = ?",
      [user.userid],
    );

    expect(preferenceRows).toHaveLength(1);
    expect(habitRows).toHaveLength(1);
  });

  it("updates preferences and returns updated values from user data", async () => {
    const app = createApp();
    const { agent } = await createAndLogin(app);

    await agent
      .post("/api/update-preferences")
      .send({
        personal: {
          gender: "Female",
          ethnicity: "Asian",
          religion: "None",
          major: "Computer Science",
        },
        habits: {
          cleanliness: 8,
          noisetolerance: 4,
          sleephabits: "Night Owl",
          sleepstarttime: "01:00:00",
          sleependtime: "09:00:00",
          studystarttime: "19:00:00",
          studyendtime: "22:00:00",
          sharedstarttime: "18:00:00",
          sharedendtime: "20:00:00",
          smoking: "N",
          drinking: "Y",
        },
        roommatePreferences: {
          prefgender: "Any",
          prefrace: "Any",
          prefreligion: "Any",
          prefmajor: "Engineering",
          prefsmoking: "N",
          prefdrinking: "D",
          roombudget: 1200,
          preflowtemp: 68,
          prefhightemp: 74,
          prefguestfreq: 3,
        },
      })
      .expect(200)
      .expect({ message: "Preferences updated successfully." });

    const response = await agent.get("/api/user-data").expect(200);

    expect(response.body.personal).toMatchObject({
      gender: "Female",
      ethnicity: "Asian",
      religion: "None",
      major: "Computer Science",
    });
    expect(response.body.habits).toMatchObject({
      cleanliness: 8,
      noisetolerance: 4,
      sleephabits: "Night Owl",
      smoking: "N",
      drinking: "Y",
    });
    expect(response.body.roommatePreferences).toMatchObject({
      prefgender: "Any",
      prefrace: "Any",
      prefreligion: "Any",
      prefmajor: "Engineering",
      prefsmoking: "N",
      prefdrinking: "D",
      roombudget: 1200,
      preflowtemp: 68,
      prefhightemp: 74,
      prefguestfreq: 3,
    });
  });
});
