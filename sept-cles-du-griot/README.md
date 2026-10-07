# Les 7 Clés du Griot

Jeu d'aventure et d'enquête pour Android et iOS. Awa Ndiaye, 22 ans, part à la recherche de son grand-père griot, enlevé à Dakar. **Acte I** : elle réunit sept clés dans sept capitales pour le sauver du Collectionneur. **Acte II** : elle traque les huit pages perdues du Livre des Rives dans huit autres capitales, face au mystérieux Mécène. En tout, **15 capitales africaines**.

## Le jeu en bref

| | |
|---|---|
| Genre | Aventure narrative et énigmes (environ 3 heures pour une première partie) |
| Villes (15) | Acte I : Dakar, Bamako, Yamoussoukro, Accra, Kinshasa, Addis-Abeba, Le Caire. Acte II : Nairobi, Kigali, Antananarivo, Luanda, Yaoundé, Abuja, Ouagadougou, Rabat |
| Personnages | 22 personnages illustrés, avec 9 expressions (Awa, Papi Seydou, Kofi, Akissi, Ya Didi, Wanjiru, Hery, Nzinga, Mama Ngono, Tunde, Aminata…) |
| Mini-jeux | 33 défis de 8 types : fouille, kora et valiha (mémoire musicale), course-poursuite en 3D (ruelles, pirogue, moto, safari, okada), cadenas à déduction (bogolan, hiéroglyphes, perles maasaï, nsibidi, zellige), infiltration au tour par tour (15 niveaux), tissage (kente, imigongo, Faso Dan Fani), rythme (rumba, semba), confrontation avec preuves |
| Suspense | SMS anonymes et menaçants, choix à temps limité, deux trahisons, compte à rebours de 72 heures, 5 fins (2 dans l'acte I, 3 dans l'acte II) |
| Curiosité | 45 « Le saviez-vous ? » sur les capitales, 15 quiz, carnet d'enquête, 15 fragments secrets qui débloquent un épilogue caché |
| Rejouabilité | Étoiles par défi, trophées, deuxième fin à découvrir, cauris à gagner pour acheter des indices |
| Technique | 100 % hors ligne, aucune donnée collectée, aucun fichier image ou son : tout est dessiné et composé par le code (léger, environ 3 Mo installé) |

Les personnages et le « Livre des Rives » sont imaginaires. Les lieux et les « Le saviez-vous ? » sont réels.

## Contenu du dossier

| Chemin | Rôle |
|---|---|
| `src/index.html`, `src/style.css` | Page du jeu et mise en forme |
| `src/js/story.js` | **Le scénario** (dialogues, choix), les indices, les « Le saviez-vous ? », les quiz, les trophées et les réglages des mini-jeux. C'est le fichier à modifier pour écrire de nouveaux chapitres. |
| `src/js/engine.js` | Moteur : écran titre, carte de l'Afrique, dialogues, SMS, carnet, réglages |
| `src/js/games.js`, `src/js/games2.js` | Les 8 types de mini-jeux, leurs variantes et les niveaux d'infiltration |
| `src/js/art.js`, `src/js/scenes.js` | Portraits, décors des villes, carte, drapeaux, médaillons |
| `src/js/audio.js` | Musiques et bruitages synthétisés (kora, djembé, rumba, oud…) |
| `scripts/build-www.mjs` | Construit `www/` (le jeu prêt pour le mobile) à partir de `src/` |
| `assets/` | Icône, écran de démarrage et image de présentation Google Play |
| `android/`, `ios/` | Projets natifs (Android Studio, Xcode) |
| `FICHE-STORE.md`, `CONFIDENTIALITE.md`, `MONETISATION.md` | Textes des stores, politique de confidentialité, plan pour gagner de l'argent |

## Essayer le jeu tout de suite

Ouvre `src/index.html` dans Chrome (sur ordinateur, active l'affichage mobile avec F12 puis l'icône téléphone). Le jeu fonctionne directement, sans installation.

## Android (Google Play)

Identifiant de l'application : `com.basselekra.septclesgriot` (il ne pourra plus changer après la première publication).

### Avec GitHub, sans rien installer

1. Onglet **Actions > « 7 Clés du Griot · Android » > Run workflow**. Après environ 5 minutes, ouvre **Releases** et touche **sept-cles-du-griot-test.apk** pour l'installer sur ton téléphone.
2. Pour Google Play, crée une **clé de signature propre à ce jeu** (une par application) :
   ```bash
   keytool -genkeypair -v -keystore sept-cles.jks -alias septcles -keyalg RSA -keysize 2048 -validity 10000
   ```
   Garde ce fichier et ses mots de passe en lieu sûr, en deux exemplaires.
3. Dans le dépôt : **Settings > Secrets and variables > Actions**, ajoute :
   - `SEPT_CLES_KEYSTORE_BASE64` : le contenu de `base64 -w0 sept-cles.jks` (sur Mac : `base64 -i sept-cles.jks`)
   - `SEPT_CLES_KEYSTORE_PASSWORD`, `SEPT_CLES_KEY_ALIAS` (ici `septcles`), `SEPT_CLES_KEY_PASSWORD`
4. Relance le workflow, ou crée un tag `sept-cles-v1.0.0`. Tu obtiens l'artefact `sept-cles-google-play-aab` : c'est le fichier `.aab` à envoyer sur Google Play.

### Sur ton ordinateur

Installe Node.js 22 et Android Studio, puis dans ce dossier :
```bash
npm install
npm run android
```

### Publier

Même démarche que pour La Couronne d'Amaya (voir le README à la racine) : compte Play Console, test fermé de 14 jours avec 12 testeurs pour un compte personnel récent, puis production. Les textes sont prêts dans `FICHE-STORE.md`.

## iOS (App Store)

Un Mac avec Xcode et l'Apple Developer Program (99 $ par an) sont nécessaires : `npm install`, `npm run ios`, puis *Product > Archive*. Le workflow **« 7 Clés du Griot · iOS (vérification) »** vérifie la compilation sur un Mac de GitHub.

## Mettre à jour le jeu

1. Modifie les fichiers de `src/`.
2. `npm run sync` (ou relance le workflow GitHub, qui le fait tout seul).
3. Pour changer l'icône : remplace les images de `assets/` puis `npm run icons`.

## Ce qui a été vérifié, et ce qui ne l'a pas été

- **Vérifié** dans Chrome (format téléphone 390 × 844) : les 15 chapitres se jouent du début à la fin sans erreur, avec les 5 fins. Les défis de mémoire, cadenas, tissage, infiltration, rythme et confrontation ont été gagnés par un programme de test qui joue « pour de vrai ». Les 15 niveaux d'infiltration ont été vérifiés par un solveur : tous ont une solution, et les fragments cachés sont atteignables.
- **Vérifié** : `npm run sync` construit le jeu et prépare les projets Android et iOS, icônes comprises.
- **Non vérifié** : la compilation de l'APK et de l'application iOS (l'environnement de préparation n'avait ni SDK Android ni Mac). Les réglages sont les mêmes que ceux de La Couronne d'Amaya ; le premier lancement du workflow GitHub fera ce test.
- **À tester par des humains** : la difficulté réelle sur téléphone (courses-poursuites surtout), le son sur différents appareils, et la relecture des textes.
