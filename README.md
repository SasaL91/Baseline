# App Musica

Lettore musicale offline (PWA) per uso personale: riproduce i file audio salvati sul dispositivo.
Pensato per PC (Chrome/Edge) e Android (Chrome).

- La musica **non viene mai caricata online né copiata**: l'app legge i file direttamente dal dispositivo.
- Nessuna libreria salvata: a ogni apertura si sceglie di nuovo la cartella o i file.
- Dopo la prima visita funziona anche senza connessione (modalità aereo).

## File

| File | A cosa serve |
|---|---|
| `index.html` | L'app (HTML, CSS e JavaScript in un unico file) |
| `manifest.webmanifest` | Nome, colori e icone per l'installazione |
| `sw.js` | Service worker: salva i file dell'app per l'uso offline |
| `icons/` | Icone (normali, "maskable" per Android, favicon) |
| `test-logica.js` | Test della logica di riproduzione e dei contrasti dei colori |

## Provarla sul PC

Il service worker non funziona aprendo `index.html` con un doppio clic: serve un piccolo server locale.
Dalla cartella del progetto:

```powershell
python -m http.server 8000
```

Poi apri <http://localhost:8000> con Chrome o Edge.

Test della logica di riproduzione (serve [Node.js](https://nodejs.org), nessuna dipendenza):

```powershell
node test-logica.js
```

## Pubblicazione su GitHub Pages (gratis)

1. Su GitHub crea un nuovo repository, per esempio `app-musica`.
   Con un account gratuito deve essere **pubblico**: contiene solo il codice dell'app, mai la tua musica.
2. Dalla cartella del progetto collega il repository e invia il codice
   (sostituisci `UTENTE` con il tuo nome utente GitHub):

   ```powershell
   git remote add origin https://github.com/UTENTE/app-musica.git
   git push -u origin main
   ```

3. Su GitHub apri il repository → **Settings** → **Pages**.
   In *Build and deployment* scegli **Source: Deploy from a branch**, poi **Branch: `main`** e cartella **`/ (root)`** → **Save**.
4. Dopo un paio di minuti l'app è online su `https://UTENTE.github.io/app-musica/`.

L'app usa solo percorsi relativi, quindi funziona anche in un sottopercorso come questo.

### Pubblicare un aggiornamento

1. Modifica i file.
2. In `sw.js` aumenta la versione della cache: `app-musica-v1` → `app-musica-v2` (e così via).
   Senza questo passo i dispositivi continuerebbero a usare la versione salvata.
3. `git commit` e `git push`.

I dispositivi scaricano la nuova versione alla prima apertura con connessione e la mostrano dall'apertura successiva.

## Installazione

### PC (Chrome o Edge)

1. Apri l'indirizzo dell'app.
2. Clicca l'icona **Installa** a destra nella barra degli indirizzi
   (oppure dal menu del browser: in Chrome *Trasmetti, salva e condividi → Installa pagina come app*,
   in Edge *App → Installa questo sito come app*).
3. L'app compare nel menu Start e si può fissare sulla barra delle applicazioni.

### Android (Chrome)

1. Apri l'indirizzo dell'app in Chrome.
2. Menu **⋮** → **Aggiungi a schermata Home** → **Installa**
   (a volte Chrome propone direttamente «Installa app» in basso).
3. Apri l'app dall'icona sulla schermata Home: si avvia a schermo intero, senza barra degli indirizzi.

## Uso

- **Scegli cartella** carica tutti i brani della cartella, sottocartelle comprese.
  Se il browser non permette di scegliere una cartella, usa **Scegli file** e seleziona più brani insieme.
- Formati riconosciuti: mp3, m4a, aac, ogg, opus, wav, flac, webm (se un file non si riesce a riprodurre, l'app lo salta).
- Il titolo è il nome del file senza estensione.
- **Casuale** (attivo all'avvio): ordine mescolato; spento: ordine alfabetico. Cambiarlo non interrompe il brano in corso.
- **Ripeti**: il brano corrente ricomincia all'infinito quando finisce; Successivo e Precedente funzionano comunque.
- **Precedente**: oltre i 3 secondi torna all'inizio del brano; entro i 3 secondi va al brano precedente.
- **Elenco**: ricerca per nome, tocca un brano per farlo partire. Il tasto Indietro di Android chiude l'elenco.
- I piccoli pulsanti **Cartella** e **File** in alto sostituiscono l'elenco con una nuova scelta.
- Comandi da cuffie e auto Bluetooth, schermata di blocco e notifica di Android: play/pausa, precedente, successivo, avanti/indietro nel brano.
- Tastiera sul PC: **Spazio** play/pausa, **←/→** brano precedente/successivo, **Esc** chiude l'elenco.
