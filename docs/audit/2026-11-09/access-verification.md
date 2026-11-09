# Potwierdzone RLS i przetestowana poprawka ochrony administratorów

Źródło: `audit_access_snapshot` przekazany przez właściciela 9 listopada 2026.
Testy: lokalny PostgreSQL 16/PostGIS 3.5 w kontenerze bez sieci. Produkcja zgłasza
PostGIS 3.3.7. Nie połączono się z produkcyjną bazą i nie wykonano w niej zmian.
Ten raport uzupełnia wcześniejszy [raport metadanych](database-findings.md).

## Co można potwierdzić z metadanych

1. RLS jest włączone na `profiles`, `peaks`, `peaks_i18n`, `mountain_ranges`,
   `subranges`. Role `anon` i `authenticated` nie mają superuser/BYPASSRLS.
2. `relforcerowsecurity=false` nie wyłącza RLS dla tych ról. Tabele należą do
   `postgres`; właściciel i uprawnione funkcje SECURITY DEFINER mają osobną pozycję.
3. `anon` ma SELECT katalogu, nie ma INSERT/UPDATE/DELETE ani dostępu do profili.
4. `authenticated` ma uprawnienia SQL do modyfikacji katalogu/profili, ale polityki
   ograniczają je do administratora. Sam grant UPDATE nie nadaje zwykłemu
   użytkownikowi prawa zmiany własnej roli. Nie ma polityki edycji własnego profilu.
5. Administrator aplikacji to `role='admin' AND is_admin=true`. Funkcja rozpoznająca
   administratora należy do postgres, jest SECURITY DEFINER i ma pusty search_path.
   To pozwala sprawdzić profil bez rekurencji polityki profili. Anon nie ma EXECUTE.
6. Administrator ma wymagane USAGE na sekwencji `peaks_id_seq`. Anon też ma USAGE,
   lecz nie daje mu to prawa dodawania szczytów; ograniczenie zbędnego grantu można
   rozważyć osobno, bez przedstawiania go jako obejścia RLS.
7. `peaks_i18n` ma PK `(peak_id,lang)`, FK do `languages(code)` i kaskadę z `peaks`.
   Upsert w nowym RPC jest zgodny z kluczem konfliktu. Cztery obsługiwane języki
   muszą istnieć w tabeli languages; błąd FK wycofuje cały zapis.
8. `admin_save_peak` nie występuje w otrzymanej liście funkcji. Przed wdrożeniem
   frontendu nadal trzeba zastosować migrację 011, po sprawdzeniu konfiguracji.
9. EXECUTE na funkcjach zwracających `trigger` nie oznacza możliwości wywołania ich
   jako zwykłych RPC. Sam wynik `execute=true` dla takich funkcji nie dowodzi luki.

## Migracja 012 — poprawka przygotowana i sprawdzona lokalnie

Plik: `supabase/migrations/202611090012_serialize_profile_writes.sql`.
Dodaje prywatny pojedynczy rekord blokady oraz trigger BEFORE STATEMENT na
INSERT/UPDATE/DELETE profili. Każda operacja aktualizuje rekord blokady przed
modyfikacją wierszy. Blokada trwa do COMMIT/ROLLBACK. Dotychczasowy trigger
`protect_peakguide_admin_trigger` nadal sprawdza ochronę własnego profilu i ostatniego
administratora; migracja wymaga jego obecności i włączenia.

Aktualizacja rekordu (zamiast samej blokady advisory) wymusza konflikt wersji
przy starym snapshotcie w REPEATABLE READ/SERIALIZABLE. Transakcja ze starym widokiem
nie może zatwierdzić decyzji opartej na nieaktualnej liczbie administratorów.
Schemat, tabela i funkcja blokady nie są dostępne dla anon/authenticated.

Nie zmieniono kont, polityk, ról użytkowników ani uprawnień aplikacji.
Wszystkie zapisy profili, także rejestracja i zmiany nazwy, będą kolejno uzyskiwać
wspólną blokadę. To świadomy koszt prostego zabezpieczenia; przy dużej liczbie
zapisów należy zmierzyć opóźnienia. Utrzymuj transakcje krótkie.
Możliwe błędy 40001/deadlock wymagają ponowienia całej transakcji po odświeżeniu
uprawnień; nie należy automatycznie ignorować błędu ani ponawiać jednej instrukcji
w nieaktualnej transakcji. Długie transakcje Auth mogą również oczekiwać na blokadę.

### Wyniki

`profile_protection_repro.py --verify-fix` najpierw odtwarza brak administratorów
na starym mechanizmie, następnie stosuje migrację 012 i wymaga pozytywnych wyników:

- 3 rodzaje operacji: degradacja roli, DELETE profilu, DELETE `auth.users` z kaskadą;
- 3 poziomy izolacji: READ COMMITTED, REPEATABLE READ, SERIALIZABLE;
- 2 zakończenia pierwszej transakcji: COMMIT oraz ROLLBACK.

**18/18 prób: pozostaje dokładnie jeden administrator.** Test potwierdza rzeczywiste
oczekiwanie drugiej sesji przez `pg_blocking_pids`, bez polegania na losowym opóźnieniu.
Przeszły też ochrona własnego profilu, rollback masowego odebrania wszystkich ról
i sprawdzenie niedostępności prywatnej blokady dla klienta.
Kaskady testowano na minimalnej lokalnej tabeli `auth.users` i uprzywilejowanym
połączeniu, a nie przez wdrożoną funkcję Edge ani prawdziwe Supabase Auth.

## Zapis szczytu i kontrola dostępu

Fixture `supabase/tests/admin_save_peak.sql` odtwarza obecnie podane typy pięciu
głównych tabel, istotne FK, polityki i granty. Zastąpiono uproszczoną flagę
administratora rzeczywistą funkcją korzystającą z profilu. To nadal fixture,
nie pełny eksport produkcji: Auth i tabele countries/regions/languages są minimalne,
indeksy wydajnościowe nie są odtwarzane, a dodatkowy testowy CHECK na nazwie służy
celowemu wywołaniu błędu tłumaczenia. `auth.uid()` emuluje tożsamość sesji testowej.

Przeszły: zapis/aktualizacja administratora, typ geography i trigger współrzędnych,
walidacja wysokości, rollback tworzenia i aktualizacji po błędzie tłumaczenia,
rollback po błędzie prawdziwego FK języka, wybór podpasma, czyszczenie punktu,
odmowa RPC zwykłemu użytkownikowi, brak dostępu do cudzego profilu, brak możliwości
samodzielnego awansu, blokada bezpośredniego zapisu katalogu, ukrycie nieaktywnych
szczytów i tłumaczeń przed użytkownikiem/anon oraz brak dostępu anon do profili.

CI uruchamia test zapisu oraz `profile_protection_repro.py --local --verify-fix`.
Sam tryb historycznej reprodukcji bez `--verify-fix` nie jest testem bezpieczeństwa.
Dowody: `profile-lock-tests.txt`, `catalogue-access-tests.txt` w tym katalogu.

## Wdrożenie i pozostały zakres

Migracja 012 jest **przygotowana w PR, nie zastosowana na produkcji**. Wykonuje ją
zaufany właściciel bazy. Uruchamiaj raz w zwykłym przepływie migracji; ponowne
wykonanie przerwie się zamiast nadpisywać istniejącą tabelę blokady.
Przed zastosowaniem zachowaj definicje triggerów i kopię bazy. Po zastosowaniu
sprawdź kontrolowane konta, rejestrację i ścieżkę usuwania użytkownika.
Jeśli konieczne będzie wycofanie, trzeba świadomie przywrócić wcześniejszy mechanizm
i czasowo wstrzymać operacje zmiany ról/usuwania kont — samo usunięcie blokady
przywraca odtworzony problem współbieżności.

Do tego etapu nie potrzeba kolejnego eksportu tych pięciu tabel. Nadal brakuje:

- kodu wdrożonej Edge Function `admin-delete-user` i jej lokalnych importów;
- testów rzeczywistej rejestracji, poczty i odzyskiwania hasła;
- pełnego schematu pozostałych funkcji aplikacji, np. tras i wiadomości,
  jeśli odtwarzamy cały Supabase, a nie obecny wycinek testów.

Nie ogłoszono pełnego audytu całej produkcji zakończonym na podstawie tego wycinka.
