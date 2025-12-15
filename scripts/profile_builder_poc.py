import argparse
import json
import re
from collections import Counter
from pathlib import Path
from typing import Any, Dict, List, Tuple

from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
from playwright.sync_api import sync_playwright


DEFAULT_USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/122.0.0.0 Safari/537.36"
)

STOPWORDS = {
    "a",
    "and",
    "are",
    "be",
    "for",
    "from",
    "in",
    "of",
    "on",
    "or",
    "the",
    "this",
    "to",
    "with",
    "you",
    "your",
    "their",
    "we",
    "us",
    "our",
    "it",
    "that",
    "as",
    "by",
    "an",
    "at",
    "will",
}


def fetch_group_payload(slug: str) -> Dict[str, Any]:
    url = f"https://www.skool.com/{slug}/about"
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(user_agent=DEFAULT_USER_AGENT)
        page = context.new_page()
        try:
            page.goto(url, wait_until="networkidle", timeout=60000)
            page.wait_for_timeout(2000)
            data = page.evaluate("window.__NEXT_DATA__")
        except PlaywrightTimeoutError as exc:
            raise RuntimeError(f"Timed out loading {url}") from exc
        finally:
            browser.close()
    group = data.get("props", {}).get("pageProps", {}).get("currentGroup")
    if not group:
        raise RuntimeError(f"Unable to locate Skool group data for slug '{slug}'")
    return group


def clean_lp_text(text: str) -> str:
    cleaned = (
        text.replace("\\n", "\n")
        .replace("\\(", "(")
        .replace("\\)", ")")
        .replace("[ol:1]", "")
        .replace("[li]", "\n- ")
        .strip()
    )
    # Collapse multiple blank lines.
    cleaned = re.sub(r"\n{2,}", "\n", cleaned)
    return cleaned


def parse_description_sections(text: str) -> Tuple[str, List[str], List[str]]:
    cleaned = clean_lp_text(text)
    lines = [line.strip() for line in cleaned.split("\n") if line.strip()]
    if not lines:
        return "", [], []

    hero = lines[0]
    features: List[str] = []
    actions: List[str] = []

    in_actions = False
    for line in lines[1:]:
        normalized = line.lstrip("- ").strip()
        if not normalized:
            continue
        if "what to do next" in normalized.lower():
            in_actions = True
            continue
        if in_actions:
            actions.append(normalized)
        else:
            features.append(normalized)

    return hero, features, actions


def extract_keywords(text: str, limit: int = 12) -> List[str]:
    tokens = re.findall(r"[A-Za-z][A-Za-z\\-]+", text.lower())
    filtered = [t for t in tokens if t not in STOPWORDS and len(t) > 2]
    counter = Counter(filtered)
    return [word for word, _ in counter.most_common(limit)]


def build_ad_strategy(
    hero: str, features: List[str], actions: List[str], keywords: List[str]
) -> Dict[str, Any]:
    summary = hero or "Community insight unavailable."
    features_lower = " ".join(features).lower()
    hooks: List[str] = []
    angles: List[Dict[str, str]] = []

    if "late" in summary.lower() or "40" in summary:
        hooks.append("Late bloomers 40+ finish your book with guided AI support.")
        angles.append(
            {
                "name": "Late Bloomer Breakthrough",
                "message": "Show how the community helps 40+ creators ship their book with accountability.",
            }
        )

    if "challenge" in features_lower:
        hooks.append("5-day Start & Shape Your Book Challenge kicks off soon.")
        angles.append(
            {
                "name": "Challenge Momentum",
                "message": "Use countdown-themed ads to drive FOMO into the December challenge.",
            }
        )

    if "ai" in features_lower or "ai" in keywords:
        hooks.append("Simple AI templates remove the tech overwhelm from writing.")
        angles.append(
            {
                "name": "AI Co-Author",
                "message": "Highlight practical AI walkthroughs tailored for non-technical authors.",
            }
        )

    if not hooks:
        hooks.append(summary[:140])

    targeting: List[str] = []
    if "40" in summary:
        targeting.append("Age 40-65 aspiring authors, writing & creativity interests.")
    if "ai" in keywords:
        targeting.append("Interest in AI writing tools, ChatGPT, Jasper, Sudowrite.")
    targeting.append("Lookalike audiences from engaged Skool members or email list.")

    calls_to_action = actions or [
        "Comment with your book idea.",
        "Join the weekly live training.",
        "Register for the upcoming challenge.",
    ]

    return {
        "hero_summary": summary,
        "hooks": hooks[:3],
        "angles": angles[:3],
        "targeting": targeting,
        "calls_to_action": calls_to_action,
    }


def build_profile(slug: str, group: Dict[str, Any]) -> Dict[str, Any]:
    metadata = group.get("metadata", {})
    hero, features, actions = parse_description_sections(metadata.get("lpDescription", ""))
    keywords = extract_keywords(
        " ".join(
            filter(
                None,
                [
                    metadata.get("description", ""),
                    metadata.get("lpDescription", ""),
                ],
            )
        )
    )

    attachments = metadata.get("lpAttachmentsData")
    media_items: List[Dict[str, str]] = []
    if attachments:
        try:
            data = json.loads(attachments).get("attachments_data", [])
            for item in data:
                image = item.get("image", {})
                if image.get("original_url"):
                    media_items.append(
                        {
                            "id": item.get("id"),
                            "url": image.get("original_url"),
                            "small": image.get("small_url"),
                        }
                    )
        except json.JSONDecodeError:
            pass

    owner = {}
    try:
        owner = json.loads(metadata.get("owner", "{}"))
    except json.JSONDecodeError:
        owner = {}

    survey = {}
    try:
        survey = json.loads(metadata.get("survey", "{}"))
    except json.JSONDecodeError:
        survey = {}

    ad_strategy = build_ad_strategy(hero, features, actions, keywords)

    owner_meta = owner.get("metadata", {}) if isinstance(owner, dict) else {}
    owner_name = owner.get("name")
    if owner.get("first_name") or owner.get("last_name"):
        owner_name = " ".join(
            part
            for part in [owner.get("first_name"), owner.get("last_name")]
            if part
        ).strip()

    return {
        "community": {
            "slug": slug,
            "name": metadata.get("displayName"),
            "tagline": metadata.get("description"),
            "hero_statement": hero,
            "color": metadata.get("color"),
            "plan": metadata.get("plan"),
            "privacy": metadata.get("privacy"),
            "members": metadata.get("totalMembers"),
            "online_members": metadata.get("totalOnlineMembers"),
            "posts": metadata.get("totalPosts"),
            "courses": metadata.get("numCourses"),
            "modules": metadata.get("numModules"),
            "created_at": group.get("createdAt"),
            "updated_at": group.get("updatedAt"),
        },
        "owner": {
            "id": owner.get("id"),
            "name": owner_name,
            "location": owner_meta.get("location"),
            "bio": owner_meta.get("bio"),
        },
        "value_stack": {
            "promise": hero,
            "experience": features,
            "next_steps": actions,
        },
        "keywords": keywords,
        "media": media_items,
        "survey_questions": survey.get("survey", []),
        "ad_strategy": ad_strategy,
    }


def run(slug: str, output_dir: Path) -> Dict[str, Any]:
    group = fetch_group_payload(slug)
    profile = build_profile(slug, group)
    output_dir.mkdir(parents=True, exist_ok=True)
    output_file = output_dir / f"{slug}.json"
    output_file.write_text(json.dumps(profile, indent=2))
    return profile


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate a Skool community profile from the public about page."
    )
    parser.add_argument("slug", help="Community slug, e.g. 'the-creators-hub-9795'")
    parser.add_argument(
        "--out", default="profiles", help="Directory to store generated profile JSON."
    )
    args = parser.parse_args()

    profile = run(args.slug, Path(args.out))
    print(
        f"Profile saved to {args.out}/{args.slug}.json "
        f"(members: {profile['community']['members']})"
    )


if __name__ == "__main__":
    main()
