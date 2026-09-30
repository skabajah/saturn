// =========================================================
// Project Saturn — Gist Inhaler
// =========================================================

(function () {
  'use strict';

  // ---------------------------------------------------------
  // [1] CONFIG
  // ---------------------------------------------------------
  const GIST = 'https://gist.githubusercontent.com/skabajah/ac96fc383152824c0d1951aab3f4ad0a/raw/';

  // ---------------------------------------------------------
  // [2] HIDE PAGE UNTIL READY
  // ---------------------------------------------------------
  document.documentElement.style.visibility = 'hidden';

  // ---------------------------------------------------------
  // [3] FETCH OVERRIDE
  //     Redirects relative fetches (e.g. "saturn.m3u8")
  //     to the Gist raw URL. Must be installed BEFORE
  //     controls.js runs.
  // ---------------------------------------------------------
  function installFetchOverride() {
    const nativeFetch = window.fetch.bind(window);
    window.fetch = function (input, init) {
      if (typeof input === 'string' && !/^https?:|^\/\//.test(input)) {
        input = GIST + input.replace(/^\.\//, '');
      }
      return nativeFetch(input, init);
    };
  }

  // ---------------------------------------------------------
  // [4] INJECT CSS
  //     Fetches main.css, rewrites url(...) refs to Gist,
  //     injects as <style> (bypasses MIME wall).
  // ---------------------------------------------------------
  function injectCSS() {
    return fetch(GIST + 'main.css')
      .then(r => r.text())
      .then(css => {
        const fixed = css.replace(
          /url\(['"]?(?!https?:|data:)([^'")]+)['"]?\)/g,
          (_, p) => `url('${GIST}${p}')`
        );
        const style = document.createElement('style');
        style.textContent = fixed;
        document.head.appendChild(style);
      });
  }

  // ---------------------------------------------------------
  // [5] INJECT HTML
  //     Fetches index.html, copies <head> links/metas,
  //     appends <body> children, re-runs scripts.
  // ---------------------------------------------------------
  function injectHTML() {
    return fetch(GIST + 'index.html')
      .then(r => r.text())
      .then(html => {
        const doc = new DOMParser().parseFromString(html, 'text/html');

        // [5a] Copy <head> links/metas we don't already have
        doc.head.querySelectorAll('link, meta, style').forEach(el => {
          const rel  = el.getAttribute('rel');
          const name = el.getAttribute('name');
          const key  = rel || name;
          if (!key) return;

          const existing = rel
            ? document.head.querySelector(`link[rel="${rel}"]`)
            : document.head.querySelector(`meta[name="${name}"]`);
          if (existing) return;

          const clone = el.cloneNode(true);

          if (clone.tagName === 'LINK') {
            const href = clone.getAttribute('href');
            if (href && !/^https?:|^\/\//.test(href)) {
              clone.setAttribute('href', GIST + href.replace(/^icons\//, ''));
            }
          }
          document.head.appendChild(clone);
        });

        // [5b] Append <body> children (skip scripts — handled below)
        Array.from(doc.body.children).forEach(el => {
          if (el.tagName === 'SCRIPT') return;
          document.body.appendChild(el.cloneNode(true));
        });

        // [5c] Re-run inline <script> tags from body
        doc.body.querySelectorAll('script:not([src])').forEach(old => {
          const s = document.createElement('script');
          s.textContent = old.textContent;
          document.body.appendChild(s);
        });

        // [5d] Load external <script src> from body
        doc.body.querySelectorAll('script[src]').forEach(old => {
          const s = document.createElement('script');
          let src = old.getAttribute('src');
          if (src && !/^https?:|^\/\//.test(src)) {
            src = GIST + src.replace(/^\.\//, '').replace(/^icons\//, '');
          }
          s.src = src;
          if (old.type) s.type = old.type;
          document.body.appendChild(s);
        });

        // [5e] Load external <script src> from head
        doc.head.querySelectorAll('script[src]').forEach(old => {
          const s = document.createElement('script');
          let src = old.getAttribute('src');
          if (src && !/^https?:|^\/\//.test(src)) {
            src = GIST + src.replace(/^\.\//, '').replace(/^icons\//, '');
          }
          s.src = src;
          if (old.type) s.type = old.type;
          document.head.appendChild(s);
        });
      });
  }

  // ---------------------------------------------------------
  // [6] INJECT controls.js
  //     Loaded explicitly with full Gist URL.
  //     Errors are surfaced so failures aren't silent.
  // ---------------------------------------------------------
  function injectControls() {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = GIST + 'controls.js';
      s.onload = () => {
        console.log('[inhaler] controls.js loaded');
        resolve();
      };
      s.onerror = () => {
        console.error('[inhaler] controls.js FAILED to load from', s.src);
        reject(new Error('controls.js failed to load'));
      };
      document.body.appendChild(s);
    });
  }

  // ---------------------------------------------------------
  // [7] REVEAL PAGE
  // ---------------------------------------------------------
  function reveal() {
    document.documentElement.style.visibility = 'visible';
  }

  // ---------------------------------------------------------
  // [8] RUN PIPELINE
  //     1. install fetch override (before controls.js runs)
  //     2. inject CSS
  //     3. inject HTML
  //     4. inject controls.js
  //     5. reveal page
  // ---------------------------------------------------------
  installFetchOverride();

  injectCSS()
    .then(injectHTML)
    .then(injectControls)
    .then(reveal)
    .catch(err => {
      console.error('[inhaler] failed:', err);
      reveal();
    });
})();