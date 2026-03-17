import httpx
from datetime import datetime, timezone
from app.config import settings

# No API key needed for public Bluesky search
BSKY_SEARCH_URL = "https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts"

# Keywords we monitor for urban safety signals
RISK_KEYWORDS = [
    "accident", "crash", "flood", "fire", "traffic jam",
    "road block", "heavy rain", "emergency", "stampede",
    "Indore accident", "Indore flood", "Indore fire",
]

# Weight each keyword by severity
KEYWORD_WEIGHTS = {
    "accident":       0.3,
    "crash":          0.3,
    "flood":          0.4,
    "fire":           0.35,
    "traffic jam":    0.15,
    "road block":     0.2,
    "heavy rain":     0.2,
    "emergency":      0.25,
    "stampede":       0.5,
    "Indore accident":0.4,
    "Indore flood":   0.5,
    "Indore fire":    0.45,
}


async def fetch_social_signals() -> list:
    """
    Search Bluesky public posts for risk-related keywords.
    No authentication required.
    Returns list of relevant posts with metadata.
    """
    all_posts = []

    async with httpx.AsyncClient(timeout=10.0) as client:
        for keyword in RISK_KEYWORDS[:5]:   # limit to 5 keywords per cycle
            try:
                params = {
                    "q":     keyword,
                    "limit": 10,
                    "sort":  "latest",
                }
                response = await client.get(BSKY_SEARCH_URL, params=params)

                if response.status_code != 200:
                    continue

                data = response.json()
                posts = data.get("posts", [])

                for post in posts:
                    record = post.get("record", {})
                    author = post.get("author", {})

                    all_posts.append({
                        "keyword":    keyword,
                        "post_id":    post.get("uri"),
                        "text":       record.get("text", ""),
                        "author":     author.get("handle"),
                        "created_at": record.get("createdAt"),
                        "like_count": post.get("likeCount", 0),
                        "weight":     KEYWORD_WEIGHTS.get(keyword, 0.1),
                    })

            except Exception as e:
                print(f"[Bluesky] Error fetching '{keyword}': {e}")
                continue

    return all_posts


def compute_social_risk_score(posts: list) -> float:
    """
    Convert social posts into a 0.0 - 1.0 risk signal.
    More posts + higher weighted keywords = higher score.
    Treated as a weak supplementary signal only.
    """
    if not posts:
        return 0.0

    # Sum up weights of matched keyword posts
    total_weight = sum(p.get("weight", 0.1) for p in posts)

    # Normalize: cap contribution so social
    # signal never dominates the final risk score
    score = min(total_weight * 0.05, 0.3)

    return round(score, 3)


def extract_social_summary(posts: list) -> dict:
    """
    Return a human-readable summary for the
    Explainable AI panel on the frontend.
    """
    if not posts:
        return {"total_posts": 0, "top_keywords": [], "sample_texts": []}

    keyword_counts = {}
    for post in posts:
        kw = post.get("keyword", "")
        keyword_counts[kw] = keyword_counts.get(kw, 0) + 1

    top_keywords = sorted(
        keyword_counts.items(),
        key=lambda x: x[1],
        reverse=True
    )[:3]

    sample_texts = [
        p["text"][:100] for p in posts[:3] if p.get("text")
    ]

    return {
        "total_posts":  len(posts),
        "top_keywords": [k for k, _ in top_keywords],
        "sample_texts": sample_texts,
    }