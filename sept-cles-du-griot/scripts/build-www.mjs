// Construit www/ (le jeu prêt pour le mobile) à partir de src/ :
// copie les fichiers et insère le pont Capacitor (stockage natif, bouton retour, vibrations, barre d'état).
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const www = join(root, 'www');
const plugins = ['core/dist/capacitor.js', 'preferences/dist/plugin.js', 'app/dist/plugin.js', 'status-bar/dist/plugin.js', 'splash-screen/dist/plugin.js', 'haptics/dist/plugin.js'];

rmSync(www, { recursive: true, force: true });
cpSync(join(root, 'src'), www, { recursive: true });
mkdirSync(join(www, 'cap'), { recursive: true });
for (const p of plugins) {
  const src = join(root, 'node_modules/@capacitor', p);
  if (!existsSync(src)) throw new Error('Paquet manquant : ' + p + ' (lance npm install)');
  cpSync(src, join(www, 'cap', p.split('/')[0] + '.js'));
}

const bridge = `${plugins.map(p => `<script src="cap/${p.split('/')[0]}.js"></script>`).join('\n')}
<script>
(function () {
  try {
    if (!window.Capacitor || !Capacitor.isNativePlatform()) return;
    window.SCNative = { Preferences: capacitorPreferences.Preferences, App: capacitorApp.App, Haptics: capacitorHaptics.Haptics };
    var SB = capacitorStatusBar.StatusBar;
    SB.setStyle({ style: 'DARK' }).catch(function () {});
    if (Capacitor.getPlatform() === 'android') SB.setOverlaysWebView({ overlay: true }).catch(function () {});
    addEventListener('load', function () { setTimeout(function () { capacitorSplashScreen.SplashScreen.hide().catch(function () {}); }, 300); });
  } catch (e) {}
})();
</script>`;

const index = join(www, 'index.html');
const html = readFileSync(index, 'utf8');
if (!html.includes('<!--NATIVE-->')) throw new Error('Marqueur <!--NATIVE--> absent de src/index.html');
writeFileSync(index, html.replace('<!--NATIVE-->', bridge));
console.log('www/ construit');
