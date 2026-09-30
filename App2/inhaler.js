// =========================================================
// Project Saturn — Gist Inhaler
// Input:  Gist index.html with short <link> and <script src>
// Output: fully expanded inline <style> + <script> in the DOM
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
  //     to the Gist raw URL.
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
  //     Fetch main.css, rewrite url() refs to Gist,
  //     inject as inline <style>.
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
  //     Fetch Gist index.html, copy <head> links/metas,
  //     append <body> children, inline all <script src>.
  // ---------------------------------------------------------
  function injectHTML() {
    return fetch(GIST + 'index.html')
      .then(r => r.text())
      .then(html => {
        const doc = new DOMParser().parseFromString(html, 'text/html');

        // [5a] <head>: copy links/metas we don't already have
        doc.head.querySelectorAll('link, meta').forEach(el => {
          const rel  = el.getAttribute('rel');
          const name = el.getAttribute('name');
          if (!rel && !name) return;

          const existing = rel
            ? document.head.querySelector(`link[rel="${rel}"]`)
            : document.head.querySelector(`meta[name="${name}"]`);
          if (existing) return;

          // Skip stylesheet links — handled by [4]
          if (rel === 'stylesheet') return;

          const clone = el.cloneNode(true);

          if (clone.tagName === 'LINK') {
            const href = clone.getAttribute('href');
            if (href && !/^https?:|^\/\//.test(href)) {
              clone.setAttribute('href', GIST + href.replace(/^icons\//, ''));
            }
          }
          document.head.appendChild(clone);
        });

        // [5b] <body>: append non-script children
        Array.from(doc.body.children).forEach(el => {
          if (el.tagName === 'SCRIPT') return;
          document.body.appendChild(el.cloneNode(true));
        });

        // [5c] <body>: re-run inline <script> tags from Gist HTML
        doc.body.querySelectorAll('script:not([src])').forEach(old => {
          const s = document.createElement('script');
          s.textContent = old.textContent;
          if (old.type) s.type = old.type;
          document.body.appendChild(s);
        });

        // [5d] fetch every <script src> and inject as INLINE <script>
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
  // [6] REVEAL
  // ---------------------------------------------------------
  function reveal() {
    document.documentElement.style.visibility = 'visible';
  }

  // ---------------------------------------------------------
  // [7] RUN
  // ---------------------------------------------------------
  installFetchOverride();

  injectCSS()
    .then(injectHTML)
    .then(reveal)
    .catch(err => {
      console.error('[inhaler] failed:', err);
      reveal();
    });
})();