const { db } = require('./init');

console.log('Adding source tracking columns to sets and folders tables...');

try {
  // Add source_set_id to sets table
  db.prepare(`
    ALTER TABLE sets ADD COLUMN source_set_id INTEGER DEFAULT NULL
  `).run();
  
  console.log('✓ Added source_set_id to sets table');
  
  // Add source_folder_id to folders table
  db.prepare(`
    ALTER TABLE folders ADD COLUMN source_folder_id INTEGER DEFAULT NULL
  `).run();
  
  console.log('✓ Added source_folder_id to folders table');
  
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
