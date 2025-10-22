const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../data/quizlet.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Migration function to add missing columns
const addMissingColumns = () => {
  console.log('Checking for missing columns...');
  
  try {
    // Check if must_change_password column exists
    const columnsCheck = db.prepare("PRAGMA table_info(users)").all();
    const columnNames = columnsCheck.map(col => col.name);
    
    console.log('Current columns:', columnNames);
    
    // Add must_change_password if not exists
    if (!columnNames.includes('must_change_password')) {
      console.log('Adding must_change_password column...');
      db.exec(`ALTER TABLE users ADD COLUMN must_change_password INTEGER DEFAULT 0`);
      console.log('✓ must_change_password column added');
    } else {
      console.log('✓ must_change_password column already exists');
    }
    
    // Add first_login if not exists
    if (!columnNames.includes('first_login')) {
      console.log('Adding first_login column...');
      db.exec(`ALTER TABLE users ADD COLUMN first_login INTEGER DEFAULT 1`);
      console.log('✓ first_login column added');
    } else {
      console.log('✓ first_login column already exists');
    }
    
    // Add mfa_secret if not exists
    if (!columnNames.includes('mfa_secret')) {
      console.log('Adding mfa_secret column...');
      db.exec(`ALTER TABLE users ADD COLUMN mfa_secret TEXT`);
      console.log('✓ mfa_secret column added');
    } else {
      console.log('✓ mfa_secret column already exists');
    }
    
    // Add mfa_enabled if not exists
    if (!columnNames.includes('mfa_enabled')) {
      console.log('Adding mfa_enabled column...');
      db.exec(`ALTER TABLE users ADD COLUMN mfa_enabled INTEGER DEFAULT 0`);
      console.log('✓ mfa_enabled column added');
    } else {
      console.log('✓ mfa_enabled column already exists');
    }
    
    console.log('\n✓ Migration completed successfully!');
    
    // Display final schema
    const finalColumns = db.prepare("PRAGMA table_info(users)").all();
    console.log('\nFinal users table schema:');
    finalColumns.forEach(col => {
      console.log(`  - ${col.name} (${col.type})`);
    });
    
  } catch (error) {
    console.error('✗ Migration failed:', error);
    throw error;
  }
};

// Run migration
if (require.main === module) {
  addMissingColumns();
  db.close();
  console.log('\nDatabase connection closed.');
}

module.exports = { addMissingColumns };
