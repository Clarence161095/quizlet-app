#!/usr/bin/env node

/**
 * Qi Learning App - Data Migration Script
 * SQLite → PostgreSQL
 * 
 * Usage:
 *   node migrate-sqlite-to-postgres.js <path-to-sqlite-db> <postgres-connection-string>
 * 
 * Example:
 *   node migrate-sqlite-to-postgres.js /path/to/quizlet.db "postgresql://qi_user:qi_password_2024@localhost:5432/qi_learning_db"
 */

const Database = require('better-sqlite3');
const { Client } = require('pg');
const path = require('path');

// Parse command line arguments
const sqlitePath = process.argv[2] || path.join(__dirname, '../../version_1.0/data/quizlet.db');
const pgConnectionString = process.argv[3] || process.env.DATABASE_URL;

if (!pgConnectionString) {
  console.error('❌ PostgreSQL connection string required!');
  console.error('Usage: node migrate-sqlite-to-postgres.js <sqlite-path> <postgres-connection-string>');
  process.exit(1);
}

console.log('🚀 Starting migration from SQLite to PostgreSQL...\n');
console.log(`📁 SQLite Database: ${sqlitePath}`);
console.log(`🐘 PostgreSQL: ${pgConnectionString.replace(/:[^:]*@/, ':****@')}\n`);

// Connect to SQLite
let sqliteDb;
try {
  sqliteDb = new Database(sqlitePath, { readonly: true });
  console.log('✅ Connected to SQLite database');
} catch (error) {
  console.error('❌ Failed to connect to SQLite:', error.message);
  process.exit(1);
}

// Connect to PostgreSQL
const pgClient = new Client({ connectionString: pgConnectionString });

async function migrate() {
  try {
    await pgClient.connect();
    console.log('✅ Connected to PostgreSQL database\n');

    // Migration order (respecting foreign key constraints)
    const tables = [
      'users',
      'folders',
      'sets',
      'flashcards',
      'user_notes',
      'learning_progress',
      'study_sessions',
      'study_answers',
      'folder_sets',
      'set_shares',
      'folder_shares'
    ];

    let totalRecords = 0;

    for (const table of tables) {
      console.log(`📊 Migrating table: ${table}...`);
      
      // Get all rows from SQLite
      const rows = sqliteDb.prepare(`SELECT * FROM ${table}`).all();
      
      if (rows.length === 0) {
        console.log(`   ⚠️  No data in ${table}`);
        continue;
      }

      // Get column names
      const columns = Object.keys(rows[0]);
      
      // Prepare PostgreSQL INSERT statement
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
      const insertQuery = `
        INSERT INTO ${table} (${columns.join(', ')})
        VALUES (${placeholders})
        ON CONFLICT DO NOTHING
      `;

      // Insert rows one by one
      let inserted = 0;
      for (const row of rows) {
        const values = columns.map(col => {
          let value = row[col];
          
          // Convert SQLite DATETIME strings to PostgreSQL timestamps
          if (col.includes('_at') || col.includes('_date')) {
            if (value && typeof value === 'string') {
              // SQLite stores as ISO string, PostgreSQL can parse it
              return value;
            }
          }
          
          // Handle NULL values
          if (value === null) return null;
          
          // Convert boolean-like integers (0/1) to smallint for PostgreSQL
          if (typeof value === 'number' && (col.includes('is_') || col.includes('allow_'))) {
            return value;
          }
          
          return value;
        });

        try {
          await pgClient.query(insertQuery, values);
          inserted++;
        } catch (error) {
          console.error(`   ❌ Error inserting into ${table}:`, error.message);
          console.error('   Row:', row);
        }
      }

      console.log(`   ✅ Migrated ${inserted}/${rows.length} records`);
      totalRecords += inserted;

      // Update sequence for auto-increment columns
      if (inserted > 0) {
        const maxIdQuery = `SELECT setval(pg_get_serial_sequence('${table}', 'id'), (SELECT MAX(id) FROM ${table}))`;
        await pgClient.query(maxIdQuery);
      }
    }

    console.log(`\n✨ Migration completed successfully!`);
    console.log(`📈 Total records migrated: ${totalRecords}`);

    // Verify migration
    console.log('\n🔍 Verifying migration...');
    for (const table of tables) {
      const sqliteCount = sqliteDb.prepare(`SELECT COUNT(*) as count FROM ${table}`).get().count;
      const pgResult = await pgClient.query(`SELECT COUNT(*) as count FROM ${table}`);
      const pgCount = parseInt(pgResult.rows[0].count);

      if (sqliteCount === pgCount) {
        console.log(`   ✅ ${table}: ${pgCount} records`);
      } else {
        console.log(`   ⚠️  ${table}: SQLite=${sqliteCount}, PostgreSQL=${pgCount}`);
      }
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    // Cleanup
    sqliteDb.close();
    await pgClient.end();
    console.log('\n🔌 Connections closed');
  }
}

// Run migration
migrate()
  .then(() => {
    console.log('\n✅ Migration script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration script failed:', error);
    process.exit(1);
  });
