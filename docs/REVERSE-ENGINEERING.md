# KIPPO 1.0 — Reverse Engineering & Spiel-Spezifikation

> Rekonstruktion aus den Dateien im Verzeichnis (kompilierte QuickBasic-EXE,
> PCX-Bilder, TXT2COM-Textdateien). Stand der Analyse: 2026-05-31.
>
> **Wichtiger Hinweis zum „lesbar machen":** Die `.EXE`-Dateien sind mit
> QuickBasic/PDS kompiliert und teilweise mit LZEXE gepackt — also reiner
> Maschinencode. Ein sauberer Rückbau in den originalen BASIC-Quelltext ist
> daraus **nicht** möglich. Was sich vollständig rekonstruieren lässt (und unten
> dokumentiert ist), sind alle Bildschirmtexte, die Zahlen-/Preistabellen, der
> Programmablauf und die Grafiken. Daraus ist eine Neuauflage 1:1 ableitbar.

---

## 1. Was ist KIPPO?

KIPPO 1.0 ist ein **rundenbasiertes Wirtschafts-/Aufbauspiel** im Stil der
DOS-Klassiker *Hammurabi*, *Kaiser* und *Santa Paravia*. Der Spieler ist ein
Gutsherr („**Herr von Kipo**") im **14./15. Jahrhundert** und verwaltet Jahr für
Jahr seinen Landbesitz: Land kaufen/verkaufen, Feldfrüchte anbauen, ein Sägewerk
betreiben und mit Kühen handeln. Ziel ist, über die Jahre möglichst gut zu
wirtschaften. Schlechte Wirtschaft → Tod und Grabstein.

- **Autor / Geschichte:** Benjamin Wirtz
- **Studio-Logo:** „Laserline Entertainment"
- **Plattform:** MS-DOS, ab AT/8086, VGA-Grafikkarte
- **Sprache:** Deutsch
- **Spielzeitraum:** Jahr des Herrn **1420–1500** (siehe Grabstein)

---

## 2. Datei-Inventar & Rollen

| Datei | Typ | Rolle |
|---|---|---|
| `MENU.EXE` | QB-EXE | **Hauptmenü / Launcher.** „1 - Spielbeginn", „2 - Spielanleit.". Startet `ki.exe`, zeigt `anleit.com`, `info.com`. |
| `KIPPO.EXE` | QB-EXE | Alternativer Launcher (referenziert `ki.exe`, `anleit.com`, `info.com`, `zoom.exe`). |
| `INTRO.EXE` | QB-EXE | **Intro-Sequenz.** Zeigt nacheinander `laser.pcx` → `evol11.pcx` → `kippo.pcx` und ruft `zeich.exe` (Zeichen-/Animationsroutine). |
| `KI.EXE` | QB-EXE | **Spielkern (aktuelle Version, 22.04.1995).** Gesamte Spiellogik. Ruft am Start `intro.exe`, spielt eine Melodie, bei Spielende `view gruft.pcx`. |
| `KI_10.EXE` | QB-EXE | Spielkern **Version 1.0** (09.04.1995) — fast identisch zu `KI.EXE`, ältere Fassung. |
| `ANLEIT.COM` | TXT2COM | Spielanleitung (selbstanzeigender Text, s. u.). |
| `INFO.COM` | TXT2COM | Info-/Credits-Screen. |
| `AREA1.COM` | BAT2EXEC | Mini-Skript für die „Evolution Area"-Intro (ruft SHOW/ZOOM auf `evol11.pcx`/`laser.pcx`). |
| `INSTALL.BAT` | Batch | Installer: legt `C:\kippo` an, kopiert von `A:`, Start über `C:\menu.exe`. |
| `SHOW.EXE`, `VIEW.EXE` | Tools | PCX-Bildbetrachter (PC-Magazine-Utilities von Douglas Boling). Fremdcode, nicht Teil der Spiellogik. |
| `ZEICH.EXE` | QB-EXE | Zeichen-/Animationsroutine fürs Intro. |
| `ZOOM.EXE` | — | Referenziert, aber **nicht im Verzeichnis vorhanden** (PCX-Zoom-Tool). |
| `KIPPO.PCX` | Bild | Titelbild „KIPPO 1.0". |
| `GRUFT.PCX` | Bild | Todes-/Game-Over-Bildschirm (Grabstein). |
| `LASER.PCX` | Bild | „Laserline Entertainment"-Logo. |
| `EVOL11.PCX` | Bild | „Evolution Area"-Logo. |
| `MCP.PCX` | Bild | „M.C.P – Master Control Program" (Intro-/Boot-Screen). |

### Programm-Aufrufgraph
```
INSTALL.BAT  ──>  MENU.EXE  ──(1)──>  KI.EXE  ──(Start)──>  INTRO.EXE ──> SHOW laser/evol11/kippo.pcx, ZEICH.EXE
                     │                   │
                     ├─(2)─> ANLEIT.COM  └─(Tod)──────────> VIEW GRUFT.PCX
                     └────── INFO.COM
```

---

## 3. Bildschirme der Bilder (PCX)

- **KIPPO.PCX** – Titelschrift „KIPPO 1.0" auf einfarbigem Hintergrund mit
  ineinanderlaufenden Ellipsen/Planeten unten rechts.
- **GRUFT.PCX** – Grabstein mit zwei Kreuzen und „Bergketten"-Linien:
  > Hier Ruht in Frieden
  > **Hofschütze Herr von Kipo**
  > 1420 — 1500
  > (darunter zwei Zeilen astrologische/Rune-Symbole als Deko)
- **LASER.PCX** – „*Laserline* **ENTERTAINMENT**" mit Trennlinie.
- **EVOL11.PCX** – „EVOLUTION AREA" mit konzentrischen Rahmen.
- **MCP.PCX** – „M.C.P — Master Control Program" (Tron-Anspielung) mit
  konzentrischem Rahmen.

*(Hinweis: Es sind 16-Farben-EGA/VGA-PCX mit 640×480, RLE-komprimiert. Bei der
Konvertierung wird die Palette teils falsch interpretiert — Originalfarben in
DOS-VGA prüfen.)*

---

## 4. Spielablauf (rekonstruiert aus den Texten in KI.EXE)

Pro **Jahr (Runde)** durchläuft der Spieler folgende Bildschirme. Eingaben sind
durchweg J/N-Abfragen und Zahlen.

### Screen 1 — Landmarkt (Kauf/Verkauf)
```
PREIS FÜR WALD     = <zufällig>
PREIS FÜR WIESEN   = <zufällig>
PREIS FÜR ACKERL.  = <zufällig>

Sie sind <Alter> Jahre alt
Sie besitzen:
  <n> Morgen Wald
  <n> Morgen Wiese(n)
  <n> Morgen Ackerland
  <n> Taler

Wollen Sie etwas kaufen - J/N:
  Wieviele Morgen wollen Sie kaufen ?
  *WALD*      : __
  *WIESEN*    : __
  *ACKERLAND* : __

Wollen Sie etwas verkaufen - J/N:
  Wieviele Morgen wollen Sie verkaufen ?
  *WALD*      : __
  *WIESEN*    : __
  *ACKERLAND* : __

Sind die Eingaben korrekt ? J/N:
**TASTE DRÜCKEN**
```
Drei Landtypen: **Wald**, **Wiese**, **Ackerland**. Preise schwanken jede Runde
zufällig.

### Screen 2 — Anbau (nur auf Ackerland)
```
<n> Morgen Ackerland
Wieviel Morgen wollen Sie anbauen ?
  Mais        : __
  Kartoffeln  : __
  Gerste      : __
  Weizen      : __
```
Vier Feldfrüchte. Die Summe darf das verfügbare Ackerland nicht übersteigen.

**Ernteertrag pro Morgen (Spannweite, zufällig):**
| Frucht | Ertrag/Morgen |
|---|---|
| Mais | 90–50 |
| Kartoffeln | 50–40 |
| Gerste | 80–55 |
| Weizen | 90–50 |

**Unkosten pro Morgen (Spannweite, zufällig):**
| Frucht | Kosten/Morgen |
|---|---|
| Mais | 50–40 |
| Kartoffeln | 30–20 |
| Gerste | 40–30 |
| Weizen | 50–50 |

> Gewinn je Frucht ≈ (Ertrag − Unkosten) × angebaute Morgen, mit
> Zufallsschwankung innerhalb der angegebenen Spannen (Wetter/Ernteglück).

### Screen 3 — Sägewerk
```
Preis für ein Sägewerk : <Betrag>
Sie besitzen : <n> Sägewerke
Sie haben dieses Jahr : <Betrag> Taler durch ihr Sägewerk eingenommen!
Wenn sie ein Sägewerk kaufen, nehmen sie pro Morgen <Wald> ~150 Taler ein.
Wollen Sie ein Sägewerk kaufen ? J/N
```
Ein Sägewerk erzeugt passives Einkommen aus dem **Waldbesitz**: ca. **150 Taler
pro Morgen Wald** und Jahr (laut Anleitung).

### Screen 4 — Viehhandel (Kühe)
```
*** Viehhandel ***
KUHPREIS : <400–900, schwankend>
Sie Besitzen : <n>   WIESE: <n>   Geld: <n>

Wollen sie Kühe kaufen ? J/N :
  Wieviele wollen sie Kaufen ?
Wollen sie Kühe verkaufen ? J/N :
  Wieviele wollen sie Verkaufen ?
Sind die Eingaben richtig ?
```
**Kuhpreis schwankt zwischen 400 und 900 Talern.** Kauf/Verkauf als
Spekulation. Vermutlich an Wiesenbesitz gekoppelt (Weidefläche).

### Screen 5 — Jahresbilanz
```
Wir schreiben Heuer das Jahr des Herrn <Jahr>
Ende dieses Jahres besitzen Sie:
  <n> Sägewerke
  <Gewinn> ...
  <n> Morgen Wald
Sie haben angebaut:
  <n> M Mais
  <n> M Kartoffeln
  <n> M Gerste
  <n> M Weizen

 B I L A N Z
```
Danach Übergang ins nächste Jahr (Alter +1, Jahr +1).

### Spielende — zwei Ausgänge → GRUFT.PCX
Bei Tod/Spielende erscheint je nach Leistung einer von zwei Texten, dann
`view gruft.pcx`:

**Schlechter Herr (Versager/Tyrann):**
> „Die Leute des Dorfes sind froh dass sie gestorben sind. In ihrem Beruf waren
> sie ein Versager und haben ihre Bediensteten gequält. Auch die Gemeinde ist
> froh, denn sie waren ein Unruhestifter und Tyrann."

**Guter Herr:**
> „Sie haben gut gewirtschaftet und die Leute des Dorfes werden sie nie
> vergessen und immer in Erinnerung halten!"

### Sound
Beim Spielende wird eine QuickBasic-`PLAY`-Melodie abgespielt:
```
o1 f. f. f f. a- g g f f e f.
```
(getragene, tiefe Melodie in Oktave 1 — passend zum Grabstein-Screen).

---

## 5. Original-Anleitungstext (`ANLEIT.COM`, wörtlich)

> **Das Spiel Kippo 1.0** ist von Benjamin Wirtz programmiert worden und spielt
> in der Zeit vom 14.–15. Jahrhundert.
>
> **SPIELVERLAUF:**
> Auf dem ersten Spielbildschirm erscheinen die Preise von Wald, Wiese und
> Ackerland und wieviel Land sie schon besitzen. Darunter können sie eingeben ob
> sie Land kaufen oder verkaufen wollen.
>
> Der nächste Bildschirm fragt sie welche Kulturen sie auf ihrem Land anbauen
> wollen und sie können entscheiden zwischen Kartoffeln, Weizen, Mais und Gerste.
>
> Danach können sie entscheiden ob sie ein Sägewerk kaufen wollen oder nicht.
> Wenn sie ein Sägewerk besitzen verdienen sie pro Morgen Wald ca. 150 Taler.
>
> Auf dem 4. Bildschirm können sie mit Kühen handeln, wobei der Kuhpreis
> zwischen 400 und 900 Talern schwanken kann.
>
> Zum Schluß erscheint eine Jahresbilanz an dem sie erkennen können was sie
> angebaut haben.

---

## 6. Datenmodell für die Neuauflage

```ts
interface GameState {
  jahr: number;            // 1420 .. 1500
  alter: number;           // Spieleralter, +1 pro Jahr
  taler: number;           // Geld
  land: {
    wald: number;          // Morgen
    wiese: number;         // Morgen
    ackerland: number;     // Morgen
  };
  saegewerke: number;
  kuehe: number;
}

// Marktpreise — jede Runde neu zufällig:
interface Markt {
  preisWald: number;
  preisWiese: number;
  preisAckerland: number;
  preisSaegewerk: number;
  kuhpreis: number;        // 400..900
}

// Pro Frucht: Ertrag/Morgen und Unkosten/Morgen als [max, min]-Spanne
const FRUECHTE = {
  mais:       { ertrag: [50, 90], unkosten: [40, 50] },
  kartoffeln: { ertrag: [40, 50], unkosten: [20, 30] },
  gerste:     { ertrag: [55, 80], unkosten: [30, 40] },
  weizen:     { ertrag: [50, 90], unkosten: [50, 50] },
};

const SAEGEWERK_ERTRAG_PRO_WALD = 150; // Taler/Morgen Wald/Jahr
```

### Rundenlogik (Pseudocode)
```
für jedes Jahr von 1420 bis 1500 (oder bis Bankrott/Tod):
  1. Marktpreise würfeln
  2. Landmarkt:   Kauf/Verkauf von Wald/Wiese/Ackerland (Geld prüfen)
  3. Anbau:       Morgen je Frucht (Summe <= Ackerland)
  4. Sägewerk:    optional kaufen; Einkommen = saegewerke>0 ? 150*wald : 0
  5. Viehhandel:  Kühe kaufen/verkaufen zum aktuellen Kuhpreis
  6. Ernte/Abrechnung:
        je Frucht: gewinn += morgen * (rnd(ertrag) - rnd(unkosten))
        taler += ernteGewinn + saegewerkEinkommen + viehGewinn
  7. Bilanz anzeigen; alter++, jahr++
Spielende:
  bewertung = funktion(taler, land, ...) → "guter Herr" | "Tyrann"
  Grabstein-Screen + Melodie
```

> **Offene Punkte** (im kompilierten Code nicht eindeutig ablesbar, beim Nachbau
> zu definieren): genaue Zufalls-Preisspannen für Land/Sägewerk, ob Kühe Wiese
> „verbrauchen"/Ertrag liefern, exakte Siegbedingung/Tod-Auslöser (Alter?
> Bankrott?), und ob es Zufallsereignisse (Wetter, Pest) gibt. Diese sollten
> als bewusste Design-Entscheidungen der Neuauflage gesetzt werden.

---

## 7. Empfehlung für die Neuauflage

- **Genre beibehalten:** rundenbasierte Wirtschaftssim, ein Bildschirm pro
  Phase, klare Zahleneingaben — der Charme liegt in der Einfachheit.
- **Original-Texte & Endbildschirme** (Grabstein „Herr von Kipo 1420–1500",
  die beiden Schluss-Wertungen, das „Laserline Entertainment"-Logo) als
  Hommage übernehmen.
- **Tech-Stack-Vorschlag:** Web (TypeScript/React) oder ein kleines
  Terminal-/TUI-Spiel — die gesamte Logik ist deterministisch + RNG und passt in
  eine einzige Zustandsmaschine (siehe §6).
- **PCX-Assets** lassen sich mit ImageMagick/PIL nach PNG konvertieren
  (Palette manuell auf die VGA-16-Farben mappen) und als Retro-Splashscreens
  wiederverwenden.

---

## Anhang — Verwendete Extraktionsbefehle
```sh
# Lesbare Texte aus kompilierten EXEs (DOS-Codepage 437 → UTF-8)
strings -n 4 KI.EXE | iconv -f CP437 -t UTF-8

# TXT2COM-Anleitung lesen
iconv -f CP437 -t UTF-8 ANLEIT.COM | sed -n '/SPIELVERLAUF/,$p'

# PCX → PNG
magick KIPPO.PCX KIPPO.png
```
