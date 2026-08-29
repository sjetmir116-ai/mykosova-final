// KOLEKTORI I REZULTATEVE TË TESTEVE TË SIGURISË
// Mban portin 9999 — faqja e testit (te browser-i i përdoruesit) i POST-ën
// rezultatet këtu, dhe agjenti i lexon nga rezultate-testit.json
import http from 'http';
import fs from 'fs';

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  if (req.method === 'POST' && req.url === '/rezultatet') {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      try {
        const r = JSON.parse(body);
        fs.writeFileSync('rezultate-testit.json', JSON.stringify(r, null, 2));
        console.log('=== REZULTATET U MORËN ===');
        console.log('mire=' + r.mire + ' gabim=' + r.gabim + ' roli=' + r.roli + ' kohe=' + r.kohe);
        (r.testet || []).forEach((t) => {
          console.log((t.ok ? '✅' : '❌') + ' ' + t.emri + ' → ' + t.rez + ' (pritur: ' + t.priturja + ')');
        });
      } catch (e) {
        console.error('Gabim në parse: ' + e.message);
        console.error(body.slice(0, 500));
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end('{"mire":true}');
    });
    return;
  }

  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('collector siguri OK');
});

server.listen(9999, '0.0.0.0', () => {
  console.log('KOLEKTORI I REZULTATEVE — port 9999 gati');
});
