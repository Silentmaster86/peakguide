# Łysica — przegląd dwóch publicznych wpisów

Stan na 17 listopada 2026: przygotowana odwracalna korekta. **Nie wykonano zapisu do Supabase.** To osobna operacja od oczekującego importu 20 szczytów; nie uruchamiać jej przed świeżym backupem.

## Ustalenie

Publiczne API zawiera dwa aktywne wpisy w paśmie `gory-swietokrzyskie` (id 28), oba nazwane „Łysica” we wszystkich czterech językach:

| Wpis | Stan | Decyzja |
| --- | --- | --- |
| `lysica`, id 28 | KGP, 614 m, 50.891944 / 20.896111, trasa `lysica-czas-w-las-petla`, jeden POI | Zachować bez zmian. Nazwa i 614 m opisują masyw w przyjętym katalogu KGP. |
| `lysica-skarpowa`, id 83 | dodatkowy wpis, 612 m, 50.900000 / 20.900000, bez tras i POI; opisy mówią „Łysica Skarpowa” | Ustawić wyłącznie `active=false` do czasu potwierdzenia tożsamości i położenia. Nie usuwać, nie scalać z id 28 i nie przemianowywać na Agatę. |

PTTK opisuje masyw o dwóch wierzchołkach: zachodnim Łysica oraz wschodnim Skała Agaty. Mapa parku także rozróżnia Łysicę i Agatę. To nie jest dowód, że rekord `lysica-skarpowa` przedstawia drugi z nich. Jego zaokrąglony punkt leży około 960 m na północ od punktu Łysicy z PTTK. Nie znaleziono niezależnego potwierdzenia odrębnego szczytu o nazwie „Łysica Skarpowa”. Brak wyników wyszukiwania nie dowodzi nieistnienia obiektu; z tego powodu decyzja jest odwracalnym wycofaniem publikacji niepotwierdzonej informacji, a nie trwałym usunięciem „duplikatu”.

Źródła odczytane 2026-11-17:

- [PTTK — Łysica (614 m n.p.m.)](https://swietokrzyskie.szlaki.pttk.pl/558-swietokrzyskie-lysica-614-m-npm): masyw, rozróżnienie zachodniego/wschodniego wierzchołka i współrzędne punktu 50.891617 / 20.896667.
- [Mapa Świętokrzyskiego Parku Narodowego, załącznik 10 do zarządzenia 53/2025](https://swpn.gov.pl/uploads/files/6953a215ca5b7791515993.pdf): osobne oznaczenia Łysicy 613,3 m i Agaty 614 m.
- [Świętokrzyski Park Narodowy — Przyroda i człowiek](https://www.swietokrzyskipn.org.pl/wp-content/uploads/2021/01/SPN-PRZYRODA-i-CZLOWIEK.pdf): dwa wierzchołki, różnica względem starszych wysokości i położenie Agaty na wschodzie masywu.

Źródła podają różne dokładności wysokości, a punkt głównego wpisu leży przy zachodnim wierzchołku. Ten pakiet nie rozstrzyga modelu „masyw KGP vs dokładny wierzchołek” i nie przenosi pinezki ani wysokości id 28. Taka zmiana wymaga osobnego uzgodnienia modelu danych i przeglądu relacji tras/POI. Nie utożsamiamy automatycznie wpisu id 83 ze Skałą Agaty.

## Zakres zmiany

- Jedyna zmiana SQL: `public.peaks.active` z `true` na `false` dla id 83.
- Zachowane id, slug, cztery tłumaczenia, współrzędne, metadane i wszystkie istniejące odwołania. Nie przenosi żadnych relacji ani historii użytkowników.
- Główny wpis id 28 z trasą i POI pozostaje bez zmian. Partia 01 i przygotowany pakiet 20 szczytów nie są modyfikowane.
- Publiczne zapytania i polityka RLS pokazują aktywne szczyty: wpis id 83 zniknie z list i mapy. Stary URL przestanie udostępniać publiczny wpis; brak automatycznego przekierowania na id 28, bo tożsamości nie potwierdzono. Nie jest to usunięcie rekordu.
- Ze statycznej sitemap usunięto tylko URL `lysica-skarpowa`. Merge wdroży tę zmianę indeksowania; **nie zmieni `active` w Supabase**. Pozostałe URL pozostają identyczne.

## Wdrożenie przez właściciela — po backupie

1. `verify.sql` jest wyłącznie odczytem. Sprawdź tożsamości i stan obu wpisów w SQL Editor. Z konta właściciela widoczny będzie również wpis nieaktywny.
2. Zrób świeży backup. Scal PR, jeśli nie został jeszcze scalony.
3. Uruchom całą zawartość `apply.sql`. Nie jest migracją automatyczną; merge sam nie zapisze bazy.
4. Ponownie uruchom `verify.sql`: oba rekordy nadal istnieją, id 28 ma `active=true`, id 83 ma `active=false`, `public_matches` zawiera tylko id 28. Trasa i POI id 28 pozostają przypisane do niego.
5. Na stronie publicznej sprawdź wyszukiwanie „Łysica” na mapie i liście: jeden wpis KGP, działające szczegóły, trasa i POI. Jeśli nie było innych zmian, liczba aktywnych szczytów zmieni się z 89 na 88, Polski z 83 na 82; to wynik ukrycia jednego wpisu.

Patch blokuje edycję sprawdzanych tożsamości w transakcji, porównuje pola rekordu ze snapshotem i wszystkie cztery tłumaczenia. Jeśli dane zmieniono lub pojawiły się trasy/POI pod id 83, kończy się błędem bez zapisów. Nie usuwać zabezpieczeń — wykonać ponowny odczyt i przegląd. Powtórzenie poprawnego importu jest no-op.

## Cofnięcie

Uruchom cały `rollback.sql`: przywraca wyłącznie `active=true` id 83, pod warunkiem braku późniejszych zmian w sprawdzanych danych i relacjach. Nie przywraca starego dumpa ani nie modyfikuje id 28. Jeśli później świadomie ukryto/edytowano wpis z innego powodu, najpierw uzgodnić przywrócenie publikacji; zgodny snapshot sam nie zapisuje intencji administratora.

Po cofnięciu przywróć ten URL w sitemap (lub wygeneruj ją ze stanu aktywnych danych po rollbacku przez `npm run sitemap`, z publiczną konfiguracją projektu) i wdroż stronę ponownie. **Nie regeneruj sitemap z obecnej produkcji przed importem** — wpis id 83 jest tam nadal aktywny i wróci do pliku.

## Testy

`python scripts/build_lysica_review.py --check` kontroluje zgodność SQL z `change.json` (wyłącznie publiczne dane). Test `python supabase/tests/lysica_review_test.py` resetuje tylko osobną bazę `lysica_review_test`; obsługuje `--docker NAZWA` i jest w CI. Obejmuje:

- zmianę wyłącznie jednej flagi, idempotencję i dokładne odtworzenie;
- widoczność anonimową z RLS opartym na `active`;
- zachowanie tłumaczeń, głównego wpisu, jego trasy/POI i przykładowego istniejącego odwołania do id 83;
- odrzucenie zmian danych, brakującego tłumaczenia, nowych relacji oraz ochronę cofania przed nowszą edycją.

Fixture testowy nie jest pełnym stagingiem Supabase. Test nie potwierdza stanu prywatnych tabel produkcyjnych — korekta niczego z nich nie usuwa i nie przenosi.
