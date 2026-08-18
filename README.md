# Synixx — Camunda Modeler Plugins

Werkzeuge aus der [Synixx](https://www.smartbpm.de)-Familie für den
[Camunda Modeler](https://camunda.com/download/modeler/) (5+), MIT-lizenziert.

| Plugin | Zweck | Shortcut |
|---|---|---|
| [BPMN-Notation](plugins/notation/plugin/README.md) | Durchsuchbare Symbol-Legende zum Nachschlagen beim Modellieren | Alt+Shift+B |
| [BPMN-XML-Vollansicht](plugins/xml-full/plugin/README.md) | Komplettes Modell-XML als einklappbarer Baum | Alt+Shift+M |
| [Kommentare](plugins/kommentar/plugin/README.md) | documentation-Einträge als Marker-Badge + Hover-Tooltip | Alt+Shift+K |
| [BPMN-Strukturgraph (Graphviz)](plugins/bpmn-graphviz/plugin/README.md) | Abstrahierter Strukturgraph des Modells (viz.js, offline) | Alt+Shift+G |

## Installation (ohne Build)

Aus den [Releases](../../releases) das Zip des gewünschten Plugins laden und
entpacken nach:

- **macOS / Linux**: `~/.camunda-modeler/plugins/`
- **Windows**: `%APPDATA%\camunda-modeler\plugins\`

Camunda Modeler neu starten — fertig.

## Selbst bauen

```bash
npm ci && npm run build   # erzeugt plugins/<name>/plugin/client.bundle.js
```

## Lizenz

MIT (siehe LICENSE); Drittkomponenten in NOTICE.md. Entwickelt von SmartBPM,
mit Unterstützung von Anthropic Claude.
