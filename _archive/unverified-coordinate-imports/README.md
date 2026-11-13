# Materiały nieweryfikowane — nie uruchamiać

Stare generatory wybierały szczyty na podstawie niejednoznacznej nazwy.
Archiwalne pliki SQL zawierają sprzeczne współrzędne, w tym inne obiekty
o tej samej nazwie. Rozszerzenie `.txt` celowo wyłącza je z migracji.

Nowy punkt wejścia: `scripts/generate_verified_coords.py`. Domyślnie tworzy
raport; SQL wymaga jawnego rejestru tożsamości i opcji `--write-sql`.
Współrzędne, kraj, QID oraz źródła należy sprawdzić dla konkretnego szczytu
i pasma. Sprawdzenie prostokąta kraju nie potwierdza tożsamości góry.
Wysokości nie są aktualizowane przez ten generator.

Nie oznacza to, że archiwalne błędy są obecne w działającej bazie.
Odczyt publiczny z 7 listopada 2026 potwierdził inne, polskie współrzędne
Polic​y, Krzemienia i Rotundy. Rekord `lakowa-wyspowy` nadal wymaga
rozstrzygnięcia tożsamości na podstawie źródła, nazwy i przypisanego pasma.
