const { db } = require('./init');

console.log('Adding allow_export column to sets and folders tables...');

try {
  // Add allow_export to sets table
  db.prepare(`
    ALTER TABLE sets ADD COLUMN allow_export INTEGER DEFAULT 1
  `).run();
  
  console.log('✓ Added allow_export to sets table');
  
  // Add allow_export to folders table
  db.prepare(`
    ALTER TABLE folders ADD COLUMN allow_export INTEGER DEFAULT 1
  `).run();
  
  console.log('✓ Added allow_export to folders table');
  
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
