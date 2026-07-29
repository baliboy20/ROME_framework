// Friends on Bikes — launch countdown takeover (CR-003).
// Rebuilt against sponsor mock "Launch Countdown Banner.dc.html": a
// full-screen cinematic countdown (5..1, rotating imagery + taglines)
// resolving into the "opening for tours" reveal. Shows on every visit
// (sponsor directive 2026-07-28 — supersedes the earlier "once per
// browser" persistence) with a prominent Skip button so repeat visits
// and internal page navigation aren't forced to sit through the full
// sequence. No-JS-safe: site is fully readable without this running.
(function(){
  // Countdown steps: mock's stagger is 1.35s apart (0.4, 1.75, 3.1, 4.45, 5.8s).
  var STEPS=[
    {n:5,tag:'Five years riding these streets',img:'/en/img/img-tours-hero-cityscape.png',anim:'fob_zoom'},
    {n:4,tag:'Four routes, hand-drawn',img:'/en/img/img-tour-golden-hour-card.png',anim:'fob_wipe'},
    {n:3,tag:'Three friends, one idea',img:'/en/img/img-tour-hidden-city-card.png',anim:'fob_rise'},
    {n:2,tag:'Two wheels, no traffic',img:'/en/img/man-womam-stpauls.jpg',anim:'fob_focus'},
    {n:1,tag:'One London you\'ve never seen',img:'/en/img/img-about-founders-barbican.png',anim:'fob_split'}
  ];

  // Fonts loaded on demand — only when the takeover actually renders.
  var fontLink=document.createElement('link');
  fontLink.rel='stylesheet';
  fontLink.href='https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300&family=Jost:wght@300;400;500&display=swap';
  document.head.appendChild(fontLink);

  var overlay=document.createElement('div');
  overlay.className='launch';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');
  overlay.setAttribute('aria-label','Friends on Bikes is opening for tours');

  var slidesHtml=STEPS.map(function(s,i){
    var delay=(0.4+i*1.35).toFixed(2);
    return '<img class="slide" src="'+s.img+'" alt="" style="animation:'+s.anim+' 2.05s cubic-bezier(.33,0,.25,1) '+delay+'s both">';
  }).join('');

  var ringsHtml=STEPS.map(function(s,i){
    var delay=(0.4+i*1.35).toFixed(2);
    return '<div class="ring" style="animation-delay:'+delay+'s"></div>';
  }).join('');

  var numsHtml=STEPS.map(function(s,i){
    var delay=(0.4+i*1.35).toFixed(2);
    return '<div class="num" style="animation-delay:'+delay+'s">'+s.n+'</div>';
  }).join('');

  var tagsHtml=STEPS.map(function(s,i){
    var delay=(0.6+i*1.35).toFixed(2);
    return '<p style="animation-delay:'+delay+'s">'+s.tag+'</p>';
  }).join('');

  overlay.innerHTML =
    '<div class="shell">'+
      slidesHtml+
      '<div class="hero-final"><img src="/en/uploads/img-home-hero-barbican-cyclists.png" alt="Cyclists crossing the Millennium Bridge at golden hour"></div>'+
      '<div class="scrim"></div>'+
      '<div class="rings"><div class="ring-wrap">'+ringsHtml+numsHtml+'</div></div>'+
      '<div class="taglines"><div class="inner">'+tagsHtml+'</div></div>'+
      '<div class="content"><div class="inner">'+
        '<div class="waiting"><p>The waiting has finally stopped</p></div>'+
        '<div class="reveal">'+
          '<img src="/en/img/logo.webp" alt="Friends on Bikes">'+
          '<div class="reveal-text">'+
            '<h2>Friends on Bikes is opening for tours</h2>'+
            '<div class="rule"></div>'+
            '<p class="eyebrow-launch">Guided rides through London</p>'+
          '</div>'+
          '<a class="launch-cta" href="/en/book/">Book a free ride <span>&#8594;</span></a>'+
        '</div>'+
      '</div></div>'+
      '<div class="progress-track"><div class="progress-bar"></div></div>'+
      '<div class="brand-label"><span class="rule-mini"></span>Friends on Bikes &middot; London</div>'+
      '<button type="button" class="skip">Skip to Friends on Bikes <span>&#8594;</span></button>'+
      '<button type="button" class="close" aria-label="Close">&times;</button>'+
    '</div>';

  document.body.appendChild(overlay);

  function dismiss(){
    overlay.remove();
    document.removeEventListener('keydown',onKey);
  }
  function skipToEnd(){
    overlay.classList.add('launch--skip');
  }
  function onKey(e){ if(e.key==='Escape')dismiss(); }
  document.addEventListener('keydown',onKey);
  overlay.querySelector('.close').addEventListener('click',dismiss);
  overlay.querySelector('.skip').addEventListener('click',skipToEnd);
})();
