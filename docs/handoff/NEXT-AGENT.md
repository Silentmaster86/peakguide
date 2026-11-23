# PeakGuide — karta dla kolejnego agenta

Stan: 22 listopada 2026. Repo: Silentmaster86/peakguide.
Produkcja: https://peak-guide.netlify.app/. React/Vite w `peakguide_front`, Supabase.
Języki UI/danych: pl/en/ua/zh; poczta: pl/en/uk/zh. Chiński uproszczony.

## Najważniejsze: wdrożenia bazy są zakończone

Właściciel wykonał SQL i przekazał wyniki kontroli. Nie traktować merge jako
potwierdzenia wykonania SQL; poniższy stan opiera się na wynikach produkcyjnych:

| Pakiet | Potwierdzony wynik |
| --- | --- |
| Partia 01 | Pierwsze 5 tras/POI wdrożone wcześniej, nie ponawiać |
| `twenty-peaks` (02 + 03) | 20 aktywnych tras, 20 aktywnych POI; wszystkie trasy z geometrią i adresem GPX; PL/EN/UA/ZH |
| `gpx-completion` | Cztery istniejące trasy Chełmca, Skopca, Ślęży i Waligóry z geometrią/GPX; rejestry odświeżone |
| Partia 04 | Rysy, Lackowa i rejon Wysokiej Kopy: 3 trasy, 3 POI, GPX i cztery języki |
| `coordinate-review` | Śnieżnik 50.207423/16.847394; Rudawiec 50.244770/16.976879; Lackowa 49.426496/21.102539; punkty geom zgodne |
| `lysica-review` | id 28 `lysica` aktywny; id 83 `lysica-skarpowa` nieaktywny i zachowany; publiczny tylko id 28 |
| `utf8-repair` (PR #22) | kgp-02: 10/10; kgp-03: 30/30; kgp-04: 6/6 rekordów zgodnych tekstowo ze źródłami; wszystkie `remaining_issues=[]` |

Pokrycie aktywnej KGP: **28/28 ma co najmniej jedną aktywną trasę z geometrią i POI**.
Nie oznacza to pełnego katalogu wszystkich szczytów, tras ani usług w okolicy.
Właściciel przejrzał stronę po naprawie i nie zgłosił problemów.

## Kodowanie: obowiązkowe przy kopiowaniu SQL

Windows PowerShell bez jawnego UTF-8 uszkodził nazwy/opisy partii 02–04.
Naprawiono je na istniejących rekordach, zachowując ID, geometrię, GPX, parametry
oraz zgodność rejestrów importu. Nie cofać naprawy i nie usuwać/reimportować danych.

Każde polecenie kopiowania pliku z tekstem narodowym musi zawierać:

```powershell
Get-Content .\SCIEZKA\PLIK.sql -Encoding UTF8 -Raw | Set-Clipboard
```

Same liczniki oraz listy kodów języków nie dowodzą poprawnego kodowania.
Kontrola pełnego tekstu: `docs/catalogue/utf8-repair/verify.sql` (odczyt).
Skrypty naprawy są ASCII-only. Nie odpalać ich ponownie bez potrzeby; późniejsze
edycje administratora celowo blokują stare importy/cofanie/naprawę.

## Backup i ograniczenia

Właściciel potwierdził lokalne backupy **przed i po wdrożeniach 21 listopada**.
Pierwszy eksport potwierdził odczyt spisu archiwum; drugi zgłosił jako utworzony.
Pełne próbne odtworzenie nadal nie jest potwierdzone. Dumpy są u właściciela;
agent nie ma połączenia administracyjnego z produkcją. Nie prosić o hasła,
sekrety ani publikowanie dumpa w czacie/repo.

Narzędzie do przyszłych backupów Windows: `scripts/backup_database.ps1`
([instrukcja](../operations/windows-backup.md)), przygotowane w PR #20.
Nie jest potrzebne do potwierdzenia już wykonanych kopii ani importów; merge
nie uruchamia go automatycznie. [Stan wdrożeń](../operations/pending-rollout.md)
zastępuje dawną listę oczekujących operacji. Szczegóły izolowanego odtwarzania:
`docs/operations/remaining-work.md`.

## Funkcje już działające

- Konta: rejestracja, logowanie, reset hasła, powiadomienie po zmianie oraz
  usuwanie użytkownika — potwierdzone przez właściciela.
- Wielojęzyczne powitania Gmail z adresem odpowiedzi właściciela. Worker: jedna
  wiadomość co 5 minut. `sent` oznacza przyjęcie SMTP, nie dowód dostawy.
  Nie ponawiać `uncertain` ani nie wysyłać testów do cudzych użytkowników.
- Panel admina: edytory szczytów/tras/POI, wersje językowe, GPX, źródła i daty,
  atomowy zapis oraz wykrywanie nowszych zmian. Test zapisu szczytu potwierdzony;
  ręczny kontrolowany test nowych edytorów tras/POI pozostaje osobny.
- Mapa: filtry, standard/satelita/topografia, ikonowy panel warstw, domyślne
  wyłączalne szczyty, osobne warstwy POI i przebiegów, grupowanie i powiększenie.
- Kafelki FAQ/pomocy i katalogu zachowują oryginalne tło. PR #21 poprawił kontrast
  głównego przycisku w Light i hierarchię nagłówków pasm.

## Dodatkowy przegląd publicznej produkcji (21 listopada)

Odczyt publicznego API: 34 aktywne trasy. Wszystkie 28 dostępnych par
GPX/geometria dało się pobrać, sparsować i porównać punkt po punkcie — bez
rozbieżności. Pozostałe 6 aktywnych tras nie ma kompletu geometrii/GPX; dotyczy
to starszych wpisów, nie braku pokrycia któregoś z 28 szczytów KGP.
Nie uzupełniać ich przez kopiowanie śladu innej trasy.
Wspólny przegląd wszystkich sześciu: [źródła GPX](../catalogue/foreign-gpx-review/README.md).
Pięć plików kandydujących pobrano i przeanalizowano; nie jest to wdrożenie
geometrii i żaden z sześciu wpisów nie został przez tę analizę zmieniony.

Mobilny przegląd `/trails`, `/peaks/rysy?tab=trails`,
`/peaks/snieznik?tab=pois` oraz `/map` w Light i Dark: brak poziomego
przewijania i naruszeń Axe w tych ośmiu widokach. To test automatyczny
wybranego zakresu, nie pełna ocena dostępności/czytnika ani test fizycznego telefonu.

## Wdrożony pakiet: Howerla i Krywań

[foreign-gpx-01](../catalogue/foreign-gpx-01/README.md): geometria-only aktualizacja
istniejących tras id 8 i 10, bez zmian opisów, parametrów, ID i relacji.
GPX pozostają hostowane przez park i Mapa Turystyczna; geometria zawiera wszystkie
1191 punktów źródłowych. Prywatny rejestr chroni ponowienie i rollback.
Właściciel wykonał apply i przekazał verify 22 listopada 2026: oba rekordy mają
`has_geometry`, `geometry_matches_review`, `gpx_matches_review` i `upgrade_applied`
równe true. To potwierdzenie wdrożenia właścicielskiego; nie ponawiać importu.
Nie mylić go z raportem źródłowym ani z ukończonymi importami KGP.
Pozostałe cztery zagraniczne trasy pozostają poza tym patchem.

## Wdrożony pakiet praktyczny dla wszystkich 28 szczytów KGP

Zlecenie właściciela: wszystkie 28 naraz. Pakiet
[kgp-practical-01](../catalogue/kgp-practical-01/README.md): 28 kart dostępu/dojścia,
112 tekstów, 9 zweryfikowanych w źródłach parkingów i 36 tekstów parkingowych.
PL/EN/UA/ZH. Dla 19 tras bez karty parkingu UI jawnie pokazuje brak potwierdzonych danych.
To nie twierdzenie, że parking nie istnieje. Opłaty, toalety, pojemność i parkowanie
nocą pozostają niepotwierdzone tam, gdzie nie ma źródła; nie uzupełniać ich domysłami.

Właściciel wykonał import i przekazał verify 22 listopada 2026: 28 kart dostępu,
112 tekstów, 9 kart parkingów, 36 tekstów, wszystkie `route_identity_matches=true`.
Porównano również pełne 148 tekstów z publicznego API: bez rozbieżności. Przekazane
41 definicji kolumn/defaultów/identity/RLS sprawdzono w izolowanej bazie; testy
importu/cofania przeszły. To nie pełne odtworzenie produkcji ani eksport jej FK/polityk.
Przegląd produkcji w Chromium: Śnieżnik/Rysy/Ślęża/Babia Góra, 390/1440 px,
Light/Dark, dodatkowo EN/UA/ZH dla pierwszych trzech: 25 przypadków bez błędów
wykonania/API, brak przepełnienia poziomego, treści zgodne z manifestem.

Import odmawia nadpisania kart (także nieaktywnych), ma własny rejestr i chronione
cofanie z kontrolą późniejszych edycji/powiązań. Nie zmienia tras, geometrii, POI,
polityk ani grantów. Nie powtarzać starych importów KGP. Wdrożenie
`foreign-gpx-01` również potwierdzono osobnym wynikiem właściciela.

## Granice danych turystycznych

Nie zgadywać brakujących metrów, czasów, kosztów ani trudności.
Turbacz kończy się przy schronisku, Orlica nie obejmuje odejścia do wieży,
Wysoka w Pieninach kończy się w Uroczysku Zaskalskim. Trasa Wysokiej Kopy
obejmuje fragment czerwonego szlaku do Sinych Skałek, bez zamkniętego szczytu.
Nie dorysowywać łączników i nie przesuwać pinezek do końca trasy bez źródeł.
Każda nowa partia: źródła/datowanie, parametry zgodne z zakresem, cztery języki,
kontrola mapy/GPX, atomowe importy i ochrona późniejszych edycji.

## Następne prace — bez powtarzania ukończonych importów

1. Kontynuować pomiary i konkretne poprawki publicznego interfejsu, telefonu,
   klawiatury i czytnika ekranu. Testy automatyczne nie certyfikują WCAG.
2. Kontrolowany test edytorów tras/POI: szkic, edycja, ukrycie jako admin,
   odmowa dla zwykłego użytkownika; osobny wpis testowy, bez edycji importów.
3. Odtworzyć backup w izolacji bez produkcyjnego SMTP, crona i webhooków;
   sprawdzić log restore, liczniki, FK/RLS/granty i role. Fixture nie zastępuje
   stagingu ani kompletnego schematu Supabase.
4. Dalszy katalog poza KGP i dodatkowe dane praktyczne — wyłącznie ze źródłami.
5. Osobny etap SEO: językowe URL/prerender, przekierowania, canonical/hreflang
   i sitemap; nie dodawać odnośników do nieistniejących wariantów językowych.
6. Clever-service: przed usunięciem sprawdzić wdrożenia/logi i zachować źródło.
   Brak odwołań w repo nie dowodzi braku klientów zewnętrznych.

## Testy i sposób pracy

`npm run check` i `npm run test:e2e` w `peakguide_front`.
Firefox/WebKit: `PLAYWRIGHT_CROSS_BROWSER=1 npx playwright test --project=firefox --project=webkit`.
Integracje bazowe resetują wyłącznie nazwane dedykowane bazy testowe; konfiguracja
w `.github/workflows/quality.yml`. Nie kierować ich na produkcję.
Właściciel sam wykonuje merge i SQL. Dawać krótkie kroki i dokładne ścieżki.
Agent może przygotować kolejne niezależne PR-y; nie zmieniać produkcji w tle.
Delegować między agentów tylko po wyraźnym zleceniu właściciela.

## Potwierdzone: krótsze karty i dalsze parkingi

PR #28 i #29 są scalone. Właściciel wykonał `kgp-parking-02` i przekazał verify-all:
28 kart dostępu / 112 tekstów, 25 parkingów KGP / 100 tekstów, bez rozbieżności,
`package_applied=true`. Publiczny przegląd potwierdził widoczne nowe parkingi i
zwijane karty do 700 px. Nie uruchamiać ponownie starych importów/rollbacków.
Trzy nierozstrzygnięte parkingi: Lackowa, Mogielica, Lubomir — patrz unresolved.json.

[Przegląd po wdrożeniach](../reviews/2026-11-22-postrollout.md): 57 widoków produkcji,
4 interaktywne przeglądy mapy, publiczna kontrola geometrii/tłumaczeń/kompletności.
PR #30 z poprawkami 404 i metadanych UA/ZH jest scalony.
Oddzielny `krivan-seasonal-01` w `data/krivan-seasonal-warning` aktualizuje ostrzeżenie
o sezonie zamknięcia 2026/2027; PR #31 jest scalony, a właściciel wykonał SQL
i potwierdził 4/4 warning_matches_review=true oraz patch_applied=true.
Nie zmienia GPX ani zakończonego pakietu `foreign-gpx-01`.

## Nowe zlecenie: autonomiczna realizacja dalszego planu

Właściciel zlecił frontend, backend, testy i przygotowywanie kolejnych PR-ów;
sam kontroluje i wykonuje merge. [Plan i kolejność](../operations/delivery-plan.md).
[Świeży audyt](../audit/2026-11-22/README.md): 88 aktywnych szczytów,
60 spoza KGP (54 PL, 6 zagranicznych). Poza KGP: 54 bez tras, 57 bez POI.
Raport jest odczytowy, nie importem ani potwierdzeniem jakości istniejących wpisów.

### Przygotowane kolejne PR-y — jeszcze nie są potwierdzeniem produkcji

- #32: raport braków i plan wykonawczy (ten PR), bez SQL.
- #33: prognoza przy szczycie + backend Netlify + testy. Wdrożenie funkcji w Deploy
  Preview sprawdzono z usługą wyłączoną (503 not_configured). Dostawca MET wymaga
  akceptacji warunków przez właściciela; po niej jedna zmienna Netlify Functions
  `PEAKGUIDE_WEATHER_ENABLED=true` i deploy. Bez SQL i klucza API. Instrukcja jest
  w tym PR w docs/operations/weather.md. Nie deklarować uruchomienia prognozy.
- #34: lokalne obliczenia wschodu/zachodu i długości dnia dla daty wycieczki,
  4 języki, docelowe strefy czasu, stany polarne. Tylko merge, bez konfiguracji.

PR-y są niezależne, bazują na main 397e464. Lokalna próba ich połączenia nie
wykazała konfliktów. Każdy ma własne testy; status CI sprawdzić na najnowszym SHA.
Właściciel nadal sam wykonuje merge. Nie utożsamiać przygotowanego kodu z wdrożeniem.


## Potwierdzone wdrożenie pogody i światła dziennego; następna partia

PR #32, #34 i #33 są scalone (main b916038). Właściciel zgłosił wykonanie konfiguracji
oraz widoczność pól pogody i światła dziennego. Nie włączać ponownie ani nie zmieniać
konfiguracji poczty/pogody w ramach kolejnych importów katalogu.

Przygotowany [nonkgp-01](../catalogue/nonkgp-01/README.md): 4 trasy/GPX i 4 POI,
32 teksty, 530 punktów. Śnieżnica: tylko range_id 21→22, ze źródłem PTTK.
Jeszcze nie wykonano produkcyjnego SQL. Odczyt publiczny przed pracą nie wykazał
tras/POI dla tych czterech szczytów. Verify właściciela jest osobnym etapem.
Ostry Wierch id73 ma sprzeczną tożsamość: opis/pasmo Niski kontra wysokość 851
oraz współrzędne w Pieninach. Nie dołączać szlaku do tego ID bez rozstrzygnięcia.
Źródła i stan blokady: unresolved.json tej partii. Nie zmieniono tego rekordu.
