-- Qi Learning App - PostgreSQL Schema
-- Version 2.0
-- Converted from SQLite to PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  is_admin SMALLINT DEFAULT 0,
  is_active SMALLINT DEFAULT 1,
  must_change_password SMALLINT DEFAULT 0,
  first_login SMALLINT DEFAULT 1,
  mfa_secret TEXT,
  mfa_enabled SMALLINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on username for faster lookups
CREATE INDEX idx_users_username ON users(username);

-- Folders table
CREATE TABLE IF NOT EXISTS folders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  source_folder_id INTEGER DEFAULT NULL REFERENCES folders(id) ON DELETE SET NULL,
  allow_export SMALLINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on user_id for faster lookups
CREATE INDEX idx_folders_user_id ON folders(user_id);

-- Sets table
CREATE TABLE IF NOT EXISTS sets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  folder_id INTEGER REFERENCES folders(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  source_set_id INTEGER DEFAULT NULL REFERENCES sets(id) ON DELETE SET NULL,
  allow_export SMALLINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes on sets
CREATE INDEX idx_sets_user_id ON sets(user_id);
CREATE INDEX idx_sets_folder_id ON sets(folder_id);

-- Flashcards table
CREATE TABLE IF NOT EXISTS flashcards (
  id SERIAL PRIMARY KEY,
  set_id INTEGER NOT NULL REFERENCES sets(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  definition TEXT NOT NULL,
  term_image TEXT,
  definition_image TEXT,
  is_starred SMALLINT DEFAULT 0,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes on flashcards
CREATE INDEX idx_flashcards_set_id ON flashcards(set_id);
CREATE INDEX idx_flashcards_order ON flashcards(set_id, order_index);

-- User notes for flashcards (personal notes)
CREATE TABLE IF NOT EXISTS user_notes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  flashcard_id INTEGER NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, flashcard_id)
);

-- Create indexes on user_notes
CREATE INDEX idx_user_notes_user_id ON user_notes(user_id);
CREATE INDEX idx_user_notes_flashcard_id ON user_notes(flashcard_id);

-- Learning progress table (spaced repetition)
CREATE TABLE IF NOT EXISTS learning_progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  flashcard_id INTEGER NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,
  ease_factor REAL DEFAULT 2.5,
  interval_days INTEGER DEFAULT 0,
  repetitions INTEGER DEFAULT 0,
  next_review_date TIMESTAMP,
  last_review_date TIMESTAMP,
  consecutive_correct INTEGER DEFAULT 0,
  is_mastered SMALLINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, flashcard_id)
);

-- Create indexes on learning_progress
CREATE INDEX idx_learning_progress_user_id ON learning_progress(user_id);
CREATE INDEX idx_learning_progress_flashcard_id ON learning_progress(flashcard_id);
CREATE INDEX idx_learning_progress_next_review ON learning_progress(next_review_date);

-- Study sessions table
CREATE TABLE IF NOT EXISTS study_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  set_id INTEGER REFERENCES sets(id) ON DELETE SET NULL,
  folder_id INTEGER REFERENCES folders(id) ON DELETE SET NULL,
  session_type VARCHAR(50) NOT NULL, -- 'long_term', 'random_starred', 'random_all'
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP
);

-- Create indexes on study_sessions
CREATE INDEX idx_study_sessions_user_id ON study_sessions(user_id);

-- Study answers table
CREATE TABLE IF NOT EXISTS study_answers (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES study_sessions(id) ON DELETE CASCADE,
  flashcard_id INTEGER NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,
  is_correct SMALLINT NOT NULL,
  answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes on study_answers
CREATE INDEX idx_study_answers_session_id ON study_answers(session_id);

-- Folder-Sets junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS folder_sets (
  id SERIAL PRIMARY KEY,
  folder_id INTEGER NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
  set_id INTEGER NOT NULL REFERENCES sets(id) ON DELETE CASCADE,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(folder_id, set_id)
);

-- Create indexes on folder_sets
CREATE INDEX idx_folder_sets_folder_id ON folder_sets(folder_id);
CREATE INDEX idx_folder_sets_set_id ON folder_sets(set_id);

-- Set shares table - for sharing sets between users
CREATE TABLE IF NOT EXISTS set_shares (
  id SERIAL PRIMARY KEY,
  set_id INTEGER NOT NULL REFERENCES sets(id) ON DELETE CASCADE,
  shared_by_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shared_with_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_accepted SMALLINT DEFAULT 0,
  share_token VARCHAR(255) UNIQUE NOT NULL,
  allow_export SMALLINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  accepted_at TIMESTAMP,
  UNIQUE(set_id, shared_with_user_id)
);

-- Create indexes on set_shares
CREATE INDEX idx_set_shares_set_id ON set_shares(set_id);
CREATE INDEX idx_set_shares_shared_with ON set_shares(shared_with_user_id);
CREATE INDEX idx_set_shares_token ON set_shares(share_token);

-- Folder shares table - for sharing folders between users
CREATE TABLE IF NOT EXISTS folder_shares (
  id SERIAL PRIMARY KEY,
  folder_id INTEGER NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
  shared_by_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shared_with_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_accepted SMALLINT DEFAULT 0,
  share_token VARCHAR(255) UNIQUE NOT NULL,
  allow_export SMALLINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  accepted_at TIMESTAMP,
  UNIQUE(folder_id, shared_with_user_id)
);

-- Create indexes on folder_shares
CREATE INDEX idx_folder_shares_folder_id ON folder_shares(folder_id);
CREATE INDEX idx_folder_shares_shared_with ON folder_shares(shared_with_user_id);
CREATE INDEX idx_folder_shares_token ON folder_shares(share_token);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_folders_updated_at BEFORE UPDATE ON folders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sets_updated_at BEFORE UPDATE ON sets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_flashcards_updated_at BEFORE UPDATE ON flashcards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_notes_updated_at BEFORE UPDATE ON user_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_progress_updated_at BEFORE UPDATE ON learning_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create default admin user (password: admin123)
-- Hashed with bcryptjs, salt rounds: 10
INSERT INTO users (username, password, is_admin, is_active, must_change_password, first_login)
VALUES (
  'admin',
  '$2a$10$N9qo8uLOickgx2ZMRZoMye5IcR6y8CJ/6mKSCiYZ/xMUbT/WQDSuy',
  1,
  1,
  0,
  0
) ON CONFLICT (username) DO NOTHING;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO qi_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO qi_user;
