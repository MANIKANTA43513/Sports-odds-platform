const Redis = require('ioredis');
require('dotenv').config();

let redis = null;

const getRedis = () => {
  if (!redis) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    redis = new Redis(redisUrl, {
      retryStrategy: (times) => {
        if (times > 3) {
          console.warn('[Redis] Max retries reached, disabling cache');
          return null;
        }
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
      enableOfflineQueue: false,
    });

    redis.on('connect', () => console.log('[Redis] Connected'));
    redis.on('error', (err) => {
      if (process.env.NODE_ENV !== 'test') {
        console.warn('[Redis] Error (cache disabled):', err.message);
      }
    });
  }
  return redis;
};

const cacheGet = async (key) => {
  try {
    const r = getRedis();
    const val = await r.get(key);
    return val ? JSON.parse(val) : null;
  } catch {
    return null; // fail gracefully
  }
};

const cacheSet = async (key, value, ttlSeconds = 600) => {
  try {
    const r = getRedis();
    await r.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    return true;
  } catch {
    return false;
  }
};

const cacheDel = async (key) => {
  try {
    const r = getRedis();
    await r.del(key);
    return true;
  } catch {
    return false;
  }
};

module.exports = { getRedis, cacheGet, cacheSet, cacheDel };
