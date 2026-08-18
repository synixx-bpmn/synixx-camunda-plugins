# Kommentare (Camunda Modeler Plugin)

Markiert BPMN-Elemente mit gepflegten `bpmn:documentation`-Einträgen durch
ein kleines gelbes Badge ("!") in der oberen-rechten Ecke und blendet beim
Hover den Kommentartext als Tooltip ein. Funktioniert auf Shapes (Tasks,
Events, Gateways, Subprozesse, ...) und auf Sequenzlinien (Marker auf der
Polyline-Mitte).

Das Bearbeiten erfolgt über das **eingebaute Properties-Panel** von Camunda
Modeler im Tab **Documentation** — kein eigener Editor-Dialog. Klick auf den
Marker selektiert das Element, sodass das Properties-Panel sofort den
passenden Eintrag zeigt.

## Installation

1. Diesen Ordner (`cm-plugin_kommentar`) in das Plugin-Verzeichnis von Camunda
   Modeler kopieren:
   - **macOS / Linux**: `~/.camunda-modeler/plugins/cm-plugin_kommentar/`
   - **Windows**: `%APPDATA%\camunda-modeler\plugins\cm-plugin_kommentar\`
2. Camunda Modeler neu starten.

Alternativ: in eine Modeler-Instanz unter `<modeler>/resources/plugins/`
ablegen — dann nur in dieser Instanz aktiv.

## Verwendung

1. Element auswählen, im Properties-Panel den Tab "Documentation" öffnen,
   Text eingeben.
2. Sobald der Text gespeichert ist (Tab-Verlassen oder Klick außerhalb),
   erscheint das Marker-Badge auf dem Element.
3. Marker-Hover blendet den Tooltip ein. Marker-Klick selektiert das Element
   wieder, falls man's verloren hat.
4. Text leeren → Marker verschwindet automatisch.

### Zwei Ebenen zum An/Aus-Schalten

1. **Pill „💬 Kommentare"** im Diagramm-Canvas (amber = aktiv, grau = aus)
2. **Tastatur-Shortcut** `Alt+Shift+K` (kollisionsfrei mit Modeler-Shortcuts)

Beide toggeln dasselbe Flag. Beim Aus-Schalten verschwinden Marker und
Tooltip — der Documentation-Text bleibt aber im Modell und kann weiterhin
im Properties-Panel bearbeitet werden.

Ein Plugins-Menü-Toggle ist bewusst nicht implementiert (führte zu
Plugin-Lade-Konflikten in unserer Camunda-Modeler-Version).

## Marker-Verhalten je Element-Typ

- **Tasks / Subprozesse**: Marker oben-rechts in der Bbox (4 px Inset).
- **Events** (Kreise): Marker leicht über der Bbox-Oberkante, damit er auf
  gleicher Höhe mit Mittelpunkt-Markern an mittig austretenden
  Sequenzpfeilen sitzt.
- **Gateways** (Diamonds): Marker etwas nach links versetzt, näher an der
  oberen-rechten Diamond-Kante (statt im leeren Bbox-Eck).
- **Connections** (SequenceFlow, MessageFlow): Marker geometrisch in der
  Mitte der Polyline (proportional über alle Segmente).
- **Labels**: werden ignoriert (teilen sich das BusinessObject mit dem
  Parent-Shape) — sonst gäbe es pro kommentiertem Element zwei Marker.

## Quelle

Port von `public/js/bpmn-comments.js` aus dem Quixx-Quiz-Show-Projekt
(Vortrag/Lehre rund um BPMN-Live-Demos). In dem Projekt gibt es zusätzlich
eine eigene Sidebar zum Bearbeiten — die fällt im Modeler weg, weil das
Properties-Panel die Funktion bereits abdeckt.
