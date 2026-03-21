/**
 * fix_invitation_status.js
 * ─────────────────────────
 * 1. Normalizes all status values to lowercase (pending / accepted / rejected)
 * 2. Auto-accepts mutual pending invitations (both sides sent pending)
 * Run with: node fix_invitation_status.js
 */

require('dotenv').config();
const db = require('./src/config/db');

async function main() {
  console.log('=== Invitation Status Fix ===\n');

  // Step 1: Normalize to lowercase
  const [norm] = await db.execute(`
    UPDATE invitations
    SET status = LOWER(status)
    WHERE status != LOWER(status)
  `);
  console.log(`[NORMALIZE] ${norm.affectedRows} rows normalized to lowercase`);

  // Step 2: Find mutual pending pairs
  const [mutuals] = await db.execute(`
    SELECT a.id AS id_a, b.id AS id_b,
           a.sender_id, a.receiver_id
    FROM invitations a
    JOIN invitations b
      ON a.sender_id = b.receiver_id
     AND a.receiver_id = b.sender_id
    WHERE LOWER(a.status) = 'pending'
      AND LOWER(b.status) = 'pending'
      AND a.id < b.id
  `);

  console.log(`[MUTUAL] Found ${mutuals.length} mutual pending pair(s)`);

  for (const pair of mutuals) {
    await db.execute(
      "UPDATE invitations SET status = 'accepted' WHERE id IN (?, ?)",
      [pair.id_a, pair.id_b]
    );
    console.log(`[MUTUAL] Auto-accepted: invitation #${pair.id_a} (${pair.sender_id} -> ${pair.receiver_id}) & #${pair.id_b}`);
  }

  console.log('\n✅ Done!');
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
