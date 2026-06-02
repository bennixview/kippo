/* ============================================================
   KIPPO — Hintergrundmusik
   Eine kleine mittelalterliche Melodie, prozedural per Web Audio
   API erzeugt (keine externen Audiodateien). Dorische Tonart über
   einem Quint-Bordun (Dudelsack-/Drehleier-Anmutung), Chiptune-Klang
   passend zur Pixel-Optik.
   ============================================================ */
(function(){
  const STORE_KEY = 'kippo-musik';   // 'an' | 'aus' in localStorage

  let ctx       = null;   // AudioContext (erst nach Nutzergeste)
  let master    = null;   // Gesamt-Lautstärke (0 = stumm)
  let melodyMix = null;   // Bus für die Melodiestimme
  let droneNodes= [];     // dauerhaft klingender Bordun
  let schedTimer= null;   // Lookahead-Scheduler
  let nextTime  = 0;      // Startzeit der nächsten Note (AudioContext-Uhr)
  let step      = 0;      // Index in der Melodie
  let running   = false;  // Scheduler aktiv?
  let enabled   = (localStorage.getItem(STORE_KEY) !== 'aus'); // Default: an

  /* ---- Tonhöhen (Hz) ---- D-dorisch + Bordun-Töne ---- */
  const F = {
    R:0,                         // Pause
    D3:146.83, A3:220.00,        // Bordun (Quinte)
    D4:293.66, E4:329.63, F4:349.23, G4:392.00,
    A4:440.00, B4:493.88, C5:523.25, D5:587.33,
  };

  const TEMPO = 100;             // Schläge je Minute
  const SPB   = 60 / TEMPO;      // Sekunden je Schlag (Viertel)

  /* ---- Melodie: [Ton, Schläge] ---- zwei Phrasen (A, B) ----
     Modal, schreitend, mit kleinen Verzierungen — klingt nach
     Estampie/Tanz des 14. Jh. */
  const MELODY = [
    // Phrase A
    ['A4',1],['A4',1],['G4',1],['F4',1],
    ['G4',1],['A4',2],['D4',1],
    ['F4',1],['G4',1],['A4',1],['B4',1],
    ['A4',1],['G4',2],['R',1],
    // Phrase B
    ['D5',1],['C5',1],['B4',1],['A4',1],
    ['G4',1],['A4',2],['F4',1],
    ['E4',1],['F4',1],['G4',1],['E4',1],
    ['D4',2],['R',1],['R',1],
  ];

  /* ---- eine Melodienote planen ---- */
  function scheduleNote(name, time, dur){
    if(name === 'R' || !F[name]) return;
    const osc = ctx.createOscillator();
    const gn  = ctx.createGain();
    const lp  = ctx.createBiquadFilter();
    osc.type = 'square';                 // Chiptune-Grundklang
    osc.frequency.value = F[name];
    lp.type = 'lowpass';                 // nimmt die Schärfe (Flötenton)
    lp.frequency.value = 1700;
    const peak = 0.22;
    // sanfte Hüllkurve, damit es nicht klickt
    gn.gain.setValueAtTime(0.0001, time);
    gn.gain.exponentialRampToValueAtTime(peak, time + 0.02);
    gn.gain.setValueAtTime(peak, time + dur * SPB * 0.65);
    gn.gain.exponentialRampToValueAtTime(0.0001, time + dur * SPB * 0.98);
    osc.connect(lp); lp.connect(gn); gn.connect(melodyMix);
    osc.start(time);
    osc.stop(time + dur * SPB + 0.05);
  }

  /* ---- Lookahead-Scheduler: plant Noten ~150 ms im Voraus ---- */
  function scheduler(){
    while(nextTime < ctx.currentTime + 0.15){
      const [name, beats] = MELODY[step];
      scheduleNote(name, nextTime, beats);
      nextTime += beats * SPB;
      step = (step + 1) % MELODY.length;   // nahtlose Schleife
    }
  }

  /* ---- Bordun (zwei dauerhafte Töne, Quinte D + A) ---- */
  function startDrone(){
    [F.D3, F.A3].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gn  = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gn.gain.value = i === 0 ? 0.10 : 0.07;  // tiefer Ton etwas lauter
      osc.connect(gn); gn.connect(master);
      osc.start();
      droneNodes.push(osc);
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
    if(ctx){                       // schon initialisiert → ggf. fortsetzen
      if(ctx.state === 'suspended') ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if(!AC) return;                // Browser ohne Web Audio: still scheitern
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = enabled ? 0.5 : 0.0;
    master.connect(ctx.destination);
    melodyMix = ctx.createGain();
    melodyMix.gain.value = 1.0;
    melodyMix.connect(master);
    startDrone();
    nextTime = ctx.currentTime + 0.1;
    step = 0;
    running = true;
    scheduler();
    schedTimer = setInterval(scheduler, 60);
    updateButton();
  }

  /* ---- öffentlich: an/aus umschalten ---- */
  function toggle(){
    enabled = !enabled;
    localStorage.setItem(STORE_KEY, enabled ? 'an' : 'aus');
    if(enabled && !ctx) start();   // beim ersten Einschalten initialisieren
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

  // Button-Beschriftung initialisieren, sobald das DOM steht
  window.addEventListener('DOMContentLoaded', updateButton);
})();
