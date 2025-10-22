const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../data/quizlet.db');
const db = new Database(dbPath);

// Fix all non-admin users - set first_login to 0 if they don't have MFA
console.log('Fixing non-admin users first_login flag...\n');

try {
  // Get all non-admin users
  const users = db.prepare('SELECT * FROM users WHERE is_admin = 0').all();
  
  console.log(`Found ${users.length} non-admin user(s):\n`);
  
  users.forEach(user => {
    console.log(`User: ${user.username}`);
    console.log(`  - first_login: ${user.first_login}`);
    console.log(`  - mfa_enabled: ${user.mfa_enabled}`);
    console.log(`  - must_change_password: ${user.must_change_password}`);
    
    // Set first_login to 0 for non-admin users
    // They don't need to be forced into MFA setup
    if (user.first_login === 1) {
      db.prepare('UPDATE users SET first_login = 0 WHERE id = ?').run(user.id);
      console.log(`  ✓ Updated first_login to 0`);
    } else {
      console.log(`  - No update needed`);
    }
    console.log('');
  });
  
  console.log('✓ All non-admin users updated successfully!');
  
} catch (error) {
  console.error('✗ Error:', error);
  process.exit(1);
}

db.close();
console.log('\n✓ Done!');
