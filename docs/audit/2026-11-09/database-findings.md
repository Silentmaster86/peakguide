# Weryfikacja metadanych przekazanych przez właściciela — 9 listopada 2026

**Późniejsza aktualizacja:** [potwierdzone RLS, granty i lokalnie przetestowana
poprawka współbieżności](access-verification.md). Poniżej zachowano wyniki pierwszej
reprodukcji; opis „otwarty” odnosi się do stanu przed przygotowaniem migracji 012.

Źródło: wyniki zapytań SQL przekazane w rozmowie, nie bezpośredni dostęp do
produkcji. Testy wykonano w jednorazowym lokalnym PostgreSQL 16/PostGIS 3.5,
w kontenerze bez sieci. Produkcja zgłasza PostGIS 3.3.7 w `public`.
Nie jest to jeszcze pełny lokalny Supabase ani test prawdziwego Auth/Edge Functions.

## Potwierdzone informacje

- Nowy profil otrzymuje domyślnie `role='user'`, `is_admin=false`.
  Trigger `handle_new_user` nie kopiuje roli z metadanych użytkownika.
- `is_peakguide_admin()` i `protect_peakguide_admin()` stosują tę samą definicję:
  obie wartości `role='admin'` i `is_admin=true` muszą być spełnione.
- `profiles.id` odwołuje się do `auth.users(id)` z ON DELETE CASCADE.
  Usunięcie samego profilu nie usuwa konta Auth w przeciwnym kierunku.
  Źródła serwerowej funkcji `admin-delete-user` nadal brakuje.
- Polityki opisują publiczny odczyt aktywnych szczytów i ich tłumaczeń,
  własny profil użytkownika oraz szerszy dostęp administratora.
  Samo istnienie polityk nie dowodzi włączenia RLS ani właściwych grantów.
- `peaks.geom` ma typ geography, PostGIS jest w `public`. Trigger ustawia punkt
  w kolejności longitude/latitude i czyści go, gdy brakuje którejś współrzędnej.

## Poprawka wysokości — gotowa w gałęzi PR

Produkcja ma `elevation_m integer NOT NULL CHECK (elevation_m > 0)`.
Poprzednia walidacja dopuszczała -500..9000 oraz ułamki w przeglądarce.
Frontend i RPC teraz odrzucają niedodatnie wysokości i ułamki; pozostaje
dotychczasowy limit aplikacji 9000 m (nie pochodzi on z CHECK w bazie).
RPC waliduje przed konwersją JSON do rekordu, aby zwrócić kontrolowany błąd.

Pliki: `peakguide_front/src/features/adminPeaks/validation.js`, jego test,
`supabase/migrations/202611070011_admin_save_peak.sql`,
`supabase/tests/admin_save_peak.sql`.

Fixture uwzględnia teraz numeric dla współrzędnych, geography i podany trigger.
Przeszły: granice 1/9000, odrzucenie -500/-1/0/1.5/9001/null/tekstu, zapis
punktu, usuwanie punktu, wycofanie częściowego tworzenia/aktualizacji, odmowa
dla nieadministratora i brak EXECUTE dla anon. Fixture nadal upraszcza inne
tabele i funkcję rozpoznawania administratora; nie jest bazowym schematem produkcji.
Jawne odświeżenie geom w RPC pozostaje: test potwierdził współpracę z triggerem.

## Ochrona administratorów — odtworzony problem współbieżności, otwarty

`supabase/tests/profile_protection_repro.py` odtwarza przekazane funkcje i polityki
profili. Test zakłada włączone RLS i niezbędne granty. Zamiast Supabase Auth używa
lokalnej funkcji `auth.uid()` czytającej tożsamość testową z ustawienia sesji.

Wyniki:

1. Odebranie własnych uprawnień: blokowane przez trigger.
2. A odbiera uprawnienia B, następnie B próbuje odebrać uprawnienia A: pozostaje
   jeden administrator, druga operacja nie ma dostępu przez RLS.
3. Sekwencyjna degradacja ostatniego administratora przez uprzywilejowaną sesję:
   blokowana przez trigger (sprawdzenie samego triggera poza RLS).
4. A zmienia B i nie zatwierdza jeszcze transakcji. B nadal widzi swój
   zatwierdzony status administratora, zmienia A i zatwierdza. A zatwierdza.
   **Obie operacje przechodzą; pozostaje zero administratorów.**

To powtarzalna reprodukcja problemu w dostarczonym mechanizmie, a nie dowód,
że utrata administratorów wystąpiła na produkcji. Ukryte dodatkowe zabezpieczenia
lub inne rzeczywiste granty mogą zmienić dostępność ścieżki. Test nie obejmuje
równoległego usuwania kont przez Edge Function.

Proponowana naprawa: serializować wszystkie operacje mogące zmniejszyć liczbę
administratorów po stronie bazy, również bezpośrednie zapisy i kaskady z Auth.
Rozważyć prywatny wspólny rekord blokady aktualizowany przed modyfikacjami profili,
następnie sprawdzać uprawnienia i liczbę administratorów pod blokadą. Przetestować
READ COMMITTED oraz REPEATABLE READ/SERIALIZABLE, rollback i retry po konflikcie.
Samo blokowanie w przeglądarce ani sprawdzanie liczby w Edge Function nie wystarczy.
Nie dodano jeszcze migracji tej ochrony do produkcji ani nie oznaczono problemu jako naprawiony.

## Pozostałe ustalenia i brakujące dane

- `role` i `is_admin` dopuszczają NULL i nie mają pokazanego CHECK spójności.
  Nie dowodzi to obecności błędnych rekordów. Zanim dodamy ograniczenia, trzeba
  sprawdzić rzeczywiste wartości i ustalić sposób obsługi istniejących kont.
- Brak CHECK zakresu/pary współrzędnych i powiązania podpasma z wybranym pasmem.
  Nowy RPC waliduje te warunki, lecz bezpośrednie zapisy do tabeli mogą je ominąć,
  jeśli uprawnienia na nie pozwalają.
- `coalesce()` w triggerze rejestracji nie zastępuje pustego display_name.
- Komunikaty ochrony własnego profilu mówią o administratorze, choć warunek
  porównuje tylko ID, również dla zwykłego użytkownika.
- Nadal potrzebne: stan RLS, efektywne granty tabel/kolumn/sekwencji, pełne typy
  i ograniczenia `peaks_i18n`, `mountain_ranges`, `subranges`, właściciele funkcji.
  Zbiera je odczytowy `supabase/audit_access_snapshot.sql` w jednym wyniku.
  Ten wycinek nie jest pełnym eksportem całej aplikacji (np. tras i wiadomości).

## Odtworzenie lokalnej reprodukcji

Uruchom `python supabase/tests/profile_protection_repro.py NAZWA_LOKALNEGO_KONTENERA`
na jednorazowym lokalnym kontenerze PostgreSQL. Skrypt tworzy nową bazę
`peakguide_role_audit`; przerwie pracę, jeśli ona już istnieje. Potrzebuje klienta
`psql` w kontenerze i dostępu lokalnego Dockera. Nie przyjmuje URL zdalnej bazy.
Zwraca sukces, kiedy odtwarza znany problem — **nie jest testem akceptującym
ochronę administratorów**, dlatego nie dodano go jako zielonej bramki CI.

Dowody: `profile-race.json`, `postgres-metadata.txt`, `check-metadata.txt`
w tym katalogu. Lint, 77 testów Vitest, testy Node i build przeszły.
Pozostaje ostrzeżenie o pakiecie JS >500 kB. Nie powtarzano testów przeglądarki:
zmiany tej iteracji dotyczą walidacji i testu bazy, a nie przebudowy interfejsu.
