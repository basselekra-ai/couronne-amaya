# Gagner de l'argent avec Les 7 Clés du Griot

La version actuelle est **gratuite, sans publicité et sans achat** : c'est volontaire. Pour un premier jeu, il vaut mieux d'abord obtenir des joueurs, des avis 5 étoiles et des chiffres de rétention, puis activer les revenus dans une mise à jour. Voici le plan conseillé, du plus simple au plus rentable.

## 1. Le modèle recommandé : « essai gratuit + aventure complète »

- **Gratuit** : les chapitres 1 à 3 (Dakar, Bamako, Yamoussoukro). Ils se terminent sur de vrais cliffhangers : Papi en danger, l'« ami du Caire ».
- **Payant, une seule fois** : « Pass Aventure » qui débloque les chapitres 4 à 7 et les futures saisons.
- Prix conseillé : **1,99 € à 2,99 €** en Europe. Google Play et l'App Store ajustent automatiquement les prix par pays : en Afrique de l'Ouest et centrale, vise l'équivalent de **500 à 1 000 FCFA** (réglable pays par pays dans la console).
- Pourquoi : les joueurs d'histoires paient pour connaître la suite, et un achat unique est bien noté par les joueurs (pas d'« arnaque »).

À coder : le plugin d'achats intégrés (par exemple RevenueCat ou `cordova-plugin-purchase` pour Capacitor), une vérification avant `Story.play` pour les chapitres 4 à 7, et un bouton « Restaurer mes achats » (obligatoire sur iOS).

## 2. Publicités récompensées (en complément)

- Une seule forme de publicité : **la vidéo choisie par le joueur**, en échange de cauris (par exemple 20 cauris), qui servent aux indices du jeu.
- Jamais de publicité imposée au milieu de l'histoire : elle casserait le suspense et ferait chuter les notes.
- Régie : Google AdMob (plugin `@capacitor-community/admob`).
- **Attention** : dès que tu ajoutes de la publicité, mets à jour `CONFIDENTIALITE.md`, le questionnaire « Sécurité des données » et le consentement (RGPD en Europe). Le message « sans publicité » des fiches store devra aussi être retiré.

## 3. Les saisons (le vrai moteur de revenus)

L'épilogue secret annonce déjà la suite : « Il existe une huitième porte. Nairobi. Kigali. Luanda. » Chaque saison de 7 nouvelles capitales est une mise à jour qui relance les téléchargements et se vend dans le Pass Aventure ou à part.

Idées de saison 2 : Nairobi, Kigali, Luanda, Rabat, Antananarivo, Abuja, Libreville. Le scénario s'écrit dans `src/js/story.js`, avec les mêmes mini-jeux.

## 4. Autres sources

- **Écoles et associations** : le jeu enseigne l'histoire et la géographie africaines (21 « Le saviez-vous ? », quiz). Une licence pour établissements scolaires ou une version sponsorisée par une institution culturelle est une piste sérieuse.
- **Partenariats** : offices du tourisme, musées (Musée national du Mali, Musée des civilisations noires de Dakar…), marques panafricaines.
- **Produits dérivés** : affiches des capitales, carnet d'enquête imprimé.

## 5. Lancer le jeu (les premiers joueurs)

1. **Test fermé** de 14 jours avec 12 testeurs (obligatoire pour un compte Google personnel récent) : profites-en pour corriger la difficulté.
2. **TikTok, Instagram, WhatsApp** : des vidéos courtes de 15 secondes. Les meilleures accroches : le SMS « Ton grand-père te passe le bonjour », la course-poursuite à moto dans Kinshasa, le concert de rumba, Ya Didi en costume rose.
3. **Créateurs de contenu** africains et de la diaspora (gaming, culture, éducation) : envoie-leur le jeu gratuitement.
4. **Note du store** : demande un avis au bon moment, juste après une victoire (plugin d'avis intégré de Google Play), jamais après un échec.
5. **Langues** : traduire en anglais ouvre le Nigeria, le Ghana, le Kenya et l'Afrique du Sud. Les textes sont regroupés dans `src/js/story.js`, ce qui facilite la traduction.

## Ce qu'il faut mesurer

Sans outil de statistiques dans le jeu (aucune donnée n'est collectée), utilise les chiffres de la Play Console : installations, désinstallations, notes, pays. Si tu veux savoir combien de joueurs abandonnent à chaque chapitre, il faudra ajouter un outil d'analyse (Firebase Analytics par exemple) et mettre à jour la politique de confidentialité.
