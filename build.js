const fs=require('fs'),path=require('path'),cp=require('child_process');
const IMG=/\.(jpe?g|png|webp|gif|avif)$/i, VID=/\.(mp4|webm|mov|m4v)$/i;
const enc=p=>p.split('/').map(encodeURIComponent).join('/');
const rd=p=>fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'').split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
const nfc=s=>s.normalize('NFC');
// Tên thư mục tiếng Việt -> mã danh mục trên web
const MAP={
 'Thiết kế Poster':'poster','Banner & quảng cáo':'banner','Poster mạng xã hội':'social',
 'Quảng cáo sản phẩm':'product','Thiết kế logo':'logo','Branding':'identity',
 'Hiệu ứng chuyển động cho Poster':'brand','Video ngắn':'video','Sản phẩm tâm đắc nhất':'featured'};
const MAPN={};for(const k in MAP)MAPN[nfc(k)]=MAP[k];
function added(file){
  try{const t=cp.execSync(`git log --diff-filter=A --format=%ct -1 -- "${file}"`,{stdio:['ignore','pipe','ignore']}).toString().trim();if(t)return +t*1000}catch(e){}
  return fs.statSync(file).mtimeMs}
const dirs=[]; // [đường dẫn thư mục, mã danh mục]
for(const d of fs.readdirSync('.',{withFileTypes:true})){
  if(d.isDirectory()&&MAPN[nfc(d.name)])dirs.push([d.name,MAPN[nfc(d.name)]])}
if(fs.existsSync('works'))for(const d of fs.readdirSync('works',{withFileTypes:true})){
  if(d.isDirectory()&&!/^[._]/.test(d.name))dirs.push([path.join('works',d.name),d.name])}
const items=[],cats={};
for(const [dir,key] of dirs){
  const info=path.join(dir,'_info.txt');
  if(fs.existsSync(info)){const L=rd(info);if(L[0])cats[key]={vi:[L[0],L[1]||''],en:[L[2]||L[0],L[3]||L[1]||'']}}
  for(const name of fs.readdirSync(dir)){
    const isImg=IMG.test(name),isVid=VID.test(name);if(!isImg&&!isVid)continue;
    const file=path.join(dir,name).split(path.sep).join('/'),base=name.replace(/\.[^.]+$/,'').normalize('NFC');
    const title=base.replace(/^\d+[-_. ]+/,'').replace(/_/g,' ').trim()||base;
    let vi='',en='';
    const txt=path.join(dir,base+'.txt');
    if(fs.existsSync(txt)){const L=rd(txt);vi=L[0]||'';en=L[1]||vi}
    items.push({t:added(file),name,o:{f:key,type:isVid?'video':'image',t:{vi:title,en:title},img:enc(file),d:{vi,en}}})}}
items.sort((a,b)=>b.t-a.t||a.name.localeCompare(b.name,'vi',{numeric:true}));
fs.writeFileSync('works.json',JSON.stringify(items.map(x=>x.o)));
fs.writeFileSync('cats.json',JSON.stringify(cats));
console.log('works.json:',items.length,'sản phẩm,',dirs.length,'thư mục');
