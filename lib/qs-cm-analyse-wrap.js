// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 SmartBPM, Michael Ricken — Synixx-Werkzeugfamilie.
// Dieses Modul ist Teil der MIT-veröffentlichten Camunda-Modeler-Plugins
// (Repo synixx-camunda-plugins); die MIT-Lizenz gilt für DIESE Datei auch
// innerhalb des Synixx-Gesamtprojekts.
// Auto-Arrange-Coordinator fuer die qs-cm-pills-Toolbar.
// Verschiebt Plugin-Pillen mit definierten Klassen in einen einzelnen
// "🔍 Werkzeuge"-Dropdown-Wrap. Wird von jedem CM-Plugin via require eingezogen;
// idempotent (Style-Tag/Observer einmal pro Document, Wrap einmal pro Toolbar).
//
// Konfiguration:
//   SECTIONS — Liste der Sektionen im Menue. Jede Sektion hat id, label und
//   eine Liste von Pill-CSS-Klassen, die in genau dieser Sektion landen.
//   Reihenfolge im Array = Reihenfolge im Menue.
// Pillen die in KEINER Sektion gelistet sind (z.B. Tools/Export) bleiben
// als selbstaendige Pillen direkt in der qs-cm-pills-Toolbar.

(function () {
    'use strict';

    const STYLE_ID = 'qs-cm-analyse-style';
    // Drei Klassen von Bedienelementen in der Toolbar:
    //   Klasse 1 — Tool-Fenster (Variablen, Watch): bleiben Top-Level-Pills.
    //              Klick toggelt sticky Window mit Drag+Resize.
    //   Klasse 2 — Schnell-Toggles (Trail, FEEL): bleiben Top-Level-Pills.
    //              Klick flippt aria-pressed-State.
    //   Klasse 3 — Werkzeuge-Dropdown (alle in SECTIONS unten): einheitliche
    //              Click-Open-Mechanik, click-outside/ESC schliessen.
    // Gliederung „am Arbeitsprozess" — spiegelt die Werkzeuge-Sektionen des
    // BPMN-Studio (v2): Inspektoren → Simulation → Simulation-Analyse →
    // BPMN-Struktur → Prozessanalyse → Referenzen → Annotieren → Datei.
    // SIM-Def/SIM-Watch/DMN-Viewer sind jetzt HIER (nicht mehr Top-Level).
    // Umrandete Zonen-Boxen, direkt untereinander (wie v2-Studio) — je Sektion
    // eine farbige Überschrift (grp = Farb-Gruppe, gemappt auf --qs2-grp-*).
    // Zwei Spalten NUR als grobe Balance (col:2 = rechte Spalte), damit das Menü
    // bei 7 Zonen nicht extrem hoch wird; innerhalb einer Spalte gestapelt.
    const SECTIONS = [
        {
            id: 'inspect',
            label: 'Inspektoren',
            grp: 'inspect',
            col: 1,
            pills: [
                'qs-cm-pill-trail',         // Pfadspur an/aus (Nutzer-Wunsch 2026-08-18: ins Menü wie team-modeling)
                'qs-cm-pill-watch',         // FEEL-Viewer (ehem. SIM-Watch)
                'qs-cm-pill-dmn-viewer',    // DMN-Viewer
            ],
        },
        {
            id: 'sim',
            label: 'Simulation',
            grp: 'inspect',
            col: 1,
            pills: [
                'qs-cm-pill-variables',     // FEEL-Editor (ehem. SIM-Def)
                'qs-cm-pill-feel',          // FEEL-Script (Auto-Eval-Toggle)
                'qs-cm-pill-ask-inputs',    // UserTask-Formular
                'qs-cm-pill-msg-inputs',    // Nachrichten-Formular
                'qs-cm-pill-dmn-pause',     // DMN auswerten
            ],
        },
        {
            id: 'sim-analyse',
            label: 'Simulation-Analyse',
            grp: 'analysis',
            col: 1,
            pills: [
                'qs-cm-pill-simdef-trace',  // 🔎 Definitionen im Verlauf
                'qs-cm-pill-sim-runs',      // 🎬 Simulationsläufe
            ],
        },
        {
            id: 'prozess-analyse',
            label: 'Prozessanalyse',
            grp: 'process',
            col: 2,
            pills: [
                'qs-cm-pill-tags',          // Themen-Tags (Nutzer-Wunsch 2026-08-18: ins Menü)
                'qs-cm-pill-layers',        // 🗂 Ebenen festlegen
                'qs-cm-pill-sim-follow',    // 🎯 Simulation folgt Ebenen
                'qs-cm-pill-color',         // Farb-Override
                'qs-cm-pill-kpi',           // 📊 KPI-Analyse
                'qs-cm-pill-comments',      // Dokumentation
            ],
        },
        {
            id: 'struktur',
            label: 'BPMN-Struktur',
            grp: 'structure',
            col: 2,
            pills: [
                'qs-cm-pill-graphviz',      // XML (Graph)
                'qs-cm-pill-xmli',          // XML (Element)
                'qs-cm-pill-xmlfull',       // XML (Gesamt)
            ],
        },
        {
            id: 'ref',
            label: 'Referenzen',
            grp: 'neutral',
            col: 2,
            pills: [
                'qs-cm-pill-notation',      // BPMN-Notation
                'qs-cm-pill-feel-ref',      // FEEL
                'qs-cm-pill-dmn-ref',       // DMN
            ],
        },
        {
            id: 'file',
            label: 'Datei',
            grp: 'export',
            col: 1,
            pills: ['qs-cm-pill-tools'],
        },
    ];

    // Gruppen-Farben (v2-Studio-Mapping). Fallbacks für CM-Dark ohne --qs2-*.
    const GRP_COLORS = {
        inspect:   'var(--qs-accent,#7dd3fc)',
        analysis:  'var(--qs-amber,#fbbf24)',
        structure: 'var(--qs-purple,#c084fc)',
        process:   'var(--qs-orange,#fb923c)',
        export:    'var(--qs-purple,#c084fc)',
        neutral:   'var(--qs-text-mute,#8a909a)',
    };

    // Echte An/Aus-SCHALTER (aria-pressed = Zustand AN/AUS). Diese bekommen im
    // Menü das ✓-Häkchen (.qs-cm-chk). Alle anderen mit aria-pressed sind
    // Fenster-Panels (FEEL-Viewer/-Editor, DMN-Viewer, Kommentare) → dezenter
    // ●-Punkt. Reine Aktionen (KPI, XML, Refs, Sim-Läufe …) tragen kein
    // aria-pressed → keine Markierung. So ist die blaue Markierung eindeutig.
    const CHK_PILLS = new Set([
        'qs-cm-pill-trail',       // Pfadspur an/aus
        'qs-cm-pill-feel',        // FEEL-Auto-Eval an/aus
        'qs-cm-pill-ask-inputs',  // UserTask-Formular an/aus
        'qs-cm-pill-msg-inputs',  // Nachrichten-Formular an/aus
        'qs-cm-pill-dmn-pause',   // DMN auswerten (Pause) an/aus
        'qs-cm-pill-sim-follow',  // Sim folgt Ebenen an/aus
        'qs-cm-pill-layers',      // Ebenen-Sichtbarkeit an/aus
        'qs-cm-pill-color',       // Farb-Override an/aus
    ]);

    function ensureStyles() {
        if (document.getElementById(STYLE_ID)) return;
        const s = document.createElement('style');
        s.id = STYLE_ID;
        s.textContent = `
            .qs-cm-analyse-wrap { position: relative; display: inline-block; }
            .qs-cm-analyse-wrap .qs-cm-pill-analyse .qs-cm-pill-caret {
                font-size: 0.7rem; margin-left: 2px; opacity: 0.7;
            }
            /* Pfadspur-Zustand am SYNIXX-Trigger (Nutzer-Wunsch 2026-08-18):
               orange = Pfade werden dargestellt, neutral = aus. */
            .qs-cm-analyse-wrap[data-trail-on="true"] > .qs-cm-pill-analyse {
                background: #f59e0b !important; border-color: #d97706 !important;
                color: #1a1d22 !important;
            }
            .qs-cm-analyse-wrap[data-any-pressed="true"] > .qs-cm-pill-analyse {
                border-color: #60a5fa; color: #93c5fd;
            }
            .qs-cm-analyse-menu {
                position: absolute; top: 100%; right: 0;
                margin-top: 4px; display: none;
                /* Ueber Sticky-Tool-Windows (Watch=9998) bleiben, unter
                   Toasts (9999) und Modals (10000+). */
                z-index: 9995; min-width: 260px;
                background: var(--qs-panel,#1a1d22); border: 1px solid var(--qs-border,#444);
                border-radius: 8px; padding: 6px;
                box-shadow: 0 20px 44px -18px var(--qs-shadow,rgba(0,0,0,0.65));
            }
            /* Click-gesteuertes Open/Close: data-open=true zeigt das Menue.
               Offen = zwei Spalten, in denen die Zonen-Boxen GESTAPELT liegen
               (wie v2-Studio: umrandete Bereiche mit farbiger Überschrift,
               direkt untereinander). Spalte per .qs-col2-Tag. */
            .qs-cm-analyse-wrap[data-open="true"] .qs-cm-analyse-menu {
                display: flex;
                gap: 10px;
                align-items: flex-start;
                width: max-content;
                max-width: 92vw;
            }
            .qs-cm-analyse-col {
                display: flex; flex-direction: column; gap: 8px;
                min-width: 210px;
            }
            .qs-cm-analyse-wrap[data-open="true"] > .qs-cm-pill-analyse {
                background: rgba(96,165,250,0.18); color: #93c5fd; border-color: #60a5fa;
            }
            /* Pillen innerhalb des Menues wie Listeneinträge rendern */
            .qs-cm-analyse-menu .qs-cm-pill {
                display: flex; width: 100%; height: auto;
                padding: 7px 10px; border: none; background: transparent;
                color: var(--qs-text-dim,#cbd5e1); font-size: 0.82rem;
                border-radius: 4px; justify-content: flex-start;
                gap: 8px;
            }
            .qs-cm-analyse-menu .qs-cm-pill:hover {
                background: var(--qs-panel-2,rgba(255,255,255,0.05)); color: var(--qs-text,#fff);
                border-color: transparent;
            }
            /* Status-Marker analog v2-Studio (keine große Farbfläche mehr):
               feste Status-Spalte links via ::before → nichts springt.
                 · .qs-cm-chk (echter An/Aus-Schalter, aria-pressed=true) → ✓
                 · aria-pressed=true OHNE .qs-cm-chk (Fenster offen)       → ●
                 · Aktionen (kein aria-pressed) → leer, aber gleiche Breite.
               Semantik jetzt eindeutig; die blaue FLÄCHE entfällt (löst auch
               das Kontrastproblem mittelblau-auf-hellblau). */
            .qs-cm-analyse-menu .qs-cm-pill::before {
                content: "";
                flex: 0 0 auto;
                width: 14px;
                margin-right: 2px;
                text-align: center;
                font-size: 0.8em;
                color: var(--qs-accent,#60a5fa);
            }
            .qs-cm-analyse-menu .qs-cm-pill.qs-cm-chk[aria-pressed="true"]::before { content: "✓"; }
            .qs-cm-analyse-menu .qs-cm-pill[aria-pressed="true"]:not(.qs-cm-chk)::before { content: "●"; font-size: 0.6em; }
            /* aktive Einträge nur dezent in Akzentfarbe, KEINE Flächen-Hinterlegung */
            .qs-cm-analyse-menu .qs-cm-pill[aria-pressed="true"] {
                background: transparent; color: var(--qs-accent-strong,#2563eb);
                border-color: transparent; font-weight: 600;
            }
            .qs-cm-analyse-sep {
                height: 1px; background: var(--qs-border-soft,#2d3138); margin: 4px 6px;
            }
            /* Zonen-Box: umrandeter Bereich je Sektion (v2-Studio-Look). Die
               Rahmenfarbe zieht dezent die Gruppen-Farbe (--qs-sec-grp, per JS
               gesetzt) → farbige Zuordnung ohne laute Flächen. */
            .qs-cm-analyse-section {
                border: 1px solid var(--qs-border-soft,#2d3138);
                border-radius: 8px;
                padding: 2px 4px 4px;
                background: var(--qs-panel-2,rgba(255,255,255,0.02));
            }
            .qs-cm-analyse-section-label {
                font-size: 0.68rem;
                text-transform: uppercase;
                letter-spacing: 0.06em;
                /* farbige Überschrift je Gruppe (v2-Studio) */
                color: var(--qs-sec-grp, var(--qs-text-mute,#6b7280));
                padding: 6px 6px 4px;
                font-weight: 700;
                display: flex;
                align-items: center;
                gap: 6px;
                cursor: pointer;
                user-select: none;
                border-radius: 4px;
            }
            .qs-cm-analyse-section-label:hover {
                background: var(--qs-panel-3,rgba(255,255,255,0.04));
            }
            .qs-cm-analyse-section-caret {
                font-size: 0.6rem;
                opacity: 0.7;
                display: inline-block;
                width: 9px;
                text-align: center;
            }
            /* Eingeklappte Sektion: alles ausser dem Label verbergen. */
            .qs-cm-analyse-section[data-collapsed="true"] {
                padding-bottom: 2px;
            }
            .qs-cm-analyse-section[data-collapsed="true"] > *:not(.qs-cm-analyse-section-label) {
                display: none !important;
            }
            /* Trail-Color-Popup soll aus dem Menue ausragen */
            .qs-cm-analyse-menu { overflow: visible; }
        `;
        document.head.appendChild(s);
    }

    // Persistenz fuer Section-Collapse-State (pro Sektion-ID).
    const COLLAPSE_LS = 'qs-cm-werkzeuge-collapsed';
    function _qsLoadCollapsed() {
        try { return JSON.parse(localStorage.getItem(COLLAPSE_LS) || '{}') || {}; }
        catch (e) { return {}; }
    }
    function _qsSaveCollapsed(state) {
        try { localStorage.setItem(COLLAPSE_LS, JSON.stringify(state || {})); }
        catch (e) { /* ignore */ }
    }

    function ensureWrap(bar) {
        let wrap = bar.querySelector(':scope > .qs-cm-analyse-wrap');
        if (wrap) return wrap;
        wrap = document.createElement('div');
        wrap.className = 'qs-cm-analyse-wrap';
        const collapsed = _qsLoadCollapsed();
        const secHtml = (sec) => {
            const isCol = !!collapsed[sec.id];
            const grpColor = GRP_COLORS[sec.grp] || '';
            const grpStyle = grpColor ? ' style="--qs-sec-grp:' + grpColor + ';"' : '';
            return '<div class="qs-cm-analyse-section" data-section="' + sec.id + '"' +
                ' data-collapsed="' + (isCol ? 'true' : 'false') + '"' + grpStyle + '>' +
                '<div class="qs-cm-analyse-section-label" data-toggle-section="' + sec.id + '">' +
                    '<span class="qs-cm-analyse-section-caret">' + (isCol ? '▸' : '▾') + '</span>' +
                    sec.label +
                '</div>' +
                '<div class="qs-cm-analyse-group" data-group="' + sec.id + '"></div>' +
            '</div>';
        };
        // Zwei Spalten: Zonen-Boxen gestapelt (col:1 = links, col:2 = rechts).
        const col1 = SECTIONS.filter((s) => (s.col || 1) === 1).map(secHtml).join('');
        const col2 = SECTIONS.filter((s) => s.col === 2).map(secHtml).join('');
        wrap.innerHTML =
            '<button type="button" class="qs-cm-pill qs-cm-pill-analyse" title="Synixx-Werkzeuge — orange = Pfadspur wird dargestellt">' +
                '<span class="qs-cm-pill-icon"><span data-icon="sliders-vertical"></span></span>' +
                '<span class="qs-cm-pill-label">Synixx</span>' +
                '<span class="qs-cm-pill-caret">▾</span>' +
            '</button>' +
            '<div class="qs-cm-analyse-menu" role="menu">' +
                '<div class="qs-cm-analyse-col">' + col1 + '</div>' +
                '<div class="qs-cm-analyse-col">' + col2 + '</div>' +
            '</div>';
        bar.appendChild(wrap);

        // Section-Klick toggelt collapse-State + Persistenz. Event-Delegation
        // ueber den Menu-Container, damit's auch fuer Sektionen klappt die der
        // SECTIONS-Array spaeter ggf. dynamisch erweitert wuerde.
        // Pfadspur-Zustand an den Synixx-Trigger spiegeln (orange = an):
        // die Trail-Pill lebt jetzt IM Menü und trägt aria-pressed.
        try {
            const trail = wrap.querySelector('.qs-cm-pill-trail') || document.querySelector('.qs-cm-pill-trail');
            const spiegel = () => {
                const t = wrap.querySelector('.qs-cm-pill-trail') || document.querySelector('.qs-cm-pill-trail');
                wrap.setAttribute('data-trail-on', (t && t.getAttribute('aria-pressed') === 'true') ? 'true' : 'false');
            };
            spiegel();
            if (trail && !trail.__qsTrailSpiegel) {
                trail.__qsTrailSpiegel = true;
                new MutationObserver(spiegel).observe(trail, { attributes: true, attributeFilter: ['aria-pressed'] });
            }
        } catch (e) { /* optional */ }
        const menu = wrap.querySelector('.qs-cm-analyse-menu');
        if (menu) {
            menu.addEventListener('click', (e) => {
                const label = e.target.closest && e.target.closest('.qs-cm-analyse-section-label');
                if (!label || !menu.contains(label)) return;
                const section = label.parentElement;
                const id = section && section.dataset.section;
                if (!id) return;
                e.stopPropagation();  // sonst rauscht's durchs Werkzeuge-Wrap weiter
                const wasCol = section.getAttribute('data-collapsed') === 'true';
                const next = !wasCol;
                section.setAttribute('data-collapsed', next ? 'true' : 'false');
                const caret = label.querySelector('.qs-cm-analyse-section-caret');
                if (caret) caret.textContent = next ? '▸' : '▾';
                const st = _qsLoadCollapsed();
                st[id] = next;
                _qsSaveCollapsed(st);
                _qsHidePeek();
            });
            // Hover-Peek: bei EINGEKLAPPTER Sektion + langem Header-Hover → Flyout mit
            // Klonen der Pills (Klick → original.click()). Geteiltes Verhalten wie Browser.
            let _peekShowT = null, _peekHideT = null, _peekEl = null;
            function _qsHidePeek() { if (_peekEl) { _peekEl.remove(); _peekEl = null; } }
            function _qsScheduleHidePeek() { clearTimeout(_peekHideT); _peekHideT = setTimeout(_qsHidePeek, 180); }
            function _qsShowPeek(label, section) {
                _qsHidePeek();
                const group = section.querySelector('.qs-cm-analyse-group');
                if (!group) return;
                const fly = document.createElement('div'); fly.className = 'qs-cm-analyse-peek';
                fly.style.cssText = 'position:fixed; z-index:11000; background:var(--qs-panel,#1a1d22); border:1px solid var(--qs-border,#444); border-radius:10px; box-shadow:0 10px 40px rgba(0,0,0,.5); padding:6px; display:flex; flex-direction:column; gap:2px; min-width:200px; max-width:340px; max-height:70vh; overflow:auto;';
                const t = document.createElement('div'); t.textContent = (label.textContent || '').replace(/^[▸▾]\s*/, '').trim();
                t.style.cssText = 'font-size:10px; text-transform:uppercase; letter-spacing:.05em; color:#6b7280; padding:4px 8px 6px;'; fly.appendChild(t);
                let n = 0;
                Array.from(group.children).forEach((orig) => {
                    const clone = orig.cloneNode(true); clone.removeAttribute('id'); clone.style.display = '';
                    clone.addEventListener('click', (e) => { e.stopPropagation(); _qsHidePeek(); try { orig.click(); } catch (err) {} });
                    fly.appendChild(clone); n++;
                });
                if (!n) return;
                document.body.appendChild(fly);
                const r = label.getBoundingClientRect(); const fr = fly.getBoundingClientRect();
                let left = r.right + 6, top = r.top;
                if (left + fr.width > window.innerWidth - 8) left = Math.max(8, r.left - fr.width - 6);
                if (top + fr.height > window.innerHeight - 8) top = Math.max(8, window.innerHeight - fr.height - 8);
                fly.style.left = left + 'px'; fly.style.top = top + 'px';
                fly.addEventListener('mouseenter', () => clearTimeout(_peekHideT));
                fly.addEventListener('mouseleave', _qsScheduleHidePeek);
                _peekEl = fly;
            }
            menu.addEventListener('mouseover', (e) => {
                const label = e.target.closest && e.target.closest('.qs-cm-analyse-section-label');
                if (!label || !menu.contains(label)) return;
                const section = label.parentElement;
                clearTimeout(_peekShowT);
                if (!section || section.getAttribute('data-collapsed') !== 'true') return;
                _peekShowT = setTimeout(() => { if (section.getAttribute('data-collapsed') === 'true') _qsShowPeek(label, section); }, 500);
            });
            menu.addEventListener('mouseout', (e) => {
                const label = e.target.closest && e.target.closest('.qs-cm-analyse-section-label');
                if (label) { clearTimeout(_peekShowT); _qsScheduleHidePeek(); }
            });
        }
        // Observer fuer "any pressed" Status des Trigger-Buttons
        const obs = new MutationObserver(() => {
            const any = wrap.querySelectorAll('.qs-cm-pill[aria-pressed="true"]').length > 0;
            wrap.setAttribute('data-any-pressed', any ? 'true' : 'false');
        });
        obs.observe(wrap, { subtree: true, attributes: true, attributeFilter: ['aria-pressed'] });

        // Click-Mechanik (statt frueherem Hover): Trigger toggelt data-open,
        // Klick auf einen Menue-Eintrag schliesst NICHT (Toggle-Pills muessen
        // mehrfach klickbar bleiben), Klick ausserhalb / ESC schliessen.
        const trigger = wrap.querySelector('.qs-cm-pill-analyse');
        if (trigger) {
            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                const isOpen = wrap.getAttribute('data-open') === 'true';
                wrap.setAttribute('data-open', isOpen ? 'false' : 'true');
            });
        }
        // Click ausserhalb schliesst — auf document-Ebene, ignoriert Klicks
        // innerhalb des wrap (sonst koennte man keine Eintraege anklicken).
        document.addEventListener('mousedown', (e) => {
            if (wrap.getAttribute('data-open') !== 'true') return;
            if (wrap.contains(e.target)) return;
            wrap.setAttribute('data-open', 'false');
        }, true);
        // ESC schliesst, wenn offen
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && wrap.getAttribute('data-open') === 'true') {
                wrap.setAttribute('data-open', 'false');
            }
        });
        return wrap;
    }

    // Findet die "Move-Unit" zu einer Pill-Klasse in der Bar.
    // Manche Pills (Color, Layers, Tools) sind in einen relativen Wrapper-div
    // verpackt, weil ihr eigenes Popup absolut darunter positioniert ist.
    // In dem Fall muss der Wrapper (mit Pill+Popup) verschoben werden, nicht
    // nur die Pill — sonst bleibt das Popup als Waise zurueck.
    function _qsFindPillUnit(bar, cls) {
        const pill = bar.querySelector('.' + cls);
        if (!pill) return null;
        // Hoch wandern bis zum direkten Bar-Kind
        let unit = pill;
        while (unit.parentElement && unit.parentElement !== bar) {
            unit = unit.parentElement;
        }
        return unit.parentElement === bar ? unit : null;
    }

    function autoArrange() {
        ensureStyles();
        const bars = document.querySelectorAll('.qs-cm-pills');
        bars.forEach((bar) => {
            // Sammle Pillen (bzw. ihre Wrap-Container), die ins Dropdown
            // verschoben werden sollen.
            const moves = [];
            SECTIONS.forEach((sec) => {
                sec.pills.forEach((cls) => {
                    const p = _qsFindPillUnit(bar, cls);
                    // Eigenes Werkzeuge-Wrap nicht in sich selbst verschieben
                    if (p && !p.classList.contains('qs-cm-analyse-wrap')) {
                        moves.push({ pill: p, group: sec.id, cls: cls });
                    }
                });
            });
            if (moves.length === 0) return;
            const wrap = ensureWrap(bar);
            moves.forEach(({ pill, group, cls }) => {
                const target = wrap.querySelector('.qs-cm-analyse-group[data-group="' + group + '"]');
                if (target) target.appendChild(pill);
                // ✓-Häkchen nur für echte An/Aus-Schalter; die Pille selbst ODER
                // (bei Wrap-Pillen) das innere Pill-Element markieren.
                if (cls && CHK_PILLS.has(cls)) {
                    const btn = pill.classList.contains('qs-cm-pill') ? pill : pill.querySelector('.qs-cm-pill');
                    if (btn) btn.classList.add('qs-cm-chk');
                }
            });
            // Leere Sektionen verstecken (z.B. wenn ein Plugin nicht geladen ist)
            wrap.querySelectorAll('.qs-cm-analyse-section').forEach((sec) => {
                const grp = sec.querySelector('.qs-cm-analyse-group');
                sec.style.display = (grp && grp.children.length > 0) ? '' : 'none';
            });
            // Werkzeuge immer ans Ende der Bar — falls Top-Level-Pills NACH
            // dem ersten Wrap-Trigger erzeugt wurden, waren sie sonst rechts
            // vom Wrap (DOM-Insertion-Order). appendChild auf existierendem
            // Kind verschiebt es ans Ende — billig und idempotent.
            bar.appendChild(wrap);
        });
    }

    // Pro bekanntem qs-cm-pills-Bar: Observer auf Childlist-Aenderungen,
    // damit asynchron hinzugefuegte Pillen ins Wrap wandern.
    function watch() {
        document.querySelectorAll('.qs-cm-pills').forEach((bar) => {
            if (bar.__qsAnalyseWatched) return;
            bar.__qsAnalyseWatched = true;
            const obs = new MutationObserver(() => autoArrange());
            obs.observe(bar, { childList: true });
        });
    }

    function init() {
        autoArrange();
        watch();
    }

    // Initial-Schedule fuer ersten Tab.
    setTimeout(init, 50);
    setTimeout(init, 250);
    setTimeout(init, 800);
    setTimeout(init, 1500);
    setTimeout(init, 3000);

    // GLOBAL-Observer: jeder neue CM-Tab erzeugt einen frischen Canvas-Container
    // mit eigener qs-cm-pills-Toolbar — der Per-Bar-Observer oben kennt die
    // aber noch nicht. Wir beobachten daher den gesamten Body und feuern init()
    // (debounced), sobald irgendwo etwas am DOM-Tree wechselt. Subtree-Listener
    // sind preiswert solange das Callback selbst keine grossen Listen iteriert.
    let pendingTimer = null;
    function scheduleInit() {
        if (pendingTimer) return;
        pendingTimer = setTimeout(() => {
            pendingTimer = null;
            try { init(); } catch (e) { /* ignore */ }
        }, 80);
    }
    // Idempotenz: jedes Plugin-Bundle bringt eine eigene Kopie dieser Datei
    // mit. Damit nicht 6 Body-Observer parallel laufen, setzen wir ein Flag.
    if (typeof MutationObserver !== 'undefined' && document.body && !window.__qsCmAnalyseBodyObsInstalled) {
        window.__qsCmAnalyseBodyObsInstalled = true;
        const bodyObs = new MutationObserver((mutations) => {
            // Nur reagieren, wenn ein qs-cm-pills-Bar dazukommt oder ein
            // direkter Pill-Kandidat irgendwo erscheint. Sonst wuerde das
            // Callback bei jedem dnd-Hover feuern.
            for (const m of mutations) {
                if (!m.addedNodes || m.addedNodes.length === 0) continue;
                for (const n of m.addedNodes) {
                    if (n.nodeType !== 1) continue;
                    if (n.classList && n.classList.contains('qs-cm-pills')) { scheduleInit(); return; }
                    if (n.querySelector && n.querySelector('.qs-cm-pills, .qs-cm-pill')) { scheduleInit(); return; }
                }
            }
        });
        bodyObs.observe(document.body, { childList: true, subtree: true });
    } else if (document.readyState === 'loading') {
        // Body noch nicht da — beim DOMContentLoaded erneut versuchen.
        document.addEventListener('DOMContentLoaded', () => setTimeout(init, 50));
    }

    // Geteilter Toolbar-Bauer der CM-Plugins (Dedup 2026-08-17): lag zuvor
    // WORTGLEICH in 7 Plugin-Entries kopiert. Idempotent — eine .qs-cm-pills-
    // Leiste je Canvas-Container; Container bekommt bei Bedarf position:relative.
    function qsCmGetOrCreateToolbar(canvas) {
        const cont = canvas.getContainer && canvas.getContainer();
        if (!cont) return null;
        try {
            const pos = window.getComputedStyle(cont).position;
            if (pos === 'static' || !pos) cont.style.position = 'relative';
        } catch (e) { /* ignore */ }
        let bar = cont.querySelector(':scope > .qs-cm-pills');
        if (!bar) {
            bar = document.createElement('div');
            bar.className = 'qs-cm-pills';
            cont.appendChild(bar);
        }
        return bar;
    }
    if (typeof window !== 'undefined') window.qsCmGetOrCreateToolbar = qsCmGetOrCreateToolbar;
    if (typeof window !== 'undefined') window.qsCmArrangeAnalyse = autoArrange;
})();
