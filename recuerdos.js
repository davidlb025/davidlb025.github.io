(() => {
  const { t } = window.portfolioI18n;
  document.documentElement.classList.add('journey-js');
  const root=document.documentElement,sections=[...document.querySelectorAll('.memory-section')];
  const track=document.querySelector('.route-track'),nodes=[...track.querySelectorAll('i')];
  const reduced=matchMedia('(prefers-reduced-motion:reduce)');
  let paused=reduced.matches,active=-1,scheduled=false,frame=0,last=0,time=0;
  const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
  const camera=[{zoom:1.05,x:50,y:50},{zoom:1.23,x:41,y:58},{zoom:1.12,x:68,y:48},{zoom:1.29,x:57,y:63},{zoom:1.08,x:55,y:51},{zoom:1.02,x:50,y:50}];
  function update(){
    const reading=innerHeight*.49;let selected=0;
    sections.forEach((section,index)=>{
      const r=section.getBoundingClientRect();
      if(r.top<reading)selected=index;
      const centerDistance=Math.abs((r.top+r.height*.48)-innerHeight*.5);
      const opacity=reduced.matches?1:clamp(1-(centerDistance-innerHeight*.3)/(innerHeight*.75),.12,1);
      section.style.setProperty('--scene-opacity',String(opacity));
    });
    const y=scrollY,max=document.documentElement.scrollHeight-innerHeight,progress=max>0?clamp(y/max,0,1):0;
    root.style.setProperty('--progress',progress.toFixed(5));
    root.style.setProperty('--portal',String(clamp(1-y/(innerHeight*.85),0,1)));
    track.setAttribute('aria-valuenow',String(Math.round(progress*100)));
    if(selected!==active){active=selected;document.getElementById('route-moment').textContent=sections[selected].dataset.moment;nodes.forEach((node,i)=>node.classList.toggle('visited',i<=selected));}
    const positions=sections.map(s=>s.offsetTop);
    let from=0;for(let i=0;i<positions.length;i++)if(y>=positions[i])from=i;
    const to=Math.min(from+1,camera.length-1),span=(positions[to]-positions[from])||1,t=clamp((y-positions[from])/span,0,1),mix=t*t*(3-2*t);
    const a=camera[from],b=camera[to];
    root.style.setProperty('--zoom',String(paused?1.06:a.zoom+(b.zoom-a.zoom)*mix));
    root.style.setProperty('--photo-x',(paused?50:a.x+(b.x-a.x)*mix)+'%');root.style.setProperty('--photo-y',(paused?50:a.y+(b.y-a.y)*mix)+'%');
  }
  addEventListener('scroll',()=>{if(!scheduled){scheduled=true;requestAnimationFrame(()=>{update();scheduled=false;});}},{passive:true});
  addEventListener('resize',()=>{resize();update();},{passive:true});
  const motion=document.getElementById('memory-motion');
  function setPaused(value){paused=value;document.body.classList.toggle('motion-paused',value);motion.setAttribute('aria-pressed',String(value));motion.setAttribute('aria-label',t(value?'Reanudar atmósfera':'Pausar atmósfera'));update();requestFrame();}
  motion.addEventListener('click',()=>setPaused(!paused));reduced.addEventListener('change',e=>setPaused(e.matches));
  document.getElementById('restart-memory').addEventListener('click',()=>{window.scrollTo({top:0,behavior:reduced.matches?'instant':'smooth'});document.getElementById('title-intro').tabIndex=-1;document.getElementById('title-intro').focus({preventScroll:true});});
  const a=document.getElementById('input-a'),b=document.getElementById('input-b'),circuit=document.querySelector('.logic-circuit');
  function toggle(input,name){const on=input.getAttribute('aria-pressed')!=='true';input.setAttribute('aria-pressed',String(on));input.setAttribute('aria-label',t(on?'Entrada {name}, encendida':'Entrada {name}, apagada',{name}));input.querySelector('strong').textContent=on?'1':'0';const aOn=a.getAttribute('aria-pressed')==='true',bOn=b.getAttribute('aria-pressed')==='true';circuit.classList.toggle('a-on',aOn);circuit.classList.toggle('b-on',bOn);circuit.classList.toggle('output-on',aOn&&bOn);document.getElementById('logic-output').textContent=t('SALIDA {value}',{value:aOn&&bOn?'1':'0'});}
  a.addEventListener('click',()=>toggle(a,'A'));b.addEventListener('click',()=>toggle(b,'B'));
  const dialog=document.getElementById('sources-dialog'),credits=document.getElementById('memory-credits');
  credits.addEventListener('click',()=>dialog.showModal());document.getElementById('close-sources').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>credits.focus({preventScroll:true}));dialog.addEventListener('click',e=>{const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();});
  let audio,master,enabled=false;const sound=document.getElementById('memory-sound');
  function createAudio(){const API=window.AudioContext||window.webkitAudioContext;if(!API)throw new Error();audio=new API();master=audio.createGain();master.gain.value=0;master.connect(audio.destination);[55,82.4069,110,164.8138].forEach((f,i)=>{const oscillator=audio.createOscillator(),gain=audio.createGain();oscillator.type='sine';oscillator.frequency.value=f;oscillator.detune.value=i%2?3:-3;gain.gain.value=i===0?.18:.055;oscillator.connect(gain);gain.connect(master);oscillator.start();});}
  sound.addEventListener('click',async()=>{sound.disabled=true;try{if(!audio)createAudio();await audio.resume();enabled=!enabled;master.gain.setTargetAtTime(enabled?.15:0,audio.currentTime,.5);sound.setAttribute('aria-pressed',String(enabled));sound.setAttribute('aria-label',t(enabled?'Desactivar sonido ambiental':'Activar sonido ambiental'));sound.querySelector('span').textContent=t(enabled?'SONIDO ON':'SONIDO OFF');}catch{sound.setAttribute('aria-label',t('Sonido no disponible en este navegador'));}finally{sound.disabled=false;}});
  const canvas=document.getElementById('memory-atmosphere'),ctx=canvas.getContext('2d');let width=innerWidth,height=innerHeight;
  function resize(){width=innerWidth;height=innerHeight;const d=Math.min(devicePixelRatio||1,1.4);canvas.width=width*d;canvas.height=height*d;ctx.setTransform(d,0,0,d,0,0);}
  function requestFrame(){if(!frame&&!document.hidden)frame=requestAnimationFrame(draw);}
  function draw(now){frame=0;const dt=last?Math.min((now-last)/1000,.05):0;last=now;if(!paused)time+=dt;ctx.clearRect(0,0,width,height);if(!paused){for(let i=0;i<30;i++){const x=((i*.381966+time*.002*(1+i%3))%1)*width,y=((i*.618034-time*.0017*(1+i%4)+100)%1)*height;ctx.beginPath();ctx.fillStyle=`rgba(244,214,159,${.07+(Math.sin(time*.4+i)+1)*.045})`;ctx.arc(x,y,.4+(i%3)*.3,0,Math.PI*2);ctx.fill();}requestFrame();}}
  document.addEventListener('visibilitychange',()=>{if(document.hidden){if(frame)cancelAnimationFrame(frame);frame=0;if(audio)audio.suspend().catch(()=>{});}else{last=0;requestFrame();if(audio&&enabled)audio.resume().catch(()=>{});}});
  function updateLanguage() {
    sound.setAttribute('aria-label',t(enabled?'Desactivar sonido ambiental':'Activar sonido ambiental'));
    sound.querySelector('span').textContent=t(enabled?'SONIDO ON':'SONIDO OFF');
    [a,b].forEach((input,index)=>input.setAttribute('aria-label',t(input.getAttribute('aria-pressed')==='true'?'Entrada {name}, encendida':'Entrada {name}, apagada',{name:index?'B':'A'})));
    document.getElementById('logic-output').textContent=t('SALIDA {value}',{value:a.getAttribute('aria-pressed')==='true'&&b.getAttribute('aria-pressed')==='true'?'1':'0'});
    active=-1;
    setPaused(paused);
  }
  document.addEventListener('portfolio-language',updateLanguage);
  updateLanguage();
  resize();setPaused(paused);update();requestFrame();
})();
