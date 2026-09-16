(() => {
  const footer = document.querySelector('.printing-press');
  if (!footer || !Element.prototype.animate) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const button = footer.querySelector('.press-toggle');
  let visible = false, paused = false;
  const paper = [
    {transform:'translateX(0)',opacity:0,offset:0},
    {transform:'translateX(0)',opacity:1,offset:.08},
    {transform:'translateX(280px)',opacity:1,offset:.7},
    {transform:'translateX(280px)',opacity:1,offset:.9},
    {transform:'translateX(280px)',opacity:0,offset:1}
  ];
  const animations = ['.press-sheet','.press-imprint'].map(selector => footer.querySelector(selector).animate(paper,{duration:8000,iterations:Infinity,easing:'linear'}));
  animations.push(footer.querySelector('.press-wheel').animate([{transform:'rotate(0deg)'},{transform:'rotate(360deg)'}],{duration:8000,iterations:Infinity}));
  function sync() {
    button.hidden = reduced.matches;
    animations.forEach(animation => {
      if(reduced.matches) {animation.pause();animation.currentTime=6000;}
      else if(visible && !document.hidden && !paused) animation.play();
      else animation.pause();
    });
  }
  button.addEventListener('click',()=>{
    paused=!paused;
    button.setAttribute('aria-pressed',String(paused));
    button.setAttribute('aria-label',paused?'Play printing press':'Pause printing press');
    footer.querySelector('.press-control-label').textContent=paused?'Play press':'Pause press';
    sync();
  });
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();},{threshold:.1}).observe(footer);
  document.addEventListener('visibilitychange',sync);
  reduced.addEventListener('change',sync);
  sync();
})();
