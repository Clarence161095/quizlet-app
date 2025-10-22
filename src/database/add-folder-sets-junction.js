const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../data/quizlet.db');
const db = new Database(dbPath);

db.pragma('foreign_keys = ON');

console.log('🔄 Starting folder-sets many-to-many migration...\n');

try {
  // Step 1: Create junction table for many-to-many relationship
  console.log('📋 Creating folder_sets junction table...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS folder_sets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      folder_id INTEGER NOT NULL,
      set_id INTEGER NOT NULL,
      added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE,
      FOREIGN KEY (set_id) REFERENCES sets(id) ON DELETE CASCADE,
      UNIQUE(folder_id, set_id)
    )
  `);
  console.log('✓ folder_sets table created\n');

  // Step 2: Migrate existing data from sets.folder_id to folder_sets
  console.log('📦 Migrating existing folder-set relationships...');
  const existingSets = db.prepare('SELECT id, folder_id FROM sets WHERE folder_id IS NOT NULL').all();
  
  if (existingSets.length > 0) {
    const insertStmt = db.prepare('INSERT OR IGNORE INTO folder_sets (folder_id, set_id) VALUES (?, ?)');
    const insertMany = db.transaction((sets) => {
      for (const set of sets) {
        insertStmt.run(set.folder_id, set.id);
      }
    });
    insertMany(existingSets);
    console.log(`✓ Migrated ${existingSets.length} existing relationships\n`);
  } else {
    console.log('✓ No existing relationships to migrate\n');
  }

  // Step 3: Check if folder_id column exists in sets table
  console.log('🔍 Checking sets table structure...');
  const tableInfo = db.prepare('PRAGMA table_info(sets)').all();
  const hasFolderId = tableInfo.some(col => col.name === 'folder_id');
  
  if (hasFolderId) {
    console.log('⚠️  folder_id column still exists in sets table');
    console.log('⚠️  This is OK - we keep it for backward compatibility');
    console.log('⚠️  New code should use folder_sets junction table instead\n');
  }

  // Step 4: Add allow_export column if not exists (from previous migration)
  console.log('🔍 Checking for allow_export columns...');
  const setsColumns = db.prepare('PRAGMA table_info(sets)').all();
  const hasSetExport = setsColumns.some(col => col.name === 'allow_export');
  
  if (!hasSetExport) {
    console.log('📋 Adding allow_export to sets table...');
    db.exec('ALTER TABLE sets ADD COLUMN allow_export INTEGER DEFAULT 1');
    console.log('✓ allow_export added to sets\n');
  } else {
    console.log('✓ allow_export already exists in sets\n');
  }

  const foldersColumns = db.prepare('PRAGMA table_info(folders)').all();
  const hasFolderExport = foldersColumns.some(col => col.name === 'allow_export');
  
  if (!hasFolderExport) {
    console.log('📋 Adding allow_export to folders table...');
    db.exec('ALTER TABLE folders ADD COLUMN allow_export INTEGER DEFAULT 1');
    console.log('✓ allow_export added to folders\n');
  } else {
    console.log('✓ allow_export already exists in folders\n');
  }

  // Step 5: Add source tracking columns if not exists
  console.log('🔍 Checking for source tracking columns...');
  const hasSetSource = setsColumns.some(col => col.name === 'source_set_id');
  const hasFolderSource = foldersColumns.some(col => col.name === 'source_folder_id');
  
  if (!hasSetSource) {
    console.log('📋 Adding source_set_id to sets table...');
    db.exec('ALTER TABLE sets ADD COLUMN source_set_id INTEGER REFERENCES sets(id) ON DELETE SET NULL');
    console.log('✓ source_set_id added to sets\n');
  } else {
    console.log('✓ source_set_id already exists in sets\n');
  }

  if (!hasFolderSource) {
    console.log('📋 Adding source_folder_id to folders table...');
    db.exec('ALTER TABLE folders ADD COLUMN source_folder_id INTEGER REFERENCES folders(id) ON DELETE SET NULL');
    console.log('✓ source_folder_id added to folders\n');
  } else {
    console.log('✓ source_folder_id already exists in folders\n');
  }

  // Step 6: Add allow_export to share tables if not exists
  console.log('🔍 Checking share tables...');
  const setSharesColumns = db.prepare('PRAGMA table_info(set_shares)').all();
  const hasSetShareExport = setSharesColumns.some(col => col.name === 'allow_export');
  
  if (!hasSetShareExport) {
    console.log('📋 Adding allow_export to set_shares table...');
    db.exec('ALTER TABLE set_shares ADD COLUMN allow_export INTEGER DEFAULT 1');
    console.log('✓ allow_export added to set_shares\n');
  } else {
    console.log('✓ allow_export already exists in set_shares\n');
  }

  const folderSharesColumns = db.prepare('PRAGMA table_info(folder_shares)').all();
  const hasFolderShareExport = folderSharesColumns.some(col => col.name === 'allow_export');
  
  if (!hasFolderShareExport) {
    console.log('📋 Adding allow_export to folder_shares table...');
    db.exec('ALTER TABLE folder_shares ADD COLUMN allow_export INTEGER DEFAULT 1');
    console.log('✓ allow_export added to folder_shares\n');
  } else {
    console.log('✓ allow_export already exists in folder_shares\n');
  }

  console.log('✅ Migration completed successfully!');
  console.log('\n📝 Summary:');
  console.log('   - folder_sets junction table created (many-to-many)');
  console.log('   - Existing relationships migrated');
  console.log('   - sets.folder_id kept for backward compatibility');
  console.log('   - All export and source tracking columns verified');
  console.log('\n💡 Next steps:');
  console.log('   - Update Folder model to use folder_sets junction table');
  console.log('   - Update Set model to support multiple folders');
  console.log('   - Update views to allow adding sets to multiple folders');

} catch (error) {
  console.error('❌ Migration failed:', error);
  throw error;
} finally {
  db.close();
}
