const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../data/quizlet.db');
const db = new Database(dbPath);

// Fix admin user first_login flag
console.log('Fixing admin user first_login flag...');

try {
  // Check current admin status
  const admin = db.prepare('SELECT * FROM users WHERE username = ?').get('admin');
  
  if (!admin) {
    console.log('✗ Admin user not found!');
    process.exit(1);
  }
  
  console.log('\nCurrent admin user status:');
  console.log('  - first_login:', admin.first_login);
  console.log('  - must_change_password:', admin.must_change_password);
  console.log('  - mfa_enabled:', admin.mfa_enabled);
  
  // Update first_login to 0 for admin
  db.prepare('UPDATE users SET first_login = 0, must_change_password = 0 WHERE username = ?')
    .run('admin');
  
  console.log('\n✓ Admin user updated successfully!');
  
  // Verify update
  const updatedAdmin = db.prepare('SELECT * FROM users WHERE username = ?').get('admin');
  console.log('\nUpdated admin user status:');
  console.log('  - first_login:', updatedAdmin.first_login);
  console.log('  - must_change_password:', updatedAdmin.must_change_password);
  console.log('  - mfa_enabled:', updatedAdmin.mfa_enabled);
  
} catch (error) {
  console.error('✗ Error:', error);
  process.exit(1);
}

db.close();
console.log('\n✓ Done!');
