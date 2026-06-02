/* ============================================================
   KIPPO — Pixel-Art-Renderer
   Zeichnet die Hof-Szene am Mühlenbach, die mit dem Rang wächst,
   sowie Titel-, Grabstein- und Kapellen-Bilder.
   Interne Auflösung klein, per CSS hochskaliert (pixelated).
   ============================================================ */

const PAL = {
  skyTop:'#3a6ea5', skyMid:'#5b9bd5', skyLow:'#9ad0ec',
  sun:'#ffe066', sunCore:'#fff3b0',
  hillFar:'#4a7c40', hillNear:'#3c6a34',
  grass:'#6abe30', grassDk:'#4f9626', grassLt:'#86d24a',
  soil:'#7a5230', soilDk:'#5e3f24',
  water:'#3b6fb0', waterLt:'#5a8fd0', waterFoam:'#bcd9f0',
  trunk:'#5a3a1a', leaf:'#2f7d34', leafDk:'#246128', leafLt:'#46a13e',
  stone:'#9a9488', stoneDk:'#6f6a60', stoneLt:'#bdb6a6',
  wood:'#8a5a2a', woodDk:'#5e3c18', thatch:'#cba24a',
  thatchDk:'#9c7a30',
  brick:'#b5503a', brickDk:'#8a3a2a', brickLt:'#cf6a4e',
  roofRed:'#a23a2a', roofDk:'#771f1a',
  cow:'#efe7d6', cowSpot:'#3a2a20', cowPink:'#d98a86',
  white:'#f4e4c1', gold:'#ffcc44', black:'#1a1228',
  cross:'#e8d27a', flax:'#9ec5e8', flaxStem:'#7fae4a',
  wheat:'#d8b24a', barley:'#c8c050', oat:'#c2cf70', rye:'#caa23c',
  grave:'#8a857a', graveDk:'#5f5a50', flower:'#d04680',
};

function rectPx(ctx,x,y,w,h,c){ ctx.fillStyle=c; ctx.fillRect(x|0,y|0,w|0,h|0); }

/* seeded-ish jitter from an index, so trees/cows don't flicker each frame */
function jit(i,m){ return (Math.sin(i*12.9898)*43758.5453 % 1 + 1) % 1 * m; }

/* ---------------- TREE ---------------- */
function drawTree(ctx,x,y,s){
  s=s||1;
  rectPx(ctx,x+2*s,y+8*s,2*s,4*s,PAL.trunk);
  rectPx(ctx,x,y+2*s,6*s,6*s,PAL.leaf);
  rectPx(ctx,x+1*s,y,4*s,3*s,PAL.leafLt);
  rectPx(ctx,x,y+6*s,6*s,2*s,PAL.leafDk);
}

/* ---------------- COW ---------------- */
function drawCow(ctx,x,y){
  rectPx(ctx,x,y+2,9,5,PAL.cow);      // body
  rectPx(ctx,x+8,y,4,4,PAL.cow);      // head
  rectPx(ctx,x+11,y+1,1,1,PAL.cowPink);
  rectPx(ctx,x+2,y+3,2,2,PAL.cowSpot);
  rectPx(ctx,x+5,y+2,2,2,PAL.cowSpot);
  rectPx(ctx,x+1,y+7,2,2,PAL.cowSpot);// legs
  rectPx(ctx,x+6,y+7,2,2,PAL.cowSpot);
}

/* ---------------- WATER WHEEL (mill) ---------------- */
function drawMill(ctx,x,y,kind){
  // mill house
  const wall = kind==='oel' ? PAL.wood : PAL.stone;
  const wallDk= kind==='oel' ? PAL.woodDk : PAL.stoneDk;
  rectPx(ctx,x,y,16,14,wall);
  rectPx(ctx,x,y,16,2,wallDk);
  rectPx(ctx,x,y+12,16,2,wallDk);
  // roof
  rectPx(ctx,x-1,y-4,18,4, kind==='oel'?PAL.roofRed:PAL.thatch);
  rectPx(ctx,x-1,y-4,18,1, kind==='oel'?PAL.roofDk:PAL.thatchDk);
  // door
  rectPx(ctx,x+6,y+6,4,8,PAL.woodDk);
  // water wheel on the right
  rectPx(ctx,x+16,y+2,2,12, wallDk);
  rectPx(ctx,x+17,y+3,7,7, PAL.woodDk);
  rectPx(ctx,x+19,y+3,3,7, PAL.wood);
  rectPx(ctx,x+17,y+5,7,3, PAL.wood);
  // label dot
  rectPx(ctx,x+6,y+2,4,3, kind==='oel'?PAL.gold:PAL.white);
}

/* ---------------- SAWMILL ---------------- */
function drawSawmill(ctx,x,y){
  rectPx(ctx,x,y+2,18,12,PAL.wood);
  rectPx(ctx,x,y+2,18,2,PAL.woodDk);
  rectPx(ctx,x-1,y-3,20,5,PAL.thatch);
  rectPx(ctx,x-1,y-3,20,1,PAL.thatchDk);
  // logs
  rectPx(ctx,x+1,y+12,16,2,PAL.trunk);
  rectPx(ctx,x+2,y+9,5,3,PAL.leafDk);
  // saw blade hint
  rectPx(ctx,x+8,y+5,2,5,PAL.stoneLt);
}

/* ============================================================
   MAIN BUILDING by rank index 0..5
   drawn within an area ~ (x,y) top-left, on the ground line
   ============================================================ */
function drawBuilding(ctx,rank,x,y){
  switch(rank){
    case 0: // Kötterkate – kleine Lehmhütte mit Strohdach
      rectPx(ctx,x,y,22,16,PAL.soil);
      rectPx(ctx,x,y+14,22,2,PAL.soilDk);
      rectPx(ctx,x-3,y-9,28,10,PAL.thatch);
      rectPx(ctx,x-3,y-9,28,2,PAL.thatchDk);
      rectPx(ctx,x+9,y-9,4,10,PAL.thatchDk);
      rectPx(ctx,x+8,y+6,6,10,PAL.woodDk); // door
      rectPx(ctx,x+2,y+3,4,4,PAL.black);   // window
      break;

    case 1: // Bauernhof – Fachwerkhaus + kleine Scheune
      rectPx(ctx,x,y,26,18,PAL.white);
      // Fachwerk-Balken
      rectPx(ctx,x,y,26,2,PAL.wood); rectPx(ctx,x,y+8,26,2,PAL.wood);
      rectPx(ctx,x,y+16,26,2,PAL.wood);
      rectPx(ctx,x,y,2,18,PAL.wood); rectPx(ctx,x+12,y,2,18,PAL.wood); rectPx(ctx,x+24,y,2,18,PAL.wood);
      rectPx(ctx,x-3,y-9,32,10,PAL.roofRed);
      rectPx(ctx,x-3,y-9,32,2,PAL.roofDk);
      rectPx(ctx,x+4,y+10,6,8,PAL.woodDk); // door
      rectPx(ctx,x+16,y+3,5,4,PAL.skyLow); // window
      // Scheune
      rectPx(ctx,x+28,y+4,16,14,PAL.wood);
      rectPx(ctx,x+26,y-1,20,6,PAL.thatch);
      rectPx(ctx,x+33,y+9,5,9,PAL.woodDk);
      break;

    case 2: // Meierhof – größeres Wohnhaus + Hofmauer + Tor
      rectPx(ctx,x-6,y+6,58,2,PAL.stoneDk); // niedrige Hofmauer
      rectPx(ctx,x-6,y-2,4,10,PAL.stone);
      rectPx(ctx,x+50,y-2,4,10,PAL.stone);
      rectPx(ctx,x,y,30,20,PAL.white);
      rectPx(ctx,x,y,30,2,PAL.wood); rectPx(ctx,x,y+9,30,2,PAL.wood);
      rectPx(ctx,x,y,2,20,PAL.wood); rectPx(ctx,x+14,y,2,20,PAL.wood); rectPx(ctx,x+28,y,2,20,PAL.wood);
      rectPx(ctx,x-4,y-11,38,12,PAL.roofRed);
      rectPx(ctx,x-4,y-11,38,2,PAL.roofDk);
      rectPx(ctx,x+5,y+12,6,8,PAL.woodDk);
      rectPx(ctx,x+18,y+3,6,5,PAL.skyLow);
      rectPx(ctx,x+5,y+3,6,5,PAL.skyLow);
      // großer Stall
      rectPx(ctx,x+34,y+6,20,14,PAL.wood);
      rectPx(ctx,x+32,y,24,8,PAL.thatch);
      break;

    case 3: // Rittergut (Agris-Hof) – Steinhaus mit Erkertürmchen
      rectPx(ctx,x,y-4,40,28,PAL.stone);
      rectPx(ctx,x,y-4,40,2,PAL.stoneLt);
      rectPx(ctx,x,y+22,40,2,PAL.stoneDk);
      // Türmchen
      rectPx(ctx,x-6,y-10,12,34,PAL.stone);
      rectPx(ctx,x-6,y-10,12,2,PAL.stoneLt);
      rectPx(ctx,x-8,y-16,16,7,PAL.roofRed);
      rectPx(ctx,x-2,y-22,4,6,PAL.roofRed);
      // Hauptdach
      rectPx(ctx,x-3,y-12,46,9,PAL.roofRed);
      rectPx(ctx,x-3,y-12,46,2,PAL.roofDk);
      // Fenster (Sprossen)
      rectPx(ctx,x+8,y+2,7,8,PAL.skyLow); rectPx(ctx,x+11,y+2,1,8,PAL.stoneDk);
      rectPx(ctx,x+25,y+2,7,8,PAL.skyLow); rectPx(ctx,x+28,y+2,1,8,PAL.stoneDk);
      rectPx(ctx,x+15,y+12,10,12,PAL.woodDk); // Portal
      rectPx(ctx,x-3,y-4,6,5,PAL.skyLow);    // Turmfenster
      break;

    case 4: // Burg Kipshoven – Wasserburg mit Zinnen
      // Wassergraben
      rectPx(ctx,x-12,y+20,76,6,PAL.water);
      rectPx(ctx,x-12,y+20,76,2,PAL.waterLt);
      // Mauer
      rectPx(ctx,x-4,y-2,56,24,PAL.stone);
      rectPx(ctx,x-4,y-2,56,3,PAL.stoneLt);
      // Zinnen Mauer
      for(let i=0;i<7;i++) rectPx(ctx,x-4+i*8,y-7,5,5,PAL.stone);
      // Tor
      rectPx(ctx,x+20,y+8,12,14,PAL.woodDk);
      rectPx(ctx,x+20,y+8,12,2,PAL.stoneDk);
      // Brücke
      rectPx(ctx,x+18,y+22,16,4,PAL.wood);
      // Türme links/rechts
      drawTower(ctx,x-12,y-16,PAL); drawTower(ctx,x+44,y-16,PAL);
      // Bergfried
      rectPx(ctx,x+14,y-26,20,30,PAL.stone);
      rectPx(ctx,x+14,y-26,20,3,PAL.stoneLt);
      for(let i=0;i<3;i++) rectPx(ctx,x+14+i*8,y-31,5,5,PAL.stone);
      rectPx(ctx,x+21,y-22,6,7,PAL.black);
      // Fahne
      rectPx(ctx,x+23,y-40,2,9,PAL.woodDk);
      rectPx(ctx,x+25,y-40,9,6,PAL.red||PAL.brick);
      break;

    case 5: // Heiligkreuzkapelle 1492 – Backstein, Spitzturm, Kreuz
      // Schiff
      rectPx(ctx,x,y-6,36,30,PAL.brick);
      rectPx(ctx,x,y-6,36,2,PAL.brickLt);
      for(let i=1;i<6;i++) rectPx(ctx,x,y-6+i*5,36,1,PAL.brickDk);
      // Chor
      rectPx(ctx,x+36,y-2,12,26,PAL.brick);
      rectPx(ctx,x+36,y+2,12,1,PAL.brickDk);
      // Dach
      rectPx(ctx,x-3,y-12,42,7,PAL.roofDk);
      rectPx(ctx,x-3,y-12,42,2,PAL.roofRed);
      // Turm
      rectPx(ctx,x+6,y-30,12,24,PAL.brick);
      rectPx(ctx,x+6,y-30,12,2,PAL.brickLt);
      // Spitzdach
      for(let i=0;i<6;i++) rectPx(ctx,x+6+i,y-30-(6-i),12-2*i,2,PAL.roofDk);
      rectPx(ctx,x+11,y-44,2,6,PAL.cross); // Kreuz vertikal
      rectPx(ctx,x+9,y-42,6,2,PAL.cross);  // Kreuz quer
      // Spitzbogenfenster
      rectPx(ctx,x+4,y+4,5,12,PAL.skyLow);  rectPx(ctx,x+4,y+2,5,3,PAL.brickDk);
      rectPx(ctx,x+15,y+4,5,12,PAL.skyLow); rectPx(ctx,x+15,y+2,5,3,PAL.brickDk);
      rectPx(ctx,x+26,y+4,5,12,PAL.skyLow); rectPx(ctx,x+26,y+2,5,3,PAL.brickDk);
      // Portal
      rectPx(ctx,x+10,y-2,5,6,PAL.skyLow);
      break;
  }
}
function drawTower(ctx,x,y,P){
  rectPx(ctx,x,y,12,38,P.stone);
  rectPx(ctx,x,y,12,3,P.stoneLt);
  for(let i=0;i<3;i++) rectPx(ctx,x+i*5,y-5,4,5,P.stone);
  rectPx(ctx,x+4,y+8,5,6,P.black);
  rectPx(ctx,x+4,y+20,5,6,P.black);
}

/* ============================================================
   FULL HOMESTEAD SCENE
   ============================================================ */
function drawScene(canvas,state){
  const ctx=canvas.getContext('2d');
  const W=256,H=144;
  canvas.width=W; canvas.height=H;
  ctx.imageSmoothingEnabled=false;

  // sky
  rectPx(ctx,0,0,W,50,PAL.skyTop);
  rectPx(ctx,0,50,W,18,PAL.skyMid);
  rectPx(ctx,0,68,W,8,PAL.skyLow);
  // sun
  rectPx(ctx,212,16,16,16,PAL.sun);
  rectPx(ctx,216,12,8,24,PAL.sun);
  rectPx(ctx,208,20,24,8,PAL.sun);
  rectPx(ctx,216,20,8,8,PAL.sunCore);
  // clouds
  rectPx(ctx,40,18,30,6,PAL.white); rectPx(ctx,48,14,16,6,PAL.white);
  rectPx(ctx,120,30,24,5,PAL.white); rectPx(ctx,126,26,12,5,PAL.white);

  // far hills
  for(let x=0;x<W;x+=2){ const h=8+Math.sin(x/24)*5; rectPx(ctx,x,72-h,2,h+8,PAL.hillFar); }
  rectPx(ctx,0,76,W,68,PAL.grass);
  rectPx(ctx,0,76,W,3,PAL.grassLt);

  // Mühlenbach – fließt diagonal von links-mitte nach rechts-unten
  for(let t=0;t<=70;t++){
    const x=20+t*3.0, y=92+t*0.7;
    rectPx(ctx,x,y,10,5,PAL.water);
    rectPx(ctx,x,y,10,1,PAL.waterLt);
    if(t%6===0) rectPx(ctx,x+3,y+1,2,1,PAL.waterFoam);
  }

  // Wald – Bäume links/hinten, Anzahl ~ wald-Morgen
  const nT=Math.min(14,Math.max(0,Math.round(state.land.wald)));
  for(let i=0;i<nT;i++){
    const tx=4+(i%5)*14 + jit(i,4);
    const ty=78+Math.floor(i/5)*13 + jit(i+9,3);
    drawTree(ctx,tx,ty,1);
  }

  // Felder – Vordergrund, eingeteilt nach Aussaat
  drawFields(ctx,state, 0,118, W,26);

  // Wiese mit Kühen – mittig-rechts
  const nC=Math.min(8,Math.max(0,Math.round(state.cows)));
  for(let i=0;i<nC;i++){
    const cx=150+(i%4)*22 + jit(i,5);
    const cy=84+Math.floor(i/4)*14;
    drawCow(ctx,cx,cy);
  }

  // Mühlen am Bach
  if(state.mills.korn>0) drawMill(ctx,150,96,'korn');
  if(state.mills.oel>0)  drawMill(ctx,196,116,'oel');
  // Sägewerk am Waldrand
  if(state.mills.saege>0) drawSawmill(ctx,4,104);

  // Hauptgebäude
  drawBuilding(ctx, state.rankIndex, 96, 86);
}

function drawFields(ctx,state,fx,fy,fw,fh){
  const plant=state.plant||{};
  const cropCol={roggen:PAL.rye,weizen:PAL.wheat,gerste:PAL.barley,hafer:PAL.oat,flachs:PAL.flax};
  const order=['roggen','weizen','gerste','hafer','flachs'];
  const total=order.reduce((s,k)=>s+(plant[k]||0),0);
  // gepflügter Boden als Basis
  for(let r=0;r<fh;r+=4) rectPx(ctx,fx,fy+r,fw,2,r%8===0?PAL.soil:PAL.soilDk);
  if(total<=0){ return; }
  let x=fx;
  order.forEach(k=>{
    const m=plant[k]||0; if(m<=0) return;
    const w=Math.max(4,Math.round(fw*m/total));
    rectPx(ctx,x,fy,w-1,fh,cropCol[k]);
    // Reihen-Textur
    for(let r=2;r<fh;r+=4) rectPx(ctx,x,fy+r,w-1,1,PAL.soilDk);
    if(k==='flachs'){ // blaue Blüten
      for(let bx=x+2;bx<x+w-2;bx+=5) rectPx(ctx,bx,fy+2,1,1,PAL.white);
    }
    x+=w;
  });
}

/* ============================================================
   TITELBILD – Sonnenuntergang über Kipshoven mit Kapelle
   ============================================================ */
function drawTitle(canvas){
  const ctx=canvas.getContext('2d');
  const W=256,H=120; canvas.width=W; canvas.height=H;
  ctx.imageSmoothingEnabled=false;
  // Abendhimmel
  rectPx(ctx,0,0,W,40,'#3a2a5a');
  rectPx(ctx,0,40,W,18,'#7a4a6a');
  rectPx(ctx,0,58,W,14,'#d87a5a');
  rectPx(ctx,0,72,W,8,'#f0a85a');
  // Sonne
  rectPx(ctx,116,52,24,24,PAL.sun); rectPx(ctx,112,56,32,16,PAL.sun);
  rectPx(ctx,120,56,16,16,PAL.sunCore);
  // Hügel-Silhouette
  for(let x=0;x<W;x+=2){ const h=14+Math.sin(x/30)*8; rectPx(ctx,x,80-h,2,h+40,'#23351f'); }
  // Bach-Reflexion
  for(let t=0;t<40;t++){ rectPx(ctx,60+t*4,96+t*0.4,8,3,'#9a6a4a'); }
  // Bäume
  for(let i=0;i<6;i++) drawTree(ctx,12+i*12,72,1);
  // Kapelle als Silhouette rechts
  ctx.save();
  drawBuilding(ctx,5,176,86);
  ctx.restore();
}

/* ============================================================
   GRABSTEIN (Tod / Spielende-Niederlage)
   ============================================================ */
function drawGrave(canvas,name,yA,yB){
  const ctx=canvas.getContext('2d');
  const W=200,H=120; canvas.width=W; canvas.height=H;
  ctx.imageSmoothingEnabled=false;
  rectPx(ctx,0,0,W,80,'#2a2438');
  rectPx(ctx,0,80,W,40,'#1f3320');
  // Mond
  rectPx(ctx,160,14,18,18,'#e8e0c0'); rectPx(ctx,166,12,10,22,'#e8e0c0');
  // zwei Kreuze hinten
  function cross(x){ rectPx(ctx,x,40,4,40,PAL.graveDk); rectPx(ctx,x-6,48,16,4,PAL.graveDk); }
  cross(24); cross(168);
  // Grabstein
  rectPx(ctx,72,36,56,70,PAL.grave);
  rectPx(ctx,72,36,56,3,'#a8a298');
  rectPx(ctx,78,28,44,10,PAL.grave);   // Rundung oben
  rectPx(ctx,86,22,28,8,PAL.grave);
  // Inschrift (Pixelbalken)
  ctx.fillStyle=PAL.graveDk;
  ctx.fillRect(82,46,36,2); ctx.fillRect(88,52,24,2);
  rectPx(ctx,96,58,8,8,PAL.graveDk); rectPx(ctx,98,56,4,12,PAL.graveDk); rectPx(ctx,93,60,14,3,PAL.graveDk); // Kreuz
  ctx.fillRect(80,76,40,2); ctx.fillRect(84,82,32,2);
  // Blumen
  rectPx(ctx,66,100,3,3,PAL.flower); rectPx(ctx,131,100,3,3,PAL.flower);
}
