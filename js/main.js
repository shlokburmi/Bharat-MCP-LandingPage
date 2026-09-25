const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp=(v,a,b)=>Math.min(Math.max(v,a),b);
/* kolam patterns */
function rng(seed){let s=seed*9301+49297;return()=>{s=(s*9301+49297)%233280;return s/233280}}
function kolamCells(seed,density){
  const N=13,c=6,r=rng(seed),cells=[],half=[];
  for(let y=0;y<=c;y++){half[y]=[];for(let x=0;x<=y;x++){half[y][x]=null}}
  for(let y=0;y<=c;y++)for(let x=0;x<=y;x++){
    const d=Math.max(x,y),m=x+y;let on=false,shape='s';
    if(x===0&&y===0){on=true}else if(x===0||y===0)on=d<=1||(m%2===0&&r()<.9);else if(d===c)on=(m%2===0)&&(r()<density*1.3);else if(x===y){on=r()<density*1.7;shape='d'}else{on=r()<density*.75;shape=r()<.35?'d':'s'}
    half[y][x]=on?shape:null;
  }
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){const dx=Math.abs(x-c),dy=Math.abs(y-c),a=Math.max(dx,dy),b=Math.min(dx,dy),s=half[a][b];if(s)cells.push([x,y,s])}
  return cells;
}
function kolamSVG(seed,density){let s='';kolamCells(seed,density).forEach(([x,y,t])=>{s+=t==='s'?`<rect x="${x+.06}" y="${y+.06}" width=".88" height=".88"/>`:`<rect x="${x+.06}" y="${y+.06}" width=".88" height=".88" transform="rotate(45 ${x+.5} ${y+.5})"/>`});return s}
document.querySelectorAll('[data-kolam]').forEach(el=>{
  const [color,op,across,seed]=el.dataset.kolam.split(',');
  const svg=`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 15 15' fill='${color}' fill-opacity='${op}'><g transform='translate(1 1)'>${kolamSVG(+seed,.3)}</g></svg>`;
  el.style.backgroundImage="url(\"data:image/svg+xml,"+encodeURIComponent(svg).replace(/'/g,'%27')+"\")";
  el.style.backgroundSize=(100/+across)+'% auto';el.style.backgroundRepeat='repeat';
});

/* reveals */
const io=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting){const el=e.target,sibs=[...el.parentElement.children].filter(c=>c.classList.contains('rv')),i=sibs.indexOf(el);el.style.transitionDelay=(i>0?Math.min(i*90,450):0)+'ms';el.classList.add('in');io.unobserve(el)}})},{threshold:.05,rootMargin:'0px 0px -6% 0px'});
document.querySelectorAll('.rv').forEach(el=>io.observe(el));
function once(sel,cls,th){const el=document.querySelector(sel);if(!el)return;new IntersectionObserver((es,o)=>{es.forEach(e=>{if(e.isIntersecting){el.classList.add(cls);o.disconnect()}})},{threshold:th||.4}).observe(el)}
once('#stage','in',innerWidth<=700?.1:.35);once('#wa','in',innerWidth<=700?.2:.5);

/* pinned story */
const story=document.getElementById('story'),caps=[...document.querySelectorAll('.cap')],scs=[...document.querySelectorAll('.sc')],hint=document.querySelector('.hint'),tr3=document.getElementById('tr3');
const wins=[[0,.03,.28,.34],[.34,.4,.62,.68],[.68,.74,1.2,1.3]];
function win(p,a,b,c,d){if(p<a)return 0;if(p<b)return (p-a)/(b-a);if(p<c)return 1;if(p<d)return 1-(p-c)/(d-c);return 0}
function storyFx(){
  if(innerWidth<=900){scs.forEach((s,i)=>s.classList.toggle('on',i===2));tr3.classList.add('on');return}
  const total=story.offsetHeight-innerHeight,p=clamp(-story.getBoundingClientRect().top/total,0,1);
  caps.forEach((c,i)=>{const w=wins[i],o=win(p,w[0],w[1],w[2],w[3]);c.style.opacity=o;c.style.transform='translateY('+((1-o)*14)+'px)'});
  const st=p<.34?0:p<.68?1:2;
  scs.forEach((s,i)=>s.classList.toggle('on',i===st));
  tr3.classList.toggle('on',p>.9);
  hint.style.opacity=p<.92?1:0;
}

/* counter */
const counter=document.getElementById('counter');let counted=false;if(innerWidth<=900){counted=true;counter.textContent='₹'+(+counter.dataset.to).toLocaleString('en-IN')}
new IntersectionObserver((es,o)=>{es.forEach(e=>{if(e.isIntersecting&&!counted){counted=true;const to=+counter.dataset.to,t0=performance.now();(function tick(t){const k=Math.min((t-t0)/1400,1),v=Math.round(to*(1-Math.pow(1-k,3)));counter.textContent='₹'+v.toLocaleString('en-IN');if(k<1)requestAnimationFrame(tick)})(t0);o.disconnect()}})},{threshold:.2}).observe(counter);

/* manifesto */
const mani=document.getElementById('mani'),mw=[...mani.querySelectorAll('.w')];
function maniFx(){const r=mani.getBoundingClientRect(),p=clamp((innerHeight*.85-r.top)/(innerHeight*.55),0,1),n=Math.round(p*mw.length);mw.forEach((w,i)=>w.classList.toggle('on',i<n))}

/* scroll master */
const nav=document.getElementById('nav'),prog=document.getElementById('progress');let tick=false;
function onScroll(){if(tick)return;tick=true;requestAnimationFrame(()=>{const y=scrollY,max=document.documentElement.scrollHeight-innerHeight;prog.style.transform='scaleX('+(max>0?y/max:0)+')';storyFx();maniFx();tick=false})}
addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',onScroll,{passive:true});onScroll();

/* 3D tilt */
if(!reduce&&matchMedia('(hover:hover)').matches){
  const ph=document.getElementById('phone'),wrap=document.getElementById('pwrap');
  wrap.addEventListener('pointermove',e=>{
    const r=wrap.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;
    ph.style.animation='none';ph.style.opacity=1;
    ph.style.transform='rotateY('+(-27+(x-.5)*36)+'deg) rotateX('+(9+(.5-y)*20)+'deg) rotateZ(-3deg) translateZ(20px)';
    ph.style.setProperty('--gx',(x*100)+'%');ph.style.setProperty('--gy',(y*100)+'%');
  });
  wrap.addEventListener('pointerleave',()=>{ph.style.transform='rotateY(-27deg) rotateX(9deg) rotateZ(-3deg)'});
}
