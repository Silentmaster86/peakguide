#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Generate SQL updates for peaks coordinates (latitude/longitude/elevation) using Wikidata.
- Reads peaks from your DB (requires DATABASE_URL) OR from local list fallback.
- Writes: coords_update.sql
- Adds: final geom rebuild for PostGIS (ST_SetSRID(ST_MakePoint(...),4326))

Usage:
  python scripts/generate_coords_update_sql.py

Env:
  DATABASE_URL=postgres://... (optional but recommended)
"""

import json
import os
import sys
import time
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple

import requests

# -----------------------------
# Config
# -----------------------------

SPARQL_URL = "https://query.wikidata.org/sparql"
HEADERS = {
    "User-Agent": "PeakGuideCoordsBot/1.0 (local script; contact: none)",
    "Accept": "application/sparql-results+json",
}

TIMEOUT = 45
RETRIES = 4
SLEEP_BETWEEN = 1.2

CACHE_PATH = "scripts/.wikidata_cache.json"
OUT_SQL = "coords_update.sql"

# If some names are ambiguous, add hints here.
# key = slug, value = (label_to_search, optional_extra_hint_text)
# You can extend this list anytime.
OVERRIDES: Dict[str, str] = {
    # Example (fill if needed):
    # "sokolik-wielki": "Sokolik Wielki (Rudawy Janowickie)",
}

# -----------------------------
# Optional: DB read
# -----------------------------
def try_read_peaks_from_db() -> Optional[List[Dict]]:
    """
    Reads peaks from Postgres if DATABASE_URL is set.
    Uses a simple SELECT so no extra deps besides 'psycopg2' are required,
    but if psycopg2 isn't installed, we skip DB and use fallback.
    """
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        return None

    try:
        import psycopg2  # type: ignore
    except Exception:
        print("ℹ️ psycopg2 not installed, skipping DB read. (pip install psycopg2-binary)")
        return None

    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        cur.execute("""
            SELECT p.slug,
                   p.elevation_m,
                   p.latitude,
                   p.longitude,
                   p.is_korona,
                   p.range_id,
                   COALESCE(pi.name, p.slug) AS name_pl
            FROM peaks p
            LEFT JOIN peaks_i18n pi ON pi.peak_id = p.id AND pi.lang = 'pl'
            ORDER BY p.is_korona DESC, p.range_id, p.elevation_m DESC;
        """)
        rows = cur.fetchall()
        cur.close()
        conn.close()

        out = []
        for r in rows:
            out.append({
                "slug": r[0],
                "elevation_m": r[1],
                "latitude": r[2],
                "longitude": r[3],
                "is_korona": bool(r[4]),
                "range_id": int(r[5]) if r[5] is not None else None,
                "name": r[6],
            })
        return out
    except Exception as e:
        print("❌ DB read failed:", e)
        return None

# -----------------------------
# SPARQL helpers
# -----------------------------

@dataclass
class WdResult:
    lat: float
    lon: float
    elev_m: Optional[int]
    qid: str
    label: str

def load_cache() -> Dict[str, Dict]:
    if not os.path.exists(CACHE_PATH):
        return {}
    try:
        with open(CACHE_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}

def save_cache(cache: Dict[str, Dict]) -> None:
    os.makedirs(os.path.dirname(CACHE_PATH), exist_ok=True)
    with open(CACHE_PATH, "w", encoding="utf-8") as f:
        json.dump(cache, f, ensure_ascii=False, indent=2)

def sparql(query: str) -> Dict:
    for attempt in range(1, RETRIES + 1):
        try:
            res = requests.get(
                SPARQL_URL,
                params={"query": query, "format": "json"},
                headers=HEADERS,
                timeout=TIMEOUT,
            )
            if res.status_code == 429:
                # rate-limited
                wait = 2.0 * attempt
                print(f"⚠️ 429 rate limit, sleeping {wait:.1f}s...")
                time.sleep(wait)
                continue
            res.raise_for_status()
            return res.json()
        except Exception as e:
            if attempt == RETRIES:
                raise
            wait = SLEEP_BETWEEN * attempt
            print(f"⚠️ SPARQL error (attempt {attempt}/{RETRIES}): {e} — sleeping {wait:.1f}s")
            time.sleep(wait)
    raise RuntimeError("SPARQL failed")

def build_query_by_label(label: str) -> str:
    # We try to find a "mountain/peak" with coordinates.
    # Using multiple possible classes because Wikidata can be inconsistent.
    return f"""
SELECT ?item ?itemLabel ?coord ?elev WHERE {{
  ?item rdfs:label "{label}"@pl .
  OPTIONAL {{ ?item wdt:P625 ?coord. }}
  OPTIONAL {{ ?item wdt:P2044 ?elev. }}
  SERVICE wikibase:label {{ bd:serviceParam wikibase:language "pl,en". }}
}}
LIMIT 5
""".strip()

def parse_coord(coord_str: str) -> Tuple[float, float]:
    # coord is like "Point(15.739167 50.735833)"
    # format: Point(lon lat)
    coord_str = coord_str.replace("Point(", "").replace(")", "").strip()
    parts = coord_str.split()
    lon = float(parts[0])
    lat = float(parts[1])
    return lat, lon

def pick_best(bindings: List[Dict], fallback_label: str) -> Optional[WdResult]:
    # Filter those with coord, prefer items with elevation or label match
    candidates: List[WdResult] = []
    for b in bindings:
        if "coord" not in b:
            continue
        item = b["item"]["value"].split("/")[-1]
        item_label = b.get("itemLabel", {}).get("value", fallback_label)
        lat, lon = parse_coord(b["coord"]["value"])
        elev = None
        if "elev" in b:
            try:
                elev = int(round(float(b["elev"]["value"])))
            except Exception:
                elev = None
        candidates.append(WdResult(lat=lat, lon=lon, elev_m=elev, qid=item, label=item_label))

    if not candidates:
        return None

    # prefer ones with elevation
    with_elev = [c for c in candidates if c.elev_m is not None]
    if with_elev:
        return with_elev[0]
    return candidates[0]

def fetch_wikidata(label: str, cache: Dict[str, Dict]) -> Optional[WdResult]:
    if label in cache:
        c = cache[label]
        return WdResult(lat=c["lat"], lon=c["lon"], elev_m=c.get("elev_m"), qid=c["qid"], label=c["label"])

    q = build_query_by_label(label)
    data = sparql(q)
    bindings = data.get("results", {}).get("bindings", [])
    best = pick_best(bindings, label)
    if best:
        cache[label] = {"lat": best.lat, "lon": best.lon, "elev_m": best.elev_m, "qid": best.qid, "label": best.label}
    return best

# -----------------------------
# Main generate
# -----------------------------

def sql_escape(s: str) -> str:
    return s.replace("'", "''")

def main() -> int:
    peaks = try_read_peaks_from_db()
    if peaks is None:
        print("❌ No DB data. Set DATABASE_URL or install psycopg2-binary.")
        print("   Example: pip install psycopg2-binary")
        return 1

    cache = load_cache()

    updates: List[str] = []
    missing: List[str] = []

    for p in peaks:
        slug = p["slug"]
        name = p.get("name") or slug

        # Only fix NEARBY peaks (is_korona = false) — change to True if you want all.
        if p.get("is_korona") is True:
            continue

        label = OVERRIDES.get(slug, name)

        try:
            best = fetch_wikidata(label, cache)
            if not best:
                missing.append(f"{slug}: {label}")
                continue

            lat = round(best.lat, 6)
            lon = round(best.lon, 6)

            # If Wikidata provides elevation, keep it; otherwise leave current DB elevation_m as-is.
            if best.elev_m is not None:
                updates.append(
                    f"UPDATE peaks SET latitude={lat}, longitude={lon}, elevation_m={best.elev_m} WHERE slug='{sql_escape(slug)}';"
                )
            else:
                updates.append(
                    f"UPDATE peaks SET latitude={lat}, longitude={lon} WHERE slug='{sql_escape(slug)}';"
                )

            time.sleep(0.15)  # be nice to endpoint
        except Exception as e:
            missing.append(f"{slug}: {label} (ERR: {e})")

    # Always rebuild geom at end (critical for PostGIS ST_Distance)
    updates.append("")
    updates.append("-- Rebuild geom for all peaks with coords")
    updates.append("""
UPDATE peaks
SET geom = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
""".strip())

    with open(OUT_SQL, "w", encoding="utf-8") as f:
        f.write("-- Auto-generated by scripts/generate_coords_update_sql.py\n")
        f.write("BEGIN;\n\n")
        for line in updates:
            f.write(line + "\n")
        f.write("\nCOMMIT;\n")

    save_cache(cache)

    print(f"✅ Wrote {OUT_SQL} with {len(updates)-3} peak updates (+ geom rebuild)")
    if missing:
        print(f"⚠ Missing/Errors ({len(missing)}):")
        for m in missing[:40]:
            print("  -", m)
        if len(missing) > 40:
            print("  ... (more)")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
