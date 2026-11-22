# Dalsze parkingi KGP — przegląd wszystkich 19 brakujących tras

Przegląd: **22 listopada 2026**. Pakiet `kgp-parking-02` dopisuje **16 kart
parkingowych i 64 teksty PL/EN/UA/ZH** do istniejących tras. Trzy pozostałe przypadki
mają osobne, jawne rozstrzygnięcie „nie publikować bez potwierdzenia”. To nie jest
pakiet 19 zweryfikowanych parkingów. Aktualna dostępność miejsc w terenie nie została
zmierzona; podane są źródła opublikowanych informacji, ich poziom i data odczytu.

Po wdrożeniu: **28 kart dostępu pozostaje bez zmian; 25 z 28 tras KGP ma kartę parkingu**
(9 z wcześniejszego pakietu + 16 nowych). Parking może być miejscem dojazdu w dolinie,
nie punktem startu GPX. Nie dodajemy łączników do geometrii ani ich metrów/czasów.
Zagraniczne trasy, GPX Howerli/Krywania i wcześniejsze rejestry są poza zakresem zmian.

## Co sprawdzono i jak czytać źródła

[Przegląd 19 przypadków](REVIEW.md), [pełne teksty i kontrolny stan istniejących kart](records.json),
[trzy nierozstrzygnięte przypadki](unresolved.json).

- 12 kart bazuje na informacjach parków, gmin, gospodarzy obiektów lub lokalnego
  informatora Kletna. Dla Biskupiej Kopy sprawdzono właściwy fragment Pokrzywnej,
  nie informacje o parkingu innego oddziału parku na tej samej stronie.
- 4 karty — Chełmiec, Skalnik, Skopiec i Rozdroże Izerskie — mają poziom
  `route_reports`: publikowane relacje terenowe, bez bieżącego regulaminu operatora.
  Wprost zaznaczono to w czterech językach; opłaty pozostają niepotwierdzone.
  Nie przedstawiamy tych opisów jako aktualnej zgody zarządcy na dowolne parkowanie.
- Nie przypisano toalet przy siedzibie parku do parkingu znajdującego się dalej.
  Toalety, pojemność, nocny postój i współrzędne stanowisk pozostają `NULL`.
- Nie wpisano stałych kwot ani domyślnych godzin otwarcia. Dni i godziny poboru
  opłat w Krościenku nie zostały utożsamione z otwarciem parkingu.
- Nazwy miejsc w mapach są wyszukiwaniem, nie pomiarem stanowisk. Parking przed
  podejściem do schroniska nie został oznaczony jako dokładna pinezka początku GPX.
- Dla Śnieżki wskazano parking miejski przy Olimpijskiej z osobnym dojściem do
  Białego Jaru; nie zastępuje on pieszego wariantu przejazdem koleją.
- Dla Wysokiej Kopy źródła relacji wykorzystano do ustalenia parkingu, bez
  przejmowania starszych instrukcji wejścia poza szlakiem. GPX pozostaje odcinkiem
  Rozdroże pod Izerskimi Garbami → Sine Skałki, bez zamkniętego wierzchołka.

**Niepublikowane:**

1. **Lackowa / Izby:** operator Końskiej Doliny potwierdza parking dla gości.
   Nie potwierdzono prawa postoju turystów spoza ośrodka ani legalności pobocza.
   Potrzebny aktualny regulamin dla takich użytkowników lub inne potwierdzone miejsce.
2. **Mogielica / Tymbark PKP:** znaleziono informację o budowie Park & Ride, lecz
   nie aktualne zasady użycia przez turystów pieszych. Potrzebny aktualny regulamin
   i potwierdzenie dostępności; parkingi Przełęczy Rydza-Śmigłego nie obsługują
   tego samego początku GPX.
3. **Lubomir / Węglówka:** obserwatorium rekomenduje parking na podejściu od
   Jaworzyc. Nie przypisujemy go jako początku GPX rozpoczynającego się niżej
   w Węglówce. Potrzebny parking dla tego wariantu lub osobno zrecenzowany wariant
   od rekomendowanego parkingu, z właściwym przebiegiem i źródłem.

Nie potrzeba hasła, klucza administracyjnego ani wysyłania wiadomości do operatorów,
aby obejrzeć pakiet. Nie oznaczamy tych trzech braków jako ukończonych.

## Wdrożenie ręczne przez właściciela

Agent nie uruchamia zmian na produkcji. Merge ani Netlify nie wykonują SQL.

1. Zachowaj aktualny backup. Przy czystym lokalnym `main` pobierz merge:
   `git pull --ff-only`.
2. Uruchom **verify.sql** w Supabase SQL Editor. Przed pierwszym importem
   oczekujemy 16 właściwych tras, po 1 karcie dostępu i 4 tłumaczenia, zero kart
   parkingów na tych trasach oraz `package_applied=false`.
3. Uruchom całe **apply.sql** w jednym zapytaniu. Zmieniony stan kart, szkic parkingu
   (także nieaktywny), inny start trasy lub brak RLS zatrzyma całą transakcję.
4. Uruchom **verify-all.sql** i przekaż wynik: 28 wierszy, `access_cards=1`,
   `access_translations=4`, `route_identity_matches=true`, a `parking_cards`
   równe `expected_parking_cards`. Parkingów łącznie 25, tekstów parkingowych 100.
   Dla każdego istniejącego parkingu cztery języki. Trzy opisane braki nadal zero.
5. Sprawdź na stronie: Babia Góra (parking w dolinie), Biskupia Kopa, Kłodzka Góra,
   Skopiec i Śnieżka. Gdy PR zwijanych kart jest już wdrożony, rozwiń pełne opisy
   na telefonie; na komputerze pozostają widoczne.

W głównym katalogu repo, najpierw skopiuj kontrolę:

```powershell
Get-Content .\docs\catalogue\kgp-parking-02\verify.sql -Encoding UTF8 -Raw | Set-Clipboard
```

Po sprawdzeniu wyniku skopiuj import i wykonaj go w SQL Editorze:

```powershell
Get-Content .\docs\catalogue\kgp-parking-02\apply.sql -Encoding UTF8 -Raw | Set-Clipboard
```

Po sukcesie skopiuj końcową kontrolę wszystkich 28 tras:

```powershell
Get-Content .\docs\catalogue\kgp-parking-02\verify-all.sql -Encoding UTF8 -Raw | Set-Clipboard
```

SQL jest ASCII-only (JSON `\u...`); jawne UTF-8 zachowuje dotychczasową procedurę
bez problemów polskich znaków.

## Poprzedni pakiet i bezpieczne cofanie

Nie uruchamiaj ponownie `kgp-practical-01/apply.sql`, jego rollbacku ani starych
importów KGP. Nie modyfikuj ich rejestrów. Starszy pakiet celowo rozpoznaje nowe
parkingi jako późniejszą zmianę i odmówi działania; to ochrona przed usuwaniem
późniejszych danych. Jego dawne oczekiwania zera parkingów przy 19 trasach nie są
kontrolą nowego stanu — do tego służy **verify-all.sql** tego pakietu.

Nowy rejestr `kgp-parking-02` zapisuje pełny stan kart przed/po. Import jest atomowy
oraz bezpieczny przy powtórzeniu na niezmienionym stanie. Nie zmienia ID, opisów
ani znaczników czasu istniejących kart dostępu, tras, POI i wcześniejszych rejestrów.

`rollback.sql` usuwa wyłącznie 16 dopisanych parkingów i ich tłumaczenia. Odmawia
po późniejszej edycji/dodaniu kart lub przy powiązaniach z innymi tabelami, także
`ON DELETE CASCADE`. Po cofnięciu oczekujemy wcześniejszych 28 kart dostępu i 9
parkingów KGP, zachowanych tekstów i oryginalnych rejestrów. Błąd transakcji wymaga
wycofania/zamknięcia jej w SQL Editorze przed następną próbą; nie usuwaj zabezpieczeń.

## Testy

```bash
python scripts/build_kgp_parking_02.py --check
createdb -U postgres kgp_parking_02_test
python supabase/tests/kgp_parking_02_test.py
```

Wyłącznie dedykowana lokalna baza `kgp_parking_02_test`. Fixture dopasowuje kolumny,
identity `BY DEFAULT`, precyzję współrzędnych i NULL/defaulty do przekazanych przez
właściciela metadanych; nie jest pełnym odtworzeniem Supabase ani kopią wszystkich
produkcyjnych polityk/FK. Test obejmuje pełny kontrolny obraz istniejących kart,
16 nowych parkingów i 64 teksty, łączny wynik 28 tras, ponowienie/cofanie/ponowny
import w różnych strefach czasowych, konflikty na ostatniej trasie, szkic nieaktywny,
późniejsze edycje, zmianę startu, brak RLS, trigger zmieniający kartę dostępu,
odmowę zapisu klientowi i ochronę zewnętrznych referencji CASCADE.

Generator używa sprawdzonych definicji transakcji/odczytu z
`scripts/build_kgp_practical_01.py`. Nie zmienia plików starego pakietu.
