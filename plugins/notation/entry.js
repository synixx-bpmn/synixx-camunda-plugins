// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 SmartBPM, Michael Ricken — Synixx-Werkzeugfamilie.
// Dieses Modul ist Teil der MIT-veröffentlichten Camunda-Modeler-Plugins
// (Repo synixx-camunda-plugins); die MIT-Lizenz gilt für DIESE Datei auch
// innerhalb des Synixx-Gesamtprojekts.
'use strict';

// BPMN-Notationsübersicht als Camunda-Modeler-Plugin.
// Bundling: esbuild → docs/cm-plugin_notation/client.bundle.js

require('../../lib/bpmn-comment-media.js');
require('../../lib/bpmn-notation.js');
require('../../lib/qs-cm-analyse-wrap.js');

const { registerBpmnJSPlugin, registerPlatformBpmnJSPlugin, registerCloudBpmnJSPlugin } = require('camunda-modeler-plugin-helpers');

// Toolbar-Bauer kommt GETEILT aus qs-cm-analyse-wrap.js (Dedup 2026-08-17 —
// vorher wortgleich in 7 Entries kopiert). Pfeil-Delegation statt Direktzuweisung:
// robust gegen Lade-Reihenfolge innerhalb des Bundles.
const getOrCreateQsToolbar = (canvas) => window.qsCmGetOrCreateToolbar(canvas);

function NotationPlugin(eventBus, canvas, injector) {
    let pillBtn = null;
    let modeler = null;
    try { modeler = injector.get('bpmnjs', false); } catch (e) {}

    function api() {
        if (!modeler || !window.attachBpmnNotation) return null;
        const a = window.attachBpmnNotation(modeler);
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
        pillBtn.className = 'qs-cm-pill qs-cm-pill-notation';
        pillBtn.setAttribute('aria-pressed', 'false');
        pillBtn.title = 'BPMN-Notationsübersicht — Alt+Shift+B';
        pillBtn.innerHTML = '<span class="qs-cm-pill-icon">📖</span><span class="qs-cm-pill-label">BPMN</span>';
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
        if (ev.key !== 'B' && ev.key !== 'b' && ev.code !== 'KeyB') return;
        ev.preventDefault();
        ev.stopPropagation();
        togglePanel();
    }, true);
}
NotationPlugin.$inject = ['eventBus', 'canvas', 'injector'];

const QsNotationModule = {
    __init__: ['qsBpmnNotation'],
    qsBpmnNotation: ['type', NotationPlugin],
};
if (typeof registerPlatformBpmnJSPlugin === 'function') registerPlatformBpmnJSPlugin(QsNotationModule);
if (typeof registerCloudBpmnJSPlugin    === 'function') registerCloudBpmnJSPlugin(QsNotationModule);
if (typeof registerBpmnJSPlugin         === 'function') registerBpmnJSPlugin(QsNotationModule);
