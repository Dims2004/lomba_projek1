/* ReSchedule Studio - enhance.js (dimuat SETELAH app.js)
   Tambahan: mode terang/gelap, blok siap pakai ala Scratch, edit cepat tanpa mengetik, zoom dan geser kanvas. */
(()=>{
const root=document.documentElement,isL=()=>root.dataset.t!='dark';
const fin=()=>{commit();paint();drawFmt()};

/* ===== pustaka blok siap pakai ===== */
const JT={Cutting:30,Welding:40,Painting:25,Assembly:35};
const jb=(n,priority,due,ops)=>({n,p:{priority,due,ops:ops.map(type=>({type,time:JT[type],setup:0}))}});
const CAT=[
 {k:'mesin',l:'Mesin',c:'#0F6E8C',b:TYPES.map(t=>({n:'Mesin '+t,c:TCOL[t],p:{type:t}}))},
 {k:'job',l:'Job',c:'#C2571A',b:[jb('Job Cepat',2,200,['Cutting','Painting']),jb('Job Standar',3,300,['Cutting','Welding','Painting']),jb('Job Rakitan',3,400,['Cutting','Welding','Assembly','Painting']),jb('Job Urgent',5,180,['Cutting','Welding']),jb('Job Kosong',2,300,[])]},
 {k:'op',l:'Operasi',c:'#5B8C2A',b:TYPES.map(t=>({n:'Operasi '+t,c:TCOL[t],p:{type:t,time:JT[t]}}))},
 {k:'material',l:'Material',c:'#7A4FB0',b:[['Baja plat',20,0],['Cat',0,0],['Komponen',40,10]].map(([name,available,lead])=>({n:name,p:{name,available,lead}}))},
 {k:'event',l:'Gangguan',c:'#B0314F',b:Object.keys(EVN).map(t=>({n:EVN[t],p:{t}}))},
 {k:'objective',l:'Tujuan',c:'#2F7F6F',b:Object.keys(OBN).map(t=>({n:OBN[t],p:{t}}))}];

const lib=()=>`<div class=lib><p class=hint>Seret blok ke kanvas atau klik. Operasi dan Material: lepas tepat di atas blok Job.</p>
<div class=cats>${CAT.map(c=>`<a style="--c:${c.c}" onclick="BL.go('${c.k}')"><i></i>${c.l}</a>`).join('')}</div>
${CAT.map(c=>`<div class=lg id=lg-${c.k}><h5 style="--c:${c.c}">${c.l}</h5>${c.b.map((b,i)=>`<div class=blk style="--c:${b.c||c.c}" draggable=true ondragstart="event.dataTransfer.setData('text/plain','b:${c.k}:${i}')" onclick="BL.add('${c.k}',${i})" title="Seret ke kanvas atau klik">${esc(b.n)}</div>`).join('')}</div>`).join('')}</div>`;

let tt;const toast=m=>{let t=$('#toast');if(!t){t=document.createElement('div');t.id='toast';document.body.appendChild(t)}t.textContent=m;t.hidden=false;clearTimeout(tt);tt=setTimeout(()=>t.hidden=true,2800)};
const jobAt=(x,y)=>[...S.d.nodes].reverse().find(n=>n.role=='job'&&x>=n.x&&x<=n.x+n.w&&y>=n.y&&y<=n.y+n.h);
const lastJob=()=>[...S.d.nodes].reverse().find(n=>n.role=='job');

function add(cat,i,x,y){
 const b=CAT.find(a=>a.k==cat).b[i],at=x!=null,sel=SELN(),
  jn=(at&&jobAt(x,y))||(sel&&sel.role=='job'&&sel)||(!at&&cat=='op'&&lastJob())||null;
 if(cat=='op'&&jn){jn.p.ops.push({setup:0,...b.p});S.sel=jn.id;S.se=null;S.ft='prop';fin();return toast(b.n+' ditambahkan ke '+jn.p.id)}
 const role=cat=='op'?'job':cat,R=ROLE[role],extra=cat=='op'?{ops:[{setup:0,...b.p}]}:b.p,
  n={id:uid(),shape:R.shape,role,w:R.w,h:R.h,p:JSON.parse(JSON.stringify({...DEF[role](),...extra}))},
  cv=$('#cv'),z=S.d.cfg.zoom;
 if(cat=='material'&&jn){n.x=jn.x-n.w-50;n.y=jn.y}
 else if(at){n.x=x-n.w/2;n.y=y-n.h/2}
 else{n.x=cv.scrollLeft/z+60+(S.n%8)*28;n.y=cv.scrollTop/z+50+(S.n++%8)*28}
 n.x=Math.max(0,sn(n.x));n.y=Math.max(0,sn(n.y));
 S.d.nodes.push(n);S.sel=n.id;S.se=null;S.ft='prop';
 if(cat=='material'){if(jn)S.d.edges.push({id:uid(),from:n.id,to:jn.id,style:S.d.cfg.es,route:S.d.cfg.er});else toast('Material belum terhubung. Lepas di atas blok Job, atau tarik tanda × ke blok Job.')}
 fin()}

function bindDrop(){const pg=$('#page');if(!pg||pg.dataset.bl)return;pg.dataset.bl=1;const old=pg.ondrop;
 pg.ondrop=e=>{const t=e.dataTransfer.getData('text/plain');if(t.startsWith('b:')){e.preventDefault();const[,c,i]=t.split(':'),p=P(e);add(c,+i,p[0],p[1])}else old(e)}}

/* ===== edit cepat (tombol +/- dan pilihan, tanpa mengetik) ===== */
const stp=(id,lab,k,v,d,mn,mx)=>`<div class=qr><span>${lab}</span><button onclick="BL.st('${id}','${k}',${-d},${mn},${mx})">−</button><b>${v}</b><button onclick="BL.st('${id}','${k}',${d},${mn},${mx})">+</button></div>`;
const sl=(id,k,opts,cur)=>`<select onchange="BL.sv('${id}','${k}',this.value)">${opts.map(([v,t])=>`<option value="${v}" ${v==cur?'selected':''}>${esc(t)}</option>`).join('')}</select>`;
function qeHTML(n){const p=n.p,id=n.id,r=n.role,T=TYPES.map(t=>[t,t]);
 if(r=='mesin')return sl(id,'type',T,p.type)+stp(id,'Kapasitas','capacity',p.capacity,.25,.25,4)+stp(id,'Shift per hari','shifts',p.shifts,1,1,3);
 if(r=='job')return stp(id,'Prioritas','priority',p.priority,1,1,5)+stp(id,'Due (menit)','due',p.due,30,30,3000)
  +p.ops.map((o,i)=>`<div class=qo>${i+1}.<select onchange="BL.os('${id}',${i},this.value)">${TYPES.map(t=>`<option ${t==o.type?'selected':''}>${t}</option>`).join('')}</select><button onclick="BL.ot('${id}',${i},-5)">−</button><b>${o.time}</b><button onclick="BL.ot('${id}',${i},5)">+</button><button onclick="BL.od('${id}',${i})" title="Hapus">✕</button></div>`).join('')
  +`<div class=qr><span>+ Operasi</span>${TYPES.map(t=>`<button class=ch style="--c:${TCOL[t]}" title="${t}" onclick="BL.oa('${id}','${t}')">${t[0]}</button>`).join('')}</div>`;
 if(r=='material')return stp(id,'Tersedia (menit)','available',p.available,10,0,1000)+stp(id,'Lead time','lead',p.lead,5,0,500);
 if(r=='event'||r=='objective')return sl(id,'t',Object.entries(r=='event'?EVN:OBN),p.t);return''}
function qe(rb=1){const box=$('#qe');if(!box)return;const n=SELN();
 if(!n||!n.role||S.tab){box.hidden=true;return}
 if(rb)box.innerHTML=qeHTML(n);box.hidden=false;
 const el=$(`.nd[data-n="${n.id}"]`);if(!el)return;const w=$('#cvw').getBoundingClientRect(),r=el.getBoundingClientRect();
 let x=r.left-w.left,y=r.top-w.top-box.offsetHeight-12;if(y<8)y=r.bottom-w.top+12;
 box.style.left=Math.max(8,Math.min(x,w.width-box.offsetWidth-8))+'px';box.style.top=Math.max(8,Math.min(y,w.height-box.offsetHeight-8))+'px'}

/* ===== zoom dan geser ===== */
function zoomAt(nz,cx,cy){const cv=$('#cv'),pg=$('#pgw'),old=S.d.cfg.zoom;
 if(cx==null){const r=cv.getBoundingClientRect();cx=r.left+cv.clientWidth/2;cy=r.top+cv.clientHeight/2}
 const r=pg.getBoundingClientRect(),px=(cx-r.left)/old,py=(cy-r.top)/old;zoom(nz);
 const z=S.d.cfg.zoom,r2=pg.getBoundingClientRect();cv.scrollLeft+=r2.left+px*z-cx;cv.scrollTop+=r2.top+py*z-cy}
function fit(){const cv=$('#cv'),ns=S.d.nodes;if(!ns.length)return zoomAt(1);
 const x1=Math.min(...ns.map(n=>n.x)),y1=Math.min(...ns.map(n=>n.y)),x2=Math.max(...ns.map(n=>n.x+n.w)),y2=Math.max(...ns.map(n=>n.y+n.h));
 zoom(Math.min((cv.clientWidth-90)/(x2-x1),(cv.clientHeight-90)/(y2-y1),2));const z=S.d.cfg.zoom;cv.scrollLeft=28+x1*z-45;cv.scrollTop=28+y1*z-45}
function arrange(){const X={material:40,job:300,mesin:640,event:930,objective:1170};
 for(const r in X){let y=60;S.d.nodes.filter(n=>n.role==r).sort((a,b)=>a.y-b.y).forEach(n=>{n.x=X[r];n.y=y;y+=n.h+30})}
 commit();paint();fit()}

window.BL={add,go:k=>$('#lg-'+k)?.scrollIntoView({behavior:'smooth',block:'start'}),
 st(id,k,d,mn,mx){const p=NN(id).p;p[k]=Math.min(mx,Math.max(mn,Math.round((+p[k]+d)*100)/100));fin()},
 sv(id,k,v){NN(id).p[k]=v;fin()},
 os(id,i,v){NN(id).p.ops[i].type=v;fin()},
 ot(id,i,d){const o=NN(id).p.ops[i];o.time=Math.max(5,o.time+d);fin()},
 od(id,i){NN(id).p.ops.splice(i,1);fin()},
 oa(id,t){NN(id).p.ops.push({type:t,time:JT[t],setup:0});fin()},
 z:d=>zoomAt(d?S.d.cfg.zoom*(d>0?1.2:1/1.2):1),fit,arr:arrange,
 th(){const v=isL()?'dark':'light';localStorage.rs_theme=v;root.dataset.t=v;icon();if(S&&$('#page'))paint()}};
const icon=()=>{const b=$('#thb');if(b)b.textContent=isL()?'🌙':'☀️'};

/* ===== sambungkan ke fungsi app.js ===== */
const _ds=drawShapes;drawShapes=function(){_ds();const s=$('#shapes');
 [...s.querySelectorAll('details')].find(d=>d.firstElementChild.textContent.trim()=='Produksi')?.remove();s.insertAdjacentHTML('afterbegin',lib())};
const _dt=drawTbar;drawTbar=function(){_dt();const sp=$('#tbar .sp');if(!sp)return;
 sp.insertAdjacentHTML('beforebegin','<i class=vs></i><button class=tb title="Pas ke layar" onclick="BL.fit()">⤢</button><button class=tb title="Ukuran 100%" onclick="BL.z(0)">1:1</button><button class=tb title="Susun otomatis per kolom" onclick="BL.arr()">⊞</button>')};
const _p=paint;paint=function(){const c=S.d.cfg,ns=S.d.nodes;
 if(ns.length){c.pw=Math.max(c.pw,...ns.map(n=>n.x+n.w+80));c.ph=Math.max(c.ph,...ns.map(n=>n.y+n.h+80))}
 _p();const pg=$('#page');if(!pg)return;
 if(c.grid){const a=isL()?'#00000022':'#ffffff22',b=isL()?'#0000000d':'#ffffff0e';pg.style.backgroundImage=`linear-gradient(${a} 1px,transparent 1px),linear-gradient(90deg,${a} 1px,transparent 1px),linear-gradient(${b} 1px,transparent 1px),linear-gradient(90deg,${b} 1px,transparent 1px)`}
 bindDrop();const zp=$('#zp');if(zp)zp.textContent=Math.round(c.zoom*100)+'%';qe()};
const _nh=nodeH;nodeH=n=>{const h=_nh(n);return n.shape=='text'&&!n.tc&&isL()?h.replace('color:#fff','color:#1f2328'):h};
const _lb=label;label=n=>n.role=='job'?`<b>${esc(n.p.id)} · P${n.p.priority}</b>${n.p.ops.map(o=>o.type[0]).join(' › ')||'tanpa operasi'} · due ${n.p.due}`:_lb(n);

/* ===== pasang ke halaman editor ===== */
let sp=false;const typing=t=>/INPUT|SELECT|TEXTAREA/.test(t.tagName)||t.isContentEditable;
addEventListener('keydown',e=>{const cv=$('#cv');if(e.code=='Space'&&cv&&!typing(e.target)){e.preventDefault();sp=true;cv.classList.add('pan')}});
addEventListener('keyup',e=>{if(e.code=='Space'){sp=false;$('#cv')?.classList.remove('pan')}});
function enhance(){if(!$('#shell')||$('#cvw'))return;
 const cv=$('#cv'),w=document.createElement('div');w.id='cvw';cv.before(w);w.append(cv);
 w.insertAdjacentHTML('beforeend','<div id=qe hidden></div><div id=zc><small id=zp>100%</small><button title="Perbesar" onclick="BL.z(1)">+</button><button title="Perkecil" onclick="BL.z(-1)">−</button><button title="Pas ke layar" onclick="BL.fit()">⤢</button><button title="Ukuran 100%" onclick="BL.z(0)">=</button></div>');
 $('.hdr .usr').insertAdjacentHTML('afterend','<button class=tb id=thb title="Mode terang / gelap" onclick="BL.th()"></button>');
 cv.addEventListener('wheel',e=>{if(!(e.ctrlKey||e.metaKey))return;e.preventDefault();zoomAt(S.d.cfg.zoom*Math.exp(-e.deltaY*.002),e.clientX,e.clientY)},{passive:false});
 cv.addEventListener('scroll',()=>qe(0));
 cv.addEventListener('pointerdown',e=>{const bg=e.target===cv&&e.offsetX<cv.clientWidth&&e.offsetY<cv.clientHeight||e.target.id=='pgw';
  if(!(e.button==1||sp||bg))return;e.preventDefault();e.stopPropagation();
  const x=e.clientX,y=e.clientY,l=cv.scrollLeft,t=cv.scrollTop;let moved=false;
  const mv=ev=>{if(Math.hypot(ev.clientX-x,ev.clientY-y)>3)moved=true;cv.scrollLeft=l-(ev.clientX-x);cv.scrollTop=t-(ev.clientY-y)};
  const up=()=>{removeEventListener('pointermove',mv);removeEventListener('pointerup',up);if(!moved&&!sp&&e.button==0)select(null,null)};
  addEventListener('pointermove',mv);addEventListener('pointerup',up)},true);
 icon();drawShapes();drawTbar();paint()}
new MutationObserver(enhance).observe($('#root'),{childList:true});

Object.assign(TOUR[1],{x:'Blok warna-warni siap pakai: Mesin, Job, Operasi, Material, Gangguan, dan Tujuan. Seret ke kanvas atau klik. Operasi dan Material dilepas di atas blok Job supaya otomatis tersambung.'});
Object.assign(TOUR[2],{x:'Klik sebuah blok, lalu ubah nilainya lewat tombol +/− dan pilihan di kotak yang muncul, tanpa mengetik. Zoom: Ctrl + scroll atau tombol di kanan bawah. Geser kanvas: tahan Spasi lalu seret.'});
enhance();
})();
