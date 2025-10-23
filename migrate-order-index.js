#!/usr/bin/env node
// Migration script: Add order_index column to flashcards table

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data/quizlet.db');
const db = new Database(dbPath);

console.log('=== Starting Migration: Add order_index to flashcards ===\n');

try {
  // Enable foreign keys
  db.pragma('foreign_keys = ON');
  
  // Check if column exists
  const columns = db.prepare("PRAGMA table_info(flashcards)").all();
  const hasOrderIndex = columns.some(col => col.name === 'order_index');
  
  if (hasOrderIndex) {
    console.log('✓ Column order_index already exists');
  } else {
    console.log('Adding order_index column...');
    db.exec('ALTER TABLE flashcards ADD COLUMN order_index INTEGER DEFAULT 0');
    console.log('✓ Column order_index added successfully');
  }
  
  // Update order_index for existing flashcards (order by created_at, id)
  console.log('\nUpdating order_index for existing flashcards...');
  
  const sets = db.prepare('SELECT DISTINCT set_id FROM flashcards').all();
  
  sets.forEach(({ set_id }) => {
    const flashcards = db.prepare(`
      SELECT id FROM flashcards 
      WHERE set_id = ? 
      ORDER BY created_at ASC, id ASC
    `).all(set_id);
    
    const updateStmt = db.prepare('UPDATE flashcards SET order_index = ? WHERE id = ?');
    
    flashcards.forEach((card, index) => {
      updateStmt.run(index, card.id);
    });
    
    console.log(`  ✓ Updated ${flashcards.length} flashcards in set ${set_id}`);
  });
  
  console.log('\n✓ Migration completed successfully!');
  console.log('\nVerification:');
  
  const sample = db.prepare(`
    SELECT id, word, order_index, created_at 
    FROM flashcards 
    LIMIT 5
  `).all();
  
  console.table(sample);
  
} catch (error) {
  console.error('✗ Migration failed:', error.message);
  process.exit(1);
}

db.close();
