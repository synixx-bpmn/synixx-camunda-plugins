// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 SmartBPM, Michael Ricken — Synixx-Werkzeugfamilie.
// Dieses Modul ist Teil der MIT-veröffentlichten Camunda-Modeler-Plugins
// (Repo synixx-camunda-plugins); die MIT-Lizenz gilt für DIESE Datei auch
// innerhalb des Synixx-Gesamtprojekts.
// Shared helper für Kommentar-Medien (Web BPMN-Live + CM-Plugin).
//
// Parst Kommentartext mit Markdown-Subset:
//   [Label](url)   → Klick-Link mit Hover-Vorschau
//   ![Alt](url)    → Inline-Vorschau eingebettet im Tooltip + Klick öffnet
//
// URLs:
//   http(s)://...  → direkt
//   relative/path  → via injected resolveLocal(rel) → absolute URL
//
// Typ-Erkennung über Endung / Domain:
//   Bild  (.png .jpg .jpeg .gif .webp .svg)
//   Video (.mp4 .webm .mov)
//   Audio (.mp3 .wav .ogg)
//   PDF   (.pdf)
//   YouTube / Vimeo → embed-Variante
//   Sonst http(s) → Website (iframe mit Fallback)
//
// Hover-Popup: shared (eine Instanz pro Document), mit 200ms Show/Hide-Delay
//              und Bridge-Hover-Logik (Maus über Popup hält es offen).
// Pin-Popup:   beliebig viele, draggable, schließen via ✕ / Esc.

(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (typeof root !== 'undefined') root.qsCommentMedia = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
    'use strict';

    // ---------- Markdown-Subset-Parser ----------
    // Tokens: { kind: 'text'|'link'|'inline', text?, label?, url? }
    function parseTokens(rawText) {
        const tokens = [];
        if (!rawText) return tokens;
        const re = /(!?)\[([^\]]+)\]\(([^)\s]+)\)/g;
        let lastIdx = 0; let m;
        while ((m = re.exec(rawText)) !== null) {
            if (m.index > lastIdx) tokens.push({ kind: 'text', text: rawText.slice(lastIdx, m.index) });
            const isInline = m[1] === '!';
            tokens.push({ kind: isInline ? 'inline' : 'link', label: m[2], url: m[3] });
            lastIdx = re.lastIndex;
        }
        if (lastIdx < rawText.length) tokens.push({ kind: 'text', text: rawText.slice(lastIdx) });
        return tokens;
    }

    // ---------- URL-Klassifikation ----------
    const RX_IMG  = /\.(png|jpe?g|gif|webp|svg)(\?|#|$)/i;
    const RX_VID  = /\.(mp4|webm|mov|m4v)(\?|#|$)/i;
    const RX_AUD  = /\.(mp3|wav|ogg|m4a)(\?|#|$)/i;
    const RX_PDF  = /\.pdf(\?|#|$)/i;
    // XML-artige Dokumente: BPMN/DMN/XML/HTML/XSD etc. — werden im Vorschau-
    // Fenster mit Mini-Highlighter dargestellt (Tags/Attribute/Text farblich).
    const RX_XML  = /\.(xml|bpmn|dmn|xsd|wsdl|xhtml|html?)(\?|#|$)/i;
    // Generische Textformate: in <pre> ohne Highlighting, nur monospace + Wrap.
    const RX_TXT  = /\.(json|ya?ml|md|txt|log|csv|tsv|sh|bash|zsh|py|js|mjs|cjs|ts|tsx|jsx|css|scss|less|feel|toml|ini|conf|properties)(\?|#|$)/i;
    const RX_YT   = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{6,})/i;
    const RX_VIMEO = /vimeo\.com\/(?:video\/)?(\d+)/i;
    const SAFE_PROTO = /^(https?|file):/i;
    const HAS_PROTO  = /^[a-z][a-z0-9+.-]*:/i;

    function classify(url) {
        if (!url) return 'other';
        const yt = url.match(RX_YT); if (yt) return 'youtube';
        const vm = url.match(RX_VIMEO); if (vm) return 'vimeo';
        if (RX_IMG.test(url)) return 'image';
        if (RX_VID.test(url)) return 'video';
        if (RX_AUD.test(url)) return 'audio';
        if (RX_PDF.test(url)) return 'pdf';
        if (RX_XML.test(url)) return 'xml';
        if (RX_TXT.test(url)) return 'text';
        if (/^https?:/i.test(url)) return 'website';
        return 'other';
    }
    function youtubeId(url) { const m = url.match(RX_YT); return m && m[1]; }
    function vimeoId(url)   { const m = url.match(RX_VIMEO); return m && m[1]; }

    function isAbsoluteUrl(url) { return HAS_PROTO.test(url); }
    function isSafeUrl(url) {
        if (!isAbsoluteUrl(url)) return true;
        return SAFE_PROTO.test(url);
    }

    // Resolve to absolute (for fetching/embedding). Returns null if blocked.
    function resolveUrl(url, resolveLocal) {
        if (!url) return null;
        if (!isSafeUrl(url)) return null;
        if (isAbsoluteUrl(url)) return url;
        try { return (resolveLocal && resolveLocal(url)) || null; } catch (e) { return null; }
    }

    // ---------- HTML-Escape ----------
    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    // ---------- Mini-Highlighter ----------
    // XML-Highlighter: regex-basiert, robust gegen verschachtelte Tags, korrektes
    // HTML-Escaping vor allem anderen. Nur fuer Display, kein Parser.
    function highlightXml(text) {
        let s = esc(text);
        // Reihenfolge wichtig: Comments/CDATA/PI vor generischen Tag-Matches.
        s = s.replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="qs-tx-comment">$1</span>');
        s = s.replace(/(&lt;!\[CDATA\[[\s\S]*?\]\]&gt;)/g, '<span class="qs-tx-cdata">$1</span>');
        s = s.replace(/(&lt;\?[\s\S]*?\?&gt;)/g, '<span class="qs-tx-pi">$1</span>');
        s = s.replace(/(&lt;!DOCTYPE[\s\S]*?&gt;)/g, '<span class="qs-tx-pi">$1</span>');
        // Tags: <tag attr="value" ... /> oder </tag>
        s = s.replace(
            /(&lt;\/?)([a-zA-Z_][\w:.-]*)((?:\s+[\w:.-]+(?:=&quot;[^&]*?&quot;|=&#39;[^&]*?&#39;)?)*)\s*(\/?&gt;)/g,
            function (_m, open, tag, attrs, close) {
                const attrsHtml = attrs.replace(
                    /([\w:.-]+)(=)(&quot;[^&]*?&quot;|&#39;[^&]*?&#39;)/g,
                    '<span class="qs-tx-attr">$1</span><span class="qs-tx-eq">$2</span><span class="qs-tx-val">$3</span>'
                ).replace(
                    /(\s)([\w:.-]+)(?=\s|$)/g,  // boolean-style attribute (no value)
                    '$1<span class="qs-tx-attr">$2</span>'
                );
                return `<span class="qs-tx-bracket">${open}</span>` +
                       `<span class="qs-tx-tag">${tag}</span>${attrsHtml}` +
                       `<span class="qs-tx-bracket">${close}</span>`;
            }
        );
        return s;
    }

    // ---------- Preview-HTML pro Typ ----------
    function buildPreviewHtml(url, type) {
        const safe = esc(url);
        switch (type) {
            case 'image':
                return `<img src="${safe}" alt="" style="max-width:100%; max-height:340px; display:block; border-radius:4px;" />`;
            case 'video':
                return `<video src="${safe}" controls preload="metadata" style="max-width:100%; max-height:340px; display:block; border-radius:4px;"></video>`;
            case 'audio':
                return `<audio src="${safe}" controls preload="metadata" style="width:100%;"></audio>`;
            case 'pdf':
                return `<embed src="${safe}" type="application/pdf" style="width:520px; height:340px; border-radius:4px; border:1px solid #444;" />`;
            case 'youtube': {
                const id = youtubeId(url);
                if (!id) return `<a href="${safe}" target="_blank" rel="noopener">${safe}</a>`;
                return `<iframe src="https://www.youtube.com/embed/${esc(id)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="width:520px; height:300px; border:0; border-radius:4px;"></iframe>`;
            }
            case 'vimeo': {
                const id = vimeoId(url);
                if (!id) return `<a href="${safe}" target="_blank" rel="noopener">${safe}</a>`;
                return `<iframe src="https://player.vimeo.com/video/${esc(id)}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen style="width:520px; height:300px; border:0; border-radius:4px;"></iframe>`;
            }
            case 'website':
                return `<iframe src="${safe}" sandbox="allow-scripts allow-same-origin allow-forms" style="width:520px; height:340px; border:0; border-radius:4px; background:#fff;"></iframe>` +
                    `<div style="margin-top:6px; font-size:11px; color:#999;">Hinweis: manche Websites blockieren das Einbetten — dann Klick zum Öffnen.</div>`;
            case 'xml':
            case 'text':
                // Placeholder: Inhalt wird async via hydrateFetchPreviews() geladen
                // und (bei xml) syntax-gehighlightet eingesetzt.
                return `<div class="qs-comment-text-preview" data-qs-fetch="${safe}" data-qs-text-type="${esc(type)}">` +
                       `<div class="qs-comment-text-loading">⏳ wird geladen…</div>` +
                       `</div>`;
            default:
                return `<a href="${safe}" target="_blank" rel="noopener" style="color:#9be7ff;">${safe}</a>`;
        }
    }

    // ---------- Async-Hydration für Text/XML-Vorschauen ----------
    // Sucht alle Placeholder unterhalb root, fetcht ihren Inhalt einmalig,
    // hightlightet (xml) oder rendert plain (text) in <pre>.
    const TEXT_MAX_BYTES = 256 * 1024;  // 256 KB Cap fuer riesige Files
    function hydrateFetchPreviews(root) {
        if (!root || !root.querySelectorAll) return;
        const placeholders = root.querySelectorAll('.qs-comment-text-preview[data-qs-fetch]');
        for (const ph of placeholders) {
            if (ph.__qsHydrated) continue;
            ph.__qsHydrated = true;
            const url = ph.getAttribute('data-qs-fetch');
            const ttype = ph.getAttribute('data-qs-text-type') || 'text';
            fetch(url, { cache: 'no-store' }).then((r) => {
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.text();
            }).then((text) => {
                let body = text;
                let truncated = false;
                if (body.length > TEXT_MAX_BYTES) {
                    body = body.slice(0, TEXT_MAX_BYTES);
                    truncated = true;
                }
                const html = (ttype === 'xml') ? highlightXml(body) : esc(body);
                const note = truncated ? `<div class="qs-comment-text-trunc">… (Datei groesser als ${Math.round(TEXT_MAX_BYTES / 1024)} KB, gekuerzt)</div>` : '';
                ph.innerHTML = `<pre class="qs-comment-text-pre"><code>${html}</code></pre>${note}`;
            }).catch((err) => {
                ph.innerHTML = `<div class="qs-comment-text-error">Laden fehlgeschlagen: ${esc(err.message)}</div>`;
            });
        }
    }

    // ---------- Render Tokens → HTML ----------
    // Ergebnis: Plain-HTML als String (sicher escapt). Inline-Vorschau wird
    // direkt eingebettet, Klick-Links erhalten Hover-Trigger-Klassen.
    function renderToHtml(rawText, ctx) {
        ctx = ctx || {};
        const tokens = parseTokens(rawText || '');
        if (tokens.length === 0) return '';
        const out = [];
        for (const t of tokens) {
            if (t.kind === 'text') {
                out.push(esc(t.text).replace(/\n/g, '<br>'));
            } else if (t.kind === 'link' || t.kind === 'inline') {
                const resolved = resolveUrl(t.url, ctx.resolveLocal);
                if (!resolved) {
                    out.push(`<span class="qs-comment-link qs-comment-link-blocked" title="Blockierte URL">${esc(t.label || t.url)}</span>`);
                    continue;
                }
                const type = classify(resolved);
                const dataAttrs = `data-qs-url="${esc(resolved)}" data-qs-type="${esc(type)}" data-qs-orig="${esc(t.url)}"`;
                if (t.kind === 'link') {
                    out.push(`<a class="qs-comment-link" ${dataAttrs} href="${esc(resolved)}" target="_blank" rel="noopener">${esc(t.label)}</a>`);
                } else {
                    // inline: Vorschau direkt + Pin/Open-Overlay rechts oben.
                    // (Kein Sekundaer-Hover-Popup — Pin sitzt direkt im Inline-Block.)
                    out.push(
                        `<div class="qs-comment-inline" ${dataAttrs}>` +
                        `<div class="qs-comment-inline-actions">` +
                          `<button class="qs-cm-popup-btn" data-qs-act="pin" title="In Pin-Fenster fixieren">📌</button>` +
                          `<button class="qs-cm-popup-btn" data-qs-act="open" title="Im Browser öffnen">↗</button>` +
                        `</div>` +
                        `<div class="qs-comment-inline-preview">${buildPreviewHtml(resolved, type)}</div>` +
                        (t.label ? `<div class="qs-comment-inline-caption">${esc(t.label)}</div>` : '') +
                        `</div>`
                    );
                }
            }
        }
        return out.join('');
    }

    // ---------- Styles ----------
    const STYLE_ID = 'qs-comment-media-style';
    function ensureStyles() {
        if (typeof document === 'undefined' || !document.head) return;
        if (document.getElementById(STYLE_ID)) return;
        const s = document.createElement('style');
        s.id = STYLE_ID;
        s.textContent = `
            .qs-comment-link { color: #9be7ff; text-decoration: underline; cursor: pointer; }
            .qs-comment-link-blocked { color: #f87171; cursor: not-allowed; }
            .qs-comment-inline { display: block; margin: 6px 0; position: relative; }
            .qs-comment-inline-preview img,
            .qs-comment-inline-preview video,
            .qs-comment-inline-preview audio,
            .qs-comment-inline-preview iframe,
            .qs-comment-inline-preview embed {
                max-width: 100%;
            }
            .qs-comment-inline-preview { display: block; }
            .qs-comment-inline-caption { font-size: 11px; color: #aaa; margin-top: 2px; }
            /* Action-Overlay rechts oben auf der Inline-Vorschau (Pin / Öffnen). */
            .qs-comment-inline-actions {
                position: absolute; top: 4px; right: 4px;
                display: flex; gap: 4px;
                z-index: 2;
                opacity: 0.85;
                transition: opacity 0.15s;
            }
            .qs-comment-inline:hover .qs-comment-inline-actions { opacity: 1; }
            .qs-comment-inline-actions .qs-cm-popup-btn {
                background: rgba(20,20,22,0.92);
                border: 1px solid #fbbf24;
                color: #fff;
                box-shadow: 0 1px 3px rgba(0,0,0,0.5);
            }
            .qs-cm-popup {
                /* Über den raisable Sim-Fenstern (5000–9990), aber UNTER dem Werkzeuge-
                   Menü/Dropmenüs (9996/9997) und App-Modals/Dialogen (≥10050) — sonst
                   verdeckt ein XML-/Referenz-Popup das geöffnete Menü. */
                position: fixed; z-index: 9993;
                background: var(--qs-panel,rgba(20,20,22,0.97)); color: var(--qs-text,#fff);
                border: 1px solid #fbbf24; border-radius: 8px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.6);
                padding: 8px;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                font-size: 12px; line-height: 1.4;
            }
            /* Hover-Popup (transient): feste Maximalmasse, intern scrollend. */
            .qs-cm-popup:not(.qs-cm-popup-pinned) {
                max-width: 540px; max-height: 420px;
                overflow: auto;
            }
            /* Pinned-Popup: per CSS resize ziehbar (Ecke unten rechts), Body
               scrollt unabhaengig vom Header. Zoom wird via CSS-zoom-Property
               auf den Body angewendet — funktioniert in Chromium/Safari/FF≥126
               (CM ist Electron Chromium). */
            .qs-cm-popup-pinned {
                display: flex; flex-direction: column;
                width: 540px; height: 380px;
                min-width: 280px; min-height: 180px;
                max-width: 90vw; max-height: 90vh;
                resize: both; overflow: hidden;
            }
            .qs-cm-popup-pinned .qs-cm-popup-header {
                flex: 0 0 auto;
            }
            .qs-cm-popup-pinned .qs-cm-popup-body-wrap {
                flex: 1 1 auto;
                overflow: auto;
                min-height: 0;
            }
            .qs-cm-popup-pinned .qs-cm-popup-body {
                /* Zoom-Wert wird per JS gesetzt (zoom-Property). */
                width: 100%; height: 100%;
            }
            /* buildPreviewHtml setzt inline style="width:520px..." — fuer
               resizable Pin muessen wir das per !important brechen, sonst
               bleiben Inhalt und Container-Resize entkoppelt. */
            .qs-cm-popup-pinned .qs-cm-popup-body iframe,
            .qs-cm-popup-pinned .qs-cm-popup-body embed {
                width: 100% !important; height: 100% !important;
                min-height: 240px;
                border: 0 !important; background: #fff;
            }
            .qs-cm-popup-pinned .qs-cm-popup-body img,
            .qs-cm-popup-pinned .qs-cm-popup-body video {
                max-width: 100% !important; max-height: 340px !important;
                display: block; margin: 0 auto;
            }
            .qs-cm-popup-header {
                display: flex; align-items: center; justify-content: space-between;
                gap: 8px; margin: -8px -8px 6px; padding: 7px 9px; cursor: move;
                font-size: 11px; color: #fbbf24;
                user-select: none;
                /* Eigene, leicht abgesetzte Titelleiste, damit der Kopf nicht mit
                   dem (im Light fast weissen) Body verschmilzt. */
                background: var(--qs-panel-3, transparent);
                border-bottom: 1px solid var(--qs-border-soft, transparent);
                border-radius: 8px 8px 0 0;
                /* Reserve rechts für den absoluten ⇥-Andockknopf (qs-dock-btn-abs
                   right:6px) — sonst überdeckt er den letzten Leisten-Button. */
                position: relative;
            }
            /* Titel darf schrumpfen (nicht die Leiste rausdrücken). */
            .qs-cm-popup-header > span:first-child {
                min-width: 0; flex: 1 1 auto; overflow: hidden;
                text-overflow: ellipsis; white-space: nowrap;
            }
            /* Werkzeugleiste bricht bei schmalem Fenster UM statt rauszuragen →
               ✕ (letzter Button) + ⇥ bleiben sichtbar und wandern mit. */
            .qs-cm-popup-actions {
                display: flex; gap: 4px; flex-wrap: wrap;
                justify-content: flex-end; flex: 0 1 auto;
            }
            .qs-cm-popup-btn {
                background: transparent; border: 1px solid var(--qs-border,#444); color: var(--qs-text,#fff);
                padding: 2px 7px; border-radius: 4px; cursor: pointer;
                font-size: 11px; line-height: 1;
            }
            .qs-cm-popup-btn:hover { border-color: #fbbf24; background: rgba(251,191,36,0.1); }
            .qs-cm-popup-zoom {
                font-variant-numeric: tabular-nums;
                color: var(--qs-text-mute,#aaa); font-size: 10px;
                padding: 2px 4px;
            }
            .qs-cm-popup-body img,
            .qs-cm-popup-body video { max-height: 340px; }

            /* Text/XML-Vorschau: monospace, dunkel, scrollbar im Tooltip-Modus,
               im Pin-Modus fuellt das pre den Body komplett. */
            .qs-comment-text-preview {
                background: var(--qs-panel-3,#1a1d22);
                border-radius: 4px;
                border: 1px solid var(--qs-border-soft,#2a2d33);
                overflow: hidden;
            }
            .qs-comment-text-loading,
            .qs-comment-text-error,
            .qs-comment-text-trunc {
                padding: 8px 10px;
                color: var(--qs-text-mute,#aaa);
                font-style: italic;
                font-size: 11px;
            }
            .qs-comment-text-error { color: #f87171; font-style: normal; }
            .qs-comment-text-pre {
                margin: 0;
                padding: 8px 10px;
                color: var(--qs-text,#e6e8eb);
                font-family: ui-monospace, Menlo, Consolas, monospace;
                font-size: 11px;
                line-height: 1.45;
                white-space: pre;
                overflow: auto;
                max-height: 320px;
                tab-size: 2;
            }
            /* Wrap-Modus: Toggle setzt qs-pre-wrap auf den Popup-Container, dann
               umbricht die Pre an Wortgrenzen + ggf. mitten im Token (lange URLs).
               Horizontal-Scroll entfaellt; Container waechst vertikal. */
            .qs-pre-wrap .qs-comment-text-pre {
                white-space: pre-wrap;
                word-break: break-word;
                overflow-wrap: anywhere;
            }
            /* Wrap-Toggle-Button: aktiver Zustand visuell hervorgehoben */
            .qs-cm-popup-btn.is-active {
                background: rgba(251,191,36,0.2);
                border-color: #fbbf24;
                color: #fbbf24;
            }
            /* Im Pin-Popup: Pre fuellt den Body, kein eigenes max-height */
            .qs-cm-popup-pinned .qs-comment-text-pre {
                max-height: none !important;
                height: 100%;
            }
            .qs-cm-popup-pinned .qs-comment-text-preview {
                height: 100%;
            }
            /* Highlighter-Tokens (XML) — identisch zur XML-Vollansicht (qs-xmlfull-*) */
            .qs-tx-comment { color: var(--qs-text-mute,#6b7c93); font-style: italic; }
            .qs-tx-cdata   { color: var(--qs-text-mute,#94a3b8); }
            .qs-tx-pi      { color: var(--qs-purple,#c084fc); }
            .qs-tx-bracket { color: var(--qs-amber,#fbbf24); }
            .qs-tx-tag     { color: var(--qs-blue-soft,#60a5fa); }
            .qs-tx-attr    { color: var(--qs-green,#34d399); }
            .qs-tx-eq      { color: var(--qs-text-mute,#94a3b8); }
            .qs-tx-val     { color: var(--qs-orange,#fb923c); }
        `;
        document.head.appendChild(s);
    }

    // ---------- Shared Hover-Popup ----------
    let _hoverEl = null;
    let _hoverShowTimer = null;
    let _hoverHideTimer = null;
    let _hoverCurrentLink = null;

    function getHoverPopup() {
        if (_hoverEl) return _hoverEl;
        const div = document.createElement('div');
        div.className = 'qs-cm-popup';
        div.style.display = 'none';
        // Mausbridge: Maus über Popup → nicht ausblenden
        div.addEventListener('mouseenter', () => { clearTimeout(_hoverHideTimer); });
        div.addEventListener('mouseleave', () => { scheduleHoverHide(); });
        document.body.appendChild(div);
        _hoverEl = div;
        return div;
    }

    function scheduleHoverShow(linkEl, ctx) {
        clearTimeout(_hoverHideTimer); _hoverHideTimer = null;
        clearTimeout(_hoverShowTimer);
        _hoverShowTimer = setTimeout(() => {
            const url  = linkEl.getAttribute('data-qs-url');
            const type = linkEl.getAttribute('data-qs-type');
            if (!url) return;
            const popup = getHoverPopup();
            const titleHtml = `<span title="${esc(url)}">${esc(linkEl.textContent || url).slice(0, 60)}</span>`;
            popup.innerHTML =
                `<div class="qs-cm-popup-header">${titleHtml}` +
                `<div class="qs-cm-popup-actions">` +
                  `<button class="qs-cm-popup-btn" data-qs-act="pin" title="Fixieren">📌</button>` +
                  `<button class="qs-cm-popup-btn" data-qs-act="open" title="Öffnen">↗</button>` +
                `</div></div>` +
                `<div class="qs-cm-popup-body">${buildPreviewHtml(url, type)}</div>`;
            popup.style.display = 'block';
            const rect = linkEl.getBoundingClientRect();
            positionPopup(popup, rect.left, rect.bottom + 6);
            // Falls Vorschau ein Text/XML-Placeholder ist: jetzt fetchen+highlighten.
            try { hydrateFetchPreviews(popup); } catch (e) { /* ignore */ }
            popup.querySelector('[data-qs-act="pin"]').onclick = (ev) => {
                ev.stopPropagation();
                hideHover();
                createPin(url, type, linkEl.textContent || url);
            };
            popup.querySelector('[data-qs-act="open"]').onclick = (ev) => {
                ev.stopPropagation();
                hideHover();
                if (ctx && typeof ctx.openExternal === 'function') ctx.openExternal(url);
                else window.open(url, '_blank', 'noopener');
            };
            _hoverCurrentLink = linkEl;
        }, 200);
    }

    function scheduleHoverHide() {
        clearTimeout(_hoverShowTimer); _hoverShowTimer = null;
        clearTimeout(_hoverHideTimer);
        _hoverHideTimer = setTimeout(hideHover, 200);
    }
    function hideHover() {
        clearTimeout(_hoverShowTimer); clearTimeout(_hoverHideTimer);
        _hoverShowTimer = _hoverHideTimer = null;
        if (_hoverEl) _hoverEl.style.display = 'none';
        _hoverCurrentLink = null;
    }

    function positionPopup(el, x, y) {
        const w = el.offsetWidth || 540;
        const h = el.offsetHeight || 200;
        let left = x; let top = y;
        if (left + w > window.innerWidth - 8)   left = window.innerWidth - w - 8;
        if (top + h > window.innerHeight - 8)   top  = Math.max(8, y - h - 14);
        if (left < 8) left = 8;
        if (top < 8) top = 8;
        el.style.left = left + 'px'; el.style.top = top + 'px';
    }

    // ---------- Pinned Popups ----------
    let _pinStackOffset = 0;
    // Shared z-index-Zaehler: jede Mausinteraktion mit einem Pin-Popup hebt es
    // ueber alle anderen Pin-Popups. Bleibt im Fenster-Band UNTER dem Werkzeuge-
    // Menü/Dropmenüs (9996/9997) und App-Modals/Dialogen (≥10050) — sonst verdeckt
    // ein XML-/Referenz-/Kommentar-Popup das geöffnete Menü. Start 9900, hart auf
    // 9993 gedeckelt (passt zur .qs-cm-popup-CSS-Default-Lage). Wird auch vom
    // XML-Inspector via window.qsCommentMedia genutzt (gemeinsamer Stapel).
    // EIN gemeinsamer Fenster-Stapel mit den schwebenden Sim-Werkzeug-Fenstern: bringToFront
    // delegiert an window.qsRaiseWindow (Band 5000–9990, kompaktiert, unter Menü 9995/Modals).
    // Früher: eigener Zähler 9900→9993, der bei 9993 SÄTTIGTE (Klick brachte nichts mehr nach
    // vorn) UND ein zweites, konkurrierendes z-System neben qsRaiseWindow bildete (Sim-Fenster
    // konnten nie über ein cm-Popup kommen). Jetzt EIN Stapel → jeder Klick stapelt korrekt.
    // Fallback (qs-var-trace.js nicht geladen, z.B. isoliert): alter gedeckelter Zähler.
    let _topZ = 9900;
    function bringToFront(el) {
        if (!el) return;
        if (window.qsRaiseWindow) {
            try { if (window.qsMakeWindowRaisable && !el.__qsRaisable) window.qsMakeWindowRaisable(el); else window.qsRaiseWindow(el); return; } catch (e) { /* fallback unten */ }
        }
        // Fallback (qsRaiseWindow nicht geladen, z.B. CM-Standalone-Plugin): relativ zu den
        // Peers stapeln (max+1 im Band), bei Deckel kompaktieren — KEINE Sättigung wie früher.
        const MIN = 9900, MAX = 9993;
        let maxZ = MIN;
        try { document.querySelectorAll('.qs-cm-popup, .qs-dmn-popup').forEach((w) => { if (w === el) return; const z = parseInt(w.style.zIndex, 10); if (!isNaN(z) && z > maxZ) maxZ = z; }); } catch (e) {}
        let next = maxZ + 1;
        if (next > MAX) {
            try {
                const peers = Array.from(document.querySelectorAll('.qs-cm-popup, .qs-dmn-popup')).filter((w) => w !== el)
                    .sort((a, b) => (parseInt(a.style.zIndex, 10) || 0) - (parseInt(b.style.zIndex, 10) || 0));
                let z = MIN; peers.forEach((w) => { w.style.zIndex = String(z++); });
                next = Math.min(MAX, z);
            } catch (e) { next = MAX; }
        }
        _topZ = next;
        el.style.zIndex = String(next);
    }
    function createPin(url, type, label) {
        const div = document.createElement('div');
        div.className = 'qs-cm-popup qs-cm-popup-pinned';
        const offset = (_pinStackOffset = (_pinStackOffset + 24) % 240);
        div.innerHTML =
            `<div class="qs-cm-popup-header">` +
              `<span title="${esc(url)}" style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:1;">📌 ${esc(label).slice(0, 60)}</span>` +
              `<div class="qs-cm-popup-actions">` +
                `<button class="qs-cm-popup-btn" data-qs-act="wrap" title="Zeilenumbruch ein/aus">↵</button>` +
                `<button class="qs-cm-popup-btn" data-qs-act="zoom-out" title="Verkleinern">−</button>` +
                `<span class="qs-cm-popup-zoom" data-qs-zoom-display>100%</span>` +
                `<button class="qs-cm-popup-btn" data-qs-act="zoom-in" title="Vergrößern">+</button>` +
                `<button class="qs-cm-popup-btn" data-qs-act="zoom-reset" title="Zoom zurücksetzen">⤢</button>` +
                `<button class="qs-cm-popup-btn" data-qs-act="open" title="Öffnen">↗</button>` +
                `<button class="qs-cm-popup-btn" data-qs-act="close" title="Schließen">✕</button>` +
              `</div>` +
            `</div>` +
            `<div class="qs-cm-popup-body-wrap">` +
              `<div class="qs-cm-popup-body">${buildPreviewHtml(url, type)}</div>` +
            `</div>`;
        document.body.appendChild(div);
        positionPopup(div, 80 + offset, 80 + offset);
        bringToFront(div);
        // Falls Vorschau-Body einen Text/XML-Placeholder hat: hydrieren.
        try { hydrateFetchPreviews(div); } catch (e) { /* ignore */ }

        // Klick irgendwo im Popup hebt es ueber alle anderen Pin-Popups.
        // mousedown statt click, damit Drag-Operationen auch sofort vorne starten.
        div.addEventListener('mousedown', () => bringToFront(div), true);

        // Drag via Header
        const header = div.querySelector('.qs-cm-popup-header');
        let dragOff = null;
        header.addEventListener('mousedown', (e) => {
            if (e.target.closest('button')) return;
            const r = div.getBoundingClientRect();
            dragOff = { x: e.clientX - r.left, y: e.clientY - r.top };
            // Beim Drag-Start: Pixel-Werte fixieren, falls vorher right/bottom o.ae.
            div.style.left = r.left + 'px';
            div.style.top  = r.top + 'px';
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

        // Zoom-Steuerung via CSS-zoom-Property auf .qs-cm-popup-body.
        // Schritte: 1.25-Faktor pro Klick; clamp 0.25..4.
        // CSS-zoom skaliert sowohl Visual als auch Layout-Box → Wrapper-Overflow
        // produziert Scrollbalken automatisch (im Gegensatz zu transform:scale).
        const body = div.querySelector('.qs-cm-popup-body');
        const zoomDisplay = div.querySelector('[data-qs-zoom-display]');
        let zoom = 1;
        function applyZoom() {
            body.style.zoom = String(zoom);
            zoomDisplay.textContent = Math.round(zoom * 100) + '%';
        }
        function setZoom(z) { zoom = Math.max(0.25, Math.min(4, z)); applyZoom(); }
        div.querySelector('[data-qs-act="zoom-in"]').addEventListener('click', (e) => { e.stopPropagation(); setZoom(zoom * 1.25); });
        div.querySelector('[data-qs-act="zoom-out"]').addEventListener('click', (e) => { e.stopPropagation(); setZoom(zoom / 1.25); });
        div.querySelector('[data-qs-act="zoom-reset"]').addEventListener('click', (e) => { e.stopPropagation(); setZoom(1); });
        // Wrap-Toggle: schaltet white-space zwischen pre und pre-wrap (CSS-Klasse).
        const wrapBtn = div.querySelector('[data-qs-act="wrap"]');
        wrapBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const on = !div.classList.contains('qs-pre-wrap');
            div.classList.toggle('qs-pre-wrap', on);
            wrapBtn.classList.toggle('is-active', on);
            wrapBtn.title = on ? 'Zeilenumbruch aus (horizontal scrollen)' : 'Zeilenumbruch ein';
        });
        // Strg+Mausrad im Body: Zoom feinstufig
        div.querySelector('.qs-cm-popup-body-wrap').addEventListener('wheel', (e) => {
            if (!e.ctrlKey && !e.metaKey) return;
            e.preventDefault();
            const factor = e.deltaY < 0 ? 1.1 : (1 / 1.1);
            setZoom(zoom * factor);
        }, { passive: false });

        function close() {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            div.remove();
        }
        div.querySelector('[data-qs-act="close"]').addEventListener('click', close);
        div.querySelector('[data-qs-act="open"]').addEventListener('click', () => {
            if (typeof window.qsCommentMedia.lastOpenExternal === 'function') {
                window.qsCommentMedia.lastOpenExternal(url);
            } else {
                window.open(url, '_blank', 'noopener');
            }
        });
        // Esc schließt fokussiertes Pin
        div.tabIndex = -1;
        div.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
        div.focus();
        return div;
    }

    // ---------- Wire-Up ----------
    // Hängt Hover-Popup an Klick-Links und Pin/Open-Buttons an Inline-Blöcke.
    // Inline-Block: KEIN Sekundär-Popup (Vorschau ist eh schon sichtbar);
    //               Pin-/Open-Buttons aus dem Action-Overlay greifen direkt.
    // Klick-Link:   Hover öffnet Sekundär-Popup mit Vorschau + Pin + Öffnen.
    function attachPreviews(containerEl, ctx) {
        if (!containerEl) return;
        ensureStyles();
        ctx = ctx || {};
        // Letzte openExternal-Funktion für Pin-Popups merken (Pins überleben Container)
        if (typeof ctx.openExternal === 'function') {
            window.qsCommentMedia.lastOpenExternal = ctx.openExternal;
        }
        // Async-Hydration fuer Text/XML-Inline-Previews (BPMN/XML/JSON/...)
        try { hydrateFetchPreviews(containerEl); } catch (e) { /* ignore */ }
        // Klick-Links: Hover-Popup
        const klickLinks = containerEl.querySelectorAll('.qs-comment-link');
        for (const el of klickLinks) {
            if (el.__qsBound) continue;
            el.__qsBound = true;
            el.addEventListener('mouseenter', () => scheduleHoverShow(el, ctx));
            el.addEventListener('mouseleave', () => scheduleHoverHide());
            el.addEventListener('click', (ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                hideHover();
                const url = el.getAttribute('data-qs-url');
                if (!url) return;
                if (typeof ctx.openExternal === 'function') ctx.openExternal(url);
                else window.open(url, '_blank', 'noopener');
            });
        }
        // Inline-Blöcke: Pin/Open-Buttons direkt im Overlay
        const inlines = containerEl.querySelectorAll('.qs-comment-inline');
        for (const el of inlines) {
            if (el.__qsBound) continue;
            el.__qsBound = true;
            const url   = el.getAttribute('data-qs-url');
            const type  = el.getAttribute('data-qs-type');
            const label = el.querySelector('.qs-comment-inline-caption')?.textContent || (url || '');
            const pinBtn  = el.querySelector('[data-qs-act="pin"]');
            const openBtn = el.querySelector('[data-qs-act="open"]');
            if (pinBtn) pinBtn.addEventListener('click', (ev) => {
                ev.preventDefault(); ev.stopPropagation();
                if (url) createPin(url, type, label);
            });
            if (openBtn) openBtn.addEventListener('click', (ev) => {
                ev.preventDefault(); ev.stopPropagation();
                if (!url) return;
                if (typeof ctx.openExternal === 'function') ctx.openExternal(url);
                else window.open(url, '_blank', 'noopener');
            });
        }
    }

    // ---------- Einfüge-Hilfe (vereinfachte Eingabe von Links/Medien/Verweisen) ----------
    // Erzeugt die korrekte Markdown-Subset-Syntax ([Label](url) bzw. ![Label](url)) und
    // fügt sie an der Cursorposition ein. Mini-Leiste über einer <textarea>.
    // opts: { onChange?(), pickFile?()→Promise<rel|null> }  (pickFile optional: Server-Datei-Picker)
    let _insBarCss = false;
    function ensureInsertBarCss() {
        if (_insBarCss) return; _insBarCss = true;
        const css = `
        .qs-cins-bar{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin:0 0 5px;font-size:11px;}
        .qs-cins-btn{display:inline-flex;align-items:center;gap:4px;cursor:pointer;font:inherit;font-size:11px;
            padding:3px 8px;border-radius:6px;border:1px solid var(--qs-border,#333a44);
            background:var(--qs-panel-2,#1e232b);color:var(--qs-text,#e8eaed);}
        .qs-cins-btn:hover{border-color:var(--qs-accent,#7dd3fc);background:var(--qs-panel-3,#15181d);}
        .qs-cins-hint{font-size:10px;color:var(--qs-text-mute,#8a909a);margin-left:2px;}`;
        const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);
    }
    // Snippet an der aktuellen Cursorposition einfügen (und Cursor sinnvoll setzen).
    function insertAtCursor(ta, text) {
        if (!ta) return;
        const s = ta.selectionStart != null ? ta.selectionStart : ta.value.length;
        const e = ta.selectionEnd != null ? ta.selectionEnd : ta.value.length;
        ta.value = ta.value.slice(0, s) + text + ta.value.slice(e);
        const pos = s + text.length;
        try { ta.focus(); ta.setSelectionRange(pos, pos); } catch (err) {}
        try { ta.dispatchEvent(new Event('input', { bubbles: true })); } catch (err) {}
    }
    function attachInsertBar(textarea, opts) {
        if (!textarea || textarea.__qsInsBar) return; textarea.__qsInsBar = true;
        opts = opts || {};
        ensureInsertBarCss();
        const bar = document.createElement('div'); bar.className = 'qs-cins-bar';
        const ico = (n) => '<span data-icon="' + n + '"></span>';
        bar.innerHTML =
            '<button type="button" class="qs-cins-btn" data-act="link">' + ico('link') + 'Link</button>' +
            '<button type="button" class="qs-cins-btn" data-act="media">' + ico('image') + 'Medien</button>' +
            '<button type="button" class="qs-cins-btn" data-act="file">' + ico('folder-open') + 'Datei…</button>' +
            '<span class="qs-cins-hint">Bild/Video/PDF/YouTube … wird automatisch erkannt</span>';
        textarea.parentNode.insertBefore(bar, textarea);

        // Markdown-Snippet aus Label+URL bauen; inline=true → ![..]() (Vorschau eingebettet).
        function snippet(label, url, inline) {
            const lab = (label || '').trim() || (url.split(/[/\\]/).pop() || 'Link');
            return (inline ? '!' : '') + '[' + lab + '](' + url.trim() + ')';
        }
        // Dialog: URL/Pfad + optionaler Anzeigetext in EINEM Fenster (zwei Zeilen) statt
        // zweier nacheinander geöffneter Prompts. inline = Medien-Vorschau (![..]()).
        async function ask(inline) {
            const title = inline ? 'Medien einfügen' : 'Link einfügen';
            if (window.qsForm) {
                const res = await window.qsForm({
                    title, okLabel: 'Einfügen',
                    fields: [
                        { key: 'url', label: 'URL (http…) oder relativer Pfad (z.B. media/bild.png)', placeholder: 'https://… oder media/datei.pdf', autofocus: true, required: true },
                        { key: 'label', label: 'Anzeigetext (optional)', placeholder: 'leer = URL/Dateiname' },
                    ],
                });
                if (!res || !res.url || !res.url.trim()) return;
                insertAtCursor(textarea, snippet(res.label, res.url.trim(), inline));
                if (opts.onChange) opts.onChange();
                return;
            }
            // Fallback ohne qs-dialog: einfacher nativer Prompt (nur URL).
            const url = window.prompt('URL oder relativer Pfad:'); if (!url) return;
            insertAtCursor(textarea, snippet('', url, inline)); if (opts.onChange) opts.onChange();
        }
        // Server-Datei wählen (rel-Pfad) → als Medien/Link einfügen (Typ → inline bei Medien).
        async function pickFile() {
            if (typeof opts.pickFile !== 'function') { ask(false); return; }
            let rel = null; try { rel = await opts.pickFile(); } catch (e) {}
            if (!rel) return;
            const kind = classify(rel);
            const inline = (kind === 'image' || kind === 'video' || kind === 'audio' || kind === 'pdf');
            // Datei ist schon gewählt → nur noch den optionalen Anzeigetext erfragen.
            let label = '';
            if (window.qsForm) {
                const res = await window.qsForm({
                    title: 'Datei einfügen', okLabel: 'Einfügen',
                    message: rel.split('/').pop() + ' (' + kind + ')',
                    fields: [{ key: 'label', label: 'Anzeigetext (optional)', placeholder: 'leer = Dateiname', autofocus: true }],
                });
                if (!res) return; // Abbruch
                label = res.label || '';
            } else if (window.qsPrompt) {
                const l = await window.qsPrompt('Beschriftung (optional) — ' + (rel.split('/').pop()) + ' (' + kind + ')', { title: 'Datei einfügen', okLabel: 'Einfügen', value: '' });
                if (l == null) return; label = l;
            }
            insertAtCursor(textarea, snippet(label, rel, inline));
            if (opts.onChange) opts.onChange();
        }
        bar.addEventListener('click', (ev) => {
            const b = ev.target.closest && ev.target.closest('.qs-cins-btn'); if (!b) return;
            ev.preventDefault();
            const act = b.getAttribute('data-act');
            if (act === 'link') ask(false);
            else if (act === 'media') ask(true);
            else if (act === 'file') pickFile();
        });
        return bar;
    }

    // ---------- Public API ----------
    return {
        renderToHtml,
        attachPreviews,
        hydrateFetchPreviews,
        hideHover,
        ensureStyles,
        bringToFront,
        attachInsertBar,
        classify,
        // exposed für Tests
        _parseTokens: parseTokens,
        _classify: classify,
        _resolveUrl: resolveUrl,
        _highlightXml: highlightXml,
    };
});
