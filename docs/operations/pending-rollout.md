# Stan wdrożeń — dawna lista oczekujących operacji

Stan: 21 listopada 2026. Zachowano tę ścieżkę dla istniejących odnośników.
**Poniższe operacje zostały wykonane przez właściciela i zweryfikowane w SQL.
Nie ma już oczekujących importów z tej serii. Nie uruchamiać ich ponownie na
podstawie starszych instrukcji lub samego merge.**

| Pakiet | Potwierdzony wynik |
| --- | --- |
| `twenty-peaks` (02 + 03) | 20 tras i 20 POI, cztery języki, geometria i adresy GPX |
| `batch-04` | Rysy, Lackowa i rejon Wysokiej Kopy: po trasie z geometrią/GPX i POI, cztery języki |
| `gpx-completion` | Cztery istniejące trasy partii 01 uzupełnione o rzeczywiste ślady i GPX |
| `coordinate-review` | Współrzędne i geom Śnieżnika, Rudawca i Lackowej zgodne z poprawką |
| `lysica-review` | id 28 publiczny, id 83 wyłączony i zachowany w bazie |
| `utf8-repair` | Wszystkie 46 rekordów kgp-02/03/04 zgodne tekstowo ze źródłami, `remaining_issues=[]` |

Wszystkie 28 aktywnych szczytów KGP mają co najmniej jedną aktywną trasę
z geometrią i POI. Nie jest to komplet wszystkich tras ani całego katalogu.
GPX Wysokiej Kopy prowadzi do Sinych Skałek, bez zamkniętego wierzchołka;
pozostałe ograniczenia zakresów są w README odpowiednich partii.

## Backup i kodowanie

Właściciel potwierdził backupy przed i po wdrożeniach. Próbne pełne odtworzenie
w izolacji nadal nie jest potwierdzone. [Skrypt Windows](windows-backup.md)
służy przyszłym kopiom; merge go nie uruchamia i nie wymaga ponowienia eksportu.
Spis archiwum i SHA-256 nie są testem pełnego restore.

Przy kopiowaniu plików SQL zawsze stosować jawne UTF-8:

```powershell
Get-Content .\SCIEZKA\PLIK.sql -Encoding UTF8 -Raw | Set-Clipboard
```

Poprzedni import przez PowerShell bez tego parametru uszkodził teksty.
Naprawa zachowała identyfikatory i odświeżyła rejestry. Nie usuwać/reimportować
rekordów w celu naprawy tekstu. Późniejsze edycje administratora celowo blokują
stare importy i rollbacki; nie wyłączać tych zabezpieczeń.

## Co dalej

Aktualna [karta kolejnego agenta](../handoff/NEXT-AGENT.md) opisuje ukończone
prace, granice danych i kolejne priorytety. Pozostają m.in. sześć starszych
tras zagranicznych bez GPX, kontrolowany test edytorów tras/POI, próbne
odtworzenie backupu, dalsze dane praktyczne oraz osobny etap SEO.
Procedura izolowanego odtwarzania i utrzymanie poczty: [remaining-work.md](remaining-work.md).
Nie przedstawiać testów na fixture ani zielonego CI jako dowodu wykonania
produkcyjnych operacji. Kolejne zmiany wymagają własnego zakresu i kontroli stanu.
