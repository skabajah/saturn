// =========================================================
// Project Saturn — Gist Inhaler (simplified)
// Fetches the Gist's index.html (which contains inline
// <style> and <script>) and renders it in the current page.
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
  //     Redirects any relative fetch (e.g. "saturn.m3u8")
  //     to the Gist raw URL. Installed BEFORE any Gist
  //     script runs.
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
  // [4] INJECT GIST HTML
  //     - copies <head> links/metas
  //     - appends <body> children
  //     - re-runs inline <script> tags
  //     - fetches any <script src> and inlines them
  // ---------------------------------------------------------
  function injectHTML() {
    return fetch(GIST + 'index.html')
      .then(r => r.text())
      .then(html => {
        const doc = new DOMParser().parseFromString(html, 'text/html');

        // [4a] <head>: copy links/metas we don't already have
        doc.head.querySelectorAll('link, meta').forEach(el => {
          const rel  = el.getAttribute('rel');
          const name = el.getAttribute('name');
          if (!rel && !name) return;

          const existing = rel
            ? document.head.querySelector(`link[rel="${rel}"]`)
            : document.head.querySelector(`meta[name="${name}"]`);
          if (existing) return;

          const clone = el.cloneNode(true);

          // rewrite relative hrefs to Gist raw URLs
          if (clone.tagName === 'LINK') {
            const href = clone.getAttribute('href');
            if (href && !/^https?:|^\/\//.test(href)) {
              clone.setAttribute('href', GIST + href.replace(/^icons\//, ''));
            }
          }
          document.head.appendChild(clone);
        });

        // [4b] <head>: inline any <style> blocks
        doc.head.querySelectorAll('style').forEach(old => {
          const s = document.createElement('style');
          s.textContent = old.textContent;
          document.head.appendChild(s);
        });

        // [4c] <body>: append non-script children
        Array.from(doc.body.children).forEach(el => {
          if (el.tagName === 'SCRIPT') return;
          document.body.appendChild(el.cloneNode(true));
        });

        // [4d] <body>: re-run inline <script> tags
        doc.body.querySelectorAll('script:not([src])').forEach(old => {
          const s = document.createElement('script');
          s.textContent = old.textContent;
          if (old.type) s.type = old.type;
          document.body.appendChild(s);
        });

        // [4e] <body> + <head>: fetch external <script src> and inline
        const externalScripts = [
          ...Array.from(doc.body.querySelectorAll('script[src]')),
          ...Array.from(doc.head.querySelectorAll('script[src]'))
        ];

        return Promise.all(externalScripts.map(old => {
          let src = old.getAttribute('src');
          if (src && !/^https?:|^\/\//.test(src)) {
            src = GIST + src.replace(/^\.\//, '').replace(/^icons\//, '');
          }
          return fetch(src)
            .then(r => r.text())
            .then(js => {
              const s = document.createElement('script');
              s.textContent = js;
              if (old.type) s.type = old.type;
              document.body.appendChild(s);
            })
            .catch(err => {
              console.error('[inhaler] failed to inline script:', src, err);
            });
        }));
      });
  }

  // ---------------------------------------------------------
  // [5] REVEAL PAGE
  // ---------------------------------------------------------
  function reveal() {
    document.documentElement.style.visibility = 'visible';
  }

  // ---------------------------------------------------------
  // [6] RUN
  // ---------------------------------------------------------
  installFetchOverride();

  injectHTML()
    .then(reveal)
    .catch(err => {
      console.error('[inhaler] failed:', err);
      reveal();
    });
})();