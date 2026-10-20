/* Explicit media-only fixture, matching probe_strategic_5km.cjs.
   Production simulation, errors and assertions remain unchanged. */
const {chromium}=require('playwright'),fs=require('node:fs');
const wav=Buffer.alloc(4454);wav.write('RIFF',0);wav.writeUInt32LE(4446,4);wav.write('WAVE',8);wav.write('fmt ',12);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(22050,24);wav.writeUInt32LE(44100,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(4410,40);
let requests=0;const launch=chromium.launch.bind(chromium);
chromium.launch=async(...args)=>{const browser=await launch(...args),newPage=browser.newPage.bind(browser);browser.newPage=async(...a)=>{const p=await newPage(...a);await p.route(/\/Assets\/audio\/.*\.mp3(?:\?.*)?$/,r=>{requests++;return r.fulfill({status:200,contentType:'audio/wav',body:wav})});return p};return browser};
process.on('exit',()=>fs.writeFileSync('docs/audits/2026-10-20-grasstex/runtime-verification/artifacts/'+(process.argv.some(a=>a.includes('benchmark_full_fidelity'))?'full-fidelity':'native-interception')+'-media-fixture.json',JSON.stringify({requests,scope:'Only missing private MP3 media replaced with silent WAV; no simulation components replaced.'},null,2)));
