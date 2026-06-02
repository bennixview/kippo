/* ============================================================
   KIPPO — Die Chronik von Kipshoven  ·  Spiellogik
   Rundenbasierte Wirtschaftssimulation am Mühlenbach,
   Herzogtum Jülich, 14.–15. Jahrhundert.
   ============================================================ */

/* ---------- Hilfsfunktionen ---------- */
const $  = id => document.getElementById(id);
const rnd = (a,b) => Math.floor(Math.random()*(b-a+1))+a;
const rndf= (a,b) => Math.random()*(b-a)+a;
const pick= arr => arr[Math.floor(Math.random()*arr.length)];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const intval=id=>{ const v=parseInt($(id).value,10); return isNaN(v)||v<0?0:v; };
const ROMAN=['','I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV','XVI','XVII','XVIII','XIX','XX'];

/* ---------- Feldfrüchte (Niederrhein, 14. Jh.) ----------
   ertrag/kosten = Bruttoerlös bzw. Kosten je Morgen (Taler) */
const CROPS = {
  roggen: {name:'Roggen', ertrag:[38,58], kosten:[18,26], hint:'treues Brotkorn'},
  weizen: {name:'Weizen', ertrag:[55,95], kosten:[30,48], hint:'wertvoll, launisch'},
  gerste: {name:'Gerste', ertrag:[48,78], kosten:[26,40], hint:'Brei & Bier'},
  hafer:  {name:'Hafer',  ertrag:[32,52], kosten:[14,22], hint:'Pferdefutter'},
  flachs: {name:'Flachs', ertrag:[60,108],kosten:[42,60], hint:'Leinöl & Leinen'},
};
const CROP_ORDER=['roggen','weizen','gerste','hafer','flachs'];
const GRAINS=['roggen','weizen','gerste','hafer'];

/* ---------- Gebäude ---------- */
const BUILDINGS = {
  saege:{name:'Sägewerk', icon:'🪚', cost:300, max:3,
    req:s=>s.land.wald>=4, reqText:'≥ 4 Morgen Wald',
    desc:'Verarbeitet Bauholz. Bringt je Sägewerk Einnahmen aus deinem Wald.'},
  korn:{name:'Kornmühle', icon:'⚙️', cost:600, max:2, stream:true,
    req:s=>streamSlots(s)>0, reqText:'freier Platz am Mühlenbach',
    desc:'Mahlt dein Getreide. +Ertrag auf alle Körner + Mahlzins der Bauern.'},
  oel:{name:'Ölmühle', icon:'🛢️', cost:700, max:2, stream:true,
    req:s=>streamSlots(s)>0, reqText:'freier Platz am Mühlenbach',
    desc:'Presst Leinsamen zu Leinöl. Steigert den Wert deines Flachses stark.'},
  web:{name:'Webstube', icon:'🪡', cost:500, max:1,
    req:s=>true, reqText:'jederzeit',
    desc:'Webt Flachs zu Leinentuch. Zusätzlicher Wert auf deinen Flachs.'},
};
function streamSlots(s){ return 3 - (s.mills.korn + s.mills.oel); } // max. 3 Mühlen am Bach

/* ---------- Ränge / Aufstieg ---------- */
const RANKS = [
  {key:'koetter', name:'Kötter',   bldg:'Kötterkate',
   cost:0, req:()=>true, reqText:'', rent:0,
   blurb:'Ein paar Morgen, eine Lehmhütte. So begann auch Kippo einst.'},
  {key:'bauer', name:'Bauer',      bldg:'Bauernhof',
   cost:350, req:s=>landTotal(s)>=10, reqText:'10 Morgen Land', rent:30,
   blurb:'Ein ehrbarer Bauernhof mit Scheune.'},
  {key:'meier', name:'Meier',      bldg:'Meierhof',
   cost:1400, req:s=>landTotal(s)>=24 && s.mills.korn>=1, reqText:'24 Morgen + Kornmühle', rent:80,
   blurb:'Du verwaltest Land für andere und ziehst Pacht ein.'},
  {key:'freiherr', name:'Freiherr',bldg:'Rittergut (Agris-Hof)',
   cost:4500, req:s=>landTotal(s)>=48 && s.cows>=8, reqText:'48 Morgen + 8 Kühe', rent:180,
   blurb:'Ein steinernes Herrenhaus — die Familie von Beeck lässt grüßen.'},
  {key:'burgherr', name:'Burgherr',bldg:'Wasserburg Kipshoven',
   cost:13000, req:s=>landTotal(s)>=85 && s.year>=1410, reqText:'85 Morgen + Jahr ≥ 1410', rent:420,
   blurb:'Eine echte Wasserburg mit Graben, Türmen und Bergfried — wie Adam von Kipshoven 1316.'},
  {key:'stifter', name:'Stifter',  bldg:'Heiligkreuzkapelle',
   cost:26000, req:s=>s.rankIndex>=4 && s.year>=1492, reqText:'Burg + Jahr ≥ 1492', rent:0,
   blurb:'Stifte die Heiligkreuzkapelle (Anno 1492) — der Gipfel deines Geschlechts.'},
];
const landTotal = s => s.land.wald + s.land.wiese + s.land.acker;

/* ---------- Erben-Namen ---------- */
const HEIRS=['Heinrich','Adam','Wilhelm','Goswin','Reiner','Arnold','Gerhard','Dietrich','Johann','Werner','Engelbert','Konrad'];

/* ---------- Ereignisse ---------- */
const EVENTS = [
  {w:14, name:'Mildes Jahr',       cls:'',     weather:1.0, run:()=>'Ein gewöhnliches Jahr am Mühlenbach.'},
  {w:9,  name:'Reiche Ernte',      cls:'good', weather:1.35,run:()=>'Sonne und Regen im rechten Maß — die Felder stehen prächtig!'},
  {w:8,  name:'Dürre',             cls:'bad',  weather:0.62,run:()=>'Eine Trockenheit dörrt die Saat. Magere Ernte.'},
  {w:6,  name:'Nasses Frühjahr',   cls:'bad',  weather:0.78,run:()=>'Dauerregen lässt die Halme faulen.'},
  {w:5,  name:'Strenger Winter',   cls:'bad',  weather:0.82,run:()=>'Ein eisiger Winter zehrt an Vieh und Vorrat.'},
  {w:5,  name:'Leinen-Boom',       cls:'good', weather:1.05,run:s=>{s._flaxBoom=1.6; return 'Tuchhändler aus Köln zahlen Höchstpreise für Leinen!';}},
  {w:4,  name:'Viehseuche',        cls:'bad',  weather:1.0, run:s=>{const d=Math.min(s.cows,rnd(1,Math.max(1,Math.floor(s.cows/2)))); s.cows-=d; return `Eine Seuche rafft ${d} deiner Kühe dahin.`;}},
  {w:3,  name:'Pest greift um sich',cls:'bad', weather:0.9, run:s=>{const loss=Math.floor(s.taler*0.12); s.taler-=loss; return `Die Pest wütet im Dorf. Verluste von ${loss} Talern.`;}},
  {w:4,  name:'Plünderer',         cls:'bad',  weather:1.0, run:s=>{const loss=rnd(40,120)+s.rankIndex*30; s.taler-=loss; return `Fahrendes Kriegsvolk plündert den Hof. ${loss} Taler verloren.`;}},
  {w:4,  name:'Steuer aus Jülich', cls:'bad',  weather:1.0, run:s=>{s._tithe=0.18; return 'Der Herzog von Jülich erhebt eine Sondersteuer (Zehnt 18%).';}},
  {w:5,  name:'Markt in Wegberg',  cls:'good', weather:1.0, run:s=>{const g=rnd(50,140); s.taler+=g; return `Reger Markt in Wegberg — du verdienst ${g} Taler nebenbei.`;}},
  {w:3,  name:'Hochwasser',        cls:'bad',  weather:0.9, run:s=>{s._millDmg=true; return 'Der Mühlenbach tritt über die Ufer — die Mühlen stehen still.';}},
  {w:3,  name:'Frankenfund',       cls:'epic', weather:1.0, run:s=>{const g=rnd(120,300); s.taler+=g; return `Beim Pflügen findest du einen Hort fränkischer Münzen! +${g} Taler.`;}},
  {w:4,  name:'Gute Aussaat',      cls:'good', weather:1.18,run:()=>'Der Boden ist fruchtbar in diesem Jahr.'},
];
function rollEvent(){
  const total=EVENTS.reduce((s,e)=>s+e.w,0); let r=Math.random()*total;
  for(const e of EVENTS){ if((r-=e.w)<0) return e; }
  return EVENTS[0];
}

/* ============================================================
   ZUSTAND
   ============================================================ */
let S;
function newGame(){
  S={
    year:1380, generation:1, lord:'Kippo', age:24,
    taler:80,
    land:{wald:4, wiese:3, acker:5},
    cows:2,
    mills:{saege:0, korn:0, oel:0, web:0},
    rankIndex:0,
    plant:{roggen:3, weizen:0, gerste:1, hafer:1, flachs:0},
    prices:{}, cowPrice:0,
    deathAge: rnd(56,74),
    log:[],
    over:false,
  };
  clampPlant();
  newPrices();
  logMsg(`Anno ${S.year}: ${S.lord} übernimmt die Kötterkate zu Kipshoven.`,'epic');
}
function newPrices(){
  S.prices={ wald:rnd(28,52), wiese:rnd(24,44), acker:rnd(42,72) };
  S.cowPrice=rnd(400,900);
}

/* ============================================================
   ANZEIGE
   ============================================================ */
function logMsg(t,cls){ S.log.unshift({t,cls:cls||''}); if(S.log.length>40) S.log.pop(); }
function renderLog(){
  $('log').innerHTML = S.log.map(l=>`<li class="${l.cls}">${l.t}</li>`).join('');
}

function refresh(){
  const r=RANKS[S.rankIndex];
  $('st-rank').textContent=r.name;
  $('st-year').textContent=S.year;
  $('st-gen').textContent=ROMAN[S.generation]||S.generation;
  $('st-lord').textContent=`${S.lord} v. Kipshoven`;
  $('st-age').textContent=S.age;
  $('st-taler').textContent=S.taler;

  $('o-wald').textContent=S.land.wald;
  $('o-wiese').textContent=S.land.wiese;
  $('o-acker').textContent=S.land.acker;
  $('o-cows').textContent=S.cows;
  $('o-saege').textContent=S.mills.saege;
  $('o-korn').textContent=S.mills.korn;
  $('o-oel').textContent=S.mills.oel;
  $('o-web').textContent=S.mills.web;

  $('p-wald').textContent=S.prices.wald;
  $('p-wiese').textContent=S.prices.wiese;
  $('p-acker').textContent=S.prices.acker;
  $('p-cow').textContent=S.cowPrice;

  const planted=CROP_ORDER.reduce((a,k)=>a+(S.plant[k]||0),0);
  $('acker-free').textContent=S.land.acker - planted;

  renderCropTable();
  renderBuildList();
  renderRankUpgrade();
  renderLog();
  drawScene($('scene'),S);
}

function renderCropTable(){
  let html='<tr><th>Frucht</th><th>Erlös/M</th><th>Morgen</th></tr>';
  CROP_ORDER.forEach(k=>{
    const c=CROPS[k];
    const lo=c.ertrag[0]-c.kosten[1], hi=c.ertrag[1]-c.kosten[0];
    html+=`<tr><td style="text-align:left">${c.name}</td>`+
          `<td>${lo}–${hi}</td>`+
          `<td><input type="number" min="0" id="plant-${k}" value="${S.plant[k]||0}"></td></tr>`;
  });
  $('crop-table').innerHTML=html;
}

function renderBuildList(){
  let html='';
  for(const key in BUILDINGS){
    const b=BUILDINGS[key];
    const owned=S.mills[key];
    const maxed=owned>=b.max;
    const canReq=b.req(S);
    const canPay=S.taler>=b.cost;
    const dis = maxed||!canReq||!canPay;
    const reason = maxed?'voll ausgebaut': !canReq?b.reqText : !canPay?'zu teuer':'';
    html+=`<div class="build-item">
      <div class="bi-info">
        <div class="bi-name">${b.icon} ${b.name} <span style="color:var(--ink-dim)">(${owned}/${b.max})</span></div>
        <div class="bi-desc">${b.desc}</div>
        <div class="bi-desc">Preis: ${b.cost} Taler${reason?` · <span style="color:var(--red)">${reason}</span>`:''}</div>
      </div>
      <button class="btn ${dis?'disabled':''}" ${dis?'disabled':''} data-build="${key}">Bauen</button>
    </div>`;
  }
  $('build-list').innerHTML=html;
}

function renderRankUpgrade(){
  const next=RANKS[S.rankIndex+1];
  if(!next){ $('rank-upgrade').innerHTML='<div class="bi-name">🏰 Höchster Rang erreicht.</div>'; return; }
  const canReq=next.req(S);
  const canPay=S.taler>=next.cost;
  const dis=!canReq||!canPay;
  const reason=!canReq?next.reqText:!canPay?'nicht genug Taler':'';
  const label = next.key==='stifter' ? '✝ Kapelle stiften' : `Aufsteigen zum ${next.name}`;
  $('rank-upgrade').innerHTML=`<div class="build-item">
    <div class="bi-info">
      <div class="bi-name">⬆️ ${next.bldg}</div>
      <div class="bi-desc">${next.blurb}</div>
      <div class="bi-desc">Kosten: ${next.cost} Taler${next.rent?` · Renten +${next.rent}/Jahr`:''}${reason?` · <span style="color:var(--red)">Bedingung: ${reason}</span>`:''}</div>
    </div>
    <button class="btn ${dis?'disabled':''}" ${dis?'disabled':''} id="do-rank">${label}</button>
  </div>`;
  if(!dis) $('do-rank').onclick=upgradeRank;
}

/* ============================================================
   AKTIONEN (sofortige Anwendung)
   ============================================================ */
function clampPlant(){
  let free=S.land.acker;
  CROP_ORDER.forEach(k=>{
    S.plant[k]=Math.max(0,Math.min(S.plant[k]||0,free));
    free-=S.plant[k];
  });
}

function doLand(){
  const bw=intval('buy-wald'), bwi=intval('buy-wiese'), ba=intval('buy-acker');
  const sw=intval('sell-wald'), swi=intval('sell-wiese'), sa=intval('sell-acker');
  // Verkäufe begrenzen
  if(sw>S.land.wald||swi>S.land.wiese||sa>S.land.acker){ flash('So viel Land besitzt du nicht.'); return; }
  const cost = bw*S.prices.wald + bwi*S.prices.wiese + ba*S.prices.acker;
  const earn = sw*S.prices.wald + swi*S.prices.wiese + sa*S.prices.acker;
  if(cost-earn > S.taler){ flash('Dafür fehlt dir das Geld.'); return; }
  S.taler -= cost; S.taler += earn;
  S.land.wald += bw-sw; S.land.wiese += bwi-swi; S.land.acker += ba-sa;
  if(bw+bwi+ba>0) logMsg(`Land gekauft für ${cost} Taler.`,'');
  if(sw+swi+sa>0) logMsg(`Land verkauft für ${earn} Taler.`,'');
  clampPlant();
  ['buy-wald','buy-wiese','buy-acker','sell-wald','sell-wiese','sell-acker'].forEach(id=>$(id).value=0);
  refresh();
}

function doPlant(){
  const next={}; let sum=0;
  CROP_ORDER.forEach(k=>{ next[k]=intval('plant-'+k); sum+=next[k]; });
  if(sum>S.land.acker){ flash(`Du hast nur ${S.land.acker} Morgen Acker.`); return; }
  S.plant=next;
  logMsg(`Aussaat bestellt: ${CROP_ORDER.filter(k=>next[k]).map(k=>CROPS[k].name+' '+next[k]).join(', ')||'nichts'}.`,'');
  refresh();
}

function doBuild(key){
  const b=BUILDINGS[key];
  if(S.mills[key]>=b.max||!b.req(S)||S.taler<b.cost) return;
  S.taler-=b.cost; S.mills[key]++;
  logMsg(`${b.icon} ${b.name} errichtet (−${b.cost} Taler).`,'good');
  refresh();
}

function doCow(){
  const buy=intval('buy-cow'), sell=intval('sell-cow');
  if(sell>S.cows){ flash('So viele Kühe hast du nicht.'); return; }
  const cost=buy*S.cowPrice, earn=sell*S.cowPrice;
  if(cost-earn>S.taler){ flash('Nicht genug Taler für den Viehkauf.'); return; }
  S.taler-=cost; S.taler+=earn; S.cows+=buy-sell;
  if(buy) logMsg(`${buy} Kühe gekauft (−${cost} Taler).`,'');
  if(sell) logMsg(`${sell} Kühe verkauft (+${earn} Taler).`,'');
  $('buy-cow').value=0; $('sell-cow').value=0;
  refresh();
}

function upgradeRank(){
  const next=RANKS[S.rankIndex+1];
  if(!next||!next.req(S)||S.taler<next.cost) return;
  S.taler-=next.cost; S.rankIndex++;
  if(next.key==='stifter'){ winGame(); return; }
  logMsg(`🎉 Aufgestiegen: ${S.lord} ist nun ${next.name} auf dem ${next.bldg}!`,'epic');
  showOverlay(`${next.bldg}`,
    `${S.lord} von Kipshoven steigt auf zum <b>${next.name}</b>.<br><br>${next.blurb}`,
    null);
  refresh();
}

/* ============================================================
   JAHRESABSCHLUSS
   ============================================================ */
function endTurn(){
  if(S.over) return;
  // Reset Jahresmodifikatoren
  S._tithe=0.10; S._flaxBoom=1.0; S._millDmg=false;

  // 1) Ereignis
  const ev=rollEvent();
  const evText=ev.run(S);
  logMsg(`⚑ ${ev.name}: ${evText}`, ev.cls);

  // 2) Ernte (reiner Feldertrag) + Mühlen-Verarbeitungsbonus getrennt erfassen
  let cropBase=0, millCropBonus=0;
  const millOk=!S._millDmg;   // bei Hochwasser steht die Verarbeitung still
  CROP_ORDER.forEach(k=>{
    const m=S.plant[k]||0; if(m<=0) return;
    const c=CROPS[k];
    const net=(rnd(c.ertrag[0],c.ertrag[1]) - rnd(c.kosten[0],c.kosten[1])) * ev.weather;
    let bonusMult=0;
    if(millOk){
      if(k==='flachs'){
        if(S.mills.oel>0) bonusMult += 0.55;             // Leinöl
        if(S.mills.web>0) bonusMult += 0.50*S._flaxBoom; // Leinentuch
      } else if(GRAINS.includes(k) && S.mills.korn>0){
        bonusMult += 0.20*S.mills.korn;                  // Mahlbonus auf Körner
      }
    }
    cropBase      += Math.round(net*m);
    millCropBonus += Math.round(net*bonusMult*m);
  });

  // 3) Sägewerk – Bauholz aus dem Wald
  let woodIncome=0;
  if(S.mills.saege>0){
    const worked=Math.min(S.land.wald, S.mills.saege*8);
    woodIncome=worked*rnd(110,150);
  }

  // 4) Mühlen-Gesamtwert: Mahl-/Pressezins + Verarbeitungsbonus auf die Ernte
  let millToll=0;
  if(millOk){ millToll = S.mills.korn*rnd(60,110) + S.mills.oel*rnd(50,100); }
  const millIncome = millToll + millCropBonus;

  // 5) Vieh – Milch & Kälber, je Kuh 1 Morgen Wiese nötig
  const fed=Math.min(S.cows, S.land.wiese);
  const starving=S.cows-fed;
  let cowIncome=fed*rnd(45,95);
  if(starving>0){
    const dead=Math.min(starving,rnd(0,starving));
    if(dead>0){ S.cows-=dead; logMsg(`${dead} Kühe verhungern aus Mangel an Wiese.`,'bad'); }
  }

  // 6) Renten (Stand/Ansehen)
  const rent=RANKS[S.rankIndex].rent;

  // 7) Summe & Zehnt
  const gross=cropBase+woodIncome+millIncome+cowIncome+rent;
  const tithe=Math.max(0,Math.round(Math.max(0,gross)*S._tithe));
  const netYear=gross-tithe;
  S.taler+=netYear;

  const millStr = millOk ? millIncome : '0 (Hochwasser)';
  logMsg(`Anno ${S.year}: Ernte ${cropBase} · Holz ${woodIncome} · Mühlen ${millStr} · Vieh ${cowIncome} · Renten ${rent} · Zehnt −${tithe} ⇒ ${netYear>=0?'+':''}${netYear} Taler.`, netYear>=0?'good':'bad');

  // 8) Bankrott? Land zwangsweise verkaufen
  if(S.taler<0) forcedSell();
  if(S.taler<0 && landTotal(S)===0){ loseGame('ruin'); return; }

  // 9) Altern & Erbfolge
  S.age++; S.year++;
  if(S.age>=S.deathAge){ succession(); }

  // 10) neue Preise
  newPrices();
  if(!S.over) refresh();
}

function forcedSell(){
  const order=['acker','wiese','wald'];
  for(const k of order){
    while(S.taler<0 && S.land[k]>0){
      S.land[k]--; S.taler+=S.prices[k];
      logMsg(`Not zwingt zum Verkauf: 1 Morgen ${k} (+${S.prices[k]} Taler).`,'bad');
    }
  }
  clampPlant();
}

function succession(){
  const heir=pick(HEIRS);
  const tax=Math.round(Math.max(0,S.taler)*0.15);
  const oldLord=S.lord, oldAge=S.age, oldGen=S.generation;
  S.taler-=tax; S.generation++; S.lord=heir;
  S.age=rnd(19,26); S.deathAge=rnd(56,74);
  logMsg(`† ${oldLord} stirbt mit ${oldAge} Jahren. ${heir} erbt (Besthaupt −${tax} Taler).`,'epic');
  showGrave(oldLord,
    `${oldLord} von Kipshoven<br>Geschlecht ${ROMAN[oldGen]||oldGen} · gestorben mit ${oldAge} Jahren`,
    `Sein Erbe <b>${heir}</b> tritt das Erbe an (${RANKS[S.rankIndex].bldg}).<br>Die Linie des Kippo lebt fort.`,
    ()=>{ refresh(); });
}

/* ============================================================
   ENDE: SIEG / NIEDERLAGE
   ============================================================ */
function winGame(){
  S.over=true;
  logMsg(`✝ Anno ${S.year}: Die Heiligkreuzkapelle ist vollendet!`,'epic');
  const oc=$('overlay-canvas'); oc.classList.remove('hidden');
  drawWinScene(oc);
  $('overlay-title').textContent='✝ Die Heiligkreuzkapelle';
  $('overlay-text').innerHTML=
    `Anno Domini <b>${S.year}</b>. ${S.lord} von Kipshoven (Geschlecht ${ROMAN[S.generation]||S.generation}) `+
    `stiftet auf dem Grund der alten Wasserburg die <b>Heiligkreuzkapelle</b>.<br><br>`+
    `Aus Kippos windschiefer Kate ist über die Generationen ein frommes Werk geworden, `+
    `das — wie im echten Kipshoven — noch heute steht.<br><br>`+
    `<b>Du hast gewonnen!</b>`;
  const btn=$('overlay-btn'); btn.textContent='Neue Chronik beginnen';
  btn.onclick=()=>{ hideOverlay(); oc.classList.add('hidden'); startGame(); };
  $('overlay').classList.remove('hidden');
  refreshStatusOnly();
}

function loseGame(){
  S.over=true;
  logMsg(`Das Geschlecht des Kippo ist ruiniert. Anno ${S.year}.`,'bad');
  showGrave(S.lord,
    `Hier ruht in Frieden<br>${S.lord} von Kipshoven<br>Anno ${S.year}`,
    `Verarmt und verschuldet erlischt die Linie des Kippo zu Kipshoven.<br><br><b>Spiel verloren.</b>`,
    ()=>{ startGame(); });
  $('overlay-btn').textContent='Von vorn beginnen';
}

/* ============================================================
   OVERLAYS
   ============================================================ */
function showOverlay(title,text,onClose){
  $('overlay-canvas').classList.add('hidden');
  $('overlay-title').textContent=title;
  $('overlay-text').innerHTML=text;
  const btn=$('overlay-btn'); btn.textContent='Weiter';
  btn.onclick=()=>{ hideOverlay(); if(onClose) onClose(); };
  $('overlay').classList.remove('hidden');
}
function showGrave(name,inscr,text,onClose){
  const oc=$('overlay-canvas'); oc.classList.remove('hidden');
  drawGrave(oc,name);
  $('overlay-title').innerHTML=inscr;
  $('overlay-text').innerHTML=text;
  const btn=$('overlay-btn'); btn.textContent=S.over?'Von vorn beginnen':'Weiter';
  btn.onclick=()=>{ hideOverlay(); oc.classList.add('hidden'); if(onClose) onClose(); };
  $('overlay').classList.remove('hidden');
  refreshStatusOnly();
}
function hideOverlay(){ $('overlay').classList.add('hidden'); }
function refreshStatusOnly(){ renderLog(); try{ drawScene($('scene'),S); }catch(e){} }

/* einfacher Hinweis-Toast über die Chronik */
let flashTimer=null;
function flash(msg){
  logMsg('⚠ '+msg,'bad'); renderLog();
}

/* ---------- Siegszene (Kapelle im Glanz) ---------- */
function drawWinScene(canvas){
  const ctx=canvas.getContext('2d');
  canvas.width=200; canvas.height=120; ctx.imageSmoothingEnabled=false;
  rectPx(ctx,0,0,200,70,'#6aa0d8'); rectPx(ctx,0,50,200,20,'#9ad0ec');
  rectPx(ctx,0,70,200,50,PAL.grass); rectPx(ctx,0,70,200,3,PAL.grassLt);
  // Strahlen
  rectPx(ctx,150,8,20,20,PAL.sun); rectPx(ctx,146,12,28,12,PAL.sun);
  for(let i=0;i<6;i++) drawTree(ctx,4+i*10,68,1);
  drawBuilding(ctx,5,78,84);
}

/* ============================================================
   TABS & INIT
   ============================================================ */
function initTabs(){
  document.querySelectorAll('.tab').forEach(t=>{
    t.onclick=()=>{
      document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
      document.querySelectorAll('.tabpane').forEach(x=>x.classList.remove('active'));
      t.classList.add('active');
      $('tab-'+t.dataset.tab).classList.add('active');
    };
  });
}

function startGame(){
  // Musik aus der Nutzergeste heraus starten (Browser-Autoplay-Regel)
  if(window.KippoMusik) KippoMusik.start();
  newGame();
  $('title-screen').classList.add('hidden');
  $('game-screen').classList.remove('hidden');
  hideOverlay();
  $('overlay-canvas').classList.add('hidden');
  refresh();
}

window.addEventListener('DOMContentLoaded',()=>{
  drawTitle($('title-canvas'));
  initTabs();
  $('btn-start').onclick=startGame;
  $('btn-land').onclick=doLand;
  $('btn-plant').onclick=doPlant;
  $('btn-cow').onclick=doCow;
  $('btn-endturn').onclick=endTurn;
  $('btn-music').onclick=()=>{ if(window.KippoMusik) KippoMusik.toggle(); };
  // delegierte Klicks für Bauen-Buttons
  $('build-list').addEventListener('click',e=>{
    const b=e.target.closest('[data-build]'); if(b) doBuild(b.dataset.build);
  });
});
