const db = require("./src/config/db");

async function runDiag() {
  try {
    console.log("--- DATABASE DIAGNOSTIC ---");

    console.log("\n[Checking Users Table]");
    const [userCols] = await db.execute("SHOW COLUMNS FROM users");
    console.table(userCols);

    console.log("\n[Checking Profiles Table]");
    const [profileCols] = await db.execute("SHOW COLUMNS FROM profiles");
    console.table(profileCols);

    console.log("\n[Checking Invitations Table]");
    const [invCols] = await db.execute("SHOW COLUMNS FROM invitations");
    console.table(invCols);

    const [userCount] = await db.execute("SELECT COUNT(*) as count FROM users");
    console.log("\nTotal Users:", userCount[0].count);

    const [profileCount] = await db.execute(
      "SELECT COUNT(*) as count FROM profiles",
    );
    console.log("Total Profiles:", profileCount[0].count);

    const [approvedProfiles] = await db.execute(
      "SELECT COUNT(*) as count FROM profiles WHERE status = 'Approved'",
    );
    console.log("Approved Profiles:", approvedProfiles[0].count);

    process.exit(0);
  } catch (error) {
    console.error("Diagnostic error:", error);
    process.exit(1);
  }
}

runDiag();
