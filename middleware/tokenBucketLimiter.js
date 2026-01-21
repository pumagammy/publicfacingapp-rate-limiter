const redis = require('../redis/client');
const loadScript = require('../redis/loadScript');
const {
  getRateLimitPolicy,
  identifyUserTier,
} = require('../config/rateLimitPolicy');

let scriptSha;

(async () => {
  scriptSha = await loadScript();
})();

/**
 * Dynamic Token Bucket Rate Limiter Middleware
 * Applies different rate limits based on user tier and endpoint
 */
module.exports = function tokenBucketLimiter() {
  return async (req, res, next) => {
    try {
      
      const apiKey = req.headers['x-api-key'] ;

      const userTier = identifyUserTier(apiKey);

     
      const endpoint = req.path;

      const policy = getRateLimitPolicy(userTier, endpoint);

      const key = `tb:${apiKey}:${endpoint}`;

      const now = Math.floor(Date.now() / 1000);

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

      if (allowed === 1) return next();

      res
        .status(429)
        .json({
          error: 'Rate limit exceeded',
          tier: userTier,
          limit: policy.capacity,
          message: `You have exceeded the rate limit of ${policy.capacity} requests per ${policy.windowSeconds} seconds for tier: ${userTier}`,
        });
    } catch (err) {
    
      next();
    }
  };
};
