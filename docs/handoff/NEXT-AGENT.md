# PeakGuide — karta dla kolejnego agenta

Stan: 15 listopada 2026. Repo: Silentmaster86/peakguide.
Produkcja: https://peak-guide.netlify.app/. React/Vite w `peakguide_front`, Supabase.
Języki UI/danych: pl/en/ua/zh; poczta: pl/en/uk/zh. Chiński uproszczony.

## Co już działa

PR #1–#11 są scalone (sprawdzono w GitHub). Obejmują bezpieczeństwo kont i zapis
szczytu, pocztę, jasne kafelki FAQ/pomocy z zachowaniem oryginalnego tła,
ujednolicenie kafelków szczytów/pasm/tras, lokalizację panelu, optymalizację
ładowania oraz mapę `/map` z filtrami i widokami standard/satelita/topografia.
Właściciel potwierdził odbiór powitań również po ukraińsku i chińsku, reset hasła
oraz powiadomienie o zmianie. Korekty katalogu z PR #5 zostały zastosowane.
Nie powtarzać tych operacji na podstawie starszych kart.
PR #13 i #14 są scalone: mapa ma mniejsze pinezki, ikonę panelu warstw
i domyślnie zaznaczoną, wyłączalną warstwę szczytów.

## Pakiet tras/POI — PR #12 scalony i wdrożony przez właściciela

1. Edytory tras i POI w Panel → Narzędzia: wersje językowe, publikacja,
   źródła i daty, import GPX; atomowy zapis RPC i wykrywanie nowszych zmian.
2. Mapa: osobne przełączniki POI i przebiegów tras. Linie pochodzą z zapisanej
   geometrii, brak geometrii pozostawia wyłącznie wpis na liście.
3. Pierwsza partia źródłowych danych: Waligóra, Ślęża, Łysica, Skopiec, Chełmiec.
   Pięć tras, pięć POI, cztery języki. Jedna trasa ma rzeczywisty GPX (Łysica).

Właściciel wykonał migrację 014 i import danych. Wynik catalogue_verification
potwierdził po jednej trasie i POI na każdy z pięciu szczytów, geometrię Łysicy,
cztery języki oraz oczekiwane RLS/uprawnienia. Potwierdził też wyświetlanie na stronie.
Nie powtarzać importu. Kontrolowany test zapisu przez nowe edytory pozostaje do wykonania.
Dokładna kolejność i granice testów: [instrukcja wydania](../releases/catalogue-management.md).
Źródła, zakresy liczb i cofanie: [partia 01](../catalogue/batch-01/README.md).

## Partia 02 — przygotowana, jeszcze bez importu produkcyjnego

Śnieżka, Śnieżnik, Wielka Sowa, Skalnik i Szczeliniec Wielki: pięć tras, pięć POI,
40 tłumaczeń i pięć przebiegów GPX. [Źródła i wdrożenie](../catalogue/batch-02/README.md).
Dla Śnieżnika i Skalnika metryki krótkich podejść pozostają niepotwierdzone.
Śnieżka to wejście z Białego Jaru, z odwróconym GPX i parametrami tego kierunku.
Szczeliniec opisuje wariant letni, zależny od sezonowych zasad PNGS.
Najpierw sprawdzić stan PR i wykonać `batch-02/verify.sql`. Po merge (udostępnia
pliki GPX) można wykonać osobny `apply.sql`. Nie powtarzać migracji 014/partii 01.
Agent nie wykonywał importu tej partii na produkcji.

## Kolejność dalszych prac

| Priorytet | Zadanie | Kiedy uznać za skończone |
|---|---|---|
| 1 | Sprawdzić nowe edytory tras/POI na kontrolowanym wpisie | Dodanie szkicu, edycja i ukrycie jako admin; odmowa zapisu dla zwykłego konta |
| 2 | Uzupełniać katalog partiami po pięć szczytów | Źródła i daty, zakres parametrów, PL/EN/UA/ZH, kontrola współrzędnych, import/rollback |
| 3 | Pozyskać brakujące przebiegi tras | Legalnie udostępniony GPX, zachowane segmenty, poprawny start/koniec, atrybucja i widoczność na mapie |
| 4 | Próbnie odtworzyć świeży backup w izolacji | Log restore bez zignorowanych błędów, porównanie liczników/FK/RLS, test ról i zapisów |
| 5 | Ustalić odtwarzalny pełny schemat aplikacji | Zweryfikowana baza migracji po odtworzeniu, bez danych osobowych i sekretów |
| 6 | Językowe URL i prerender SEO | Plan przekierowań, canonical/hreflang/sitemap oraz test publicznych stron bez JS |
| 7 | Pomiary wydajności i dostępności | Wyniki telefonu i klawiatury/czytnika, poprawki według pomiarów |

Nie obiecywać kompletności 89 szczytów po dodaniu pięciu. Nie wpisywać zgadywanych
metrów, czasów ani kosztów. Trasa jednostronna, powrotna i pętla mają różne zakresy.
Nie rysować przebiegu z samych współrzędnych szczytu i parkingu.

## Blokady i zasady pracy

- Brak dumpa właściciela i administracyjnego połączenia z produkcją. Backup z
  9 listopada miał tylko odczytany spis archiwum. Fixture PostGIS nie jest pełnym
  stagingiem Supabase. Szczegóły w `docs/operations/remaining-work.md`.
- Automatyczne testy używają atrap API lub osobnych baz; nie zapisują produkcji.
- Właściciel dotąd sam wykonuje merge i SQL, często na telefonie. Podawać krótkie
  kroki z linkiem do konkretnego pliku. Nie prosić o hasła, dump ani sekrety w czacie.
- Stara funkcja clever-service: przed usunięciem sprawdzić wdrożenia/logi i zachować
  źródło. Brak odwołania w repo nie dowodzi braku zewnętrznego klienta.
- Powitanie przez Gmail: worker obsługuje jedną wiadomość co pięć minut. `sent`
  oznacza przyjęcie SMTP, nie dowód dostarczenia. Nie ponawiać `uncertain` w ciemno.

## Testy i współpraca

`npm run check` oraz `npm run test:e2e` w peakguide_front. Dodatkowe projekty:
`PLAYWRIGHT_CROSS_BROWSER=1 npx playwright test --project=firefox --project=webkit`.
Test nowego pakietu: `python supabase/tests/catalogue_management_test.py` przeciwko
osobnej bazie **catalogue_management_test**. Skrypt resetuje schematy tylko w tej
nazwanej bazie. CI opisuje przygotowanie środowiska PostGIS.

Można rozdzielić badanie kolejnej partii danych, testy UI i SEO między agentów,
jeśli właściciel zleci delegowanie. Osobne gałęzie/PR, jeden agent integrujący;
nie edytować równolegle tej samej migracji ani nie wdrażać niezależnych zmian bazy.
