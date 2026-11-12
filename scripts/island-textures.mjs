#!/usr/bin/env node
// Dead Tide's island textures (v215 tooling): paints them in headless Chromium
// (scripts/island-textures.paint.js) and writes them to public/game/assets/island/ as WebP.
// Seeded, so a re-run gives the same pictures (byte-identical on the same Chromium).
//
//   node scripts/island-textures.mjs [--out dir] [--quality 0.86]
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),argv=process.argv.slice(2);
const opt=(name,fallback)=>{const i=argv.indexOf(name);return i>=0?argv[i+1]:fallback;};
const out=resolve(opt('--out',join(root,'public/game/assets/island'))),quality=Number(opt('--quality','.86'));
const require=createRequire(import.meta.url);let chromium;
try{({chromium}=require('playwright'));}catch{({chromium}=await import('playwright'));}
const browser=await chromium.launch();
try{
  const page=await browser.newPage();
  await page.setContent('<!doctype html><title>island textures</title>');
  await page.addScriptTag({content:readFileSync(join(root,'scripts/island-textures.paint.js'),'utf8')});
  const pictures=await page.evaluate(q=>window.paintIslandTextures(q),quality);
  mkdirSync(out,{recursive:true});let total=0;
  for(const [name,url] of Object.entries(pictures)){
    if(!url.startsWith('data:image/webp;base64,'))throw new Error(`${name}: this browser did not encode WebP`);
    const bytes=Buffer.from(url.slice(url.indexOf(',')+1),'base64');writeFileSync(join(out,`${name}.webp`),bytes);total+=bytes.length;
    console.log(`${name}.webp ${(bytes.length/1024).toFixed(1)} KB`);
  }
  console.log(`${Object.keys(pictures).length} textures, ${(total/1024).toFixed(0)} KB, in ${out}`);
}finally{await browser.close();}
