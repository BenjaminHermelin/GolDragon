# Serveur multijoueur GolDragon

Ce petit serveur (Node.js + WebSocket) héberge **à la fois le jeu et le
relais réseau**, pour que n'importe qui puisse y jouer en ligne, sans compte
Claude et sans dépendre des restrictions réseau des pages publiées sur
Claude. Une fois déployé, tu obtiens **une seule URL** à partager avec tes
amis (ex. `https://goldragon-server.onrender.com`) — ils l'ouvrent dans leur
navigateur, comme n'importe quel site.

Dossier fourni :
- `server.js` — le serveur (sert le jeu + relaie les messages réseau)
- `package.json` — dépendances
- `public/index.html` — le jeu lui-même (ne pas renommer ce dossier/fichier)
- `README.md` — ce guide

## 1. Déployer le serveur (gratuit, ~5 minutes) — méthode Render

1. Va sur https://render.com et crée un compte gratuit (tu peux te connecter
   avec GitHub).
2. Crée un nouveau dépôt GitHub (ex. `goldragon-server`) et mets-y les
   fichiers **en conservant la structure de dossiers** : `server.js`,
   `package.json`, et le dossier `public/` contenant `index.html`.
   - Le plus simple : sur GitHub, clique "Add file → Upload files", glisse
     tous les fichiers et dossiers, puis "Commit changes" (GitHub conserve
     l'arborescence des dossiers glissés).
3. Sur Render, clique **New → Web Service**, connecte ton dépôt GitHub
   `goldragon-server`.
4. Configuration :
   - **Runtime** : Node
   - **Build Command** : `npm install`
   - **Start Command** : `npm start`
   - **Instance type** : Free
5. Clique **Create Web Service**. Après 1-2 minutes, Render te donne une URL
   du type `https://goldragon-server.onrender.com`.
6. **C'est cette URL (`https://...`) que tu partages avec tes amis** — ils
   l'ouvrent dans leur navigateur et arrivent directement sur le jeu, servi
   par ton serveur. L'URL du serveur WebSocket (`wss://...`) est détectée
   automatiquement par la page, pas besoin de la saisir.

> ⚠️ Sur le plan gratuit de Render, le serveur "s'endort" après ~15 min
> d'inactivité et met quelques secondes à se réveiller au prochain lien.
> Rien de grave pour jouer entre amis — connectez-vous juste tous les deux
> à quelques secondes d'intervalle.

### Alternatives à Render
- **Railway** (railway.app) : même principe, "Deploy from GitHub repo".
- **Glitch** (glitch.com) : importe le dossier tel quel, il tourne en
  continu tant que le projet est visité régulièrement.
- **Un VPS / ta propre machine** : `npm install && npm start`, en
  t'assurant que le port choisi est accessible depuis Internet (et utilise
  de préférence un certificat TLS pour du vrai `wss://`).

## 2. Jouer avec un ami

1. Envoie ton URL Render (ex. `https://goldragon-server.onrender.com`) à ton
   ami. Vous ouvrez chacun cette URL dans votre navigateur.
2. Cliquez tous les deux sur **Jouer**.
3. L'URL du serveur est déjà pré-remplie automatiquement. Il ne reste qu'à
   saisir un **code de salle** identique des deux côtés (ex. `PARTIE1`,
   à inventer et à se communiquer par message).
4. Cliquez sur **Se connecter**. Dès que vous êtes deux connectés au même
   code, la partie démarre automatiquement (le premier arrivé est l'hôte,
   il choisira la carte).

Le code de salle est mémorisé sur chaque appareil pour la prochaine fois.

> Astuce : si l'un de vous accède plutôt au jeu via le lien de l'artifact
> Claude (au lieu de ton URL Render), le champ URL du serveur ne sera pas
> pré-rempli — il faudra alors renseigner manuellement
> `wss://goldragon-server.onrender.com`. Pour éviter toute confusion, le
> plus simple est que **tout le monde utilise ton URL Render**, pas le lien
> Claude.

## Notes techniques

- Le serveur ne stocke rien : pas de base de données, pas de compte, pas de
  persistance entre parties.
- Une "salle" (room) est juste une clé en mémoire regroupant les connexions
  WebSocket partageant le même code ; elle est supprimée dès que tout le
  monde s'est déconnecté.
- Le serveur ne fait aucune vérification de triche : comme avant, l'hôte
  fait autorité sur la simulation du jeu (host-authoritative netcode).
