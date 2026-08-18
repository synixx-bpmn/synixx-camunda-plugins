// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 SmartBPM, Michael Ricken — Synixx-Werkzeugfamilie.
// Dieses Modul ist Teil der MIT-veröffentlichten Camunda-Modeler-Plugins
// (Repo synixx-camunda-plugins); die MIT-Lizenz gilt für DIESE Datei auch
// innerhalb des Synixx-Gesamtprojekts.
// Vollansicht des BPMN-XML als einklappbarer Baum.
// Strukturell analog zum bpmn-graphviz-Plugin: Toggle-Pille im Admin-Header
// oeffnet ein floating Pin-Panel (qs-cm-popup-pinned), drinnen der hierarchisch
// gerenderte XML-Baum mit Caret-Klick zum Auf-/Zuklappen einzelner Knoten.
//
// API: attachBpmnXmlFull(viewer) → { isPanelOpen, openPanel, closePanel, refresh, setOnClose }

(function () {
    'use strict';

    const STYLE_ID = 'qs-xmlfull-style';

    function ensureStyle() {
        if (document.getElementById(STYLE_ID)) return;
        const s = document.createElement('style');
        s.id = STYLE_ID;
        s.textContent = `
            .qs-xmlfull-panel { width: 720px; height: 560px; }
            .qs-xmlfull-panel.qs-fullscreen {
                width: 95vw !important; height: 95vh !important;
                left: 2.5vw !important; top: 2.5vh !important;
            }
            .qs-xmlfull-tree {
                font-family: ui-monospace, Menlo, Consolas, monospace;
                font-size: 11px;
                line-height: 1.45;
                color: var(--qs-text,#e6e8eb);
                background: var(--qs-panel,#1a1d22);
                padding: 8px 10px;
                overflow: auto;
                height: 100%;
                tab-size: 2;
            }
            .qs-xmlfull-panel.qs-pre-wrap .qs-xmlfull-tree { word-break: break-word; }
            .qs-xmlfull-el { white-space: nowrap; }
            .qs-xmlfull-panel.qs-pre-wrap .qs-xmlfull-el { white-space: normal; }
            .qs-xmlfull-row {
                cursor: default;
                display: block;
            }
            .qs-xmlfull-row.has-caret { cursor: pointer; }
            .qs-xmlfull-row.has-caret:hover { background: rgba(251,191,36,0.08); }
            .qs-xmlfull-caret {
                display: inline-block;
                width: 12px; text-align: center;
                color: var(--qs-text-mute,#94a3b8); user-select: none;
                margin-right: 2px;
            }
            .qs-xmlfull-caret.qs-no-children { color: transparent; }
            .qs-xmlfull-children { display: block; }
            .qs-xmlfull-el.qs-folded > .qs-xmlfull-children,
            .qs-xmlfull-el.qs-folded > .qs-xmlfull-closetag { display: none; }
            .qs-xmlfull-el.qs-folded > .qs-xmlfull-row > .qs-xmlfull-elision { display: inline; }
            .qs-xmlfull-elision { display: none; color: var(--qs-text-mute,#94a3b8); font-style: italic; margin-left: 4px; }
            /* XML-Token-Farben (passt zu qsCommentMedia-Highlighter) */
            .qs-xmlfull-bracket { color: var(--qs-amber,#fbbf24); }
            .qs-xmlfull-tag     { color: var(--qs-blue-soft,#60a5fa); }
            .qs-xmlfull-attr    { color: var(--qs-green,#34d399); }
            .qs-xmlfull-eq      { color: var(--qs-text-mute,#94a3b8); }
            .qs-xmlfull-val     { color: var(--qs-orange,#fb923c); }
            .qs-xmlfull-text    { color: var(--qs-text-dim,#d1d5db); }
            .qs-xmlfull-comment { color: var(--qs-text-mute,#6b7c93); font-style: italic; }
            .qs-xmlfull-pi      { color: var(--qs-purple,#c084fc); }
            .qs-xmlfull-error   { padding: 12px; color: #f87171; }
            /* Sync-Highlight: ausgewaehltes Element im BPMN → dezent dunkelblau
               im XML, durchgehend vom Opening-Tag ueber Children bis Closing-Tag.
               Linker Akzent-Strich laeuft ueber die volle Elementhoehe. */
            .qs-xmlfull-el.qs-xmlfull-selected {
                background: var(--qs-xml-sel,rgba(30, 58, 138, 0.30));
                box-shadow: inset 3px 0 0 #3b82f6;
                border-radius: 2px;
            }
            /* Opening-/Closing-Tag-Zeile etwas kontrastreicher, damit die Klammer
               als „Aufhaenger" des markierten Blocks erkennbar bleibt. */
            .qs-xmlfull-el.qs-xmlfull-selected > .qs-xmlfull-row,
            .qs-xmlfull-el.qs-xmlfull-selected > .qs-xmlfull-closetag {
                background: var(--qs-xml-sel-2,rgba(30, 58, 138, 0.22));
            }
            /* ---- Zeilennummern-Spalte (links, feste Nummer je gerenderter Zeile) ---- */
            .qs-xmlfull-row { position: relative; padding-left: 44px; }
            .qs-xmlfull-row::before {
                content: attr(data-ln);
                position: absolute; left: 0; top: 0;
                width: 34px; text-align: right;
                padding-right: 6px;
                color: var(--qs-text-mute,#6b7c93);
                background: var(--qs-panel-3,#0f1115);
                border-right: 1px solid var(--qs-border-soft,#2a2e36);
                user-select: none; font-variant-numeric: tabular-nums;
                opacity: 0.75;
            }
            /* im Zeilenumbruch-Modus bleibt die Nummer nur an der ersten Zeile */
            .qs-xmlfull-panel.qs-pre-wrap .qs-xmlfull-row::before { top: 0; bottom: auto; }
            /* ---- Suchleiste unter dem Header ---- */
            .qs-xmlfull-search {
                display: none; align-items: center; gap: 6px;
                padding: 5px 8px; flex: 0 0 auto;
                background: var(--qs-panel-3,#0f1115);
                border-bottom: 1px solid var(--qs-border-soft,#2a2e36);
            }
            .qs-xmlfull-panel.qs-search-open .qs-xmlfull-search { display: flex; }
            .qs-xmlfull-search input {
                flex: 1 1 auto; min-width: 60px;
                background: var(--qs-input-bg,#0f1115);
                color: var(--qs-text,#e6e8eb);
                border: 1px solid var(--qs-input-border,#3a4150);
                border-radius: 4px; padding: 3px 7px; font-size: 12px;
                font-family: ui-monospace, Menlo, monospace;
            }
            .qs-xmlfull-search input:focus { outline: none; border-color: var(--qs-accent,#60a5fa); }
            .qs-xmlfull-search .qs-xmlfull-scount {
                font-size: 11px; color: var(--qs-text-mute,#94a3b8);
                min-width: 54px; text-align: center; font-variant-numeric: tabular-nums;
                white-space: nowrap;
            }
            .qs-xmlfull-search button {
                background: transparent; border: 1px solid var(--qs-border,#3a4150);
                color: var(--qs-text-dim,#cbd5e1); border-radius: 4px;
                padding: 2px 7px; font-size: 12px; cursor: pointer; line-height: 1;
            }
            .qs-xmlfull-search button:hover { background: var(--qs-panel-2,rgba(255,255,255,0.06)); color: var(--qs-text,#fff); }
            .qs-xmlfull-search button.qs-xmlfull-ci.is-active {
                border-color: var(--qs-accent,#60a5fa); color: var(--qs-accent,#60a5fa);
            }
            /* ---- Treffer-Markierung ---- */
            .qs-xmlfull-hit {
                background: var(--qs-amber-bg,rgba(251,191,36,0.28));
                color: var(--qs-amber-soft,#fde68a);
                /* Rand gelb-orange (näher am Füll-Gelb) statt kräftigem Amber/Braun */
                border-radius: 2px; box-shadow: 0 0 0 1px rgba(251,191,36,0.85) inset;
            }
            .qs-xmlfull-hit.qs-xmlfull-hit-current {
                /* etwas helleres Blau als --qs-accent → dunkler Text bleibt gut
                   lesbar; kräftiger Rand markiert den aktuellen Treffer. */
                background: color-mix(in srgb, var(--qs-accent,#60a5fa) 55%, #ffffff);
                color: var(--qs-text,#111);
                box-shadow: 0 0 0 1px var(--qs-accent,#60a5fa) inset;
            }
        `;
        document.head.appendChild(s);
    }

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    // Wandelt einen <element> in HTML mit einklappbaren Children.
    // depth wird fuer Einrueckung benutzt (CSS macht die optische Tiefe).
    function renderElement(el, depth) {
        const pad = '  '.repeat(depth);
        const tag = el.tagName;
        // bpmn-Element-ID am wrapper-Div verankern → ermoeglicht O(1)-Lookup
        // beim Sync mit bpmn-js' selection.changed.
        const bpmnId = el.getAttribute && el.getAttribute('id');
        const idAttr = bpmnId ? ` data-bpmn-id="${esc(bpmnId)}"` : '';
        // Attribute serialisieren
        let attrs = '';
        for (const a of el.attributes) {
            attrs += ` <span class="qs-xmlfull-attr">${esc(a.name)}</span><span class="qs-xmlfull-eq">=</span><span class="qs-xmlfull-val">"${esc(a.value)}"</span>`;
        }
        // Children: Element-Nodes + Text-Nodes mit Inhalt + Comments + PIs
        const kids = [];
        for (const c of el.childNodes) {
            if (c.nodeType === 1) kids.push(c);              // ELEMENT
            else if (c.nodeType === 3) {                     // TEXT
                if (c.textContent && c.textContent.trim()) kids.push(c);
            } else if (c.nodeType === 8) kids.push(c);       // COMMENT
            else if (c.nodeType === 7) kids.push(c);         // PROCESSING_INSTRUCTION
            else if (c.nodeType === 4) kids.push(c);         // CDATA
        }
        const hasKids = kids.length > 0;
        const caretHtml = hasKids
            ? '<span class="qs-xmlfull-caret">▼</span>'
            : '<span class="qs-xmlfull-caret qs-no-children">·</span>';
        // Self-closing fuer leere Elemente
        if (!hasKids) {
            return (
                `<div class="qs-xmlfull-el" data-depth="${depth}"${idAttr}>` +
                  `<span class="qs-xmlfull-row qs-xmlfull-select-row">` +
                    `${pad}${caretHtml}` +
                    `<span class="qs-xmlfull-bracket">&lt;</span>` +
                    `<span class="qs-xmlfull-tag">${esc(tag)}</span>${attrs}` +
                    `<span class="qs-xmlfull-bracket">/&gt;</span>` +
                  `</span>` +
                `</div>`
            );
        }
        // Mit Children
        let childHtml = '';
        for (const c of kids) {
            if (c.nodeType === 1) {
                childHtml += renderElement(c, depth + 1);
            } else if (c.nodeType === 3) {
                const txt = c.textContent.trim();
                if (txt) childHtml += `<div class="qs-xmlfull-el" data-depth="${depth + 1}"><span class="qs-xmlfull-row">${'  '.repeat(depth + 1)}<span class="qs-xmlfull-caret qs-no-children">·</span><span class="qs-xmlfull-text">${esc(txt)}</span></span></div>`;
            } else if (c.nodeType === 8) {
                childHtml += `<div class="qs-xmlfull-el" data-depth="${depth + 1}"><span class="qs-xmlfull-row">${'  '.repeat(depth + 1)}<span class="qs-xmlfull-caret qs-no-children">·</span><span class="qs-xmlfull-comment">&lt;!--${esc(c.nodeValue || '')}--&gt;</span></span></div>`;
            } else if (c.nodeType === 7) {
                childHtml += `<div class="qs-xmlfull-el" data-depth="${depth + 1}"><span class="qs-xmlfull-row">${'  '.repeat(depth + 1)}<span class="qs-xmlfull-caret qs-no-children">·</span><span class="qs-xmlfull-pi">&lt;?${esc(c.target)} ${esc(c.data || '')}?&gt;</span></span></div>`;
            } else if (c.nodeType === 4) {
                childHtml += `<div class="qs-xmlfull-el" data-depth="${depth + 1}"><span class="qs-xmlfull-row">${'  '.repeat(depth + 1)}<span class="qs-xmlfull-caret qs-no-children">·</span><span class="qs-xmlfull-comment">&lt;![CDATA[${esc(c.nodeValue || '')}]]&gt;</span></span></div>`;
            }
        }
        return (
            `<div class="qs-xmlfull-el" data-depth="${depth}"${idAttr}>` +
              `<span class="qs-xmlfull-row has-caret qs-xmlfull-select-row">` +
                `${pad}${caretHtml}` +
                `<span class="qs-xmlfull-bracket">&lt;</span>` +
                `<span class="qs-xmlfull-tag">${esc(tag)}</span>${attrs}` +
                `<span class="qs-xmlfull-bracket">&gt;</span>` +
                `<span class="qs-xmlfull-elision">…</span>` +
              `</span>` +
              `<div class="qs-xmlfull-children">${childHtml}</div>` +
              `<div class="qs-xmlfull-closetag">` +
                `<span class="qs-xmlfull-row">${pad}<span class="qs-xmlfull-caret qs-no-children">·</span>` +
                `<span class="qs-xmlfull-bracket">&lt;/</span>` +
                `<span class="qs-xmlfull-tag">${esc(tag)}</span>` +
                `<span class="qs-xmlfull-bracket">&gt;</span></span>` +
              `</div>` +
            `</div>`
        );
    }

    function renderTree(xml) {
        const doc = new DOMParser().parseFromString(xml || '', 'application/xml');
        const perr = doc.getElementsByTagName('parsererror')[0];
        if (perr) return `<div class="qs-xmlfull-error">XML-Parse-Fehler: ${esc(perr.textContent || '')}</div>`;
        const root = doc.documentElement;
        if (!root) return '<div class="qs-xmlfull-error">Kein Root-Element gefunden.</div>';
        // Optional: XML-Deklaration vornedran zeigen
        let head = '';
        if (xml && xml.trim().startsWith('<?xml')) {
            const m = xml.match(/^\s*<\?xml[^?]*\?>/);
            if (m) head = `<div class="qs-xmlfull-el" data-depth="0"><span class="qs-xmlfull-row"><span class="qs-xmlfull-caret qs-no-children">·</span><span class="qs-xmlfull-pi">${esc(m[0].trim())}</span></span></div>`;
        }
        return head + renderElement(root, 0);
    }

    // Klick-Logik (Event-Delegation pro Tree-Root):
    //   - Klick auf Caret-Span → fold/unfold
    //   - Klick auf restliche Zeile (Tag/Attr) → bpmn-Element selektieren (wenn id-Attribut)
    function wireTreeToggles(treeRoot, onSelectBpmnId, onFoldChange) {
        treeRoot.addEventListener('click', (ev) => {
            const caretClicked = ev.target.classList && ev.target.classList.contains('qs-xmlfull-caret') &&
                                 !ev.target.classList.contains('qs-no-children');
            if (caretClicked) {
                const el = ev.target.closest('.qs-xmlfull-el');
                if (!el) return;
                const folded = el.classList.toggle('qs-folded');
                ev.target.textContent = folded ? '▶' : '▼';
                ev.stopPropagation();
                if (typeof onFoldChange === 'function') onFoldChange();
                return;
            }
            // Sonst: Selection
            const row = ev.target.closest('.qs-xmlfull-select-row');
            if (!row) return;
            const el = row.parentElement;
            if (!el || !el.classList.contains('qs-xmlfull-el')) return;
            const bpmnId = el.getAttribute('data-bpmn-id');
            if (!bpmnId) return;
            if (typeof onSelectBpmnId === 'function') onSelectBpmnId(bpmnId);
        });
    }
    // Feste, laufende Zeilennummer je gerenderter Zeile (stabil ab Render —
    // beim Falten verschwinden Zeilen mit ihrem Zweig, die Nummern springen,
    // bleiben aber je Zeile konstant). Über data-ln → CSS ::before.
    function numberLines(treeRoot) {
        let ln = 0;
        treeRoot.querySelectorAll('.qs-xmlfull-row').forEach((row) => {
            row.setAttribute('data-ln', String(++ln));
        });
    }
    function setAllFolded(treeRoot, folded) {
        treeRoot.querySelectorAll('.qs-xmlfull-el').forEach((el) => {
            const row = el.querySelector(':scope > .qs-xmlfull-row.has-caret');
            if (!row) return;
            const caret = row.querySelector('.qs-xmlfull-caret');
            if (folded) {
                el.classList.add('qs-folded');
                if (caret) caret.textContent = '▶';
            } else {
                el.classList.remove('qs-folded');
                if (caret) caret.textContent = '▼';
            }
        });
    }

    function attachBpmnXmlFull(viewer) {
        if (!viewer) return null;
        if (viewer.__qsXmlFull) return viewer.__qsXmlFull;
        ensureStyle();
        try { if (window.qsCommentMedia && window.qsCommentMedia.ensureStyles) window.qsCommentMedia.ensureStyles(); } catch (e) {}

        let panel = null;
        let lastXml = '';
        let onCloseCb = null;
        let autoRefresh = false;
        let cmdListenerInstalled = false;
        let autoRefreshTimer = null;
        let selectionListenerInstalled = false;
        let lastSelectedEl = null;
        let suppressSelectEcho = false;
        let onStateChangeCb = null;
        let stateChangeTimer = null;
        let suppressStateEcho = false;
        function notifyStateChange() {
            if (suppressStateEcho || !onStateChangeCb) return;
            clearTimeout(stateChangeTimer);
            stateChangeTimer = setTimeout(() => { try { onStateChangeCb(getState()); } catch (e) {} }, 200);
        }
        function getState() {
            if (!panel) return {};
            const foldedIds = [];
            panel.querySelectorAll('.qs-xmlfull-el.qs-folded[data-bpmn-id]').forEach((el) => {
                const id = el.getAttribute('data-bpmn-id');
                if (id) foldedIds.push(id);
            });
            return {
                foldedIds,
                wrap: panel.classList.contains('qs-pre-wrap'),
                fullscreen: panel.classList.contains('qs-fullscreen'),
                autoRefresh: !!autoRefresh,
                zoom: getZoom(),
            };
        }
        function getZoom() {
            const tree = panel && panel.querySelector('.qs-xmlfull-tree');
            const z = tree && tree.style.zoom;
            const n = z ? parseFloat(z) : 1;
            return isFinite(n) && n > 0 ? n : 1;
        }
        function setState(s, opts) {
            if (!s || !panel) return;
            const silent = opts && opts.silent;
            if (silent) suppressStateEcho = true;
            try {
                if (typeof s.wrap === 'boolean') {
                    panel.classList.toggle('qs-pre-wrap', s.wrap);
                    const btn = panel.querySelector('[data-act="wrap"]');
                    if (btn) btn.classList.toggle('is-active', s.wrap);
                }
                if (typeof s.fullscreen === 'boolean') panel.classList.toggle('qs-fullscreen', s.fullscreen);
                if (typeof s.autoRefresh === 'boolean') {
                    autoRefresh = !!s.autoRefresh;
                    const btn = panel.querySelector('[data-act="toggle-auto"]');
                    if (btn) btn.classList.toggle('is-active', autoRefresh);
                }
                if (typeof s.zoom === 'number' && isFinite(s.zoom)) {
                    const tree = panel.querySelector('.qs-xmlfull-tree');
                    if (tree) tree.style.zoom = String(Math.max(0.25, Math.min(4, s.zoom)));
                    if (typeof panel.__qsApplyZoom === 'function') {
                        // applyZoom liest zoom-Variable im closure — kann den remote-Wert nicht direkt lesen,
                        // daher Display manuell updaten.
                        const zd = panel.querySelector('[data-zoom]');
                        if (zd) zd.textContent = Math.round((s.zoom || 1) * 100) + '%';
                    }
                }
                if (Array.isArray(s.foldedIds)) {
                    const want = new Set(s.foldedIds);
                    panel.querySelectorAll('.qs-xmlfull-el[data-bpmn-id]').forEach((el) => {
                        const id = el.getAttribute('data-bpmn-id');
                        const wantsFolded = want.has(id);
                        const isFolded = el.classList.contains('qs-folded');
                        if (wantsFolded !== isFolded) {
                            el.classList.toggle('qs-folded', wantsFolded);
                            const caret = el.querySelector(':scope > .qs-xmlfull-row > .qs-xmlfull-caret');
                            if (caret && !caret.classList.contains('qs-no-children')) {
                                caret.textContent = wantsFolded ? '▶' : '▼';
                            }
                        }
                    });
                }
            } finally {
                if (silent) suppressStateEcho = false;
            }
        }
        function setOnStateChange(cb) { onStateChangeCb = (typeof cb === 'function') ? cb : null; }

        async function render(firstRender) {
            if (!panel) return;
            const wrap = panel.querySelector('.qs-cm-popup-body-wrap');
            wrap.innerHTML = `<div class="qs-xmlfull-tree">⏳ XML wird geladen…</div>`;
            try {
                const { xml } = await viewer.saveXML({ format: true });
                lastXml = xml || '';
                const html = renderTree(lastXml);
                wrap.innerHTML = `<div class="qs-xmlfull-tree" tabindex="0">${html}</div>`;
                const tree = wrap.querySelector('.qs-xmlfull-tree');
                numberLines(tree);
                wireTreeToggles(tree, selectInBpmn, notifyStateChange);
                // Offene Suche nach einem Re-Render (Refresh/Auto) neu ausführen,
                // damit Treffer-Markierung + Zähler zum neuen XML passen.
                try { if (panel && panel.classList.contains('qs-search-open') && typeof panel.__qsRunSearch === 'function') panel.__qsRunSearch(); } catch (e) { /* ignore */ }
                if (panel && typeof panel.__qsApplyZoom === 'function') panel.__qsApplyZoom();
                // Nach jedem Re-Render: aktuell selektiertes Element in bpmn-js
                // wieder im Tree markieren (sonst geht das Highlight bei Auto-
                // Refresh waehrend einer Selection verloren).
                // scrollOnRender = beim ERSTEN Aufbau (Panel-Oeffnen) zusaetzlich in den
                // View scrollen, damit eine schon vor dem Oeffnen bestehende Selektion
                // sofort sichtbar markiert ist — nicht erst nach einem Neu-Klick im Canvas.
                // Bei reinem Auto-Refresh (firstRender=false) NICHT scrollen, sonst springt
                // die Ansicht bei jeder BPMN-Aenderung.
                try {
                    const sel = viewer.get('selection', false);
                    if (sel) {
                        const cur = sel.get();
                        if (cur && cur.length) highlightInTree(cur[0].id, firstRender);
                    }
                } catch (e) { /* ignore */ }
            } catch (err) {
                wrap.innerHTML = `<div class="qs-xmlfull-error">Fehler: ${esc(err && err.message)}</div>`;
            }
        }

        function installCmdListener() {
            if (cmdListenerInstalled) return;
            try {
                const eb = viewer.get('eventBus', false);
                if (!eb) return;
                eb.on('commandStack.executed', () => {
                    if (!autoRefresh || !panel) return;
                    clearTimeout(autoRefreshTimer);
                    autoRefreshTimer = setTimeout(() => { if (panel) render(); }, 500);
                });
                cmdListenerInstalled = true;
            } catch (e) {}
        }

        // Selection-Sync (BPMN → XML): bpmn-js feuert 'selection.changed';
        // wir scrollen die zugehoerige Tree-Row in den View und markieren sie.
        function installSelectionListener() {
            if (selectionListenerInstalled) return;
            try {
                const eb = viewer.get('eventBus', false);
                if (!eb) return;
                eb.on('selection.changed', (event) => {
                    if (!panel || suppressSelectEcho) return;
                    const newSel = (event && event.newSelection) || [];
                    if (newSel.length === 0) { clearTreeHighlight(); return; }
                    highlightInTree(newSel[0].id, true);
                });
                selectionListenerInstalled = true;
            } catch (e) { /* ignore */ }
        }

        function clearTreeHighlight() {
            if (lastSelectedEl) {
                lastSelectedEl.classList.remove('qs-xmlfull-selected');
                lastSelectedEl = null;
            }
        }
        // Markiert die Tree-Row mit data-bpmn-id == id. Wenn scroll=true, scrollt
        // sie ins Bild + klappt alle Eltern auf, damit sie wirklich sichtbar wird.
        function highlightInTree(id, scroll) {
            if (!panel || !id) return;
            const tree = panel.querySelector('.qs-xmlfull-tree');
            if (!tree) return;
            clearTreeHighlight();
            const sel = '[data-bpmn-id="' + (window.CSS && CSS.escape ? CSS.escape(id) : id) + '"]';
            const el = tree.querySelector(sel);
            if (!el) return;
            el.classList.add('qs-xmlfull-selected');
            lastSelectedEl = el;
            // Eltern aufklappen
            let p = el.parentElement;
            while (p && p !== tree) {
                if (p.classList && p.classList.contains('qs-xmlfull-el') && p.classList.contains('qs-folded')) {
                    p.classList.remove('qs-folded');
                    const c = p.querySelector(':scope > .qs-xmlfull-row > .qs-xmlfull-caret');
                    if (c && !c.classList.contains('qs-no-children')) c.textContent = '▼';
                }
                p = p.parentElement;
            }
            if (scroll) {
                try { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
                catch (e) { try { el.scrollIntoView(); } catch (_e) {} }
            }
        }

        // Selection-Sync (XML → BPMN): Klick auf Tree-Row mit data-bpmn-id →
        // selection.select() im Modeler + Element ins Bild scrollen.
        function selectInBpmn(id) {
            try {
                const elReg = viewer.get('elementRegistry', false);
                const sel   = viewer.get('selection', false);
                const cv    = viewer.get('canvas', false);
                if (!elReg || !sel) return;
                const target = elReg.get(id);
                if (!target) return;
                suppressSelectEcho = true;
                try { sel.select(target); } catch (e) { /* ignore */ }
                try { if (cv && typeof cv.scrollToElement === 'function') cv.scrollToElement(target); } catch (e) { /* ignore */ }
                suppressSelectEcho = false;
                // Trotzdem im Tree visuell markieren (echo-suppress hat selection.changed unterdrueckt)
                highlightInTree(id, false);
            } catch (e) { /* ignore */ }
        }

        function buildPanel() {
            const div = document.createElement('div');
            div.className = 'qs-cm-popup qs-cm-popup-pinned qs-xmlfull-panel';
            div.innerHTML =
                `<div class="qs-cm-popup-header">` +
                  `<span style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:var(--qs-blue-soft,#60a5fa);"><span data-icon="file-code"></span>BPMN-XML (vollständig)</span>` +
                  `<div class="qs-cm-popup-actions">` +
                    `<button class="qs-cm-popup-btn" data-act="refresh" title="Neu laden">⟳</button>` +
                    `<button class="qs-cm-popup-btn" data-act="toggle-auto" title="Auto-Refresh bei BPMN-Änderung">⟲</button>` +
                    `<button class="qs-cm-popup-btn" data-act="expand-all" title="Alle aufklappen">⊞</button>` +
                    `<button class="qs-cm-popup-btn" data-act="collapse-all" title="Alle einklappen">⊟</button>` +
                    `<button class="qs-cm-popup-btn" data-act="zoom-out" title="Verkleinern">−</button>` +
                    `<span class="qs-cm-popup-zoom" data-zoom>100%</span>` +
                    `<button class="qs-cm-popup-btn" data-act="zoom-in" title="Vergrößern">+</button>` +
                    `<button class="qs-cm-popup-btn" data-act="zoom-reset" title="Zoom zurücksetzen">⤢</button>` +
                    `<button class="qs-cm-popup-btn" data-act="search" title="Suchen (Cmd/Ctrl+F)">🔍</button>` +
                    `<button class="qs-cm-popup-btn" data-act="wrap" title="Zeilenumbruch ein/aus">↵</button>` +
                    `<button class="qs-cm-popup-btn" data-act="copy" title="XML in Zwischenablage">⧉</button>` +
                    `<button class="qs-cm-popup-btn" data-act="export" title="XML herunterladen">⇩</button>` +
                    `<button class="qs-cm-popup-btn" data-act="fullscreen" title="Vollbild ein/aus">⛶</button>` +
                    `<button class="qs-cm-popup-btn" data-act="close" title="Schließen">✕</button>` +
                  `</div>` +
                `</div>` +
                `<div class="qs-xmlfull-search">` +
                  `<input type="text" placeholder="Im XML suchen…" spellcheck="false" />` +
                  `<span class="qs-xmlfull-scount">0 Treffer</span>` +
                  `<button class="qs-xmlfull-prev" title="Voriger Treffer (Shift+Enter)">‹</button>` +
                  `<button class="qs-xmlfull-next" title="Nächster Treffer (Enter)">›</button>` +
                  `<button class="qs-xmlfull-ci" title="Groß-/Kleinschreibung beachten">Aa</button>` +
                  `<button class="qs-xmlfull-sclose" title="Suche schließen (Esc)">✕</button>` +
                `</div>` +
                `<div class="qs-cm-popup-body-wrap"></div>`;
            document.body.appendChild(div);
            // Links-unten positionieren, damit das Analyse-Hover-Dropdown im Header
            // (rechts oben) nicht ueberdeckt wird.
            div.style.left = '40px';
            div.style.top  = '320px';
            try { window.qsCommentMedia && window.qsCommentMedia.bringToFront && window.qsCommentMedia.bringToFront(div); } catch (e) {}
            div.addEventListener('mousedown', () => {
                try { window.qsCommentMedia && window.qsCommentMedia.bringToFront && window.qsCommentMedia.bringToFront(div); } catch (e) {}
            }, true);

            // Drag
            const header = div.querySelector('.qs-cm-popup-header');
            let dragOff = null;
            header.addEventListener('mousedown', (e) => {
                if (e.target.closest('button')) return;
                const r = div.getBoundingClientRect();
                dragOff = { x: e.clientX - r.left, y: e.clientY - r.top };
                div.style.left = r.left + 'px'; div.style.top = r.top + 'px';
                e.preventDefault();
            });
            function onMove(e) {
                if (!dragOff) return;
                div.style.left = (e.clientX - dragOff.x) + 'px';
                div.style.top  = (e.clientY - dragOff.y) + 'px';
            }
            function onUp() { dragOff = null; }
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);

            // Zoom (CSS zoom-Property auf den Tree-Body, identisch zu Pin-/Inspector-Popups)
            let zoom = 1;
            function applyZoom() {
                const tree = div.querySelector('.qs-xmlfull-tree');
                if (tree) tree.style.zoom = String(zoom);
                const zd = div.querySelector('[data-zoom]');
                if (zd) zd.textContent = Math.round(zoom * 100) + '%';
            }
            function setZoom(z) { zoom = Math.max(0.25, Math.min(4, z)); applyZoom(); }
            div.querySelector('[data-act="zoom-in"]').addEventListener('click',  (e) => { e.stopPropagation(); setZoom(zoom * 1.25); notifyStateChange(); });
            div.querySelector('[data-act="zoom-out"]').addEventListener('click', (e) => { e.stopPropagation(); setZoom(zoom / 1.25); notifyStateChange(); });
            div.querySelector('[data-act="zoom-reset"]').addEventListener('click', (e) => { e.stopPropagation(); setZoom(1); notifyStateChange(); });
            div.querySelector('.qs-cm-popup-body-wrap').addEventListener('wheel', (e) => {
                if (!e.ctrlKey && !e.metaKey) return;
                e.preventDefault();
                setZoom(zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1));
                notifyStateChange();
            }, { passive: false });
            // Nach jedem render() den Zoom-Wert wieder anwenden, damit Refresh ihn behaelt.
            div.__qsApplyZoom = applyZoom;

            // ---- Suche: Treffer markieren, Zweige aufklappen, Trefferliste + Sprung ----
            const searchBar = div.querySelector('.qs-xmlfull-search');
            const searchInput = searchBar.querySelector('input');
            const searchCount = searchBar.querySelector('.qs-xmlfull-scount');
            let hits = [];          // Array der <mark>-Elemente
            let hitIdx = -1;        // aktueller Treffer
            let caseSensitive = false;

            function clearHits() {
                const tree = div.querySelector('.qs-xmlfull-tree');
                if (!tree) return;
                // <mark>-Wrapper entfernen: durch reinen Textknoten ersetzen und normalisieren.
                tree.querySelectorAll('mark.qs-xmlfull-hit').forEach((m) => {
                    const t = document.createTextNode(m.textContent);
                    m.parentNode.replaceChild(t, m);
                });
                // benachbarte Textknoten wieder zusammenführen (sonst zerfasert der Text)
                tree.querySelectorAll('.qs-xmlfull-row').forEach((r) => r.normalize());
                hits = []; hitIdx = -1;
            }

            // Alle Vorfahren eines Treffers aufklappen, damit er sichtbar ist.
            function expandAncestors(node) {
                let el = node.closest ? node.closest('.qs-xmlfull-el') : node.parentElement;
                while (el) {
                    if (el.classList.contains('qs-folded')) {
                        el.classList.remove('qs-folded');
                        const caret = el.querySelector(':scope > .qs-xmlfull-row .qs-xmlfull-caret');
                        if (caret && !caret.classList.contains('qs-no-children')) caret.textContent = '▼';
                    }
                    el = el.parentElement ? el.parentElement.closest('.qs-xmlfull-el') : null;
                }
            }

            // Markiert im gegebenen Textknoten alle Vorkommen von q und ersetzt ihn
            // durch Text + <mark>-Fragmente. Liefert die erzeugten <mark>s.
            function markTextNode(textNode, q) {
                const text = textNode.nodeValue;
                const hay = caseSensitive ? text : text.toLowerCase();
                const needle = caseSensitive ? q : q.toLowerCase();
                let from = 0, at, made = [];
                const frag = document.createDocumentFragment();
                while ((at = hay.indexOf(needle, from)) !== -1) {
                    if (at > from) frag.appendChild(document.createTextNode(text.slice(from, at)));
                    const mk = document.createElement('mark');
                    mk.className = 'qs-xmlfull-hit';
                    mk.textContent = text.slice(at, at + needle.length);
                    frag.appendChild(mk); made.push(mk);
                    from = at + needle.length;
                }
                if (!made.length) return [];
                if (from < text.length) frag.appendChild(document.createTextNode(text.slice(from)));
                textNode.parentNode.replaceChild(frag, textNode);
                return made;
            }

            function runSearch() {
                clearHits();
                const q = searchInput.value;
                const tree = div.querySelector('.qs-xmlfull-tree');
                if (!tree || !q) { updateCount(); return; }
                // Alle Text-Knoten in den Zeilen durchgehen (NICHT in schon-<mark>).
                // Innerhalb aller .qs-xmlfull-row (Tag/Attr/Val/Text/Comment-Spans).
                const rows = tree.querySelectorAll('.qs-xmlfull-row');
                rows.forEach((row) => {
                    const walker = document.createTreeWalker(row, NodeFilter.SHOW_TEXT, null);
                    const textNodes = [];
                    let n; while ((n = walker.nextNode())) { if (n.nodeValue && n.nodeValue.length) textNodes.push(n); }
                    textNodes.forEach((tn) => { hits.push(...markTextNode(tn, q)); });
                });
                // Treffer-Zweige aufklappen, damit jeder Treffer sichtbar ist.
                hits.forEach((m) => expandAncestors(m));
                if (hits.length) { hitIdx = 0; focusHit(0, true); }
                updateCount();
            }

            function updateCount() {
                if (!hits.length) { searchCount.textContent = searchInput.value ? 'Kein Treffer' : '0 Treffer'; }
                else searchCount.textContent = (hitIdx + 1) + ' / ' + hits.length;
            }

            function focusHit(i, scroll) {
                if (!hits.length) return;
                hits.forEach((m) => m.classList.remove('qs-xmlfull-hit-current'));
                hitIdx = ((i % hits.length) + hits.length) % hits.length;
                const m = hits[hitIdx];
                m.classList.add('qs-xmlfull-hit-current');
                expandAncestors(m);
                if (scroll) m.scrollIntoView({ block: 'center', inline: 'nearest' });
                updateCount();
            }
            function nextHit() { if (hits.length) focusHit(hitIdx + 1, true); }
            function prevHit() { if (hits.length) focusHit(hitIdx - 1, true); }

            function openSearch() {
                div.classList.add('qs-search-open');
                searchInput.focus(); searchInput.select();
                if (searchInput.value) runSearch();
            }
            function closeSearch() {
                div.classList.remove('qs-search-open');
                clearHits(); updateCount();
            }
            div.__qsToggleSearch = () => (div.classList.contains('qs-search-open') ? closeSearch() : openSearch());

            div.querySelector('[data-act="search"]').addEventListener('click', (e) => { e.stopPropagation(); div.__qsToggleSearch(); });
            searchBar.querySelector('.qs-xmlfull-sclose').addEventListener('click', (e) => { e.stopPropagation(); closeSearch(); });
            searchBar.querySelector('.qs-xmlfull-next').addEventListener('click', (e) => { e.stopPropagation(); nextHit(); });
            searchBar.querySelector('.qs-xmlfull-prev').addEventListener('click', (e) => { e.stopPropagation(); prevHit(); });
            const ciBtn = searchBar.querySelector('.qs-xmlfull-ci');
            ciBtn.addEventListener('click', (e) => { e.stopPropagation(); caseSensitive = !caseSensitive; ciBtn.classList.toggle('is-active', caseSensitive); runSearch(); });
            let searchDebounce = null;
            searchInput.addEventListener('input', () => { clearTimeout(searchDebounce); searchDebounce = setTimeout(runSearch, 150); });
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); if (e.shiftKey) prevHit(); else nextHit(); }
                else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeSearch(); div.focus(); }
            });
            // Expose runSearch für render()-Reapply.
            div.__qsRunSearch = runSearch;

            // Doppelklick auf ein Wort = SUCHE danach (Nutzer-Wunsch 2026-08-18):
            // nicht nur markieren — Suchfeld füllen, Leiste einblenden (falls zu)
            // und alle Fundstellen als <mark> zeigen. Aktueller Treffer bleibt das
            // ANGEKLICKTE Vorkommen (kein Wegspringen zur ersten Fundstelle) —
            // die geklickte Zeile überlebt runSearch (nur Textknoten werden durch
            // <mark>-Fragmente ersetzt), darüber wird der nahe Treffer gefunden.
            div.addEventListener('dblclick', (e) => {
                if (searchBar.contains(e.target)) return;
                const rowEl = e.target.closest ? e.target.closest('.qs-xmlfull-row') : null;
                if (!rowEl) return;
                const word = window.getSelection ? String(window.getSelection()).trim() : '';
                if (!word || /\s/.test(word) || word.length > 80) return;
                searchInput.value = word;
                div.classList.add('qs-search-open');
                runSearch();
                const near = hits.findIndex((m) => rowEl.contains(m));
                if (near > 0) focusHit(near, true);
            });

            // Actions
            div.querySelector('[data-act="refresh"]').addEventListener('click', (e) => { e.stopPropagation(); render(); });
            div.querySelector('[data-act="toggle-auto"]').addEventListener('click', (e) => {
                e.stopPropagation();
                autoRefresh = !autoRefresh;
                e.currentTarget.classList.toggle('is-active', autoRefresh);
                e.currentTarget.title = autoRefresh ? 'Auto-Refresh ein' : 'Auto-Refresh aus';
                notifyStateChange();
            });
            div.querySelector('[data-act="expand-all"]').addEventListener('click', (e) => {
                e.stopPropagation();
                const tree = div.querySelector('.qs-xmlfull-tree');
                if (tree) setAllFolded(tree, false);
                notifyStateChange();
            });
            div.querySelector('[data-act="collapse-all"]').addEventListener('click', (e) => {
                e.stopPropagation();
                const tree = div.querySelector('.qs-xmlfull-tree');
                if (tree) setAllFolded(tree, true);
                notifyStateChange();
            });
            div.querySelector('[data-act="wrap"]').addEventListener('click', (e) => {
                e.stopPropagation();
                const on = !div.classList.contains('qs-pre-wrap');
                div.classList.toggle('qs-pre-wrap', on);
                e.currentTarget.classList.toggle('is-active', on);
                notifyStateChange();
            });
            div.querySelector('[data-act="copy"]').addEventListener('click', async (e) => {
                e.stopPropagation();
                if (!lastXml) return;
                try { await navigator.clipboard.writeText(lastXml); } catch (err) {}
            });
            div.querySelector('[data-act="export"]').addEventListener('click', (e) => {
                e.stopPropagation();
                if (!lastXml) return;
                const blob = new Blob([lastXml], { type: 'application/xml' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = 'bpmn-diagram.bpmn';
                document.body.appendChild(a); a.click(); a.remove();
                setTimeout(() => URL.revokeObjectURL(url), 0);
            });
            div.querySelector('[data-act="fullscreen"]').addEventListener('click', (e) => {
                e.stopPropagation();
                div.classList.toggle('qs-fullscreen');
                notifyStateChange();
            });
            div.querySelector('[data-act="close"]').addEventListener('click', closePanel);
            div.tabIndex = -1;
            div.addEventListener('keydown', (e) => {
                if ((e.metaKey || e.ctrlKey) && (e.key === 'f' || e.key === 'F')) {
                    e.preventDefault(); e.stopPropagation();
                    div.classList.add('qs-search-open');
                    const si = div.querySelector('.qs-xmlfull-search input');
                    if (si) { si.focus(); si.select(); }
                    return;
                }
                // Esc schließt Suche wenn offen, sonst das Panel.
                if (e.key === 'Escape') {
                    if (div.classList.contains('qs-search-open')) { return; /* Suchfeld-Handler übernimmt */ }
                    closePanel();
                }
            });

            function destroy() {
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
                div.remove();
                panel = null;
            }
            div.__qsDestroy = destroy;
            return div;
        }

        function openPanel() {
            if (panel) { try { window.qsCommentMedia && window.qsCommentMedia.bringToFront && window.qsCommentMedia.bringToFront(panel); } catch (e) {} return; }
            panel = buildPanel();
            installCmdListener();
            installSelectionListener();
            render(true);
        }
        function closePanel() {
            if (panel && panel.__qsDestroy) panel.__qsDestroy();
            panel = null;
            try { if (typeof onCloseCb === 'function') onCloseCb(); } catch (e) {}
        }
        function refresh() { if (panel) render(); }
        function isPanelOpen() { return !!panel; }
        function setOnClose(fn) { onCloseCb = (typeof fn === 'function') ? fn : null; }

        const api = { openPanel, closePanel, refresh, isPanelOpen, setOnClose, getState, setState, setOnStateChange };
        viewer.__qsXmlFull = api;
        return api;
    }

    window.attachBpmnXmlFull = attachBpmnXmlFull;
})();
