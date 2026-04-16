from __future__ import annotations

import json
import math
import random
import re
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[1]
RAW_FILE = PROJECT_ROOT / "data" / "raw" / "reviews.json"
PROCESSED_FILE = PROJECT_ROOT / "data" / "processed" / "garden_reviews.json"


def load_reviews(file_path: Path) -> list[dict[str, Any]]:
    """Load raw review data from JSON."""
    if not file_path.exists():
        raise FileNotFoundError(f"Raw file not found: {file_path}")

    with file_path.open("r", encoding="utf-8") as f:
        data = json.load(f)

    if isinstance(data, list):
        return data

    if isinstance(data, dict):
        if "features" in data and isinstance(data["features"], list):
            return data["features"]
        raise ValueError("Unsupported JSON structure: expected a list or a GeoJSON-like dict with 'features'.")

    raise ValueError("Unsupported JSON format.")


def safe_get_coordinates(feature: dict[str, Any]) -> tuple[float | None, float | None]:
    """Extract longitude and latitude from GeoJSON feature."""
    geometry = feature.get("geometry", {})
    coordinates = geometry.get("coordinates")

    if not isinstance(coordinates, list) or len(coordinates) < 2:
        return None, None

    lon, lat = coordinates[0], coordinates[1]

    if not isinstance(lon, (int, float)) or not isinstance(lat, (int, float)):
        return None, None

    return float(lon), float(lat)


def extract_country(address: str | None) -> str | None:
    """Infer country from the last part of the address."""
    if not address or not isinstance(address, str):
        return None

    parts = [part.strip() for part in address.split(",") if part.strip()]
    if not parts:
        return None

    return parts[-1]


def normalize_whitespace(text: str | None) -> str:
    """Clean repeated spaces and trim text."""
    if not text or not isinstance(text, str):
        return ""

    text = re.sub(r"\s+", " ", text).strip()
    return text


def compute_flower_count(text_length: int) -> int:
    """
    Derive number of flowers from review length.
    Keeps a minimum of 1 flower for every review.
    """
    if text_length <= 0:
        return 1

    return max(1, min(8, math.ceil(text_length / 80)))


def compute_height(rating: int) -> float:
    """Map rating to plant height."""
    height_map = {
        1: 45.0,
        2: 65.0,
        3: 85.0,
        4: 110.0,
        5: 135.0,
    }
    return height_map.get(rating, 85.0)


def compute_life_state(rating: int) -> str:
    """
    Decide if the plant lives or dies.
    - 1, 2 -> dies
    - 4, 5 -> lives
    - 3 -> random
    """
    if rating in (1, 2):
        return "dies"
    if rating in (4, 5):
        return "lives"
    return random.choice(["lives", "dies"])


def slugify(text: str) -> str:
    """Create a simple id-friendly string."""
    text = text.lower().strip()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    text = re.sub(r"-+", "-", text).strip("-")
    return text or "unknown-place"


def transform_review(feature: dict[str, Any], index: int) -> dict[str, Any] | None:
    """Transform a raw review feature into a garden-ready record."""
    properties = feature.get("properties", {})
    location = properties.get("location", {})

    lon, lat = safe_get_coordinates(feature)
    rating = properties.get("five_star_rating_published")
    place_name = location.get("name")
    address = location.get("address")
    review_text = normalize_whitespace(properties.get("review_text_published"))
    date = properties.get("date")

    if lon is None or lat is None:
        return None

    if not isinstance(rating, int) or rating not in (1, 2, 3, 4, 5):
        return None

    if not place_name or not isinstance(place_name, str):
        return None

    country = extract_country(address)
    text_length = len(review_text)
    flower_count = compute_flower_count(text_length)
    life_state = compute_life_state(rating)
    height = compute_height(rating)

    return {
        "id": f"{slugify(place_name)}-{index}",
        "place_name": place_name,
        "country": country,
        "lon": lon,
        "lat": lat,
        "rating": rating,
        "review_text": review_text,
        "text_length": text_length,
        "flower_count": flower_count,
        "life_state": life_state,
        "height": height,
        "date": date,
    }


def process_reviews(raw_reviews: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Transform all raw reviews into processed garden records."""
    processed_reviews: list[dict[str, Any]] = []

    for index, feature in enumerate(raw_reviews, start=1):
        transformed = transform_review(feature, index)
        if transformed is not None:
            processed_reviews.append(transformed)

    return processed_reviews


def save_processed_reviews(data: list[dict[str, Any]], file_path: Path) -> None:
    """Save processed reviews as JSON."""
    file_path.parent.mkdir(parents=True, exist_ok=True)

    with file_path.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def main() -> None:
    # Fixed seed so the 3-star reviews behave consistently while developing.
    random.seed(42)

    raw_reviews = load_reviews(RAW_FILE)
    processed_reviews = process_reviews(raw_reviews)
    save_processed_reviews(processed_reviews, PROCESSED_FILE)

    print(f"Raw reviews loaded: {len(raw_reviews)}")
    print(f"Processed reviews saved: {len(processed_reviews)}")
    print(f"Output file: {PROCESSED_FILE}")


if __name__ == "__main__":
    main()