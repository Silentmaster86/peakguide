# Poza KGP — partia 01: cztery sprawdzone szczyty

**Wdrożenie potwierdzone przez właściciela 23 listopada 2026.** Łysina (70), Śnieżnica
(69), Góra Żar (76), Leskowiec (75): **4 trasy, 4 POI, 32 teksty PL/EN/UA/ZH,
530 punktów źródłowych GPX**. Poprawia również jedno błędne przypisanie pasma:
Śnieżnica `range_id` 21 (Beskid Makowski) → 22 (Beskid Wyspowy).

Ostry Wierch (73), piąty rekord z kolejki, wymaga rozstrzygnięcia tożsamości.
Wysokość 851 m i współrzędne w Pieninach nie odpowiadają pasmu i opisom Beskidu
Niskiego. [Raport blokady](unresolved.json) wskazuje oba miejsca. Nie przypisujemy
mu szlaku innej góry i nie wybieramy arbitralnie, którą z dwóch pozycji miał
reprezentować. Ta partia nie obejmuje żadnej zmiany id 73.

Właściciel przekazał 4/4 wiersze: po jednej trasie, POI i geometrii, oba zestawy
4 języków, review_matches=true i package_applied=true. Śnieżnica ma
range_slug=beskid-wyspowy. Nie ponawiać importu ani nie wykonywać rollbacku.

## Instrukcja wdrożenia (wykonana)

Merge udostępnia pliki, w tym odwrócony GPX Łysiny. **Dane Supabase wymagają SQL**;
agent nie ma połączenia administracyjnego i nie wykonuje operacji produkcyjnych.
W projekcie działa już migracja katalogu 014 i tabela rejestrów poprzednich partii.
Nie trzeba ponawiać wcześniejszych importów KGP ani migracji.

1. Zachowaj aktualną kopię bazy. Otwórz `verify.sql` w Supabase SQL Editor:
   przed importem oczekiwane są 4 wiersze, po 0 tras i POI, `package_applied=false`.
2. Po merge uruchom **cały `docs/catalogue/nonkgp-01/apply.sql`** jako właściciel.
   To jedna transakcja: cztery pary danych i korekta pasma Śnieżnicy.
3. Uruchom **`docs/catalogue/nonkgp-01/verify.sql`**. Każdy z 4 wierszy powinien mieć
   `trails=1`, `pois=1`, `mapped_trails=1`, oba zestawy języków `[en,pl,ua,zh]`,
   `review_matches=true`, `package_applied=true`. Śnieżnica: `range_slug=beskid-wyspowy`.
4. Odśwież stronę, aby wyczyścić pamięć poprzednich pustych odpowiedzi API.
   Sprawdź zakładki trasy/POI i przebiegi w mapie interaktywnej. Dopiero wtedy
   oznacz partię jako wdrożoną w handoff. Samo `Success` nie zastępuje verify.

Pliki SQL są ASCII; polskie, ukraińskie i chińskie znaki mają postać bezpiecznych
sekwencji JSON Unicode. Nie poprawiaj ręcznie treści wygenerowanego SQL.

## Dokładny zakres tras

Wartości są opublikowanymi szacunkami źródeł, odczytanymi **22 listopada 2026**.
Dotyczą pojedynczego wejścia; bez zejścia, przejazdu koleją i dodatkowych dojść.
Skala `difficulty` pozostaje null; nie nadajemy jej na podstawie koloru szlaku.

| Szczyt | Przebieg i źródło | Dystans / podejścia / czas | GPX |
| --- | --- | --- | --- |
| Łysina | Pcim → Kudłacze → Łysina. Cały [PTTK 309](https://malopolska.szlaki.pttk.pl/309-pttk-malopolska-lysina-pcim) odwrócony do wejścia. | 8,5 km / 718 m / 210 min. Czas wejścia jest wprost podany jako czas kierunku przeciwnego; podejścia odpowiadają źródłowym zejściom. | 13 segmentów, 208 punktów; [adaptacja](routes/lysina-pcim-kudlacze-wejscie.gpx) zachowuje wszystkie współrzędne **i wysokości**. |
| Śnieżnica | [Gruszowiec → Śnieżnica, Mapa Turystyczna yoez](https://mapa-turystyczna.pl/route/yoez): niebieski/zielony, dalej niebieski i krótkie końcowe łączniki. | 2,2 km / 328 m / 67 min | Cały [GPX dostawcy](https://mapa-turystyczna.pl/route/yoez.gpx), 100 punktów. |
| Góra Żar | [Międzybrodzie Żywieckie, Za Roztoki → Żar, Mapa Turystyczna 3bedx](https://mapa-turystyczna.pl/route/3bedx): czarny i końcowy wspólny odcinek. | 2,5 km / 372 m / 75 min | Cały [GPX dostawcy](https://mapa-turystyczna.pl/route/3bedx.gpx), 121 punktów. |
| Leskowiec | [Rzyki, Mydlarze, przystanek → Leskowiec, Mapa Turystyczna 3npty](https://mapa-turystyczna.pl/route/3npty): czarny do przełęczy Wł. Midowicza, dalej czerwony/żółty do szczytu. | 2,5 km / 405 m / 80 min | Cały [GPX dostawcy](https://mapa-turystyczna.pl/route/3npty.gpx), 101 punktów. |

Trzy GPX Mapa Turystyczna pozostają hostowane u dostawcy. Przechowywana geometria
2D odpowiada każdemu punktowi aktualnego źródła; nie upraszczamy, nie dopisujemy
łączników i nie przesuwamy tras do pinezek. Eksporty dostawcy mają generowane czasy;
monitor źródeł normalizuje wyłącznie ich wspólne przesunięcie względem czasu eksportu.
Niezależnie sprawdza także wszystkie współrzędne, wysokości, opisy i względne czasy.
Szczegóły i hashe: [geometry-review.json](geometry-review.json).

## POI i ograniczenia dojścia

| Szczyt | Punkt | Współrzędne i źródło |
| --- | --- | --- |
| Łysina | Schronisko PTTK na Kudłaczach, przy przebiegu wybranej trasy | 49.782289, 20.022684 — [PTTK 2531](https://malopolska.szlaki.pttk.pl/2531-pttk-malopolska-schronisko-pttk-na-kudlaczach). |
| Śnieżnica | Ośrodek i schronisko na południowo-zachodnim zboczu, **poza wybranym podejściem** | 49.708218, 20.173573 — [PTTK 1517](https://malopolska.szlaki.pttk.pl/1517-pttk-malopolska-mlodziezowy-osrodek-rekolekcyjny-i-schronisko-pod-snieznica). Dojścia nie dodano do GPX ani parametrów. |
| Żar | Rejon panoramy przy końcu trasy, **bez wejścia do ogrodzonego zbiornika** | 49.787187, 19.224802 — koniec GPX 3bedx; opis panoramy [Gminy Czernichów](https://www.czernichow.com.pl/atrakcje/art-kolej-linowoterenowa-na-gorze-zar,69). To rejon szczytu, nie deklaracja konkretnego tarasu ani współrzędne stacji kolei. |
| Leskowiec | Schronisko PTTK pod Groniem Jana Pawła II, **odrębne od szczytu i poza GPX** | 49.795338, 19.447673 — [punkt Mapa Turystyczna](https://mapa-turystyczna.pl/node/schronisko-pttk-leskowiec); obiekt potwierdza [serwis PTTK Zielone Schroniska](https://schroniska.pttk.pl/leskowiec/pl/index.html). |

POI są przypisane do szczytów (`trail_id=null`). Opisy w czterech językach jasno
rozróżniają obiekty na trasie i dodatkowe dojścia. Nie publikujemy niepotwierdzonych
cen, godzin, liczby miejsc, toalet, parkingów ani bieżącej dostępności usług.
Historia i stare ceny w karcie gminy nie zostały przeniesione jako aktualne dane.
Automatyczny odczyt strony PKL chwilowo zwracał 503; nie wywodzimy z niego statusu
kolei, a stronę operatora podajemy do samodzielnego sprawdzenia.

### Odrzucone warianty i korekta pasma

- [PTTK 187 Gruszowiec–Śnieżnica](https://malopolska.szlaki.pttk.pl/187-pttk-malopolska-gruszowiec-snieznica)
  i [189 Szlak pod Śnieżnicą](https://malopolska.szlaki.pttk.pl/189-pttk-malopolska-szlak-pod-snieznica)
  są oznaczone jako **rowerowe**. Nie zostały opublikowane jako szlaki piesze.
- [PTTK 149](https://malopolska.szlaki.pttk.pl/149-pttk-malopolska-szczawa-snieznica-gorna-stacja-kolejki)
  zawiera ostrzeżenie dla Kasiny Wielkiej–górnej stacji kolejki. Wybrany GPX yoez
  zaczyna się na przełęczy Gruszowiec i nie obejmuje tamtego odcinka. Ostrzeżenie
  jest wymienione w notatkach; publikacja GPX nie jest potwierdzeniem otwarcia.
- [PTTK 2048](https://malopolska.szlaki.pttk.pl/2048-pttk-malopolska-snieznica)
  potwierdza Beskid Wyspowy. Istniejące polskie opisy Śnieżnicy już wskazują to
  pasmo, a relacja w bazie błędnie wskazuje Makowski. Zmieniamy wyłącznie range_id.
  Wysokości i współrzędne czterech szczytów pozostają poza zakresem tej korekty.
- Różne mapy podają m.in. 918/922 m dla Leskowca i różne etykiety wysokości Łysiny.
  Nie kopiujemy tych wartości do istniejących rekordów szczytów przy imporcie tras.

## Transakcja i cofanie

Własny rejestr `nonkgp-01` w istniejącej prywatnej tabeli. Import sprawdza ID,
slug, pasmo, współrzędne, wysokość, aktywność i brak flagi KGP. Odmawia, jeśli
którykolwiek szczyt ma już trasę/POI, **także szkic niewidoczny publicznie**.
Sprawdza również docelowe pasmo, typy POI i konflikt sluga z inną częścią katalogu.

Ponowienie jest bezpieczne tylko, gdy dane i tożsamości nadal odpowiadają rejestrowi.
Późniejsze zmiany tras lub tłumaczeń powodują odmowę, nie nadpisanie.
`rollback.sql` jest narzędziem awaryjnym, nie kolejnym krokiem wdrożenia: usuwa
wyłącznie 8 własnych rekordów i ich tłumaczenia oraz przywraca poprzednie przypisanie
Śnieżnicy. Chroni powiązania FK, także w później dodanych tabelach z CASCADE/SET NULL,
i nowe treści Śnieżnicy. Późniejsze niepowiązane pola szczytu, np. autor zdjęcia,
pozostają zachowane. Zmiana tożsamości szczytu zatrzymuje cofanie do przeglądu.
Nie wykonuj cofania tylko dlatego, że istnieje nowsza partia.

## Testy i granice potwierdzenia

```sh
python scripts/build_nonkgp_01.py --check
python -m unittest discover -s scripts -p 'test_*.py'
# Oddzielna, lokalna baza nonkgp_01_test, PostgreSQL/PostGIS:
python supabase/tests/nonkgp_01_test.py
# Opcjonalny odczyt dostawców, bez zapisu do Supabase:
python scripts/build_nonkgp_01.py --check --check-sources
```

Integracja resetuje wyłącznie nazwaną bazę testową. Weryfikuje dokładne 32 teksty,
cztery geometrie, niezmienione role/polityki publiczne, pozostawienie innych
szczytów (w tym KGP i Ostrego Wierchu), powtórzenie, cofanie, ochronę późniejszych
edycji/powiązań, szkic, błąd ostatniego tłumaczenia i zmianę tożsamości.
Fixture nie jest pełnym odtworzeniem prywatnej bazy Supabase.
Przegląd UI używa rzeczywistych tekstów partii w atrapach API — nie jest dowodem
wdrożenia danych. Produkcję potwierdza dopiero wynik verify właściciela.

Lokalny wynik: test integracyjny PostGIS zakończony powodzeniem, 10 testów Python
oraz 8 scenariuszy Chromium (desktop/mobile, 4 języki). Ponowny odczyt wszystkich
4 dostawców potwierdził pełne fingerprinty GPX i zgodność wszystkich współrzędnych.
