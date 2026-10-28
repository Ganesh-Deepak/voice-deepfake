// Prints the narration of one video as JSON: node tools/export_beats.js <video-id>
// Loads the real engine and scene files without drawing anything.
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), vid = process.argv[2];
const dir = path.join(root, 'videos', vid);
global.window = global;
global.document = { createElement: () => ({ getContext: () => ({}) }) };
const load = f => (0, eval)(fs.readFileSync(f, 'utf8'));
load(path.join(dir, 'config.js'));
load(path.join(root, 'src', 'engine.js'));
fs.readdirSync(dir).filter(f => /^scenes.*\.js$/.test(f)).sort().forEach(f => load(path.join(dir, f)));
const scenes = window.SCENES.map(s => ({ id: s.id, chapter: s.chapter, title: s.title, noHeader: !!s.noHeader, beats: s.beats }));
process.stdout.write(JSON.stringify({ id: vid, video: window.VIDEO, scenes }, null, 1));
