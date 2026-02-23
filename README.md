# 🤖 Discord Bot & Dashboard

Un bot Discord multifonctions avec un dashboard web moderne et élégant pour piloter votre serveur en temps réel.

---

## ✨ Fonctionnalités / Features

### 🛠️ Administration & Modération
- **Système de Tickets** : Support client avec transcriptions.
- **Autorole** : Attribution automatique de rôle aux nouveaux membres.
- **Modération** : Commandes `ban`, `kick`, `timeout`, `clear`, `unban`.
- **XP & Niveaux** : Système de rangs, leaderboard et rôles d'activité automatiques.

### 🌐 Dashboard Web
- **Interface Premium** : Design moderne avec glassmorphism et animations fluides.
- **Multi-Pages** : Configuration séparée pour le Général, les Commandes, les Rôles et les Tickets.
- **Annonces** : Envoyer des messages directement depuis l'interface web.
- **Statistiques** : Vue d'ensemble des membres et des rôles du serveur.

### 🎡 Fun & Utilité
- **Roue de la Fortune** : Animation GIF dynamique générée à la volée.
- **Utilitaires** : `serverinfo`, `userinfo`, `rank`, `poll`, `avatar`, `ping`.

---

## 🚀 Installation

### 🐳 Via Docker (Recommandé)

1. **Prérequis** : Docker & Docker Compose installés.
2. **Configuration** : Copiez le fichier `.env.example` en `.env` et remplissez vos informations.
3. **Lancement** :
   ```bash
   docker-compose up -d
   ```
4. **Déploiement des commandes** :
   ```bash
   docker-compose exec bot npm run deploy
   ```

### 💻 Installation Standard

1. **Prérequis** : Node.js 20+ et environnement de build pour `node-canvas`.
2. **Installation** :
   ```bash
   npm install
   ```
3. **Configuration** : Remplissez le fichier `.env`.
4. **Déploiement** :
   ```bash
   npm run deploy
   ```
5. **Démarrage** :
   ```bash
   npm start
   ```

---

## ⚙️ Configuration (.env)

| Variable | Description |
| --- | --- |
| `DISCORD_TOKEN` | Token secret de votre bot (Discord Developer Portal). |
| `CLIENT_ID` | ID de votre application bot. |
| `GUILD_ID` | ID de votre serveur principal (pour le déploiement rapide). |
| `DASHBOARD_PORT` | Port utilisé par l'interface web (défaut: 3000). |
| `DEPLOY_GLOBAL` | `true` pour déployer les commandes sur tous les serveurs. |

---

---

## 📂 Structure du Projet

```text
.
├── dashboard/          # Interface web (frontend statique)
├── data/               # Données persistantes (JSON, SQLite)
├── scripts/            # Scripts utilitaires (déploiement, etc.)
├── src/                # Code source principal
│   ├── commands/       # Commandes Slash Discord
│   ├── core/           # Logique centrale (dashboard, config, xp)
│   ├── events/         # Gestionnaires d'événements Discord
│   ├── utils/          # Fonctions utilitaires
│   └── index.js        # Point d'entrée du Bot
├── Dockerfile          # Configuration Docker
├── docker-compose.yml  # Orchestration Docker
└── package.json        # Dépendances et scripts
```

---

## 🛠️ Stack Technique

- **Backend** : Node.js, Discord.js v14, Express.
- **Frontend** : Vanille HTML/CSS/JS (Modern Visuals).
- **Rendu** : Node-canvas, Fluent-ffmpeg.
- **Infrastructure** : Docker, Docker-compose.

---

## 📝 Licence

Ce projet est sous licence **MIT**. Voir le fichier [LICENSE](LICENSE) pour plus de détails.
