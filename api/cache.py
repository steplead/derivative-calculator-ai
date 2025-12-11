import os
import json
import hashlib
from redis import Redis

# Initialize Redis client safely
# User needs to set KV_URL or REDIS_URL in Vercel
redis_url = os.environ.get('KV_URL') or os.environ.get('REDIS_URL')
redis_client = None

if redis_url:
    try:
        # If using Vercel KV, it might need ssl_cert_reqs=None depending on provider
        redis_client = Redis.from_url(redis_url, socket_timeout=2)
        redis_client.ping() # Check connection
        print("✅ Redis Connected")
    except Exception as e:
        print(f"⚠️ Redis Connection Failed: {e}")
        redis_client = None
else:
    print("ℹ️ No REDIS_URL found. Caching disabled.")

def get_cache_key(mode, equation, params=None):
    """Generate a unique deterministic key for the calculation."""
    # Normalize equation (remove spaces, lowercase)
    clean_eq = str(equation).replace(" ", "").lower()
    
    # Sort params to ensure consistency
    param_str = ""
    if params:
        param_str = json.dumps(params, sort_keys=True)
    
    # Create hash
    raw_key = f"{mode}:{clean_eq}:{param_str}"
    key_hash = hashlib.md5(raw_key.encode()).hexdigest()
    return f"calc:{key_hash}"

def get_cached_result(key):
    """Retrieve result from cache if available."""
    if not redis_client:
        return None
    try:
        data = redis_client.get(key)
        if data:
            return json.loads(data)
    except Exception as e:
        print(f"Cache Read Error: {e}")
    return None

def set_cached_result(key, data, ttl=86400):
    """Save result to cache with 24h TTL (Math doesn't change)."""
    if not redis_client:
        return
    try:
        redis_client.setex(key, ttl, json.dumps(data))
    except Exception as e:
        print(f"Cache Write Error: {e}")
