import fs from 'fs';
import path from 'path';

const htmlPath = path.join(process.cwd(), 'japan-tour', 'index.html');
const cssPath = path.join(process.cwd(), 'app', 'globals.css');
const pagePath = path.join(process.cwd(), 'app', 'page.js');
const japanTourDir = path.join(process.cwd(), 'japan-tour');

if (!fs.existsSync(htmlPath)) {
  console.error("japan-tour/index.html not found. Did you already run this script?");
  process.exit(1);
}

const content = fs.readFileSync(htmlPath, 'utf8');

// Extract CSS
const styleMatch = content.match(/<style>([\s\S]*?)<\/style>/);
const css = styleMatch ? styleMatch[1].trim() : '';

// Extract JS
const scriptMatch = content.match(/<script>([\s\S]*?)<\/script>/);
let scriptContent = scriptMatch ? scriptMatch[1].trim() : '';

// Escape template literals if needed inside script
scriptContent = scriptContent.replace(/`/g, '\\`');

// Extract Body
let bodyMatch = content.match(/<body>([\s\S]*?)<script>/);
if (!bodyMatch) {
  bodyMatch = content.match(/<body>([\s\S]*?)<\/body>/);
}
let bodyHtml = bodyMatch ? bodyMatch[1].trim() : '';

// Convert HTML to JSX
let bodyJsx = bodyHtml
  .replace(/class="/g, 'className="')
  .replace(/for="/g, 'htmlFor="')
  .replace(/<!--([\s\S]*?)-->/g, '{/*$1*/}')
  .replace(/novalidate/g, 'noValidate')
  .replace(/autocomplete="/g, 'autoComplete="');

// Fix self-closing tags
bodyJsx = bodyJsx.replace(/<img(.*?)>/g, (match, p1) => {
  if (p1.endsWith('/')) return match;
  return `<img${p1} />`;
});
bodyJsx = bodyJsx.replace(/<input(.*?)>/g, (match, p1) => {
  if (p1.endsWith('/')) return match;
  return `<input${p1} />`;
});
bodyJsx = bodyJsx.replace(/<br\s*>/g, '<br />');

// Fix inline styles to React style objects
bodyJsx = bodyJsx.replace(/style="([^"]*)"/g, (match, styles) => {
  const parts = styles.split(';').filter(s => s.trim());
  const styleObj = {};
  parts.forEach(p => {
    let [key, ...valParts] = p.split(':');
    let val = valParts.join(':').trim();
    key = key.trim();
    if (!key) return;
    // convert css variable or dash-case to camelCase ONLY if not a css var (React accepts css vars as is but usually string keys, actually React style objects want '--custom-var' as string literal keys, which JSON.stringify handles)
    if (!key.startsWith('--')) {
        key = key.replace(/-([a-z])/g, g => g[1].toUpperCase());
    }
    styleObj[key] = val;
  });
  return `style={${JSON.stringify(styleObj)}}`;
});

// Create page content
const pageContent = `'use client';
import { useEffect } from 'react';

export default function JapanTourLanding() {
  useEffect(() => {
    ${scriptContent}
  }, []);

  return (
    <>
      ${bodyJsx}
    </>
  );
}
`;

// Append CSS to globals.css
fs.appendFileSync(cssPath, '\n\n/* --- JAPAN TOUR CSS --- */\n' + css + '\n');

// Replace app/page.js
fs.writeFileSync(pagePath, pageContent, 'utf-8');

// Delete japan-tour folder
fs.rmSync(japanTourDir, { recursive: true, force: true });

console.log('Migration completed successfully! You can now run the app and delete this script.');
