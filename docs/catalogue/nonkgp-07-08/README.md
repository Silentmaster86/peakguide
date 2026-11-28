# Wspólne okno importu 07 + 08

**Przygotowane, jeszcze niewykonane.** Merge nie importuje danych do Supabase.
Partia 07 (#50) jest scalona; jej SQL został odłożony zgodnie z decyzją właściciela.
Nie ma zaległego importu #37/#38/#40. Obecnie właściciel tylko scala PR-y.

## Co obejmuje jedno wklejenie

| Partia | Szczyty | Trasy / POI | Tłumaczenia | Próbki profili |
| --- | --- | --- | --- | --- |
| 07 | Suchawa, Lesista Wielka | 2 / 2 | 16 | 247 |
| 08 | Wołek, Trzy Korony, Zamkowa Góra, Srebrna Kopa | 4 / 4 | 32 | 842 |
| Razem | 6 szczytów | 6 / 6 | 48 | 1089 |

To wyłącznie nowe trasy i POI. Bez zmian szczytów, ich współrzędnych, pasm,
uprawnień, kont, poczty, crona czy wcześniejszych pakietów.
Źródła i dokładne warianty: [07](../nonkgp-07/README.md), [08](../nonkgp-08/README.md).

## Gdy ustalimy wspólne okno

1. Upewnić się, że oba PR-y są scalone; lokalnie `git pull --ff-only` na czystym main.
2. Utworzyć aktualną kopię bazy według [procedury backupu Windows](../../operations/windows-backup.md).
3. Supabase → SQL Editor → New query: wykonać **[verify.sql](verify.sql)** przed importem.
   Oczekujemy 6 wierszy. Gdy nic nie importowano: po 0 tras/POI i `package_applied=false`.
   Istniejące niezgodne rekordy wymagają przeglądu; nie usuwać ich w celu przejścia guarda.
4. W nowym zapytaniu wkleić **cały [apply.sql](apply.sql)** i uruchomić raz.
   To **jedna transakcja** obu partii. Błąd w drugiej wycofuje także pierwszą.
5. Ponownie wykonać **[verify.sql](verify.sql)**: 6 wierszy, `trails=1`, `pois=1`,
   `mapped_trails=1`, języki `[en,pl,ua,zh]`, `review_matches=true`, `package_applied=true`.
6. Sprawdzić publicznie sześć kart: trasa na mapie, GPX, POI i profil wysokości,
   telefon/komputer, Light/Dark i cztery języki. Dopiero wynik pozwala oznaczyć import jako zakończony.

Do schowka w PowerShell, z katalogu repo:

```powershell
Get-Content .\docs\catalogue\nonkgp-07-08\verify.sql -Encoding UTF8 -Raw | Set-Clipboard
# Po sprawdzeniu wyniku:
Get-Content .\docs\catalogue\nonkgp-07-08\apply.sql -Encoding UTF8 -Raw | Set-Clipboard
```

Pliki są ASCII-only, z poprawnym Unicode w JSON. Nie wykonywać równocześnie
osobnych importów 07/08 jako nowych zadań. Powtórzenie wspólnego pliku jest
bezpieczne tylko przy niezmienionych danych i zgodnych pokwitowaniach.
Jeśli 07 została już poprawnie wgrana, plik ją zweryfikuje i dopisze tylko 08.

## Awaryjne cofnięcie

[rollback.sql](rollback.sql) cofa najpierw 08, potem 07, także w jednej transakcji.
Odmawia po późniejszej edycji lub nowych zależnościach, również FK CASCADE/SET NULL.
Błąd cofania 07 pozostawia obie partie w stanie sprzed uruchomienia.
Nie wykonywać profilaktycznie. Nie przywraca starych pełnych rekordów szczytów.

Testy lokalnej bazy obejmują późny błąd w 08, atomowe cofanie, niezależną kolejność,
powtórzenia, szkice i późniejsze zmiany. Nie jest to test odtworzenia prywatnej kopii.
