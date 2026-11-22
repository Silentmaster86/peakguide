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

## Przygotowany kolejny pakiet: Howerla i Krywań

[foreign-gpx-01](../catalogue/foreign-gpx-01/README.md): geometria-only aktualizacja
istniejących tras id 8 i 10, bez zmian opisów, parametrów, ID i relacji.
GPX pozostają hostowane przez park i Mapa Turystyczna; geometria zawiera wszystkie
1191 punktów źródłowych. Prywatny rejestr chroni ponowienie i rollback.
Pakiet jest przygotowany/testowany, **nie wykonany produkcyjnie przez agenta**.
Po merge i sprawdzeniu stanu właściciel uruchamia verify → apply → verify.
Nie mylić go z raportem źródłowym ani z ukończonymi importami KGP.
Pozostałe cztery zagraniczne trasy pozostają poza tym patchem.

## Przygotowany pakiet praktyczny dla wszystkich 28 szczytów KGP

Zlecenie właściciela: wszystkie 28 naraz. Pakiet
[kgp-practical-01](../catalogue/kgp-practical-01/README.md): 28 kart dostępu/dojścia,
112 tekstów, 9 zweryfikowanych w źródłach parkingów i 36 tekstów parkingowych.
PL/EN/UA/ZH. Dla 19 tras bez karty parkingu UI jawnie pokazuje brak potwierdzonych danych.
To nie twierdzenie, że parking nie istnieje. Opłaty, toalety, pojemność i parkowanie
nocą pozostają niepotwierdzone tam, gdzie nie ma źródła; nie uzupełniać ich domysłami.

**Produkcja niezmieniona przez agenta.** Publiczny odczyt 22 listopada potwierdził
brak kart praktycznych na tych 28 wybranych trasach oraz sześć istniejących kart
zagranicznych poza zakresem pakietu. Przygotowano apply/verify/rollback i odczytowy
preflight. Pełne typy/defaulty/ograniczenia produkcyjnych tabel praktycznych nie są
jeszcze potwierdzone: anonimowe metadane zwróciły 401. Właściciel ma uruchomić
`docs/catalogue/kgp-practical-01/preflight.sql` i przekazać schemat przed pierwszym
apply. Nie prosić o hasła ani klucze administracyjne. Testy fixture nie są restore
ani dowodem identycznego schematu produkcyjnego.

Import odmawia nadpisania kart (także nieaktywnych), ma własny rejestr i chronione
cofanie z kontrolą późniejszych edycji/powiązań. Nie zmienia tras, geometrii, POI,
polityk ani grantów. Nie powtarzać starych importów KGP. Potwierdzenie wykonania
`foreign-gpx-01` nadal nie zostało przekazane; nie łączyć go z tym pakietem.

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
