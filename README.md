# Scioperi e manifestazioni

Scioperi di treni, bus e aerei e cortei in Italia, città per città. Aggiornato ogni mattina.

Il sito è `index.html`, generato da `src/`:

```
node src/build.mjs src/template.html src/geo.json src/events.json /tmp/body.html
python3 src/wrap_site.py /tmp/body.html index.html
```

I dati degli eventi stanno in `src/events.json`.
