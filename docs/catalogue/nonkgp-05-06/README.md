# Wspólne wgrywanie 05 + 06 — pięć szczytów

**Wdrożenie potwierdzone przez właściciela 25 listopada 2026.**
Dwa rozłączne, przejrzane pakiety z PR #40: Stóg Izerski,
Wysoki Kamień, Czarna Góra, Kalenica i Wieżyca. 5 tras/GPX, 5 POI, 40 tekstów
PL/EN/UA/ZH, 748 punktów źródłowych. Nie zmieniamy szczytów ani uprawnień.
#37/#38 już zweryfikowane przez właściciela — nie są częścią tego importu.

## Potwierdzony wynik — nie powtarzać

Właściciel przekazał pełne 5/5 wierszy: po 1 trasie, POI i geometrii,
oba zestawy `[en,pl,ua,zh]`, `review_matches=true` i `package_applied=true`.
[Zapis wyniku](production-verification.json) jest zgłoszeniem właściciela,
nie deklaracją administracyjnego odczytu ani mutacji agenta.
Nie uruchamiać ponownie wspólnego lub osobnych apply 05/06.

## Historia wykonanej procedury (nie jest listą następnych kroków)

1. Zachowaj aktualny backup. GitHub → ten folder → `apply.sql` → **Raw** → skopiuj
   całość do nowego zapytania Supabase SQL Editor i uruchom jako właściciel.
2. W osobnym zapytaniu uruchom cały `verify.sql` z tego samego folderu.
3. Oczekuj **5 wierszy**: `nonkgp-05` ma 2, `nonkgp-06` ma 3. W każdym
   trails=1, pois=1, mapped_trails=1, oba zestawy `[en,pl,ua,zh]`,
   review_matches=true i package_applied=true. Wiersze rozróżnia batch_key.
4. Sprawdź nowe trasy i POI na stronie. Dopiero verify potwierdza import produkcyjny.

Wspólny apply jest **jedną transakcją** zachowującą wszystkie zabezpieczenia
obu pakietów. Konflikt lub błąd tłumaczenia w drugim cofa zmiany całego bieżącego
uruchomienia. Jeśli jedna partia była wcześniej poprawnie zatwierdzona osobno,
pozostaje bez zmian; jej chronione powtórzenie jest no-op. Późniejsze edycje blokują
powtórzenie zgodnie z oryginalnymi rejestrami, nie są nadpisywane.

Nie uruchamiaj potem osobnych apply 05/06 jako kolejnych kroków. Są zachowane
jako alternatywa/źródło generatora. Nie ma automatycznego importu po merge ani
harmonogramu. Rollbacki pojedynczych partii służą tylko do kontrolowanego wycofania;
nie wchodzą w zwykłą procedurę. Błędu kontroli nie omijaj — zachowaj komunikat.

Źródła, parametry, końce tras i ograniczenia: [partia 05](../nonkgp-05/README.md),
[partia 06](../nonkgp-06/README.md). Iwinka, Postawna, Anielska Kopa i Dzikowiec
pozostają poza tym importem; ich niepewności są jawnie zapisane w unresolved.json.

Pliki są ASCII-only z Unicode w JSON, generowane deterministycznie przez
`scripts/build_nonkgp_05_06.py`. CI sprawdza zgodność z oryginalnymi pakietami,
5 typowanych wyników, powtórzenie i rzeczywisty rollback obu nowych partii po
konflikcie/błędzie w drugiej. Lokalne fixture nie zastępują restore prywatnego backupu.
