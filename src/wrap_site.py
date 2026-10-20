# Wraps the built app fragment into the full index.html for scioperioggi.com
import sys
src, out = sys.argv[1], sys.argv[2]
b = open(src).read(); i = b.index('<svg class="ic-defs"'); head, body = b[:i], b[i:]
desc = 'Scioperi di treni, bus e aerei e cortei in Italia, città per città. Aggiornato ogni mattina.'
open(out, 'w').write(f'''<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="description" content="{desc}">
<meta name="theme-color" content="#EEE8DC">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Scioperi">
<link rel="icon" href="icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="icon-180.png">
<link rel="manifest" href="manifest.webmanifest">
<meta property="og:type" content="website">
<meta property="og:url" content="https://scioperioggi.com/">
<meta property="og:title" content="scioperioggi">
<meta property="og:description" content="{desc}">
<meta property="og:image" content="https://scioperioggi.com/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="it_IT">
<meta name="twitter:card" content="summary_large_image">
{head}</head>
<body>
{body}
</body>
</html>
''')
