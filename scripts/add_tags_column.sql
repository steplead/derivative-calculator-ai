-- Add tags column to problems table
ALTER TABLE problems ADD COLUMN tags TEXT;

-- Add difficulty column
ALTER TABLE problems ADD COLUMN difficulty TEXT DEFAULT 'medium';

-- Add views column for tracking popularity
ALTER TABLE problems ADD COLUMN views INTEGER DEFAULT 0;

-- Create index on tags for faster queries
CREATE INDEX IF NOT EXISTS idx_problems_tags ON problems(tags);
CREATE INDEX IF NOT EXISTS idx_problems_type ON problems(type);
CREATE INDEX IF NOT EXISTS idx_problems_difficulty ON problems(difficulty);
