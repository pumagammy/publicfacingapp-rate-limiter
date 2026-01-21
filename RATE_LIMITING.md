# Rate Limiter Configuration Guide

## Overview
The rate limiter now supports **dynamic policies** based on:
- **User Tier** (free, premium, enterprise)
- **API Endpoint** (different limits per route)

## How It Works

### 1. **API Key Identification**
Send your API key in the request header:
```bash
curl -H "x-api-key: premium_abc123" http://localhost:3000/api/data
```

### 2. **Tier Detection**
- `x-api-key` header starting with `premium_` → **Premium tier**
- `x-api-key` header starting with `enterprise_` → **Enterprise tier**
- No key or default → **Free tier**
- If no `x-api-key`, your IP is used as identifier

### 3. **Policy Lookup**
The system fetches the appropriate rate limit policy from `config/rateLimitPolicy.js`:
- Checks user tier
- Checks endpoint path
- Returns: `capacity`, `refillRate`, `windowSeconds`

## Example Policies

### Free Tier
- Default: 10 requests/min
- `/api/data`: 5 requests/min
- `/api/health`: 30 requests/sec (essentially unlimited)

### Premium Tier
- Default: 100 requests/min
- `/api/data`: 50 requests/min
- `/api/health`: 1000 requests/sec

### Enterprise Tier
- Default: 1000 requests/min
- `/api/data`: 500 requests/min
- `/api/health`: 10000 requests/sec

## Updating Rate Limit Rules

Edit `config/rateLimitPolicy.js`:

```javascript
const rateLimitConfig = {
  free: {
    default: {
      capacity: 10,
      refillRate: 1,
      windowSeconds: 60,
    },
    endpoints: {
      '/api/data': {
        capacity: 5,
        refillRate: 0.5,
        windowSeconds: 60,
      },
    },
  },
  // ... other tiers
};
```

### Adding a New Endpoint

```javascript
'/api/custom': {
  capacity: 20,
  refillRate: 2, // 2 tokens/sec
  windowSeconds: 60,
}
```

## Testing

### Free Tier (No API Key)
```bash
curl http://localhost:3000/api/data
```

### Premium Tier
```bash
curl -H "x-api-key: premium_abc123" http://localhost:3000/api/data
```

### Enterprise Tier
```bash
curl -H "x-api-key: enterprise_abc123" http://localhost:3000/api/data
```

## Response Headers

Successful requests include:
```
X-RateLimit-Limit: 50
X-RateLimit-Tier: premium
```

Rate-limited response:
```json
{
  "error": "Rate limit exceeded",
  "tier": "free",
  "limit": 5,
  "message": "You have exceeded the rate limit of 5 requests per 60 seconds for tier: free"
}
```

## Database Integration (Optional)

Replace `identifyUserTier()` in `config/rateLimitPolicy.js` with real database lookup:

```javascript
async function identifyUserTier(apiKey) {
  const user = await User.findByApiKey(apiKey);
  return user?.tier || 'free';
}
```
