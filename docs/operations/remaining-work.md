# Utrzymanie PeakGuide — stan i następne czynności

## Poczta

Uruchom `supabase/operations/email_health.sql` w SQL Editor. Skrypt jest odczytowy,
bez danych osobowych i sekretów. Sprawdza kolejkę, konta oczekujące na potwierdzenie,
przeterminowane rezerwacje i harmonogram. Nie zmienia statusów i nie ponawia poczty.

- `sent` oznacza przyjęcie przez SMTP, a nie potwierdzenie dostarczenia do skrzynki.
- Worker przetwarza jedną wiadomość na wywołanie, harmonogram co 5 minut: maksymalnie
  około 12 wiadomości na godzinę bez błędów. Zaległości przy większej rejestracji są
  spodziewane; przed skalowaniem uwzględnić limity Gmail i strategię wysyłki.
- `failed` / `uncertain`: sprawdzić logi Edge Functions i SMTP. Nie resetować kolejki
  masowo: wiadomość z niepewnym wynikiem mogła już dotrzeć.
- Cron `succeeded` potwierdza wykonanie SQL, nie dostawę SMTP. Porównać ze zmianami
  kolejki i logami funkcji, nie wystarczy sama lista uruchomień.
- Test właściciela do wykonania: nowe kontrolowane konto w ukraińskim i chińskim,
  potwierdzenie języka powitania oraz test przycisku „Odpowiedz”. Nie wysyłać testów
  do cudzych użytkowników i nie wykonywać backfill starych kont.

## Backup / brak pełnego stagingu

Istniejący dump z 9 listopada przeszedł tylko `pg_restore --list`. Pełne odtworzenie
nie zostało potwierdzone. Lokalny fixture PostGIS nie zastępuje backupu Supabase.

Kolejność odtworzenia:

1. Zanotować wersję PostgreSQL (`show server_version`), PostGIS i listę rozszerzeń.
2. Wykonać świeży dump. Chronić go lokalnie, poza repozytorium i publicznym czatem.
3. Przygotować osobny projekt Supabase lub zgodne środowisko lokalne, bez połączeń
   z produkcyjnymi sekretami, cronem, SMTP i webhookami. Nie uruchamiać kopii zadań
   asynchronicznych na rzeczywistych adresach użytkowników.
4. Przejrzeć spis `pg_restore --list`. Rozdzielić obiekty zarządzane przez Supabase
   od aplikacyjnych. Zwykły PostgreSQL może nie mieć ról auth, rozszerzeń i grantów
   Supabase — nie ignorować błędów restore ani nie podawać uniwersalnego `--clean`.
5. Odtworzyć w izolacji według procedury zgodnej z wybranym środowiskiem. Zachować
   log z `--exit-on-error`. Po odtworzeniu porównać liczniki aplikacyjnych tabel,
   FK, indeksy, RLS, granty, funkcje, triggery i zgodność punktów `geom`.
6. Sprawdzić role anon/user/admin, zapis szczytu i wycofanie błędu tłumaczenia,
   ochronę ostatniego admina oraz Edge Functions. API w testach poczty ma być atrapą.
7. Dopiero po udanym teście zapisać schemat aplikacji jako bazę odtwarzalnych
   migracji. Zanonimizowany fixture jest oddzielnym artefaktem od pełnego schematu.

Blokada: agent nie ma dumpa właściciela ani administracyjnego dostępu do Supabase.
Nie deklarujemy udanego odtworzenia ani kompletnego schematu na podstawie publicznego API.

## Stara funkcja clever-service

Sprawdzić listę wdrożonych funkcji, wywołania i logi w Supabase oraz odwołania
w aktualnym kodzie/konfiguracji. Brak nazwy w repo nie dowodzi braku zewnętrznych
klientów. Dopiero po potwierdzeniu nieużywania i zapisaniu źródła można ją usunąć.

## SEO i wydajność — osobny etap architektoniczny

Nie zmieniać językowych URL ani canonical w tym samym wydaniu co dane i panel.
Obecny język jest stanem UI; /pl/ i /en/ wymagają routingu, fallbacków tłumaczeń,
przekierowań starych adresów, canonical/hreflang i sitemap wszystkich wariantów.

Rekomendowany następny projekt: publiczne strony pod /pl/, /en/, /uk/, /zh/
(uk to kod URL, ua pozostaje kluczem istniejących danych), prerender publicznego
katalogu i zachowanie prywatnego panelu jako noindex. Przed wdrożeniem przygotować
mapę stary→nowy URL, testy bez JavaScript i plan odświeżania danych przy buildzie.
Nie generować hreflang do nieistniejących stron.

Najpierw zmierzyć produkcyjny build na telefonie (LCP/CLS i waterfall), a INP na
rzeczywistych interakcjach lub danych terenowych. Nie traktować samego rozmiaru
pakietu ani wyniku jednej emulacji jako Core Web Vitals wszystkich użytkowników.
Główny pakiet nadal ma około 537 kB przed gzip; mapa i panel już są ładowane osobno.
Sam podział vendor chunk usuwa ostrzeżenie, lecz niekoniecznie zmniejsza transfer.
