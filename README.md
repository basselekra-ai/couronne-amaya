# La Couronne d'Amaya : application mobile

> Ce dépôt contient aussi un deuxième jeu, **Les 7 Clés du Griot** (aventure à travers 15 capitales africaines), dans le dossier [`sept-cles-du-griot/`](sept-cles-du-griot/README.md).

Ce dossier transforme le jeu en application Android et iOS avec [Capacitor](https://capacitorjs.com). C'est exactement le même jeu que la page web, avec en plus :

- **fonctionnement hors ligne** : les polices sont incluses et le jeu ne fait aucun appel réseau ;
- **sauvegarde native** : la progression est enregistrée dans le stockage de l'appareil (Capacitor Preferences), qui résiste au nettoyage du navigateur interne ;
- **code de transfert** : depuis l'accueil, « Sauvegarde et appareils » donne un code `AMY1-…` à coller sur un autre téléphone ;
- **bouton retour Android** : il ferme les fenêtres, met en pause pendant une partie, puis ramène à l'accueil ;
- **pause automatique** quand on quitte l'application, et coupure de la musique ;
- écran vertical uniquement, icône et écran de démarrage générés (`assets/`).

## Contenu du dossier

| Chemin | Rôle |
|---|---|
| `src/game.html` | Le jeu (copie de la page web). C'est le seul fichier à modifier pour faire évoluer le jeu. |
| `src/fonts/` | Polices Lilita One et Nunito (licence SIL Open Font License, usage commercial autorisé). |
| `scripts/build-www.mjs` | Construit `www/` (le jeu prêt pour le mobile) à partir de `src/`. |
| `assets/` | Icône 1024 px et écran de démarrage 2732 px, sources des icônes générées. |
| `android/`, `ios/` | Projets natifs (Android Studio, Xcode). |
| `.github/workflows/` | Compilation automatique sur GitHub (Android et vérification iOS). |
| `ads.config.json` | Identifiants Google AdMob (de test pour l'instant) et fréquence des publicités. |
| `FICHE-STORE.md` | Textes prêts à coller dans Google Play et l'App Store, et réponses aux questionnaires. |
| `CONFIDENTIALITE.md` | Politique de confidentialité exigée par les stores. |
| `NOM-ET-MARQUE.md` | Vérification du nom et démarches de dépôt de marque. |

## Étape 0 : à faire une seule fois

1. **Identifiant de l'application** : `com.basselekra.couronneamaya`. Il est déjà réglé partout (Capacitor, Android, iOS). Il ne pourra plus changer après la première publication sur un store. Dans Xcode, vérifie seulement que *App > Signing & Capabilities > Bundle Identifier* affiche bien cet identifiant une fois ton équipe Apple choisie.
2. Installe [Node.js 22](https://nodejs.org), puis dans ce dossier :
   ```bash
   npm install
   npm run sync
   ```

## Android (Google Play)

### Option A : sans rien installer, avec GitHub

1. Crée un dépôt GitHub (privé si tu veux) et envoie-y le contenu de ce dossier.
2. Onglet **Actions > Android > Run workflow**. Après environ 5 minutes, ouvre **Releases** (colonne de droite de la page du dépôt, ou `/releases/latest`) et touche **couronne-amaya-test.apk** : c'est l'APK à installer sur ton téléphone Android pour essayer le jeu.
3. Pour Google Play, il faut une **clé de signature**. Crée-la une seule fois sur ton ordinateur (Java requis) :
   ```bash
   keytool -genkeypair -v -keystore couronne-amaya.jks -alias amaya -keyalg RSA -keysize 2048 -validity 10000
   ```
   **Garde ce fichier et ses mots de passe en lieu sûr, en deux exemplaires.** Sans eux, tu ne pourras plus publier de mise à jour (sauf si tu actives la signature gérée par Google Play, conseillée).
4. Dans le dépôt : **Settings > Secrets and variables > Actions**, ajoute :
   - `ANDROID_KEYSTORE_BASE64` : le contenu de `base64 -w0 couronne-amaya.jks` (sur Mac : `base64 -i couronne-amaya.jks`)
   - `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` (ici `amaya`), `ANDROID_KEY_PASSWORD`
5. Relance le workflow, ou crée un tag `v1.0.0`. Tu obtiens l'artefact `couronne-amaya-google-play-aab`. C'est ce fichier `.aab` que tu envoies sur Google Play.

### Option B : sur ton ordinateur

Installe [Android Studio](https://developer.android.com/studio), puis `npm run android`. Le projet s'ouvre : bouton ▶ pour lancer sur un téléphone branché, *Build > Generate Signed App Bundle* pour le fichier de publication.

### Publier sur Google Play

1. Crée un compte sur la [Play Console](https://play.google.com/console) (25 $ une seule fois, pièce d'identité demandée).
2. **Important pour un compte personnel récent** : Google exige un test fermé avec au moins **12 testeurs inscrits pendant 14 jours d'affilée** avant d'ouvrir la publication. Si le nombre tombe sous 12, le compteur repart à zéro. Prévois donc une quinzaine de proches avec un téléphone Android. Un compte « organisation » (entreprise) n'est pas concerné.
3. Crée l'application, remplis la fiche avec `FICHE-STORE.md`, envoie le `.aab` en **Test fermé**, invite les testeurs.
4. Après les 14 jours, demande l'accès à la production depuis le tableau de bord.

## iOS (App Store)

Un **Mac avec Xcode** est obligatoire pour publier sur l'App Store, ainsi que l'[Apple Developer Program](https://developer.apple.com/programs/) (99 $ par an).

1. Sur le Mac : `npm install`, puis `npm run ios`. Xcode s'ouvre.
2. *Signing & Capabilities* : choisis ton équipe et ton Bundle Identifier.
3. Branche un iPhone et clique ▶ pour tester.
4. *Product > Archive*, puis *Distribute App > App Store Connect*.
5. Dans [App Store Connect](https://appstoreconnect.apple.com), remplis la fiche avec `FICHE-STORE.md`, fais tester via TestFlight, puis soumets à la validation d'Apple.

Le workflow GitHub **iOS (vérification)** compile le projet sur un Mac de GitHub pour s'assurer qu'il n'y a pas d'erreur, même sans Mac chez toi. Il ne produit pas de version publiable.

## Publicités (Google AdMob)

Le jeu gagne de l'argent avec **Google AdMob**, la régie de Google pour les applications. AdSense, lui, ne sert qu'aux sites web et est interdit dans les applications.

- **Vidéo avec récompense** : quand les coups sont épuisés et que le « +5 coups » gratuit a déjà servi, le joueur peut *choisir* de regarder une vidéo pour 5 coups de plus. Il ne les reçoit que s'il la regarde jusqu'au bout.
- **Publicité entre deux niveaux** : au plus une tous les 3 niveaux gagnés et toutes les 3 minutes, jamais avant le niveau 5, jamais pendant une partie.
- **Consentement** : le formulaire officiel de Google s'affiche au premier lancement pour les joueurs d'Europe, du Royaume-Uni et de Suisse. Ils peuvent changer d'avis dans *Pause → Mes choix pour les publicités*.
- La version web du jeu n'affiche aucune publicité.

**Tous les réglages sont dans `ads.config.json`.** Il contient pour l'instant les identifiants **de test** de Google : de vraies publicités d'essai s'affichent, mais elles ne rapportent rien. C'est voulu, car cliquer sur ses propres vraies annonces fait bloquer le compte AdMob.

Pour passer aux vraies publicités :
1. Dans AdMob, crée l'application Android, puis deux blocs d'annonces : **Avec récompense** et **Interstitiel** (et la même chose pour iOS si tu publies sur l'App Store).
2. Recopie les identifiants dans `ads.config.json`, puis mets `"test": false`. Le script de construction refuse `"test": false` avec des identifiants de test, et inversement vérifie leur format.
3. Lance `npm run sync` : l'identifiant d'application est recopié automatiquement dans `strings.xml` (Android) et `Info.plist` (iOS).
4. Mets en ligne le fichier **`app-ads.txt`** à la racine du site déclaré comme « site web du développeur » sur Google Play (GitHub Pages convient). Sa seule ligne : `google.com, pub-TON_NUMERO_EDITEUR, DIRECT, f08c47fec0942fa0`. Le numéro d'éditeur est dans AdMob → Paramètres.
5. Dans la Play Console, déclare « contient des annonces », l'identifiant publicitaire et la sécurité des données : les réponses sont dans `FICHE-STORE.md`.

Pour tester sur ton téléphone avec les vrais identifiants sans risque, ajoute ton téléphone comme **appareil de test** dans AdMob (Paramètres → Appareils de test).

## Mettre à jour le jeu

1. Remplace `src/game.html` par la nouvelle version du jeu.
2. `npm run sync` (ou relance le workflow GitHub).
3. Sur Android, chaque envoi au store doit avoir un numéro de version plus grand. Le workflow l'augmente tout seul. En local, mets `VERSION_CODE=2` (puis 3…) devant la commande Gradle.

Pour changer l'icône ou l'écran de démarrage : remplace les images de `assets/` puis lance `npm run icons`.

## Ce qui a été vérifié, et ce qui ne l'a pas été

- Vérifié : le jeu construit dans `www/` tourne sans aucun appel réseau, polices incluses. Les projets Android et iOS sont générés et synchronisés, et les icônes générées.
- Non vérifié : la compilation de l'APK et de l'application iOS. L'environnement où ce dossier a été préparé n'avait pas accès au SDK Android ni à un Mac. Le premier lancement du workflow GitHub fera ce test. S'il échoue, le journal de l'onglet Actions indique la cause.
