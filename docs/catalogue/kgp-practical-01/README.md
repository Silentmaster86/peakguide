# Informacje praktyczne dla wszystkich 28 szczytów KGP

Pakiet `kgp-practical-01`, przegląd źródeł: **22 listopada 2026**.
**28 kart startu/dojścia, 112 tłumaczeń; 9 kart parkingów, 36 tłumaczeń.**
Języki: polski, angielski, ukraiński (`ua`, zgodnie z obecną bazą), chiński uproszczony.
Każda karta dotyczy jednej istniejącej, wskazanej trasy danego szczytu.
Nie jest to komplet wszystkich tras ani wszystkich usług wokół szczytu.

## Co będzie widoczne

Istniejący komponent „Przed wyjściem” pokaże start i koniec odcinka, rozróżnienie
wariantu, dojście do wysokiego punktu startowego, informacje o ograniczeniach,
źródło i datę przeglądu. Link mapy przy starcie otwiera mapę wybranej trasy,
nie nawigację samochodową. Zweryfikowane sezonowe informacje o transporcie są
dla Ślęży i Turbacza. Dla pozostałych 26 tras jest jawna informacja o braku
potwierdzenia aktualnego połączenia, bez wymyślonych linii czy godzin.

Parkingi są opisane dla Waligóry, Jagodnej, Orlicy, Czupla, Skrzycznego,
Ślęży, Rysów, Tarnicy i Kowadła. **Pozostałe 19 tras nie dostaje fikcyjnej karty
parkingu.** Brak karty oznacza brak potwierdzonej informacji, nie zakaz parkowania.
Karta parkingu pokazuje brak potwierdzonych danych, gdy nie ma wpisu.
Pola toalet, pojemności i parkowania nocą pozostają `NULL` we wszystkich 9 kartach.
Nie podajemy numerów posesji ani współrzędnych stanowisk, których nie zweryfikowano.
Mapy parkingów wyszukują nazwę miejsca; opis wyjaśnia ten zakres dokładności.
Nie utożsamiamy parkowania nocą z prawem do spania w aucie lub biwakowania.
Nie wpisujemy stałych kwot opłat. Ceny i aktualne warunki należy sprawdzić w źródle.

[Przegląd wszystkich 28 tras](REVIEW.md), [treść w czterech językach](records.json),
[wyniki odczytu źródeł](source-checks.json). Pole `evidence` przypisuje źródła do
konkretnych informacji. Status HTTP 200 potwierdza dostępność strony w dniu odczytu,
nie bieżące otwarcie szlaku. Opisy są redakcyjnymi wskazówkami, nie kopiami artykułów.

## Ważne różnice wariantów

- Śnieżnik i Babia Góra: GPX zaczyna się przy schronisku; trzeba doliczyć dojście z doliny.
- Szczeliniec: początek pieszy na przełęczy, sezonowa trasa edukacyjna; godziny
  Błędnych Skał nie są godzinami tej trasy.
- Wysoka Kopa: odcinek do Sinych Skałek; nie instrukcja wejścia poza szlakiem na szczyt.
- Rudawiec: Przełęcz Płoszczyna, nie Bielice ani parking w Nowej Morawie.
- Orlica: start przy Torfowisku pod Zieleńcem, nie popularne wejście z Zieleńca.
- Radziejowa: GPX kończy się na Wielkim Rogaczu; nie obejmuje połączenia na Radziejową.
- Kłodzka Góra: Kłodzko Miasto, nie Przełęcz Kłodzka; GPX kończy się pod szczytem.
- Mogielica: Tymbark PKP, nie inne popularne parkingi. Nazwa stacji nie dowodzi kursowania pociągów.
- Rysy: bilet parkingowy TPN może oznaczać miejsce przy drodze albo na Łysej Polanie;
  nie gwarantuje stanowiska przy wejściu na szlak.
- Ślęża: autobus 512 sezonowo, weekendy i święta od maja do października.
- Tarnica: oficjalna informacja o parkingach wskazuje sezon od połowy kwietnia do
  połowy listopada; poza sezonem trzeba sprawdzić dostępność.

## Wdrożenie przez właściciela

Agent nie uruchamia SQL na produkcji. Merge nie jest wykonaniem SQL.
Nie potrzeba nowych sekretów, kluczy, wysyłki maili ani migracji RLS.
Nie uruchamiaj ponownie dawnych importów KGP, napraw UTF-8 ani pakietów GPX.

1. Zachowaj aktualny backup bazy. Skrypt: `scripts/backup_database.ps1`.
2. Po merge pobierz kod: przy czystym lokalnym `main` wykonaj `git pull --ff-only`.
3. Skopiuj **preflight.sql** poniższym poleceniem i uruchom w SQL Editorze Supabase.
   Pierwszy wynik musi zawierać 28 pasujących tras (`route_identity_matches = true`),
   a obie kolumny istniejących kart mają wynosić 0 przed pierwszym importem.
   Drugi wynik pokazuje schemat czterech tabel. Przekaż go do porównania przed
   pierwszym wdrożeniem, jeśli nie był wcześniej sprawdzony.
4. Po sprawdzeniu schematu uruchom **apply.sql** jednym zapytaniem.
5. Uruchom **verify.sql**: 28 wierszy, `access_cards=1`, `access_translations=4`,
   `route_identity_matches=true`. `parking_cards=expected_parking_cards`,
   `parking_translations=4*parking_cards`; sumy parkingów 9 i tłumaczeń 36.
6. Otwórz istniejące szczegóły szczytu i rozwiń trasę. Sprawdź karty co najmniej
   dla Śnieżnika/Babiej Góry, Rysów i Ślęży, telefon + komputer i cztery języki.

PowerShell, uruchomiony w głównym katalogu repozytorium:

```powershell
Get-Content .\docs\catalogue\kgp-practical-01\preflight.sql -Encoding UTF8 -Raw | Set-Clipboard
```

Potem to samo dla `apply.sql`, następnie dla `verify.sql`, pojedynczo.
Pliki SQL są ASCII-only, z tekstami narodowymi w postaci JSON `\u....`.
Jawne `-Encoding UTF8` pozostaje obowiązkowe, aby nie powtórzyć dawnych problemów.
Jeżeli import odmówi wykonania, nie usuwaj zabezpieczeń ani istniejących rekordów;
przekaż sam komunikat błędu, bez sekretów. Błąd powoduje wycofanie całej transakcji.

## Zabezpieczenia i cofnięcie

Pakiet wymaga istniejących tabel `trail_access`, `trail_access_i18n`,
`trail_parking`, `trail_parking_i18n`, włączonego RLS i automatycznych identyfikatorów
`bigint`. Nie zmienia schematu, polityk, grantów, tras, GPX, POI ani danych użytkowników.
Nie nadpisuje istniejących kart, również nieaktywnych. Cały import jest atomowy.
Własny rejestr `kgp-practical-01` przechowuje pełny obraz utworzonych kart i tekstów.
Ponowne wykonanie nie dodaje duplikatów; wymaga niezmienionych zapisanych kart.

`rollback.sql` usuwa tylko niezmienione karty tego pakietu. Odmówi cofnięcia po
późniejszej edycji, dodaniu kolejnej karty do tych tras lub powiązaniu karty z inną
tabelą (także relacją z `ON DELETE CASCADE`). Zachowuje obce karty i rejestry importów.
Po błędzie w SQL Editorze zamknij/wycofaj otwartą transakcję, zanim ponowisz zapytanie.
Sekwencje mogą mieć luki po nieudanej próbie; nie oznacza to częściowo wdrożonych kart.

## Weryfikacja techniczna i jej zakres

```bash
python scripts/build_kgp_practical_01.py --check
createdb -U postgres kgp_practical_01_test
python supabase/tests/kgp_practical_01_test.py
```

Testy działają wyłącznie na nazwanej lokalnej bazie `kgp_practical_01_test`.
Fixture opiera się na kolumnach odczytanych z publicznych rekordów; nie jest
odtworzeniem prywatnej produkcyjnej bazy. Pełne produkcyjne typy/defaulty/ograniczenia
wymagają wyniku właścicielskiego `preflight.sql`. Anonimowe API metadanych zwróciło
401; nie prosimy o klucz administracyjny ani dump. Dlatego gotowe pliki są do
przeglądu i testów; **przed produkcyjnym wykonaniem wymagane jest porównanie schematu**.
Brak zgodności schematu lub zmieniony start/koniec/identyfikator trasy blokuje import.

Źródło odrzucone: stara domena `andrzejowka.com.pl` przekierowuje do obcej strony;
nie użyto jej w żadnej karcie. Informacje o schronisku pochodzą z aktualnej
strony `www.andrzejowka.eu`.

Sprawdzone lokalnie 22 listopada 2026:

- Integracja PostgreSQL: import/ponowienie/cofnięcie/ponowny import, późniejsze edycje,
  konflikt na ostatniej trasie (także nieaktywna karta), zmiana startu, brak RLS,
  wymagane pole niezgodne z pakietem, trigger zmieniający treść i zewnętrzne referencje
  `ON DELETE CASCADE`. Zmiany wcześniejszych kart wycofywane przy błędzie.
- 23 testy komponentu, w tym cztery języki brakującego parkingu i odróżnienie tego
  stanu od błędu pobierania.
- Podgląd Chromium na odpowiedziach fixture: wszystkie 28 kart i 9 parkingów,
  PL/EN/UA/ZH, Light/Dark, 390/1440 px (16 kombinacji). Teksty zgodne z manifestem,
  brak wychodzących poza ekran elementów i błędów wykonania. To podgląd komponentu
  z nową treścią, nie test po produkcyjnym imporcie ani fizycznego telefonu.
