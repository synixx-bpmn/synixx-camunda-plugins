"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // lib/bpmn-comment-media.js
  var require_bpmn_comment_media = __commonJS({
    "lib/bpmn-comment-media.js"(exports, module) {
      (function(root, factory) {
        const api = factory();
        if (typeof module === "object" && module.exports) module.exports = api;
        if (typeof root !== "undefined") root.qsCommentMedia = api;
      })(typeof window !== "undefined" ? window : globalThis, function() {
        "use strict";
        function parseTokens(rawText) {
          const tokens = [];
          if (!rawText) return tokens;
          const re = /(!?)\[([^\]]+)\]\(([^)\s]+)\)/g;
          let lastIdx = 0;
          let m;
          while ((m = re.exec(rawText)) !== null) {
            if (m.index > lastIdx) tokens.push({ kind: "text", text: rawText.slice(lastIdx, m.index) });
            const isInline = m[1] === "!";
            tokens.push({ kind: isInline ? "inline" : "link", label: m[2], url: m[3] });
            lastIdx = re.lastIndex;
          }
          if (lastIdx < rawText.length) tokens.push({ kind: "text", text: rawText.slice(lastIdx) });
          return tokens;
        }
        const RX_IMG = /\.(png|jpe?g|gif|webp|svg)(\?|#|$)/i;
        const RX_VID = /\.(mp4|webm|mov|m4v)(\?|#|$)/i;
        const RX_AUD = /\.(mp3|wav|ogg|m4a)(\?|#|$)/i;
        const RX_PDF = /\.pdf(\?|#|$)/i;
        const RX_XML = /\.(xml|bpmn|dmn|xsd|wsdl|xhtml|html?)(\?|#|$)/i;
        const RX_TXT = /\.(json|ya?ml|md|txt|log|csv|tsv|sh|bash|zsh|py|js|mjs|cjs|ts|tsx|jsx|css|scss|less|feel|toml|ini|conf|properties)(\?|#|$)/i;
        const RX_YT = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{6,})/i;
        const RX_VIMEO = /vimeo\.com\/(?:video\/)?(\d+)/i;
        const SAFE_PROTO = /^(https?|file):/i;
        const HAS_PROTO = /^[a-z][a-z0-9+.-]*:/i;
        function classify(url) {
          if (!url) return "other";
          const yt = url.match(RX_YT);
          if (yt) return "youtube";
          const vm = url.match(RX_VIMEO);
          if (vm) return "vimeo";
          if (RX_IMG.test(url)) return "image";
          if (RX_VID.test(url)) return "video";
          if (RX_AUD.test(url)) return "audio";
          if (RX_PDF.test(url)) return "pdf";
          if (RX_XML.test(url)) return "xml";
          if (RX_TXT.test(url)) return "text";
          if (/^https?:/i.test(url)) return "website";
          return "other";
        }
        function youtubeId(url) {
          const m = url.match(RX_YT);
          return m && m[1];
        }
        function vimeoId(url) {
          const m = url.match(RX_VIMEO);
          return m && m[1];
        }
        function isAbsoluteUrl(url) {
          return HAS_PROTO.test(url);
        }
        function isSafeUrl(url) {
          if (!isAbsoluteUrl(url)) return true;
          return SAFE_PROTO.test(url);
        }
        function resolveUrl(url, resolveLocal) {
          if (!url) return null;
          if (!isSafeUrl(url)) return null;
          if (isAbsoluteUrl(url)) return url;
          try {
            return resolveLocal && resolveLocal(url) || null;
          } catch (e) {
            return null;
          }
        }
        function esc(s) {
          return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
        }
        function highlightXml(text) {
          let s = esc(text);
          s = s.replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="qs-tx-comment">$1</span>');
          s = s.replace(/(&lt;!\[CDATA\[[\s\S]*?\]\]&gt;)/g, '<span class="qs-tx-cdata">$1</span>');
          s = s.replace(/(&lt;\?[\s\S]*?\?&gt;)/g, '<span class="qs-tx-pi">$1</span>');
          s = s.replace(/(&lt;!DOCTYPE[\s\S]*?&gt;)/g, '<span class="qs-tx-pi">$1</span>');
          s = s.replace(
            /(&lt;\/?)([a-zA-Z_][\w:.-]*)((?:\s+[\w:.-]+(?:=&quot;[^&]*?&quot;|=&#39;[^&]*?&#39;)?)*)\s*(\/?&gt;)/g,
            function(_m, open, tag, attrs, close) {
              const attrsHtml = attrs.replace(
                /([\w:.-]+)(=)(&quot;[^&]*?&quot;|&#39;[^&]*?&#39;)/g,
                '<span class="qs-tx-attr">$1</span><span class="qs-tx-eq">$2</span><span class="qs-tx-val">$3</span>'
              ).replace(
                /(\s)([\w:.-]+)(?=\s|$)/g,
                // boolean-style attribute (no value)
                '$1<span class="qs-tx-attr">$2</span>'
              );
              return `<span class="qs-tx-bracket">${open}</span><span class="qs-tx-tag">${tag}</span>${attrsHtml}<span class="qs-tx-bracket">${close}</span>`;
            }
          );
          return s;
        }
        function buildPreviewHtml(url, type) {
          const safe = esc(url);
          switch (type) {
            case "image":
              return `<img src="${safe}" alt="" style="max-width:100%; max-height:340px; display:block; border-radius:4px;" />`;
            case "video":
              return `<video src="${safe}" controls preload="metadata" style="max-width:100%; max-height:340px; display:block; border-radius:4px;"></video>`;
            case "audio":
              return `<audio src="${safe}" controls preload="metadata" style="width:100%;"></audio>`;
            case "pdf":
              return `<embed src="${safe}" type="application/pdf" style="width:520px; height:340px; border-radius:4px; border:1px solid #444;" />`;
            case "youtube": {
              const id = youtubeId(url);
              if (!id) return `<a href="${safe}" target="_blank" rel="noopener">${safe}</a>`;
              return `<iframe src="https://www.youtube.com/embed/${esc(id)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="width:520px; height:300px; border:0; border-radius:4px;"></iframe>`;
            }
            case "vimeo": {
              const id = vimeoId(url);
              if (!id) return `<a href="${safe}" target="_blank" rel="noopener">${safe}</a>`;
              return `<iframe src="https://player.vimeo.com/video/${esc(id)}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen style="width:520px; height:300px; border:0; border-radius:4px;"></iframe>`;
            }
            case "website":
              return `<iframe src="${safe}" sandbox="allow-scripts allow-same-origin allow-forms" style="width:520px; height:340px; border:0; border-radius:4px; background:#fff;"></iframe><div style="margin-top:6px; font-size:11px; color:#999;">Hinweis: manche Websites blockieren das Einbetten \u2014 dann Klick zum \xD6ffnen.</div>`;
            case "xml":
            case "text":
              return `<div class="qs-comment-text-preview" data-qs-fetch="${safe}" data-qs-text-type="${esc(type)}"><div class="qs-comment-text-loading">\u23F3 wird geladen\u2026</div></div>`;
            default:
              return `<a href="${safe}" target="_blank" rel="noopener" style="color:#9be7ff;">${safe}</a>`;
          }
        }
        const TEXT_MAX_BYTES = 256 * 1024;
        function hydrateFetchPreviews(root) {
          if (!root || !root.querySelectorAll) return;
          const placeholders = root.querySelectorAll(".qs-comment-text-preview[data-qs-fetch]");
          for (const ph of placeholders) {
            if (ph.__qsHydrated) continue;
            ph.__qsHydrated = true;
            const url = ph.getAttribute("data-qs-fetch");
            const ttype = ph.getAttribute("data-qs-text-type") || "text";
            fetch(url, { cache: "no-store" }).then((r) => {
              if (!r.ok) throw new Error("HTTP " + r.status);
              return r.text();
            }).then((text) => {
              let body = text;
              let truncated = false;
              if (body.length > TEXT_MAX_BYTES) {
                body = body.slice(0, TEXT_MAX_BYTES);
                truncated = true;
              }
              const html = ttype === "xml" ? highlightXml(body) : esc(body);
              const note = truncated ? `<div class="qs-comment-text-trunc">\u2026 (Datei groesser als ${Math.round(TEXT_MAX_BYTES / 1024)} KB, gekuerzt)</div>` : "";
              ph.innerHTML = `<pre class="qs-comment-text-pre"><code>${html}</code></pre>${note}`;
            }).catch((err) => {
              ph.innerHTML = `<div class="qs-comment-text-error">Laden fehlgeschlagen: ${esc(err.message)}</div>`;
            });
          }
        }
        function renderToHtml(rawText, ctx) {
          ctx = ctx || {};
          const tokens = parseTokens(rawText || "");
          if (tokens.length === 0) return "";
          const out = [];
          for (const t of tokens) {
            if (t.kind === "text") {
              out.push(esc(t.text).replace(/\n/g, "<br>"));
            } else if (t.kind === "link" || t.kind === "inline") {
              const resolved = resolveUrl(t.url, ctx.resolveLocal);
              if (!resolved) {
                out.push(`<span class="qs-comment-link qs-comment-link-blocked" title="Blockierte URL">${esc(t.label || t.url)}</span>`);
                continue;
              }
              const type = classify(resolved);
              const dataAttrs = `data-qs-url="${esc(resolved)}" data-qs-type="${esc(type)}" data-qs-orig="${esc(t.url)}"`;
              if (t.kind === "link") {
                out.push(`<a class="qs-comment-link" ${dataAttrs} href="${esc(resolved)}" target="_blank" rel="noopener">${esc(t.label)}</a>`);
              } else {
                out.push(
                  `<div class="qs-comment-inline" ${dataAttrs}><div class="qs-comment-inline-actions"><button class="qs-cm-popup-btn" data-qs-act="pin" title="In Pin-Fenster fixieren">\u{1F4CC}</button><button class="qs-cm-popup-btn" data-qs-act="open" title="Im Browser \xF6ffnen">\u2197</button></div><div class="qs-comment-inline-preview">${buildPreviewHtml(resolved, type)}</div>` + (t.label ? `<div class="qs-comment-inline-caption">${esc(t.label)}</div>` : "") + `</div>`
                );
              }
            }
          }
          return out.join("");
        }
        const STYLE_ID = "qs-comment-media-style";
        function ensureStyles() {
          if (typeof document === "undefined" || !document.head) return;
          if (document.getElementById(STYLE_ID)) return;
          const s = document.createElement("style");
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
            /* Action-Overlay rechts oben auf der Inline-Vorschau (Pin / \xD6ffnen). */
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
                /* \xDCber den raisable Sim-Fenstern (5000\u20139990), aber UNTER dem Werkzeuge-
                   Men\xFC/Dropmen\xFCs (9996/9997) und App-Modals/Dialogen (\u226510050) \u2014 sonst
                   verdeckt ein XML-/Referenz-Popup das ge\xF6ffnete Men\xFC. */
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
               auf den Body angewendet \u2014 funktioniert in Chromium/Safari/FF\u2265126
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
            /* buildPreviewHtml setzt inline style="width:520px..." \u2014 fuer
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
                /* Reserve rechts f\xFCr den absoluten \u21E5-Andockknopf (qs-dock-btn-abs
                   right:6px) \u2014 sonst \xFCberdeckt er den letzten Leisten-Button. */
                position: relative;
            }
            /* Titel darf schrumpfen (nicht die Leiste rausdr\xFCcken). */
            .qs-cm-popup-header > span:first-child {
                min-width: 0; flex: 1 1 auto; overflow: hidden;
                text-overflow: ellipsis; white-space: nowrap;
            }
            /* Werkzeugleiste bricht bei schmalem Fenster UM statt rauszuragen \u2192
               \u2715 (letzter Button) + \u21E5 bleiben sichtbar und wandern mit. */
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
            /* Highlighter-Tokens (XML) \u2014 identisch zur XML-Vollansicht (qs-xmlfull-*) */
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
        let _hoverEl = null;
        let _hoverShowTimer = null;
        let _hoverHideTimer = null;
        let _hoverCurrentLink = null;
        function getHoverPopup() {
          if (_hoverEl) return _hoverEl;
          const div = document.createElement("div");
          div.className = "qs-cm-popup";
          div.style.display = "none";
          div.addEventListener("mouseenter", () => {
            clearTimeout(_hoverHideTimer);
          });
          div.addEventListener("mouseleave", () => {
            scheduleHoverHide();
          });
          document.body.appendChild(div);
          _hoverEl = div;
          return div;
        }
        function scheduleHoverShow(linkEl, ctx) {
          clearTimeout(_hoverHideTimer);
          _hoverHideTimer = null;
          clearTimeout(_hoverShowTimer);
          _hoverShowTimer = setTimeout(() => {
            const url = linkEl.getAttribute("data-qs-url");
            const type = linkEl.getAttribute("data-qs-type");
            if (!url) return;
            const popup = getHoverPopup();
            const titleHtml = `<span title="${esc(url)}">${esc(linkEl.textContent || url).slice(0, 60)}</span>`;
            popup.innerHTML = `<div class="qs-cm-popup-header">${titleHtml}<div class="qs-cm-popup-actions"><button class="qs-cm-popup-btn" data-qs-act="pin" title="Fixieren">\u{1F4CC}</button><button class="qs-cm-popup-btn" data-qs-act="open" title="\xD6ffnen">\u2197</button></div></div><div class="qs-cm-popup-body">${buildPreviewHtml(url, type)}</div>`;
            popup.style.display = "block";
            const rect = linkEl.getBoundingClientRect();
            positionPopup(popup, rect.left, rect.bottom + 6);
            try {
              hydrateFetchPreviews(popup);
            } catch (e) {
            }
            popup.querySelector('[data-qs-act="pin"]').onclick = (ev) => {
              ev.stopPropagation();
              hideHover();
              createPin(url, type, linkEl.textContent || url);
            };
            popup.querySelector('[data-qs-act="open"]').onclick = (ev) => {
              ev.stopPropagation();
              hideHover();
              if (ctx && typeof ctx.openExternal === "function") ctx.openExternal(url);
              else window.open(url, "_blank", "noopener");
            };
            _hoverCurrentLink = linkEl;
          }, 200);
        }
        function scheduleHoverHide() {
          clearTimeout(_hoverShowTimer);
          _hoverShowTimer = null;
          clearTimeout(_hoverHideTimer);
          _hoverHideTimer = setTimeout(hideHover, 200);
        }
        function hideHover() {
          clearTimeout(_hoverShowTimer);
          clearTimeout(_hoverHideTimer);
          _hoverShowTimer = _hoverHideTimer = null;
          if (_hoverEl) _hoverEl.style.display = "none";
          _hoverCurrentLink = null;
        }
        function positionPopup(el, x, y) {
          const w = el.offsetWidth || 540;
          const h = el.offsetHeight || 200;
          let left = x;
          let top = y;
          if (left + w > window.innerWidth - 8) left = window.innerWidth - w - 8;
          if (top + h > window.innerHeight - 8) top = Math.max(8, y - h - 14);
          if (left < 8) left = 8;
          if (top < 8) top = 8;
          el.style.left = left + "px";
          el.style.top = top + "px";
        }
        let _pinStackOffset = 0;
        let _topZ = 9900;
        function bringToFront(el) {
          if (!el) return;
          if (window.qsRaiseWindow) {
            try {
              if (window.qsMakeWindowRaisable && !el.__qsRaisable) window.qsMakeWindowRaisable(el);
              else window.qsRaiseWindow(el);
              return;
            } catch (e) {
            }
          }
          const MIN = 9900, MAX = 9993;
          let maxZ = MIN;
          try {
            document.querySelectorAll(".qs-cm-popup, .qs-dmn-popup").forEach((w) => {
              if (w === el) return;
              const z = parseInt(w.style.zIndex, 10);
              if (!isNaN(z) && z > maxZ) maxZ = z;
            });
          } catch (e) {
          }
          let next = maxZ + 1;
          if (next > MAX) {
            try {
              const peers = Array.from(document.querySelectorAll(".qs-cm-popup, .qs-dmn-popup")).filter((w) => w !== el).sort((a, b) => (parseInt(a.style.zIndex, 10) || 0) - (parseInt(b.style.zIndex, 10) || 0));
              let z = MIN;
              peers.forEach((w) => {
                w.style.zIndex = String(z++);
              });
              next = Math.min(MAX, z);
            } catch (e) {
              next = MAX;
            }
          }
          _topZ = next;
          el.style.zIndex = String(next);
        }
        function createPin(url, type, label) {
          const div = document.createElement("div");
          div.className = "qs-cm-popup qs-cm-popup-pinned";
          const offset = _pinStackOffset = (_pinStackOffset + 24) % 240;
          div.innerHTML = `<div class="qs-cm-popup-header"><span title="${esc(url)}" style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:1;">\u{1F4CC} ${esc(label).slice(0, 60)}</span><div class="qs-cm-popup-actions"><button class="qs-cm-popup-btn" data-qs-act="wrap" title="Zeilenumbruch ein/aus">\u21B5</button><button class="qs-cm-popup-btn" data-qs-act="zoom-out" title="Verkleinern">\u2212</button><span class="qs-cm-popup-zoom" data-qs-zoom-display>100%</span><button class="qs-cm-popup-btn" data-qs-act="zoom-in" title="Vergr\xF6\xDFern">+</button><button class="qs-cm-popup-btn" data-qs-act="zoom-reset" title="Zoom zur\xFCcksetzen">\u2922</button><button class="qs-cm-popup-btn" data-qs-act="open" title="\xD6ffnen">\u2197</button><button class="qs-cm-popup-btn" data-qs-act="close" title="Schlie\xDFen">\u2715</button></div></div><div class="qs-cm-popup-body-wrap"><div class="qs-cm-popup-body">${buildPreviewHtml(url, type)}</div></div>`;
          document.body.appendChild(div);
          positionPopup(div, 80 + offset, 80 + offset);
          bringToFront(div);
          try {
            hydrateFetchPreviews(div);
          } catch (e) {
          }
          div.addEventListener("mousedown", () => bringToFront(div), true);
          const header = div.querySelector(".qs-cm-popup-header");
          let dragOff = null;
          header.addEventListener("mousedown", (e) => {
            if (e.target.closest("button")) return;
            const r = div.getBoundingClientRect();
            dragOff = { x: e.clientX - r.left, y: e.clientY - r.top };
            div.style.left = r.left + "px";
            div.style.top = r.top + "px";
            e.preventDefault();
          });
          function onMove(e) {
            if (!dragOff) return;
            div.style.left = e.clientX - dragOff.x + "px";
            div.style.top = e.clientY - dragOff.y + "px";
          }
          function onUp() {
            dragOff = null;
          }
          document.addEventListener("mousemove", onMove);
          document.addEventListener("mouseup", onUp);
          const body = div.querySelector(".qs-cm-popup-body");
          const zoomDisplay = div.querySelector("[data-qs-zoom-display]");
          let zoom = 1;
          function applyZoom() {
            body.style.zoom = String(zoom);
            zoomDisplay.textContent = Math.round(zoom * 100) + "%";
          }
          function setZoom(z) {
            zoom = Math.max(0.25, Math.min(4, z));
            applyZoom();
          }
          div.querySelector('[data-qs-act="zoom-in"]').addEventListener("click", (e) => {
            e.stopPropagation();
            setZoom(zoom * 1.25);
          });
          div.querySelector('[data-qs-act="zoom-out"]').addEventListener("click", (e) => {
            e.stopPropagation();
            setZoom(zoom / 1.25);
          });
          div.querySelector('[data-qs-act="zoom-reset"]').addEventListener("click", (e) => {
            e.stopPropagation();
            setZoom(1);
          });
          const wrapBtn = div.querySelector('[data-qs-act="wrap"]');
          wrapBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            const on = !div.classList.contains("qs-pre-wrap");
            div.classList.toggle("qs-pre-wrap", on);
            wrapBtn.classList.toggle("is-active", on);
            wrapBtn.title = on ? "Zeilenumbruch aus (horizontal scrollen)" : "Zeilenumbruch ein";
          });
          div.querySelector(".qs-cm-popup-body-wrap").addEventListener("wheel", (e) => {
            if (!e.ctrlKey && !e.metaKey) return;
            e.preventDefault();
            const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
            setZoom(zoom * factor);
          }, { passive: false });
          function close() {
            document.removeEventListener("mousemove", onMove);
            document.removeEventListener("mouseup", onUp);
            div.remove();
          }
          div.querySelector('[data-qs-act="close"]').addEventListener("click", close);
          div.querySelector('[data-qs-act="open"]').addEventListener("click", () => {
            if (typeof window.qsCommentMedia.lastOpenExternal === "function") {
              window.qsCommentMedia.lastOpenExternal(url);
            } else {
              window.open(url, "_blank", "noopener");
            }
          });
          div.tabIndex = -1;
          div.addEventListener("keydown", (e) => {
            if (e.key === "Escape") close();
          });
          div.focus();
          return div;
        }
        function attachPreviews(containerEl, ctx) {
          if (!containerEl) return;
          ensureStyles();
          ctx = ctx || {};
          if (typeof ctx.openExternal === "function") {
            window.qsCommentMedia.lastOpenExternal = ctx.openExternal;
          }
          try {
            hydrateFetchPreviews(containerEl);
          } catch (e) {
          }
          const klickLinks = containerEl.querySelectorAll(".qs-comment-link");
          for (const el of klickLinks) {
            if (el.__qsBound) continue;
            el.__qsBound = true;
            el.addEventListener("mouseenter", () => scheduleHoverShow(el, ctx));
            el.addEventListener("mouseleave", () => scheduleHoverHide());
            el.addEventListener("click", (ev) => {
              ev.preventDefault();
              ev.stopPropagation();
              hideHover();
              const url = el.getAttribute("data-qs-url");
              if (!url) return;
              if (typeof ctx.openExternal === "function") ctx.openExternal(url);
              else window.open(url, "_blank", "noopener");
            });
          }
          const inlines = containerEl.querySelectorAll(".qs-comment-inline");
          for (const el of inlines) {
            if (el.__qsBound) continue;
            el.__qsBound = true;
            const url = el.getAttribute("data-qs-url");
            const type = el.getAttribute("data-qs-type");
            const label = el.querySelector(".qs-comment-inline-caption")?.textContent || (url || "");
            const pinBtn = el.querySelector('[data-qs-act="pin"]');
            const openBtn = el.querySelector('[data-qs-act="open"]');
            if (pinBtn) pinBtn.addEventListener("click", (ev) => {
              ev.preventDefault();
              ev.stopPropagation();
              if (url) createPin(url, type, label);
            });
            if (openBtn) openBtn.addEventListener("click", (ev) => {
              ev.preventDefault();
              ev.stopPropagation();
              if (!url) return;
              if (typeof ctx.openExternal === "function") ctx.openExternal(url);
              else window.open(url, "_blank", "noopener");
            });
          }
        }
        let _insBarCss = false;
        function ensureInsertBarCss() {
          if (_insBarCss) return;
          _insBarCss = true;
          const css = `
        .qs-cins-bar{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin:0 0 5px;font-size:11px;}
        .qs-cins-btn{display:inline-flex;align-items:center;gap:4px;cursor:pointer;font:inherit;font-size:11px;
            padding:3px 8px;border-radius:6px;border:1px solid var(--qs-border,#333a44);
            background:var(--qs-panel-2,#1e232b);color:var(--qs-text,#e8eaed);}
        .qs-cins-btn:hover{border-color:var(--qs-accent,#7dd3fc);background:var(--qs-panel-3,#15181d);}
        .qs-cins-hint{font-size:10px;color:var(--qs-text-mute,#8a909a);margin-left:2px;}`;
          const s = document.createElement("style");
          s.textContent = css;
          document.head.appendChild(s);
        }
        function insertAtCursor(ta, text) {
          if (!ta) return;
          const s = ta.selectionStart != null ? ta.selectionStart : ta.value.length;
          const e = ta.selectionEnd != null ? ta.selectionEnd : ta.value.length;
          ta.value = ta.value.slice(0, s) + text + ta.value.slice(e);
          const pos = s + text.length;
          try {
            ta.focus();
            ta.setSelectionRange(pos, pos);
          } catch (err) {
          }
          try {
            ta.dispatchEvent(new Event("input", { bubbles: true }));
          } catch (err) {
          }
        }
        function attachInsertBar(textarea, opts) {
          if (!textarea || textarea.__qsInsBar) return;
          textarea.__qsInsBar = true;
          opts = opts || {};
          ensureInsertBarCss();
          const bar = document.createElement("div");
          bar.className = "qs-cins-bar";
          const ico = (n) => '<span data-icon="' + n + '"></span>';
          bar.innerHTML = '<button type="button" class="qs-cins-btn" data-act="link">' + ico("link") + 'Link</button><button type="button" class="qs-cins-btn" data-act="media">' + ico("image") + 'Medien</button><button type="button" class="qs-cins-btn" data-act="file">' + ico("folder-open") + 'Datei\u2026</button><span class="qs-cins-hint">Bild/Video/PDF/YouTube \u2026 wird automatisch erkannt</span>';
          textarea.parentNode.insertBefore(bar, textarea);
          function snippet(label, url, inline) {
            const lab = (label || "").trim() || (url.split(/[/\\]/).pop() || "Link");
            return (inline ? "!" : "") + "[" + lab + "](" + url.trim() + ")";
          }
          async function ask(inline) {
            const title = inline ? "Medien einf\xFCgen" : "Link einf\xFCgen";
            if (window.qsForm) {
              const res = await window.qsForm({
                title,
                okLabel: "Einf\xFCgen",
                fields: [
                  { key: "url", label: "URL (http\u2026) oder relativer Pfad (z.B. media/bild.png)", placeholder: "https://\u2026 oder media/datei.pdf", autofocus: true, required: true },
                  { key: "label", label: "Anzeigetext (optional)", placeholder: "leer = URL/Dateiname" }
                ]
              });
              if (!res || !res.url || !res.url.trim()) return;
              insertAtCursor(textarea, snippet(res.label, res.url.trim(), inline));
              if (opts.onChange) opts.onChange();
              return;
            }
            const url = window.prompt("URL oder relativer Pfad:");
            if (!url) return;
            insertAtCursor(textarea, snippet("", url, inline));
            if (opts.onChange) opts.onChange();
          }
          async function pickFile() {
            if (typeof opts.pickFile !== "function") {
              ask(false);
              return;
            }
            let rel = null;
            try {
              rel = await opts.pickFile();
            } catch (e) {
            }
            if (!rel) return;
            const kind = classify(rel);
            const inline = kind === "image" || kind === "video" || kind === "audio" || kind === "pdf";
            let label = "";
            if (window.qsForm) {
              const res = await window.qsForm({
                title: "Datei einf\xFCgen",
                okLabel: "Einf\xFCgen",
                message: rel.split("/").pop() + " (" + kind + ")",
                fields: [{ key: "label", label: "Anzeigetext (optional)", placeholder: "leer = Dateiname", autofocus: true }]
              });
              if (!res) return;
              label = res.label || "";
            } else if (window.qsPrompt) {
              const l = await window.qsPrompt("Beschriftung (optional) \u2014 " + rel.split("/").pop() + " (" + kind + ")", { title: "Datei einf\xFCgen", okLabel: "Einf\xFCgen", value: "" });
              if (l == null) return;
              label = l;
            }
            insertAtCursor(textarea, snippet(label, rel, inline));
            if (opts.onChange) opts.onChange();
          }
          bar.addEventListener("click", (ev) => {
            const b = ev.target.closest && ev.target.closest(".qs-cins-btn");
            if (!b) return;
            ev.preventDefault();
            const act = b.getAttribute("data-act");
            if (act === "link") ask(false);
            else if (act === "media") ask(true);
            else if (act === "file") pickFile();
          });
          return bar;
        }
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
          _highlightXml: highlightXml
        };
      });
    }
  });

  // lib/bpmn-notation.js
  var require_bpmn_notation = __commonJS({
    "lib/bpmn-notation.js"() {
      (function() {
        "use strict";
        const STYLE_ID = "qs-notation-style";
        const LINKS = {
          omg: "https://www.omg.org/spec/BPMN/2.0.2/About-BPMN",
          poster: "https://bpm-conference.org/assets/docs/bpmn-poster/BPMN2_0_Poster_DE.pdf",
          camunda: "https://camunda.com/de/bpmn/bpmn-2-0-symbol-reference/"
        };
        function camRef(slug) {
          return "https://camunda.com/de/bpmn/bpmn-2-0-symbol-reference/#" + slug;
        }
        const CAM_EVENTS_BASE = camRef("events-basic-concepts");
        const CAM_EVENT_TYPES = {
          message: camRef("events-message"),
          timer: camRef("events-timer"),
          signal: camRef("events-signal"),
          error: camRef("events-error"),
          cancel: camRef("events-cancel"),
          compensation: camRef("events-compensation"),
          conditional: camRef("events-conditional"),
          escalation: camRef("events-escalation"),
          link: camRef("events-link"),
          multiple: camRef("events-multiple"),
          parallel: camRef("events-parallel"),
          terminate: camRef("events-termination")
        };
        const CATALOG = [
          {
            category: "Events (Ereignisse) \u2014 Aussenform",
            color: "#dcfce7",
            items: [
              // --- None-Varianten (ohne Trigger) ---
              { types: ["StartEvent"], name: "Start Event (None)", desc: "Generischer Prozessstart ohne Trigger. D\xFCnner Einzelkreis, leer innen. Wird ausgel\xF6st, wenn der Prozess instanziert wird (z.B. durch externen Aufruf).", cam: CAM_EVENTS_BASE },
              { iconKey: "intermediateNone", name: "Intermediate Event (None)", desc: 'Doppelter d\xFCnner Kreis, leer. Ohne Trigger ein reiner \u201EZustandsmarker" im Flow \u2014 sehr selten verwendet. Mit Trigger: siehe Catch/Throw unten.', cam: CAM_EVENTS_BASE },
              { types: ["EndEvent"], name: "End Event (None)", desc: "Beendet einen Prozesspfad ohne weiteren Effekt. Dicker Einzelkreis, leer. Andere Pfade laufen weiter.", cam: CAM_EVENTS_BASE },
              // --- Intermediate Catch/Throw mit Beispiel-Trigger ---
              { types: ["IntermediateCatchEvent"], name: "Intermediate Catch Event (mit Trigger)", desc: "Wartet auf etwas (Empfang, Timer, Signal-Catch, \u2026). Doppelter d\xFCnner Kreis, Innen-Symbol LEER (= Catch). Hier am Beispiel Message gezeigt.", cam: CAM_EVENT_TYPES.message },
              { types: ["IntermediateThrowEvent"], name: "Intermediate Throw Event (mit Trigger)", desc: "L\xF6st aktiv etwas aus (Nachricht senden, Signal werfen, \u2026). Doppelter d\xFCnner Kreis, Innen-Symbol GEF\xDCLLT (= Throw). Hier am Beispiel Message gezeigt.", cam: CAM_EVENT_TYPES.message },
              // --- Event-SubProcess-Start (Trigger immer erforderlich) ---
              { iconKey: "eventSubProcStartInterrupting", name: "Start Event (Event-SubProcess, unterbrechend)", desc: "Ausl\xF6ser eines Ereignis-SubProcess; unterbricht den Eltern-Prozess. D\xFCnner SOLID-Einzelkreis. Trigger ZWINGEND erforderlich (None ung\xFCltig). Hier: Message als Beispiel.", cam: CAM_EVENT_TYPES.message },
              { iconKey: "eventSubProcStartNonInterrupting", name: "Start Event (Event-SubProcess, nicht unterbrechend)", desc: 'L\xE4uft PARALLEL zum Eltern-Prozess. D\xFCnner GESTRICHELTER Einzelkreis. Trigger ZWINGEND erforderlich. Hier: Timer als Beispiel (z.B. \u201Ealle 24h zus\xE4tzlich tun").', cam: CAM_EVENT_TYPES.timer },
              // --- Boundary-Event (Trigger immer erforderlich) ---
              { iconKey: "boundaryEventInterrupting", types: ["BoundaryEvent"], name: "Boundary Event (unterbrechend)", desc: "An einer Aktivit\xE4t angeheftet, unterbricht sie beim Eintreten. Doppelter SOLID-Kreis, immer Catch. Trigger ZWINGEND erforderlich. Hier: Message als Beispiel.", cam: CAM_EVENT_TYPES.message },
              { iconKey: "boundaryEventNonInterrupting", name: "Boundary Event (nicht unterbrechend)", desc: "An einer Aktivit\xE4t angeheftet, l\xE4uft PARALLEL ohne sie zu unterbrechen. Doppelter GESTRICHELTER Kreis, immer Catch. Trigger ZWINGEND erforderlich. Hier: Timer als Beispiel.", cam: CAM_EVENT_TYPES.timer },
              // --- Spezialfall ---
              { iconKey: "endEventTerminate", name: "Terminate End Event", desc: "Sonderfall: vollfl\xE4chig schwarzer Innen-Kreis. Bricht den GESAMTEN Prozess sofort ab \u2014 alle parallelen Pfade enden. Im Gegensatz zum None-End-Event, das nur den eigenen Pfad beendet.", cam: CAM_EVENT_TYPES.terminate }
            ]
          },
          {
            category: "Event-Innensymbole (Trigger-Typen)",
            color: "#bbf7d0",
            items: [
              { iconKey: "innerSym_message", name: "Message", desc: "Briefumschlag. Catch (links, leer) wartet auf Nachricht; Throw (rechts, gef\xFCllt) sendet Nachricht. Verf\xFCgbar bei Start, Intermediate, Boundary, End.", cam: CAM_EVENT_TYPES.message },
              { iconKey: "innerSym_timer", name: "Timer", desc: "Uhrensymbol. Nur Catch (wartet auf Zeit/Intervall/Datum). Verf\xFCgbar bei Start, Intermediate-Catch, Boundary. KEIN Throw.", cam: CAM_EVENT_TYPES.timer },
              { iconKey: "innerSym_signal", name: "Signal", desc: "Dreieck. Broadcast: jeder kann ein Signal senden, alle Empf\xE4nger reagieren. Catch (leer) wartet, Throw (gef\xFCllt) sendet.", cam: CAM_EVENT_TYPES.signal },
              { iconKey: "innerSym_error", name: "Error", desc: "Blitz/Z-Form. Gesch\xE4ftsfehler-Behandlung. Im End/Intermediate-Throw l\xF6st Fehler aus; im Boundary-Interrupting/SubProcess-Start f\xE4ngt er ihn auf.", cam: CAM_EVENT_TYPES.error },
              { iconKey: "innerSym_cancel", name: "Cancel", desc: "X. Nur in Transaction-SubProcess: bricht Transaktion ab. Auf Boundary (Catch) oder End (Throw).", cam: CAM_EVENT_TYPES.cancel },
              { iconKey: "innerSym_compensation", name: "Compensation", desc: "Doppel-Linksdreieck. Triggert Kompensations-Aktivit\xE4ten. Catch (Boundary) markiert Comp-Handler, Throw (End/Intermediate) l\xF6st aus.", cam: CAM_EVENT_TYPES.compensation },
              { iconKey: "innerSym_conditional", name: "Conditional", desc: "Tabellen-Symbol. Wartet auf Bedingung (z.B. boolescher Ausdruck wird true). Nur Catch \u2014 bei Start, Intermediate, Boundary.", cam: CAM_EVENT_TYPES.conditional },
              { iconKey: "innerSym_escalation", name: "Escalation", desc: "Aufw\xE4rtspfeil. Eskalation an die Eltern-Ebene (im Gegensatz zu Error: nicht-fatale Meldung). Catch im Boundary/SubProcess-Start, Throw im End/Intermediate.", cam: CAM_EVENT_TYPES.escalation },
              { iconKey: "innerSym_link", name: "Link", desc: "Pfeil-Tag. Ersetzt eine SequenceFlow-Linie (zwei Link-Events mit gleichem Namen). Throw an Quelle, Catch am Ziel \u2014 nur Intermediate.", cam: CAM_EVENT_TYPES.link },
              { iconKey: "innerSym_multiple", name: "Multiple", desc: "Pentagon. Mehrere Trigger m\xF6glich \u2014 irgendeiner reicht aus. Catch (Start, Intermediate-Catch, Boundary), Throw (End, Intermediate-Throw \u2014 feuert alle Trigger).", cam: CAM_EVENT_TYPES.multiple },
              { iconKey: "innerSym_parallelMultiple", name: "Parallel Multiple", desc: 'Gro\xDFes \u201E+". Wie Multiple, aber ALLE Trigger m\xFCssen feuern, bevor das Event eintritt. Nur Catch.', cam: CAM_EVENT_TYPES.parallel },
              { iconKey: "innerSym_terminate", name: "Terminate", desc: "Vollfl\xE4chig schwarzer Innen-Kreis. Nur End-Event. Bricht den gesamten Prozess sofort ab (alle parallelen Pfade enden).", cam: CAM_EVENT_TYPES.terminate }
            ]
          },
          {
            category: "Activities (Aktivit\xE4ten)",
            color: "#bfdbfe",
            items: [
              { types: ["Task"], name: "Task (generisch)", symbol: "\u25AD", desc: "Atomare Aktivit\xE4t ohne Spezialisierung. Rechteck mit abgerundeten Ecken. Wird durch Marker zu spezifischen Tasks (User, Service, ...).", cam: camRef("activities-task") },
              { types: ["UserTask"], name: "User Task", symbol: "\u{1F464}", desc: "Manuelle Aktivit\xE4t, die ein Mensch \xFCber Software (z.B. Formular) ausf\xFChrt. Marker: kleiner User-Icon oben links.", cam: camRef("activities-task") },
              { types: ["ServiceTask"], name: "Service Task", symbol: "\u2699", desc: "Automatisierte Aktivit\xE4t, ausgef\xFChrt durch System/Service. Marker: Zahnradsymbol.", cam: camRef("activities-task") },
              { types: ["SendTask"], name: "Send Task", symbol: "\u2709", desc: "Sendet eine Nachricht an einen Empf\xE4nger (anderer Pool). Marker: gef\xFCllter Briefumschlag.", cam: camRef("activities-task") },
              { types: ["ReceiveTask"], name: "Receive Task", symbol: "\u{1F4E8}", desc: "Wartet auf eingehende Nachricht. Marker: leerer Briefumschlag.", cam: camRef("activities-task") },
              { types: ["ManualTask"], name: "Manual Task", symbol: "\u270B", desc: "Manuelle T\xE4tigkeit ohne Systemunterst\xFCtzung. Marker: Hand-Icon.", cam: camRef("activities-task") },
              { types: ["BusinessRuleTask"], name: "Business Rule Task", symbol: "\u{1F4CB}", desc: "Wendet eine Entscheidungstabelle / Regelsatz an. Marker: tabellenartiges Icon.", cam: camRef("activities-task") },
              { types: ["ScriptTask"], name: "Script Task", symbol: "\u{1D4E2}", desc: "F\xFChrt ein Skript in einer Engine aus. Marker: Schriftrolle.", cam: camRef("activities-task") },
              { types: ["SubProcess"], name: "SubProcess (eingebettet)", symbol: "\u25AD+", desc: 'Untergeordneter Prozess innerhalb des Parents. Erweiterte Darstellung zeigt interne Schritte, kollabierte Darstellung als Aktivit\xE4t mit "+"-Marker.', cam: camRef("activities-subprocess") },
              { types: ["Transaction"], name: "Transaction", symbol: "\u25AD\u25AD", desc: "SubProcess mit Transaktions-Semantik (alles-oder-nichts). Doppelte Umrandung.", cam: camRef("activities-subprocess") },
              { types: ["CallActivity"], name: "Call Activity", symbol: "\u25AD", desc: 'Verweis auf einen wiederverwendbaren globalen Prozess oder eine Task-Definition. Dicker Rahmen; ruft sie einen Prozess auf, zeigt sie zugeklappt einen \u201E+"-Marker (Box) unten Mitte.', cam: camRef("activities-call-activity") }
            ]
          },
          {
            category: "Gateways (Verzweigungen)",
            color: "#fed7aa",
            items: [
              { types: ["ExclusiveGateway"], name: "Exclusive Gateway (XOR)", symbol: "\u25C7\u2715", desc: 'Datenbasierte Verzweigung: genau EIN Ausgang wird gew\xE4hlt, basierend auf Bedingungen. Raute mit optionalem "X"-Marker.', cam: camRef("gateways-data-based-exclusive-gateways") },
              { types: ["InclusiveGateway"], name: "Inclusive Gateway (OR)", symbol: "\u25C7\u25CB", desc: "Datenbasiert: ein ODER mehrere Ausg\xE4nge werden gew\xE4hlt. Raute mit Kreis-Marker.", cam: camRef("gateways-data-based-inclusive-gateways") },
              { types: ["ParallelGateway"], name: "Parallel Gateway (AND)", symbol: "\u25C7+", desc: 'Alle ausgehenden Pfade werden gleichzeitig aktiviert. Beim Join: wartet auf alle eingehenden Pfade. Raute mit "+"-Marker.', cam: camRef("gateways-parallel-gateways") },
              { types: ["EventBasedGateway"], name: "Event-Based Gateway", symbol: "\u25C7\u2299", desc: "Verzweigung basiert auf Ereignis-Eintreten (welches Event zuerst eintritt, gewinnt). Raute mit Pentagon-Marker.", cam: camRef("gateways-event-based-gateways") },
              { types: ["ComplexGateway"], name: "Complex Gateway", symbol: "\u25C7*", desc: 'Komplexe Synchronisation mit eigener Aktivierungs-Logik. Selten verwendet. Raute mit "*"-Marker.', cam: LINKS.camunda }
            ]
          },
          {
            category: "Data (Datenobjekte)",
            color: "#e5e7eb",
            items: [
              { types: ["DataObjectReference", "DataObject"], name: "Data Object", symbol: "\u{1F5CE}", desc: "Repr\xE4sentiert Daten, die in/aus einer Aktivit\xE4t flie\xDFen. Eselsohr-Symbol. Hat oft mehrere Referenzen auf dasselbe Datenobjekt.", cam: LINKS.camunda },
              { types: ["DataStoreReference"], name: "Data Store", symbol: "\u{1F5C3}", desc: "Persistenter Datenspeicher (z.B. Datenbank). Zylinder-Symbol. Lebt l\xE4nger als der Prozess.", cam: LINKS.camunda },
              { types: ["DataInput"], name: "Data Input", symbol: "\u21D2\u{1F5CE}", desc: "Input-Daten f\xFCr eine Aktivit\xE4t/Prozess. Eselsohr mit nach-rechts-Pfeil.", cam: LINKS.camunda },
              { types: ["DataOutput"], name: "Data Output", symbol: "\u{1F5CE}\u21D2", desc: "Output-Daten einer Aktivit\xE4t/Prozess. Eselsohr mit nach-links-Pfeil.", cam: LINKS.camunda }
            ]
          },
          {
            category: "Flows (Verbindungen)",
            color: "#fde68a",
            items: [
              { types: ["SequenceFlow"], name: "Sequence Flow", symbol: "\u27F6", desc: "Steuerflusspfeil zwischen Aktivit\xE4ten/Events/Gateways INNERHALB eines Pools. Durchgehender Pfeil mit gef\xFCllter Pfeilspitze.", cam: LINKS.camunda },
              { types: ["MessageFlow"], name: "Message Flow", symbol: "\u2933", desc: "Nachrichtenfluss ZWISCHEN Pools (zwischen Beteiligten). Gestrichelter Pfeil mit Kreis am Anfang, offener Pfeilspitze.", cam: LINKS.camunda },
              { types: ["Association"], name: "Association", symbol: "\u22EF", desc: "Verkn\xFCpft Artefakte/DataObjects mit Flow-Elementen. Gepunktete Linie, optional mit Pfeilspitze (f\xFCr Datenfluss).", cam: LINKS.camunda },
              { name: "Default Flow", iconKey: "defaultFlow", symbol: "\u27F6\u27CD", desc: "Standard-Sequenz-Flow bei XOR/OR-Gateway, wenn keine Bedingung zutrifft. Schr\xE4gstrich-Markierung am Anfang.", cam: LINKS.camunda },
              { name: "Conditional Flow", iconKey: "conditionalFlow", symbol: "\u27F6\u25C7", desc: "Sequenz-Flow mit Bedingung (Mini-Raute am Anfang). Nur ohne Gateway sinnvoll.", cam: LINKS.camunda }
            ]
          },
          {
            category: "Swimlanes (Verantwortlichkeiten)",
            color: "#fbcfe8",
            items: [
              { types: ["Participant"], name: "Pool (Participant)", symbol: "\u25AD", desc: "Repr\xE4sentiert einen Beteiligten/Organisation. Beinhaltet einen Prozess. Kommunikation zwischen Pools nur via Message Flow.", cam: camRef("participants-pool") },
              { types: ["Lane"], name: "Lane", symbol: "\u25A4", desc: "Unterteilung innerhalb eines Pools (Rolle, Abteilung, System). Sequence Flows d\xFCrfen Lanes innerhalb des Pools queren.", cam: camRef("participants-lane") }
            ]
          },
          {
            category: "Artifacts (Anmerkungen)",
            color: "#f3f4f6",
            items: [
              { types: ["Group"], name: "Group", symbol: "\u25AD", desc: "Visuelle Gruppierung zusammengeh\xF6riger Elemente. Gestrichelter Rahmen mit Strichpunkt-Linie. Hat KEINE Auswirkung auf den Flow.", cam: LINKS.camunda },
              { types: ["TextAnnotation"], name: "Text Annotation", symbol: "[", desc: "Freitext-Kommentar im Diagramm. Eckige Klammer + Text. Wird per Association an Elemente geh\xE4ngt.", cam: LINKS.camunda }
            ]
          }
        ];
        const C = "#1f2937";
        const DASH = "2.5 1.8";
        function evtRingSingle(dashed) {
          return `<circle cx="18" cy="18" r="14" fill="#fff" stroke="${C}" stroke-width="1.2"${dashed ? ` stroke-dasharray="${DASH}"` : ""}/>`;
        }
        function evtRingDouble(dashed) {
          return evtRingSingle(dashed) + `<circle cx="18" cy="18" r="10.5" fill="none" stroke="${C}" stroke-width="1.2"${dashed ? ` stroke-dasharray="${DASH}"` : ""}/>`;
        }
        function evtRingThick() {
          return `<circle cx="18" cy="18" r="14" fill="#fff" stroke="${C}" stroke-width="3"/>`;
        }
        function eventIcon(outerSvg, innerSvg) {
          return `<svg viewBox="0 0 36 36" width="34" height="34" xmlns="http://www.w3.org/2000/svg">${outerSvg}${innerSvg || ""}</svg>`;
        }
        function innerMessage(filled) {
          const fill = filled ? C : "#fff";
          const flap = filled ? "#fff" : C;
          return `<g transform="translate(12 14)"><rect x="0" y="0" width="12" height="8" fill="${fill}" stroke="${C}" stroke-width="0.9"/><path d="M0 0 L6 5 L12 0" fill="none" stroke="${flap}" stroke-width="0.9"/></g>`;
        }
        function innerTimer() {
          return `<g stroke="${C}" fill="none" stroke-linecap="round"><circle cx="18" cy="18" r="6.5" stroke-width="0.9"/><line x1="18" y1="12.5" x2="18" y2="14" stroke-width="0.8"/><line x1="23.5" y1="18" x2="22" y2="18" stroke-width="0.8"/><line x1="18" y1="23.5" x2="18" y2="22" stroke-width="0.8"/><line x1="12.5" y1="18" x2="14" y2="18" stroke-width="0.8"/><line x1="18" y1="18" x2="18" y2="14.5" stroke-width="1.1"/><line x1="18" y1="18" x2="21" y2="19.5" stroke-width="1.1"/></g>`;
        }
        function innerSignal(filled) {
          const fill = filled ? C : "#fff";
          return `<polygon points="18,10 26,24 10,24" fill="${fill}" stroke="${C}" stroke-width="1"/>`;
        }
        function innerError(filled) {
          const fill = filled ? C : "#fff";
          return `<path d="M13 10 L20 17 L16 18 L22 26 L15 19 L19 18 Z" fill="${fill}" stroke="${C}" stroke-width="1" stroke-linejoin="round"/>`;
        }
        function innerCancel() {
          return `<g stroke="${C}" stroke-width="2.4" stroke-linecap="round"><line x1="12" y1="12" x2="24" y2="24"/><line x1="24" y1="12" x2="12" y2="24"/></g>`;
        }
        function innerCompensation(filled) {
          const fill = filled ? C : "#fff";
          return `<g><polygon points="18,12 12,18 18,24" fill="${fill}" stroke="${C}" stroke-width="0.9"/><polygon points="25,12 19,18 25,24" fill="${fill}" stroke="${C}" stroke-width="0.9"/></g>`;
        }
        function innerConditional() {
          return `<g transform="translate(11 10)" stroke="${C}" stroke-width="0.8" fill="#fff"><rect x="0" y="0" width="14" height="16"/><line x1="2" y1="4" x2="12" y2="4" stroke-width="0.7"/><line x1="2" y1="7.5" x2="12" y2="7.5" stroke-width="0.7"/><line x1="2" y1="11" x2="12" y2="11" stroke-width="0.7"/><line x1="2" y1="14" x2="12" y2="14" stroke-width="0.7"/></g>`;
        }
        function innerEscalation(filled) {
          const fill = filled ? C : "#fff";
          return `<polygon points="18,10 24,24 18,19 12,24" fill="${fill}" stroke="${C}" stroke-width="1" stroke-linejoin="round"/>`;
        }
        function innerLink(filled) {
          const fill = filled ? C : "#fff";
          return `<polygon points="10,15 21,15 21,12 27,18 21,24 21,21 10,21" fill="${fill}" stroke="${C}" stroke-width="1" stroke-linejoin="round"/>`;
        }
        function innerMultiple(filled) {
          const fill = filled ? C : "#fff";
          return `<polygon points="18,10 26,16 23,25 13,25 10,16" fill="${fill}" stroke="${C}" stroke-width="1" stroke-linejoin="round"/>`;
        }
        function innerParallelMultiple() {
          return `<g stroke="${C}" stroke-width="2.4" stroke-linecap="round"><line x1="18" y1="10" x2="18" y2="26"/><line x1="10" y1="18" x2="26" y2="18"/></g>`;
        }
        function innerTerminate() {
          return `<circle cx="18" cy="18" r="6.5" fill="${C}"/>`;
        }
        function pairCatchThrow(innerFnLeftCatch, innerFnRightThrow) {
          const left = eventIcon(evtRingDouble(false), innerFnLeftCatch);
          const right = eventIcon(evtRingDouble(false), innerFnRightThrow);
          return `<div class="qs-notation-pair">${left}${right}</div>`;
        }
        function singleInDouble(innerFn) {
          return eventIcon(evtRingDouble(false), innerFn);
        }
        function svgGateway(innerMarker) {
          return `<svg viewBox="0 0 36 36" width="34" height="34" xmlns="http://www.w3.org/2000/svg"><polygon points="18,2 34,18 18,34 2,18" fill="#fff" stroke="${C}" stroke-width="1.5"/>` + (innerMarker || "") + `</svg>`;
        }
        function svgTask(strokeWidth, innerMarker, extraOuterRect) {
          return `<svg viewBox="0 0 52 30" width="50" height="30" xmlns="http://www.w3.org/2000/svg">` + (extraOuterRect || "") + `<rect x="2" y="2" width="48" height="26" rx="5" ry="5" fill="#fff" stroke="${C}" stroke-width="${strokeWidth}"/>` + (innerMarker || "") + `</svg>`;
        }
        const BPMN_ICONS = {
          // --- Events: Outer-Form. None-Varianten leer (kein Trigger). Boundary
          //     und Event-SubProcess-Start: spec-bedingt MUSS ein Trigger drin sein,
          //     daher Beispiel-Inner als Hinweis (Message bzw. Timer).
          startEvent: eventIcon(evtRingSingle(false)),
          // None Start
          intermediateNone: eventIcon(evtRingDouble(false)),
          // None Intermediate
          intermediateCatchEvent: eventIcon(evtRingDouble(false), innerMessage(false)),
          // Catch mit Message-Beispiel
          intermediateThrowEvent: eventIcon(evtRingDouble(false), innerMessage(true)),
          // Throw mit Message-Beispiel
          eventSubProcStartInterrupting: eventIcon(evtRingSingle(false), innerMessage(false)),
          // Trigger erforderlich
          eventSubProcStartNonInterrupting: eventIcon(evtRingSingle(true), innerTimer()),
          // dashed + Trigger erforderlich
          boundaryEventInterrupting: eventIcon(evtRingDouble(false), innerMessage(false)),
          // Trigger erforderlich
          boundaryEventNonInterrupting: eventIcon(evtRingDouble(true), innerTimer()),
          // dashed + Trigger erforderlich
          endEvent: eventIcon(evtRingThick()),
          // None End
          endEventTerminate: eventIcon(evtRingThick(), innerTerminate()),
          // Terminate-Sonderfall
          // Aliases fuer Default-Lookup ueber types[0]
          boundaryEvent: eventIcon(evtRingDouble(false), innerMessage(false)),
          // --- Inner Event Symbols (Throw/Catch-Paare im Doppelkreis als Demo-Form) ---
          innerSym_message: pairCatchThrow(innerMessage(false), innerMessage(true)),
          innerSym_timer: singleInDouble(innerTimer),
          innerSym_signal: pairCatchThrow(innerSignal(false), innerSignal(true)),
          innerSym_error: pairCatchThrow(innerError(false), innerError(true)),
          innerSym_cancel: singleInDouble(innerCancel),
          innerSym_compensation: pairCatchThrow(innerCompensation(false), innerCompensation(true)),
          innerSym_conditional: singleInDouble(innerConditional),
          innerSym_escalation: pairCatchThrow(innerEscalation(false), innerEscalation(true)),
          innerSym_link: pairCatchThrow(innerLink(false), innerLink(true)),
          innerSym_multiple: pairCatchThrow(innerMultiple(false), innerMultiple(true)),
          innerSym_parallelMultiple: singleInDouble(innerParallelMultiple),
          // Terminate gibt es spec-bedingt NUR als End-Event → dicker Ring + gefuellt.
          innerSym_terminate: eventIcon(evtRingThick(), innerTerminate()),
          // --- Gateways (Innen-Marker innerhalb der Raute) ---
          exclusiveGateway: svgGateway(`<path d="M12 12 L24 24 M24 12 L12 24" stroke="${C}" stroke-width="2.5" stroke-linecap="round"/>`),
          inclusiveGateway: svgGateway(`<circle cx="18" cy="18" r="6.5" fill="none" stroke="${C}" stroke-width="2.5"/>`),
          parallelGateway: svgGateway(`<path d="M18 8 V28 M8 18 H28" stroke="${C}" stroke-width="2.5" stroke-linecap="round"/>`),
          eventBasedGateway: svgGateway(`<circle cx="18" cy="18" r="8.5" fill="none" stroke="${C}" stroke-width="1.2"/><polygon points="18,11 24,15.5 21.7,23 14.3,23 12,15.5" fill="none" stroke="${C}" stroke-width="1.3"/>`),
          complexGateway: svgGateway(`<path d="M18 8 V28 M8 18 H28 M11 11 L25 25 M25 11 L11 25" stroke="${C}" stroke-width="1.6" stroke-linecap="round"/>`),
          // --- Activities ---
          task: svgTask("1.5"),
          userTask: svgTask("1.5", `<circle cx="9" cy="8" r="2.3" fill="none" stroke="${C}" stroke-width="1"/><path d="M5 14 Q9 11 13 14" fill="none" stroke="${C}" stroke-width="1"/>`),
          serviceTask: svgTask("1.5", `<g transform="translate(5 5)" stroke="${C}" stroke-width="0.8" fill="none"><circle cx="5" cy="5" r="2.6"/><circle cx="5" cy="5" r="1" fill="${C}" stroke="none"/><path d="M5 1 V2.5 M5 7.5 V9 M1 5 H2.5 M7.5 5 H9 M2.2 2.2 L3.2 3.2 M6.8 6.8 L7.8 7.8 M7.8 2.2 L6.8 3.2 M3.2 6.8 L2.2 7.8"/></g>`),
          sendTask: svgTask("1.5", `<g transform="translate(4 4)"><rect x="0" y="0" width="11" height="7" fill="${C}"/><path d="M0 0 L5.5 4 L11 0" stroke="#fff" stroke-width="0.8" fill="none"/></g>`),
          receiveTask: svgTask("1.5", `<g transform="translate(4 4)"><rect x="0" y="0" width="11" height="7" fill="#fff" stroke="${C}" stroke-width="1"/><path d="M0 0 L5.5 4 L11 0" stroke="${C}" stroke-width="0.8" fill="none"/></g>`),
          manualTask: svgTask("1.5", `<path d="M5 9 L8 9 Q9.5 9 9.5 7.5 L9.5 6.5 Q9.5 5.5 10.5 5.5 L11.5 5.5 Q12.5 5.5 12.5 6.5 L12.5 10 Q12.5 11 11.5 11 L5 11 Q4 11 4 10 Q4 9 5 9 Z" fill="none" stroke="${C}" stroke-width="0.8"/>`),
          businessRuleTask: svgTask("1.5", `<g transform="translate(4 4)" stroke="${C}" stroke-width="0.7" fill="none"><rect x="0" y="0" width="13" height="9"/><line x1="0" y1="3" x2="13" y2="3"/><line x1="0" y1="6" x2="13" y2="6"/><line x1="4" y1="0" x2="4" y2="9"/></g>`),
          scriptTask: svgTask("1.5", `<g transform="translate(4 4)" stroke="${C}" stroke-width="0.8" fill="none"><path d="M0 1 Q3 -1 6 1 Q9 3 12 1 L12 8 Q9 10 6 8 Q3 6 0 8 Z"/><line x1="2" y1="3" x2="8" y2="3"/><line x1="2" y1="5" x2="8" y2="5"/></g>`),
          subProcess: svgTask("1.5", `<g transform="translate(22 20)" stroke="${C}" stroke-width="1" fill="none"><rect x="0" y="0" width="8" height="6"/><path d="M4 1 V5 M1 3 H7"/></g>`),
          transaction: svgTask("1.5", null, `<rect x="0.5" y="0.5" width="51" height="29" rx="7" ry="7" fill="none" stroke="${C}" stroke-width="0.8"/>`),
          // Call Activity: dicker Rahmen + zugeklappt-Marker (Box mit „+") unten Mitte —
          // wie bpmn.io eine Call Activity darstellt, die einen wiederverwendbaren
          // Prozess aufruft (collapsed). Marker zentriert am unteren Rand (viewBox 52×30).
          callActivity: svgTask("3", `<g transform="translate(22 20)" stroke="${C}" stroke-width="1" fill="none"><rect x="0" y="0" width="8" height="6"/><path d="M4 1 V5 M1 3 H7"/></g>`),
          // --- Data ---
          dataObjectReference: `<svg viewBox="0 0 28 36" width="22" height="30" xmlns="http://www.w3.org/2000/svg"><path d="M2 2 L20 2 L26 8 L26 34 L2 34 Z" fill="#fff" stroke="${C}" stroke-width="1.5"/><path d="M20 2 L20 8 L26 8" fill="none" stroke="${C}" stroke-width="1.2"/></svg>`,
          dataStoreReference: `<svg viewBox="0 0 36 30" width="32" height="28" xmlns="http://www.w3.org/2000/svg"><path d="M4 4 L4 26 A14 3 0 0 0 32 26 L32 4" fill="#fff" stroke="${C}" stroke-width="1.2"/><ellipse cx="18" cy="4" rx="14" ry="3" fill="#fff" stroke="${C}" stroke-width="1.2"/><ellipse cx="18" cy="9" rx="14" ry="3" fill="none" stroke="${C}" stroke-width="0.8"/></svg>`,
          dataInput: `<svg viewBox="0 0 28 36" width="22" height="30" xmlns="http://www.w3.org/2000/svg"><path d="M2 2 L20 2 L26 8 L26 34 L2 34 Z" fill="#fff" stroke="${C}" stroke-width="1.5"/><path d="M20 2 L20 8 L26 8" fill="none" stroke="${C}" stroke-width="1.2"/><path d="M7 12 L7 16 L14 16 L14 14 L18 17 L14 20 L14 18 L5 18 L5 12 Z" fill="none" stroke="${C}" stroke-width="0.9"/></svg>`,
          dataOutput: `<svg viewBox="0 0 28 36" width="22" height="30" xmlns="http://www.w3.org/2000/svg"><path d="M2 2 L20 2 L26 8 L26 34 L2 34 Z" fill="#fff" stroke="${C}" stroke-width="1.5"/><path d="M20 2 L20 8 L26 8" fill="none" stroke="${C}" stroke-width="1.2"/><path d="M7 12 L7 16 L14 16 L14 14 L18 17 L14 20 L14 18 L5 18 L5 12 Z" fill="${C}" stroke="${C}" stroke-width="0.9"/></svg>`,
          // --- Swimlanes ---
          participant: `<svg viewBox="0 0 64 24" width="62" height="24" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="1" width="62" height="22" fill="#fff" stroke="${C}" stroke-width="1.5"/><rect x="1" y="1" width="14" height="22" fill="#f3f4f6" stroke="${C}" stroke-width="1.5"/></svg>`,
          lane: `<svg viewBox="0 0 64 18" width="62" height="18" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="1" width="62" height="16" fill="#fff" stroke="${C}" stroke-width="1"/><rect x="1" y="1" width="12" height="16" fill="#f3f4f6" stroke="${C}" stroke-width="1"/></svg>`,
          // --- Artifacts ---
          group: `<svg viewBox="0 0 52 30" width="50" height="30" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="48" height="26" rx="3" ry="3" fill="none" stroke="${C}" stroke-width="1.5" stroke-dasharray="5 3 1 3"/></svg>`,
          textAnnotation: `<svg viewBox="0 0 40 28" width="36" height="26" xmlns="http://www.w3.org/2000/svg"><path d="M8 2 L2 2 L2 26 L8 26" fill="none" stroke="${C}" stroke-width="1.5"/><line x1="12" y1="9" x2="38" y2="9" stroke="${C}" stroke-width="0.8"/><line x1="12" y1="15" x2="38" y2="15" stroke="${C}" stroke-width="0.8"/><line x1="12" y1="21" x2="32" y2="21" stroke="${C}" stroke-width="0.8"/></svg>`,
          // --- Flows ---
          sequenceFlow: `<svg viewBox="0 0 52 14" width="50" height="14" xmlns="http://www.w3.org/2000/svg"><line x1="2" y1="7" x2="42" y2="7" stroke="${C}" stroke-width="1.5"/><polygon points="42,2 42,12 50,7" fill="${C}"/></svg>`,
          messageFlow: `<svg viewBox="0 0 52 14" width="50" height="14" xmlns="http://www.w3.org/2000/svg"><circle cx="3" cy="7" r="2" fill="#fff" stroke="${C}" stroke-width="1"/><line x1="5" y1="7" x2="42" y2="7" stroke="${C}" stroke-width="1" stroke-dasharray="4 2"/><polygon points="42,3 42,11 50,7" fill="#fff" stroke="${C}" stroke-width="1"/></svg>`,
          association: `<svg viewBox="0 0 52 14" width="50" height="14" xmlns="http://www.w3.org/2000/svg"><line x1="2" y1="7" x2="50" y2="7" stroke="${C}" stroke-width="1" stroke-dasharray="1 3"/></svg>`,
          defaultFlow: `<svg viewBox="0 0 52 14" width="50" height="14" xmlns="http://www.w3.org/2000/svg"><line x1="2" y1="7" x2="42" y2="7" stroke="${C}" stroke-width="1.5"/><polygon points="42,2 42,12 50,7" fill="${C}"/><line x1="6" y1="3" x2="11" y2="11" stroke="${C}" stroke-width="1.2"/></svg>`,
          conditionalFlow: `<svg viewBox="0 0 60 14" width="58" height="14" xmlns="http://www.w3.org/2000/svg"><polygon points="2,7 8,3 14,7 8,11" fill="#fff" stroke="${C}" stroke-width="1"/><line x1="14" y1="7" x2="50" y2="7" stroke="${C}" stroke-width="1.5"/><polygon points="50,2 50,12 58,7" fill="${C}"/></svg>`
        };
        function getIcon(item) {
          if (!item) return "";
          if (item.iconKey && BPMN_ICONS[item.iconKey]) return BPMN_ICONS[item.iconKey];
          if (item.types && item.types[0]) {
            const k = item.types[0].replace(/^bpmn:/i, "");
            if (BPMN_ICONS[k]) return BPMN_ICONS[k];
            const k2 = k.charAt(0).toLowerCase() + k.slice(1);
            if (BPMN_ICONS[k2]) return BPMN_ICONS[k2];
          }
          return "";
        }
        const TYPE_TO_ITEM = (() => {
          const m = {};
          for (const cat of CATALOG) {
            for (const it of cat.items) {
              if (!it.types) continue;
              for (const t of it.types) m[t.toLowerCase()] = it;
            }
          }
          return m;
        })();
        function findItemForBpmnType(bpmnType) {
          if (!bpmnType) return null;
          const t = String(bpmnType).replace(/^bpmn:/i, "").toLowerCase();
          if (TYPE_TO_ITEM[t]) return TYPE_TO_ITEM[t];
          for (const k of Object.keys(TYPE_TO_ITEM)) {
            if (t.indexOf(k) !== -1 || k.indexOf(t) !== -1) return TYPE_TO_ITEM[k];
          }
          return null;
        }
        function findItemByIconKey(key) {
          for (const cat of CATALOG) {
            for (const it of cat.items) {
              if (it.iconKey === key) return it;
            }
          }
          return null;
        }
        function itemKeyOf(it) {
          if (!it) return null;
          return it.iconKey || it.types && it.types[0] || null;
        }
        function findItemForBpmnElement(element) {
          if (!element || !element.type) return null;
          const t = String(element.type).replace(/^bpmn:/i, "").toLowerCase();
          const bo = element.businessObject || {};
          if (t === "sequenceflow") {
            const src = element.source;
            const srcBo = src && src.businessObject;
            if (srcBo && srcBo.default && srcBo.default.id === bo.id) {
              return findItemByIconKey("defaultFlow");
            }
            if (bo.conditionExpression) {
              return findItemByIconKey("conditionalFlow");
            }
            return findItemForBpmnType(element.type);
          }
          const eventDefs = Array.isArray(bo.eventDefinitions) ? bo.eventDefinitions : [];
          if (eventDefs.length === 0) {
            if (t === "intermediatecatchevent" || t === "intermediatethrowevent") {
              return findItemByIconKey("intermediateNone");
            }
          }
          if (eventDefs.length > 0) {
            const def0 = eventDefs[0];
            const defType = String(def0 && def0.$type || "").replace(/^bpmn:/i, "").toLowerCase();
            if (defType === "terminateeventdefinition" && t === "endevent") {
              return findItemByIconKey("endEventTerminate");
            }
            if (eventDefs.length > 1) {
              const multi = findItemByIconKey("innerSym_multiple");
              if (multi) return multi;
            }
            const EVDEF_TO_INNER = {
              messageeventdefinition: "innerSym_message",
              timereventdefinition: "innerSym_timer",
              signaleventdefinition: "innerSym_signal",
              erroreventdefinition: "innerSym_error",
              escalationeventdefinition: "innerSym_escalation",
              conditionaleventdefinition: "innerSym_conditional",
              linkeventdefinition: "innerSym_link",
              compensateeventdefinition: "innerSym_compensation",
              canceleventdefinition: "innerSym_cancel",
              terminateeventdefinition: "innerSym_terminate"
            };
            const innerKey = EVDEF_TO_INNER[defType];
            if (innerKey) {
              const it = findItemByIconKey(innerKey);
              if (it) return it;
            }
          }
          return findItemForBpmnType(element.type);
        }
        function esc(s) {
          return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
        }
        function ensureStyle() {
          if (document.getElementById(STYLE_ID)) return;
          const s = document.createElement("style");
          s.id = STYLE_ID;
          s.textContent = `
            .qs-notation-panel { width: 720px; height: 600px; }
            .qs-notation-panel.qs-fullscreen {
                width: 95vw !important; height: 95vh !important;
                left: 2.5vw !important; top: 2.5vh !important;
            }
            .qs-notation-body {
                height: 100%; overflow: auto;
                background: var(--qs-panel,#1a1d22);
                color: var(--qs-text,#e6e8eb);
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                font-size: 12px;
                line-height: 1.5;
            }
            .qs-notation-toplinks {
                padding: 10px 12px;
                background: var(--qs-panel-3,#0f172a);
                border-bottom: 1px solid var(--qs-border-soft,#1e293b);
                display: flex; gap: 12px; flex-wrap: wrap;
                font-size: 11px;
            }
            .qs-notation-toplinks a { color: var(--qs-blue-soft,#60a5fa); text-decoration: none; }
            .qs-notation-toplinks a:hover { text-decoration: underline; }
            .qs-notation-cat {
                margin: 12px 8px;
                border-radius: 6px;
                background: var(--qs-panel-3,#111418);
            }
            .qs-notation-cat-head {
                padding: 8px 12px;
                font-weight: 700;
                color: var(--qs-amber,#fbbf24);
                border-bottom: 1px solid var(--qs-border-soft,#1f2937);
                display: flex; align-items: center; gap: 8px;
            }
            .qs-notation-cat-swatch {
                display: inline-block; width: 14px; height: 14px; border-radius: 3px;
                border: 1px solid rgba(255,255,255,0.2);
            }
            .qs-notation-item {
                padding: 8px 12px;
                border-bottom: 1px solid var(--qs-border-soft,#1f2937);
                display: grid;
                grid-template-columns: 90px 1fr auto;
                gap: 10px;
                align-items: center;
            }
            /* Inner-Symbol-Paar: zwei kleine Event-Icons Catch+Throw nebeneinander */
            .qs-notation-pair {
                display: flex; gap: 4px;
                align-items: center; justify-content: center;
            }
            .qs-notation-item:last-child { border-bottom: none; }
            .qs-notation-item:hover { background: rgba(96,165,250,0.05); }
            .qs-notation-symbol {
                font-size: 20px;
                line-height: 1;
                color: var(--qs-amber,#fbbf24);
                text-align: center;
                user-select: none;
                display: flex; align-items: center; justify-content: center;
                min-height: 36px;
                /* SVG-Icons haben weisse Innenflaeche \u2014 wir setzen einen sehr
                   dezenten Hintergrund, damit sie nicht im dunklen Body schweben.
                   Ausgewaehlte Eintraege ueberschreiben das. */
                background: #f8fafc;
                border-radius: 4px;
                padding: 4px;
            }
            .qs-notation-symbol svg { display: block; }
            .qs-notation-info > .name {
                color: var(--qs-blue-soft,#93c5fd);
                font-weight: 600;
                margin-bottom: 2px;
            }
            .qs-notation-info > .desc {
                color: var(--qs-text-dim,#cbd5e1);
                font-size: 11.5px;
            }
            .qs-notation-links {
                display: flex; gap: 6px; align-items: center;
                font-size: 10.5px;
            }
            .qs-notation-links a {
                color: var(--qs-text-mute,#94a3b8);
                text-decoration: none;
                padding: 2px 6px;
                border: 1px solid var(--qs-border,#334155);
                border-radius: 4px;
                white-space: nowrap;
            }
            .qs-notation-links a:hover { color: var(--qs-text,#fff); border-color: var(--qs-blue-soft,#60a5fa); }
            /* Aktiv-Markierung (Selection-Sync wie XML-Vollansicht) */
            .qs-notation-item.qs-selected {
                background: var(--qs-xml-sel,rgba(30, 58, 138, 0.30)) !important;
                box-shadow: inset 3px 0 0 #3b82f6;
            }
        `;
          document.head.appendChild(s);
        }
        function renderCatalog() {
          const out = [];
          out.push('<div class="qs-notation-toplinks">');
          out.push('<strong style="color:var(--qs-text-dim,#cbd5e1);">\u{1F4D6} Mehr Info:</strong>');
          out.push(`<a href="${esc(LINKS.omg)}" target="_blank" rel="noopener">OMG BPMN-Spec</a>`);
          out.push(`<a href="${esc(LINKS.poster)}" target="_blank" rel="noopener">BPMN-Poster (DE)</a>`);
          out.push(`<a href="${esc(LINKS.camunda)}" target="_blank" rel="noopener">Camunda Symbol Reference</a>`);
          out.push("</div>");
          for (const cat of CATALOG) {
            out.push(`<div class="qs-notation-cat">`);
            out.push(`<div class="qs-notation-cat-head"><span class="qs-notation-cat-swatch" style="background:${esc(cat.color)};"></span>${esc(cat.category)}</div>`);
            for (const it of cat.items) {
              const dataType = it.types && it.types[0] ? ` data-bpmn-type="${esc(it.types[0])}"` : "";
              const itemKey = it.iconKey || it.types && it.types[0] || "item-" + (it.name || "").replace(/\s+/g, "-").toLowerCase();
              const dataKey = ` data-item-key="${esc(itemKey)}"`;
              out.push(`<div class="qs-notation-item"${dataKey}${dataType}>`);
              const iconHtml = getIcon(it);
              out.push(`<div class="qs-notation-symbol">${iconHtml || esc(it.symbol || "\xB7")}</div>`);
              out.push('<div class="qs-notation-info">');
              out.push(`<div class="name">${esc(it.name)}</div>`);
              out.push(`<div class="desc">${esc(it.desc)}</div>`);
              out.push("</div>");
              out.push('<div class="qs-notation-links">');
              if (it.cam) out.push(`<a href="${esc(it.cam)}" target="_blank" rel="noopener" title="Camunda BPMN Symbol Reference">Cam</a>`);
              out.push("</div>");
              out.push("</div>");
            }
            out.push("</div>");
          }
          return out.join("");
        }
        function attachBpmnNotation(viewer) {
          if (!viewer) return null;
          if (viewer.__qsBpmnNotation) return viewer.__qsBpmnNotation;
          ensureStyle();
          try {
            if (window.qsCommentMedia && window.qsCommentMedia.ensureStyles) window.qsCommentMedia.ensureStyles();
          } catch (e) {
          }
          let panel = null;
          let onCloseCb = null;
          let onStateChangeCb = null;
          let stateChangeTimer = null;
          let suppressStateEcho = false;
          let selectionListenerInstalled = false;
          let lastSelectedItem = null;
          function notifyStateChange() {
            if (suppressStateEcho || !onStateChangeCb) return;
            clearTimeout(stateChangeTimer);
            stateChangeTimer = setTimeout(() => {
              try {
                onStateChangeCb(getState());
              } catch (e) {
              }
            }, 200);
          }
          function getState() {
            return {
              fullscreen: !!(panel && panel.classList.contains("qs-fullscreen"))
            };
          }
          function setState(s, opts) {
            if (!s || !panel) return;
            const silent = opts && opts.silent;
            if (silent) suppressStateEcho = true;
            try {
              if (typeof s.fullscreen === "boolean") panel.classList.toggle("qs-fullscreen", s.fullscreen);
            } finally {
              if (silent) suppressStateEcho = false;
            }
          }
          function clearItemHighlight() {
            if (lastSelectedItem) {
              lastSelectedItem.classList.remove("qs-selected");
              lastSelectedItem = null;
            }
          }
          function highlightByItem(item, scroll) {
            if (!panel) return;
            const body = panel.querySelector(".qs-notation-body");
            if (!body) return;
            clearItemHighlight();
            const key = itemKeyOf(item);
            if (!key) return;
            const sel = '[data-item-key="' + (window.CSS && CSS.escape ? CSS.escape(key) : key) + '"]';
            const el = body.querySelector(sel);
            if (!el) return;
            el.classList.add("qs-selected");
            lastSelectedItem = el;
            if (scroll) {
              try {
                el.scrollIntoView({ block: "center", behavior: "smooth" });
              } catch (e) {
                try {
                  el.scrollIntoView();
                } catch (_e) {
                }
              }
            }
          }
          function installSelectionListener() {
            if (selectionListenerInstalled) return;
            try {
              const eb = viewer.get("eventBus", false);
              if (!eb) return;
              eb.on("selection.changed", (event) => {
                if (!panel) return;
                const sel = event && event.newSelection || [];
                if (sel.length === 0) {
                  clearItemHighlight();
                  return;
                }
                const item = findItemForBpmnElement(sel[0]);
                if (item) highlightByItem(item, true);
              });
              selectionListenerInstalled = true;
            } catch (e) {
            }
          }
          function buildPanel() {
            const div = document.createElement("div");
            div.className = "qs-cm-popup qs-cm-popup-pinned qs-notation-panel";
            div.innerHTML = `<div class="qs-cm-popup-header"><span style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:#93c5fd;"><span data-icon="book-open"></span>BPMN-Notation</span><div class="qs-cm-popup-actions"><button class="qs-cm-popup-btn" data-act="fullscreen" title="Vollbild ein/aus">\u26F6</button><button class="qs-cm-popup-btn" data-act="close" title="Schlie\xDFen">\u2715</button></div></div><div class="qs-cm-popup-body-wrap"><div class="qs-notation-body">${renderCatalog()}</div></div>`;
            document.body.appendChild(div);
            div.style.left = "40px";
            div.style.top = "320px";
            try {
              window.qsCommentMedia && window.qsCommentMedia.bringToFront && window.qsCommentMedia.bringToFront(div);
            } catch (e) {
            }
            div.addEventListener("mousedown", () => {
              try {
                window.qsCommentMedia && window.qsCommentMedia.bringToFront && window.qsCommentMedia.bringToFront(div);
              } catch (e) {
              }
            }, true);
            const header = div.querySelector(".qs-cm-popup-header");
            let dragOff = null;
            header.addEventListener("mousedown", (e) => {
              if (e.target.closest("button")) return;
              const r = div.getBoundingClientRect();
              dragOff = { x: e.clientX - r.left, y: e.clientY - r.top };
              div.style.left = r.left + "px";
              div.style.top = r.top + "px";
              e.preventDefault();
            });
            function onMove(e) {
              if (!dragOff) return;
              div.style.left = e.clientX - dragOff.x + "px";
              div.style.top = e.clientY - dragOff.y + "px";
            }
            function onUp() {
              dragOff = null;
            }
            document.addEventListener("mousemove", onMove);
            document.addEventListener("mouseup", onUp);
            div.querySelector('[data-act="fullscreen"]').addEventListener("click", (e) => {
              e.stopPropagation();
              div.classList.toggle("qs-fullscreen");
              notifyStateChange();
            });
            div.querySelector('[data-act="close"]').addEventListener("click", closePanel);
            div.tabIndex = -1;
            div.addEventListener("keydown", (e) => {
              if (e.key === "Escape") closePanel();
            });
            function destroy() {
              document.removeEventListener("mousemove", onMove);
              document.removeEventListener("mouseup", onUp);
              div.remove();
              panel = null;
            }
            div.__qsDestroy = destroy;
            return div;
          }
          function openPanel() {
            if (panel) {
              try {
                window.qsCommentMedia && window.qsCommentMedia.bringToFront && window.qsCommentMedia.bringToFront(panel);
              } catch (e) {
              }
              return;
            }
            panel = buildPanel();
            installSelectionListener();
            try {
              const sel = viewer.get("selection", false);
              if (sel) {
                const cur = sel.get();
                if (cur && cur.length) {
                  const item = findItemForBpmnElement(cur[0]);
                  if (item) highlightByItem(item, true);
                }
              }
            } catch (e) {
            }
          }
          function closePanel() {
            if (panel && panel.__qsDestroy) panel.__qsDestroy();
            panel = null;
            try {
              if (typeof onCloseCb === "function") onCloseCb();
            } catch (e) {
            }
          }
          function refresh() {
          }
          function isPanelOpen() {
            return !!panel;
          }
          function setOnClose(fn) {
            onCloseCb = typeof fn === "function" ? fn : null;
          }
          function setOnStateChange(cb) {
            onStateChangeCb = typeof cb === "function" ? cb : null;
          }
          const api = { openPanel, closePanel, refresh, isPanelOpen, setOnClose, getState, setState, setOnStateChange };
          viewer.__qsBpmnNotation = api;
          return api;
        }
        window.attachBpmnNotation = attachBpmnNotation;
      })();
    }
  });

  // lib/qs-cm-analyse-wrap.js
  var require_qs_cm_analyse_wrap = __commonJS({
    "lib/qs-cm-analyse-wrap.js"() {
      (function() {
        "use strict";
        const STYLE_ID = "qs-cm-analyse-style";
        const SECTIONS = [
          {
            id: "inspect",
            label: "Inspektoren",
            grp: "inspect",
            col: 1,
            pills: [
              "qs-cm-pill-trail",
              // Pfadspur an/aus (Nutzer-Wunsch 2026-08-18: ins Menü wie team-modeling)
              "qs-cm-pill-watch",
              // FEEL-Viewer (ehem. SIM-Watch)
              "qs-cm-pill-dmn-viewer"
              // DMN-Viewer
            ]
          },
          {
            id: "sim",
            label: "Simulation",
            grp: "inspect",
            col: 1,
            pills: [
              "qs-cm-pill-variables",
              // FEEL-Editor (ehem. SIM-Def)
              "qs-cm-pill-feel",
              // FEEL-Script (Auto-Eval-Toggle)
              "qs-cm-pill-ask-inputs",
              // UserTask-Formular
              "qs-cm-pill-msg-inputs",
              // Nachrichten-Formular
              "qs-cm-pill-dmn-pause"
              // DMN auswerten
            ]
          },
          {
            id: "sim-analyse",
            label: "Simulation-Analyse",
            grp: "analysis",
            col: 1,
            pills: [
              "qs-cm-pill-simdef-trace",
              // 🔎 Definitionen im Verlauf
              "qs-cm-pill-sim-runs"
              // 🎬 Simulationsläufe
            ]
          },
          {
            id: "prozess-analyse",
            label: "Prozessanalyse",
            grp: "process",
            col: 2,
            pills: [
              "qs-cm-pill-tags",
              // Themen-Tags (Nutzer-Wunsch 2026-08-18: ins Menü)
              "qs-cm-pill-layers",
              // 🗂 Ebenen festlegen
              "qs-cm-pill-sim-follow",
              // 🎯 Simulation folgt Ebenen
              "qs-cm-pill-color",
              // Farb-Override
              "qs-cm-pill-kpi",
              // 📊 KPI-Analyse
              "qs-cm-pill-comments"
              // Dokumentation
            ]
          },
          {
            id: "struktur",
            label: "BPMN-Struktur",
            grp: "structure",
            col: 2,
            pills: [
              "qs-cm-pill-graphviz",
              // XML (Graph)
              "qs-cm-pill-xmli",
              // XML (Element)
              "qs-cm-pill-xmlfull"
              // XML (Gesamt)
            ]
          },
          {
            id: "ref",
            label: "Referenzen",
            grp: "neutral",
            col: 2,
            pills: [
              "qs-cm-pill-notation",
              // BPMN-Notation
              "qs-cm-pill-feel-ref",
              // FEEL
              "qs-cm-pill-dmn-ref"
              // DMN
            ]
          },
          {
            id: "file",
            label: "Datei",
            grp: "export",
            col: 1,
            pills: ["qs-cm-pill-tools"]
          }
        ];
        const GRP_COLORS = {
          inspect: "var(--qs-accent,#7dd3fc)",
          analysis: "var(--qs-amber,#fbbf24)",
          structure: "var(--qs-purple,#c084fc)",
          process: "var(--qs-orange,#fb923c)",
          export: "var(--qs-purple,#c084fc)",
          neutral: "var(--qs-text-mute,#8a909a)"
        };
        const CHK_PILLS = /* @__PURE__ */ new Set([
          "qs-cm-pill-trail",
          // Pfadspur an/aus
          "qs-cm-pill-feel",
          // FEEL-Auto-Eval an/aus
          "qs-cm-pill-ask-inputs",
          // UserTask-Formular an/aus
          "qs-cm-pill-msg-inputs",
          // Nachrichten-Formular an/aus
          "qs-cm-pill-dmn-pause",
          // DMN auswerten (Pause) an/aus
          "qs-cm-pill-sim-follow",
          // Sim folgt Ebenen an/aus
          "qs-cm-pill-layers",
          // Ebenen-Sichtbarkeit an/aus
          "qs-cm-pill-color"
          // Farb-Override an/aus
        ]);
        function ensureStyles() {
          if (document.getElementById(STYLE_ID)) return;
          const s = document.createElement("style");
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
               (wie v2-Studio: umrandete Bereiche mit farbiger \xDCberschrift,
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
            /* Pillen innerhalb des Menues wie Listeneintr\xE4ge rendern */
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
            /* Status-Marker analog v2-Studio (keine gro\xDFe Farbfl\xE4che mehr):
               feste Status-Spalte links via ::before \u2192 nichts springt.
                 \xB7 .qs-cm-chk (echter An/Aus-Schalter, aria-pressed=true) \u2192 \u2713
                 \xB7 aria-pressed=true OHNE .qs-cm-chk (Fenster offen)       \u2192 \u25CF
                 \xB7 Aktionen (kein aria-pressed) \u2192 leer, aber gleiche Breite.
               Semantik jetzt eindeutig; die blaue FL\xC4CHE entf\xE4llt (l\xF6st auch
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
            .qs-cm-analyse-menu .qs-cm-pill.qs-cm-chk[aria-pressed="true"]::before { content: "\u2713"; }
            .qs-cm-analyse-menu .qs-cm-pill[aria-pressed="true"]:not(.qs-cm-chk)::before { content: "\u25CF"; font-size: 0.6em; }
            /* aktive Eintr\xE4ge nur dezent in Akzentfarbe, KEINE Fl\xE4chen-Hinterlegung */
            .qs-cm-analyse-menu .qs-cm-pill[aria-pressed="true"] {
                background: transparent; color: var(--qs-accent-strong,#2563eb);
                border-color: transparent; font-weight: 600;
            }
            .qs-cm-analyse-sep {
                height: 1px; background: var(--qs-border-soft,#2d3138); margin: 4px 6px;
            }
            /* Zonen-Box: umrandeter Bereich je Sektion (v2-Studio-Look). Die
               Rahmenfarbe zieht dezent die Gruppen-Farbe (--qs-sec-grp, per JS
               gesetzt) \u2192 farbige Zuordnung ohne laute Fl\xE4chen. */
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
                /* farbige \xDCberschrift je Gruppe (v2-Studio) */
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
        const COLLAPSE_LS = "qs-cm-werkzeuge-collapsed";
        function _qsLoadCollapsed() {
          try {
            return JSON.parse(localStorage.getItem(COLLAPSE_LS) || "{}") || {};
          } catch (e) {
            return {};
          }
        }
        function _qsSaveCollapsed(state) {
          try {
            localStorage.setItem(COLLAPSE_LS, JSON.stringify(state || {}));
          } catch (e) {
          }
        }
        function ensureWrap(bar) {
          let wrap = bar.querySelector(":scope > .qs-cm-analyse-wrap");
          if (wrap) return wrap;
          wrap = document.createElement("div");
          wrap.className = "qs-cm-analyse-wrap";
          const collapsed = _qsLoadCollapsed();
          const secHtml = (sec) => {
            const isCol = !!collapsed[sec.id];
            const grpColor = GRP_COLORS[sec.grp] || "";
            const grpStyle = grpColor ? ' style="--qs-sec-grp:' + grpColor + ';"' : "";
            return '<div class="qs-cm-analyse-section" data-section="' + sec.id + '" data-collapsed="' + (isCol ? "true" : "false") + '"' + grpStyle + '><div class="qs-cm-analyse-section-label" data-toggle-section="' + sec.id + '"><span class="qs-cm-analyse-section-caret">' + (isCol ? "\u25B8" : "\u25BE") + "</span>" + sec.label + '</div><div class="qs-cm-analyse-group" data-group="' + sec.id + '"></div></div>';
          };
          const col1 = SECTIONS.filter((s) => (s.col || 1) === 1).map(secHtml).join("");
          const col2 = SECTIONS.filter((s) => s.col === 2).map(secHtml).join("");
          wrap.innerHTML = '<button type="button" class="qs-cm-pill qs-cm-pill-analyse" title="Synixx-Werkzeuge \u2014 orange = Pfadspur wird dargestellt"><span class="qs-cm-pill-icon"><span data-icon="sliders-vertical"></span></span><span class="qs-cm-pill-label">Synixx</span><span class="qs-cm-pill-caret">\u25BE</span></button><div class="qs-cm-analyse-menu" role="menu"><div class="qs-cm-analyse-col">' + col1 + '</div><div class="qs-cm-analyse-col">' + col2 + "</div></div>";
          bar.appendChild(wrap);
          try {
            const trail = wrap.querySelector(".qs-cm-pill-trail") || document.querySelector(".qs-cm-pill-trail");
            const spiegel = () => {
              const t = wrap.querySelector(".qs-cm-pill-trail") || document.querySelector(".qs-cm-pill-trail");
              wrap.setAttribute("data-trail-on", t && t.getAttribute("aria-pressed") === "true" ? "true" : "false");
            };
            spiegel();
            if (trail && !trail.__qsTrailSpiegel) {
              trail.__qsTrailSpiegel = true;
              new MutationObserver(spiegel).observe(trail, { attributes: true, attributeFilter: ["aria-pressed"] });
            }
          } catch (e) {
          }
          const menu = wrap.querySelector(".qs-cm-analyse-menu");
          if (menu) {
            let _qsHidePeek = function() {
              if (_peekEl) {
                _peekEl.remove();
                _peekEl = null;
              }
            }, _qsScheduleHidePeek = function() {
              clearTimeout(_peekHideT);
              _peekHideT = setTimeout(_qsHidePeek, 180);
            }, _qsShowPeek = function(label, section) {
              _qsHidePeek();
              const group = section.querySelector(".qs-cm-analyse-group");
              if (!group) return;
              const fly = document.createElement("div");
              fly.className = "qs-cm-analyse-peek";
              fly.style.cssText = "position:fixed; z-index:11000; background:var(--qs-panel,#1a1d22); border:1px solid var(--qs-border,#444); border-radius:10px; box-shadow:0 10px 40px rgba(0,0,0,.5); padding:6px; display:flex; flex-direction:column; gap:2px; min-width:200px; max-width:340px; max-height:70vh; overflow:auto;";
              const t = document.createElement("div");
              t.textContent = (label.textContent || "").replace(/^[▸▾]\s*/, "").trim();
              t.style.cssText = "font-size:10px; text-transform:uppercase; letter-spacing:.05em; color:#6b7280; padding:4px 8px 6px;";
              fly.appendChild(t);
              let n = 0;
              Array.from(group.children).forEach((orig) => {
                const clone = orig.cloneNode(true);
                clone.removeAttribute("id");
                clone.style.display = "";
                clone.addEventListener("click", (e) => {
                  e.stopPropagation();
                  _qsHidePeek();
                  try {
                    orig.click();
                  } catch (err) {
                  }
                });
                fly.appendChild(clone);
                n++;
              });
              if (!n) return;
              document.body.appendChild(fly);
              const r = label.getBoundingClientRect();
              const fr = fly.getBoundingClientRect();
              let left = r.right + 6, top = r.top;
              if (left + fr.width > window.innerWidth - 8) left = Math.max(8, r.left - fr.width - 6);
              if (top + fr.height > window.innerHeight - 8) top = Math.max(8, window.innerHeight - fr.height - 8);
              fly.style.left = left + "px";
              fly.style.top = top + "px";
              fly.addEventListener("mouseenter", () => clearTimeout(_peekHideT));
              fly.addEventListener("mouseleave", _qsScheduleHidePeek);
              _peekEl = fly;
            };
            menu.addEventListener("click", (e) => {
              const label = e.target.closest && e.target.closest(".qs-cm-analyse-section-label");
              if (!label || !menu.contains(label)) return;
              const section = label.parentElement;
              const id = section && section.dataset.section;
              if (!id) return;
              e.stopPropagation();
              const wasCol = section.getAttribute("data-collapsed") === "true";
              const next = !wasCol;
              section.setAttribute("data-collapsed", next ? "true" : "false");
              const caret = label.querySelector(".qs-cm-analyse-section-caret");
              if (caret) caret.textContent = next ? "\u25B8" : "\u25BE";
              const st = _qsLoadCollapsed();
              st[id] = next;
              _qsSaveCollapsed(st);
              _qsHidePeek();
            });
            let _peekShowT = null, _peekHideT = null, _peekEl = null;
            menu.addEventListener("mouseover", (e) => {
              const label = e.target.closest && e.target.closest(".qs-cm-analyse-section-label");
              if (!label || !menu.contains(label)) return;
              const section = label.parentElement;
              clearTimeout(_peekShowT);
              if (!section || section.getAttribute("data-collapsed") !== "true") return;
              _peekShowT = setTimeout(() => {
                if (section.getAttribute("data-collapsed") === "true") _qsShowPeek(label, section);
              }, 500);
            });
            menu.addEventListener("mouseout", (e) => {
              const label = e.target.closest && e.target.closest(".qs-cm-analyse-section-label");
              if (label) {
                clearTimeout(_peekShowT);
                _qsScheduleHidePeek();
              }
            });
          }
          const obs = new MutationObserver(() => {
            const any = wrap.querySelectorAll('.qs-cm-pill[aria-pressed="true"]').length > 0;
            wrap.setAttribute("data-any-pressed", any ? "true" : "false");
          });
          obs.observe(wrap, { subtree: true, attributes: true, attributeFilter: ["aria-pressed"] });
          const trigger = wrap.querySelector(".qs-cm-pill-analyse");
          if (trigger) {
            trigger.addEventListener("click", (e) => {
              e.stopPropagation();
              const isOpen = wrap.getAttribute("data-open") === "true";
              wrap.setAttribute("data-open", isOpen ? "false" : "true");
            });
          }
          document.addEventListener("mousedown", (e) => {
            if (wrap.getAttribute("data-open") !== "true") return;
            if (wrap.contains(e.target)) return;
            wrap.setAttribute("data-open", "false");
          }, true);
          document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && wrap.getAttribute("data-open") === "true") {
              wrap.setAttribute("data-open", "false");
            }
          });
          return wrap;
        }
        function _qsFindPillUnit(bar, cls) {
          const pill = bar.querySelector("." + cls);
          if (!pill) return null;
          let unit = pill;
          while (unit.parentElement && unit.parentElement !== bar) {
            unit = unit.parentElement;
          }
          return unit.parentElement === bar ? unit : null;
        }
        function autoArrange() {
          ensureStyles();
          const bars = document.querySelectorAll(".qs-cm-pills");
          bars.forEach((bar) => {
            const moves = [];
            SECTIONS.forEach((sec) => {
              sec.pills.forEach((cls) => {
                const p = _qsFindPillUnit(bar, cls);
                if (p && !p.classList.contains("qs-cm-analyse-wrap")) {
                  moves.push({ pill: p, group: sec.id, cls });
                }
              });
            });
            if (moves.length === 0) return;
            const wrap = ensureWrap(bar);
            moves.forEach(({ pill, group, cls }) => {
              const target = wrap.querySelector('.qs-cm-analyse-group[data-group="' + group + '"]');
              if (target) target.appendChild(pill);
              if (cls && CHK_PILLS.has(cls)) {
                const btn = pill.classList.contains("qs-cm-pill") ? pill : pill.querySelector(".qs-cm-pill");
                if (btn) btn.classList.add("qs-cm-chk");
              }
            });
            wrap.querySelectorAll(".qs-cm-analyse-section").forEach((sec) => {
              const grp = sec.querySelector(".qs-cm-analyse-group");
              sec.style.display = grp && grp.children.length > 0 ? "" : "none";
            });
            bar.appendChild(wrap);
          });
        }
        function watch() {
          document.querySelectorAll(".qs-cm-pills").forEach((bar) => {
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
        setTimeout(init, 50);
        setTimeout(init, 250);
        setTimeout(init, 800);
        setTimeout(init, 1500);
        setTimeout(init, 3e3);
        let pendingTimer = null;
        function scheduleInit() {
          if (pendingTimer) return;
          pendingTimer = setTimeout(() => {
            pendingTimer = null;
            try {
              init();
            } catch (e) {
            }
          }, 80);
        }
        if (typeof MutationObserver !== "undefined" && document.body && !window.__qsCmAnalyseBodyObsInstalled) {
          window.__qsCmAnalyseBodyObsInstalled = true;
          const bodyObs = new MutationObserver((mutations) => {
            for (const m of mutations) {
              if (!m.addedNodes || m.addedNodes.length === 0) continue;
              for (const n of m.addedNodes) {
                if (n.nodeType !== 1) continue;
                if (n.classList && n.classList.contains("qs-cm-pills")) {
                  scheduleInit();
                  return;
                }
                if (n.querySelector && n.querySelector(".qs-cm-pills, .qs-cm-pill")) {
                  scheduleInit();
                  return;
                }
              }
            }
          });
          bodyObs.observe(document.body, { childList: true, subtree: true });
        } else if (document.readyState === "loading") {
          document.addEventListener("DOMContentLoaded", () => setTimeout(init, 50));
        }
        function qsCmGetOrCreateToolbar(canvas) {
          const cont = canvas.getContainer && canvas.getContainer();
          if (!cont) return null;
          try {
            const pos = window.getComputedStyle(cont).position;
            if (pos === "static" || !pos) cont.style.position = "relative";
          } catch (e) {
          }
          let bar = cont.querySelector(":scope > .qs-cm-pills");
          if (!bar) {
            bar = document.createElement("div");
            bar.className = "qs-cm-pills";
            cont.appendChild(bar);
          }
          return bar;
        }
        if (typeof window !== "undefined") window.qsCmGetOrCreateToolbar = qsCmGetOrCreateToolbar;
        if (typeof window !== "undefined") window.qsCmArrangeAnalyse = autoArrange;
      })();
    }
  });

  // ../../node_modules/camunda-modeler-plugin-helpers/index.js
  var camunda_modeler_plugin_helpers_exports = {};
  __export(camunda_modeler_plugin_helpers_exports, {
    getModelerDirectory: () => getModelerDirectory,
    getPluginsDirectory: () => getPluginsDirectory,
    registerBpmnJSModdleExtension: () => registerBpmnJSModdleExtension,
    registerBpmnJSPlugin: () => registerBpmnJSPlugin,
    registerClientExtension: () => registerClientExtension,
    registerClientPlugin: () => registerClientPlugin,
    registerCloudBpmnJSModdleExtension: () => registerCloudBpmnJSModdleExtension,
    registerCloudBpmnJSPlugin: () => registerCloudBpmnJSPlugin,
    registerCloudDmnJSModdleExtension: () => registerCloudDmnJSModdleExtension,
    registerCloudDmnJSPlugin: () => registerCloudDmnJSPlugin,
    registerDmnJSModdleExtension: () => registerDmnJSModdleExtension,
    registerDmnJSPlugin: () => registerDmnJSPlugin,
    registerPlatformBpmnJSModdleExtension: () => registerPlatformBpmnJSModdleExtension,
    registerPlatformBpmnJSPlugin: () => registerPlatformBpmnJSPlugin,
    registerPlatformDmnJSModdleExtension: () => registerPlatformDmnJSModdleExtension,
    registerPlatformDmnJSPlugin: () => registerPlatformDmnJSPlugin
  });
  function registerClientPlugin(plugin, type) {
    var plugins = window.plugins || [];
    window.plugins = plugins;
    if (!plugin) {
      throw new Error("plugin not specified");
    }
    if (!type) {
      throw new Error("type not specified");
    }
    plugins.push({
      plugin,
      type
    });
  }
  function registerClientExtension(component) {
    registerClientPlugin(component, "client");
  }
  function registerBpmnJSPlugin(module) {
    registerClientPlugin(module, "bpmn.modeler.additionalModules");
  }
  function registerPlatformBpmnJSPlugin(module) {
    registerClientPlugin(module, "bpmn.platform.modeler.additionalModules");
  }
  function registerCloudBpmnJSPlugin(module) {
    registerClientPlugin(module, "bpmn.cloud.modeler.additionalModules");
  }
  function registerBpmnJSModdleExtension(descriptor) {
    registerClientPlugin(descriptor, "bpmn.modeler.moddleExtension");
  }
  function registerPlatformBpmnJSModdleExtension(descriptor) {
    registerClientPlugin(descriptor, "bpmn.platform.modeler.moddleExtension");
  }
  function registerCloudBpmnJSModdleExtension(descriptor) {
    registerClientPlugin(descriptor, "bpmn.cloud.modeler.moddleExtension");
  }
  function registerDmnJSModdleExtension(descriptor) {
    registerClientPlugin(descriptor, "dmn.modeler.moddleExtension");
  }
  function registerCloudDmnJSModdleExtension(descriptor) {
    registerClientPlugin(descriptor, "dmn.cloud.modeler.moddleExtension");
  }
  function registerPlatformDmnJSModdleExtension(descriptor) {
    registerClientPlugin(descriptor, "dmn.platform.modeler.moddleExtension");
  }
  function registerDmnJSPlugin(module, components) {
    if (!Array.isArray(components)) {
      components = [components];
    }
    components.forEach((c) => registerClientPlugin(module, `dmn.modeler.${c}.additionalModules`));
  }
  function registerCloudDmnJSPlugin(module, components) {
    if (!Array.isArray(components)) {
      components = [components];
    }
    components.forEach((c) => registerClientPlugin(module, `dmn.cloud.modeler.${c}.additionalModules`));
  }
  function registerPlatformDmnJSPlugin(module, components) {
    if (!Array.isArray(components)) {
      components = [components];
    }
    components.forEach((c) => registerClientPlugin(module, `dmn.platform.modeler.${c}.additionalModules`));
  }
  function getModelerDirectory() {
    return window.getModelerDirectory();
  }
  function getPluginsDirectory() {
    return window.getPluginsDirectory();
  }
  var init_camunda_modeler_plugin_helpers = __esm({
    "../../node_modules/camunda-modeler-plugin-helpers/index.js"() {
    }
  });

  // plugins/notation/entry.js
  var require_entry = __commonJS({
    "plugins/notation/entry.js"() {
      require_bpmn_comment_media();
      require_bpmn_notation();
      require_qs_cm_analyse_wrap();
      var { registerBpmnJSPlugin: registerBpmnJSPlugin2, registerPlatformBpmnJSPlugin: registerPlatformBpmnJSPlugin2, registerCloudBpmnJSPlugin: registerCloudBpmnJSPlugin2 } = (init_camunda_modeler_plugin_helpers(), __toCommonJS(camunda_modeler_plugin_helpers_exports));
      var getOrCreateQsToolbar = (canvas) => window.qsCmGetOrCreateToolbar(canvas);
      function NotationPlugin(eventBus, canvas, injector) {
        let pillBtn = null;
        let modeler = null;
        try {
          modeler = injector.get("bpmnjs", false);
        } catch (e) {
        }
        function api() {
          if (!modeler || !window.attachBpmnNotation) return null;
          const a = window.attachBpmnNotation(modeler);
          if (a && typeof a.setOnClose === "function") {
            a.setOnClose(() => {
              if (pillBtn) pillBtn.setAttribute("aria-pressed", "false");
            });
          }
          return a;
        }
        function togglePanel() {
          const a = api();
          if (!a) return;
          if (a.isPanelOpen()) {
            a.closePanel();
            if (pillBtn) pillBtn.setAttribute("aria-pressed", "false");
          } else {
            a.openPanel();
            if (pillBtn) pillBtn.setAttribute("aria-pressed", "true");
          }
        }
        function ensurePill() {
          const bar = getOrCreateQsToolbar(canvas);
          if (!bar || pillBtn) return;
          pillBtn = document.createElement("button");
          pillBtn.type = "button";
          pillBtn.className = "qs-cm-pill qs-cm-pill-notation";
          pillBtn.setAttribute("aria-pressed", "false");
          pillBtn.title = "BPMN-Notations\xFCbersicht \u2014 Alt+Shift+B";
          pillBtn.innerHTML = '<span class="qs-cm-pill-icon">\u{1F4D6}</span><span class="qs-cm-pill-label">BPMN</span>';
          pillBtn.addEventListener("click", togglePanel);
          bar.appendChild(pillBtn);
        }
        eventBus.on("import.done", ensurePill);
        eventBus.on("canvas.viewbox.changed", ensurePill);
        setTimeout(ensurePill, 0);
        setTimeout(ensurePill, 200);
        setTimeout(ensurePill, 1e3);
        document.addEventListener("keydown", function(ev) {
          if (!ev || !ev.altKey || !ev.shiftKey) return;
          if (ev.key !== "B" && ev.key !== "b" && ev.code !== "KeyB") return;
          ev.preventDefault();
          ev.stopPropagation();
          togglePanel();
        }, true);
      }
      NotationPlugin.$inject = ["eventBus", "canvas", "injector"];
      var QsNotationModule = {
        __init__: ["qsBpmnNotation"],
        qsBpmnNotation: ["type", NotationPlugin]
      };
      if (typeof registerPlatformBpmnJSPlugin2 === "function") registerPlatformBpmnJSPlugin2(QsNotationModule);
      if (typeof registerCloudBpmnJSPlugin2 === "function") registerCloudBpmnJSPlugin2(QsNotationModule);
      if (typeof registerBpmnJSPlugin2 === "function") registerBpmnJSPlugin2(QsNotationModule);
    }
  });
  require_entry();
})();
