// Friends on Bikes — Flutter Web island loader.
// Mounts the booking-flow island (flutter/build/web) into the
// .island-mount[data-island="booking"] DOM node on pages that carry one.
// SEO-first (TDR-13): if JS is disabled or the island bundle fails to load,
// the static .island-noscript content inside the mount stays visible —
// content pages never depend on this script to be readable.
(function () {
  'use strict';

  function mountIsland(container) {
    var islandName = container.getAttribute('data-island');
    if (!islandName) return;

    // base-href for the island build, e.g. /book/ for the booking flow.
    var base = container.getAttribute('data-island-base') || '/book/';

    var loaderScript = document.createElement('script');
    loaderScript.src = base + 'flutter_bootstrap.js';
    loaderScript.async = true;
    loaderScript.onload = function () {
      container.setAttribute('data-hydrated', 'true');
    };
    loaderScript.onerror = function () {
      // Leave the no-script fallback content visible; do not blank the page.
      console.error('[fob] island failed to load: ' + islandName);
    };
    document.body.appendChild(loaderScript);
  }

  document.addEventListener('DOMContentLoaded', function () {
    var mounts = document.querySelectorAll('.island-mount[data-island]');
    mounts.forEach(mountIsland);
  });
})();
