// GolDragon — serveur relais WebSocket
// Ce serveur ne connaît RIEN au jeu : il regroupe les connexions par "code de salle"
// et relaie les messages entre les joueurs d'une même salle. Toute la logique
// (physique, tir, score...) reste dans le client (game.html), exactement comme
// avant avec la fonctionnalité "room" de Claude — seul le transport change.

const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

// rooms: Map<code, Map<id, {ws, presence}>>
const rooms = new Map();

function getRoom(code) {
  if (!rooms.has(code)) rooms.set(code, new Map());
  return rooms.get(code);
}

function broadcastPeers(code) {
  const room = rooms.get(code);
  if (!room) return;
  const peers = [...room.values()].map(c => ({ id: c.id, presence: c.presence }));
  const payload = JSON.stringify({ type: 'peers', peers });
  for (const client of room.values()) {
    if (client.ws.readyState === WebSocket.OPEN) client.ws.send(payload);
  }
}

function broadcastEvent(code, fromId, event, data) {
  const room = rooms.get(code);
  if (!room) return;
  const payload = JSON.stringify({ type: 'event', event, data });
  for (const client of room.values()) {
    if (client.id !== fromId && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(payload);
    }
  }
}

const server = http.createServer((req, res) => {
  // Sert le jeu (public/index.html) sur "/" en plus de gérer les WebSockets.
  // Cela permet de partager UNE SEULE URL (ce serveur) à tes amis, sans
  // dépendre de la page Claude — donc aucune restriction réseau du côté
  // artifact Claude ne peut bloquer la connexion.
  const filePath = req.url === '/' ? path.join(PUBLIC_DIR, 'index.html') : path.join(PUBLIC_DIR, req.url);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('GolDragon relay server OK\n');
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(data);
  });
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  let joinedCode = null;
  let joinedId = null;

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch (e) { return; }

    if (msg.type === 'join') {
      const code = String(msg.code || '').trim().toUpperCase().slice(0, 24);
      const id = String(msg.id || '').slice(0, 64);
      if (!code || !id) return;
      const room = getRoom(code);
      // Limite douce à 2 joueurs actifs ; un 3e connecté sera accepté mais
      // le client ne gère que 2 rôles (hôte/invité) donc à éviter côté usage.
      room.set(id, { ws, id, presence: {} });
      joinedCode = code;
      joinedId = id;
      broadcastPeers(code);
      return;
    }

    if (!joinedCode || !joinedId) return; // doit avoir rejoint une salle d'abord
    const room = rooms.get(joinedCode);
    if (!room || !room.has(joinedId)) return;

    if (msg.type === 'presence') {
      const client = room.get(joinedId);
      client.presence = Object.assign({}, client.presence, msg.data || {});
      broadcastPeers(joinedCode);
      return;
    }

    if (msg.type === 'emit') {
      broadcastEvent(joinedCode, joinedId, msg.event, msg.data);
      return;
    }
  });

  ws.on('close', () => {
    if (joinedCode && joinedId) {
      const room = rooms.get(joinedCode);
      if (room) {
        room.delete(joinedId);
        if (room.size === 0) {
          rooms.delete(joinedCode);
        } else {
          broadcastPeers(joinedCode);
        }
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`GolDragon relay server listening on port ${PORT}`);
});
