# Utilisation d'une version légère de Node.js
FROM node:20-slim

# Installation des dépendances système nécessaires pour node-canvas et le bot
# build-essential et les libs cairo/pango sont requis par canvas pour le rendu graphique
# ffmpeg est requis pour les fonctionnalités vidéo/timelapse
RUN apt-get update && apt-get install -y \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Création du répertoire de travail
WORKDIR /app

# Copie des fichiers de package pour l'installation des dépendances
COPY package*.json ./

# Installation des dépendances
# --build-from-source garantit que canvas est bien compilé pour l'OS Docker
RUN npm install

# Copie du reste des fichiers source
COPY . .

# Création du dossier data s'il n'existe pas pour la persistance
RUN mkdir -p /app/data

# Exposition du port du dashboard
EXPOSE 3000

# Commande de démarrage
CMD ["npm", "start"]
