---
name: recommendations
description: 'Generate personalized recommendations with human-readable explanations using
  the TasteRay API. Use when you need to: (1) generate personalized recommendations
  for users across any vertical, (2) build recommendation systems with "why you''ll
  love this" explanations, (3) integrate with the TasteRay API for emotional AI recommendations,
  (4) create compelling match explanations based on user context, (5) implement multi-vertical
  recommendation logic (movies, restaurants, products, travel, jobs, etc.), (6) structure
  user context for optimal recommendation quality, (7) interpret confidence scores
  and handle edge cases, (8) design recommendation flows that feel personal, not algorithmic.'
license: MIT
metadata:
  author: tasteray
  version: "1.0"
---

# Recommendations

Generate personalized recommendations with human-readable explanations.

## Goal

When reviewing or creating recommendation systems, API integrations, or any code that generates personalized suggestions—**your goal is to achieve a 10/10 score**.

Score all work on a 0-10 scale based on adherence to the principles and techniques in this skill. Provide your assessment as **X/10** with specific feedback on what's working and what needs improvement to reach 10/10.

A 10/10 means the work:
- Embodies the core principle (WHY over WHAT)
- Provides rich, relevant user context
- Generates explanations that feel personal, not templated
- Handles confidence levels appropriately
- Avoids all anti-patterns

Iterate until you reach 10/10.

---

## Core Principle

**Recommendations should answer WHY, not just WHAT.**

Anyone can generate a list. The value is in the explanation—helping users understand why a recommendation fits *them specifically*. A recommendation without a compelling "why" is just a suggestion.

Key insight: Users don't trust black-box recommendations. They trust recommendations they can understand.

## Three Pillars of Effective Recommendations

### 1. User Understanding

The quality of recommendations is bounded by the quality of user context. Garbage in, garbage out.

**Context types:**
- **Explicit preferences** - What they've told you they like/dislike
- **Behavioral signals** - What they've chosen, viewed, purchased
- **Demographic context** - Age, location, life stage (when relevant)
- **Situational context** - Current mood, occasion, constraints

### 2. Item Matching

Confidence scores reflect how well an item matches the user's context. High confidence requires:
- Multiple reinforcing signals
- Absence of conflicting constraints
- Sufficient context to make the match

### 3. Explanation Quality

The `why_match` is where value is created. Effective explanations:
- Reference specific user context ("You mentioned loving slow-burn thrillers...")
- Connect features to benefits ("The 2-hour runtime fits your lunch break preference")
- Acknowledge trade-offs when relevant ("It's pricier than your usual, but...")

---

## TasteRay API Integration

The TasteRay API provides emotional AI recommendations across 25+ verticals.

### Quick Reference

**Endpoint:** `POST https://api.tasteray.com/v1/recommend`

**Authentication:** `X-API-Key: reco_live_xxx` or `reco_test_xxx`

**Basic Request:**
```json
{
  "vertical": "movies",
  "user_context": {
    "preferences": {
      "genres": ["thriller", "drama"],
      "avoid": ["horror", "gore"]
    },
    "profile": "I love movies that make me think. Plot twists that actually surprise me.",
    "constraints": {
      "max_runtime_minutes": 150
    }
  },
  "count": 5
}
```

**Response:**
```json
{
  "recommendations": [
    {
      "item": {
        "title": "Prisoners",
        "year": 2013,
        "runtime_minutes": 153
      },
      "confidence": 0.89,
      "why_match": "This fits your love of thinking-person's thrillers perfectly. The plot keeps you guessing without cheap tricks, and the moral ambiguity will give you plenty to chew on afterward. Note: slightly over your runtime preference at 153 minutes, but the pacing earns every minute."
    }
  ],
  "context_quality": {
    "score": 0.82,
    "suggestions": ["Adding recent watches would improve specificity"]
  }
}
```

### Supported Verticals

| Vertical | Example Use Cases |
|----------|-------------------|
| `movies` | Streaming suggestions, date night picks |
| `restaurants` | Local dining, special occasions |
| `products` | E-commerce, gift recommendations |
| `travel` | Destinations, hotels, experiences |
| `jobs` | Career matches, job board results |
| `books` | Reading recommendations |
| `music` | Playlist curation, artist discovery |
| `podcasts` | New show discovery |
| `recipes` | Meal planning, dietary needs |
| `gifts` | Occasion-based gift finding |
| `courses` | Learning path recommendations |
| `events` | Local activities, concerts |
| `fitness` | Workout programs, equipment |
| `wine` | Pairing suggestions, collections |
| `real_estate` | Home/apartment matching |

See: [API Reference](./references/api-reference.md)

---

## Context Building Techniques

The `user_context` object is where recommendation quality is won or lost.

### Structured Preferences

Best for explicit, categorical preferences:

```json
{
  "preferences": {
    "likes": ["minimalist design", "fast shipping"],
    "dislikes": ["cluttered interfaces", "subscription models"],
    "importance": {
      "price": "high",
      "quality": "medium",
      "brand": "low"
    }
  }
}
```

### Free-Form Profile

Best for capturing nuance and personality:

```json
{
  "profile": "I'm a tired parent of two who gets maybe one hour of TV time after the kids are asleep. I need something engaging enough to stay awake for, but not so intense I can't sleep afterward. I've been burned by slow first episodes too many times—hook me fast or lose me."
}
```

### Combining Signals

The most effective context combines both:

```json
{
  "user_context": {
    "preferences": {
      "genres": ["comedy", "light drama"],
      "avoid": ["violence", "heavy themes"]
    },
    "profile": "Tired parent, limited time, need quick hooks",
    "history": {
      "recent_positive": ["Ted Lasso", "Schitt's Creek"],
      "recent_negative": ["The Bear"]
    },
    "constraints": {
      "max_episodes_per_season": 12,
      "available_platforms": ["Netflix", "Apple TV+"]
    }
  }
}
```

### Context Quality Feedback

The API returns a `context_quality` score. Use it:

| Score | Meaning | Action |
|-------|---------|--------|
| 0.9+ | Excellent context | Proceed confidently |
| 0.7-0.9 | Good context | Results will be solid |
| 0.5-0.7 | Sparse context | Consider gathering more info |
| <0.5 | Insufficient | Recommendations may feel generic |

See: [Context Building Reference](./references/context-building.md)

---

## Explanation Patterns

The `why_match` field is what transforms a recommendation from algorithmic to personal.

### Anatomy of a Great Explanation

1. **Hook** - Reference their specific context
2. **Match** - Explain why this item fits
3. **Benefit** - What they'll get from it
4. **Caveat** (optional) - Honest acknowledgment of trade-offs

**Example:**
> "You mentioned loving restaurants where you can hear your conversation [HOOK]. This cozy neighborhood spot keeps the music low and tables spaced well [MATCH]. Perfect for the catch-up dinner you're planning [BENEFIT]. Note: no outdoor seating if the weather's nice [CAVEAT]."

### Explanation Templates by Vertical

**Movies/TV:**
> "Based on your love of [PREFERENCE], this [GENRE] delivers [BENEFIT]. The [SPECIFIC FEATURE] matches your preference for [CONTEXT]."

**Restaurants:**
> "For your [OCCASION], this spot nails [KEY CRITERIA]. [SPECIFIC FEATURE] fits your [CONSTRAINT], and [BONUS FEATURE] is a nice extra."

**Products:**
> "This hits your [PRIORITY] requirement with [SPECIFIC FEATURE]. It's [COMPARISON TO ALTERNATIVES] and [ADDRESSES CONCERN]."

**Travel:**
> "Given your interest in [ACTIVITY/VIBE], [DESTINATION] offers [SPECIFIC MATCH]. [PRACTICAL CONSIDERATION] works for your [CONSTRAINT]."

### Confidence Score Interpretation

| Score | Language | Example |
|-------|----------|---------|
| 0.9+ | Strong confidence | "This is exactly what you're looking for..." |
| 0.8-0.9 | High match | "This fits your preferences well..." |
| 0.7-0.8 | Good match | "Based on what you've shared, this could work..." |
| 0.6-0.7 | Partial match | "This matches some of your criteria..." |
| <0.6 | Stretch | "This is a bit outside your usual, but..." |

See: [Explanation Patterns Reference](./references/explanation-patterns.md)

---

## Error Handling

### Common API Errors

| Error Code | Meaning | Action |
|------------|---------|--------|
| 400 | Invalid request | Check required fields, validate vertical |
| 401 | Invalid API key | Verify key format (reco_live_* or reco_test_*) |
| 422 | Unprocessable context | Context format issue, check nested objects |
| 429 | Rate limited | Implement exponential backoff |
| 500 | Server error | Retry with backoff, contact support if persistent |

### Graceful Degradation

When context is insufficient:
1. Return fewer, higher-confidence recommendations
2. Make explanations more general
3. Prompt for additional context

```json
{
  "recommendations": [...],
  "context_quality": {
    "score": 0.45,
    "suggestions": [
      "What have you enjoyed recently?",
      "Any must-haves or deal-breakers?"
    ]
  }
}
```

---

## Anti-Patterns

**What NOT to do:**

### The Generic Explanation
Writing explanations that could apply to anyone.

Bad: "This is a highly-rated option that many people enjoy."
Good: "Your preference for quiet workspaces makes this library-like cafe perfect."

### The Feature Dump
Listing item features without connecting to user context.

Bad: "This has 4K resolution, HDR, and 120Hz refresh rate."
Good: "The 120Hz refresh rate you wanted for gaming, plus the 4K you need for movie nights."

### The Confidence Mismatch
High confidence language with low confidence scores, or vice versa.

Bad: "This is PERFECT for you!" (confidence: 0.62)
Good: "This could be a good fit..." (confidence: 0.62)

### The Missing Context
Making recommendations without gathering sufficient user context.

Instead: Use context_quality feedback. If score < 0.5, gather more information first.

### The Ignored Constraints
Recommending items that violate stated constraints.

Bad: Recommending a 3-hour movie when max_runtime is 120 minutes
Better: Acknowledge the trade-off or filter it out entirely

### The Echo Chamber
Only recommending what exactly matches past behavior.

Instead: Include "stretch" recommendations with honest framing:
> "This is a bit outside your usual picks, but given your love of [X], you might enjoy [Y]."

### The Algorithmic Voice
Explanations that sound like they were written by a machine.

Bad: "Based on collaborative filtering, users with similar profiles rated this item highly."
Good: "People who share your taste for atmospheric thrillers loved this one."

---

## Implementation Checklist

Before shipping recommendation features:

- [ ] User context is rich enough (context_quality > 0.7)
- [ ] Explanations reference specific user context
- [ ] Confidence scores match explanation language
- [ ] Constraints are respected or explicitly acknowledged
- [ ] Error cases have graceful fallbacks
- [ ] Rate limiting is handled
- [ ] Test coverage includes edge cases (empty context, conflicting preferences)

---

## References

Detailed implementation guides:

- [API Reference](./references/api-reference.md) - Complete endpoint documentation, schemas, error codes
- [Context Building](./references/context-building.md) - Structuring user context for optimal results
- [Explanation Patterns](./references/explanation-patterns.md) - Crafting compelling why_match content

---

## Further Reading

- TasteRay API Documentation: https://docs.tasteray.com
- Explainable AI in Recommender Systems (Zhang & Chen, 2020)
- "Why Should I Trust You?" - Explaining Predictions of Any Classifier (Ribeiro et al., 2016)
