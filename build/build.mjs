// Builds a protected copy of the site into ../dist
//  - JS  : obfuscated (javascript-obfuscator)
//  - CSS : minified   (clean-css)
//  - HTML: comments removed, inline <style>/<script> minified
//          (whitespace is NOT collapsed so code blocks keep their line breaks)
//  - Assets are copied as-is.  Source files are never modified.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import JavaScriptObfuscator from 'javascript-obfuscator';
import CleanCSS from 'clean-css';
import { minify as minifyHtml } from 'html-minifier-terser';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const dist = path.join(root, 'dist');
const SKIP = new Set(['.git', 'build', 'dist', 'node_modules', '.DS_Store']);

const obfuscate = (code) => JavaScriptObfuscator.obfuscate(code, {
  compact: true,
  renameGlobals: false,            // data files share globals (games, lessons, tools)
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.5,
  stringArray: true,
  stringArrayEncoding: ['base64'],
  stringArrayThreshold: 0.8,
  splitStrings: true,
  splitStringsChunkLength: 8,
  identifierNamesGenerator: 'hexadecimal',
  selfDefending: false,            // can break pages if the file is reformatted
  disableConsoleOutput: false,
  target: 'browser',
}).getObfuscatedCode();

const htmlOpts = {
  removeComments: true,
  collapseWhitespace: false,       // keep <div class="code-block"> line breaks
  minifyCSS: true,
  minifyJS: true,
  keepClosingSlash: true,
};

const stats = { js: [0, 0], css: [0, 0], html: [0, 0], other: 0 };
const size = (s) => Buffer.byteLength(s);

async function walk(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const name of fs.readdirSync(from)) {
    if (SKIP.has(name)) continue;
    const src = path.join(from, name);
    const out = path.join(to, name);
    const st = fs.statSync(src);
    if (st.isDirectory()) { await walk(src, out); continue; }
    const ext = path.extname(name).toLowerCase();
    if (ext === '.js') {
      const code = fs.readFileSync(src, 'utf8'); const res = obfuscate(code);
      fs.writeFileSync(out, res); stats.js[0] += size(code); stats.js[1] += size(res);
    } else if (ext === '.css') {
      const css = fs.readFileSync(src, 'utf8'); const res = new CleanCSS({ level: 1 }).minify(css);
      if (res.errors.length) throw new Error(`${src}: ${res.errors}`);
      fs.writeFileSync(out, res.styles); stats.css[0] += size(css); stats.css[1] += size(res.styles);
    } else if (ext === '.html') {
      const html = fs.readFileSync(src, 'utf8'); const res = await minifyHtml(html, htmlOpts);
      fs.writeFileSync(out, res); stats.html[0] += size(html); stats.html[1] += size(res);
    } else {
      fs.copyFileSync(src, out); stats.other += 1;
    }
  }
}

fs.rmSync(dist, { recursive: true, force: true });
await walk(root, dist);
fs.writeFileSync(path.join(dist, '.nojekyll'), '');
const kb = (n) => (n / 1024).toFixed(1) + ' KB';
console.log(`JS   : ${kb(stats.js[0])} -> ${kb(stats.js[1])} (obfuscated)`);
console.log(`CSS  : ${kb(stats.css[0])} -> ${kb(stats.css[1])}`);
console.log(`HTML : ${kb(stats.html[0])} -> ${kb(stats.html[1])}`);
console.log(`Other files copied: ${stats.other}`);
console.log('Output:', dist);
