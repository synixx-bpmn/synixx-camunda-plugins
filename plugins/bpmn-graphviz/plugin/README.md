# BPMN-Strukturgraph (Graphviz) (Camunda Modeler Plugin)

Rendert das geöffnete BPMN-Modell als **abstrahierten Strukturgraphen**
(Graphviz-Layout) in einem schwebenden Fenster — nützlich, um Verzweigungs-
struktur und Zusammenhänge großer Modelle auf einen Blick zu erfassen.

Renderer ist **viz.js 1.8.2** (asm.js-Variante — bewusst kein WASM, damit die
Content-Security-Policy des Modelers eingehalten wird); vollständig offline.

## Verwendung

- Pill **„Graph"** in der Werkzeug-Leiste — oder **Alt+Shift+G**.
- Der Graph wird bei Modelländerungen neu gerendert; Fenster ziehbar.

## Installation

1. Diesen Ordner (`cm-plugin_bpmn-graphviz`) in das Plugin-Verzeichnis von Camunda
   Modeler kopieren:
   - **macOS / Linux**: `~/.camunda-modeler/plugins/cm-plugin_bpmn-graphviz/`
   - **Windows**: `%APPDATA%\camunda-modeler\plugins\cm-plugin_bpmn-graphviz\`
2. Camunda Modeler neu starten.

Alternativ: in eine Modeler-Instanz unter `<modeler>/resources/plugins/`
ablegen — dann nur in dieser Instanz aktiv. Kompatibel mit Camunda Modeler 5+.

## Lizenz

MIT — Teil der Synixx-Werkzeugfamilie (SmartBPM). Entwickelt mit
Unterstützung von Anthropic Claude (Co-Authored-By in der Historie).
