// Friends on Bikes — pre-launch announcement topsheet (CR-003).
// Shows once per browser (localStorage, not a cookie — no consent.js
// interaction, same "strictly necessary" category as the cookie banner
// itself). No-JS-safe: the site is fully readable without this running.
(function(){
  var KEY='fob_prelaunch_dismissed';
  if(localStorage.getItem(KEY))return;

  var bar=document.createElement('div');
  bar.className='topsheet';
  bar.setAttribute('role','region');
  bar.setAttribute('aria-label','Pre-launch announcement');
  bar.innerHTML=
    '<span class="msg"><strong>Opening Autumn 2026.</strong> Our routes are currently being trialled — apply to join us as a guest on a free preview ride.</span>'+
    '<a class="apply" href="/en/book/">Apply to ride →</a>'+
    '<button type="button" class="dismiss" aria-label="Dismiss announcement">×</button>';

  var skip=document.querySelector('.skip-link');
  if(skip&&skip.nextSibling){document.body.insertBefore(bar,skip.nextSibling);}
  else{document.body.insertBefore(bar,document.body.firstChild);}

  function setHeight(){
    document.documentElement.style.setProperty('--banner-h',bar.offsetHeight+'px');
  }
  setHeight();
  window.addEventListener('resize',setHeight,{passive:true});

  bar.querySelector('.dismiss').addEventListener('click',function(){
    localStorage.setItem(KEY,'1');
    document.documentElement.style.setProperty('--banner-h','0px');
    bar.remove();
    window.removeEventListener('resize',setHeight);
  });
})();
