// Friends on Bikes — cookie-consent banner (shared across the en/ static site).
// Privacy-first: strictly-necessary cookies always on; analytics OFF until the
// visitor explicitly accepts. Choice persisted in localStorage; no third-party
// script loads before consent. Referenced by /en/privacy-policy.html.
(function () {
  'use strict';
  var KEY = 'fob_consent_v1'; // stored value: "accepted" | "declined"

  function stored() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function save(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }

  // Analytics hook — only called after explicit acceptance. Intentionally a
  // no-op stub: drop your GA4 (or other) loader here when you have an ID.
  function enableAnalytics() {
    if (window.__fobAnalyticsLoaded) return;
    window.__fobAnalyticsLoaded = true;
    // e.g. load gtag.js here once a measurement ID exists.
  }

  var CSS = [
    '.fob-consent{position:fixed;left:0;right:0;bottom:0;z-index:9999;',
    'background:#14130f;color:rgba(246,244,238,.82);',
    "font-family:'Instrument Sans','Helvetica Neue',Arial,sans-serif;",
    'box-shadow:0 -1px 0 rgba(246,244,238,.1);',
    'transform:translateY(110%);transition:transform .45s cubic-bezier(.16,1,.3,1)}',
    '.fob-consent.in{transform:none}',
    '.fob-consent .inner{max-width:1200px;margin:0 auto;padding:20px 40px;',
    'display:flex;align-items:center;gap:24px;flex-wrap:wrap;justify-content:space-between}',
    '.fob-consent p{margin:0;font-size:14px;line-height:1.6;max-width:720px}',
    '.fob-consent a{color:#f6f4ee;text-decoration:underline;text-underline-offset:2px}',
    '.fob-consent .btns{display:flex;gap:12px;flex-shrink:0}',
    '.fob-consent button{font-family:inherit;font-size:12px;font-weight:600;letter-spacing:.1em;',
    'text-transform:uppercase;padding:12px 24px;border-radius:0;cursor:pointer;border:1px solid transparent;transition:filter .2s ease,background .2s ease}',
    '.fob-consent .decline{background:transparent;color:rgba(246,244,238,.85);border-color:rgba(246,244,238,.35)}',
    '.fob-consent .decline:hover{background:rgba(246,244,238,.08)}',
    '.fob-consent .accept{background:#3f6b3f;color:#fff}',
    '.fob-consent .accept:hover{filter:brightness(1.08)}',
    '@media(max-width:700px){.fob-consent .inner{padding:18px 24px}.fob-consent .btns{width:100%}.fob-consent button{flex:1}}'
  ].join('');

  function build() {
    var style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    var bar = document.createElement('div');
    bar.className = 'fob-consent';
    bar.setAttribute('role', 'dialog');
    bar.setAttribute('aria-label', 'Cookie consent');
    bar.innerHTML =
      '<div class="inner">' +
        '<p>We use strictly necessary cookies to run this site, and optional analytics cookies to understand how it’s used — only if you accept. See our <a href="/en/privacy-policy.html">Privacy Policy</a>.</p>' +
        '<div class="btns">' +
          '<button type="button" class="decline">Decline</button>' +
          '<button type="button" class="accept">Accept</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(bar);
    requestAnimationFrame(function () { requestAnimationFrame(function () { bar.classList.add('in'); }); });

    function close() { bar.classList.remove('in'); setTimeout(function () { bar.remove(); }, 450); }
    bar.querySelector('.accept').addEventListener('click', function () { save('accepted'); enableAnalytics(); close(); });
    bar.querySelector('.decline').addEventListener('click', function () { save('declined'); close(); });
  }

  function init() {
    var choice = stored();
    if (choice === 'accepted') { enableAnalytics(); return; } // honour prior consent
    if (choice === 'declined') { return; }                    // respect prior decline
    build();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
