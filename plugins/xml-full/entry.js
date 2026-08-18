// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 SmartBPM, Michael Ricken — Synixx-Werkzeugfamilie.
// Dieses Modul ist Teil der MIT-veröffentlichten Camunda-Modeler-Plugins
// (Repo synixx-camunda-plugins); die MIT-Lizenz gilt für DIESE Datei auch
// innerhalb des Synixx-Gesamtprojekts.
'use strict';

// BPMN-XML-Vollansicht (einklappbarer Baum) als Camunda-Modeler-Plugin.
// Bundling: esbuild → docs/cm-plugin_xml-full/client.bundle.js
//
// Inhalt:
//   - bpmn-comment-media (qs-cm-popup-pinned-Layout, Highlighter, z-Stack)
//   - bpmn-xml-full      (Panel-Logik, Tree-Rendering, Toggle-Logik)
//   - bpmn-js-Plugin-Registrierung

require('../../lib/bpmn-comment-media.js');
require('../../lib/bpmn-xml-full.js');
require('../../lib/qs-cm-analyse-wrap.js');

const { registerBpmnJSPlugin, registerPlatformBpmnJSPlugin, registerCloudBpmnJSPlugin } = require('camunda-modeler-plugin-helpers');

// Toolbar-Bauer kommt GETEILT aus qs-cm-analyse-wrap.js (Dedup 2026-08-17 —
// vorher wortgleich in 7 Entries kopiert). Pfeil-Delegation statt Direktzuweisung:
// robust gegen Lade-Reihenfolge innerhalb des Bundles.
const getOrCreateQsToolbar = (canvas) => window.qsCmGetOrCreateToolbar(canvas);

function XmlFullPlugin(eventBus, canvas, injector) {
    let pillBtn = null;
    let modeler = null;
    try { modeler = injector.get('bpmnjs', false); } catch (e) { /* ignore */ }

    function api() {
        if (!modeler || !window.attachBpmnXmlFull) return null;
        const a = window.attachBpmnXmlFull(modeler);
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
        pillBtn.className = 'qs-cm-pill qs-cm-pill-xmlfull';
        pillBtn.setAttribute('aria-pressed', 'false');
        pillBtn.title = 'BPMN-XML-Vollansicht öffnen — Alt+Shift+M';
        pillBtn.innerHTML = '<span class="qs-cm-pill-icon">📄</span><span class="qs-cm-pill-label">XML</span>';
        pillBtn.addEventListener('click', togglePanel);
        bar.appendChild(pillBtn);
    }
    eventBus.on('import.done', ensurePill);
    eventBus.on('canvas.viewbox.changed', ensurePill);
    setTimeout(ensurePill, 0);
    setTimeout(ensurePill, 200);
    setTimeout(ensurePill, 1000);

    // Tastatur-Shortcut Alt+Shift+M (X+G belegt; M wie „Markup")
    document.addEventListener('keydown', function (ev) {
        if (!ev || !ev.altKey || !ev.shiftKey) return;
        if (ev.key !== 'M' && ev.key !== 'm' && ev.code !== 'KeyM') return;
        ev.preventDefault();
        ev.stopPropagation();
        togglePanel();
    }, true);
}
XmlFullPlugin.$inject = ['eventBus', 'canvas', 'injector'];

const QsXmlFullModule = {
    __init__: ['qsXmlFull'],
    qsXmlFull: ['type', XmlFullPlugin],
};
if (typeof registerPlatformBpmnJSPlugin === 'function') registerPlatformBpmnJSPlugin(QsXmlFullModule);
if (typeof registerCloudBpmnJSPlugin    === 'function') registerCloudBpmnJSPlugin(QsXmlFullModule);
if (typeof registerBpmnJSPlugin         === 'function') registerBpmnJSPlugin(QsXmlFullModule);
