const redis = require('../redis/client');
const loadScript = require('../redis/loadScript');
const {
  getRateLimitPolicy,
  identifyUserTier,
} = require('../config/rateLimitPolicy');

let scriptSha;
let redisAvailable = false;

(async () => {
  try {
    scriptSha = await loadScript();
    redisAvailable = true;
  } catch (err) {
    console.error('Failed to load Lua script:', err);
    redisAvailable = false;
  }
})();

/**
 * Dynamic Token Bucket Rate Limiter Middleware
 * Applies different rate limits based on user tier and endpoint
 * 
 * Redis Failure Behavior:
 * - Paid users (premium/enterprise): Request allowed (fail open)
 * - Free users: Request rejected (fail closed for free tier)
 */
module.exports = function tokenBucketLimiter() {
  return async (req, res, next) => {
    try {
      
      const apiKey = req.headers['x-api-key'];

      const userTier = identifyUserTier(apiKey);

     
      const endpoint = req.path;

      const policy = getRateLimitPolicy(userTier, endpoint);

      const key = `tb:${apiKey}:${endpoint}`;

      const now = Math.floor(Date.now() / 1000);

      // Check if Redis is available
      if (!redisAvailable || !scriptSha) {
        console.warn('Redis unavailable for rate limiting');

        // Fail closed for free tier (reject requests)
        if (userTier === 'free') {
          return res.status(503).json({
            error: 'Service temporarily unavailable',
            tier: userTier,
            message:
              'Rate limiting service is down. Free tier requests rejected. Please try again later.',
            retryAfter: 60,
          });
        }

        // Fail open for paid tiers (allow requests)
        res.setHeader('X-RateLimit-Limit', policy.capacity);
        res.setHeader('X-RateLimit-Tier', userTier);
        res.setHeader(
          'X-RateLimit-Status',
          'service-degraded'
        );
        return next();
      }

      const allowed = await redis.evalsha(
        scriptSha,
        1,
        key,
        policy.capacity,
        policy.refillRate,
        now
      );

      // Attach rate limit info to response headers
      res.setHeader('X-RateLimit-Limit', policy.capacity);
      res.setHeader('X-RateLimit-Tier', userTier);
      res.setHeader('X-RateLimit-Status', 'active');

      if (allowed === 1) return next();

      res
        .status(429)
        .json({
          error: 'Rate limit exceeded',
          tier: userTier,
          limit: policy.capacity,
          message: `You have exceeded the rate limit of ${policy.capacity} requests per ${policy.windowSeconds} seconds for tier: ${userTier}`,
          retryAfter: 60,
        });
    } catch (err) {
      console.error('Rate limiter error:', err);

      // Get tier for fallback behavior
      const apiKey = req.headers['x-api-key'];
      const userTier = identifyUserTier(apiKey);

      // Fail closed for free tier
      if (userTier === 'free') {
        return res.status(503).json({
          error: 'Rate limiting service error',
          tier: userTier,
          message:
            'Unable to process request at this time. Please try again later.',
          retryAfter: 60,
        });
      }

      // Fail open for paid tiers
      next();
    }
  };
};
