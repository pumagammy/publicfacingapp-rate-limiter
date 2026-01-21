/**
 * Rate Limit Configuration
 * Define policies per tier, endpoint, and user type
 */

const rateLimitConfig = {
  // Free tier users
  free: {
    default: {
      capacity: 10,
      refillRate: 1, // 1 token/sec = 10 requests/min
      windowSeconds: 60,
    },
    endpoints: {
      '/api/data': {
        capacity: 5,
        refillRate: 0.5, // 0.5 token/sec = 5 requests/min
        windowSeconds: 60,
      },
      '/api/health': {
        capacity: 30,
        refillRate: 10, // 10 tokens/sec = unlimited essentially
        windowSeconds: 60,
      },
      '/': {
        capacity: 20,
        refillRate: 5, // 5 tokens/sec
        windowSeconds: 60,
      },
    },
  },

  // Premium tier users
  premium: {
    default: {
      capacity: 100,
      refillRate: 10, // 10 tokens/sec = 100 requests/min
      windowSeconds: 60,
    },
    endpoints: {
      '/api/data': {
        capacity: 50,
        refillRate: 5, // 5 tokens/sec = 50 requests/min
        windowSeconds: 60,
      },
      '/api/health': {
        capacity: 1000,
        refillRate: 100,
        windowSeconds: 60,
      },
      '/': {
        capacity: 200,
        refillRate: 20,
        windowSeconds: 60,
      },
    },
  },

  // Enterprise tier users
  enterprise: {
    default: {
      capacity: 1000,
      refillRate: 100, // 100 tokens/sec
      windowSeconds: 60,
    },
    endpoints: {
      '/api/data': {
        capacity: 500,
        refillRate: 50,
        windowSeconds: 60,
      },
      '/api/health': {
        capacity: 10000,
        refillRate: 1000,
        windowSeconds: 60,
      },
      '/': {
        capacity: 2000,
        refillRate: 200,
        windowSeconds: 60,
      },
    },
  },
};

/**
 * Get rate limit policy for a given tier and endpoint
 * @param {string} tier - User tier (free, premium, enterprise)
 * @param {string} endpoint - API endpoint path
 * @returns {object} Rate limit policy {capacity, refillRate, windowSeconds}
 */
function getRateLimitPolicy(tier = 'free', endpoint = '/') {
  const tierConfig = rateLimitConfig[tier] || rateLimitConfig.free;
  const endpointPolicy =
    tierConfig.endpoints[endpoint] || tierConfig.default;

  return endpointPolicy;
}

/**
 * Identify user tier from API key header
 * In a real app, this would look up the key in a database
 * @param {string} apiKey - API key from request header
 * @returns {string} User tier (free, premium, enterprise)
 */
function identifyUserTier(apiKey) {
  // Mock implementation - replace with database lookup
  if (!apiKey) return 'free';

  // Example: keys starting with "premium_" get premium tier
  if (apiKey.startsWith('premium_')) return 'premium';
  if (apiKey.startsWith('enterprise_')) return 'enterprise';

  return 'free';
}

module.exports = {
  rateLimitConfig,
  getRateLimitPolicy,
  identifyUserTier,
};
