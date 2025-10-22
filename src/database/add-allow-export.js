const { db } = require('./init');

console.log('Adding allow_export column to share tables...');

try {
  // Add allow_export to set_shares table
  db.prepare(`
    ALTER TABLE set_shares ADD COLUMN allow_export INTEGER DEFAULT 1
  `).run();
  
  console.log('✓ Added allow_export to set_shares table');
  
  // Add allow_export to folder_shares table
  db.prepare(`
    ALTER TABLE folder_shares ADD COLUMN allow_export INTEGER DEFAULT 1
  `).run();
  
  console.log('✓ Added allow_export to folder_shares table');
  
  console.log('✓ Migration completed successfully!');
} catch (error) {
  if (error.message.includes('duplicate column name')) {
    console.log('✓ Columns already exist, skipping migration');
  } else {
    console.error('✗ Migration failed:', error.message);
    process.exit(1);
  }
}

process.exit(0);
