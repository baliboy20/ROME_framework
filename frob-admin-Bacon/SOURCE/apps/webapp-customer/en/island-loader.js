// Friends on Bikes — Flutter Web island loader.
// Mounts the booking + payment island (flutter/build/web) *inside* the
// .island-mount[data-island="booking"] element, so the host page's themed
// nav/footer stay visible around it (TDR-13). It scopes the Flutter engine to
// the container via `hostElement` rather than letting Flutter take the whole
// viewport, and reads the generated buildConfig from flutter_bootstrap.js so it
// keeps working across island rebuilds.
//
// SEO-first: if JS is off, the <noscript> fallback inside the mount stays
// visible — content pages never depend on this script to be readable.
(function () {
  'use strict';

  function extractBuildConfig(text) {
    // flutter_bootstrap.js contains: _flutter.buildConfig = { ... };\n_flutter.loader.load(
    var m = text.match(/_flutter\.buildConfig\s*=\s*([\s\S]*?);?\s*\n\s*_flutter\.loader\.load/);
    if (!m) return null;
    try { return JSON.parse(m[1]); } catch (e) { return null; }
  }

  function mountIsland(container) {
    if (!container.getAttribute('data-island')) return;
    var base = container.getAttribute('data-island-base') || '/en/book/flutter/';

    var flutterJs = document.createElement('script');
    flutterJs.src = base + 'flutter.js';
    flutterJs.async = true;
    flutterJs.onerror = function () {
      // Leave the fallback content visible; never blank the page.
      console.error('[fob] island engine (flutter.js) failed to load');
    };
    flutterJs.onload = function () {
      if (!window._flutter || !_flutter.loader) {
        console.error('[fob] _flutter.loader unavailable after flutter.js load');
        return;
      }
      fetch(base + 'flutter_bootstrap.js')
        .then(function (r) { return r.text(); })
        .then(function (txt) {
          _flutter.buildConfig = extractBuildConfig(txt) || {
            builds: [{ compileTarget: 'dart2js', renderer: 'canvaskit', mainJsPath: 'main.dart.js' }]
          };

          // The host page (/en/book/) has no <base href>, so without this the
          // engine resolves main.dart.js/assets against it and 404s. entrypointBaseUrl
          // is the single knob that fixes the entrypoint AND asset bundle — do NOT
          // also absolutise mainJsPath or the base gets prepended twice.
          // hostElement scopes rendering into `container` (not <body>);
          // canvasKitBaseUrl serves the locally-built CanvasKit rather than a CDN.
          var engineConfig = {
            hostElement: container,
            entrypointBaseUrl: base,
            canvasKitBaseUrl: base + 'canvaskit/'
          };
          _flutter.loader.load({
            config: engineConfig,
            onEntrypointLoaded: function (engineInitializer) {
              engineInitializer
                .initializeEngine(engineConfig)
                .then(function (appRunner) { return appRunner.runApp(); })
                .then(function () { container.setAttribute('data-hydrated', 'true'); })
                .catch(function (e) { console.error('[fob] island engine init failed', e); });
            }
          });
        })
        .catch(function (e) { console.error('[fob] island buildConfig load failed', e); });
    };
    document.body.appendChild(flutterJs);
  }

  document.addEventListener('DOMContentLoaded', function () {
    var mounts = document.querySelectorAll('.island-mount[data-island]');
    mounts.forEach(mountIsland);
  });
})();
