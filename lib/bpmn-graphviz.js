// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 SmartBPM, Michael Ricken — Synixx-Werkzeugfamilie.
// Dieses Modul ist Teil der MIT-veröffentlichten Camunda-Modeler-Plugins
// (Repo synixx-camunda-plugins); die MIT-Lizenz gilt für DIESE Datei auch
// innerhalb des Synixx-Gesamtprojekts.
// BPMN-Strukturvisualisierer via Graphviz (Client-Side).
//
// Toggle-Pille im Admin oeffnet ein floating, resize-/zoom-/fullscreen-bares
// Panel. Drinnen: kompletter Strukturgraph des aktuellen BPMN-Modells.
// Jedes Element mit id wird zu einem Knoten, jede Connection (SequenceFlow,
// MessageFlow, Association, BoundaryEvent attachedToRef) zu einer Kante.
// Doppelte Verlinkung via <incoming>/<outgoing>-Backreferences wird gefiltert.
//
// API: attachBpmnGraphviz(viewer) → { isPanelOpen, openPanel, closePanel, refresh }
//
// Lazy-Loading: graphviz.bundle.js (~780 KB) wird erst beim ersten Oeffnen
// nachgezogen, danach pro Session ein einmaliger WASM-Init.

(function () {
    'use strict';

    const STYLE_ID = 'qs-graphviz-style';
    const BUNDLE_URL = '/js/graphviz.bundle.js';

    // ---- Styles ----
    function ensureStyle() {
        if (document.getElementById(STYLE_ID)) return;
        const s = document.createElement('style');
        s.id = STYLE_ID;
        s.textContent = `
            .qs-graphviz-panel {
                /* erbt qs-cm-popup-pinned-Layout: flex column, drag header, resize handle.
                   Etwas groesser als die anderen Pin-Popups, weil Graphen Platz brauchen. */
                width: 720px; height: 560px;
            }
            .qs-graphviz-panel.qs-fullscreen {
                width: 95vw !important; height: 95vh !important;
                left: 2.5vw !important; top: 2.5vh !important;
            }
            .qs-graphviz-status {
                padding: 12px;
                color: var(--qs-text-dim,#aaa);
                font-style: italic;
                font-size: 12px;
                text-align: center;
            }
            .qs-graphviz-error {
                padding: 12px;
                color: #f87171;
                font-family: ui-monospace, Menlo, Consolas, monospace;
                font-size: 11px;
                white-space: pre-wrap;
            }
            /* Erklaerungs-Banner ueber dem DOT-Source, wenn WASM-CSP-geblockt. */
            .qs-graphviz-banner {
                padding: 10px 12px;
                background: #422006;
                color: #fde68a;
                font-size: 11.5px;
                line-height: 1.45;
                border-bottom: 1px solid #78350f;
            }
            .qs-graphviz-banner strong { color: #fef3c7; }
            .qs-graphviz-banner kbd {
                background: var(--qs-panel-2,#1f2937);
                color: #f3f4f6;
                padding: 1px 5px;
                border-radius: 3px;
                font-family: ui-monospace, Menlo, Consolas, monospace;
                font-size: 10.5px;
            }
            .qs-graphviz-svg-wrap {
                width: 100%; height: 100%;
                background: #fff;
                overflow: auto;
                position: relative;
            }
            .qs-graphviz-svg-wrap svg {
                display: block;
            }
            /* DOT-Source-Ansicht im selben Body, wenn Toggle aktiv */
            .qs-graphviz-dot-pre {
                margin: 0;
                padding: 8px 10px;
                color: var(--qs-text,#e6e8eb);
                background: var(--qs-panel,#1a1d22);
                font-family: ui-monospace, Menlo, Consolas, monospace;
                font-size: 11px;
                line-height: 1.45;
                white-space: pre;
                overflow: auto;
                height: 100%;
                tab-size: 2;
            }
            .qs-graphviz-panel.qs-pre-wrap .qs-graphviz-dot-pre {
                white-space: pre-wrap;
                word-break: break-word;
            }
            .qs-dot-comment { color: #6b7c93; font-style: italic; }
            .qs-dot-str     { color: #fb923c; }
            .qs-dot-kw      { color: #c084fc; }
            .qs-dot-attr    { color: #34d399; }
            .qs-dot-op      { color: #fbbf24; }
            /* Bidirektionale Selection-Hervorhebung (BPMN ↔ Graph):
               wenn im bpmn-js ein Element selektiert wird, bekommt der
               entsprechende SVG-Node hier den blauen Akzent — analog zu den
               anderen Panels (XML-Vollansicht, Notation). */
            g.node.qs-graphviz-selected polygon,
            g.node.qs-graphviz-selected ellipse,
            g.node.qs-graphviz-selected rect,
            g.node.qs-graphviz-selected path {
                stroke: #3b82f6 !important;
                stroke-width: 2.5 !important;
                filter: drop-shadow(0 0 4px rgba(59,130,246,0.55));
            }
        `;
        document.head.appendChild(s);
    }

    // ---- Bundle-Lazy-Loader ----
    let _bundleLoading = null;
    function ensureBundle() {
        if (window.qsGraphviz) return Promise.resolve();
        if (_bundleLoading) return _bundleLoading;
        _bundleLoading = new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = BUNDLE_URL;
            s.onload  = () => resolve();
            s.onerror = () => reject(new Error('graphviz.bundle.js konnte nicht geladen werden'));
            document.head.appendChild(s);
        });
        return _bundleLoading;
    }

    // ---- Esc-Util ----
    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }
    // DOT-String-Quote: escape backslash + double-quote
    function dotQ(s) {
        return '"' + String(s == null ? '' : s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n') + '"';
    }

    // ---- BPMN-Element-Klassifikation: nur Fillcolor (Shape = record fuer alle) ----
    // Record-Shape "{ name | type | id }" wird global gesetzt; pro Element-Typ
    // variieren wir nur die Fuellfarbe als visuelles Cue.
    function nodeFill(localName) {
        const t = (localName || '').toLowerCase();
        if (t === 'startevent')               return '#dcfce7';   // gruen
        if (t === 'endevent')                 return '#fecaca';   // rot
        if (t.indexOf('intermediate') !== -1) return '#fef3c7';   // gelb
        if (t.indexOf('boundaryevent') !== -1) return '#fef3c7';
        if (t.indexOf('gateway') !== -1)      return '#fed7aa';   // orange
        if (t === 'subprocess' || t === 'transaction' || t === 'adhocsubprocess') return '#dbeafe';
        if (t === 'callactivity')             return '#dbeafe';
        if (t.indexOf('task') !== -1)         return '#bfdbfe';   // blau
        if (t === 'sequenceflow')             return '#fde68a';   // amber (Connection-Knoten)
        if (t === 'messageflow')              return '#bae6fd';
        if (t === 'association' || t === 'datainputassociation' || t === 'dataoutputassociation') return '#e5e7eb';
        if (t === 'dataobjectreference' || t === 'dataobject' || t === 'datastorereference') return '#e5e7eb';
        if (t === 'participant') return '#fbcfe8';     // pink — Pool
        if (t === 'lane')        return '#f3f4f6';     // grau — Schwimmbahn
        if (t === 'laneset')     return '#e9d5ff';     // helles violett — Container fuer Lanes
        if (t === 'process')     return '#ddd6fe';     // violett — Process-Container
        if (t === 'collaboration') return '#fce7f3';   // sehr helles pink — Top-Container
        return '#f9fafb';
    }

    // Namespace-Prefix entfernen (bpmn:task → task)
    function stripNs(tag) {
        return tag.indexOf(':') !== -1 ? tag.split(':').pop() : tag;
    }
    // Record-Shape-Text-Escape: |, {, }, <, > muessen escapt werden
    function escRec(text) {
        if (text == null || text === '') return '—'; // em-dash statt leer
        return String(text)
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')
            .replace(/\|/g, '\\|')
            .replace(/\{/g, '\\{')
            .replace(/\}/g, '\\}')
            .replace(/</g, '\\<')
            .replace(/>/g, '\\>');
    }

    // ---- DOT-Generator ----
    // Inspiriert von docs/BPMN-zu-Graphviz.pdf: Record-Shapes "{ name | type | id }"
    // + zwei Farbschemata fuer die Verweis-Klassen.
    //   - BLAU SOLID  fuer Attribute mit "Ref" im Namen (sourceRef, targetRef, …)
    //   - ORANGE DASHED fuer Kind-Elemente <incoming>/<outgoing>/<…Ref>
    // Connections (SequenceFlow, MessageFlow, …) sind eigene Knoten — jeder
    // Verweis ist eine eigene Kante. So entsteht zwischen einem Task und einer
    // Sequenz die Vier-Pfeil-Konstellation (Task→Flow, Flow→Task, Task→Flow, Flow→Task
    // mit unterschiedlichen Bedeutungen), die Graphviz automatisch als gebogene
    // Parallel-Edges layoutet — KEINE Spline-Tricks noetig.

    // Liefert die Container-Hierarchie für Cluster-Modus.
    // Result: Map<containerId, Set<childId>> für Container, die als Cluster gerendert
    // werden sollen. Plus rev-Map childId → containerId (jedes Kind in genau einem
    // Cluster — bei Mehrfachzuordnung gewinnt der innerste).
    function buildClusterHierarchy(doc, nodes) {
        const CLUSTER_TYPES_RX = /^(collaboration|process|laneSet|lane|subProcess|transaction|adHocSubProcess|participant)$/i;
        const childrenOf = {};   // containerId → [childId, ...]
        const parentOf = {};     // childId → containerId
        // Pass A: für jeden Container im XML, walke DIREKTE Kinder mit IDs.
        const all = doc.getElementsByTagName('*');
        for (const el of all) {
            const local = stripNs(el.nodeName);
            if (!CLUSTER_TYPES_RX.test(local)) continue;
            const cid = el.getAttribute('id');
            if (!cid || !nodes[cid]) continue;
            for (const child of el.children) {
                const ccid = child.getAttribute && child.getAttribute('id');
                if (!ccid || !nodes[ccid]) continue;
                // Innerster Container gewinnt — wenn schon zugewiesen, nicht overrulen
                if (parentOf[ccid]) continue;
                (childrenOf[cid] = childrenOf[cid] || []).push(ccid);
                parentOf[ccid] = cid;
            }
            // Lane: zusätzlich <flowNodeRef>-Children einnehmen
            if (local === 'lane') {
                for (const ref of el.children) {
                    if (stripNs(ref.nodeName) !== 'flowNodeRef') continue;
                    const tid = (ref.textContent || '').trim();
                    if (!tid || !nodes[tid]) continue;
                    if (parentOf[tid]) continue;
                    (childrenOf[cid] = childrenOf[cid] || []).push(tid);
                    parentOf[tid] = cid;
                }
            }
            // Participant: nimmt den über processRef referenzierten Prozess als child
            if (local === 'participant') {
                const procRef = el.getAttribute('processRef');
                if (procRef && nodes[procRef] && !parentOf[procRef]) {
                    (childrenOf[cid] = childrenOf[cid] || []).push(procRef);
                    parentOf[procRef] = cid;
                }
            }
        }
        return { childrenOf, parentOf };
    }

    function generateDot(xml, opts) {
        const o = Object.assign({
            rankdir: 'LR',
            showDataObjects: true,
            showContainment: true,
            useClusters: false,
        }, opts || {});
        const doc = new DOMParser().parseFromString(xml || '', 'application/xml');
        if (doc.getElementsByTagName('parsererror').length > 0) {
            return 'digraph G { error [label="XML-Parse-Fehler", color=red, fontcolor=red]; }';
        }

        const all = doc.getElementsByTagName('*');
        const nodes = {};      // id → { type, name, fill }
        const edges = [];      // { from, to, label, color, style }

        // --- Pass 1: Knoten ---
        for (const el of all) {
            const ns = el.namespaceURI || '';
            if (ns.indexOf('DI') !== -1 || ns.indexOf('DC') !== -1) continue;
            const local = stripNs(el.nodeName);
            if (/^(BPMNShape|BPMNEdge|BPMNDiagram|BPMNPlane|BPMNLabel|Bounds|waypoint)$/i.test(local)) continue;
            // Container, die keine eigene Identitaet im Verweisgraph haben:
            // definitions (Root-Wrapper) und reine Container/Ref-Helfer ausblenden.
            // process/collaboration BLEIBEN als Knoten — sie tragen die Verbindung
            // Pool ↔ Process ↔ Lanes ↔ Tasks im XML-Strukturgraph.
            if (/^(definitions|extensionElements|documentation|incoming|outgoing|conditionExpression|loopCharacteristics|multiInstanceLoopCharacteristics|sourceRef|targetRef)$/i.test(local)) continue;
            if (!o.showDataObjects && /^(dataObject|dataObjectReference|dataStoreReference|dataInput|dataOutput)$/i.test(local)) continue;
            const id = el.getAttribute('id');
            if (!id) continue;
            if (nodes[id]) continue;
            nodes[id] = {
                type: local,
                name: el.getAttribute('name') || '',
                fill: nodeFill(local),
            };
        }

        // --- Pass 2: Verweise (Edges) ---
        for (const el of all) {
            const ns = el.namespaceURI || '';
            if (ns.indexOf('DI') !== -1 || ns.indexOf('DC') !== -1) continue;
            const sourceId = el.getAttribute('id');
            if (!sourceId || !nodes[sourceId]) continue;

            // A. Attribute mit "Ref" im Namen → BLAU SOLID
            for (let j = 0; j < el.attributes.length; j++) {
                const attr = el.attributes[j];
                if (attr.name.indexOf('Ref') === -1) continue;
                const v = attr.value;
                if (!v) continue;
                // attribute kann Mehrfach-IDs enthalten (z.B. categoryValueRef)
                for (const tgt of v.split(/\s+/)) {
                    if (!tgt || !nodes[tgt]) continue;
                    edges.push({
                        from: sourceId,
                        to: tgt,
                        label: attr.name,
                        color: '#2980b9',
                        style: 'solid',
                    });
                }
            }

            // B. Kind-Elemente: <incoming>, <outgoing> oder Tag enthaelt 'Ref'
            //    → ORANGE DASHED
            for (const child of el.children) {
                const cLocal = stripNs(child.nodeName);
                const isRefChild = (cLocal === 'incoming' || cLocal === 'outgoing' || cLocal.indexOf('Ref') !== -1);
                if (!isRefChild) continue;
                const txt = (child.textContent || '').trim();
                if (!txt) continue;
                for (const tgt of txt.split(/\s+/)) {
                    if (!tgt || !nodes[tgt]) continue;
                    edges.push({
                        from: sourceId,
                        to: tgt,
                        label: '<' + cLocal + '>',
                        color: '#e67e22',
                        style: 'dashed',
                    });
                }
            }
        }

        // --- Pass 3: Containment fuer Container-Typen (optional) ---
        // BPMN-XML drueckt Containment durch reines Verschachteln aus (keine
        // Ref-Attribute). Damit das in der Analyse sichtbar wird, emittieren
        // wir GRUEN GEPUNKTETE Kanten Container → direkter Child-Knoten — aber
        // NUR fuer die echten Strukturcontainer (collaboration, process, laneSet,
        // subProcess, transaction, adHocSubProcess).
        const CONTAINER_RX = /^(collaboration|process|laneSet|subProcess|transaction|adHocSubProcess)$/i;
        if (o.showContainment) {
            for (const el of all) {
                const ns = el.namespaceURI || '';
                if (ns.indexOf('DI') !== -1 || ns.indexOf('DC') !== -1) continue;
                const local = stripNs(el.nodeName);
                if (!CONTAINER_RX.test(local)) continue;
                const parentId = el.getAttribute('id');
                if (!parentId || !nodes[parentId]) continue;
                for (const child of el.children) {
                    const cid = child.getAttribute && child.getAttribute('id');
                    if (!cid || !nodes[cid]) continue;
                    edges.push({
                        from: parentId,
                        to: cid,
                        label: 'contains',
                        color: '#16a34a',
                        style: 'dotted',
                    });
                }
            }
        }

        // --- DOT-Output: Record-Shape, einheitliches Layout ---
        const out = [];
        out.push('digraph BPMN {');
        out.push(`  rankdir=${o.rankdir};`);
        out.push('  bgcolor="#ffffff";');
        out.push('  splines=true;');
        out.push('  concentrate=false;');
        out.push('  overlap=false;');
        out.push('  nodesep=0.4;');
        out.push('  ranksep=0.7;');
        out.push('  node [fontname="Arial", fontsize=10, shape=record, style=filled];');
        out.push('  edge [fontname="Arial", fontsize=9];');

        function nodeLine(id, info, indent) {
            const safeName = escRec(info.name);
            const safeType = escRec(info.type);
            const safeId   = escRec(id);
            return `${indent || '  '}"${id.replace(/"/g, '\\"')}" [label="${safeName} | ${safeType} | ${safeId}", fillcolor="${info.fill}"];`;
        }

        let clusterContainers = null;   // Set of IDs, die als Cluster gerendert werden
        if (o.useClusters) {
            // Cluster-Mode: Container werden zu subgraph cluster_<id>, ihre Children
            // dort hinein. Container selbst wird NICHT als eigener Record-Knoten
            // gerendert (Cluster-Label uebernimmt die Info). Restknoten (ohne Cluster-
            // Eltern) wandern auf Top-Level.
            const { childrenOf, parentOf } = buildClusterHierarchy(doc, nodes);
            const isContainer = (id) => Array.isArray(childrenOf[id]) && childrenOf[id].length > 0;
            clusterContainers = new Set(Object.keys(childrenOf).filter(isContainer));
            // Wurzel-Container = Container die selbst kein Cluster-Parent haben
            const roots = Object.keys(childrenOf).filter((id) => !parentOf[id]);
            const emitCluster = (cid, depth) => {
                const info = nodes[cid];
                if (!info) return;
                const pad = '  '.repeat(depth + 1);
                const lbl = `${info.type}: ${info.name || info.id || cid}`.replace(/"/g, '\\"');
                out.push(`${pad}subgraph "cluster_${cid.replace(/"/g, '\\"')}" {`);
                out.push(`${pad}  label="${lbl}"; style=filled; fillcolor="${info.fill}"; color="var(--qs-text-mute,#94a3b8)"; labeljust=l; fontsize=11; margin=12;`);
                for (const childId of childrenOf[cid]) {
                    if (isContainer(childId)) {
                        emitCluster(childId, depth + 1);
                    } else if (nodes[childId]) {
                        out.push(nodeLine(childId, nodes[childId], pad + '  '));
                    }
                }
                out.push(`${pad}}`);
            };
            for (const rid of roots) emitCluster(rid, 0);
            // Knoten ohne Cluster-Eltern und nicht selbst Cluster-Container → Top-Level
            for (const [id, info] of Object.entries(nodes)) {
                if (parentOf[id]) continue;
                if (isContainer(id)) continue;   // schon als Cluster emittiert
                out.push(nodeLine(id, info));
            }
        } else {
            for (const [id, info] of Object.entries(nodes)) {
                out.push(nodeLine(id, info));
            }
        }

        for (const e of edges) {
            // Cluster-Mode: Container haben keinen eigenen Knoten. Kanten zu/von
            // ihnen wuerden ins Leere laufen → ueberspringen (Cluster-Verschachtelung
            // drueckt die Beziehung implizit aus).
            if (clusterContainers && (clusterContainers.has(e.from) || clusterContainers.has(e.to))) continue;
            const safeLabel = e.label.replace(/"/g, '\\"');
            const fromQ = e.from.replace(/"/g, '\\"');
            const toQ   = e.to.replace(/"/g, '\\"');
            out.push(`  "${fromQ}" -> "${toQ}" [label=" ${safeLabel} ", color="${e.color}", style="${e.style}", fontcolor="${e.color}"];`);
        }
        out.push('}');
        return out.join('\n');
    }

    // ---- Panel ----
    function attachBpmnGraphviz(viewer) {
        if (!viewer) return null;
        if (viewer.__qsGraphviz) return viewer.__qsGraphviz;
        ensureStyle();
        // qsCommentMedia liefert .qs-cm-popup-pinned-Layout, Buttons, z-index-Stack.
        try { if (window.qsCommentMedia && typeof window.qsCommentMedia.ensureStyles === 'function') window.qsCommentMedia.ensureStyles(); } catch (e) { /* ignore */ }

        let panel = null;
        let showingDotSource = false;
        let lastDot = '';
        let lastSvg = '';
        let zoom = 1;
        let originalRect = null;
        let onCloseCb = null;
        let showContainment = true;
        let autoRefresh = false;
        let useClusters = false;
        let rankdir = 'LR';
        let autoRefreshTimer = null;
        // Beim ERSTEN Aufbau (Panel-Oeffnen) eine schon bestehende Selektion nicht nur
        // markieren, sondern auch in den View zentrieren — sonst ist sie u.U. ausserhalb
        // des sichtbaren Graph-Ausschnitts und wirkt „nicht markiert". Wird von renderSvg
        // einmalig konsumiert. Bei Auto-Refresh/Toggle bleibt es false (kein Springen).
        let scrollSelOnNextRender = false;
        let cmdListenerInstalled = false;
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
            return {
                showContainment, useClusters, rankdir, autoRefresh,
                showingDotSource,
                zoom: getZoom(),
                wrap: panel.classList.contains('qs-pre-wrap'),
                fullscreen: panel.classList.contains('qs-fullscreen'),
            };
        }
        function getZoom() {
            const body = panel && panel.querySelector('.qs-cm-popup-body');
            const z = body && body.style.zoom;
            const n = z ? parseFloat(z) : 1;
            return isFinite(n) && n > 0 ? n : 1;
        }
        function setState(s, opts) {
            if (!s || !panel) return;
            const silent = opts && opts.silent;
            if (silent) suppressStateEcho = true;
            try {
                let needsReRender = false;
                if (typeof s.showContainment === 'boolean' && s.showContainment !== showContainment) {
                    showContainment = s.showContainment;
                    const btn = panel.querySelector('[data-act="toggle-contains"]');
                    if (btn) { btn.classList.toggle('is-active', showContainment); btn.style.color = showContainment ? '#16a34a' : 'var(--qs-text-mute,#94a3b8)'; }
                    needsReRender = true;
                }
                if (typeof s.useClusters === 'boolean' && s.useClusters !== useClusters) {
                    useClusters = s.useClusters;
                    const btn = panel.querySelector('[data-act="toggle-clusters"]');
                    if (btn) btn.classList.toggle('is-active', useClusters);
                    needsReRender = true;
                }
                if (typeof s.rankdir === 'string' && (s.rankdir === 'LR' || s.rankdir === 'TB') && s.rankdir !== rankdir) {
                    rankdir = s.rankdir;
                    const btn = panel.querySelector('[data-act="toggle-layout"]');
                    if (btn) { btn.textContent = rankdir === 'LR' ? '⇄' : '⇅'; }
                    needsReRender = true;
                }
                if (typeof s.autoRefresh === 'boolean') {
                    autoRefresh = s.autoRefresh;
                    const btn = panel.querySelector('[data-act="toggle-auto"]');
                    if (btn) btn.classList.toggle('is-active', autoRefresh);
                }
                if (typeof s.showingDotSource === 'boolean' && s.showingDotSource !== showingDotSource) {
                    showingDotSource = s.showingDotSource;
                    if (showingDotSource) renderDotSource(); else renderSvg();
                }
                if (typeof s.zoom === 'number' && isFinite(s.zoom)) {
                    const body = panel.querySelector('.qs-cm-popup-body');
                    if (body) body.style.zoom = String(Math.max(0.25, Math.min(4, s.zoom)));
                    const display = panel.querySelector('[data-zoom-display]');
                    if (display) display.textContent = Math.round((s.zoom || 1) * 100) + '%';
                }
                if (typeof s.wrap === 'boolean') panel.classList.toggle('qs-pre-wrap', s.wrap);
                if (typeof s.fullscreen === 'boolean') panel.classList.toggle('qs-fullscreen', s.fullscreen);
                if (needsReRender) render();
            } finally {
                if (silent) suppressStateEcho = false;
            }
        }
        function setOnStateChange(cb) { onStateChangeCb = (typeof cb === 'function') ? cb : null; }

        function setBody(html) {
            if (!panel) return;
            const body = panel.querySelector('.qs-cm-popup-body');
            body.innerHTML = html;
        }

        // Wenn die WASM-Engine in einer CSP-eingeschraenkten Umgebung (z. B.
        // Camunda Modeler mit `script-src 'self'`) nicht laden konnte, merken wir
        // uns das und gehen permanent in den DOT-Source-Modus. So spart der
        // Anwender den Reload-Zyklus und versteht sofort, was los ist.
        let wasmBlocked = false;
        function isWasmCspError(err) {
            const msg = (err && (err.message || String(err))) || '';
            return /WebAssembly|wasm|CompileError|CSP|unsafe-eval|script-src/i.test(msg);
        }

        async function render() {
            if (!panel) return;
            const wrap = panel.querySelector('.qs-cm-popup-body-wrap');
            wrap.innerHTML = `<div class="qs-graphviz-status">⏳ Graph wird generiert…</div>`;
            try {
                const { xml } = await viewer.saveXML({ format: false });
                lastDot = generateDot(xml || '', { showContainment, useClusters, rankdir });
                if (showingDotSource || wasmBlocked) {
                    renderDotSource();
                    return;
                }
                try {
                    await ensureBundle();
                    lastSvg = await window.qsGraphviz.toSvg(lastDot);
                } catch (engineErr) {
                    if (isWasmCspError(engineErr)) {
                        // Permanent in DOT-Source umschalten. Die Pille bleibt
                        // funktional (DOT-Anzeige + Export + Copy), der Anwender
                        // sieht eine klare Erklaerung.
                        wasmBlocked = true;
                        showingDotSource = true;
                        try { notifyStateChange(); } catch (e) { /* ignore */ }
                        renderDotSource();
                        return;
                    }
                    throw engineErr;
                }
                renderSvg();
            } catch (err) {
                wrap.innerHTML = `<div class="qs-graphviz-error">Fehler: ${esc(err && err.message)}</div>`;
            }
        }

        function renderSvg() {
            const wrap = panel.querySelector('.qs-cm-popup-body-wrap');
            wrap.innerHTML = `<div class="qs-graphviz-svg-wrap">${lastSvg}</div>`;
            applyZoom();
            wireSvgClickToSelect(wrap);
            // Aktuell selektiertes Element im neuen SVG wieder hervorheben. Beim ersten
            // Aufbau (scrollSelOnNextRender) zusaetzlich zentrieren, damit eine vor dem
            // Oeffnen bestehende Selektion sofort sichtbar markiert ist.
            try {
                const sel = viewer.get('selection', false);
                if (sel) {
                    const cur = sel.get();
                    if (cur && cur.length) highlightGraphNode(cur[0].id, scrollSelOnNextRender);
                }
            } catch (e) { /* ignore */ }
            scrollSelOnNextRender = false;
        }
        // Klick auf SVG-Knoten → Element im bpmn-js-Modeler selektieren + ins Bild scrollen.
        // Graphviz haengt den DOT-Identifier (= bpmn-js Element-id) in <title>.
        function wireSvgClickToSelect(rootEl) {
            try {
                const elReg = viewer.get('elementRegistry', false);
                const sel   = viewer.get('selection', false);
                const cv    = viewer.get('canvas', false);
                if (!elReg || !sel) return;
                const nodes = rootEl.querySelectorAll('g.node');
                nodes.forEach((g) => {
                    const titleEl = g.querySelector(':scope > title');
                    if (!titleEl) return;
                    const id = (titleEl.textContent || '').trim();
                    if (!id) return;
                    g.style.cursor = 'pointer';
                    g.addEventListener('click', (ev) => {
                        ev.stopPropagation();
                        const el = elReg.get(id);
                        if (!el) return;
                        try { sel.select(el); } catch (e) { /* ignore */ }
                        try { if (cv && typeof cv.scrollToElement === 'function') cv.scrollToElement(el); } catch (e) { /* ignore */ }
                    });
                });
            } catch (e) { /* ignore */ }
        }
        // Mini-DOT-Highlighter: Kommentare, Strings, Keywords, Attribute, Operator.
        // Erst HTML-escape, dann Regex-Spans. Reihenfolge wichtig (Kommentare/Strings
        // zuerst, damit Tokens darin nicht weiter angefasst werden).
        function highlightDot(text) {
            let s = esc(text);
            s = s.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="qs-dot-comment">$1</span>');
            s = s.replace(/(\/\/[^\n]*)/g, '<span class="qs-dot-comment">$1</span>');
            // Strings: "..." (escapt schon zu &quot;)
            s = s.replace(/(&quot;[^&]*?&quot;)/g, '<span class="qs-dot-str">$1</span>');
            // Keywords
            s = s.replace(/\b(digraph|subgraph|graph|node|edge|strict)\b/g, '<span class="qs-dot-kw">$1</span>');
            // Attribute-Name vor "=" (in der Klammer-Section)
            s = s.replace(/(\w+)(\s*=)/g, '<span class="qs-dot-attr">$1</span>$2');
            // Pfeil-Operator
            s = s.replace(/(-&gt;|--)/g, '<span class="qs-dot-op">$1</span>');
            return s;
        }
        function renderDotSource() {
            const wrap = panel.querySelector('.qs-cm-popup-body-wrap');
            // Bei CSP-Block: erklaerendes Banner ueber dem DOT-Source. Anwender
            // sieht sofort, warum kein SVG kommt, und kann den DOT-Text per Copy
            // in einen externen Renderer (z. B. graphviz online) pasten.
            const banner = wasmBlocked
                ? `<div class="qs-graphviz-banner">⚠ <strong>SVG-Render nicht verfügbar:</strong> ` +
                  `Die Graphviz-Engine läuft als WebAssembly und wird vom Camunda Modeler aus ` +
                  `Sicherheitsgründen (CSP) blockiert. Stattdessen wird der DOT-Quelltext ` +
                  `angezeigt — per <kbd>⇩DOT</kbd> exportieren oder kopieren und in einem ` +
                  `Browser/externen Renderer einfügen.</div>`
                : '';
            wrap.innerHTML = banner + `<pre class="qs-graphviz-dot-pre"><code>${highlightDot(lastDot)}</code></pre>`;
            // DOT-Ansicht hat keine Knoten-Markierung → ein evtl. gesetztes
            // First-Render-Scroll-Flag hier verwerfen, damit es nicht in einen
            // spaeteren SVG-Render durchschlaegt.
            scrollSelOnNextRender = false;
        }
        function applyZoom() {
            const wrap = panel && panel.querySelector('.qs-graphviz-svg-wrap');
            if (!wrap) return;
            const svg = wrap.querySelector('svg');
            if (svg) svg.style.zoom = String(zoom);
            const display = panel.querySelector('[data-zoom-display]');
            if (display) display.textContent = Math.round(zoom * 100) + '%';
        }
        function setZoom(z) {
            zoom = Math.max(0.25, Math.min(4, z));
            applyZoom();
        }

        function buildPanel() {
            const div = document.createElement('div');
            div.className = 'qs-cm-popup qs-cm-popup-pinned qs-graphviz-panel';
            div.innerHTML =
                `<div class="qs-cm-popup-header">` +
                  `<span style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:var(--qs-blue-soft,#60a5fa);"><span data-icon="network"></span>BPMN-Struktur</span>` +
                  `<div class="qs-cm-popup-actions">` +
                    `<button class="qs-cm-popup-btn" data-act="refresh" title="Neu generieren">⟳</button>` +
                    `<button class="qs-cm-popup-btn" data-act="toggle-auto" title="Auto-Refresh bei BPMN-Änderung ein/aus">⟲</button>` +
                    `<button class="qs-cm-popup-btn is-active" data-act="toggle-contains" title="Containment-Kanten (grün gepunktet) ein/aus" style="color:#16a34a;">⊏</button>` +
                    `<button class="qs-cm-popup-btn" data-act="toggle-clusters" title="Pool/Lane als Subgraph-Cluster">▦</button>` +
                    `<button class="qs-cm-popup-btn" data-act="toggle-layout" title="Layout LR ↔ TB">⇄</button>` +
                    `<button class="qs-cm-popup-btn" data-act="zoom-out" title="Verkleinern">−</button>` +
                    `<span class="qs-cm-popup-zoom" data-zoom-display>100%</span>` +
                    `<button class="qs-cm-popup-btn" data-act="zoom-in" title="Vergrößern">+</button>` +
                    `<button class="qs-cm-popup-btn" data-act="zoom-reset" title="Zoom zurücksetzen">⤢</button>` +
                    `<button class="qs-cm-popup-btn" data-act="toggle-dot" title="DOT-Source / SVG umschalten">{}</button>` +
                    `<button class="qs-cm-popup-btn" data-act="export-svg" title="SVG herunterladen">⇩SVG</button>` +
                    `<button class="qs-cm-popup-btn" data-act="export-png" title="PNG herunterladen">⇩PNG</button>` +
                    `<button class="qs-cm-popup-btn" data-act="export-dot" title="DOT herunterladen">⇩DOT</button>` +
                    `<button class="qs-cm-popup-btn" data-act="fullscreen" title="Vollbild ein/aus">⛶</button>` +
                    `<button class="qs-cm-popup-btn" data-act="close" title="Schließen">✕</button>` +
                  `</div>` +
                `</div>` +
                `<div class="qs-cm-popup-body-wrap">` +
                  `<div class="qs-graphviz-status">noch nicht generiert</div>` +
                `</div>`;
            document.body.appendChild(div);
            // Standard-Position (Mitte-rechts), respektiert Viewport.
            // Links-unten positionieren, damit das Analyse-Hover-Dropdown im Header
            // (rechts oben) nicht ueberdeckt wird.
            div.style.left = '40px';
            div.style.top  = '320px';
            try { window.qsCommentMedia && window.qsCommentMedia.bringToFront && window.qsCommentMedia.bringToFront(div); } catch (e) { /* ignore */ }
            div.addEventListener('mousedown', () => {
                try { window.qsCommentMedia && window.qsCommentMedia.bringToFront && window.qsCommentMedia.bringToFront(div); } catch (e) { /* ignore */ }
            }, true);

            // Drag via Header
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

            // Button-Aktionen
            div.querySelector('[data-act="refresh"]').addEventListener('click', (e) => { e.stopPropagation(); render(); });
            div.querySelector('[data-act="zoom-in"]').addEventListener('click', (e) => { e.stopPropagation(); setZoom(zoom * 1.25); notifyStateChange(); });
            div.querySelector('[data-act="zoom-out"]').addEventListener('click', (e) => { e.stopPropagation(); setZoom(zoom / 1.25); notifyStateChange(); });
            div.querySelector('[data-act="zoom-reset"]').addEventListener('click', (e) => { e.stopPropagation(); setZoom(1); notifyStateChange(); });
            div.querySelector('.qs-cm-popup-body-wrap').addEventListener('wheel', (e) => {
                if (!e.ctrlKey && !e.metaKey) return;
                e.preventDefault();
                setZoom(zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1));
                notifyStateChange();
            }, { passive: false });
            div.querySelector('[data-act="toggle-dot"]').addEventListener('click', (e) => {
                e.stopPropagation();
                // Bei WASM-CSP-Block kann kein SVG erzeugt werden — wir bleiben
                // in DOT-Source und zeigen das Banner weiterhin.
                if (wasmBlocked) { renderDotSource(); return; }
                showingDotSource = !showingDotSource;
                if (showingDotSource) renderDotSource(); else renderSvg();
                notifyStateChange();
            });
            div.querySelector('[data-act="toggle-contains"]').addEventListener('click', (e) => {
                e.stopPropagation();
                showContainment = !showContainment;
                const btn = e.currentTarget;
                btn.classList.toggle('is-active', showContainment);
                btn.style.color = showContainment ? '#16a34a' : 'var(--qs-text-mute,#94a3b8)';
                render();
                notifyStateChange();
            });
            div.querySelector('[data-act="toggle-auto"]').addEventListener('click', (e) => {
                e.stopPropagation();
                autoRefresh = !autoRefresh;
                const btn = e.currentTarget;
                btn.classList.toggle('is-active', autoRefresh);
                btn.title = autoRefresh ? 'Auto-Refresh ein (lauscht auf BPMN-Änderungen)' : 'Auto-Refresh aus';
                notifyStateChange();
            });
            div.querySelector('[data-act="toggle-clusters"]').addEventListener('click', (e) => {
                e.stopPropagation();
                useClusters = !useClusters;
                const btn = e.currentTarget;
                btn.classList.toggle('is-active', useClusters);
                render();
                notifyStateChange();
            });
            div.querySelector('[data-act="toggle-layout"]').addEventListener('click', (e) => {
                e.stopPropagation();
                rankdir = (rankdir === 'LR') ? 'TB' : 'LR';
                e.currentTarget.textContent = rankdir === 'LR' ? '⇄' : '⇅';
                e.currentTarget.title = `Layout-Richtung: ${rankdir} — Klick wechselt zu ${rankdir === 'LR' ? 'TB' : 'LR'}`;
                render();
                notifyStateChange();
            });
            // Export-Buttons (DOT / SVG / PNG)
            function downloadBlob(blob, filename) {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = filename;
                document.body.appendChild(a); a.click();
                a.remove();
                setTimeout(() => URL.revokeObjectURL(url), 0);
            }
            div.querySelector('[data-act="export-dot"]').addEventListener('click', (e) => {
                e.stopPropagation();
                if (!lastDot) return;
                downloadBlob(new Blob([lastDot], { type: 'text/vnd.graphviz' }), 'bpmn-structure.dot');
            });
            div.querySelector('[data-act="export-svg"]').addEventListener('click', (e) => {
                e.stopPropagation();
                if (!lastSvg) return;
                downloadBlob(new Blob([lastSvg], { type: 'image/svg+xml' }), 'bpmn-structure.svg');
            });
            div.querySelector('[data-act="export-png"]').addEventListener('click', (e) => {
                e.stopPropagation();
                if (!lastSvg) return;
                // SVG → Image → Canvas → PNG-Blob
                const blob = new Blob([lastSvg], { type: 'image/svg+xml' });
                const url = URL.createObjectURL(blob);
                const img = new Image();
                img.onload = () => {
                    const c = document.createElement('canvas');
                    c.width = img.naturalWidth * 2;   // 2x DPI für bessere Lesbarkeit
                    c.height = img.naturalHeight * 2;
                    const ctx = c.getContext('2d');
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, c.width, c.height);
                    ctx.scale(2, 2);
                    ctx.drawImage(img, 0, 0);
                    c.toBlob((b) => { if (b) downloadBlob(b, 'bpmn-structure.png'); URL.revokeObjectURL(url); }, 'image/png');
                };
                img.onerror = () => URL.revokeObjectURL(url);
                img.src = url;
            });
            div.querySelector('[data-act="fullscreen"]').addEventListener('click', (e) => {
                e.stopPropagation();
                div.classList.toggle('qs-fullscreen');
                notifyStateChange();
            });
            div.querySelector('[data-act="close"]').addEventListener('click', closePanel);

            function destroy() {
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
                div.remove();
                panel = null;
            }
            div.__qsDestroy = destroy;
            return div;
        }

        // commandStack.executed-Listener nur EINMAL anbringen, dann ueber
        // autoRefresh-Flag gateen — bpmn-js' EventBus.off ist nicht zuverlaessig.
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
            } catch (e) { /* ignore */ }
        }

        // ---- Bidirektionaler Selection-Sync (BPMN → Graph) ----
        // Listener nur einmal pro Viewer installieren. Bei jeder Selection: das
        // SVG-Node mit passender <title>-id finden, blau hervorheben + im
        // Scroll-Wrapper zentrieren.
        let selectionListenerInstalled = false;
        let lastHighlightedNode = null;
        function installSelectionListener() {
            if (selectionListenerInstalled) return;
            try {
                const eb = viewer.get('eventBus', false);
                if (!eb) return;
                eb.on('selection.changed', (event) => {
                    if (!panel || showingDotSource) return;
                    const sel = (event && event.newSelection) || [];
                    if (sel.length === 0) { clearGraphHighlight(); return; }
                    highlightGraphNode(sel[0].id, true);
                });
                selectionListenerInstalled = true;
            } catch (e) { /* ignore */ }
        }
        function clearGraphHighlight() {
            if (lastHighlightedNode) {
                lastHighlightedNode.classList.remove('qs-graphviz-selected');
                lastHighlightedNode = null;
            }
        }
        function findGraphNodeForId(id) {
            if (!panel || !id) return null;
            const svg = panel.querySelector('.qs-graphviz-svg-wrap svg');
            if (!svg) return null;
            // Graphviz haengt den DOT-Identifier in <title>. Wir suchen exakte
            // Uebereinstimmung — keine partielle, weil ids unique sind.
            const titles = svg.querySelectorAll('g.node > title');
            for (const t of titles) {
                if ((t.textContent || '').trim() === id) return t.parentElement;
            }
            return null;
        }
        function highlightGraphNode(id, center) {
            if (!panel) return;
            clearGraphHighlight();
            const g = findGraphNodeForId(id);
            if (!g) return;  // z.B. Container-Knoten im Cluster-Mode — kein SVG-Node
            g.classList.add('qs-graphviz-selected');
            lastHighlightedNode = g;
            if (!center) return;
            // Zentrieren: Wrapper-Scroll so setzen, dass die Node-Mitte im
            // Wrapper-Viewport-Center liegt. Zoom (CSS zoom-Property) wird
            // automatisch ueber getBoundingClientRect beruecksichtigt.
            try {
                const wrap = panel.querySelector('.qs-graphviz-svg-wrap');
                if (!wrap) return;
                const wRect = wrap.getBoundingClientRect();
                const nRect = g.getBoundingClientRect();
                // Node-Center relativ zum Wrapper-Viewport (visuell)
                const offsetX = (nRect.left + nRect.width / 2) - wRect.left;
                const offsetY = (nRect.top + nRect.height / 2) - wRect.top;
                // Soll-Position = Wrapper-Mitte
                const dx = offsetX - wRect.width / 2;
                const dy = offsetY - wRect.height / 2;
                wrap.scrollBy({ left: dx, top: dy, behavior: 'smooth' });
            } catch (e) { /* ignore */ }
        }

        function openPanel() {
            if (panel) {
                try { window.qsCommentMedia && window.qsCommentMedia.bringToFront && window.qsCommentMedia.bringToFront(panel); } catch (e) {}
                return;
            }
            panel = buildPanel();
            installCmdListener();
            installSelectionListener();
            scrollSelOnNextRender = true;
            render();
        }
        function closePanel() {
            if (panel && panel.__qsDestroy) panel.__qsDestroy();
            panel = null;
            try { if (typeof onCloseCb === 'function') onCloseCb(); } catch (e) { /* ignore */ }
        }
        function refresh() { if (panel) render(); }
        function isPanelOpen() { return !!panel; }
        function setOnClose(fn) { onCloseCb = (typeof fn === 'function') ? fn : null; }

        const api = { openPanel, closePanel, refresh, isPanelOpen, setOnClose, getState, setState, setOnStateChange };
        viewer.__qsGraphviz = api;
        return api;
    }

    window.attachBpmnGraphviz = attachBpmnGraphviz;
})();
