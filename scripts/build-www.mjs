// Construit le dossier www/ de l'application à partir de src/game.html (le même jeu que la page web).
// - remplace les polices Google par des polices locales (le jeu marche hors ligne)
// - ajoute l'en-tête HTML complet, les marges des zones sûres (encoche) et le pont Capacitor
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const www = join(root, 'www');
const game = readFileSync(join(root, 'src/game.html'), 'utf8');

const body = game
  .replace(/<link rel="preconnect"[^>]*>\s*/g, '')
  .replace(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]*>\s*/g, '');
if (/fonts\.googleapis\.com/.test(body)) throw new Error('Lien Google Fonts restant dans src/game.html');

const titleMatch = body.match(/<title>[\s\S]*?<\/title>/);
const title = titleMatch ? titleMatch[0] : '<title>La Couronne d’Amaya</title>';

// Publicités Google AdMob : identifiants lus dans ads.config.json et recopiés dans les projets Android et iOS
const ads = JSON.parse(readFileSync(join(root, 'ads.config.json'), 'utf8'));
const isTestId = id => /^ca-app-pub-3940256099942544/.test(id || '');
for (const k of ['android', 'ios']) {
  if (!/^ca-app-pub-\d{16}~\d{10}$/.test(ads[k].appId)) throw new Error(`ads.config.json : identifiant d'application ${k} invalide (ca-app-pub-…~…)`);
  for (const u of ['rewarded', 'interstitial']) if (!/^ca-app-pub-\d{16}\/\d{10}$/.test(ads[k][u])) throw new Error(`ads.config.json : bloc d'annonces ${k}.${u} invalide (ca-app-pub-…/…)`);
}
if (!ads.test && (isTestId(ads.android.appId) || isTestId(ads.android.rewarded))) throw new Error('ads.config.json : "test" vaut false mais les identifiants sont encore ceux de test');
const stringsXml = join(root, 'android/app/src/main/res/values/strings.xml');
if (existsSync(stringsXml)) writeFileSync(stringsXml, readFileSync(stringsXml, 'utf8').replace(/(<string name="admob_app_id">)[^<]*(<\/string>)/, `$1${ads.android.appId}$2`));
const plist = join(root, 'ios/App/App/Info.plist');
if (existsSync(plist)) writeFileSync(plist, readFileSync(plist, 'utf8').replace(/(<key>GADApplicationIdentifier<\/key>\s*<string>)[^<]*(<\/string>)/, `$1${ads.ios.appId}$2`));
const adsRuntime = { test: !!ads.test, android: { rewarded: ads.android.rewarded, interstitial: ads.android.interstitial }, ios: { rewarded: ads.ios.rewarded, interstitial: ads.ios.interstitial },
  every: ads.interstitialEveryLevels || 3, from: ads.interstitialFromLevel || 5, gap: ads.interstitialMinSeconds || 180 };

const plugins = ['core/dist/capacitor.js', 'preferences/dist/plugin.js', 'app/dist/plugin.js', 'status-bar/dist/plugin.js', 'splash-screen/dist/plugin.js'];

rmSync(www, { recursive: true, force: true });
mkdirSync(join(www, 'js'), { recursive: true });
cpSync(join(root, 'src/fonts'), join(www, 'fonts'), { recursive: true });
for (const p of plugins) {
  const src = join(root, 'node_modules/@capacitor', p);
  if (!existsSync(src)) throw new Error('Paquet manquant : ' + p + ' (lance npm install)');
  cpSync(src, join(www, 'js', p.split('/')[0] + '.js'));
}
const admobJs = join(root, 'node_modules/@capacitor-community/admob/dist/plugin.js');
if (!existsSync(admobJs)) throw new Error('Paquet manquant : @capacitor-community/admob (lance npm install)');
// Le fichier du module déclare un nom global générique : on le renomme pour éviter tout conflit
writeFileSync(join(www, 'js', 'admob.js'), readFileSync(admobJs, 'utf8').replace(/^var capacitor\w+ = /, 'var capacitorAdMob = '));

const bridge = `<script src="js/core.js"></script>
<script src="js/preferences.js"></script>
<script src="js/app.js"></script>
<script src="js/status-bar.js"></script>
<script src="js/splash-screen.js"></script>
<script src="js/admob.js"></script>
<script>window.AMAYA_ADS = ${JSON.stringify(adsRuntime)};</script>
<script>
(function () {
  try {
    if (!window.Capacitor || !Capacitor.isNativePlatform()) return;
    window.AmayaNative = { Preferences: capacitorPreferences.Preferences, App: capacitorApp.App, AdMob: window.capacitorAdMob && capacitorAdMob.AdMob };
    var SB = capacitorStatusBar.StatusBar;
    SB.setStyle({ style: 'DARK' }).catch(function () {});
    if (Capacitor.getPlatform() === 'android') SB.setOverlaysWebView({ overlay: true }).catch(function () {});
    addEventListener('load', function () { setTimeout(function () { capacitorSplashScreen.SplashScreen.hide().catch(function () {}); }, 300); });
  } catch (e) {}
})();
</script>`;

const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
<meta name="theme-color" content="#140f2b">
<meta name="color-scheme" content="dark">
${title}
<link rel="stylesheet" href="fonts/fonts.css">
<style>
*,*::before,*::after{box-sizing:border-box}
:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px);height:100%;background:#140f2b;-webkit-text-size-adjust:100%}
body{margin:0;overscroll-behavior:none;-webkit-touch-callout:none}
img{max-width:100%}
[hidden]{display:none!important}
</style>
${bridge}
</head>
<body>
${body.replace(title, '')}
</body>
</html>
`;
writeFileSync(join(www, 'index.html'), html);
console.log('www/ construit (' + Math.round(html.length / 1024) + ' Ko de HTML)');
