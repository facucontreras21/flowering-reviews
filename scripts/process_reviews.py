from __future__ import annotations

import json
import math
import random
import re
import unicodedata
from pathlib import Path
from typing import Any

import pycountry


PROJECT_ROOT = Path(__file__).resolve().parents[1]
RAW_FILE = PROJECT_ROOT / "data" / "raw" / "reviews.json"
PROCESSED_FILE = PROJECT_ROOT / "data" / "processed" / "garden_reviews.json"


COUNTRY_NAME_FALLBACKS = {
    "argentina": "Argentina",
    "australia": "Australia",
    "austria": "Austria",
    "belgica": "Belgium",
    "bélgica": "Belgium",
    "brasil": "Brazil",
    "chequia": "Czechia",
    "ciudad del vaticano": "Holy See",
    "croacia": "Croatia",
    "corea del sur": "South Korea",
    "alemania": "Germany",
    "eslovaquia": "Slovakia",
    "espana": "Spain",
    "españa": "Spain",
    "francia": "France",
    "grecia": "Greece",
    "hungria": "Hungary",
    "hungría": "Hungary",
    "indonesia": "Indonesia",
    "italia": "Italy",
    "malasia": "Malaysia",
    "malaysia": "Malaysia",
    "paises bajos": "Netherlands",
    "países bajos": "Netherlands",
    "suiza": "Switzerland",
    "turquia": "Turkey",
    "turquía": "Turkey",
    "vietnam": "Vietnam",
}


def load_reviews(file_path: Path) -> list[dict[str, Any]]:
    if not file_path.exists():
        raise FileNotFoundError(f"Raw file not found: {file_path}")

    with file_path.open("r", encoding="utf-8") as f:
        data = json.load(f)

    if isinstance(data, list):
        return data

    if isinstance(data, dict) and isinstance(data.get("features"), list):
        return data["features"]

    raise ValueError("Unsupported JSON structure.")


def safe_get_coordinates(feature: dict[str, Any]) -> tuple[float | None, float | None]:
    geometry = feature.get("geometry", {})
    coordinates = geometry.get("coordinates")

    if not isinstance(coordinates, list) or len(coordinates) < 2:
        return None, None

    lon, lat = coordinates[0], coordinates[1]

    if not isinstance(lon, (int, float)) or not isinstance(lat, (int, float)):
        return None, None

    lon = float(lon)
    lat = float(lat)

    if lon == 0 and lat == 0:
        return None, None

    return lon, lat


def normalize_whitespace(text: str | None) -> str:
    if not text or not isinstance(text, str):
        return ""

    return re.sub(r"\s+", " ", text).strip()


def strip_accents(text: str) -> str:
    normalized = unicodedata.normalize("NFKD", text)
    return "".join(char for char in normalized if not unicodedata.combining(char))


def normalize_country_candidate(text: str) -> str:
    text = normalize_whitespace(text).lower()
    text = strip_accents(text)
    text = re.sub(r"^\d+\s*", "", text)
    return text.strip()


def country_from_code(country_code: str | None) -> str | None:
    if not country_code or not isinstance(country_code, str):
        return None

    country = pycountry.countries.get(alpha_2=country_code.upper().strip())

    if country:
        return country.name

    return None


def country_from_address(address: str | None) -> str | None:
    if not address or not isinstance(address, str):
        return None

    parts = [part.strip() for part in address.split(",") if part.strip()]

    for part in reversed(parts):
        candidate = normalize_country_candidate(part)

        if not candidate:
            continue

        if "unnamed road" in candidate:
            continue

        if candidate in COUNTRY_NAME_FALLBACKS:
            return COUNTRY_NAME_FALLBACKS[candidate]

        try:
            country = pycountry.countries.lookup(candidate)
            return country.name
        except LookupError:
            continue

    return None


def infer_country_from_coordinates(lon: float, lat: float) -> str | None:
    if -56 <= lat <= -21 and -74 <= lon <= -53:
        return "Argentina"

    if -44 <= lat <= -10 and 112 <= lon <= 154:
        return "Australia"

    if -11 <= lat <= 6 and 95 <= lon <= 141:
        return "Indonesia"

    if 33 <= lat <= 39 and 124 <= lon <= 132:
        return "South Korea"

    if 8 <= lat <= 24 and 102 <= lon <= 110:
        return "Vietnam"

    if 45 <= lat <= 49 and 16 <= lon <= 23:
        return "Hungary"

    if 35 <= lat <= 42 and 19 <= lon <= 29:
        return "Greece"

    if 35 <= lat <= 48 and 6 <= lon <= 19:
        return "Italy"

    if 41 <= lat <= 51 and -5 <= lon <= 9:
        return "France"

    if 47 <= lat <= 55 and 5 <= lon <= 16:
        return "Germany"

    if 49 <= lat <= 53 and 2 <= lon <= 7:
        return "Belgium"

    if 50 <= lat <= 54 and 3 <= lon <= 8:
        return "Netherlands"

    if 45 <= lat <= 48 and 5 <= lon <= 11:
        return "Switzerland"

    if 40 <= lat <= 46 and 13 <= lon <= 20:
        return "Croatia"

    if 47 <= lat <= 50 and 16 <= lon <= 23:
        return "Slovakia"

    if 48 <= lat <= 51 and 12 <= lon <= 19:
        return "Czechia"

    if 46 <= lat <= 49 and 9 <= lon <= 17:
        return "Austria"

    if 36 <= lat <= 44 and -10 <= lon <= 4:
        return "Spain"

    if 36 <= lat <= 42 and 26 <= lon <= 45:
        return "Turkey"

    if -34 <= lat <= 6 and -74 <= lon <= -34:
        return "Brazil"

    return None


def extract_country(location: dict[str, Any], lon: float, lat: float) -> str:
    country = country_from_code(location.get("country_code"))

    if country:
        return country

    country = country_from_address(location.get("address"))

    if country:
        return country

    country = infer_country_from_coordinates(lon, lat)

    if country:
        return country

    return "Unknown"


def compute_flower_count(text_length: int) -> int:
    if text_length <= 0:
        return 1

    return max(1, min(8, math.ceil(text_length / 80)))


def compute_height(rating: int) -> float:
    height_map = {
        1: 45.0,
        2: 65.0,
        3: 85.0,
        4: 110.0,
        5: 135.0,
    }

    return height_map.get(rating, 85.0)


def compute_life_state(rating: int) -> str:
    if rating in (1, 2):
        return "dies"

    if rating in (4, 5):
        return "lives"

    return random.choice(["lives", "dies"])


def slugify(text: str) -> str:
    text = strip_accents(text)
    text = text.lower().strip()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    text = re.sub(r"-+", "-", text).strip("-")

    return text or "unknown-place"


def transform_review(feature: dict[str, Any], index: int) -> dict[str, Any] | None:
    properties = feature.get("properties", {})
    location = properties.get("location", {})

    if not isinstance(location, dict):
        return None

    lon, lat = safe_get_coordinates(feature)
    rating = properties.get("five_star_rating_published")
    place_name = location.get("name")
    review_text = normalize_whitespace(properties.get("review_text_published"))
    date = properties.get("date")
    google_maps_url = properties.get("google_maps_url")

    if lon is None or lat is None:
        return None

    if not isinstance(rating, int) or rating not in (1, 2, 3, 4, 5):
        return None

    if not place_name or not isinstance(place_name, str):
        return None

    country = extract_country(location, lon, lat)
    text_length = len(review_text)

    return {
        "id": f"{slugify(place_name)}-{index}",
        "place_name": normalize_whitespace(place_name),
        "country": country,
        "lon": lon,
        "lat": lat,
        "rating": rating,
        "review_text": review_text,
        "text_length": text_length,
        "flower_count": compute_flower_count(text_length),
        "life_state": compute_life_state(rating),
        "height": compute_height(rating),
        "date": date,
        "google_maps_url": google_maps_url,
    }


def process_reviews(raw_reviews: list[dict[str, Any]]) -> list[dict[str, Any]]:
    processed_reviews: list[dict[str, Any]] = []

    for index, feature in enumerate(raw_reviews, start=1):
        transformed = transform_review(feature, index)

        if transformed is not None:
            processed_reviews.append(transformed)

    return processed_reviews


def save_processed_reviews(data: list[dict[str, Any]], file_path: Path) -> None:
    file_path.parent.mkdir(parents=True, exist_ok=True)

    with file_path.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def main() -> None:
    random.seed(42)

    raw_reviews = load_reviews(RAW_FILE)
    processed_reviews = process_reviews(raw_reviews)
    save_processed_reviews(processed_reviews, PROCESSED_FILE)

    countries = sorted({review["country"] for review in processed_reviews})

    print(f"Raw reviews loaded: {len(raw_reviews)}")
    print(f"Processed reviews saved: {len(processed_reviews)}")
    print(f"Countries found: {countries}")
    print(f"Output file: {PROCESSED_FILE}")


if __name__ == "__main__":
    main()