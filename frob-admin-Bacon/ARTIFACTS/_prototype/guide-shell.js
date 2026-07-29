// FOB guide app — shared header + step-progress helpers. T2 prototype, vanilla JS.
// Progress is a client-only transient for prototype purposes (localStorage), not a real entity state.
var GUIDE_STEP_IDS = ['g3','g4','g5','g6','g7','g8'];

function guideProgress(){
  try { return JSON.parse(localStorage.getItem('fob_guide_progress') || '{}'); }
  catch(e){ return {}; }
}
function markStepDone(id){
  var p = guideProgress(); p[id] = true;
  localStorage.setItem('fob_guide_progress', JSON.stringify(p));
}
function isStepDone(id){ return !!guideProgress()[id]; }
function resetGuideProgress(){ localStorage.removeItem('fob_guide_progress'); }
function outstandingCount(){
  var p = guideProgress(); var n = 0;
  GUIDE_STEP_IDS.slice(0, 5).forEach(function(id){ if (!p[id]) n++; }); // G3-G7 gate G8
  return n;
}

function renderGuideHeader(backHref, eyebrow, title){
  var mount = document.getElementById('header-mount');
  if (!mount) return;
  var backHtml = backHref ? '<a class="back" href="' + backHref + '">&larr; Playbook</a>' : '';
  mount.outerHTML =
    '<div class="guide-header">' + backHtml +
    '<div class="eyebrow">' + eyebrow + '</div>' +
    '<h1 class="page-title" style="font-size:1.6rem">' + title + '</h1>' +
    '<div class="identity-row"><span class="identity-chip mono">DEV-EMMA-01</span><span class="identity-name">Emma &middot; guide</span></div>' +
    '</div>';
}
