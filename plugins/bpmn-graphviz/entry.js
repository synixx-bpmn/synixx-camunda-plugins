// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 SmartBPM, Michael Ricken — Synixx-Werkzeugfamilie.
// Dieses Modul ist Teil der MIT-veröffentlichten Camunda-Modeler-Plugins
// (Repo synixx-camunda-plugins); die MIT-Lizenz gilt für DIESE Datei auch
// innerhalb des Synixx-Gesamtprojekts.
'use strict';

// BPMN-Strukturgraph als Camunda-Modeler-Plugin.
//
// Renderer: viz.js v1.8.2 (mdaines, lite-Variante).
// Hintergrund: @hpcc-js/wasm-graphviz scheitert im CM an dessen Renderer-CSP
// (script-src 'self', kein 'wasm-unsafe-eval'). viz.js v1.x ist eine Emscripten-
// asm.js-Compile von Graphviz 2.40.1 — reines JavaScript ohne eval/Function/
// Worker/WebAssembly/importScripts/Blob-Scripts, daher CSP-konform.
// → Optisches Ergebnis identisch zum Web-Renderer (echte dot-Splines,
//   Cluster, Pfeilspitzen, Edge-Routing).
//
// Bundle-Größe: ~1.5 MB (viz-lite.js allein ist 1.4 MB). Im Desktop-Plugin
// einmalig beim Start geladen — OK.

const Viz = require('viz.js/viz-lite.js');

// Shared helpers ZUERST laden, damit selbst bei einem Renderer-Init-Fehler
// die Analyse-Wrap-Logik + Comment-Helpers verfuegbar sind und die anderen
// Pillen ihr Hover-Menue zurueck bekommen.
require('../../lib/bpmn-comment-media.js');
require('../../lib/bpmn-graphviz.js');
require('../../lib/qs-cm-analyse-wrap.js');

// HTML-Escape fuer Fallback-SVG
function _escHtml(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// --- Spacing-Angleich an BPMN-Live ---
// CM rendert mit Graphviz 2.40.1 (viz.js v1.8.2), BPMN Live mit einer
// neueren hpcc-js-WASM-Graphviz. Der geteilte generateDot() emittiert
// nodesep=0.4 / ranksep=0.7; die aeltere Engine layoutet damit deutlich
// luftiger (andere Font-Metriken → groessere Record-Knoten → laengere
// Kanten). Wir ziehen die beiden Werte NUR im CM-Shim enger, damit das
// Erscheinungsbild zur Live-Version passt. Tunable Konstanten:
const QS_NODESEP = 0.22;   // generateDot-Default: 0.4
const QS_RANKSEP = 0.36;   // generateDot-Default: 0.7

// Cluster-Margin im Cluster-Modus (Pool/Lane/Process als subgraph cluster_*).
// generateDot setzt margin=12; Graphviz 2.40.1 reserviert damit + Default-
// ranksep zwischen Clustern viel horizontalen Platz. Kleinerer Wert + global
// ranking (newrank) macht die verschachtelte Darstellung deutlich kompakter.
const QS_CLUSTER_MARGIN = 6;

function _tightenDot(dot) {
    if (typeof dot !== 'string' || !dot) return dot;
    let out = dot
        .replace(/\bnodesep\s*=\s*[0-9.]+\s*;/, 'nodesep=' + QS_NODESEP + ';')
        .replace(/\branksep\s*=\s*[0-9.]+\s*;/, 'ranksep=' + QS_RANKSEP + ';');
    // Falls generateDot die Attribute mal nicht setzt: nach `digraph ... {`
    // injizieren, damit das Spacing trotzdem greift.
    if (!/\bnodesep\s*=/.test(out) || !/\branksep\s*=/.test(out)) {
        out = out.replace(/(digraph\s+[^\{]*\{)/, '$1\n  nodesep=' + QS_NODESEP + '; ranksep=' + QS_RANKSEP + ';');
    }

    // Cluster-Modus kompaktieren (nur wenn subgraph-Cluster vorhanden):
    //   - cluster-margin von 12 auf QS_CLUSTER_MARGIN runter.
    // NICHT newrank=true: in Graphviz 2.40.1 (viz.js v1.x) bricht das in
    // Kombination mit rankdir + Clustern die Cluster-Orientierung — Cluster
    // werden dann quer zur Fliessrichtung gestapelt (bei LR untereinander,
    // bei TB nebeneinander). Bekannter Bug der alten Engine; die neuere
    // hpcc-js-WASM (BPMN Live) hat ihn nicht, viz.js v1.x schon. Wir
    // verzichten lieber auf die globale-Ranking-Kompaktierung als auf die
    // korrekte Orientierung.
    if (/subgraph\s+"cluster_/.test(out)) {
        out = out.replace(/\bmargin\s*=\s*[0-9.]+/g, 'margin=' + QS_CLUSTER_MARGIN);
    }
    return out;
}

// Emscripten asm.js kann den Heap NICHT dynamisch waehrend des Runs erweitern
// (Emscripten v1.x compile-Output ohne ALLOW_MEMORY_GROWTH=1). Default-Heap
// reicht fuer kleine BPMN-Diagramme; sobald Containment-Edges + grosse Modelle
// dazukommen, abortet viz.js mit `Cannot enlarge memory arrays`. Loesung:
// vorab mehr Speicher via `totalMemory`-Option allokieren, mit Auto-Retry-
// Doppelung wenn das gewaehlte Budget nicht reicht.
//
// Werte in Bytes — 64 / 128 / 256 MB. Jede Stufe braucht ~Stufengroesse RAM
// im JS-Heap waehrend des Renders, ist danach wieder freigegeben. 256 MB
// reicht erfahrungsgemaess auch fuer sehr grosse BPMN-Strukturgraphen.
const MEM_STEPS = [64, 128, 256].map((mb) => mb * 1024 * 1024);
let _lastOkMemIdx = 0;

function _isMemoryAbort(err) {
    const msg = String((err && err.message) || err || '');
    return /enlarge memory|Cannot enlarge|memory arrays|abort\(/i.test(msg);
}

window.qsGraphviz = {
    load() { return Promise.resolve(); },
    async toSvg(dot, engine) {
        // Spacing an BPMN-Live angleichen (nodesep/ranksep enger).
        const tightDot = _tightenDot(dot);
        // Ab dem zuletzt erfolgreichen Schritt starten — wenn beim letzten Mal
        // 128 MB noetig waren, faengt der naechste Render auch dort an.
        let lastErr = null;
        for (let i = _lastOkMemIdx; i < MEM_STEPS.length; i++) {
            try {
                const svg = Viz(tightDot, { format: 'svg', engine: engine || 'dot', totalMemory: MEM_STEPS[i] });
                if (i > _lastOkMemIdx) _lastOkMemIdx = i;
                return svg;
            } catch (err) {
                lastErr = err;
                if (!_isMemoryAbort(err)) break; // anderer Fehler → nicht erneut versuchen
                try {
                    const nextMb = (i + 1 < MEM_STEPS.length) ? MEM_STEPS[i + 1] / 1024 / 1024 : null;
                    console.warn('[qs-graphviz] Heap ' + (MEM_STEPS[i] / 1024 / 1024) + ' MB zu klein' +
                        (nextMb ? ' — retry mit ' + nextMb + ' MB' : ' — bereits am Maximum'));
                } catch (e) {}
            }
        }
        const msg = (lastErr && lastErr.message) || String(lastErr) || 'unbekannter Fehler';
        const maxMb = MEM_STEPS[MEM_STEPS.length - 1] / 1024 / 1024;
        const hint = _isMemoryAbort(lastErr)
            ? ` (Heap-Limit ${maxMb} MB überschritten — Containment ausschalten oder Diagramm verkleinern)`
            : '';
        try { console.warn('[qs-graphviz/viz.js] render failed:', lastErr); } catch (e) {}
        return `<svg xmlns="http://www.w3.org/2000/svg" width="700" height="100"><text x="20" y="40" font-family="ui-monospace,Menlo,monospace" font-size="12" fill="#b91c1c">Render-Fehler: ${_escHtml(msg)}</text><text x="20" y="65" font-family="ui-monospace,Menlo,monospace" font-size="11" fill="#92400e">${_escHtml(hint)}</text></svg>`;
    },
};
try { console.log('[qs-graphviz] viz.js v1.8.2 aktiv (CSP-konformer asm.js-Renderer)'); } catch (e) {}

const { registerBpmnJSPlugin, registerPlatformBpmnJSPlugin, registerCloudBpmnJSPlugin } = require('camunda-modeler-plugin-helpers');

// --- Toolbar-Pille (gemeinsam mit anderen CM-Plugins) ---
// Toolbar-Bauer kommt GETEILT aus qs-cm-analyse-wrap.js (Dedup 2026-08-17 —
// vorher wortgleich in 7 Entries kopiert). Pfeil-Delegation statt Direktzuweisung:
// robust gegen Lade-Reihenfolge innerhalb des Bundles.
const getOrCreateQsToolbar = (canvas) => window.qsCmGetOrCreateToolbar(canvas);

function BpmnGraphvizPlugin(eventBus, canvas, injector) {
    let pillBtn = null;
    let modeler = null;
    try { modeler = injector.get('bpmnjs', false); } catch (e) { /* ignore */ }

    function api() {
        if (!modeler || !window.attachBpmnGraphviz) return null;
        const a = window.attachBpmnGraphviz(modeler);
        if (a && typeof a.setOnClose === 'function') {
            a.setOnClose(() => { if (pillBtn) pillBtn.setAttribute('aria-pressed', 'false'); });
        }
        return a;
    }
    function togglePanel() {
        const a = api();
        if (!a) return;
        if (a.isPanelOpen()) {
            a.closePanel();
            if (pillBtn) pillBtn.setAttribute('aria-pressed', 'false');
        } else {
            a.openPanel();
            if (pillBtn) pillBtn.setAttribute('aria-pressed', 'true');
        }
    }

    function ensurePill() {
        const bar = getOrCreateQsToolbar(canvas);
        if (!bar || pillBtn) return;
        pillBtn = document.createElement('button');
        pillBtn.type = 'button';
        pillBtn.className = 'qs-cm-pill qs-cm-pill-graphviz';
        pillBtn.setAttribute('aria-pressed', 'false');
        pillBtn.title = 'BPMN-Strukturgraph (Graphviz) öffnen — Alt+Shift+G';
        pillBtn.innerHTML = '<span class="qs-cm-pill-icon">📊</span><span class="qs-cm-pill-label">Graph</span>';
        pillBtn.addEventListener('click', togglePanel);
        bar.appendChild(pillBtn);
    }
    eventBus.on('import.done', ensurePill);
    eventBus.on('canvas.viewbox.changed', ensurePill);
    setTimeout(ensurePill, 0);
    setTimeout(ensurePill, 200);
    setTimeout(ensurePill, 1000);

    document.addEventListener('keydown', function (ev) {
        if (!ev || !ev.altKey || !ev.shiftKey) return;
        if (ev.key !== 'G' && ev.key !== 'g' && ev.code !== 'KeyG') return;
        ev.preventDefault();
        ev.stopPropagation();
        togglePanel();
    }, true);
}
BpmnGraphvizPlugin.$inject = ['eventBus', 'canvas', 'injector'];

const QsBpmnGraphvizModule = {
    __init__: ['qsBpmnGraphviz'],
    qsBpmnGraphviz: ['type', BpmnGraphvizPlugin],
};
if (typeof registerPlatformBpmnJSPlugin === 'function') registerPlatformBpmnJSPlugin(QsBpmnGraphvizModule);
if (typeof registerCloudBpmnJSPlugin    === 'function') registerCloudBpmnJSPlugin(QsBpmnGraphvizModule);
if (typeof registerBpmnJSPlugin         === 'function') registerBpmnJSPlugin(QsBpmnGraphvizModule);
