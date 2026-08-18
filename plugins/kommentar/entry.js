// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 SmartBPM, Michael Ricken — Synixx-Werkzeugfamilie.
// Dieses Modul ist Teil der MIT-veröffentlichten Camunda-Modeler-Plugins
// (Repo synixx-camunda-plugins); die MIT-Lizenz gilt für DIESE Datei auch
// innerhalb des Synixx-Gesamtprojekts.
'use strict';

// Source-File für das gebündelte Kommentar-Plugin.
// esbuild bundelt zu docs/cm-plugin_kommentar/client.bundle.js — Camunda
// Modeler 5+ hat im Renderer kein nodeIntegration, deshalb müssen alle
// requires inline resolved werden.

const { registerBpmnJSPlugin, registerPlatformBpmnJSPlugin, registerCloudBpmnJSPlugin } = require('camunda-modeler-plugin-helpers');

// Shared media-helper (Markdown-Subset im Kommentar → Bild/Video/PDF/Embed-Vorschau).
// Wird in das Bundle eingebaut und attached sich zusaetzlich an window.qsCommentMedia.
require('../../lib/bpmn-comment-media.js');
require('../../lib/qs-cm-analyse-wrap.js');

const OVERLAY_TYPE = 'qs-comment';

function buildMarkerHtml(elementId) {
    return `<div class="qs-comment-dot" data-qs-elid="${elementId}" title="Kommentar">!</div>`;
}
function getDocText(element) {
    try {
        const bo = element && element.businessObject;
        if (!bo || !Array.isArray(bo.documentation)) return '';
        const first = bo.documentation[0];
        return (first && typeof first.text === 'string') ? first.text.trim() : '';
    } catch (e) { return ''; }
}
// Tooltip mit Bridge-Hover (pointer-events:auto in style.css gesetzt) und
// Markdown-Render via shared bpmn-comment-media.
let _tooltipEl = null;
let _tooltipHideTimer = null;
let _tooltipMediaCtx = null;       // wird vom Plugin pro Datei gesetzt
function setMediaContext(ctx) { _tooltipMediaCtx = ctx || null; }
function getTooltip() {
    if (_tooltipEl) return _tooltipEl;
    const t = document.createElement('div');
    t.className = 'qs-comment-tooltip';
    t.addEventListener('mouseenter', () => { clearTimeout(_tooltipHideTimer); _tooltipHideTimer = null; });
    t.addEventListener('mouseleave', () => scheduleHideTooltip());
    document.body.appendChild(t);
    _tooltipEl = t; return t;
}
function showTooltip(text, x, y) {
    const t = getTooltip();
    clearTimeout(_tooltipHideTimer); _tooltipHideTimer = null;
    const media = window.qsCommentMedia;
    if (media && typeof media.renderToHtml === 'function') {
        t.innerHTML = media.renderToHtml(text, _tooltipMediaCtx || {});
        try { media.attachPreviews(t, _tooltipMediaCtx || {}); } catch (e) { /* ignore */ }
    } else {
        t.textContent = text;
    }
    t.style.display = 'block';
    positionTooltip(x, y);
}
function scheduleHideTooltip() {
    clearTimeout(_tooltipHideTimer);
    _tooltipHideTimer = setTimeout(() => { if (_tooltipEl) _tooltipEl.style.display = 'none'; }, 200);
}
function hideTooltip() { scheduleHideTooltip(); }
function positionTooltip(x, y) {
    if (!_tooltipEl) return;
    const pad = 14;
    const w = _tooltipEl.offsetWidth || 200, h = _tooltipEl.offsetHeight || 40;
    let left = x + pad, top = y + pad;
    if (left + w > window.innerWidth - 8) left = x - w - pad;
    if (top + h > window.innerHeight - 8) top = y - h - pad;
    _tooltipEl.style.left = left + 'px'; _tooltipEl.style.top = top + 'px';
}
function computeMarkerPosition(element) {
    if (!element.waypoints) {
        const t = element.type || '';
        if (t.indexOf('Event') !== -1) return { top: -4, right: 4 };
        if (t.indexOf('Gateway') !== -1) return { top: 4, right: 8 };
        return { top: 4, right: 4 };
    }
    const wps = element.waypoints;
    if (wps.length < 2) return null;
    const segLens = []; let totalLen = 0;
    for (let i = 0; i < wps.length - 1; i++) {
        const dx = wps[i + 1].x - wps[i].x, dy = wps[i + 1].y - wps[i].y;
        const len = Math.hypot(dx, dy); segLens.push(len); totalLen += len;
    }
    if (totalLen === 0) return null;
    const halfLen = totalLen / 2;
    let traversed = 0, mx = wps[0].x, my = wps[0].y;
    for (let i = 0; i < segLens.length; i++) {
        if (traversed + segLens[i] >= halfLen) {
            const t = segLens[i] === 0 ? 0 : (halfLen - traversed) / segLens[i];
            mx = wps[i].x + (wps[i + 1].x - wps[i].x) * t;
            my = wps[i].y + (wps[i + 1].y - wps[i].y) * t;
            break;
        }
        traversed += segLens[i];
    }
    let minX = Infinity, minY = Infinity;
    for (const wp of wps) { if (wp.x < minX) minX = wp.x; if (wp.y < minY) minY = wp.y; }
    return { left: (mx - minX) - 9, top: (my - minY) - 9 };
}

// Toolbar-Bauer kommt GETEILT aus qs-cm-analyse-wrap.js (Dedup 2026-08-17 —
// vorher wortgleich in 7 Entries kopiert). Pfeil-Delegation statt Direktzuweisung:
// robust gegen Lade-Reihenfolge innerhalb des Bundles.
const getOrCreateQsToolbar = (canvas) => window.qsCmGetOrCreateToolbar(canvas);

function CommentMarkers(eventBus, canvas, overlays, elementRegistry, injector) {
    let enabled = true;
    let pillBtn = null;
    const markerByElement = new Map();
    let selection = null;
    let keyboard = null;
    try { selection = injector.get('selection', false); } catch (e) { /* ignore */ }
    try { keyboard = injector.get('keyboard', false); } catch (e) { /* ignore */ }

    function clearAllMarkers() {
        try { overlays.remove({ type: OVERLAY_TYPE }); } catch (e) { /* ignore */ }
        markerByElement.clear();
    }
    function setMarker(element) {
        if (!element || !element.id) return;
        if (element.type === 'bpmn:Process' || element.type === 'bpmn:Collaboration') return;
        if (element.labelTarget) return;
        if (element.type === 'label') return;
        const position = computeMarkerPosition(element);
        if (!position) return;
        const text = getDocText(element);
        const existing = markerByElement.get(element.id);
        if (!text) {
            if (existing) { try { overlays.remove(existing); } catch (e) {} markerByElement.delete(element.id); }
            return;
        }
        if (existing) { try { overlays.remove(existing); } catch (e) {} markerByElement.delete(element.id); }
        try {
            const id = overlays.add(element.id, OVERLAY_TYPE, { position, html: buildMarkerHtml(element.id) });
            markerByElement.set(element.id, id);
            attachMarkerInteractions(element);
        } catch (e) { /* ignore */ }
    }
    function attachMarkerInteractions(element) {
        try {
            const cont = canvas.getContainer();
            if (!cont) return;
            const dot = cont.querySelector(`.qs-comment-dot[data-qs-elid="${element.id}"]`);
            if (!dot || dot.__qsBound) return;
            dot.__qsBound = true;
            dot.addEventListener('mouseenter', (ev) => {
                if (!enabled) return;
                const text = getDocText(element);
                if (text) showTooltip(text, ev.clientX, ev.clientY);
            });
            dot.addEventListener('mousemove', (ev) => {
                if (!_tooltipEl || _tooltipEl.style.display !== 'block') return;
                positionTooltip(ev.clientX, ev.clientY);
            });
            dot.addEventListener('mouseleave', hideTooltip);
            if (selection && typeof selection.select === 'function') {
                dot.addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    try { selection.select(element); } catch (err) { /* ignore */ }
                });
            }
        } catch (e) { /* ignore */ }
    }
    function refreshAll() {
        clearAllMarkers();
        if (!enabled) return;
        try { elementRegistry.getAll().forEach(setMarker); } catch (e) { /* ignore */ }
    }
    function setEnabled(on) {
        if (on === enabled) return;
        enabled = !!on;
        if (enabled) refreshAll(); else { clearAllMarkers(); hideTooltip(); }
        if (pillBtn) pillBtn.setAttribute('aria-pressed', enabled ? 'true' : 'false');
    }

    eventBus.on('import.done', () => { if (enabled) refreshAll(); });
    eventBus.on('element.changed', (event) => {
        if (!enabled) return;
        const el = event && event.element;
        if (!el) return;
        if (el.labelTarget) { setMarker(el.labelTarget); return; }
        setMarker(el);
    });
    eventBus.on('shape.removed', (event) => {
        if (!enabled) return;
        const el = event && event.element;
        if (!el || !el.id) return;
        const ov = markerByElement.get(el.id);
        if (ov) { try { overlays.remove(ov); } catch (e) {} markerByElement.delete(el.id); }
    });
    eventBus.on('connection.removed', (event) => {
        if (!enabled) return;
        const el = event && event.element;
        if (!el || !el.id) return;
        const ov = markerByElement.get(el.id);
        if (ov) { try { overlays.remove(ov); } catch (e) {} markerByElement.delete(el.id); }
    });
    // Tooltip nur ueber dem gelben Kommentarsymbol (siehe attachMarkerInteractions),
    // NICHT ueber dem BPMN-Element selbst — Geschrieben wird im Properties-Panel,
    // hier ist alles reine Anzeige. Element-weiter Hover stoert den Klickfluss
    // (Maus passiert die Inline-Vorschauen mit iframe etc. nicht zuverlaessig).

    function ensurePill() {
        const bar = getOrCreateQsToolbar(canvas);
        if (!bar || pillBtn) return;
        pillBtn = document.createElement('button');
        pillBtn.type = 'button';
        pillBtn.className = 'qs-cm-pill qs-cm-pill-comments';
        pillBtn.setAttribute('aria-pressed', enabled ? 'true' : 'false');
        pillBtn.title = 'Kommentar-Marker ein/aus (Alt+Shift+K)';
        pillBtn.innerHTML = '<span class="qs-cm-pill-icon">💬</span><span class="qs-cm-pill-label">Kommentare</span>';
        pillBtn.addEventListener('click', () => setEnabled(!enabled));
        bar.appendChild(pillBtn);
    }
    eventBus.on('import.done', ensurePill);
    eventBus.on('canvas.viewbox.changed', ensurePill);
    setTimeout(ensurePill, 0);
    setTimeout(ensurePill, 200);
    setTimeout(ensurePill, 1000);

    // Media-Helper-Kontext: relative Pfade in Kommentaren funktionieren in CM
    // erst, wenn der Modeler die geladene BPMN-Datei mitteilt — diese Info ist
    // aktuell nicht vom bpmn-js-Plugin-Scope aus erreichbar (kein Tab-API hier).
    // Deshalb akzeptieren wir vorerst nur absolute URLs (http/https/file://) und
    // weisen relative Pfade ab (resolveLocal → null). User kann file://-Pfade
    // direkt in den Kommentar schreiben — Electron erlaubt das.
    setMediaContext({
        resolveLocal(rel) {
            // Kein bpmn-Dir bekannt → relative Pfade nicht aufloesbar.
            // (Kann in einer naechsten Iteration ueber Modeler-Tab-Hooks
            //  erweitert werden.)
            return null;
        },
        openExternal(url) {
            try {
                // Electron-Standard: window.open mit _blank → Default-Programm
                window.open(url, '_blank', 'noopener');
            } catch (e) { /* ignore */ }
        },
    });

    // Camunda Modeler faengt Strg-Shortcuts ab — daher Alt+Shift+K und
    // direkt am document horchen.
    document.addEventListener('keydown', function (ev) {
        if (!ev || !ev.altKey || !ev.shiftKey) return;
        if (ev.key !== 'K' && ev.key !== 'k' && ev.code !== 'KeyK') return;
        ev.preventDefault();
        ev.stopPropagation();
        setEnabled(!enabled);
    }, true);
}
CommentMarkers.$inject = ['eventBus', 'canvas', 'overlays', 'elementRegistry', 'injector'];

const QsCommentMarkersModule = {
    __init__: ['qsCommentMarkers'],
    qsCommentMarkers: ['type', CommentMarkers],
};
if (typeof registerPlatformBpmnJSPlugin === 'function') registerPlatformBpmnJSPlugin(QsCommentMarkersModule);
if (typeof registerCloudBpmnJSPlugin === 'function') registerCloudBpmnJSPlugin(QsCommentMarkersModule);
if (typeof registerBpmnJSPlugin === 'function') registerBpmnJSPlugin(QsCommentMarkersModule);
