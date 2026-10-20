# scioperioggi

Scioperi di treni, bus e aerei e cortei in Italia, città per città. Aggiornato ogni mattina.
Sito: https://scioperioggi.com

## Com'è fatto

```
app/            sorgenti dell'app
  head.html     intestazione della pagina (meta, icone)
  body.html     struttura della pagina
  css/          stili, un file per parte (mappa, schermate, Oggi, benvenuto, computer)
  js/           codice, un modulo per parte
    main.js     avvio
    map/        mappa: disegno, zoom, segnaposti, striscia nazionale
    screens/    Oggi, Calendario, Aggiungi, scelta città, benvenuto, schede
    sheet.js    scheda di dettaglio
data/
  events.json   gli eventi (lo aggiorna l'attività del mattino)
  geo.json      confini delle regioni, generato dalla build
tools/
  build.mjs     costruisce index.html e assets/
  geo-source.json, prep_geo.mjs   geometria delle regioni
fonts/          caratteri ospitati qui (licenza OFL)
privacy.html    informativa privacy
```

`index.html` e `assets/` sono generati: non si modificano a mano.

## Costruire

```
npm install      # solo la prima volta
npm run build    # sito
npm run single   # una pagina sola con tutto dentro
```

Per aggiornare solo gli eventi basta cambiare `data/events.json`: la pagina li scarica all'apertura, non serve ricostruire.
