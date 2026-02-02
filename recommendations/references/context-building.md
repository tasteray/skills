# Context Building Guide

How to structure user context for optimal recommendation quality.

## The Context Quality Equation

```
Recommendation Quality = min(Algorithm Quality, Context Quality)
```

You can have the best recommendation engine in the world, but if user context is thin, results will be generic. This guide focuses on maximizing context quality.

---

## Context Components

The `user_context` object has six main components:

| Component | Purpose | Impact |
|-----------|---------|--------|
| `preferences` | Explicit likes/dislikes | High - direct signals |
| `profile` | Free-form personality | High - captures nuance |
| `history` | Past behavior | High - proven preferences |
| `constraints` | Hard requirements | Critical - filters results |
| `demographics` | Background info | Medium - contextualizes |
| `situation` | Current state | Medium - situational fit |

---

## Structured Preferences

Best for categorical, explicit signals.

### Basic Structure

```json
{
  "preferences": {
    "likes": ["minimalist design", "fast shipping", "eco-friendly"],
    "dislikes": ["subscription models", "aggressive marketing"],
    "importance": {
      "price": "high",
      "quality": "medium",
      "convenience": "high",
      "brand": "low"
    }
  }
}
```

### Preference Hierarchies

When preferences conflict, importance rankings resolve them:

```json
{
  "preferences": {
    "likes": ["organic ingredients", "budget-friendly"],
    "importance": {
      "health": "high",    // Will prioritize organic
      "price": "medium"    // Even if slightly more expensive
    }
  }
}
```

### Negative Preferences

Dislikes are often more informative than likes:

```json
{
  "preferences": {
    "likes": ["action movies"],           // Broad category
    "dislikes": [
      "shaky cam",                        // Specific turn-off
      "excessive CGI",                    // Quality concern
      "protagonists who never lose"       // Narrative preference
    ]
  }
}
```

---

## Free-Form Profile

Best for capturing personality, nuance, and context that doesn't fit categories.

### Good Profile Examples

**For movie recommendations:**
```json
{
  "profile": "I'm a tired parent of two who gets maybe one hour of TV after the kids sleep. I need something engaging enough to stay awake for, but not so intense I can't sleep afterward. Hook me fast or lose me—I've been burned by slow first episodes too many times."
}
```

**For restaurant recommendations:**
```json
{
  "profile": "Food snob who hates pretentious service. I want quality ingredients prepared well, not foam and tweezers. Bonus points for being able to actually hear my date. I'd rather have excellent tacos than mediocre fine dining."
}
```

**For product recommendations:**
```json
{
  "profile": "I research obsessively before buying anything over $50. I read every negative review and assume 5-star reviews are fake. I'd rather pay more for something that lasts than replace cheap stuff yearly. Aesthetics matter to me—I won't buy something ugly even if it works great."
}
```

### Profile Writing Tips

1. **Include constraints naturally**: "limited time" tells us about runtime preferences
2. **Reveal personality**: "food snob" signals quality over value
3. **Mention deal-breakers**: "can't sleep afterward" is a hard constraint
4. **Show priority order**: "excellent tacos > mediocre fine dining" reveals trade-offs

### Anti-Patterns in Profiles

**Too vague:**
> "I like good movies."

**Too list-like:**
> "Likes: action, comedy. Dislikes: horror."

**Contradictory without explanation:**
> "I love quiet restaurants but also want great music."

---

## Behavioral History

Past behavior is the strongest signal of future preferences.

### History Structure

```json
{
  "history": {
    "recent_positive": [
      "The Bear",
      "Severance",
      "Succession"
    ],
    "recent_negative": [
      "Emily in Paris",
      "The Morning Show"
    ],
    "all_time_favorites": [
      "Breaking Bad",
      "The Wire",
      "Mad Men"
    ],
    "abandoned": [
      {"item": "Slow Horses", "stopped_at": "episode 2"}
    ]
  }
}
```

### Signal Strength

| History Type | Signal Strength | Why |
|--------------|-----------------|-----|
| `all_time_favorites` | Highest | Core identity |
| `recent_positive` | High | Current taste |
| `recent_negative` | High | Active dislikes |
| `abandoned` | Medium-High | Reveals limits |
| `completed` | Medium | May include obligation watches |

### Abandoned Items

Abandoned items with context are gold:

```json
{
  "abandoned": [
    {"item": "Slow Horses", "stopped_at": "episode 2", "reason": "too slow"},
    {"item": "The Recruit", "stopped_at": "episode 5", "reason": "got repetitive"}
  ]
}
```

---

## Constraints

Hard requirements that filter results.

### Constraint Types

**Hard constraints** - Must be respected:
```json
{
  "constraints": {
    "max_price": 100,
    "dietary": ["gluten-free"],
    "available_on": ["Netflix"]
  }
}
```

**Soft constraints** - Prefer but flexible:
```json
{
  "constraints": {
    "preferred_max_price": 100,  // Will include slightly higher with explanation
    "prefer_organic": true       // Not a deal-breaker
  }
}
```

### Common Constraint Patterns

**Budget with flexibility:**
```json
{
  "constraints": {
    "target_price": 50,
    "max_price": 75,
    "price_sensitivity": "high"  // Will bias toward lower
  }
}
```

**Location with radius:**
```json
{
  "constraints": {
    "location": {"lat": 40.7128, "lng": -74.0060},
    "max_distance_km": 5,
    "preferred_distance_km": 2
  }
}
```

**Time constraints:**
```json
{
  "constraints": {
    "max_runtime_minutes": 120,
    "available_times": ["evenings", "weekends"],
    "decision_deadline": "2024-02-01"
  }
}
```

---

## Demographics

Background context that informs recommendations.

### When Demographics Help

```json
{
  "demographics": {
    "age_range": "30-40",
    "location": "urban",
    "life_stage": "parent_young_children",
    "occupation_type": "knowledge_worker"
  }
}
```

### Demographic Inference

Demographics should inform, not dictate:
- Age 65 doesn't mean "recommend only old movies"
- "Parent" doesn't mean "recommend only family content"

Use demographics to:
- Contextualize time constraints (busy professional)
- Inform practical considerations (kid-friendly)
- Add cultural relevance (local references)

---

## Situational Context

The current state that affects this specific request.

### Situation Structure

```json
{
  "situation": {
    "occasion": "date night",
    "mood": "want to be surprised",
    "time_available": "2 hours",
    "companions": "partner",
    "recent_events": "stressful week, need escapism"
  }
}
```

### Occasion Types

| Occasion | Recommendation Impact |
|----------|----------------------|
| `date_night` | Conversation-friendly, romantic |
| `solo_treat` | Self-indulgent, no compromise |
| `family_gathering` | Crowd-pleasing, safe choices |
| `impressing_guests` | Quality signals, unique finds |
| `comfort_seeking` | Familiar, reliable, cozy |
| `exploration` | Novel, adventurous, surprising |

### Mood Mapping

```json
{
  "situation": {
    "mood": "mentally exhausted",
    // Implies: light content, easy to follow, feel-good
  }
}
```

```json
{
  "situation": {
    "mood": "want to be challenged",
    // Implies: complex, thought-provoking, demanding
  }
}
```

---

## Combining Context Effectively

### Minimal Viable Context

The bare minimum for decent recommendations:

```json
{
  "user_context": {
    "preferences": {
      "likes": ["thriller", "drama"]
    },
    "history": {
      "recent_positive": ["Severance", "The Bear"]
    }
  }
}
```

### Rich Context Example

What great context looks like:

```json
{
  "user_context": {
    "preferences": {
      "likes": ["slow-burn tension", "moral ambiguity", "strong writing"],
      "dislikes": ["gratuitous violence", "laugh tracks", "will-they-won't-they"],
      "importance": {
        "writing_quality": "high",
        "production_value": "medium",
        "episode_count": "low"
      }
    },
    "profile": "Former literature major who brings that energy to TV. I notice when dialogue is lazy. I'd rather watch one perfect season than five mediocre ones. I'm patient with setup if the payoff is worth it.",
    "history": {
      "recent_positive": ["Severance", "The Bear", "Slow Horses"],
      "recent_negative": ["Reacher", "Jack Ryan"],
      "all_time_favorites": ["The Wire", "Mad Men", "The Leftovers"],
      "abandoned": [
        {"item": "Yellowstone", "reason": "too soapy"}
      ]
    },
    "constraints": {
      "available_on": ["Apple TV+", "HBO Max", "Netflix"],
      "max_seasons": 4
    },
    "situation": {
      "mood": "want something to think about",
      "time_available": "can commit to full series"
    }
  }
}
```

---

## Context Quality Scoring

The API returns a `context_quality` object:

```json
{
  "context_quality": {
    "score": 0.78,
    "completeness": {
      "preferences": 0.85,
      "profile": 0.70,
      "history": 0.90,
      "constraints": 0.65
    },
    "suggestions": [
      "Adding dislikes would help avoid mismatches",
      "Specifying time constraints would improve situational fit"
    ]
  }
}
```

### Score Interpretation

| Score | Meaning | Expected Result Quality |
|-------|---------|------------------------|
| 0.9+ | Excellent | Highly personalized, confident |
| 0.7-0.9 | Good | Solid matches, some exploration |
| 0.5-0.7 | Adequate | Decent matches, may be generic |
| 0.3-0.5 | Sparse | Generic recommendations |
| <0.3 | Insufficient | Cannot meaningfully personalize |

### Improving Context Score

1. **Add history** - Most impactful single addition
2. **Include dislikes** - Prevents bad matches
3. **Write a profile** - Captures what structured data misses
4. **Specify constraints** - Removes impossible options
5. **Add situation** - Contextualizes current need

---

## Progressive Context Building

For conversational interfaces, build context over time:

### Turn 1: Baseline
```json
{"preferences": {"likes": ["Italian food"]}}
```

### Turn 2: Add history
```json
{
  "preferences": {"likes": ["Italian food"]},
  "history": {"recent_positive": ["Osteria Francescana", "local trattoria"]}
}
```

### Turn 3: Add constraints
```json
{
  "preferences": {"likes": ["Italian food"]},
  "history": {"recent_positive": ["Osteria Francescana", "local trattoria"]},
  "constraints": {"max_price_pp": 75, "location": "downtown"}
}
```

### Turn 4: Add situation
```json
{
  "preferences": {"likes": ["Italian food"]},
  "history": {"recent_positive": ["Osteria Francescana", "local trattoria"]},
  "constraints": {"max_price_pp": 75, "location": "downtown"},
  "situation": {"occasion": "anniversary", "companions": "partner"}
}
```

Each addition improves context_quality and recommendation precision.
