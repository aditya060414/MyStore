import { Redis } from '@upstash/redis';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!url || !token) {
  console.warn('[Redis] Warning: UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN missing in environment.');
}

export const redis = new Redis({
  url: url || 'https://placeholder.upstash.io',
  token: token || 'placeholder',
});

// Default session expiration: 7 days in seconds
export const DEFAULT_SESSION_TTL = 7 * 24 * 60 * 60; // 604,800 seconds

/**
 * Store user session in Upstash Redis
 * @param {string} sessionToken - JWT or session identifier
 * @param {object} sessionData - User data, roles, login timestamp
 * @param {number} ttlSeconds - Expiration in seconds
 */
export const createSession = async (sessionToken, sessionData, ttlSeconds = DEFAULT_SESSION_TTL) => {
  try {
    const key = `session:${sessionToken}`;
    const payload = {
      ...sessionData,
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
    };
    await redis.set(key, JSON.stringify(payload), { ex: ttlSeconds });

    // Track sessions by user ID
    if (sessionData.userId) {
      const userKey = `user_sessions:${sessionData.userId}`;
      await redis.sadd(userKey, sessionToken);
      await redis.expire(userKey, ttlSeconds);
    }

    return true;
  } catch (error) {
    console.error('[Redis Session] Error creating session:', error.message);
    return false;
  }
};

/**
 * Retrieve active session from Upstash Redis
 * @param {string} sessionToken
 * @returns {object|null}
 */
export const getSession = async (sessionToken) => {
  try {
    const key = `session:${sessionToken}`;
    const data = await redis.get(key);
    if (!data) return null;
    return typeof data === 'string' ? JSON.parse(data) : data;
  } catch (error) {
    console.error('[Redis Session] Error fetching session:', error.message);
    return { _redisError: true, error: error.message };
  }
};

/**
 * Refresh and extend session TTL (sliding expiration window)
 * @param {string} sessionToken
 * @param {number} ttlSeconds
 */
export const refreshSession = async (sessionToken, ttlSeconds = DEFAULT_SESSION_TTL) => {
  try {
    const key = `session:${sessionToken}`;
    await redis.expire(key, ttlSeconds);
    return true;
  } catch (error) {
    console.error('[Redis Session] Error refreshing session:', error.message);
    return false;
  }
};

// Aliases for compatibility and semantic flexibility
export const extendSession = refreshSession;
export const touchSession = refreshSession;

/**
 * Update active session data in Upstash Redis
 * @param {string} sessionToken
 * @param {object} updates
 */
export const updateSession = async (sessionToken, updates = {}) => {
  try {
    const key = `session:${sessionToken}`;
    const existing = await getSession(sessionToken);
    if (!existing || existing._redisError) return false;

    const merged = {
      ...existing,
      ...updates,
      lastActiveAt: new Date().toISOString(),
    };

    let ttl = await redis.ttl(key).catch(() => -1);
    const ttlSeconds = ttl > 0 ? ttl : DEFAULT_SESSION_TTL;

    await redis.set(key, JSON.stringify(merged), { ex: ttlSeconds });
    return merged;
  } catch (error) {
    console.error('[Redis Session] Error updating session:', error.message);
    return false;
  }
};


/**
 * Destroy/Revoke a single session (Logout)
 * @param {string} sessionToken
 * @param {string} [userId]
 */
export const destroySession = async (sessionToken, userId) => {
  try {
    const key = `session:${sessionToken}`;
    await redis.del(key);

    if (userId) {
      await redis.srem(`user_sessions:${userId}`, sessionToken);
    }
    return true;
  } catch (error) {
    console.error('[Redis Session] Error destroying session:', error.message);
    return false;
  }
};

/**
 * Retrieve all active session tokens for a user
 * @param {string} userId
 */
export const getUserSessions = async (userId) => {
  try {
    const userKey = `user_sessions:${userId}`;
    const tokens = await redis.smembers(userKey);
    return tokens || [];
  } catch (error) {
    console.error('[Redis Session] Error fetching user sessions:', error.message);
    return [];
  }
};

/**
 * Revoke all active sessions for a user (e.g. password reset / logout all devices)
 * @param {string} userId
 */
export const destroyAllUserSessions = async (userId) => {
  try {
    const userKey = `user_sessions:${userId}`;
    const tokens = await redis.smembers(userKey);
    if (tokens && tokens.length > 0) {
      for (const tok of tokens) {
        await redis.del(`session:${tok}`);
      }
      await redis.del(userKey);
    }
    return true;
  } catch (error) {
    console.error('[Redis Session] Error destroying all sessions for user:', error.message);
    return false;
  }
};

/**
 * Check Upstash Redis connectivity
 */
export const checkRedisHealth = async () => {
  try {
    const pong = await redis.ping();
    return pong === 'PONG';
  } catch (error) {
    return false;
  }
};

