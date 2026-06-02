/* ============================================================
   KIPPO — Hintergrundmusik
   Eine fröhliche, "cosy" Tavernen-/Fantasy-Melodie, prozedural per
   Web Audio API erzeugt (keine externen Audiodateien). D-Dur, flott
   und tänzerisch, mit hüpfendem Oom-Pah-Bass statt Dauerbordun —
   beepiger Square-Wave-Klang im PC-Speaker-Stil.
   ============================================================ */
(function(){
  const STORE_KEY = 'kippo-musik';   // 'an' | 'aus' in localStorage

  let ctx       = null;   // AudioContext (erst nach Nutzergeste)
  let master    = null;   // Gesamt-Lautstärke (0 = stumm)
  let schedTimer= null;   // Lookahead-Scheduler
  let cursors   = [];     // pro Stimme: { i, t }
  let enabled   = (localStorage.getItem(STORE_KEY) !== 'aus'); // Default: an

  /* ---- Tonhöhen (Hz) ---- D-Dur + Bass ---- */
  const F = {
    R:0,
    // Bass
    A2:110.00, D3:146.83, E3:164.81, 'F#3':185.00, G3:196.00, A3:220.00,
    // Melodie
    D4:293.66, E4:329.63, 'F#4':369.99, G4:392.00, A4:440.00, B4:493.88,
    'C#5':554.37, D5:587.33, E5:659.25,
  };

  const TEMPO = 108;             // Schläge je Minute (entspannt — für langes Spielen)
  const SPB   = 60 / TEMPO;      // Sekunden je Schlag (Viertel)

  /* ---- Melodie [Ton, Schläge] ---- Achtel = 0.5 ----
     A-Teil (Takt 1-4: D G A D) + B-Teil (Takt 5-8, etwas höher). */
  const MELODY = [
    // A-Teil
    ['A4',.5],['B4',.5],['A4',.5],['F#4',.5],['D4',1],['A4',1],        // D
    ['B4',.5],['C#5',.5],['B4',.5],['A4',.5],['G4',1],['B4',1],        // G
    ['A4',.5],['B4',.5],['C#5',.5],['A4',.5],['E4',1],['A4',1],        // A
    ['F#4',.5],['A4',.5],['F#4',.5],['E4',.5],['D4',2],                // D
    // B-Teil
    ['D5',.5],['C#5',.5],['B4',.5],['C#5',.5],['D5',1],['A4',1],       // D
    ['B4',.5],['C#5',.5],['D5',.5],['B4',.5],['G4',1],['G4',1],        // G
    ['A4',.5],['B4',.5],['C#5',.5],['E5',.5],['A4',1],['C#5',1],       // A
    ['D5',.5],['C#5',.5],['B4',.5],['A4',.5],['D5',2],                 // D
  ];

  /* ---- Bass [Ton, Schläge] ---- Oom-Pah: Grundton/Quinte im Wechsel ---- */
  const BASS = [
    ['D3',1],['A3',1],['D3',1],['A3',1],   // D
    ['G3',1],['D3',1],['G3',1],['D3',1],   // G
    ['A2',1],['E3',1],['A2',1],['E3',1],   // A
    ['D3',1],['A3',1],['D3',1],['A3',1],   // D
    ['D3',1],['A3',1],['D3',1],['A3',1],   // D
    ['G3',1],['D3',1],['G3',1],['D3',1],   // G
    ['A2',1],['E3',1],['A2',1],['E3',1],   // A
    ['D3',1],['A3',1],['D3',1],['F#3',1],  // D (kleine Wendung)
  ];

  /* ---- Stimmen ---- beide Sequenzen summieren sich auf 32 Schläge ---- */
  const VOICES = [
    { seq:MELODY, type:'square', cut:2800, peak:0.18, pluck:true  },
    { seq:BASS,   type:'square', cut:850,  peak:0.15, pluck:false },
  ];

  /* ---- eine Note planen ---- */
  function scheduleNote(v, name, time, beats){
    if(name === 'R' || !F[name]) return;
    const dur = beats * SPB;
    const osc = ctx.createOscillator();
    const gn  = ctx.createGain();
    const lp  = ctx.createBiquadFilter();
    osc.type = v.type;
    osc.frequency.value = F[name];
    lp.type = 'lowpass';
    lp.frequency.value = v.cut;
    gn.gain.setValueAtTime(0.0001, time);
    gn.gain.exponentialRampToValueAtTime(v.peak, time + 0.008);   // schneller Anschlag
    if(v.pluck){
      // gezupfter Klang (Laute/Cembalo-Anmutung): kurzer Decay auf Sustain
      gn.gain.exponentialRampToValueAtTime(v.peak * 0.4, time + Math.min(0.12, dur * 0.5));
    } else {
      // Bass: runder halten, dann am Ende ausblenden
      gn.gain.exponentialRampToValueAtTime(v.peak * 0.7, time + dur * 0.6);
    }
    gn.gain.exponentialRampToValueAtTime(0.0001, time + dur * 0.92);
    osc.connect(lp); lp.connect(gn); gn.connect(master);
    osc.start(time);
    osc.stop(time + dur + 0.05);
  }

  /* ---- Lookahead-Scheduler: plant je Stimme ~150 ms im Voraus ---- */
  function scheduler(){
    const horizon = ctx.currentTime + 0.15;
    VOICES.forEach((v, vi) => {
      const c = cursors[vi];
      while(c.t < horizon){
        const [name, beats] = v.seq[c.i];
        scheduleNote(v, name, c.t, beats);
        c.t += beats * SPB;
        c.i = (c.i + 1) % v.seq.length;   // nahtlose Schleife
      }
    });
  }

  function applyVolume(){
    if(!master) return;
    const t = ctx.currentTime;
    master.gain.cancelScheduledValues(t);
    master.gain.linearRampToValueAtTime(enabled ? 0.5 : 0.0, t + 0.3);
  }

  /* ---- öffentlich: Musik starten (nur aus einer Nutzergeste!) ---- */
  function start(){
    if(ctx){
      if(ctx.state === 'suspended') ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if(!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = enabled ? 0.5 : 0.0;
    master.connect(ctx.destination);
    const t0 = ctx.currentTime + 0.1;
    cursors = VOICES.map(() => ({ i: 0, t: t0 }));
    scheduler();
    schedTimer = setInterval(scheduler, 60);
    updateButton();
  }

  /* ---- öffentlich: an/aus umschalten ---- */
  function toggle(){
    enabled = !enabled;
    localStorage.setItem(STORE_KEY, enabled ? 'an' : 'aus');
    if(enabled && !ctx) start();
    else if(enabled && ctx.state === 'suspended') ctx.resume();
    applyVolume();
    updateButton();
  }

  function updateButton(){
    const btn = document.getElementById('btn-music');
    if(!btn) return;
    btn.textContent = enabled ? '🎵' : '🔇';
    btn.title = enabled ? 'Musik aus' : 'Musik an';
    btn.setAttribute('aria-label', enabled ? 'Musik ausschalten' : 'Musik einschalten');
    btn.setAttribute('aria-pressed', String(enabled));
  }

  // global verfügbar machen
  window.KippoMusik = {
    start, toggle, isEnabled: () => enabled, updateButton,
    state: () => (ctx ? ctx.state : 'none'),   // 'running' | 'suspended' | 'none'
  };

  window.addEventListener('DOMContentLoaded', updateButton);
})();
