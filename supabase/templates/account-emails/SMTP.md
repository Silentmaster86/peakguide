# Propozycja konfiguracji wysyłki

Właściciel potwierdził wyłączone Custom SMTP. Nie skonfigurowano jeszcze dostawcy
ani nie uruchomiono wysyłki powitania. Poniższe kroki dotyczą proponowanej usługi
Resend; nie utworzono konta ani nie zakupiono domeny lub planu.

## Co trzeba ustalić

Potrzebna jest własna domena z dostępem do DNS. `peak-guide.netlify.app` jest
adresem hostowanej strony, nie domeną kontrolowaną przez właściciela w DNS do
weryfikacji nadawcy. Nie można zweryfikować `gmail.com` jako swojej domeny w Resend.
Strona może nadal działać pod dotychczasowym adresem Netlify.

Domyślna poczta Supabase jest przeznaczona do testów i ogranicza odbiorców do
adresów członków zespołu projektu. Udany test na skrzynce właściciela nie dowodzi
dostępności resetu hasła dla wszystkich użytkowników. Konfiguracja własnego SMTP
jest zatem potrzebna również dla istniejących wiadomości Auth.

## Po potwierdzeniu domeny

1. Utwórz konto Resend i dodaj domenę lub subdomenę nadawczą. W panelu DNS dodaj
   dokładnie rekordy wyświetlone przez Resend; nie wymyślaj wartości DKIM/SPF.
   Jeśli domena obsługuje już pocztę, zachowaj jej istniejącą konfigurację odbioru.
2. Zaczekaj na status weryfikacji domeny w Resend. Wyłącz śledzenie kliknięć dla
   wiadomości Auth, aby dostawca nie przepisywał linków resetowania.
3. Utwórz klucz wysyłki Resend. Klucz wpisuje się wyłącznie w ustawieniach usługi
   i sekretach serwera, nigdy w czacie, repozytorium lub zmiennych `VITE_*`.
4. W Supabase → Authentication → Emails → SMTP Settings wpisz:

| Pole | Wartość |
| --- | --- |
| Sender name | Przemysław — PeakGuide |
| Sender email | Wybrany adres w zweryfikowanej domenie |
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | Klucz API Resend |

5. Włącz Custom SMTP dopiero po przygotowaniu kompletu działających ustawień.
   Nie zmieniaj przy tej okazji Site URL ani obowiązku potwierdzania rejestracji.
6. Wgraj szablony i tematy opisane w [README.md](README.md), włącz natywne
   powiadomienie Password changed i sprawdź dostawę oraz reset na kontrolowanych
   kontach. Limity wiadomości ustala się osobno w Supabase i u dostawcy.

## Osobne powitanie

Samo włączenie SMTP obsługuje istniejącą pocztę Auth, ale nie tworzy powitania.
Następnym krokiem implementacji jest serwerowe zdarzenie rejestracji, kolejka,
ponawianie i deduplikacja wysyłki. Renderer czterech języków jest już przygotowany.
Adapter Resend ma przekazywać `reply_to: przemyslaw.pietkun@gmail.com` dla powitania.
Przycisk „Odpowiedz” skieruje wtedy wiadomość do właściciela; pole From pozostaje
adresem zweryfikowanego nadawcy. Nie zakładamy, że ustawienie Reply-To powitania
zmieni automatycznie nagłówki natywnych wiadomości Auth.

Źródła:
- https://supabase.com/docs/guides/auth/auth-smtp
- https://resend.com/docs/send-with-supabase-smtp
- https://resend.com/docs/dashboard/domains/introduction
