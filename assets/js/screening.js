'use strict';

(function () {
  // ---- login gate (from main project) ----
  var session = null;
  try { session = JSON.parse(localStorage.getItem('mindcursor_session') || 'null'); } catch (e) {}
  if (!session) { location.href = 'signup.html'; return; }
/* MindCursor screening quiz — wpkoi-style UI (ported from approved sample). — wpkoi hero (tilted collage + mega glitch headline + terminal),
   centered flow screens, white result, no X/Y readout. */
var OPTS=['Definitely agree','Slightly agree','Slightly disagree','Definitely disagree'];
// trait: +1 => agreeing indicates trait, -1 => disagreeing indicates trait
var BANK = {
  'teens': { label: '12\u201318', questions: [
    ['I find it hard to make new friends.', 1],
    ['I prefer to do things the same way every time.', 1],
    ['I notice small sounds or details that others miss.', 1],
    ['I find small talk difficult.', 1],
    ['I get so focused on my interests that I lose track of time.', 1],
    ['I find it easy to understand what others are feeling.', -1],
    ['I like meeting new people.', -1],
    ['I find unexpected changes in plans upsetting.', 1],
    ['I prefer to be alone rather than with a group.', 1],
    ['I find it hard to tell when someone is joking.', 1] ] },
  'young': { label: '18\u201330', questions: [
    ['I find social situations confusing or exhausting.', 1],
    ['I have strong routines that I like to follow.', 1],
    ['I am sensitive to lights, sounds, or textures.', 1],
    ['I find it hard to start conversations.', 1],
    ['I can spend hours on my special interests.', 1],
    ['I easily read other people\u2019s body language.', -1],
    ['I enjoy parties and gatherings.', -1],
    ['Unexpected changes throw me off.', 1],
    ['I prefer written messages over phone calls.', 1],
    ['I take things literally more often than others do.', 1] ] },
  'adults': { label: '30+', questions: [
    ['Social gatherings leave me feeling drained.', 1],
    ['I rely on routines to get through my day.', 1],
    ['Certain sounds, lights, or textures bother me a lot.', 1],
    ['I find workplace small talk difficult.', 1],
    ['I have deep, focused interests.', 1],
    ['I find it easy to tell what someone means, not just what they say.', -1],
    ['I make friends easily.', -1],
    ['I get upset when my plans change suddenly.', 1],
    ['I need alone time to recharge after being social.', 1],
    ['People tell me I miss social cues.', 1] ] }
};
var GROUPS=[
 {key:'teens',n:'01',big:'12\u201318',sub:'Teens'},
 {key:'young',n:'02',big:'18\u201330',sub:'Young adults'},
 {key:'adults',n:'03',big:'30+',sub:'Adults'}
];
var stage=document.getElementById('stage');
var state={group:null,qi:0,answers:[]};
function el(h){var d=document.createElement('div');d.innerHTML=h;return d.firstElementChild;}

(function(){
  var t='AUTISM SCREENING <span style="color:#ff2e1f">\u25a0</span> 10 QUESTIONS <span style="color:#ff2e1f">\u25a0</span> AI-ASSISTED <span style="color:#ff2e1f">\u25a0</span> PRELIMINARY ONLY <span style="color:#ff2e1f">\u25a0</span> NOT A DIAGNOSIS <span style="color:#ff2e1f">\u25a0</span> ';
  var _tk=document.getElementById('tk');if(_tk)_tk.innerHTML=t+t;
})();
function setP(p){document.getElementById('cp').textContent=String(Math.round(p*100)).padStart(3,'0')+'%';}

function scramble(elm,text,dur){
  dur=dur||650;
  var glyphs='\u2588\u2593\u2592\u2591<>/\\|*#+-=',len=text.length,t0=performance.now();
  function fr(t){
    var p=Math.min(1,(t-t0)/dur),rev=Math.floor(p*len),out='';
    for(var i=0;i<len;i++){var ch=text[i];out+=(ch===' '||i<rev)?ch:glyphs[(Math.random()*glyphs.length)|0];}
    elm.textContent=out;
    if(p<1)requestAnimationFrame(fr);else elm.textContent=text;
  }
  requestAnimationFrame(fr);
  setTimeout(function(){elm.textContent=text;},dur+500);
}
/* scatter-assemble: letters fly in and lock into words */
function scatterText(elm,text,delay){
  delay=delay||0;
  elm.innerHTML='';
  var idx=0;
  text.split(' ').forEach(function(w){
    var ws=document.createElement('span');
    ws.style.display='inline-block';ws.style.whiteSpace='nowrap';
    Array.prototype.forEach.call(w,function(ch){
      var s=document.createElement('span');
      s.textContent=ch;s.style.display='inline-block';
      var dx=(Math.random()-0.5)*520,dy=(Math.random()-0.5)*380,r=(Math.random()-0.5)*170;
      s.style.transform='translate('+dx+'px,'+dy+'px) rotate('+r+'deg)';
      s.style.opacity='0';ws.appendChild(s);
      var my=idx++;
      setTimeout(function(){
        s.style.transition='transform .65s cubic-bezier(.22,1,.36,1),opacity .45s ease';
        s.style.transform='translate(0,0) rotate(0deg)';s.style.opacity='1';
      },delay+90+my*20);
    });
    elm.appendChild(ws);elm.appendChild(document.createTextNode(' '));
  });
}
/* fit question to exactly one line */
function fitLine(elm){
  if(!elm)return;
  elm.style.whiteSpace='nowrap';elm.style.maxWidth='96%';
  var max=elm.parentElement.clientWidth*0.98,fs=64,guard=0;
  elm.style.fontSize=fs+'px';
  while(elm.scrollWidth>max&&fs>12&&guard<40){fs-=2;elm.style.fontSize=fs+'px';guard++;}
}
if(document.fonts&&document.fonts.ready){
  document.fonts.ready.then(function(){fitLine(document.querySelector('#qh'));});
}
/* video choreography: cards start STACKED in a pile, then fan out to grid slots */
function stackAndFan(cards,grid){
  var gr=grid.getBoundingClientRect();
  var gcx=gr.left+gr.width/2,gcy=gr.top+gr.height/2;
  var data=cards.map(function(c,i){
    var r=c.getBoundingClientRect();
    return {c:c,
      dx:(r.left+r.width/2)-gcx,dy:(r.top+r.height/2)-gcy,
      rot:(Math.random()*16-8),jx:(Math.random()*30-15),jy:(Math.random()*30-15)};
  });
  data.forEach(function(d,i){
    d.c.style.transition='none';
    d.c.style.transform='translate('+(-d.dx+d.jx)+'px,'+(-d.dy+d.jy)+'px) rotate('+d.rot+'deg) scale(.96)';
    d.c.style.opacity='1';d.c.style.zIndex=10+i;
  });
  void grid.offsetWidth;
  data.forEach(function(d,i){
    setTimeout(function(){
      d.c.style.transition='transform .8s cubic-bezier(.22,1,.36,1)';
      d.c.style.transform='translate(0,0) rotate(0deg) scale(1)';
    },60+i*110);
    setTimeout(function(){
      d.c.style.transition='';d.c.style.transform='';d.c.style.opacity='';d.c.style.zIndex='';
    },1150+i*110);
  });
}
/* exit: cards fly outward in different directions + fade, letters scatter */
function scatterOut(root,meas,done){
  var gr=meas.getBoundingClientRect();
  var gcx=gr.left+gr.width/2,gcy=gr.top+gr.height/2;
  meas.querySelectorAll('.wp-card').forEach(function(c){
    var r=c.getBoundingClientRect();
    var vx=(r.left+r.width/2)-gcx,vy=(r.top+r.height/2)-gcy;
    var m=330/Math.max(1,Math.hypot(vx,vy));
    c.style.transition='transform .5s cubic-bezier(.55,.06,.75,0),opacity .4s ease';
    c.style.transform='translate('+(vx*m)+'px,'+(vy*m-70)+'px) rotate('+((Math.random()*44)-22)+'deg)';
    c.style.opacity='0';
  });
  root.querySelectorAll('#qh span span').forEach(function(s){
    var dx=(Math.random()-0.5)*700,dy=(Math.random()-0.5)*460,r=(Math.random()-0.5)*190;
    s.style.transition='transform .45s cubic-bezier(.55,.06,.75,0),opacity .35s ease';
    s.style.transform='translate('+dx+'px,'+dy+'px) rotate('+r+'deg)';
    s.style.opacity='0';
  });
  setTimeout(done,580);
}
function sweep(mid){
  var s=document.getElementById('sweep');
  s.classList.remove('run');void s.offsetWidth;s.classList.add('run');
  setTimeout(mid,260);
}
function show(html,cls){
  stage.innerHTML='';
  var s=el('<div class="screen'+(cls?' '+cls:'')+'">'+html+'</div>');
  stage.appendChild(s);return s;
}

/* ---------- HERO ---------- */
function showHero(){
  setP(0);
  var s=show('<div class="hero-fg">'+
    '<div class="tlabel"><span class="h">#</span> MINDCURSOR — <b>AUTISM SCREENING</b></div>'+
    '<div class="kick"><span class="sq"></span><div class="kt">10 QUESTIONS.<br>READY TO USE.</div></div>'+
    '<h1 class="mega"><span class="r">SCREEN</span><span class="w">.</span><span class="r">!</span><span class="w">#</span><span class="w">ING</span></h1>'+
    '</div>'+
    '<div class="term"><div class="tgrid"><div class="tmain">'+
    '<div class="tr"><svg class="globe" viewBox="0 0 24 24" fill="none" stroke="#f5f5f5" stroke-width="1.4"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14 0 18M12 3c-3 3.5-3 14 0 18"/></svg><span>SYSTEM UPTIME: <span id="up">3061D 06H 22M 15S</span></span></div>'+
    '<div class="tr"><span>STATUS: ONLINE <span class="rd">\u25cf</span> &nbsp;BUILD: STABLE</span></div>'+
    '<div class="tr"><span>AVAILABLE WORLDWIDE</span></div>'+
    '</div><div class="vert">MINDCURSOR</div></div></div>'+
    '<div class="hashtags"><span>#SCREENING</span><span>#AUTISM</span><span>#AWARENESS</span></div>'+
    '<div class="hero-cta"><button class="cbtn" id="h-start">START SCREENING \u2192</button></div>',
    'hero');
  s.insertAdjacentHTML('afterbegin','<div class="herobg"></div><div class="hero-shade"></div>');
  /* live uptime */
  var up=s.querySelector('#up'),sec=15;
  setInterval(function(){sec++;if(sec>59){sec=0;}
    up.textContent='3061D 06H 22M '+String(sec).padStart(2,'0')+'S';},1000);
  s.querySelector('#h-start').addEventListener('click',function(){
    state.qi=0;state.answers=[];sweep(showAge);
  });
}

/* ---------- AGE (centered) ---------- */
function showAge(){
  setP(0);
  var cards=GROUPS.map(function(g,i){
    return '<button class="card" data-g="'+g.key+'"><div class="cnum"><span class="sq"></span>'+g.n+'</div>'+
      '<div class="cbig">'+g.big+'</div><div class="csub">'+g.sub+'</div>'+
      '<div class="cgo">SELECT <span class="arr">\u2192</span></div></button>';
  }).join('');
  var s=show('<div class="tlabel"><span class="h">#</span> STEP 01 — <b>CHOOSE AGE GROUP</b></div>'+
    '<h1 class="disp" id="ah">SELECT YOUR RANGE.</h1>'+
    '<div class="cards">'+cards+'</div>','center');
  var h=s.querySelector('#ah');scramble(h,h.textContent,700);
  s.querySelectorAll('.card').forEach(function(b){
    b.addEventListener('click',function(){
      state.group=b.getAttribute('data-g');state.qi=0;state.answers=[];showQuestion(0);
    });
  });
}

/* ---------- QUESTION — video layout: 2 cards / headline / 2 cards ---------- */
var OPTIMG=['assets/images/screening/opt-a.webp','assets/images/screening/opt-b.webp','assets/images/screening/opt-c.webp','assets/images/screening/opt-d.webp'];
function wpCard(k){
  return '<button class="wp-card" data-k="'+k+'">'+
    '<div class="wp-bar"><i></i><i></i><i></i><span>OPTION — '+'ABCD'[k]+'</span></div>'+
    '<div class="wp-img"><img src="'+OPTIMG[k]+'" alt=""/></div>'+
    '<div class="wp-label"><span class="k">'+'ABCD'[k]+'</span><span class="t">'+OPTS[k]+'</span></div></button>';
}
function showQuestion(i){
  var qs=BANK[state.group].questions;
  var total=qs.length;setP(i/total);
  var s=show('<div class="qwrap" id="qw"><div class="tlabel"><span class="h">#</span> Q'+String(i+1).padStart(2,'0')+' <b>/ '+total+'</b></div>'+
    '<div class="wp-top">'+wpCard(0)+wpCard(1)+'</div>'+
    '<h2 class="qbig" id="qh"></h2>'+
    '<div class="wp-bot">'+wpCard(2)+wpCard(3)+'</div>'+
    (i>0?'<button class="qback" id="qb">\u2190 BACK</button>':'')+
    '<div class="pbar"><i id="pf"></i></div>'+
    '<div class="pmeta"><span>PROGRESS</span><span>'+Math.round(i/total*100)+'%</span></div></div>','center light');
  var qw=s.querySelector('#qw');
  var qh=s.querySelector('#qh');
  scatterText(qh,qs[i][0].toUpperCase(),420);
  fitLine(qh);
  stackAndFan(Array.prototype.slice.call(qw.querySelectorAll('.wp-card')),qw);
  s.querySelector('#pf').style.width=(i/total*100)+'%';
  qw.querySelectorAll('.wp-card').forEach(function(b){
    b.addEventListener('click',function(){
      if(b.classList.contains('sel'))return;
      b.classList.add('sel');
      state.answers[i]=parseInt(b.getAttribute('data-k'),10);
      setTimeout(function(){
        state.qi++;
        if(state.qi<total)scatterOut(qw,qw,function(){showQuestion(state.qi);});
        else sweep(showAnalyzing);
      },320);
    });
  });
  var bk=s.querySelector('#qb');
  if(bk)bk.addEventListener('click',function(){
    scatterOut(qw,qw,function(){state.qi--;showQuestion(state.qi);});
  });
}

/* ---------- ANALYZING (centered) ---------- */
function showAnalyzing(){
  setP(1);
  var s=show('<div class="tlabel"><span class="h">#</span> MODEL — <b>FEEDFORWARD</b></div>'+
    '<h2 class="disp" id="azh">ANALYZING.</h2>'+
    '<div class="azbox"><div class="ahead"><span>ML-MODEL // TRAIT-SCAN</span><span>LIVE</span></div>'+
    '<div class="alog" id="alog"></div><div class="azpct"><span id="apct">000</span><small>%</small></div></div>','center');
  scramble(s.querySelector('#azh'),'ANALYZING.',500);
  var log=s.querySelector('#alog'),apct=s.querySelector('#apct'),li=0;
  var lines=['> feeding 10 answers to model <span class="w">...... OK</span>',
    '> extracting trait vectors <span class="w">...... OK</span>',
    '> computing score <span class="r">......</span>'];
  (function nl(){if(li<lines.length){var d=document.createElement('div');d.innerHTML=lines[li];log.appendChild(d);li++;setTimeout(nl,420);}})();
  var t0=null;
  function tick(t){
    if(!t0)t0=t;
    var p=Math.min(1,(t-t0)/2100),e=1-Math.pow(1-p,3);
    apct.textContent=String(Math.round(e*100)).padStart(3,'0');
    if(p<1)requestAnimationFrame(tick);else setTimeout(function(){sweep(showResult);},400);
  }
  setTimeout(function(){requestAnimationFrame(tick);},300);
  setTimeout(function(){apct.textContent='100';},2800);
}

/* ---------- RESULT — reference layout: 001 showcase / 002 score / 003 next + giant word ---------- */
function score(){
  var qs=BANK[state.group].questions,s=0;
  for(var i=0;i<qs.length;i++){
    var agree=state.answers[i]<=1;
    if((qs[i][1]===1&&agree)||(qs[i][1]===-1&&!agree))s++;
  }
  return s;
}
function showResult(){
  var total=BANK[state.group].questions.length,sc=score();
  var bandShort,desc;
  if(sc<=3){bandShort='FEW TRAITS';desc='Your answers show few autism-related traits. Every mind is different \u2014 keep learning and stay aware.';}
  else if(sc<=6){bandShort='SOME TRAITS';desc='Your answers show some traits commonly associated with autism. Consider discussing them with a qualified professional.';}
  else{bandShort='MANY TRAITS';desc='Your answers show many traits commonly associated with autism. A professional assessment is recommended for clarity.';}
  try{
    var res=JSON.parse(localStorage.getItem('mindcursor_results')||'[]');
    res.push({email:session.email,group:BANK[state.group].label,score:sc,at:Date.now()});
    localStorage.setItem('mindcursor_results',JSON.stringify(res));
  }catch(e){}
  setP(1);
  var s=show('<div class="tlabel"><span class="h">#</span> RESULT — <b>COMPLETE</b></div>'+
    '<div class="rgrid">'+
      '<div class="rnum">001</div>'+
      '<div class="rcard">'+
        '<div class="rc-top"><span class="rc-brand">MINDCURSOR</span>'+
        '<span class="rc-nav"><a id="rc-re">[ RETAKE ]</a> &nbsp;<a id="rc-hm">[ HOME ]</a></span></div>'+
        '<div class="rc-band">'+bandShort+'</div>'+
        '<div class="rc-score"><b>'+String(sc).padStart(2,'0')+'/'+total+'</b> INDICATED</div>'+
        '<div class="rc-img"><img src="assets/images/screening/result-portrait.webp" alt=""/></div>'+
        '<div class="rc-cta">[ NEXT STEPS ]</div>'+
        '<p class="rc-desc">'+desc+'</p>'+
        '<p class="rc-fine">THIS IS A PRELIMINARY SCREENING, NOT A MEDICAL DIAGNOSIS. ONLY A QUALIFIED PROFESSIONAL CAN DIAGNOSE AUTISM.</p>'+
      '</div>'+
      '<div class="rpanel"><div class="rp-n">002</div>'+
        '<div class="rp-score"><span id="rn">00</span><small>/'+total+'</small></div>'+
        '<div class="rp-l">SCORE</div></div>'+
      '<div class="rpanel"><div class="rp-n">003</div>'+
        '<div class="rp-btns"><button class="cbtn" id="r-re">RETAKE \u25a0</button>'+
        '<button class="cbtn ghost" id="r-hm">BACK HOME</button></div>'+
        '<div class="rp-l">NEXT</div></div>'+
    '</div>'+
    '<div class="rmega">RESULT</div>',
    'darkres');
  var rn=s.querySelector('#rn'),t0=null;
  function tick(t){
    if(!t0)t0=t;
    var p=Math.min(1,(t-t0)/1100),e=1-Math.pow(1-p,3);
    rn.textContent=String(Math.round(e*sc)).padStart(2,'0');
    if(p<1)requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
  setTimeout(function(){rn.textContent=String(sc).padStart(2,'0');},1600);
  s.querySelector('#r-re').addEventListener('click',function(){location.reload();});
  s.querySelector('#r-hm').addEventListener('click',function(){location.href='index.html';});
  s.querySelector('#rc-re').addEventListener('click',function(){location.reload();});
  s.querySelector('#rc-hm').addEventListener('click',function(){location.href='index.html';});
}

showHero();
})();
