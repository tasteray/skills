# TasteRay API Reference

Complete documentation for the TasteRay Recommendations API.

## Base URL

```
https://api.tasteray.com/v1
```

## Authentication

All requests require an API key in the `X-API-Key` header.

```bash
curl -X POST https://api.tasteray.com/v1/recommend \
  -H "X-API-Key: reco_live_your_key_here" \
  -H "Content-Type: application/json" \
  -d '{"vertical": "movies", "user_context": {...}}'
```

### Key Formats

| Format | Environment | Use Case |
|--------|-------------|----------|
| `reco_test_*` | Test/Development | No billing, synthetic responses |
| `reco_live_*` | Production | Real recommendations, metered |

---

## Endpoints

### POST /recommend

Generate personalized recommendations.

#### Request Body

```json
{
  "vertical": "string (required)",
  "user_context": {
    "preferences": {
      "likes": ["string"],
      "dislikes": ["string"],
      "importance": {
        "key": "high|medium|low"
      }
    },
    "profile": "string (free-form description)",
    "history": {
      "recent_positive": ["string"],
      "recent_negative": ["string"],
      "all_time_favorites": ["string"]
    },
    "constraints": {
      "key": "value"
    },
    "demographics": {
      "age_range": "string",
      "location": "string"
    },
    "situation": {
      "occasion": "string",
      "mood": "string",
      "time_available": "string"
    }
  },
  "count": "integer (1-20, default: 5)",
  "include_stretch": "boolean (default: false)",
  "min_confidence": "float (0-1, default: 0.5)"
}
```

#### Response

```json
{
  "recommendations": [
    {
      "id": "string",
      "item": {
        "title": "string",
        "...": "vertical-specific fields"
      },
      "confidence": 0.0-1.0,
      "why_match": "string",
      "match_factors": [
        {
          "factor": "string",
          "weight": 0.0-1.0
        }
      ],
      "concerns": ["string"]
    }
  ],
  "context_quality": {
    "score": 0.0-1.0,
    "suggestions": ["string"]
  },
  "request_id": "string"
}
```

---

## Vertical-Specific Schemas

### Movies

**Constraints:**
```json
{
  "constraints": {
    "max_runtime_minutes": 150,
    "min_year": 2000,
    "available_on": ["Netflix", "Prime"],
    "language": "en",
    "exclude_ratings": ["NC-17"]
  }
}
```

**Item Response:**
```json
{
  "item": {
    "title": "Prisoners",
    "year": 2013,
    "runtime_minutes": 153,
    "genres": ["Drama", "Thriller"],
    "director": "Denis Villeneuve",
    "rating": "R",
    "imdb_id": "tt1392214"
  }
}
```

### Restaurants

**Constraints:**
```json
{
  "constraints": {
    "location": {"lat": 40.7128, "lng": -74.0060},
    "max_distance_km": 5,
    "price_level": [2, 3],
    "cuisines": ["Italian", "Japanese"],
    "dietary": ["vegetarian_options"],
    "open_now": true,
    "reservations_available": true
  }
}
```

**Item Response:**
```json
{
  "item": {
    "name": "Osteria Morini",
    "cuisine": "Italian",
    "price_level": 3,
    "distance_km": 1.2,
    "rating": 4.5,
    "address": "218 Lafayette St, New York, NY",
    "phone": "+1-212-965-8777",
    "hours": {"monday": "11:30-22:00", "...": "..."}
  }
}
```

### Products

**Constraints:**
```json
{
  "constraints": {
    "max_price": 200,
    "min_price": 50,
    "category": "electronics",
    "brand_exclude": ["BrandX"],
    "shipping_to": "US",
    "in_stock": true
  }
}
```

**Item Response:**
```json
{
  "item": {
    "name": "Sony WH-1000XM5",
    "brand": "Sony",
    "price": 349.99,
    "currency": "USD",
    "category": "Headphones",
    "sku": "WH1000XM5B",
    "url": "https://..."
  }
}
```

### Travel

**Constraints:**
```json
{
  "constraints": {
    "departure_location": "NYC",
    "travel_dates": {
      "start": "2024-06-01",
      "end": "2024-06-14"
    },
    "budget_per_day_usd": 200,
    "travelers": 2,
    "interests": ["beaches", "culture"],
    "visa_free_for": "US"
  }
}
```

**Item Response:**
```json
{
  "item": {
    "destination": "Lisbon, Portugal",
    "country": "Portugal",
    "avg_daily_cost_usd": 150,
    "flight_estimate_usd": 600,
    "highlights": ["Historic trams", "Coastal beaches", "Pastéis de nata"],
    "best_season": "April-October"
  }
}
```

### Jobs

**Constraints:**
```json
{
  "constraints": {
    "location": "Remote",
    "salary_min_usd": 100000,
    "experience_years": 5,
    "visa_sponsorship": false,
    "company_size": ["startup", "mid"],
    "industry": ["tech", "fintech"]
  }
}
```

**Item Response:**
```json
{
  "item": {
    "title": "Senior Software Engineer",
    "company": "TechCorp",
    "location": "Remote (US)",
    "salary_range": "$120k-$160k",
    "job_type": "Full-time",
    "posted_date": "2024-01-15",
    "url": "https://..."
  }
}
```

---

## Error Responses

### Error Format

```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": {}
  },
  "request_id": "string"
}
```

### Error Codes

| HTTP Status | Code | Description |
|-------------|------|-------------|
| 400 | `invalid_request` | Malformed JSON or missing required fields |
| 400 | `invalid_vertical` | Unsupported vertical value |
| 401 | `invalid_api_key` | Missing or invalid API key |
| 401 | `expired_api_key` | API key has expired |
| 422 | `invalid_context` | user_context validation failed |
| 422 | `conflicting_constraints` | Constraints are mutually exclusive |
| 429 | `rate_limited` | Too many requests |
| 500 | `internal_error` | Server error |
| 503 | `service_unavailable` | Temporary unavailability |

### Rate Limits

| Plan | Requests/minute | Requests/day |
|------|-----------------|--------------|
| Test | 10 | 1,000 |
| Starter | 60 | 10,000 |
| Pro | 300 | 100,000 |
| Enterprise | Custom | Custom |

Rate limit headers:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1704067200
```

---

## Supported Verticals

Full list of supported `vertical` values:

| Vertical | Status | Notes |
|----------|--------|-------|
| `movies` | Stable | Film recommendations |
| `tv_shows` | Stable | Series recommendations |
| `restaurants` | Stable | Requires location |
| `products` | Stable | General e-commerce |
| `books` | Stable | Reading recommendations |
| `music` | Stable | Songs and artists |
| `podcasts` | Stable | Show discovery |
| `travel` | Stable | Destinations and experiences |
| `jobs` | Stable | Career matching |
| `recipes` | Stable | Meal recommendations |
| `gifts` | Stable | Occasion-based |
| `courses` | Stable | Learning paths |
| `events` | Stable | Local activities |
| `fitness` | Stable | Workouts and equipment |
| `wine` | Stable | Pairing and collections |
| `real_estate` | Stable | Home matching |
| `games` | Beta | Video games |
| `apps` | Beta | Mobile apps |
| `hotels` | Beta | Accommodation |
| `flights` | Beta | Flight options |
| `dating` | Beta | Profile matching |
| `pets` | Beta | Pet products/services |
| `cars` | Beta | Vehicle matching |
| `fashion` | Beta | Clothing/accessories |
| `art` | Beta | Art discovery |

---

## Best Practices

### Context Richness

More context = better recommendations. Minimum recommended:
- At least 2 items in `preferences.likes`
- At least 1 item in `history.recent_positive`
- A descriptive `profile` string (50+ characters)

### Constraint Tuning

Start loose, tighten if needed:
```json
// Too restrictive - may return few results
{"max_price": 50, "brand": "Apple", "color": "red"}

// Better - filter in UI instead
{"max_price": 100}
```

### Caching Strategy

- Cache responses for identical requests for 1 hour
- Cache context_quality scores to avoid redundant calls
- Don't cache when user_context changes

### Retry Strategy

```javascript
async function recommend(params, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fetch(API_URL, { ... });
    } catch (error) {
      if (error.status === 429 || error.status >= 500) {
        await sleep(Math.pow(2, i) * 1000); // Exponential backoff
        continue;
      }
      throw error;
    }
  }
}
```

---

## SDK Examples

### JavaScript/TypeScript

```typescript
import { TasteRay } from '@tasteray/sdk';

const client = new TasteRay({ apiKey: process.env.TASTERAY_API_KEY });

const recommendations = await client.recommend({
  vertical: 'movies',
  userContext: {
    preferences: { likes: ['thriller', 'drama'] },
    profile: 'I love plot twists and moral ambiguity',
  },
  count: 5,
});

for (const rec of recommendations.items) {
  console.log(`${rec.item.title}: ${rec.whyMatch}`);
}
```

### Python

```python
from tasteray import TasteRay

client = TasteRay(api_key=os.environ['TASTERAY_API_KEY'])

recommendations = client.recommend(
    vertical='movies',
    user_context={
        'preferences': {'likes': ['thriller', 'drama']},
        'profile': 'I love plot twists and moral ambiguity',
    },
    count=5,
)

for rec in recommendations.items:
    print(f"{rec.item['title']}: {rec.why_match}")
```

### cURL

```bash
curl -X POST https://api.tasteray.com/v1/recommend \
  -H "X-API-Key: $TASTERAY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "vertical": "movies",
    "user_context": {
      "preferences": {"likes": ["thriller", "drama"]},
      "profile": "I love plot twists and moral ambiguity"
    },
    "count": 5
  }'
```
