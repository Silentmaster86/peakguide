#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Generate SQL updates for peaks coordinates (latitude/longitude/elevation) using Wikidata.

Strategy:
1) Read peaks from DB (DATABASE_URL) with PL name.
2) Try SPARQL by exact label (fast path).
3) If missing -> use Wikidata Search API to find best QID, then fetch coords by QID via SPARQL.
4) Write coords_update.sql (BEGIN/COMMIT) + rebuild geom.

Usage:
  python scripts/generate_coords_update_sql.py

Env:
  DATABASE_URL=postgres://...
Deps:
  pip install requests psycopg2-binary
"""

import json
import os
import time
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple

import requests

# -----------------------------
# Config
# -----------------------------

SPARQL_URL = "https://query.wikidata.org/sparql"
SEARCH_URL = "https://www.wikidata.org/w/api.php"

HEADERS = {
    "User-Agent": "PeakGuideCoordsBot/1.1 (local script; contact: none)",
    "Accept": "application/sparql-results+json",
}

TIMEOUT = 45
RETRIES = 4
SLEEP_BETWEEN = 1.2
SLEEP_EACH = 0.15

CACHE_PATH = "scripts/.wikidata_cache.json"
OUT_SQL = "coords_update.sql"

# Optional manual nudges (no “rejon/okolice”)
OVERRIDES = {
  "iwinka": { "search": "Iwinka" },
  "czarna-gora-bystrzyckie": {"search": "Czarna Góra"},
  "wolek": { "search": "Wołek" },
  "sokolik-wielki": { "search": "Sokolik" },
  "rudawiec-zlote": {"search": "Rudawiec"},
  "srebrna-gora": {"search": "Srebrna Kopa"},
  "kudla-wyspowy": {"search": "Kudłacze"},
  "lakowa-wyspowy": {"search": "Łackowa"},
  "lysica-skarpowa": {"search": "Łysica"},
}



# -----------------------------
# Optional: DB read
# -----------------------------
def try_read_peaks_from_db() -> Optional[List[Dict]]:
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("❌ DATABASE_URL not set.")
        return None

    try:
        import psycopg2  # type: ignore
    except Exception:
        print("❌ psycopg2 missing. Install: pip install psycopg2-binary")
        return None

    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        cur.execute(
            """
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
            """
        )
        rows = cur.fetchall()
        cur.close()
        conn.close()

        out = []
        for r in rows:
            out.append(
                {
                    "slug": r[0],
                    "elevation_m": r[1],
                    "latitude": r[2],
                    "longitude": r[3],
                    "is_korona": bool(r[4]),
                    "range_id": int(r[5]) if r[5] is not None else None,
                    "name": r[6],
                }
            )
        return out
    except Exception as e:
        print("❌ DB read failed:", e)
        return None


# -----------------------------
# Wikidata helpers
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


def _request_json(url: str, params: Dict) -> Dict:
    last_err = None
    for attempt in range(1, RETRIES + 1):
        try:
            res = requests.get(url, params=params, headers=HEADERS, timeout=TIMEOUT)
            if res.status_code == 429:
                wait = 2.0 * attempt
                print(f"⚠️ 429 rate limit, sleeping {wait:.1f}s...")
                time.sleep(wait)
                continue
            res.raise_for_status()
            return res.json()
        except Exception as e:
            last_err = e
            if attempt == RETRIES:
                break
            wait = SLEEP_BETWEEN * attempt
            print(f"⚠️ HTTP error (attempt {attempt}/{RETRIES}): {e} — sleeping {wait:.1f}s")
            time.sleep(wait)
    raise RuntimeError(f"HTTP failed: {last_err}")


def sparql(query: str) -> Dict:
    return _request_json(SPARQL_URL, {"query": query, "format": "json"})


def wd_search(text: str, lang: str = "pl", limit: int = 8) -> List[Dict]:
    # Wikidata Search API (wbsearchentities)
    params = {
        "action": "wbsearchentities",
        "format": "json",
        "language": lang,
        "uselang": lang,
        "search": text,
        "limit": limit,
    }
    data = _request_json(SEARCH_URL, params)
    return data.get("search", []) or []

def build_query_by_label(label: str) -> str:
    # Exact label match in Polish (fast path)
    # NOTE: many items won't have exact PL label -> fallback search will handle it
    return f"""
SELECT ?item ?itemLabel ?coord ?elev WHERE {{
  ?item rdfs:label "{label}"@pl .
  OPTIONAL {{ ?item wdt:P625 ?coord. }}
  OPTIONAL {{ ?item wdt:P2044 ?elev. }}
  SERVICE wikibase:label {{ bd:serviceParam wikibase:language "pl,en". }}
}}
LIMIT 8
""".strip()


def build_query_by_search(term: str) -> str:
    # Wikidata search (mwapi) -> zwraca najlepiej pasujące encje, potem bierzemy coord/elev
    # Uwaga: ograniczamy do PL/EN label i bierzemy top 8 wyników
    return f"""
SELECT ?item ?itemLabel ?coord ?elev WHERE {{
  SERVICE wikibase:mwapi {{
    bd:serviceParam wikibase:api "EntitySearch" .
    bd:serviceParam wikibase:endpoint "www.wikidata.org" .
    bd:serviceParam mwapi:search "{term}" .
    bd:serviceParam mwapi:language "pl" .
    bd:serviceParam mwapi:limit "8" .
    ?item wikibase:apiOutputItem mwapi:item .
  }}
  OPTIONAL {{ ?item wdt:P625 ?coord. }}
  OPTIONAL {{ ?item wdt:P2044 ?elev. }}
  SERVICE wikibase:label {{ bd:serviceParam wikibase:language "pl,en". }}
}}
""".strip()



def build_query_by_qid(qid: str) -> str:
    return f"""
SELECT ?item ?itemLabel ?coord ?elev WHERE {{
  BIND(wd:{qid} AS ?item)
  OPTIONAL {{ ?item wdt:P625 ?coord. }}
  OPTIONAL {{ ?item wdt:P2044 ?elev. }}
  SERVICE wikibase:label {{ bd:serviceParam wikibase:language "pl,en". }}
}}
LIMIT 1
""".strip()


def parse_coord(coord_str: str) -> Tuple[float, float]:
    # Point(lon lat)
    coord_str = coord_str.replace("Point(", "").replace(")", "").strip()
    parts = coord_str.split()
    lon = float(parts[0])
    lat = float(parts[1])
    return lat, lon


def pick_best(bindings: List[Dict], fallback_label: str) -> Optional[WdResult]:
    candidates: List[WdResult] = []
    for b in bindings:
        if "coord" not in b:
            continue
        qid = b["item"]["value"].split("/")[-1]
        label = b.get("itemLabel", {}).get("value", fallback_label)
        lat, lon = parse_coord(b["coord"]["value"])
        elev = None
        if "elev" in b:
            try:
                elev = int(round(float(b["elev"]["value"])))
            except Exception:
                elev = None
        candidates.append(WdResult(lat=lat, lon=lon, elev_m=elev, qid=qid, label=label))

    if not candidates:
        return None

    # Prefer with elevation
    with_elev = [c for c in candidates if c.elev_m is not None]
    return with_elev[0] if with_elev else candidates[0]


def fetch_by_label(label: str, cache: Dict[str, Dict]) -> Optional[WdResult]:
    cache_key = f"label:{label}"
    if cache_key in cache:
        c = cache[cache_key]
        return WdResult(lat=c["lat"], lon=c["lon"], elev_m=c.get("elev_m"), qid=c["qid"], label=c["label"])

    data = sparql(build_query_by_label(label))
    bindings = data.get("results", {}).get("bindings", []) or []
    best = pick_best(bindings, label)
    if best:
        cache[cache_key] = {"lat": best.lat, "lon": best.lon, "elev_m": best.elev_m, "qid": best.qid, "label": best.label}
    return best


def fetch_by_qid(qid: str, fallback_label: str, cache: Dict[str, Dict]) -> Optional[WdResult]:
    cache_key = f"qid:{qid}"
    if cache_key in cache:
        c = cache[cache_key]
        return WdResult(lat=c["lat"], lon=c["lon"], elev_m=c.get("elev_m"), qid=c["qid"], label=c["label"])

    data = sparql(build_query_by_qid(qid))
    bindings = data.get("results", {}).get("bindings", []) or []
    best = pick_best(bindings, fallback_label)
    if best:
        cache[cache_key] = {"lat": best.lat, "lon": best.lon, "elev_m": best.elev_m, "qid": best.qid, "label": best.label}
    return best


def pick_search_qid(results: List[Dict]) -> Optional[str]:
    # Prefer entries that look like mountain/peak in description
    if not results:
        return None
    def score(r: Dict) -> int:
        desc = (r.get("description") or "").lower()
        s = 0
        for kw in ["góra", "szczyt", "wzniesienie", "mountain", "peak", "summit", "hill"]:
            if kw in desc:
                s += 10
        # prefer exact label-like match (title)
        return s
    results_sorted = sorted(results, key=score, reverse=True)
    return results_sorted[0].get("id")


# -----------------------------
# Main
# -----------------------------
def sql_escape(s: str) -> str:
    return s.replace("'", "''")


def main() -> int:
    peaks = try_read_peaks_from_db()
    if peaks is None:
        return 1

    cache = load_cache()
    updates: List[str] = []
    missing: List[str] = []

    for p in peaks:
        slug = p["slug"]
        name = p.get("name") or slug

        # fix ONLY nearby (not korona) — change if you want all:
        if p.get("is_korona") is True:
            continue

        ov = OVERRIDES.get(slug)
        search_text = ov["search"] if ov and "search" in ov else name

        try:
            # 1) Fast path: try exact label SPARQL
            best = fetch_by_label(search_text, cache)

            # 2) Fallback: Wikidata search -> QID -> SPARQL
            if not best:
                hits = wd_search(search_text, lang="pl", limit=8)
                qid = pick_search_qid(hits)
                if qid:
                    best = fetch_by_qid(qid, search_text, cache)

            if not best:
                missing.append(f"{slug}: {search_text}")
                continue

            lat = round(best.lat, 6)
            lon = round(best.lon, 6)

            if best.elev_m is not None:
                updates.append(
                    f"UPDATE peaks SET latitude={lat}, longitude={lon}, elevation_m={best.elev_m} WHERE slug='{sql_escape(slug)}';"
                )
            else:
                updates.append(
                    f"UPDATE peaks SET latitude={lat}, longitude={lon} WHERE slug='{sql_escape(slug)}';"
                )

            time.sleep(SLEEP_EACH)

        except Exception as e:
            missing.append(f"{slug}: {search_text} (ERR: {e})")

    updates.append("")
    updates.append("-- Rebuild geom for all peaks with coords")
    updates.append(
        """
UPDATE peaks
SET geom = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
""".strip()
    )

    with open(OUT_SQL, "w", encoding="utf-8") as f:
        f.write("-- Auto-generated by scripts/generate_coords_update_sql.py\n")
        f.write("BEGIN;\n\n")
        for line in updates:
            f.write(line + "\n")
        f.write("\nCOMMIT;\n")

    save_cache(cache)

    # count updates: everything except geom block and empty line and comment
    update_count = sum(1 for x in updates if x.startswith("UPDATE peaks SET latitude"))
    print(f"✅ Wrote {OUT_SQL} with {update_count} peak updates (+ geom rebuild)")
    if missing:
        print(f"⚠ Missing/Errors ({len(missing)}):")
        for m in missing[:60]:
            print("  -", m)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
