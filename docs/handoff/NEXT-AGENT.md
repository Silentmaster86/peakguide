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

## Pakiet 20 szczytów — PR #15 scalony, import oczekuje na backup

Na prośbę właściciela rozszerzono poprzednią piątkę do 20 szczytów łącznie.
[Jedna instrukcja i pliki SQL](../catalogue/twenty-peaks/README.md):
20 tras, 20 POI, 20 GPX i 160 tłumaczeń PL/EN/UA/ZH.
Zawiera niezmienioną partię 02 (Śnieżka, Śnieżnik, Wielka Sowa, Skalnik,
Szczeliniec Wielki) oraz partię 03 (Rudawiec, Orlica, Jagodna, Kowadło,
Kłodzka Góra, Biskupia Kopa, Babia Góra, Tarnica, Turbacz, Radziejowa,
Lubomir, Mogielica, Czupel, Skrzyczne, Wysoka w Pieninach).

Najpierw `twenty-peaks/verify.sql` (odczyt), potem świeży backup, merge PR
(udostępnia GPX), osobny `twenty-peaks/apply.sql` i ponowna weryfikacja.
Wspólny import atomowo obsługuje zarówno pusty katalog, jak i już wdrożoną
niezmienioną partię 02. Nie wykonywać ponownie migracji 014 ani partii 01.
Rollback wspólny usuwa obie części; rollback 03 zachowuje wcześniejszą piątkę.
Wszystkie warianty chronią późniejsze edycje. Agent nie zapisywał produkcji.

Zakres GPX jest jawny: Turbacz kończy się przy schronisku, Orlica nie obejmuje
odejścia na szczyt, Wysoka kończy się w Uroczysku Zaskalskim. Nie dopisywać
niezweryfikowanych łączników ani parametrów wyciętych fragmentów. Źródła,
metryki i ograniczenia: README partii 02/03. Nie zmieniono współrzędnych szczytów.
Po wdrożeniu partii 01 + wspólnego pakietu dane obejmą 25 szczytów; nie oznacza
to kompletnego pokrycia całego katalogu ani wszystkich tras na tych szczytach.

## Łysica — odwracalne wycofanie publikacji niepotwierdzonego wpisu

Przegląd produkcji 16 listopada wykazał dwa wpisy „Łysica”. [Ustalenia i korekta](../catalogue/lysica-review/README.md):
id 28 `lysica` (KGP) ma trasę i POI; id 83 `lysica-skarpowa` nie ma potwierdzonej
tożsamości i leży około 960 m na północ od punktu PTTK. Nie utożsamiać go ze Skałą
Agaty ani nie scalać bez dowodów. Przygotowano zmianę wyłącznie `active=false` id 83,
zachowując rekord i relacje, oraz usunięcie jego URL ze statycznej sitemap.

PR #16 został scalony; merge zmienił sitemap, SQL nadal oczekuje.
Agent nie zmienił produkcji. Właściciel jest bez komputera; świeży backup nadal
blokuje wykonanie SQL. Merge zmienia tylko sitemap, nie flagę w Supabase. Po backupie:
`lysica-review/verify.sql` → `apply.sql` → ponowne verify i kontrola publicznej mapy.
Po ukryciu oczekiwane 88 aktywnych szczytów, w Polsce 82, o ile nie było innych zmian.
Cofnięcie przywraca flagę publikacji; sitemap wymaga wtedy osobnego przywrócenia.
Pakiet 20 szczytów i partia 01 pozostają niezależne. Nie uruchamiać starych importów
na podstawie samego merge; najpierw sprawdzić aktualny stan w SQL.

## Partia 04 — trzy pozostałe pozycje KGP, przygotowana

[Instrukcja i źródła](../catalogue/batch-04/README.md): Rysy, Lackowa i rejon Wysokiej
Kopy, 3 trasy/GPX, 3 POI, 24 tłumaczenia. Rysy i Lackowa to wejścia z odwróconych
pełnych GPX PTTK, z czasami kierunku przeciwnego i podejściami ze źródłowych zejść.
Wysoka Kopa: tylko fragment czerwonego szlaku do Sinych Skałek, bez zamkniętego
wierzchołka. Nie traktować trasy w rejonie masywu jako wejścia na szczyt.

Po backupie: najpierw oczekujący pakiet 20, potem osobny `batch-04/apply.sql`,
za każdym razem verify. Nie wykonano żadnego z tych importów produkcyjnie.
Pełne 01+02+03+04 obejmują 28 KGP po jednej trasie/POI, ale tylko 24 GPX. Następne
uzupełnienie: brakujące przebiegi Chełmca, Skopca, Ślęży i Waligóry z partii 01.
Pinezka Lackowej w bazie wymaga osobnego przeglądu — nie dopasowywać do niej
prawidłowego źródłowego GPX ani nie przesuwać jej bez dowodów.

## Kolejność dalszych prac

| Priorytet | Zadanie | Kiedy uznać za skończone |
|---|---|---|
| 1 | Sprawdzić nowe edytory tras/POI na kontrolowanym wpisie | Dodanie szkicu, edycja i ukrycie jako admin; odmowa zapisu dla zwykłego konta |
| 2 | Uzupełniać pozostały katalog zweryfikowanymi partiami | Źródła i daty, zakres parametrów, PL/EN/UA/ZH, kontrola współrzędnych, import/rollback |
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
Test wspólnego pakietu: `python supabase/tests/catalogue_twenty_test.py` przeciwko
osobnej bazie **catalogue_twenty_test**. Regresja edytorów: `catalogue_management_test.py`. Skrypt resetuje schematy tylko w tej
nazwanej bazie. CI opisuje przygotowanie środowiska PostGIS.

Można rozdzielić badanie kolejnej partii danych, testy UI i SEO między agentów,
jeśli właściciel zleci delegowanie. Osobne gałęzie/PR, jeden agent integrujący;
nie edytować równolegle tej samej migracji ani nie wdrażać niezależnych zmian bazy.
