# Edytory tras/POI i warstwy mapy — wdrożenie

## Co zawiera pakiet

- Panel → Narzędzia → Trasy / Punkty POI: tworzenie, edycja, publikacja/ukrywanie,
  tłumaczenia PL/EN/UA/ZH, źródła i daty, import GPX oraz opcjonalny GeoJSON.
- Zapis jedną funkcją RPC, pełne wycofanie po błędzie tłumaczenia, kontrola administratora
  i RLS. Blokada nadpisania zmian wprowadzonych przez innego redaktora.
- Zmiana samego tłumaczenia również aktualizuje wersję rekordu.
- Nie ma twardego kasowania z panelu: wyłączenie publikacji zachowuje powiązania.
- Mapa zbiorcza: osobne przełączniki POI i przebiegów tras. Dane są pobierane po
  włączeniu warstwy; filtry szczytów ograniczają także jej zawartość. Awaria warstwy
  nie wyłącza mapy szczytów. Brak geometrii oznacza trasę na liście bez linii na mapie.
- Partia danych: docs/catalogue/batch-01, pięć tras i pięć POI, rzeczywisty GPX Łysicy.

## Kolejność

1. Świeży backup i odizolowane środowisko testowe.
2. Wykonać odczytowy `supabase/operations/catalogue_management_preflight.sql`.
   Sprawdzić typy kolumn, bieżące polityki i PostGIS w public. Publiczne API pozwoliło
   potwierdzić istniejące kolumny/rekordy, lecz nie wszystkie prywatne metadane bazy.
3. Przejrzeć i wykonać migrację 014 na kopii, następnie na produkcji. Nie powtarzać
   starych migracji 001–013. Migracja 014 zakłada istniejące tabele katalogu,
   is_peakguide_admin i rolę authenticated. Nowe RPC są SECURITY INVOKER;
   anon nie ma prawa ich wykonania. Dodatkowe polityki restrykcyjne chronią
   publikację i dostęp do nieaktywnych szczytów także przy starszych politykach.
4. Wdrożyć frontend przez merge PR i Netlify.
5. Sprawdzić na kontrolowanym koncie administratora dodanie nieopublikowanej trasy,
   edycję i publikację, przypisanie POI oraz zmianę tłumaczeń. Zwykły użytkownik
   ma otrzymać odmowę zapisu. Tych testów produkcyjnych agent nie wykonał.
6. Uruchomić przygotowany import batch-01. To osobny skrypt danych, nie automatyczna
   migracja schematu. Zapoznać się ze źródłami i zakresami metryk w README partii.
7. Przejść do mapy, włączyć POI i Przebiegi tras, wybrać Łysicę. Sprawdzić jej pętlę,
   punkty, popupy i linki do szczegółów. Następnie sprawdzić pozostałe cztery szczyty.

Pomocniczy odczyt po wdrożeniu: `supabase/operations/catalogue_management_verify.sql`.
Oczekiwane uprawnienia RPC: SECURITY INVOKER, anon=false, authenticated=true.

## Granice i cofanie

Testowy PostgreSQL/PostGIS ma fixture zgodny z odczytanymi polami i wybranymi
kontraktami, nie pełną kopię produkcji. Nie zastępuje próbnego odtworzenia backupu.
Agent nie ma administracyjnego połączenia z produkcją, dlatego wykonanie migracji
oraz źródłowego importu należy do właściciela projektu.

W razie problemu frontend można cofnąć do poprzedniego wdrożenia, zachowując
kolumny i dane. Nie kasować pochopnie nowych kolumn ani rekordów. Dane partii można
cofnąć jej własnym rollback.sql, który chroni późniejsze edycje. Cofnięcie polityk
wymaga porównania z zapisanym preflightem; nie usuwać wszystkich RLS.
