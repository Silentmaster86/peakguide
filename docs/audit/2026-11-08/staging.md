# Uruchomienie stagingu, gdy istnieje tylko produkcyjny Supabase

Stan na 8 listopada 2026: właściciel potwierdził, że ma tylko projekt produkcyjny.
Nie utworzono jeszcze stagingu. Repozytorium nie zawiera pełnego schematu bazowego,
a podgląd PR #1 podczas audytu korzystał z publicznego API produkcji.
Podgląd frontendu nie oznacza oddzielnej bazy ani oddzielnych kont.

## 1. Utwórz projekt testowy — właściciel

1. Otwórz [panel Supabase](https://supabase.com/dashboard) i wybierz **New project**.
2. Nadaj nazwę `peakguide-staging`, wybierz odpowiednią organizację i region
   możliwie ten sam co produkcji. Sprawdź limit projektów i koszt pokazany w panelu;
   ta instrukcja nie zakłada konkretnego planu ani bezpłatnego dodatkowego projektu.
3. Zapisz nowe hasło bazy w menedżerze haseł. Nie używaj hasła produkcji.
4. Po uruchomieniu sprawdź Project URL i identyfikator projektu. Musi być inny niż
   produkcyjny `bxlntnuzrfnplpxfnmab`. URL/identyfikator można przekazać w rozmowie;
   hasło bazy, token konta Supabase i klucz `service_role` trafiają wyłącznie do
   ustawień sekretów środowiska lub pozostają na komputerze właściciela.

Utworzenie projektu nie odtwarza tabel, polityk, funkcji ani konfiguracji poczty.
Jeśli limit/koszt uniemożliwia drugi projekt, można odtworzyć schemat w lokalnym
Supabase z Dockerem. Lokalna skrzynka testowa nie potwierdzi dostarczania
wiadomości przez rzeczywisty serwer pocztowy.

## 2. Odczytaj strukturę produkcji — właściciel lub wykonawca z dostępem

Potrzebujemy schematu aplikacji, uprawnień, własnego triggera profilu na
`auth.users` i kodu Edge Function `admin-delete-user`. Nie potrzebujemy eksportu
wierszy `auth.users`, profili, sesji ani wiadomości kontaktowych.

Najpierw uruchom [audit_preflight.sql](../../../supabase/audit_preflight.sql)
w SQL Editor projektu produkcyjnego. Plik zawiera wyłącznie odczyty metadanych
przez `SELECT`; można go wykonać także na produkcji. Zapisz wyniki wszystkich
zapytań prywatnie — ostatnia tabela wyników nie zastępuje wcześniejszych.
Ten raport nie jest eksportem schematu i nie potwierdza samodzielnie poprawności RLS.

Przykład eksportu **samego schematu `public`** przy użyciu PostgreSQL `pg_dump`
na zaufanym komputerze (Bash; wersja klienta co najmniej taka jak serwera):

```sh
mkdir -p .audit-private
PGSSLMODE=require pg_dump \
  --host HOST_Z_PANELU_CONNECT \
  --port PORT_Z_PANELU_CONNECT \
  --username UZYTKOWNIK_Z_PANELU_CONNECT \
  --dbname postgres \
  --password \
  --schema-only \
  --no-owner \
  --schema public \
  --file .audit-private/production-public-schema.sql
```

Parametry host/port/użytkownik pobierz z **Connect** w produkcyjnym projekcie.
Użyj połączenia bezpośredniego albo session poolera; hasło wpisz dopiero w monicie
narzędzia. Komenda odczytuje strukturę, nie zmienia produkcji i nie eksportuje
wierszy. Nie dodawaj `--no-privileges`: granty są potrzebne do przeglądu.

Eksport ograniczony do `public` **nie jest kompletną kopią projektu**. Osobno trzeba:

- odczytać definicję własnego triggera na `auth.users` i wywoływanej przez niego
  funkcji; brak triggera może powodować brak profilu po rejestracji;
- sprawdzić własne obiekty w innych schematach, w tym funkcję kontroli administratora,
  rozszerzenie PostGIS, granty, domyślne uprawnienia i potrzebne role;
- pobrać źródła `admin-delete-user` z Edge Functions wraz z lokalnymi importami;
- zapisać ustawienia logowania, potwierdzania adresów i wysyłki poczty; to nie są
  ustawienia odtwarzane z dumpa `public`.

Przed udostępnieniem eksportu przejrzyj definicje funkcji: mimo braku wierszy mogą
zawierać zapisane ręcznie sekrety lub produkcyjne adresy integracji. Surowe pliki
trzymaj w ignorowanym `.audit-private/`. Dopiero przejrzany schemat aplikacji
powinien trafić do wersjonowania. Nie kopiuj systemowych tabel Auth/Storage.

## 3. Odtwórz schemat i dane testowe — wykonawca

1. Porównaj eksport z dotychczasowymi migracjami. Obecne pliki migracji zakładają
   istniejące tabele, więc nie wystarczą do uruchomienia pustego projektu.
2. Przygotuj bazowy schemat do odtworzenia na stagingu; wyłącz lub przekieruj
   produkcyjne webhooki i inne zewnętrzne wywołania znalezione w definicjach.
   Odtwórz wymagane rozszerzenia, obiekty i funkcję tworzenia profilu.
3. Porównaj rzeczywiste granty oraz RLS obu projektów. Domyślne uprawnienia nowego
   Supabase mogą być szersze niż produkcyjne; sam udany import SQL nie wystarczy.
4. Nie odtwarzaj automatycznie wszystkich historycznych migracji na aktualnym
   eksporcie. Ustal, które zmiany już zawiera, i zastosuj wyłącznie brakujące.
   Szczególnie sprawdź schemat PostGIS przed nową migracją
   `supabase/migrations/202611070011_admin_save_peak.sql`.
5. Dodaj minimalny, jawny zestaw testowy: języki, kraj, pasmo, podpasmo, szczyt
   z tłumaczeniami i trasę. Utwórz nowe konta testowe użytkownika i administratora
   na kontrolowanych adresach. Przed testami ochrony ostatniego administratora
   przygotuj drugie konto administracyjne.
6. Odtwórz przejrzane Edge Functions z konfiguracją stagingową. Hasła i klucze
   serwerowe ustaw wyłącznie w nowym projekcie.

Nie używaj `supabase/tests/admin_save_peak.sql` jako schematu stagingu: jest to
celowo uproszczona, jednorazowa baza do testu transakcji. Nie wykonuj `db reset`
na produkcji ani nie importuj do niej schematu stagingowego.

## 4. Podłącz podgląd Netlify — właściciel lub wykonawca z dostępem

W Netlify, dla projektu `peak-guide`, otwórz **Environment variables** i ustaw
wartości zależne od kontekstu, dostępne podczas **Builds**:

| Zmienna | Production | Deploy Previews |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Dotychczasowy URL produkcji | URL `peakguide-staging` |
| `VITE_SUPABASE_ANON_KEY` | Dotychczasowy publiczny klucz | Publiczny klucz stagingu |

Klucz może być publicznym `anon` albo nowym `publishable`; nazwa zmiennej w tej
aplikacji pozostaje `VITE_SUPABASE_ANON_KEY`. Nie używaj klucza `service_role`
ani `secret` w zmiennych `VITE_*`: są częścią kodu dostarczanego przeglądarce.

Po zapisaniu ustawień uruchom ponowny build podglądu PR #1. Vite zapisuje wartości
w bundlu podczas budowania; sama zmiana ustawień nie przełącza istniejącego deploya.
W przeglądarce otwórz Network i sprawdź, że żądania `rest/v1` i `auth/v1` idą do
identyfikatora nowego projektu. Dopiero wtedy rozpocznij testy zapisu.
Stare niezmienne adresy deployów mogą nadal zawierać produkcyjną konfigurację.

Dla lokalnej pracy skopiuj `peakguide_front/.env.example` do
`peakguide_front/.env.local` i wpisz publiczną konfigurację stagingu. Jeśli plik
już istnieje, świadomie zaktualizuj jego wartości; nie nadpisuj go w ciemno.

## 5. Ustaw Auth i wykonaj testy

Wyłącznie w **testowym Supabase**, Authentication → URL Configuration:

- Site URL: `https://deploy-preview-1--peak-guide.netlify.app`
- Redirect URLs: `https://deploy-preview-1--peak-guide.netlify.app/reset-password`

Włącz ten sam wymagany sposób potwierdzania adresu co na produkcji. Skonfiguruj
wysyłkę na kontrolowaną skrzynkę; ograniczenia domyślnego dostawcy poczty mogą
wymagać własnego SMTP. Nie wyłączaj potwierdzeń tylko po to, żeby test przeszedł.

Wykonaj scenariusze kont, ról, zapisu i wycofania transakcji opisane w
[instrukcji wdrożenia](../2026-11-07/wdrozenie.md). Zapisz adres stagingu, commit,
zastosowane migracje i wyniki każdego scenariusza. Dopiero te wyniki zamykają
testy rzeczywistego Supabase; wcześniejsze testy z mockami pozostają osobnym dowodem.

## Czas i stan prac

- Utworzenie pustego projektu i ustawienie zmiennych: szacunkowo 30–60 minut
  pracy właściciela, plus czas uruchomienia usług. To nie jest gotowy staging.
- Przegląd i odtworzenie schematu: 2–4 godziny przy kompletnym eksporcie;
  brakujące funkcje/uprawnienia mogą wydłużyć pracę.
- Testy rzeczywistych kont, RLS i transakcji: 4–8 godzin przy działającym stagingu.

Nie wykonano dotąd eksportu prywatnego schematu, importu do stagingu ani zmiany
zmiennych Netlify. Potrzebny jest dostęp właściciela; publiczny URL i klucz
przeglądarkowy nie dają dostępu administracyjnego do tych ustawień.

## Dokumentacja narzędzi

- [PostgreSQL: pg_dump](https://www.postgresql.org/docs/current/app-pgdump.html)
- [Supabase: przenoszenie projektu i ograniczenia eksportu](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore)
- [Netlify: zmienne i konteksty wdrożenia](https://docs.netlify.com/build/environment-variables/overview/)
- [Supabase: przekierowania Auth](https://supabase.com/docs/guides/auth/redirect-urls)
