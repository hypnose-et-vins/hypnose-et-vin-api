# Déploiement de l'application sur un serveur privé

## Choisir un serveur et un nom de domaine

- Le choix du provider est libre, cependant il est recommandé de disposer d'au moins un 1 Go de Ram et 30 Go d'espace de stockage . La procédure suivante a été testée sur ce VPS (ubuntu 20.04)
- Acheter un nom de domaine et le faire pointer sur l'adresse du serveur (il sera référencé dans ce document sous l'alias [NOM DE DOMAINE])

## Installer Docker sur le serveur :

- Se connecter en SSH au serveur sous ubuntu, puis tapez les commandes suivantes

```SH
sudo apt-get update
 sudo apt-get install \
  apt-transport-https \
 ca-certificates \
 curl \
 gnupg-agent \
 software-properties-common \
 ufw
 curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
 sudo apt-key fingerprint 0EBFCD88
 vsudo add-apt-repository \
 "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
 $(lsb_release -cs) \
 stable"
 sudo apt-get update
 sudo apt-get install docker-ce docker-ce-cli containerd.io
 sudo usermod -aG docker $USER
 newgrp docker
 ```

- Installation Caprover :
sudo ufw allow 80,443,3000,996,7946,4789,2377/tcp; sudo ufw allow 7946,4789,2377/udp;
docker run -p 80:80 -p 443:443 -p 3000:3000 -v /var/run/docker.sock:/var/run/docker.sock -v /captain:/captain caprover/caprover

- Attendre 60 secondes
- Aller à l'adresse : http://[NOM DE DOMAINE]:3000/
- Mot de passe : captain42
- Aller à "settings" -> change password (et changez le mot de passe)
- Aller sur le dashboard, section "CapRover Root Domain Configurations", mettre [NOM DE DOMAINE] dans l'input et cliquer sur "update domain", se relogger et cliquer sur "enable https" puis "Force https".
- Caprover est désormais accessible ici : https://captain.[NOM DE DOMAINE]

## STEP 1 : créer la base de donnée

- Caprover > Apps > One-Click Apps/Databases > MySQL
- App name : api
- MySQL Root password :  [DB_PASS]
- MySQL version : 5.7
- Deploy

## STEP 2 : créer l'interface d'admin de la base de donnée

- Caprover > Apps > One-Click Apps/Databases > PHPMyAdmin
- app name : db-admin
- Deploy
- Caprover > Apps > db-admin > Enable HTTPS et cocher Force HTTPS by redirecting all HTTP traffic to HTTPS et "Save & Update"
- Aller à https://db-admin.[NOM DOMAINE]/
- Serveur : srv-captain--api-db
- utilisateur : root
- mot de passe :  [DB_PASS]
- Cliquer sur "Nouvelle base de données" dans le menu de gauche de PHPMyAdmin.
- Entrer "hypnoseetvins_database" dans le champ "Nom de la base de donnée", encodage ‘utf8_bin’, puis cliquer sur le bouton "créer" à droite du champ nom.

## STEP 3 : créer l'API

- Caprover > Apps > entrer "api" dans l'input, cocher "Has persistant data" , cliquer sur le bouton "Create New App"
- Caprover > Apps > api > Enable HTTPS et cocher Force HTTPS by redirecting all HTTP traffic to HTTPS, mettre 5000 dans le champs "Container HTTP Port" et cliquer sur "Save & Update"
- onglet App Configs, Environmental Variables: cocher "bulk edit" et copier dans le champ :
```SH
SERVER_PORT=5000
DB_HOST=srv-captain--api-db
DB_PORT=3306
DB_USER=root
DB_PASS=[DB_PASS]
DB_NAME=hypnoseetvins_database
SESSION_COOKIE_NAME=hypnose_et_vins_session_id
SESSION_COOKIE_SECRET=[SESSION_COOKIE_SECRET]
CORS_ALLOWED_ORIGINS=https://front-office.hypnose-et-vins.duckdns.org,https://back-office.hypnose-et-vins.duckdns.org
SENDINBLUE_API_KEY=[SENDINBLUE_API_KEY]
MAIL_TO=[MAIL_TO]
CLIENT_URL=https://front-office.hypnose-et-vins.duckdns.org/
NODE_ENV=production
```

- Cliquer sur "Add Persistent directory" plus bas
- Renseigner dans Path in App : /usr/src/app/file-storage
- Label : file-storage
- Cliquer sur "Save & Update"
- Onglet "Deployement"
- Aller à Method 3: Deploy from Github/Bitbucket/Gitlab
- Repository : https://github.com/hypnose-et-vins/lyon-js-sept2020-p3-vh-api
- Branch : main
- Username : hypnoseetvins
- Password : [GH_PASSWORD]
- Cliquer sur "Save & Update"
- Copier la valeur du champs apparu dans "Method 3: Deploy from Github/Bitbucket/Gitlab"
- Aller sur https://github.com/hypnose-et-vins/lyon-js-sept2020-p3-vh-api/settings/hooks
- Cliquer sur "add webhook"
- Coller la valeur de l'input copiée précédement dans le champs Payload URL de github, cliquer sur le bouton vert "Add webhook".
Desormais, après chaque push sur la branche main du repository de l'API, elle sera redéployée automatiquement pour intégrer les nouveaux développements.

## STEP 4 : (optionnel) Mise en place d'un stockage de fichiers

Si l'API doit servir des fichiers uploadés par les utilisateurs sur le système (tel que des images de profil), il peut être utile d'avoir une interface pour visualiser et gérer les fichiers produits et consommés par l'API.

- Caprover > Apps > One-click Apps/Databases > Filebrowser
- app name : filebrowser
- Deploy
- Enable https, cocher "Force HTTPS by redirecting all HTTP traffic to HTTPS", cliquer sur "Save & Update"
- Onglet App configs
- Dans la section Persistent Directories, mettre à jour le label correspondant au "path in app" /srv. Remplacer "filebrowser-files" par "file-storage"
- Se rendre sur https://filebrowser.[NOM DOMAINE]/
- Se connecter avec les identifiant : admin / admin
- Se rendre dans settings et changer le mot de passe puis cliquer sur le bouton "update"
- Se rendre ensuite dans My Files
- Au niveau de l'interface FileBrowser, en haut à droite cliquer sur le bouton upload (flèche haut)
- Sélectionner tous les fichiers que vous souhaitez mettre à disposition

## STEP 5 : créer le front-office

- Caprover > Apps > entrer "front-office" dans l'input, cliquer sur le bouton "Create New App"
- aller sur l'app "front-office"
- onglet http settings : cliquer sur "Enable HTTPS", dans l'input "Container HTTP Port" mettre 80, cocher "Force HTTPS by redirecting all HTTP traffic to HTTPS", cliquer sur "Save & Update"
- onglet http settings : à coté du bouton "connect new domain", remplir l'input avec [NOM DE DOMAINE] et cliquer sur le bouton puis sur "enable HTTPS".
- onglet App Configs, Environmental Variables: cocher "bulk edit" et copier : REACT_APP_API_BASE_URL=https://api.[NOM DE DOMAINE]
- "Save & Update"
- onglet "Deployement"
- aller à la section Method 3: Deploy from Github/Bitbucket/Gitlab
- Repository : https://github.com/hypnose-et-vins/lyon-js-sept2020-p3-vh-front-office
- Branch : main
- Username : hypnoseetvins
- Password : [GH_PASSWORD]
- "Save & Update"
- copier la valeur du champs apparu dans "Method 3: Deploy from Github/Bitbucket/Gitlab"
- aller sur https://github.com/hypnose-et-vins/lyon-js-sept2020-p3-vh-front-office/settings/hooks
- cliquer sur "add webhook"
- coller la valeur de l'input copiée précédement dans le champs Payload URL de github, cliquer sur le bouton vert "Add webhook".

## STEP 6 : créer le back-office

- Caprover > Apps > entrer "back-office" dans l'input, cliquer sur le bouton "Create New App"
- aller sur l'app "back-office"
- onglet http settings : cliquer sur "Enable HTTPS", dans l'input "Container HTTP Port" mettre 80, cocher "Force HTTPS by redirecting all HTTP traffic to HTTPS", cliquer sur "Save & Update"
- onglet http settings : à coté du bouton "connect new domain", remplir l'input avec [NOM DE DOMAINE] et cliquer sur le bouton puis sur "enable HTTPS".
- onglet App Configs, Environmental Variables: cocher "bulk edit" et copier : REACT_APP_API_BASE_URL=https://api.[NOM DE DOMAINE]
- "Save & Update"
- onglet "Deployement"
- aller à la section Method 3: Deploy from Github/Bitbucket/Gitlab
- Repository : https://github.com/hypnose-et-vins/lyon-js-sept2020-p3-vh-back-office
- Branch : main
- Username : hypnoseetvins
- Password : [GH_PASSWORD]
- "Save & Update"
- copier la valeur du champs apparu dans "Method 3: Deploy from Github/Bitbucket/Gitlab"
- aller sur https://github.com/hypnose-et-vins/lyon-js-sept2020-p3-vh-back-office/settings/hooks
- cliquer sur "add webhook"
- coller la valeur de l'input copiée précédement dans le champs Payload URL de github, cliquer sur le bouton vert "Add webhook".
