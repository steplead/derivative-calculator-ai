#!/usr/bin/env python3
"""
Clear all AI-generated content from cache
This forces regeneration with the new enhanced prompts
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Try Redis
try:
    import redis

    redis_url = os.environ.get('REDIS_URL', 'redis://localhost:6379')
    print(f"🔗 Connecting to Redis: {redis_url}")

    r = redis.from_url(redis_url, decode_responses=True)

    # Test connection
    r.ping()
    print("✅ Redis connection successful")

    # Count keys before deletion
    count_before = 0
    for pattern in ['derivative:*', 'integral:*', 'limit:*', 'ode:*']:
        count_before += len(list(r.scan_iter(match=pattern)))

    print(f"📊 Total cache entries to delete: {count_before}")

    if count_before == 0:
        print("ℹ️  No cache entries found. Already clean!")
        sys.exit(0)

    # Delete all AI cache entries
    deleted_count = 0
    for pattern in ['derivative:*', 'integral:*', 'limit:*', 'ode:*']:
        for key in r.scan_iter(match=pattern):
            r.delete(key)
            deleted_count += 1
            print(f"  🗑️  Deleted: {key}")

    print(f"\n✅ Successfully deleted {deleted_count} cache entries")
    print("🎯 Next API calls will regenerate content with enhanced prompts")

except ImportError:
    print("❌ Redis not installed. Install with: pip install redis")
    sys.exit(1)
except Exception as e:
    print(f"❌ Error clearing cache: {e}")
    print("\n💡 Alternative: Manually restart your Redis server or flush the database:")
    print("   redis-cli FLUSHDB")
    sys.exit(1)

print("\n" + "="*60)
print("Cache clearing complete! 🎉")
print("="*60)
