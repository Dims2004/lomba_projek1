/* Production Model Builder ala node-graph. Dimuat SETELAH app.js */
(()=>{
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
let SEL=null,PRICE=null,VAL=null,tmr=null,keyBound=false;
const K=()=>Math.random().toString(36).slice(2,8);
const NW={mach:190,job:240,mat:190,opt:220,ev:200,obj:210,api:170};
const CAT={mach:'Production Environment',job:'Job & Routing',mat:'Material Configuration',ev:'Dynamic Events',obj:'Optimization Objectives',opt:'Optimizer',api:'Output'};
const CC={mach:'#0F6E8C',job:'#C2571A',mat:'#7A4FB0',ev:'#B0314F',obj:'#2F7F6F',opt:'#14232B',api:'#8A6D00'};
const EVN={breakdown:'Machine breakdown',material:'Material delay',urgent:'New urgent order',absence:'Operator absence',deviation:'Processing time deviation'};
const OBN={tardiness:'Minimize total tardiness',disruption:'Minimize schedule disruption',setup:'Minimize setup/changeover cost',utilization:'Maximize machine utilization',makespan:'Minimize makespan'};
const ARR={mach:'machines',job:'jobs',mat:'materials'};
const H=(k,x)=>k=='mach'?92:k=='mat'?96:k=='job'?86+x.ops.length*30:150;
function fix(){const m=S.model;m.calendar=m.calendar||{days:6,start:'07:00',holidays:''};['machines','jobs','materials'].forEach(a=>m[a].forEach(x=>x._k=x._k||K()));S.layout=S.layout||{}}
function ensure(){const m=S.model,L=S.layout,X={mat:20,job:270,mach:570};
 const col=(kind,arr)=>{let b=20;arr.forEach(x=>{const p=L[kind+':'+x._k];if(p)b=Math.max(b,p.y+H(kind,x)+16)});
  arr.forEach(x=>{const k=kind+':'+x._k;if(!L[k]){L[k]={x:X[kind],y:b};b+=H(kind,x)+16}})};
 col('mat',m.materials);col('job',m.jobs);col('mach',m.machines);
 L.opt=L.opt||{x:830,y:20};L.ev=L.ev||{x:830,y:210};L.obj=L.obj||{x:830,y:380};L.api=L.api||{x:1080,y:20}}
const optBody=()=>`Estimasi harga<br><b>${PRICE!=null?rup(PRICE):'…'}</b> / bln<br><span class="${VAL&&VAL.errors.length?'err':'okc'}">${VAL?(VAL.errors.length?VAL.errors.length+' masalah':'Model valid'):'memeriksa…'}</span>`;
const list=(o,n)=>Object.keys(n).filter(k=>o[k]).map(k=>'• '+n[k]).join('<br>')||'<span class=mut>(belum dipilih)</span>';
function node(kind,x,i){const m=S.model,id=x?kind+':'+x._k:kind,p=S.layout[id];let c=CC[kind],h='',b='',pt='';
 const P=(n,s)=>`<i class="pt ${s}" data-p="${n}"></i>`;
 if(kind=='mach'){c=TCOL[x.type]||c;h='Mesin '+esc(x.id);b=`${esc(x.type)} · kapasitas ${x.capacity}<br>${x.shifts||1} shift × ${x.shift} jam`;pt=P('mi:'+x._k,'in')+P('mout:'+x._k,'out')}
 else if(kind=='job'){c=COL[i%7];h='Job '+esc(x.id);b=`prioritas ${x.priority} · due ${x.due}`+(x.ops.map((o,k)=>`<div class="pill ${m.machines.some(q=>q.type==o.type)?'':'badp'}" style="--c:${TCOL[o.type]||'#555'}">${k+1}. ${esc(o.type)} · ${o.time} mnt${o.setup?' +'+o.setup:''}${P(`op:${x._k}:${k}`,'out')}</div>`).join('')||'<div class=mut>belum ada operasi</div>');pt=P('ji:'+x._k,'in')}
 else if(kind=='mat'){h='Material '+esc(x.name);b=`untuk Job ${esc(x.job||'?')}<br>tersedia menit ${x.available}${x.lead?' + lead '+x.lead:''} · qty ${x.qty||1}`;pt=`<i class="pt out" data-p="mo:${x._k}" data-mat="${x._k}" title="Tarik ke blok Job"></i>`}
 else if(kind=='opt'){h='Optimizer';b=optBody();pt=P('opt:i','in')+P('opt:o','out')}
 else if(kind=='ev'){h='Dynamic Events';b=list(m.events,EVN);pt=P('ev:o','out')}
 else if(kind=='obj'){h='Objectives';b=list(m.objectives,OBN);pt=P('obj:o','out')}
 else{h='API Jadwal';b='POST /api/v1/reschedule<br>jadwal baru + metrik';pt=P('api:i','in')}
 return`<div class="nd${SEL==id?' sel':''}" data-n="${id}" style="left:${p.x}px;top:${p.y}px;width:${NW[kind]}px;--c:${c}"><div class=nh>${h}<small>${CAT[kind]}</small></div><div class=nb>${b}</div>${pt}</div>`}
function edges(){const m=S.model,E=[];
 m.materials.forEach(x=>{const j=m.jobs.find(j=>j.id==x.job);if(j)E.push(['mo:'+x._k,'ji:'+j._k,'#7A4FB0','mat:'+x._k,'job:'+j._k])});
 m.jobs.forEach(j=>j.ops.forEach((o,k)=>m.machines.forEach(q=>{if(q.type==o.type)E.push([`op:${j._k}:${k}`,'mi:'+q._k,TCOL[o.type]||'#888','job:'+j._k,'mach:'+q._k])})));
 m.machines.forEach(q=>E.push(['mout:'+q._k,'opt:i','#0F6E8C','mach:'+q._k,'opt']));
 E.push(['ev:o','opt:i','#B0314F','ev','opt'],['obj:o','opt:i','#2F7F6F','obj','opt'],['opt:o','api:i','#14232B','opt','api']);return E}
function drawEdges(){const bi=$('#binner'),svg=$('#bsvg');if(!bi||!svg)return;const c=bi.getBoundingClientRect(),P={};
 $$('[data-p]',bi).forEach(e=>{const r=e.getBoundingClientRect();P[e.dataset.p]=[r.left+r.width/2-c.left,r.top+r.height/2-c.top]});
 svg.innerHTML=edges().filter(e=>P[e[0]]&&P[e[1]]).map(([a,b,col,na,nb])=>{const[x1,y1]=P[a],[x2,y2]=P[b],d=Math.max(40,Math.abs(x2-x1)/2),on=SEL&&(SEL==na||SEL==nb);
  return`<path d="M${x1} ${y1}C${x1+d} ${y1} ${x2-d} ${y2} ${x2} ${y2}" stroke="${col}" stroke-width="${on?3.5:1.8}" opacity="${SEL?(on?1:.15):.6}" fill="none"/>`}).join('')}
function fit(){const bi=$('#binner');if(!bi)return;let w=1200,h=560;$$('.nd',bi).forEach(n=>{w=Math.max(w,n.offsetLeft+n.offsetWidth+60);h=Math.max(h,n.offsetTop+n.offsetHeight+60)});bi.style.width=w+'px';bi.style.height=h+'px'}
function drawCanvas(){const bi=$('#binner');if(!bi)return;fix();ensure();const m=S.model;let h='';
 m.materials.forEach(x=>h+=node('mat',x));m.jobs.forEach((x,i)=>h+=node('job',x,i));m.machines.forEach(x=>h+=node('mach',x));['opt','ev','obj','api'].forEach(k=>h+=node(k));
 bi.innerHTML='<svg id=bsvg></svg>'+h;fit();drawEdges()}
function pick(id){SEL=id;$$('.nd').forEach(n=>n.classList.toggle('sel',n.dataset.n==id));drawPanel();drawEdges()}
function find(id){if(!id)return null;const[k,u]=id.split(':'),a=ARR[k];if(!a)return{kind:k};const i=S.model[a].findIndex(x=>x._k==u);return i<0?null:{kind:k,a,i,x:S.model[a][i]}}
const F=(p,v,n,l)=>`<label class=pf>${l}<input ${n?'type=number step=any':''} value="${esc(v)}" oninput="B.upd('${p}',this.value,${n?1:0})"></label>`;
const SL=(p,v,o,l)=>`<label class=pf>${l}<select onchange="B.upd('${p}',this.value,0)">${o.map(x=>`<option ${x==v?'selected':''}>${esc(x)}</option>`).join('')}</select></label>`;
const CK=(p,v,l)=>`<label class=ck><input type=checkbox ${v?'checked':''} onchange="B.tg('${p}')">${l}</label>`;
function checklist(){const m=S.model,has=a=>Object.values(a).some(Boolean);
 return[['Production Environment',m.machines.length>0],['Job Configuration',m.jobs.length>0],['Production Routing',m.jobs.length>0&&m.jobs.every(j=>j.ops.length&&j.ops.every(o=>m.machines.some(q=>q.type==o.type)))],['Material Configuration',m.materials.length>0,1],['Dynamic Events',has(m.events)],['Optimization Objectives',has(m.objectives)]]}
function drawPanel(){const s=$('#side');if(!s)return;const f=find(SEL),m=S.model;let h='';
 if(!f)h=`<h3>Ringkasan model</h3><p class=mut>Enam konfigurasi yang dibutuhkan:</p>${checklist().map(([n,ok,opt])=>`<div class="ci ${ok?'ok':''}">${ok?'✓':'○'} ${n}${opt&&!ok?' (opsional)':''}</div>`).join('')}
 <p class=mut>Klik sebuah blok untuk mengeditnya di sini. Tarik titik ungu pada Material ke blok Job untuk menghubungkan. Tombol Delete menghapus blok terpilih.</p>`;
 else if(f.kind=='mach'){const x=f.x,P=`model.machines.${f.i}`;h=`<h3>Mesin ${esc(x.id)}</h3><p class=mut>Production Environment</p>${F(P+'.id',x.id,0,'ID mesin')}${SL(P+'.type',x.type,TYPES,'Jenis mesin')}${F(P+'.capacity',x.capacity,1,'Kapasitas (kecepatan relatif)')}${F(P+'.shift',x.shift,1,'Jam operasional per shift')}${F(P+'.shifts',x.shifts||1,1,'Jumlah shift per hari')}<button class=dng onclick="B.del()">Hapus mesin</button>`}
 else if(f.kind=='job'){const x=f.x,P=`model.jobs.${f.i}`;h=`<h3>Job ${esc(x.id)}</h3><p class=mut>Job Configuration & Production Routing</p>
  <label class=pf>ID job<input value="${esc(x.id)}" oninput="B.jobId(${f.i},this.value)"></label>${F(P+'.priority',x.priority,1,'Prioritas (1-5, 5 tertinggi)')}${F(P+'.due',x.due,1,'Due date (menit)')}
  <h3>Routing (urutan atas ke bawah)</h3>${x.ops.map((o,k)=>`<div class=opc>${SL(`${P}.ops.${k}.type`,o.type,TYPES,'Operasi '+(k+1)+': jenis mesin')}<div class=r2>${F(`${P}.ops.${k}.time`,o.time,1,'Waktu proses')}${F(`${P}.ops.${k}.setup`,o.setup,1,'Setup/changeover')}</div>
  <div class=r3><button class=ghost onclick="B.mv(${f.i},${k},-1)">↑</button><button class=ghost onclick="B.mv(${f.i},${k},1)">↓</button><button class=x onclick="B.rmop(${f.i},${k})">Hapus</button></div></div>`).join('')}
  <button class=ghost onclick="B.addop(${f.i})">+ Tambah operasi</button><p class=mut>Material: ${m.materials.filter(q=>q.job==x.id).map(q=>esc(q.name)).join(', ')||'-'}</p><button class=dng onclick="B.del()">Hapus job</button>`}
 else if(f.kind=='mat'){const x=f.x,P=`model.materials.${f.i}`;h=`<h3>Material</h3><p class=mut>Material Configuration</p>${F(P+'.name',x.name,0,'Kebutuhan bahan baku')}${SL(P+'.job',x.job,m.jobs.map(j=>j.id),'Dipakai oleh Job')}${F(P+'.qty',x.qty||1,1,'Jumlah kebutuhan')}${F(P+'.available',x.available,1,'Ketersediaan: tersedia pada menit ke-')}${F(P+'.lead',x.lead||0,1,'Lead time (menit)')}<button class=dng onclick="B.del()">Hapus material</button>`}
 else if(f.kind=='ev')h=`<h3>Dynamic Events</h3><p class=mut>Jenis gangguan yang ingin didukung</p>${Object.keys(EVN).map(k=>CK('model.events.'+k,m.events[k],EVN[k])).join('')}${F('model.est_jobs',m.est_jobs,1,'Estimasi jumlah job per periode')}`;
 else if(f.kind=='obj')h=`<h3>Optimization Objectives</h3><p class=mut>Tujuan optimasi</p>${Object.keys(OBN).map(k=>CK('model.objectives.'+k,m.objectives[k],OBN[k])).join('')}`;
 else if(f.kind=='opt')h=`<h3>Optimizer</h3><p class=mut>Pengaturan kalender produksi</p>${F('model.calendar.days',m.calendar.days,1,'Hari kerja per minggu')}${F('model.calendar.start',m.calendar.start,0,'Jam mulai kerja')}${F('model.calendar.holidays',m.calendar.holidays,0,'Hari libur (teks bebas)')}
  <h3>Pemeriksaan cepat</h3>${VAL?VAL.errors.map(e=>`<p class=err>✕ ${esc(e)}</p>`).join('')+VAL.warnings.map(e=>`<p class=warn>! ${esc(e)}</p>`).join('')+(VAL.errors.length?'':'<p class=okc>✓ Model valid</p>'):'<p class=mut>Memeriksa…</p>'}<button class=ghost onclick="B.info()">Periksa ulang</button>`;
 else h=`<h3>API Jadwal</h3><p>Hasil akhir: jadwal baru dan metrik (makespan, tardiness, stability, speed, utilization) lewat endpoint <code>/api/v1/reschedule</code>.</p>`;
 s.innerHTML=h}
function info(){clearTimeout(tmr);tmr=setTimeout(async()=>{if(S.step!=1)return;try{const[p,v]=await Promise.all([api('/api/pricing',S.model),api('/api/validate',S.model)]);PRICE=p.total??null;VAL=v.errors?v:null}catch(e){return}
 const n=$('[data-n="opt"] .nb');if(n)n.innerHTML=optBody();if(SEL=='opt')drawPanel()},500)}
function add(t,pos,jk){const m=S.model,L=S.layout;fix();let x,id;
 if(t=='Mesin'){x={_k:K(),id:uid('M',m.machines),type:'Cutting',capacity:1,shift:8,shifts:1};m.machines.push(x);id='mach:'+x._k}
 else if(t=='Job'){x={_k:K(),id:uid('J',m.jobs),priority:2,due:300,ops:[]};m.jobs.push(x);id='job:'+x._k}
 else if(t=='Operasi'){const j=m.jobs.find(j=>j._k==jk)||m.jobs.find(j=>'job:'+j._k==SEL)||m.jobs[m.jobs.length-1];if(!j)return alert('Buat blok Job dulu.');j.ops.push(op(m.machines[0]?.type||'Cutting',30));id='job:'+j._k}
 else if(t=='Material'){if(!m.jobs.length)return alert('Buat blok Job dulu.');const j=m.jobs.find(j=>j._k==jk)||m.jobs[0];x={_k:K(),job:j.id,name:'Bahan baru',available:0,lead:0,qty:1};m.materials.push(x);id='mat:'+x._k}
 else return;
 if(pos&&x)L[id]={x:Math.max(0,pos.x-90),y:Math.max(0,pos.y-20)};save();drawCanvas();pick(id);info()}
function linkFrom(e,k){e.preventDefault();const a=$(`[data-p="mo:${k}"]`),bi=$('#binner'),svg=$('#bsvg'),c=bi.getBoundingClientRect(),r=a.getBoundingClientRect(),x1=r.left+r.width/2-c.left,y1=r.top+r.height/2-c.top;
 const t=document.createElementNS('http://www.w3.org/2000/svg','path');['stroke:#7A4FB0','fill:none','stroke-dasharray:5','stroke-width:2'].forEach(s=>t.setAttribute(...s.split(':')));svg.appendChild(t);
 const mv=ev=>t.setAttribute('d',`M${x1} ${y1}L${ev.clientX-c.left} ${ev.clientY-c.top}`);
 const up=ev=>{removeEventListener('pointermove',mv);removeEventListener('pointerup',up);t.remove();const n=document.elementFromPoint(ev.clientX,ev.clientY)?.closest('.nd[data-n^="job:"]');
  if(n){const mat=S.model.materials.find(x=>x._k==k),job=S.model.jobs.find(x=>'job:'+x._k==n.dataset.n);if(mat&&job){mat.job=job.id;save();drawCanvas();if(SEL=='mat:'+k)drawPanel();info()}}};
 addEventListener('pointermove',mv);addEventListener('pointerup',up)}
function bindCanvas(){const bi=$('#binner'),cv=$('#canvas');
 bi.onpointerdown=e=>{const mp=e.target.closest('.pt[data-mat]');if(mp)return linkFrom(e,mp.dataset.mat);
  const nd=e.target.closest('.nd');if(!nd){pick(null);return}e.preventDefault();pick(nd.dataset.n);
  const L=S.layout[nd.dataset.n],sx=e.clientX,sy=e.clientY,ox=L.x,oy=L.y;nd.setPointerCapture(e.pointerId);nd.classList.add('drag');
  nd.onpointermove=ev=>{L.x=Math.max(0,ox+ev.clientX-sx);L.y=Math.max(0,oy+ev.clientY-sy);nd.style.left=L.x+'px';nd.style.top=L.y+'px';drawEdges()};
  nd.onpointerup=()=>{nd.onpointermove=nd.onpointerup=null;nd.classList.remove('drag');save();fit()}};
 cv.ondragover=e=>e.preventDefault();
 cv.ondrop=e=>{e.preventDefault();const t=e.dataTransfer.getData('text/plain'),r=bi.getBoundingClientRect(),n=document.elementFromPoint(e.clientX,e.clientY)?.closest('.nd[data-n^="job:"]');add(t,{x:e.clientX-r.left,y:e.clientY-r.top},n&&n.dataset.n.slice(4))}}
window.B={add,info,
 upd(p,v,n){set(p,v,n);drawCanvas();info()},
 tg(p){tog(p);save();drawCanvas();info()},
 jobId(i,v){const m=S.model,o=m.jobs[i].id;m.materials.forEach(x=>{if(x.job==o)x.job=v});m.jobs[i].id=v;save();drawCanvas();info()},
 addop(i){S.model.jobs[i].ops.push(op(S.model.machines[0]?.type||'Cutting',30));save();drawCanvas();drawPanel();info()},
 rmop(i,k){S.model.jobs[i].ops.splice(k,1);save();drawCanvas();drawPanel();info()},
 mv(i,k,d){const o=S.model.jobs[i].ops,j=k+d;if(j<0||j>=o.length)return;[o[k],o[j]]=[o[j],o[k]];save();drawCanvas();drawPanel()},
 del(){const f=find(SEL);if(!f||!f.a)return;const m=S.model;if(f.kind=='job')m.materials=m.materials.filter(x=>x.job!=f.x.id);m[f.a].splice(f.i,1);delete S.layout[SEL];SEL=null;save();drawCanvas();drawPanel();info()},
 relayout(){S.layout={};save();drawCanvas()},
 demo(){S.model=demo().model;S.layout={};SEL=null;save();drawCanvas();drawPanel();info()},
 clear(){if(!confirm('Hapus semua mesin, job, dan material?'))return;const m=S.model;m.machines=[];m.jobs=[];m.materials=[];S.layout={};SEL=null;save();drawCanvas();drawPanel();info()}};
function init(){if(!$('#binner'))return;fix();drawCanvas();bindCanvas();drawPanel();info();
 if(!keyBound){keyBound=true;addEventListener('keydown',e=>{if(S.step==1&&SEL&&e.key=='Delete'&&!/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))B.del()})}}
const chip=(t,c,d)=>`<div class=chipn style="--c:${c}" draggable=true ondragstart="event.dataTransfer.setData('text/plain','${t}')" onclick="B.add('${t}')" title="Seret ke kanvas atau klik"><b>${t}</b><small>${d}</small></div>`;
V[1]=()=>{setTimeout(init,0);return`<div class=card><h2>Production Model Builder</h2><p class=mut>Seret blok dari kiri ke kanvas, seperti menyusun diagram. Blok bisa digeser. Tarik titik ungu pada Material ke blok Job untuk menghubungkan. Klik blok untuk mengedit di panel kanan.</p>
<div class=tb><button class=ghost onclick="B.relayout()">Rapikan layout</button><button class=ghost onclick="B.demo()">Muat demo</button><button class=ghost onclick="B.clear()">Kosongkan</button></div></div>
<div class=ws2><div id=palette class=pal3>${chip('Mesin','#0F6E8C','ke kanvas')}${chip('Job','#C2571A','ke kanvas')}${chip('Operasi','#5B8C2A','lepas di atas blok Job')}${chip('Material','#7A4FB0','lepas di atas blok Job')}</div>
<div id=canvas class=bcanvas><div id=binner><svg id=bsvg></svg></div></div><div id=side class=card2></div></div>
<p><button id=btnToVal onclick="adv(2)">Lanjut ke validasi</button></p>`};
Object.assign(TOUR[2],{x:'Seret blok Mesin, Job, Operasi, atau Material ke kanvas. Operasi dan Material dilepas di atas blok Job. Klik blok juga bisa.'});
Object.assign(TOUR[3],{t:'Susun diagram',x:'Setiap blok bisa digeser. Garis menunjukkan hubungan: Material ke Job, operasi ke mesin yang bisa mengerjakannya, lalu ke Optimizer. Tarik titik ungu Material ke blok Job untuk menghubungkan.'});
Object.assign(TOUR[4],{t:'Panel properti',x:'Klik sebuah blok, lalu isi nilainya di panel ini. Blok Dynamic Events dan Objectives berisi pilihan gangguan dan tujuan. Blok Optimizer menampilkan estimasi harga langsung.'});
render();
})();