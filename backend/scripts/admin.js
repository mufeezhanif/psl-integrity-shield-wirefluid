/**
 * PSL Integrity Shield — Admin Script
 *
 * Usage (from backend/ folder):
 *
 *   Start a match (Upcoming → Live):
 *     npx hardhat run scripts/admin.js --network wirefluid
 *     ACTION=start MATCH_ID=1 npx hardhat run scripts/admin.js --network wirefluid
 *
 *   End a match (Live → Completed):
 *     ACTION=end MATCH_ID=1 npx hardhat run scripts/admin.js --network wirefluid
 *
 *   Create a new match:
 *     ACTION=create MATCH_ID=4 TEAM1="Karachi Kings" TEAM2="Lahore Qalandars" npx hardhat run scripts/admin.js --network wirefluid
 *
 * Required: PRIVATE_KEY in .env (must be the deployer/owner wallet)
 */

const hre = require("hardhat");

// ── Deployed contract addresses ─────────────────────────────────────────────
const MATCH_ORACLE_ADDRESS = "0x787fbf712fc3BAEa7Bc2eC7cd9b7486A3332dbcE";

// ── Read action from environment ─────────────────────────────────────────────
const ACTION   = process.env.ACTION   || "start";   // start | end | create
const MATCH_ID = Number(process.env.MATCH_ID) || 1;
const TEAM1    = process.env.TEAM1    || "";
const TEAM2    = process.env.TEAM2    || "";

async function main() {
  const [owner] = await hre.ethers.getSigners();
  console.log(`Owner: ${owner.address}`);

  const MatchOracle = await hre.ethers.getContractFactory("MatchOracle");
  const oracle = MatchOracle.attach(MATCH_ORACLE_ADDRESS);

  // Show current match state before acting
  try {
    const m = await oracle.getMatch(MATCH_ID);
    const states = ["Upcoming", "Live", "Completed"];
    console.log(`Match #${MATCH_ID}: ${m[0]} vs ${m[1]} — currently ${states[Number(m[2])]}`);
  } catch {
    if (ACTION !== "create") {
      console.error(`Match #${MATCH_ID} does not exist. Use ACTION=create to create it.`);
      process.exit(1);
    }
  }

  if (ACTION === "start") {
    console.log(`\nStarting Match #${MATCH_ID} (Upcoming → Live)...`);
    const tx = await oracle.startMatch(MATCH_ID);
    console.log(`  Tx sent: ${tx.hash}`);
    await tx.wait();
    console.log(`  ✅ Match #${MATCH_ID} is now LIVE`);

  } else if (ACTION === "end") {
    console.log(`\nEnding Match #${MATCH_ID} (Live → Completed)...`);
    const tx = await oracle.endMatch(MATCH_ID);
    console.log(`  Tx sent: ${tx.hash}`);
    await tx.wait();
    console.log(`  ✅ Match #${MATCH_ID} is now COMPLETED`);

  } else if (ACTION === "create") {
    if (!TEAM1 || !TEAM2) {
      console.error("ERROR: TEAM1 and TEAM2 must be set for ACTION=create");
      console.error('Example: MATCH_ID=4 TEAM1="Karachi Kings" TEAM2="Lahore Qalandars" ACTION=create npx hardhat run scripts/admin.js --network wirefluid');
      process.exit(1);
    }
    console.log(`\nCreating Match #${MATCH_ID}: ${TEAM1} vs ${TEAM2}...`);
    const tx = await oracle.createMatch(MATCH_ID, TEAM1, TEAM2);
    console.log(`  Tx sent: ${tx.hash}`);
    await tx.wait();
    console.log(`  ✅ Match #${MATCH_ID} created (Upcoming)`);

  } else {
    console.error(`Unknown ACTION "${ACTION}". Use: start | end | create`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
