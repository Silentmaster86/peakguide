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

## Pakiet przygotowany na gałęzi feat/trails-poi-management

1. Edytory tras i POI w Panel → Narzędzia: wersje językowe, publikacja,
   źródła i daty, import GPX; atomowy zapis RPC i wykrywanie nowszych zmian.
2. Mapa: osobne przełączniki POI i przebiegów tras. Linie pochodzą z zapisanej
   geometrii, brak geometrii pozostawia wyłącznie wpis na liście.
3. Pierwsza partia źródłowych danych: Waligóra, Ślęża, Łysica, Skopiec, Chełmiec.
   Pięć tras, pięć POI, cztery języki. Jedna trasa ma rzeczywisty GPX (Łysica).

Ten pakiet wymaga migracji 014 i osobnego importu danych. Przygotowanie plików
nie oznacza wdrożenia na produkcję. Sprawdzić status PR i stan bazy przed działaniem.
Dokładna kolejność i granice testów: [instrukcja wydania](../releases/catalogue-management.md).
Źródła, zakresy liczb i cofanie: [partia 01](../catalogue/batch-01/README.md).

## Kolejność dalszych prac

| Priorytet | Zadanie | Kiedy uznać za skończone |
|---|---|---|
| 1 | Wdrożyć pakiet edytorów i partii 01 według instrukcji | Migracja, kontrolowany test admin/user, import i sprawdzenie pięciu stron/mapy |
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
