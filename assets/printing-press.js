(() => {
  const footer = document.querySelector('.printing-press');
  if (!footer || !Element.prototype.animate) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const button = footer.querySelector('.press-toggle');
  let visible = false, paused = false;
  // A repeat advances exactly one printed page: no fade or reset flash.
  // At the bend, outgoing coordinate 0 follows incoming coordinate 254.
  const animations = [['.press-ribbon-in',0],['.press-ribbon-out',-254]].map(([selector,phase]) =>
    footer.querySelector(selector).animate([
      {transform:`translateY(${phase}px)`},
      {transform:`translateY(${phase+112}px)`}
    ],{duration:4200,iterations:Infinity,easing:'linear'})
  );
  animations.push(footer.querySelector('.press-wheel').animate([{transform:'rotate(0deg)'},{transform:'rotate(360deg)'}],{duration:4200,iterations:Infinity,easing:'linear'}));
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
