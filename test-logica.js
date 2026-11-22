// Test della logica di riproduzione e dei contrasti della palette.
// Uso: node test-logica.js   (nessuna dipendenza)
// Le funzioni vengono lette direttamente dal blocco <script id="logica"> di index.html,
// così si testa esattamente il codice che gira nell'app.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const codice = html.match(/<script id="logica">([\s\S]*?)<\/script>/)[1];
const L = new Function(`${codice}\nreturn Logica;`)();

let superati = 0;
function prova(nome, fn) {
  try {
    fn();
    superati++;
    console.log(`✓ ${nome}`);
  } catch (err) {
    console.error(`✗ ${nome}\n  ${err.message}`);
    process.exitCode = 1;
  }
}

// Generatore pseudo-casuale con seme (mulberry32): test ripetibili
function rng(seme) {
  return () => {
    seme = (seme + 0x6d2b79f5) | 0;
    let t = Math.imul(seme ^ (seme >>> 15), 1 | seme);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const indici = n => [...Array(n).keys()];
const ordinati = a => [...a].sort((x, y) => x - y);

const titoli = ['brano 10', 'Brano 2', 'àncora', 'Zebra', 'ancora b', 'Ecco', 'éclair', 'brano 1', 'Alfa', 'delta'];
const N = titoli.length;
const statoAlfabetico = (pos = 0) => {
  const alfa = L.ordineAlfabetico(titoli);
  return { alfa, ordine: alfa, pos, casuale: false, ripeti: false };
};

prova('mescola: permutazione completa, originale intatto', () => {
  const originale = indici(N);
  const m = L.mescola(originale, rng(1));
  assert.deepEqual(originale, indici(N));
  assert.deepEqual(ordinati(m), indici(N));
  assert.notDeepEqual(m, originale);
});

prova('mescola: distribuzione uniforme (Fisher-Yates)', () => {
  const primi = [0, 0, 0, 0];
  const r = rng(7);
  for (let k = 0; k < 40000; k++) primi[L.mescola([0, 1, 2, 3], r)[0]]++;
  for (const c of primi) assert.ok(Math.abs(c - 10000) < 500, `distribuzione sbilanciata: ${primi}`);
});

prova('ordine alfabetico naturale, insensibile a maiuscole e accenti', () => {
  assert.deepEqual(L.ordineAlfabetico(titoli).map(i => titoli[i]),
    ['Alfa', 'àncora', 'ancora b', 'brano 1', 'Brano 2', 'brano 10', 'delta', 'Ecco', 'éclair', 'Zebra']);
});

prova('stato iniziale: Casuale attivo, Ripeti spento, elenco mescolato', () => {
  const s = L.creaStato(titoli, rng(3));
  assert.equal(s.casuale, true);
  assert.equal(s.ripeti, false);
  assert.equal(s.pos, 0);
  assert.deepEqual(ordinati(s.ordine), indici(N));
});

prova('successivo e fine elenco senza Casuale: ricomincia dal primo in ordine alfabetico', () => {
  let s = statoAlfabetico();
  const visti = [];
  for (let k = 0; k < N + 2; k++) {
    visti.push(L.branoCorrente(s));
    s = L.successivo(s, rng(5));
  }
  assert.deepEqual(visti, [...s.alfa, s.alfa[0], s.alfa[1]]);
});

prova('fine elenco con Casuale: rimescola, suona tutto, non ripete subito l\'ultimo brano', () => {
  for (let seme = 1; seme <= 400; seme++) {
    const n = 2 + (seme % 4); // elenchi da 2 a 5 brani: i casi più a rischio
    const r = rng(seme);
    let s = L.creaStato(indici(n).map(String), r);
    for (let giro = 0; giro < 3; giro++) {
      const visti = [];
      for (let k = 0; k < n; k++) {
        visti.push(L.branoCorrente(s));
        s = L.successivo(s, r);
      }
      assert.deepEqual(ordinati(visti), indici(n), 'ogni giro suona tutti i brani una volta');
      assert.equal(s.pos, 0);
      assert.notEqual(L.branoCorrente(s), visti[n - 1], 'il nuovo giro non inizia con l\'ultimo brano');
    }
  }
});

prova('elenco di un solo brano: successivo e precedente riavviano lo stesso brano', () => {
  for (const casuale of [true, false]) {
    const s = L.impostaCasuale(L.creaStato(['unico'], rng(1)), casuale, rng(1));
    assert.equal(L.branoCorrente(L.successivo(s, rng(2))), 0);
    assert.equal(L.precedente(s, 1), s);
  }
});

prova('precedente: regola dei 3 secondi', () => {
  const s = statoAlfabetico(4);
  assert.equal(L.precedente(s, 3.5), s, 'oltre i 3 s: stesso stato = riavvia il brano');
  assert.equal(L.precedente(s, 3).pos, 3, 'entro i 3 s: brano precedente');
  assert.equal(L.precedente(s, 0.2).pos, 3);
  const primo = statoAlfabetico(0);
  assert.equal(L.precedente(primo, 1), primo, 'primo brano: si riavvia e basta');
  // due pressioni rapide: la prima riavvia (il tempo torna a 0), la seconda va al precedente
  const dopoPrima = L.precedente(s, 42);
  assert.equal(L.precedente(dopoPrima, 0).pos, 3);
});

prova('Ripeti: a fine brano resta lo stesso; Successivo avanza comunque', () => {
  const s = L.impostaRipeti(statoAlfabetico(2), true);
  assert.equal(L.fineBrano(s, rng(1)), s);
  assert.equal(L.successivo(s, rng(1)).pos, 3);
  const senza = L.impostaRipeti(s, false);
  assert.equal(senza.pos, 2);
  assert.equal(senza.ordine, s.ordine);
  assert.equal(L.fineBrano(senza, rng(1)).pos, 3);
});

prova('cambio Casuale: il brano in corso resta e il nuovo ordine prosegue da lì', () => {
  const r = rng(9);
  let s = L.creaStato(titoli, r);
  s = L.successivo(L.successivo(s, r), r); // a metà elenco
  const corrente = L.branoCorrente(s);

  const alfabetico = L.impostaCasuale(s, false, r);
  assert.equal(alfabetico.casuale, false);
  assert.equal(L.branoCorrente(alfabetico), corrente);
  assert.deepEqual(alfabetico.ordine, L.ordineAlfabetico(titoli));
  assert.equal(L.branoCorrente(L.successivo(alfabetico, r)), alfabetico.alfa[(alfabetico.pos + 1) % N]);

  const mescolato = L.impostaCasuale(alfabetico, true, r);
  assert.equal(mescolato.casuale, true);
  assert.equal(L.branoCorrente(mescolato), corrente);
  assert.equal(mescolato.pos, 0);
  assert.deepEqual(ordinati(mescolato.ordine), indici(N));
});

prova('scelta dall\'elenco: parte il brano toccato, ordine invariato', () => {
  const s = L.creaStato(titoli, rng(2));
  const scelto = L.vaiABrano(s, 7);
  assert.equal(L.branoCorrente(scelto), 7);
  assert.equal(scelto.ordine, s.ordine);
});

prova('filtro dei file audio per estensione o MIME type', () => {
  for (const nome of ['a.mp3', 'B.MP3', 'c.m4a', 'd.aac', 'e.ogg', 'f.opus', 'g.wav', 'h.flac', 'i.webm']) {
    assert.ok(L.eFileAudio(nome, ''), nome);
  }
  for (const nome of ['cover.jpg', 'playlist.m3u', 'note.txt', 'mp3', 'video.mp4']) {
    assert.ok(!L.eFileAudio(nome, ''), nome);
  }
  assert.ok(L.eFileAudio('senza-estensione', 'audio/mpeg'));
  assert.ok(!L.eFileAudio('lista.m3u', 'audio/x-mpegurl'));
});

prova('titolo, ricerca e formato del tempo', () => {
  assert.equal(L.titoloDaNome('01 - Canzone.mp3'), '01 - Canzone');
  assert.equal(L.titoloDaNome('a.b.flac'), 'a.b');
  assert.equal(L.titoloDaNome('senza'), 'senza');
  assert.equal(L.normalizza('Perché ÀÈ'), 'perche ae');
  assert.equal(L.formattaTempo(0), '0:00');
  assert.equal(L.formattaTempo(65.9), '1:05');
  assert.equal(L.formattaTempo(3725), '1:02:05');
  assert.equal(L.formattaTempo(NaN), '0:00');
});

prova('contrasti WCAG AA della palette (letti da index.html)', () => {
  const colori = Object.fromEntries([...html.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})/gi)].map(m => [m[1], m[2]]));
  const luminanza = hex => {
    const [r, g, b] = [1, 3, 5].map(i => {
      const c = parseInt(hex.slice(i, i + 2), 16) / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const coppie = [
    ['testo', 'sfondo', 4.5, 'testi bianchi sullo sfondo'],
    ['su-accento', 'accento', 4.5, 'icone e testi sui pulsanti azzurri'],
    ['accento', 'sfondo', 4.5, 'pulsanti, bordi e barra azzurri sullo sfondo'],
    ['testo', 'superficie', 4.5, 'testi su campo di ricerca e avvisi'],
    ['traccia', 'sfondo', 3, 'barra non ascoltata (elemento grafico)'],
  ];
  for (const [primo, secondo, minimo, uso] of coppie) {
    const [chiaro, scuro] = [luminanza(colori[primo]), luminanza(colori[secondo])].sort((a, b) => b - a);
    const rapporto = (chiaro + 0.05) / (scuro + 0.05);
    console.log(`    ${rapporto.toFixed(2)}:1 (min ${minimo}) ${uso}`);
    assert.ok(rapporto >= minimo, `${primo} su ${secondo}: ${rapporto.toFixed(2)} < ${minimo}`);
  }
});

console.log(process.exitCode ? '\nAlcuni test NON sono passati.' : `\nTutti i ${superati} test sono passati.`);
