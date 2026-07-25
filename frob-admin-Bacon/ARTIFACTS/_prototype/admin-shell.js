// FOB admin console — shared shell (UXD-18) + UXC helpers. T2 prototype, vanilla JS.
var ADMIN_LABELS = {
  a3:'Deliverability', a4:'Owner alerts', a5:'Audit log', a6:'Publish & quality',
  a7:'New booking', a8:'Payments & refunds', a9:'Enquiries', a10:'Incidents', a11:'Hazard log',
  a12:'Add bike', a13:'Equipment', a14:'Fleet readiness', a15:'Flagged-bike', a16:'Compliance',
  a17:'Departure calendar', a18:'Scheduler', a19:'Booking browser', a20:'Bike allocation'
};
var ADMIN_PAGES = {
  a3:'admin-deliverability.html', a4:'admin-alerts.html', a5:'admin-audit.html', a6:'admin-publish-quality.html',
  a7:'admin-new-booking.html', a8:'admin-payments.html', a9:'admin-enquiries.html', a10:'admin-incidents.html',
  a11:'admin-hazard-log.html', a12:'admin-add-bike.html', a13:'admin-equipment.html', a14:'admin-fleet-readiness.html',
  a15:'admin-flagged-bike.html', a16:'admin-compliance.html', a17:'admin-calendar.html', a18:'admin-scheduler.html',
  a19:'admin-booking-browser.html', a20:'admin-bike-allocation.html'
};
var ADMIN_GROUPS = [
  ['Bookings & payments', ['a7','a8','a9']],
  ['Scheduling', ['a17','a18','a20','a19']],
  ['Alerts & records', ['a4','a3','a5']],
  ['Content', ['a6']],
  ['Safety', ['a10','a11']],
  ['Fleet & equipment', ['a14','a12','a13','a15','a16']]
];

function buildRailHTML(activeId){
  var html = '<aside class="admin-rail" id="rail">';
  html += '<div class="rail-head"><div class="rail-brand"><div class="wordmark serif">Friends on Bikes</div><div class="eyebrow">BACK OFFICE</div></div>' +
          '<button class="rail-toggle" id="railToggle" onclick="toggleRail()" title="Collapse menu">«</button></div>';
  html += '<nav class="nav-tree">';
  ADMIN_GROUPS.forEach(function(g){
    var title = g[0], ids = g[1];
    var hasActive = ids.indexOf(activeId) >= 0;
    html += '<div class="nav-group' + (hasActive ? ' has-active' : '') + '">';
    html += '<div class="nav-group-header" onclick="toggleGroup(this)"><span class="chevron">▾</span><span class="nav-group-title">' + title + '</span></div>';
    html += '<div class="nav-group-children">';
    ids.forEach(function(id){
      var active = id === activeId;
      html += '<a class="nav-item' + (active ? ' active' : '') + '" href="' + ADMIN_PAGES[id] + '" title="' + ADMIN_LABELS[id] + '">' +
              '<span class="code mono">' + id.toUpperCase() + '</span><span class="label">' + ADMIN_LABELS[id] + '</span></a>';
    });
    html += '</div></div>';
  });
  html += '</nav>';
  html += '<div class="rail-footer"><div class="avatar serif">W</div><div class="rail-footer-text"><div class="name">William</div><div class="role">Owner</div></div></div>';
  html += '</aside>';
  return html;
}

function buildTopbarHTML(){
  return '<div class="admin-topbar"><div class="ctx mono">PC / iMac &middot; wide-screen console</div>' +
    '<div class="who"><span>William &middot; Owner</span><button class="a-btn a-btn-secondary" onclick="doSignOut()">Sign out</button></div></div>';
}

function renderAdminShell(activeId, eyebrow, title, desc){
  var railMount = document.getElementById('rail-mount');
  if (railMount) railMount.outerHTML = buildRailHTML(activeId);
  var topbarMount = document.getElementById('topbar-mount');
  if (topbarMount) topbarMount.outerHTML = buildTopbarHTML();
  var eb = document.getElementById('page-eyebrow'); if (eb && eyebrow) eb.textContent = eyebrow;
  var pt = document.getElementById('page-title'); if (pt && title) pt.textContent = title;
  var pd = document.getElementById('page-desc'); if (pd && desc) pd.textContent = desc;
}

// UXD-18: rail collapse + per-group tree expand are client-only transients (UXC-STA-2)
function toggleRail(){
  var rail = document.getElementById('rail');
  var btn = document.getElementById('railToggle');
  var collapsed = rail.classList.toggle('collapsed');
  btn.textContent = collapsed ? '»' : '«';
  btn.title = collapsed ? 'Expand menu' : 'Collapse menu';
}
function toggleGroup(headerEl){
  var group = headerEl.closest('.nav-group');
  var closed = group.classList.toggle('closed');
  var chev = headerEl.querySelector('.chevron');
  chev.textContent = closed ? '▸' : '▾';
}

// UXC-NAV-2: sign-out is idempotent — always lands on the sign-in gate, never errors on repeat.
function doSignOut(){
  window.location.href = 'admin-signin.html';
}

// ---- Overlay helpers (UXC-MOD-3/4): read-only overlays dismiss freely and stack at most one level ----
function openOverlay(id){
  var el = document.getElementById(id);
  if (el) el.classList.remove('hidden');
}
function closeOverlay(id){
  var el = document.getElementById(id);
  if (el) el.classList.add('hidden');
}
document.addEventListener('keydown', function(e){
  if (e.key !== 'Escape') return;
  // close only the top-most free-dismiss overlay (never a blocking modal)
  var stack2 = document.querySelector('.overlay-scrim.stack-2:not(.hidden)');
  if (stack2 && !stack2.classList.contains('blocking')) { stack2.classList.add('hidden'); return; }
  var stack1 = document.querySelector('.overlay-scrim:not(.stack-2):not(.hidden)');
  if (stack1 && !stack1.classList.contains('blocking')) { stack1.classList.add('hidden'); }
});

// ---- Single-active filter chip groups (UXC-CMP-3) ----
function setActiveChip(groupEl, btnEl){
  groupEl.querySelectorAll('.chip').forEach(function(c){ c.classList.remove('active'); });
  btnEl.classList.add('active');
}
function setActiveTab(groupEl, btnEl, panelPrefix, key){
  groupEl.querySelectorAll('.tab-btn').forEach(function(c){ c.classList.remove('active'); });
  btnEl.classList.add('active');
  document.querySelectorAll('[data-panel^="' + panelPrefix + '"]').forEach(function(p){ p.classList.add('hidden'); });
  var panel = document.querySelector('[data-panel="' + panelPrefix + key + '"]');
  if (panel) panel.classList.remove('hidden');
}
