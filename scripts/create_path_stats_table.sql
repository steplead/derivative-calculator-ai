-- Create path_stats table for tracking request paths
-- This table stores request path statistics for traffic analysis

CREATE TABLE IF NOT EXISTS path_stats (
    path TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    status_code INTEGER NOT NULL DEFAULT 200,
    count INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (path, timestamp)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_path_stats_timestamp ON path_stats(timestamp);
CREATE INDEX IF NOT EXISTS idx_path_stats_path ON path_stats(path);

-- Note: This table will grow over time. Consider adding cleanup:
-- DELETE FROM path_stats WHERE timestamp < (strftime('%s', 'now') - 86400 * 7); -- Keep 7 days
