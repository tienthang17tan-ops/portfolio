// Quét MỌI thư mục con trong works/ -> tạo works.json (sản phẩm) và cats.json (tên danh mục).
// Chạy tự động mỗi lần Netlify deploy. Không cần sửa file này.
const fs=require('fs'),path=require('path'),cp=require('child_process');
const IMG=/\.(jpe?g|png|webp|gif|avif)$/i, VID=/\.(mp4|webm|mov|m4v)$/i;
const enc=p=>p.split('/').map(encodeURIComponent).join('/');
const rd=p=>fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'').split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
function added(file){ // thời điểm file được thêm (mới nhất lên đầu)
  try{const t=cp.execSync(`git log --diff-filter=A --format=%ct -1 -- "${file}"`,{stdio:['ignore','pipe','ignore']}).toString().trim();if(t)return +t*1000}catch(e){}
  return fs.statSync(file).mtimeMs}
const out=[],cats={};
const folders=fs.existsSync('works')?fs.readdirSync('works',{withFileTypes:true}).filter(d=>d.isDirectory()&&!/^[._]/.test(d.name)).map(d=>d.name).sort():[];
for(const f of folders){
  const dir=path.join('works',f);
  const info=path.join(dir,'_info.txt'); // tuỳ chọn: tên + mô tả danh mục (4 dòng: tên VI, mô tả VI, tên EN, mô tả EN)
  if(fs.existsSync(info)){const L=rd(info);if(L[0])cats[f]={vi:[L[0],L[1]||''],en:[L[2]||L[0],L[3]||L[1]||'']}}
  const items=[];
  for(const name of fs.readdirSync(dir)){
    const isImg=IMG.test(name),isVid=VID.test(name); if(!isImg&&!isVid)continue;
    const file=path.join(dir,name).split(path.sep).join('/'), base=name.replace(/\.[^.]+$/,'').normalize('NFC');
    const title=base.replace(/^\d+[-_. ]+/,'').replace(/_/g,' ').trim()||base;
    let vi='',en='';
    const txt=path.join(dir,base+'.txt');
    if(fs.existsSync(txt)){const L=rd(txt);vi=L[0]||'';en=L[1]||vi}
    items.push({t:added(file),name,o:{f,type:isVid?'video':'image',t:{vi:title,en:title},img:enc(file),d:{vi,en}}});
  }
  items.sort((a,b)=>b.t-a.t||a.name.localeCompare(b.name,'vi',{numeric:true}));
  out.push(...items.map(x=>x.o));
}
fs.writeFileSync('works.json',JSON.stringify(out));
fs.writeFileSync('cats.json',JSON.stringify(cats));
console.log('works.json:',out.length,'sản phẩm,',folders.length,'danh mục');
