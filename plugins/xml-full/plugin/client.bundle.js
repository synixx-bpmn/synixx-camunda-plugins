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

  // lib/bpmn-xml-full.js
  var require_bpmn_xml_full = __commonJS({
    "lib/bpmn-xml-full.js"() {
      (function() {
        "use strict";
        const STYLE_ID = "qs-xmlfull-style";
        function ensureStyle() {
          if (document.getElementById(STYLE_ID)) return;
          const s = document.createElement("style");
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
            /* Sync-Highlight: ausgewaehltes Element im BPMN \u2192 dezent dunkelblau
               im XML, durchgehend vom Opening-Tag ueber Children bis Closing-Tag.
               Linker Akzent-Strich laeuft ueber die volle Elementhoehe. */
            .qs-xmlfull-el.qs-xmlfull-selected {
                background: var(--qs-xml-sel,rgba(30, 58, 138, 0.30));
                box-shadow: inset 3px 0 0 #3b82f6;
                border-radius: 2px;
            }
            /* Opening-/Closing-Tag-Zeile etwas kontrastreicher, damit die Klammer
               als \u201EAufhaenger" des markierten Blocks erkennbar bleibt. */
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
                /* Rand gelb-orange (n\xE4her am F\xFCll-Gelb) statt kr\xE4ftigem Amber/Braun */
                border-radius: 2px; box-shadow: 0 0 0 1px rgba(251,191,36,0.85) inset;
            }
            .qs-xmlfull-hit.qs-xmlfull-hit-current {
                /* etwas helleres Blau als --qs-accent \u2192 dunkler Text bleibt gut
                   lesbar; kr\xE4ftiger Rand markiert den aktuellen Treffer. */
                background: color-mix(in srgb, var(--qs-accent,#60a5fa) 55%, #ffffff);
                color: var(--qs-text,#111);
                box-shadow: 0 0 0 1px var(--qs-accent,#60a5fa) inset;
            }
        `;
          document.head.appendChild(s);
        }
        function esc(s) {
          return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
        }
        function renderElement(el, depth) {
          const pad = "  ".repeat(depth);
          const tag = el.tagName;
          const bpmnId = el.getAttribute && el.getAttribute("id");
          const idAttr = bpmnId ? ` data-bpmn-id="${esc(bpmnId)}"` : "";
          let attrs = "";
          for (const a of el.attributes) {
            attrs += ` <span class="qs-xmlfull-attr">${esc(a.name)}</span><span class="qs-xmlfull-eq">=</span><span class="qs-xmlfull-val">"${esc(a.value)}"</span>`;
          }
          const kids = [];
          for (const c of el.childNodes) {
            if (c.nodeType === 1) kids.push(c);
            else if (c.nodeType === 3) {
              if (c.textContent && c.textContent.trim()) kids.push(c);
            } else if (c.nodeType === 8) kids.push(c);
            else if (c.nodeType === 7) kids.push(c);
            else if (c.nodeType === 4) kids.push(c);
          }
          const hasKids = kids.length > 0;
          const caretHtml = hasKids ? '<span class="qs-xmlfull-caret">\u25BC</span>' : '<span class="qs-xmlfull-caret qs-no-children">\xB7</span>';
          if (!hasKids) {
            return `<div class="qs-xmlfull-el" data-depth="${depth}"${idAttr}><span class="qs-xmlfull-row qs-xmlfull-select-row">${pad}${caretHtml}<span class="qs-xmlfull-bracket">&lt;</span><span class="qs-xmlfull-tag">${esc(tag)}</span>${attrs}<span class="qs-xmlfull-bracket">/&gt;</span></span></div>`;
          }
          let childHtml = "";
          for (const c of kids) {
            if (c.nodeType === 1) {
              childHtml += renderElement(c, depth + 1);
            } else if (c.nodeType === 3) {
              const txt = c.textContent.trim();
              if (txt) childHtml += `<div class="qs-xmlfull-el" data-depth="${depth + 1}"><span class="qs-xmlfull-row">${"  ".repeat(depth + 1)}<span class="qs-xmlfull-caret qs-no-children">\xB7</span><span class="qs-xmlfull-text">${esc(txt)}</span></span></div>`;
            } else if (c.nodeType === 8) {
              childHtml += `<div class="qs-xmlfull-el" data-depth="${depth + 1}"><span class="qs-xmlfull-row">${"  ".repeat(depth + 1)}<span class="qs-xmlfull-caret qs-no-children">\xB7</span><span class="qs-xmlfull-comment">&lt;!--${esc(c.nodeValue || "")}--&gt;</span></span></div>`;
            } else if (c.nodeType === 7) {
              childHtml += `<div class="qs-xmlfull-el" data-depth="${depth + 1}"><span class="qs-xmlfull-row">${"  ".repeat(depth + 1)}<span class="qs-xmlfull-caret qs-no-children">\xB7</span><span class="qs-xmlfull-pi">&lt;?${esc(c.target)} ${esc(c.data || "")}?&gt;</span></span></div>`;
            } else if (c.nodeType === 4) {
              childHtml += `<div class="qs-xmlfull-el" data-depth="${depth + 1}"><span class="qs-xmlfull-row">${"  ".repeat(depth + 1)}<span class="qs-xmlfull-caret qs-no-children">\xB7</span><span class="qs-xmlfull-comment">&lt;![CDATA[${esc(c.nodeValue || "")}]]&gt;</span></span></div>`;
            }
          }
          return `<div class="qs-xmlfull-el" data-depth="${depth}"${idAttr}><span class="qs-xmlfull-row has-caret qs-xmlfull-select-row">${pad}${caretHtml}<span class="qs-xmlfull-bracket">&lt;</span><span class="qs-xmlfull-tag">${esc(tag)}</span>${attrs}<span class="qs-xmlfull-bracket">&gt;</span><span class="qs-xmlfull-elision">\u2026</span></span><div class="qs-xmlfull-children">${childHtml}</div><div class="qs-xmlfull-closetag"><span class="qs-xmlfull-row">${pad}<span class="qs-xmlfull-caret qs-no-children">\xB7</span><span class="qs-xmlfull-bracket">&lt;/</span><span class="qs-xmlfull-tag">${esc(tag)}</span><span class="qs-xmlfull-bracket">&gt;</span></span></div></div>`;
        }
        function renderTree(xml) {
          const doc = new DOMParser().parseFromString(xml || "", "application/xml");
          const perr = doc.getElementsByTagName("parsererror")[0];
          if (perr) return `<div class="qs-xmlfull-error">XML-Parse-Fehler: ${esc(perr.textContent || "")}</div>`;
          const root = doc.documentElement;
          if (!root) return '<div class="qs-xmlfull-error">Kein Root-Element gefunden.</div>';
          let head = "";
          if (xml && xml.trim().startsWith("<?xml")) {
            const m = xml.match(/^\s*<\?xml[^?]*\?>/);
            if (m) head = `<div class="qs-xmlfull-el" data-depth="0"><span class="qs-xmlfull-row"><span class="qs-xmlfull-caret qs-no-children">\xB7</span><span class="qs-xmlfull-pi">${esc(m[0].trim())}</span></span></div>`;
          }
          return head + renderElement(root, 0);
        }
        function wireTreeToggles(treeRoot, onSelectBpmnId, onFoldChange) {
          treeRoot.addEventListener("click", (ev) => {
            const caretClicked = ev.target.classList && ev.target.classList.contains("qs-xmlfull-caret") && !ev.target.classList.contains("qs-no-children");
            if (caretClicked) {
              const el2 = ev.target.closest(".qs-xmlfull-el");
              if (!el2) return;
              const folded = el2.classList.toggle("qs-folded");
              ev.target.textContent = folded ? "\u25B6" : "\u25BC";
              ev.stopPropagation();
              if (typeof onFoldChange === "function") onFoldChange();
              return;
            }
            const row = ev.target.closest(".qs-xmlfull-select-row");
            if (!row) return;
            const el = row.parentElement;
            if (!el || !el.classList.contains("qs-xmlfull-el")) return;
            const bpmnId = el.getAttribute("data-bpmn-id");
            if (!bpmnId) return;
            if (typeof onSelectBpmnId === "function") onSelectBpmnId(bpmnId);
          });
        }
        function numberLines(treeRoot) {
          let ln = 0;
          treeRoot.querySelectorAll(".qs-xmlfull-row").forEach((row) => {
            row.setAttribute("data-ln", String(++ln));
          });
        }
        function setAllFolded(treeRoot, folded) {
          treeRoot.querySelectorAll(".qs-xmlfull-el").forEach((el) => {
            const row = el.querySelector(":scope > .qs-xmlfull-row.has-caret");
            if (!row) return;
            const caret = row.querySelector(".qs-xmlfull-caret");
            if (folded) {
              el.classList.add("qs-folded");
              if (caret) caret.textContent = "\u25B6";
            } else {
              el.classList.remove("qs-folded");
              if (caret) caret.textContent = "\u25BC";
            }
          });
        }
        function attachBpmnXmlFull(viewer) {
          if (!viewer) return null;
          if (viewer.__qsXmlFull) return viewer.__qsXmlFull;
          ensureStyle();
          try {
            if (window.qsCommentMedia && window.qsCommentMedia.ensureStyles) window.qsCommentMedia.ensureStyles();
          } catch (e) {
          }
          let panel = null;
          let lastXml = "";
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
            stateChangeTimer = setTimeout(() => {
              try {
                onStateChangeCb(getState());
              } catch (e) {
              }
            }, 200);
          }
          function getState() {
            if (!panel) return {};
            const foldedIds = [];
            panel.querySelectorAll(".qs-xmlfull-el.qs-folded[data-bpmn-id]").forEach((el) => {
              const id = el.getAttribute("data-bpmn-id");
              if (id) foldedIds.push(id);
            });
            return {
              foldedIds,
              wrap: panel.classList.contains("qs-pre-wrap"),
              fullscreen: panel.classList.contains("qs-fullscreen"),
              autoRefresh: !!autoRefresh,
              zoom: getZoom()
            };
          }
          function getZoom() {
            const tree = panel && panel.querySelector(".qs-xmlfull-tree");
            const z = tree && tree.style.zoom;
            const n = z ? parseFloat(z) : 1;
            return isFinite(n) && n > 0 ? n : 1;
          }
          function setState(s, opts) {
            if (!s || !panel) return;
            const silent = opts && opts.silent;
            if (silent) suppressStateEcho = true;
            try {
              if (typeof s.wrap === "boolean") {
                panel.classList.toggle("qs-pre-wrap", s.wrap);
                const btn = panel.querySelector('[data-act="wrap"]');
                if (btn) btn.classList.toggle("is-active", s.wrap);
              }
              if (typeof s.fullscreen === "boolean") panel.classList.toggle("qs-fullscreen", s.fullscreen);
              if (typeof s.autoRefresh === "boolean") {
                autoRefresh = !!s.autoRefresh;
                const btn = panel.querySelector('[data-act="toggle-auto"]');
                if (btn) btn.classList.toggle("is-active", autoRefresh);
              }
              if (typeof s.zoom === "number" && isFinite(s.zoom)) {
                const tree = panel.querySelector(".qs-xmlfull-tree");
                if (tree) tree.style.zoom = String(Math.max(0.25, Math.min(4, s.zoom)));
                if (typeof panel.__qsApplyZoom === "function") {
                  const zd = panel.querySelector("[data-zoom]");
                  if (zd) zd.textContent = Math.round((s.zoom || 1) * 100) + "%";
                }
              }
              if (Array.isArray(s.foldedIds)) {
                const want = new Set(s.foldedIds);
                panel.querySelectorAll(".qs-xmlfull-el[data-bpmn-id]").forEach((el) => {
                  const id = el.getAttribute("data-bpmn-id");
                  const wantsFolded = want.has(id);
                  const isFolded = el.classList.contains("qs-folded");
                  if (wantsFolded !== isFolded) {
                    el.classList.toggle("qs-folded", wantsFolded);
                    const caret = el.querySelector(":scope > .qs-xmlfull-row > .qs-xmlfull-caret");
                    if (caret && !caret.classList.contains("qs-no-children")) {
                      caret.textContent = wantsFolded ? "\u25B6" : "\u25BC";
                    }
                  }
                });
              }
            } finally {
              if (silent) suppressStateEcho = false;
            }
          }
          function setOnStateChange(cb) {
            onStateChangeCb = typeof cb === "function" ? cb : null;
          }
          async function render(firstRender) {
            if (!panel) return;
            const wrap = panel.querySelector(".qs-cm-popup-body-wrap");
            wrap.innerHTML = `<div class="qs-xmlfull-tree">\u23F3 XML wird geladen\u2026</div>`;
            try {
              const { xml } = await viewer.saveXML({ format: true });
              lastXml = xml || "";
              const html = renderTree(lastXml);
              wrap.innerHTML = `<div class="qs-xmlfull-tree" tabindex="0">${html}</div>`;
              const tree = wrap.querySelector(".qs-xmlfull-tree");
              numberLines(tree);
              wireTreeToggles(tree, selectInBpmn, notifyStateChange);
              try {
                if (panel && panel.classList.contains("qs-search-open") && typeof panel.__qsRunSearch === "function") panel.__qsRunSearch();
              } catch (e) {
              }
              if (panel && typeof panel.__qsApplyZoom === "function") panel.__qsApplyZoom();
              try {
                const sel = viewer.get("selection", false);
                if (sel) {
                  const cur = sel.get();
                  if (cur && cur.length) highlightInTree(cur[0].id, firstRender);
                }
              } catch (e) {
              }
            } catch (err) {
              wrap.innerHTML = `<div class="qs-xmlfull-error">Fehler: ${esc(err && err.message)}</div>`;
            }
          }
          function installCmdListener() {
            if (cmdListenerInstalled) return;
            try {
              const eb = viewer.get("eventBus", false);
              if (!eb) return;
              eb.on("commandStack.executed", () => {
                if (!autoRefresh || !panel) return;
                clearTimeout(autoRefreshTimer);
                autoRefreshTimer = setTimeout(() => {
                  if (panel) render();
                }, 500);
              });
              cmdListenerInstalled = true;
            } catch (e) {
            }
          }
          function installSelectionListener() {
            if (selectionListenerInstalled) return;
            try {
              const eb = viewer.get("eventBus", false);
              if (!eb) return;
              eb.on("selection.changed", (event) => {
                if (!panel || suppressSelectEcho) return;
                const newSel = event && event.newSelection || [];
                if (newSel.length === 0) {
                  clearTreeHighlight();
                  return;
                }
                highlightInTree(newSel[0].id, true);
              });
              selectionListenerInstalled = true;
            } catch (e) {
            }
          }
          function clearTreeHighlight() {
            if (lastSelectedEl) {
              lastSelectedEl.classList.remove("qs-xmlfull-selected");
              lastSelectedEl = null;
            }
          }
          function highlightInTree(id, scroll) {
            if (!panel || !id) return;
            const tree = panel.querySelector(".qs-xmlfull-tree");
            if (!tree) return;
            clearTreeHighlight();
            const sel = '[data-bpmn-id="' + (window.CSS && CSS.escape ? CSS.escape(id) : id) + '"]';
            const el = tree.querySelector(sel);
            if (!el) return;
            el.classList.add("qs-xmlfull-selected");
            lastSelectedEl = el;
            let p = el.parentElement;
            while (p && p !== tree) {
              if (p.classList && p.classList.contains("qs-xmlfull-el") && p.classList.contains("qs-folded")) {
                p.classList.remove("qs-folded");
                const c = p.querySelector(":scope > .qs-xmlfull-row > .qs-xmlfull-caret");
                if (c && !c.classList.contains("qs-no-children")) c.textContent = "\u25BC";
              }
              p = p.parentElement;
            }
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
          function selectInBpmn(id) {
            try {
              const elReg = viewer.get("elementRegistry", false);
              const sel = viewer.get("selection", false);
              const cv = viewer.get("canvas", false);
              if (!elReg || !sel) return;
              const target = elReg.get(id);
              if (!target) return;
              suppressSelectEcho = true;
              try {
                sel.select(target);
              } catch (e) {
              }
              try {
                if (cv && typeof cv.scrollToElement === "function") cv.scrollToElement(target);
              } catch (e) {
              }
              suppressSelectEcho = false;
              highlightInTree(id, false);
            } catch (e) {
            }
          }
          function buildPanel() {
            const div = document.createElement("div");
            div.className = "qs-cm-popup qs-cm-popup-pinned qs-xmlfull-panel";
            div.innerHTML = `<div class="qs-cm-popup-header"><span style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:var(--qs-blue-soft,#60a5fa);"><span data-icon="file-code"></span>BPMN-XML (vollst\xE4ndig)</span><div class="qs-cm-popup-actions"><button class="qs-cm-popup-btn" data-act="refresh" title="Neu laden">\u27F3</button><button class="qs-cm-popup-btn" data-act="toggle-auto" title="Auto-Refresh bei BPMN-\xC4nderung">\u27F2</button><button class="qs-cm-popup-btn" data-act="expand-all" title="Alle aufklappen">\u229E</button><button class="qs-cm-popup-btn" data-act="collapse-all" title="Alle einklappen">\u229F</button><button class="qs-cm-popup-btn" data-act="zoom-out" title="Verkleinern">\u2212</button><span class="qs-cm-popup-zoom" data-zoom>100%</span><button class="qs-cm-popup-btn" data-act="zoom-in" title="Vergr\xF6\xDFern">+</button><button class="qs-cm-popup-btn" data-act="zoom-reset" title="Zoom zur\xFCcksetzen">\u2922</button><button class="qs-cm-popup-btn" data-act="search" title="Suchen (Cmd/Ctrl+F)">\u{1F50D}</button><button class="qs-cm-popup-btn" data-act="wrap" title="Zeilenumbruch ein/aus">\u21B5</button><button class="qs-cm-popup-btn" data-act="copy" title="XML in Zwischenablage">\u29C9</button><button class="qs-cm-popup-btn" data-act="export" title="XML herunterladen">\u21E9</button><button class="qs-cm-popup-btn" data-act="fullscreen" title="Vollbild ein/aus">\u26F6</button><button class="qs-cm-popup-btn" data-act="close" title="Schlie\xDFen">\u2715</button></div></div><div class="qs-xmlfull-search"><input type="text" placeholder="Im XML suchen\u2026" spellcheck="false" /><span class="qs-xmlfull-scount">0 Treffer</span><button class="qs-xmlfull-prev" title="Voriger Treffer (Shift+Enter)">\u2039</button><button class="qs-xmlfull-next" title="N\xE4chster Treffer (Enter)">\u203A</button><button class="qs-xmlfull-ci" title="Gro\xDF-/Kleinschreibung beachten">Aa</button><button class="qs-xmlfull-sclose" title="Suche schlie\xDFen (Esc)">\u2715</button></div><div class="qs-cm-popup-body-wrap"></div>`;
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
            let zoom = 1;
            function applyZoom() {
              const tree = div.querySelector(".qs-xmlfull-tree");
              if (tree) tree.style.zoom = String(zoom);
              const zd = div.querySelector("[data-zoom]");
              if (zd) zd.textContent = Math.round(zoom * 100) + "%";
            }
            function setZoom(z) {
              zoom = Math.max(0.25, Math.min(4, z));
              applyZoom();
            }
            div.querySelector('[data-act="zoom-in"]').addEventListener("click", (e) => {
              e.stopPropagation();
              setZoom(zoom * 1.25);
              notifyStateChange();
            });
            div.querySelector('[data-act="zoom-out"]').addEventListener("click", (e) => {
              e.stopPropagation();
              setZoom(zoom / 1.25);
              notifyStateChange();
            });
            div.querySelector('[data-act="zoom-reset"]').addEventListener("click", (e) => {
              e.stopPropagation();
              setZoom(1);
              notifyStateChange();
            });
            div.querySelector(".qs-cm-popup-body-wrap").addEventListener("wheel", (e) => {
              if (!e.ctrlKey && !e.metaKey) return;
              e.preventDefault();
              setZoom(zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1));
              notifyStateChange();
            }, { passive: false });
            div.__qsApplyZoom = applyZoom;
            const searchBar = div.querySelector(".qs-xmlfull-search");
            const searchInput = searchBar.querySelector("input");
            const searchCount = searchBar.querySelector(".qs-xmlfull-scount");
            let hits = [];
            let hitIdx = -1;
            let caseSensitive = false;
            function clearHits() {
              const tree = div.querySelector(".qs-xmlfull-tree");
              if (!tree) return;
              tree.querySelectorAll("mark.qs-xmlfull-hit").forEach((m) => {
                const t = document.createTextNode(m.textContent);
                m.parentNode.replaceChild(t, m);
              });
              tree.querySelectorAll(".qs-xmlfull-row").forEach((r) => r.normalize());
              hits = [];
              hitIdx = -1;
            }
            function expandAncestors(node) {
              let el = node.closest ? node.closest(".qs-xmlfull-el") : node.parentElement;
              while (el) {
                if (el.classList.contains("qs-folded")) {
                  el.classList.remove("qs-folded");
                  const caret = el.querySelector(":scope > .qs-xmlfull-row .qs-xmlfull-caret");
                  if (caret && !caret.classList.contains("qs-no-children")) caret.textContent = "\u25BC";
                }
                el = el.parentElement ? el.parentElement.closest(".qs-xmlfull-el") : null;
              }
            }
            function markTextNode(textNode, q) {
              const text = textNode.nodeValue;
              const hay = caseSensitive ? text : text.toLowerCase();
              const needle = caseSensitive ? q : q.toLowerCase();
              let from = 0, at, made = [];
              const frag = document.createDocumentFragment();
              while ((at = hay.indexOf(needle, from)) !== -1) {
                if (at > from) frag.appendChild(document.createTextNode(text.slice(from, at)));
                const mk = document.createElement("mark");
                mk.className = "qs-xmlfull-hit";
                mk.textContent = text.slice(at, at + needle.length);
                frag.appendChild(mk);
                made.push(mk);
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
              const tree = div.querySelector(".qs-xmlfull-tree");
              if (!tree || !q) {
                updateCount();
                return;
              }
              const rows = tree.querySelectorAll(".qs-xmlfull-row");
              rows.forEach((row) => {
                const walker = document.createTreeWalker(row, NodeFilter.SHOW_TEXT, null);
                const textNodes = [];
                let n;
                while (n = walker.nextNode()) {
                  if (n.nodeValue && n.nodeValue.length) textNodes.push(n);
                }
                textNodes.forEach((tn) => {
                  hits.push(...markTextNode(tn, q));
                });
              });
              hits.forEach((m) => expandAncestors(m));
              if (hits.length) {
                hitIdx = 0;
                focusHit(0, true);
              }
              updateCount();
            }
            function updateCount() {
              if (!hits.length) {
                searchCount.textContent = searchInput.value ? "Kein Treffer" : "0 Treffer";
              } else searchCount.textContent = hitIdx + 1 + " / " + hits.length;
            }
            function focusHit(i, scroll) {
              if (!hits.length) return;
              hits.forEach((m2) => m2.classList.remove("qs-xmlfull-hit-current"));
              hitIdx = (i % hits.length + hits.length) % hits.length;
              const m = hits[hitIdx];
              m.classList.add("qs-xmlfull-hit-current");
              expandAncestors(m);
              if (scroll) m.scrollIntoView({ block: "center", inline: "nearest" });
              updateCount();
            }
            function nextHit() {
              if (hits.length) focusHit(hitIdx + 1, true);
            }
            function prevHit() {
              if (hits.length) focusHit(hitIdx - 1, true);
            }
            function openSearch() {
              div.classList.add("qs-search-open");
              searchInput.focus();
              searchInput.select();
              if (searchInput.value) runSearch();
            }
            function closeSearch() {
              div.classList.remove("qs-search-open");
              clearHits();
              updateCount();
            }
            div.__qsToggleSearch = () => div.classList.contains("qs-search-open") ? closeSearch() : openSearch();
            div.querySelector('[data-act="search"]').addEventListener("click", (e) => {
              e.stopPropagation();
              div.__qsToggleSearch();
            });
            searchBar.querySelector(".qs-xmlfull-sclose").addEventListener("click", (e) => {
              e.stopPropagation();
              closeSearch();
            });
            searchBar.querySelector(".qs-xmlfull-next").addEventListener("click", (e) => {
              e.stopPropagation();
              nextHit();
            });
            searchBar.querySelector(".qs-xmlfull-prev").addEventListener("click", (e) => {
              e.stopPropagation();
              prevHit();
            });
            const ciBtn = searchBar.querySelector(".qs-xmlfull-ci");
            ciBtn.addEventListener("click", (e) => {
              e.stopPropagation();
              caseSensitive = !caseSensitive;
              ciBtn.classList.toggle("is-active", caseSensitive);
              runSearch();
            });
            let searchDebounce = null;
            searchInput.addEventListener("input", () => {
              clearTimeout(searchDebounce);
              searchDebounce = setTimeout(runSearch, 150);
            });
            searchInput.addEventListener("keydown", (e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                e.stopPropagation();
                if (e.shiftKey) prevHit();
                else nextHit();
              } else if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                closeSearch();
                div.focus();
              }
            });
            div.__qsRunSearch = runSearch;
            div.addEventListener("dblclick", (e) => {
              if (searchBar.contains(e.target)) return;
              const rowEl = e.target.closest ? e.target.closest(".qs-xmlfull-row") : null;
              if (!rowEl) return;
              const word = window.getSelection ? String(window.getSelection()).trim() : "";
              if (!word || /\s/.test(word) || word.length > 80) return;
              searchInput.value = word;
              div.classList.add("qs-search-open");
              runSearch();
              const near = hits.findIndex((m) => rowEl.contains(m));
              if (near > 0) focusHit(near, true);
            });
            div.querySelector('[data-act="refresh"]').addEventListener("click", (e) => {
              e.stopPropagation();
              render();
            });
            div.querySelector('[data-act="toggle-auto"]').addEventListener("click", (e) => {
              e.stopPropagation();
              autoRefresh = !autoRefresh;
              e.currentTarget.classList.toggle("is-active", autoRefresh);
              e.currentTarget.title = autoRefresh ? "Auto-Refresh ein" : "Auto-Refresh aus";
              notifyStateChange();
            });
            div.querySelector('[data-act="expand-all"]').addEventListener("click", (e) => {
              e.stopPropagation();
              const tree = div.querySelector(".qs-xmlfull-tree");
              if (tree) setAllFolded(tree, false);
              notifyStateChange();
            });
            div.querySelector('[data-act="collapse-all"]').addEventListener("click", (e) => {
              e.stopPropagation();
              const tree = div.querySelector(".qs-xmlfull-tree");
              if (tree) setAllFolded(tree, true);
              notifyStateChange();
            });
            div.querySelector('[data-act="wrap"]').addEventListener("click", (e) => {
              e.stopPropagation();
              const on = !div.classList.contains("qs-pre-wrap");
              div.classList.toggle("qs-pre-wrap", on);
              e.currentTarget.classList.toggle("is-active", on);
              notifyStateChange();
            });
            div.querySelector('[data-act="copy"]').addEventListener("click", async (e) => {
              e.stopPropagation();
              if (!lastXml) return;
              try {
                await navigator.clipboard.writeText(lastXml);
              } catch (err) {
              }
            });
            div.querySelector('[data-act="export"]').addEventListener("click", (e) => {
              e.stopPropagation();
              if (!lastXml) return;
              const blob = new Blob([lastXml], { type: "application/xml" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "bpmn-diagram.bpmn";
              document.body.appendChild(a);
              a.click();
              a.remove();
              setTimeout(() => URL.revokeObjectURL(url), 0);
            });
            div.querySelector('[data-act="fullscreen"]').addEventListener("click", (e) => {
              e.stopPropagation();
              div.classList.toggle("qs-fullscreen");
              notifyStateChange();
            });
            div.querySelector('[data-act="close"]').addEventListener("click", closePanel);
            div.tabIndex = -1;
            div.addEventListener("keydown", (e) => {
              if ((e.metaKey || e.ctrlKey) && (e.key === "f" || e.key === "F")) {
                e.preventDefault();
                e.stopPropagation();
                div.classList.add("qs-search-open");
                const si = div.querySelector(".qs-xmlfull-search input");
                if (si) {
                  si.focus();
                  si.select();
                }
                return;
              }
              if (e.key === "Escape") {
                if (div.classList.contains("qs-search-open")) {
                  return;
                }
                closePanel();
              }
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
            installCmdListener();
            installSelectionListener();
            render(true);
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
            if (panel) render();
          }
          function isPanelOpen() {
            return !!panel;
          }
          function setOnClose(fn) {
            onCloseCb = typeof fn === "function" ? fn : null;
          }
          const api = { openPanel, closePanel, refresh, isPanelOpen, setOnClose, getState, setState, setOnStateChange };
          viewer.__qsXmlFull = api;
          return api;
        }
        window.attachBpmnXmlFull = attachBpmnXmlFull;
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

  // plugins/xml-full/entry.js
  var require_entry = __commonJS({
    "plugins/xml-full/entry.js"() {
      require_bpmn_comment_media();
      require_bpmn_xml_full();
      require_qs_cm_analyse_wrap();
      var { registerBpmnJSPlugin: registerBpmnJSPlugin2, registerPlatformBpmnJSPlugin: registerPlatformBpmnJSPlugin2, registerCloudBpmnJSPlugin: registerCloudBpmnJSPlugin2 } = (init_camunda_modeler_plugin_helpers(), __toCommonJS(camunda_modeler_plugin_helpers_exports));
      var getOrCreateQsToolbar = (canvas) => window.qsCmGetOrCreateToolbar(canvas);
      function XmlFullPlugin(eventBus, canvas, injector) {
        let pillBtn = null;
        let modeler = null;
        try {
          modeler = injector.get("bpmnjs", false);
        } catch (e) {
        }
        function api() {
          if (!modeler || !window.attachBpmnXmlFull) return null;
          const a = window.attachBpmnXmlFull(modeler);
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
          pillBtn.className = "qs-cm-pill qs-cm-pill-xmlfull";
          pillBtn.setAttribute("aria-pressed", "false");
          pillBtn.title = "BPMN-XML-Vollansicht \xF6ffnen \u2014 Alt+Shift+M";
          pillBtn.innerHTML = '<span class="qs-cm-pill-icon">\u{1F4C4}</span><span class="qs-cm-pill-label">XML</span>';
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
          if (ev.key !== "M" && ev.key !== "m" && ev.code !== "KeyM") return;
          ev.preventDefault();
          ev.stopPropagation();
          togglePanel();
        }, true);
      }
      XmlFullPlugin.$inject = ["eventBus", "canvas", "injector"];
      var QsXmlFullModule = {
        __init__: ["qsXmlFull"],
        qsXmlFull: ["type", XmlFullPlugin]
      };
      if (typeof registerPlatformBpmnJSPlugin2 === "function") registerPlatformBpmnJSPlugin2(QsXmlFullModule);
      if (typeof registerCloudBpmnJSPlugin2 === "function") registerCloudBpmnJSPlugin2(QsXmlFullModule);
      if (typeof registerBpmnJSPlugin2 === "function") registerBpmnJSPlugin2(QsXmlFullModule);
    }
  });
  require_entry();
})();
