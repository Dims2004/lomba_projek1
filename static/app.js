const $=s=>document.querySelector(s);
const api=(u,b,h={})=>fetch(u,{method:'POST',headers:{'Content-Type':'application/json',...h},body:JSON.stringify(b)}).then(r=>r.json());
const TYPES=['Cutting','Welding','Painting','Assembly'],COL=['#0F6E8C','#C2571A','#5B8C2A','#7A4FB0','#B0314F','#2F7F6F','#8A6D00'];
const TCOL={Cutting:'#0F6E8C',Welding:'#C2571A',Painting:'#5B8C2A',Assembly:'#7A4FB0'};
const STEPS=['Register akun','Production Model','Validasi model','Benchmark','Pricing','Pembayaran','Kredensial API','Integrasi'];
const op=(t,w,s=0)=>({type:t,time:w,setup:s});
function demo(){return{name:'',step:0,max:0,key:'',res:{},model:{est_jobs:100,
machines:[{id:'M1',type:'Cutting',capacity:1,shift:8},{id:'M2',type:'Cutting',capacity:1.2,shift:8},{id:'M3',type:'Welding',capacity:1,shift:8},{id:'M4',type:'Painting',capacity:1,shift:8}],
jobs:[{id:'J1',priority:3,due:200,ops:[op('Cutting',30,5),op('Welding',40,5),op('Painting',25)]},{id:'J2',priority:2,due:260,ops:[op('Cutting',45,5),op('Welding',30),op('Painting',30)]},
{id:'J3',priority:5,due:180,ops:[op('Cutting',20),op('Welding',50,5)]},{id:'J4',priority:1,due:320,ops:[op('Cutting',35),op('Painting',40)]},{id:'J5',priority:3,due:280,ops:[op('Welding',45),op('Painting',20,5)]}],
materials:[{job:'J2',name:'Baja plat',available:20}],
events:{breakdown:true,material:true,urgent:true,absence:false,deviation:true},
objectives:{tardiness:true,disruption:true,setup:false,utilization:true,makespan:true}}}}
let S;try{S=JSON.parse(localStorage.rsv1)||demo()}catch(e){S=demo()}
const save=()=>localStorage.rsv1=JSON.stringify(S);
const ref=p=>{let o=S,k=p.split('.');while(k.length>1)o=o[k.shift()];return[o,k[0]]};
function set(p,v,n){const[o,k]=ref(p);o[k]=n?+v:v;save()}
function tog(p){const[o,k]=ref(p);o[k]=!o[k];save()}
const inp=(p,v,n,t)=>`<input ${n?'type=number step=any':''} value="${v}" aria-label="${t||p}" oninput="set('${p}',this.value,${!!n})">`;
const sel=(p,v,o)=>`<select oninput="set('${p}',this.value)">${o.map(x=>`<option ${x==v?'selected':''}>${x}</option>`).join('')}</select>`;
const selR=(p,v,o)=>`<select oninput="set('${p}',this.value);render()">${o.map(x=>`<option ${x==v?'selected':''}>${x}</option>`).join('')}</select>`;
const ck=(p,v,l)=>`<label class=ck><input type=checkbox ${v?'checked':''} onchange="tog('${p}');save()">${l}</label>`;
const rup=n=>'Rp '+n.toLocaleString('id-ID');
function go(n){if(n>S.max)return;S.step=n;save();render()}
function adv(n){S.max=Math.max(S.max,n);S.step=n;save();render()}
function render(){
 $('#nav').innerHTML=STEPS.map((t,i)=>`<a class="${i==S.step?'on':''} ${i>S.max?'off':''} ${i<S.max?'done':''}" onclick="go(${i})">${i+1}. ${t}</a>`).join('');
 $('#main').innerHTML=V[S.step]();if(S.step==4&&!S.res.price)doPrice()}
const hint=t=>`<div class=hint>${t}</div>`;
const V=[
()=>`<div class=card><h2>Buat akun</h2><p class=mut>Mulai dari sini. Akun ini simulasi dan tersimpan di browser Anda.</p>
<div class=row style="max-width:420px">${inp('name',S.name,0,'Nama perusahaan')}</div>
<p><button id=btnReg onclick="if(!S.name.trim())return alert('Isi nama perusahaan dulu.');adv(1)">Buat akun & mulai</button></p>
<h3>Untuk pemula</h3><p>Free sandbox, demo konfigurasi (sudah terisi di langkah 2), simulasi terbatas, dan estimasi harga sebelum berlangganan.</p></div>`,
()=>{const m=S.model,pb=(t,c,d)=>`<div class="blk palb" style="--c:${c}" draggable=true ondragstart="drag(event,{kind:'new',t:'${t}'})" onclick="addNode('${t}')" title="Seret ke kanvas atau klik">${t}<small>${d}</small></div>`;
const grip=d=>`<span class=grip draggable=true title="Seret" ondragstart="drag(event,${d})">⠿</span>`;
return`<div class=card><h2>Production Model Builder</h2><p class=mut>Susun model seperti Scratch: seret blok dari kiri ke kanvas. Urutan blok Operasi di dalam Job adalah routing-nya. Seret blok ke kotak merah untuk menghapus.</p></div>
<div class=ws><div class=pal2 id=palette>${pb('Mesin','#0F6E8C','ke Lantai produksi')}${pb('Job','#C2571A','ke area Job')}${pb('Operasi','#5B8C2A','ke dalam Job')}${pb('Material','#7A4FB0','ke slot material Job')}
<div class=trash ondragover="ov(event)" ondragleave="lv(event)" ondrop="dp(event,'trash')">Seret blok ke sini untuk menghapus</div></div>
<div id=canvas>
<div class=card><h3>Lantai produksi (${m.machines.length} mesin)</h3><div class=zone ondragover="ov(event)" ondragleave="lv(event)" ondrop="dp(event,'machine')"><div class=mrow>
${m.machines.map((x,i)=>`<div class="blk" style="--c:${TCOL[x.type]||'#555'}">${grip(`{kind:'machine',i:${i}}`)}Mesin ${inp(`model.machines.${i}.id`,x.id,0,'ID mesin')}${selR(`model.machines.${i}.type`,x.type,TYPES)}kap. ${inp(`model.machines.${i}.capacity`,x.capacity,1,'Kapasitas')}jam/shift ${inp(`model.machines.${i}.shift`,x.shift,1,'Jam per shift')}</div>`).join('')}</div>
${m.machines.length?'':hint('Seret blok Mesin ke sini')}</div></div>
<div class=card><h3>Job & routing (${m.jobs.length} job)</h3><div class=zone ondragover="ov(event)" ondragleave="lv(event)" ondrop="dp(event,'job')">
${m.jobs.map((j,i)=>`<div class=cb style="--c:${COL[i%7]}"><div class=cbh>${grip(`{kind:'job',i:${i}}`)}Job <input value="${j.id}" aria-label="ID job" onchange="renJob(${i},this.value)">prioritas ${inp(`model.jobs.${i}.priority`,j.priority,1,'Prioritas')}due ${inp(`model.jobs.${i}.due`,j.due,1,'Due date')}</div>
<div class=slot ondragover="ov(event)" ondragleave="lv(event)" ondrop="dp(event,'op',${i})">${j.ops.map((o,k)=>`<div class="blk" style="--c:${TCOL[o.type]||'#555'}">${grip(`{kind:'op',j:${i},k:${k}}`)}Operasi ${k+1} ${selR(`model.jobs.${i}.ops.${k}.type`,o.type,TYPES)}waktu ${inp(`model.jobs.${i}.ops.${k}.time`,o.time,1,'Waktu proses')}setup ${inp(`model.jobs.${i}.ops.${k}.setup`,o.setup,1,'Setup')}</div>`).join('')}${j.ops.length?'':hint('Seret blok Operasi ke sini (urutan = routing)')}</div>
<div class=slot ondragover="ov(event)" ondragleave="lv(event)" ondrop="dp(event,'mat',${i})">${m.materials.map((x,mi)=>x.job!=j.id?'':`<div class="blk" style="--c:#7A4FB0">${grip(`{kind:'mat',i:${mi}}`)}Material ${inp(`model.materials.${mi}.name`,x.name,0,'Nama material')}tersedia menit ke- ${inp(`model.materials.${mi}.available`,x.available,1,'Tersedia pada menit')}</div>`).join('')}${m.materials.some(x=>x.job==j.id)?'':hint('Seret blok Material ke sini (opsional)')}</div>
<div class=cbf></div></div>`).join('')}${m.jobs.length?'':hint('Seret blok Job ke sini')}</div></div>
</div></div>
<p class=mut>Waktu dalam menit. Waktu proses dibagi kapasitas mesin; "setup" ditambahkan di tiap operasi.</p>
<div class=two id=side><div class=card><h3>Dynamic Events</h3>${[['breakdown','Machine breakdown'],['material','Material delay'],['urgent','New urgent order'],['absence','Operator absence'],['deviation','Processing time deviation']].map(([k,l])=>ck(`model.events.${k}`,m.events[k],l)).join('')}</div>
<div class=card><h3>Optimization Objectives</h3>${[['tardiness','Minimize total tardiness'],['disruption','Minimize schedule disruption'],['setup','Minimize setup/changeover cost'],['utilization','Maximize machine utilization'],['makespan','Minimize makespan']].map(([k,l])=>ck(`model.objectives.${k}`,m.objectives[k],l)).join('')}
<label>Estimasi job per periode ${inp('model.est_jobs',m.est_jobs,1)}</label></div></div>
<p><button id=btnToVal onclick="adv(2)">Lanjut ke validasi</button></p>`},
()=>`<div class=card><h2>Validasi model</h2><p class=mut>Cek apakah model bisa dijadwalkan sebelum benchmark.</p><button id=btnValidate onclick="doVal()">Validasi sekarang</button><div id=valout></div></div>`,
()=>`<div class=card><h2>Benchmark</h2><p class=mut>Membuat jadwal awal, lalu menyuntikkan tiap gangguan yang Anda pilih pada 30% waktu produksi. Klik baris untuk melihat Gantt-nya.</p><button id=btnBench onclick="doBench()">Jalankan benchmark</button><div id=bench></div></div>`,
()=>`<div class=card><h2>Pricing</h2><p class=mut>Harga dihitung dari konfigurasi Anda, bukan per panggilan API.</p><div id=pricebox>Menghitung…</div><p><button id=btnPrice onclick="doPrice()">Hitung ulang</button> <button id=btnToPay onclick="adv(5)">Lanjut ke pembayaran</button></p></div>`,
()=>`<div class=card><h2>Pembayaran</h2><p class=mut>Simulasi: tidak ada uang yang ditagih.</p>${['Virtual Account','QRIS','Kartu kredit'].map((x,i)=>`<label class=ck><input type=radio name=pay ${i?'':'checked'}>${x}</label>`).join('')}
<p><button id=btnPay onclick="adv(6)">Bayar (simulasi)</button></p></div>`,
()=>`<div class=card><h2>Kredensial API</h2><p class=mut>Kunci dibuat setelah pembayaran berhasil. Simpan, jangan dibagikan.</p><button id=btnKey onclick="doKey()">Buat API key</button><pre id=keybox>${S.key||'(belum dibuat)'}</pre>
<button class=ghost onclick="if(S.key)adv(7)">Lanjut ke integrasi</button></div>`,
()=>`<div class=card><h2>Integrasi</h2><p class=mut>Kirim model, jadwal berjalan, dan kejadian. API membalas jadwal baru dengan gangguan seminimal mungkin.</p>
<pre id=code>curl -X POST ${location.origin}/api/v1/reschedule \\\n  -H "X-API-Key: ${S.key||'KUNCI_ANDA'}" -H "Content-Type: application/json" \\\n  -d '{"model": {...}, "schedule": [...], "event": {"type":"breakdown","machine":"${S.model.machines[0]?.id||'M1'}","at":60,"duration":90}}'</pre>
<button id=btnTry onclick="doTry()">Coba panggil API sekarang</button><pre id=tryout>(hasil muncul di sini)</pre></div>`];
/* ===== Drag & drop ala Scratch ===== */
let DR=null;
const uid=(p,a)=>{let n=a.length+1;while(a.some(x=>x.id==p+n))n++;return p+n};
function addNode(t){const m=S.model;
 if(t=='Mesin')m.machines.push({id:uid('M',m.machines),type:'Cutting',capacity:1,shift:8});
 else if(t=='Job')m.jobs.push({id:uid('J',m.jobs),priority:2,due:300,ops:[]});
 else if(!m.jobs.length)return alert('Buat blok Job dulu.');
 else if(t=='Operasi')m.jobs[m.jobs.length-1].ops.push(op(m.machines[0]?.type||'Cutting',30));
 else m.materials.push({job:m.jobs[0].id,name:'Bahan baru',available:0});
 save();render()}
function drag(e,d){DR=d;e.dataTransfer.setData('text/plain','x');e.dataTransfer.effectAllowed='move';const b=e.target.closest('.blk,.cb');if(b)e.dataTransfer.setDragImage(b,12,12)}
function ov(e){e.preventDefault();e.stopPropagation();e.currentTarget.classList.add('over')}
function lv(e){e.currentTarget.classList.remove('over')}
function insIdx(e){const bs=[...e.currentTarget.querySelectorAll(':scope>.blk')];for(let i=0;i<bs.length;i++){const r=bs[i].getBoundingClientRect();if(e.clientY<r.top+r.height/2)return i}return bs.length}
function renJob(i,v){v=v.trim();const m=S.model,old=m.jobs[i].id;if(!v||m.jobs.some((j,x)=>x!=i&&j.id==v)){alert('ID job harus unik dan tidak kosong.');return render()}
 m.materials.forEach(x=>{if(x.job==old)x.job=v});m.jobs[i].id=v;save();render()}
function dp(e,z,a){e.preventDefault();e.stopPropagation();e.currentTarget.classList.remove('over');const d=DR,m=S.model;DR=null;if(!d)return;
 if(z=='machine'&&d.kind=='new'&&d.t=='Mesin')return addNode('Mesin');
 if(z=='job'&&d.kind=='new'&&d.t=='Job')return addNode('Job');
 if(z=='op'){let k=insIdx(e);const job=m.jobs[a];
  if(d.kind=='new'&&d.t=='Operasi')job.ops.splice(k,0,op(m.machines[0]?.type||'Cutting',30));
  else if(d.kind=='op'){const[o]=m.jobs[d.j].ops.splice(d.k,1);if(d.j==a&&d.k<k)k--;job.ops.splice(k,0,o)}else return}
 else if(z=='mat'){if(d.kind=='new'&&d.t=='Material')m.materials.push({job:m.jobs[a].id,name:'Bahan baru',available:0});else if(d.kind=='mat')m.materials[d.i].job=m.jobs[a].id;else return}
 else if(z=='trash'){if(d.kind=='machine')m.machines.splice(d.i,1);
  else if(d.kind=='job'){const id=m.jobs[d.i].id;m.jobs.splice(d.i,1);m.materials=m.materials.filter(x=>x.job!=id)}
  else if(d.kind=='op')m.jobs[d.j].ops.splice(d.k,1);else if(d.kind=='mat')m.materials.splice(d.i,1);else return}
 else return;
 save();render()}
async function doVal(){const r=await api('/api/validate',S.model);$('#valout').innerHTML=r.errors.map(e=>`<p class=err>✕ ${e}</p>`).join('')+r.warnings.map(e=>`<p class=warn>! ${e}</p>`).join('')+
 (r.errors.length?'<p>Perbaiki dulu di langkah 2.</p>':`<p class=okc>✓ Model valid.</p><button id=btnToBench onclick="adv(3)">Lanjut ke benchmark</button>`)}
function gantt(s,down,t0){const M=S.model.machines,H=34,W=860,L=40,mk=Math.max(...s.map(o=>o.end),...down.map(d=>d[2]),1),k=(W-L)/mk,ids=S.model.jobs.map(j=>j.id);
 let g=`<svg class=gantt viewBox="0 0 ${W+10} ${M.length*H+24}"><defs><pattern id=hat width=6 height=6 patternUnits=userSpaceOnUse patternTransform=rotate(45)><rect width=6 height=6 fill="#f3d3da"/><rect width=2 height=6 fill="#B0314F"/></pattern></defs>`;
 M.forEach((m,i)=>g+=`<text x=0 y=${i*H+22}>${m.id}</text><line x1=${L} x2=${W} y1=${i*H+H} y2=${i*H+H} stroke=#C3CFD5 />`);
 down.forEach(d=>{const i=M.findIndex(m=>m.id==d[0]);g+=`<rect x=${L+d[1]*k} y=${i*H+3} width=${(d[2]-d[1])*k} height=${H-8} fill="url(#hat)"><title>Mesin tidak tersedia</title></rect>`});
 s.forEach(o=>{const i=M.findIndex(m=>m.id==o.machine),c=COL[ids.indexOf(o.job)<0?6:ids.indexOf(o.job)%7];g+=`<rect x=${L+o.start*k} y=${i*H+5} width=${Math.max(2,(o.end-o.start)*k-1)} height=${H-12} fill=${c} rx=3><title>${o.job} op${o.op+1}: ${o.start}-${o.end}</title></rect><text x=${L+o.start*k+3} y=${i*H+22} fill=#fff>${o.job}</text>`});
 if(t0)g+=`<line x1=${L+t0*k} x2=${L+t0*k} y1=0 y2=${M.length*H} stroke=#E8A200 stroke-width=2 stroke-dasharray=4 /><text x=${L+t0*k+3} y=${M.length*H+16}>gangguan</text>`;
 for(let t=0;t<=mk;t+=Math.ceil(mk/10/10)*10)g+=`<text x=${L+t*k} y=${M.length*H+16}>${t}</text>`;return g+'</svg>'}
async function doBench(){$('#bench').innerHTML='Menghitung…';const r=await api('/api/benchmark',S.model);if(r.error)return $('#bench').innerHTML=`<p class=err>${r.error}</p>`;S.res.rows=r.rows;
 $('#bench').innerHTML=`<table><tr><th>Skenario<th>Makespan<th>Tardiness<th>Stability<th>Stability (reschedule total)<th>Utilization<th>Speed</tr>${r.rows.map((x,i)=>{const m=x.metrics;return`<tr class="pick ${i?'':'sel'}" onclick="pickRow(${i},this)"><td>${x.event}<td>${m.makespan}<td>${m.tardiness}<td>${Math.round(m.stability*100)}%<td>${x.naive==null?'-':Math.round(x.naive*100)+'%'}<td>${Math.round(m.utilization*100)}%<td>${m.speed_ms} ms</tr>`}).join('')}</table>
 <p class=mut>Stability = persen operasi yang tidak berubah. Kolom "reschedule total" memperlihatkan jika semua jadwal dihitung ulang dari nol.</p><div id=gantt>${gantt(r.rows[0].schedule,[],0)}</div><button id=btnToPrice onclick="adv(4)">Lanjut ke pricing</button>`}
function pickRow(i,el){document.querySelectorAll('tr.pick').forEach(t=>t.classList.remove('sel'));el.classList.add('sel');const x=S.res.rows[i];$('#gantt').innerHTML=gantt(x.schedule,x.down,x.t0)}
async function doPrice(){S.res.price=1;const r=await api('/api/pricing',S.model);$('#pricebox').innerHTML=`<table>${r.items.map(([a,b])=>`<tr><td>${a}<td>${rup(b)}</tr>`).join('')}</table><p class=big>${rup(r.total)}<small class=mut> / bulan</small></p>
 <p class=mut>Free sandbox: maks. ${r.sandbox.machines} mesin, ${r.sandbox.jobs} job, ${r.sandbox.requests} permintaan, tanpa biaya.</p>`}
async function doKey(){const r=await api('/api/credentials',{});S.key=r.key;save();$('#keybox').textContent=r.key}
async function doTry(){if(!S.key)return alert('Buat API key dulu di langkah 7.');const base=await api('/api/benchmark',S.model),sch=base.rows[0].schedule;
 const r=await api('/api/v1/reschedule',{model:S.model,schedule:sch,event:{type:'breakdown',machine:S.model.machines[0].id,at:60,duration:90}},{'X-API-Key':S.key});
 $('#tryout').textContent=r.error?r.error:JSON.stringify(r.metrics,null,2)+`\n(${r.schedule.length} operasi dijadwalkan)`}
const TOUR=[{go:0,s:'#nav',t:'Alur 8 langkah',x:'Menu kiri adalah urutan penggunaan: register, bangun model, validasi, benchmark, pricing, bayar, ambil kredensial, integrasi. Langkah baru terbuka setelah langkah sebelumnya selesai.'},
{go:0,s:'#btnReg',t:'1. Register',x:'Isi nama perusahaan, lalu klik "Buat akun & mulai".'},
{go:1,s:'#palette',t:'2. Ambil blok',x:'Seret blok Mesin, Job, Operasi, atau Material dari sini ke kanvas. Klik blok juga bisa. Seret ke kotak merah untuk menghapus.'},
{go:1,s:'#canvas',t:'Susun model',x:'Mesin masuk ke Lantai produksi. Job berbentuk blok C: seret Operasi ke dalamnya, urutan dari atas ke bawah adalah routing. Material diseret ke slot di bawah operasi. Isi angka langsung di dalam blok.'},
{go:1,s:'#side',t:'Gangguan & tujuan',x:'Centang jenis gangguan yang ingin didukung dan tujuan optimasi. Keduanya ikut menentukan harga.'},
{go:1,s:'#btnToVal',t:'Lanjut',x:'Klik "Lanjut ke validasi" jika konfigurasi sudah sesuai.'},
{go:2,s:'#btnValidate',t:'3. Validasi',x:'Klik "Validasi sekarang". Error harus diperbaiki, peringatan boleh diabaikan.'},
{go:3,s:'#btnBench',t:'4. Benchmark',x:'Klik "Jalankan benchmark" untuk melihat Makespan, Tardiness, Stability, Utilization, dan Speed. Klik tiap baris untuk melihat Gantt-nya.'},
{go:4,s:'#pricebox',t:'5. Pricing',x:'Rincian harga bulanan dari konfigurasi Anda. Free sandbox tersedia untuk mencoba.'},
{go:5,s:'#btnPay',t:'6. Pembayaran',x:'Pilih metode lalu klik "Bayar (simulasi)".'},
{go:6,s:'#btnKey',t:'7. Kredensial',x:'Klik "Buat API key", lalu salin kuncinya.'},
{go:7,s:'#btnTry',t:'8. Integrasi',x:'Salin contoh curl di atas ke sistem Anda, atau klik "Coba panggil API sekarang" untuk melihat hasilnya langsung.'}];
function tour(i){const T=$('#tour');if(i<0||i>=TOUR.length){T.hidden=true;localStorage.rstour=1;return}const t=TOUR[i];T.hidden=false;if(S.step!=t.go){S.step=t.go;S.max=Math.max(S.max,t.go);render()}
 const el=$(t.s);el.scrollIntoView({block:'center'});setTimeout(()=>{const r=el.getBoundingClientRect(),h=$('#hl'),p=$('#tip');Object.assign(h.style,{left:r.left-6+'px',top:r.top-6+'px',width:r.width+12+'px',height:r.height+12+'px'});
 p.innerHTML=`<b>${t.t}</b><p>${t.x}</p><div class=nv><span class=mut>${i+1} / ${TOUR.length}</span>${i?`<button class=ghost onclick="tour(${i-1})">Kembali</button>`:''}<button onclick="tour(${i+1})">${i==TOUR.length-1?'Selesai':'Lanjut'}</button><button class=ghost onclick="tour(99)">Tutup</button></div>`;
 const below=r.bottom+10+p.offsetHeight<innerHeight;p.style.top=(below?r.bottom+12:Math.max(8,r.top-p.offsetHeight-12))+'px';p.style.left=Math.min(Math.max(8,r.left),innerWidth-340)+'px'},80)}
render();if(!localStorage.rstour)tour(0);
/* ===== Pembayaran lengkap + struk + API key otomatis ===== */
const PM={va:'Virtual Account',qris:'QRIS',card:'Kartu kredit/debit'},BANKS=['BCA','BNI','BRI','Mandiri'];
let PAY={method:'va',bank:'BCA',tx:null,total:0,busy:false};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const grp=s=>String(s).replace(/(\d{4})(?=\d)/g,'$1 ');
const ovl=h=>{let o=$('#ov');if(!o){o=document.createElement('div');o.id='ov';document.body.appendChild(o)}o.innerHTML=h};
const payErr=m=>{const e=$('#payerr');if(e)e.textContent=m};
function fmtCard(el){el.value=grp(el.value.replace(/\D/g,'').slice(0,19))}
function fmtExp(el){const v=el.value.replace(/\D/g,'').slice(0,4);el.value=v.length>2?v.slice(0,2)+'/'+v.slice(2):v}
function cardVals(){return{number:$('#cn')?.value||'',holder:$('#ch')?.value||'',exp:$('#ce')?.value||'',cvv:$('#cc')?.value||''}}
function qrSvg(seed){let h=0;for(const c of seed)h=(h*31+c.charCodeAt(0))>>>0;const r=()=>(h=(h*1664525+1013904223)>>>0)/4294967296,N=29,z=6;
 let s=`<svg viewBox="0 0 ${N*z+24} ${N*z+24}" width=210 role=img aria-label="QRIS simulasi"><rect width=100% height=100% fill=#fff />`;
 for(let y=0;y<N;y++)for(let x=0;x<N;x++){let on;
  if((x<8&&y<8)||(x>=N-8&&y<8)||(x<8&&y>=N-8)){const ox=x<8?0:N-7,oy=y<8?0:N-7,lx=x-ox,ly=y-oy;
   on=lx>=0&&lx<=6&&ly>=0&&ly<=6&&(lx==0||lx==6||ly==0||ly==6||(lx>=2&&lx<=4&&ly>=2&&ly<=4))}else on=r()>.5;
  if(on)s+=`<rect x=${12+x*z} y=${12+y*z} width=${z} height=${z} fill=#14232B />`}
 return s+'</svg>'}
function payForm(){const m=PAY.method,t=PAY.tx;
 if(m=='va'&&t)return`<div class=instr><p>Transfer tepat sesuai nominal ke Virtual Account <b>${esc(t.detail.bank)}</b>:</p><p class=big>${grp(t.detail.va)}</p><p>Jumlah: <b>${rup(t.total)}</b>, berlaku 24 jam.</p>
 <ol><li>Buka m-banking atau ATM ${esc(t.detail.bank)}.</li><li>Pilih Transfer, lalu Virtual Account.</li><li>Masukkan nomor di atas dan konfirmasi.</li></ol><button id=btnPay onclick="confirmPay()">Simulasikan: saya sudah transfer</button></div>`;
 if(m=='qris'&&t)return`<div class=instr><p>Scan dengan GoPay, OVO, DANA, ShopeePay, atau m-banking apa pun:</p>${qrSvg(t.id)}<p>Jumlah: <b>${rup(t.total)}</b><br><span class=mut>QR ini simulasi, bukan QR asli.</span></p><button id=btnPay onclick="confirmPay()">Simulasikan: scan & bayar</button></div>`;
 if(m=='va')return`<label style="max-width:240px;display:block">Bank ${`<select onchange="PAY.bank=this.value">${BANKS.map(b=>`<option ${b==PAY.bank?'selected':''}>${b}</option>`).join('')}</select>`}</label><p><button id=btnPay onclick="startPay()">Buat nomor Virtual Account</button></p>`;
 if(m=='qris')return`<p><button id=btnPay onclick="startPay()">Tampilkan QRIS</button></p>`;
 return`<div class=cardf><label class=full>Nomor kartu<input id=cn inputmode=numeric autocomplete=off placeholder="4242 4242 4242 4242" oninput="fmtCard(this)"></label>
 <label class=full>Nama pemegang kartu<input id=ch autocomplete=off placeholder="NAMA DI KARTU"></label>
 <label>Berlaku s.d.<input id=ce inputmode=numeric placeholder="MM/YY" oninput="fmtExp(this)"></label><label>CVV<input id=cc type=password inputmode=numeric maxlength=4 autocomplete=off placeholder="123"></label></div>
 <p class=mut>Kartu uji: 4242 4242 4242 4242, masa berlaku bebas asal belum lewat, CVV 123.</p><p><button id=btnPay onclick="startPay()">Bayar ${PAY.total?rup(PAY.total):''}</button></p>`}
V[5]=()=>{if(S.receipt)return`<div class=card id=paybox><h2>Pembayaran selesai</h2><p>Tagihan ${esc(S.receipt.ref)} sudah lunas. API key Anda sudah dibuat otomatis.</p><button onclick="showReceipt()">Lihat struk</button> <button class=ghost onclick="adv(6)">Lihat API key</button></div>`;
 setTimeout(loadPay,0);
 return`<div class=card id=paybox><h2>Pembayaran</h2><p class=mut>Simulasi: tidak ada uang yang ditagih, dan nomor kartu maupun CVV tidak disimpan.</p><div id=paysum class=mut>Menghitung tagihan…</div>
 <div class=pm>${Object.entries(PM).map(([k,l])=>`<label class="pmo ${PAY.method==k?'on':''}"><input type=radio name=pay ${PAY.method==k?'checked':''} onchange="pickPay('${k}')">${l}</label>`).join('')}</div>
 <div id=payform>${payForm()}</div><p id=payerr class=err role=alert></p></div>`};
function pickPay(k){PAY.method=k;PAY.tx=null;render()}
async function loadPay(){if(S.receipt||!$('#paysum'))return;const r=await api('/api/pricing',S.model),tax=Math.round(r.total*.11);PAY.total=r.total+tax;
 $('#paysum').innerHTML=`Tagihan ${rup(r.total)} + PPN 11% ${rup(tax)} = <b>${rup(r.total+tax)}</b> per bulan`;const b=$('#btnPay');if(b&&PAY.method=='card')b.textContent='Bayar '+rup(PAY.total)}
async function startPay(){const m=PAY.method;if(m=='card'){const c=cardVals();if(!c.number||!c.holder||!c.exp||!c.cvv)return payErr('Lengkapi semua data kartu.')}
 payErr('');const t=await api('/api/pay/init',{model:S.model,method:m,bank:PAY.bank,customer:S.name});if(t.error)return payErr(t.error);
 PAY.tx=t;if(m=='card')return confirmPay();$('#payform').innerHTML=payForm()}
async function confirmPay(){if(PAY.busy)return;PAY.busy=true;
 const msg={va:'Menunggu konfirmasi bank…',qris:'Memverifikasi pembayaran QRIS…',card:'Memproses kartu (3-D Secure)…'}[PAY.method];
 ovl(`<div class=proc role=status><div class=spin></div><b>${msg}</b></div>`);
 const body={id:PAY.tx.id};if(PAY.method=='card')body.card=cardVals();
 const[r]=await Promise.all([api('/api/pay/confirm',body),new Promise(f=>setTimeout(f,1600))]);PAY.busy=false;
 if(r.error){$('#ov')?.remove();return payErr(r.error)}
 S.receipt=r.receipt;S.key=r.key;S.max=Math.max(S.max,6);save();showReceipt()}
function showReceipt(){const r=S.receipt,L=(a,b)=>`<div class=rl><span>${a}</span><span>${esc(b)}</span></div>`,d=r.detail;
 const det=r.method=='va'?L('Bank',d.bank)+L('No. VA',grp(d.va)):r.method=='qris'?L('Merchant',d.merchant)+L('NMID',d.nmid)+L('RRN',d.rrn):L('Kartu',`${d.brand} •••• ${d.last4}`)+L('Pemegang',d.holder)+L('Kode otorisasi',d.auth);
 ovl(`<div style="width:100%"><div class=printer></div><div class=paper><div class=rcp role=dialog aria-label="Struk pembayaran"><div class=rh>RESCHEDULE STUDIO<small>Struk pembayaran (SIMULASI)</small></div><div class=stamp>LUNAS</div><hr>
 ${L('No. Ref',r.ref)}${L('Waktu',r.paid_at)}${L('Pelanggan',r.customer||'-')}${L('Metode',PM[r.method])}${det}<hr>
 ${r.items.filter(i=>i[1]>0).map(i=>L(i[0],rup(i[1]))).join('')}<hr>${L('Subtotal',rup(r.subtotal))}${L('PPN 11%',rup(r.tax))}<div class="rl tot"><span>TOTAL</span><span>${rup(r.total)}</span></div><hr>
 <div>API key Anda (dibuat otomatis):</div><div class=keyb>${esc(S.key)}</div>
 <div class=rbtn><button onclick="copyKey()">Salin API key</button><button onclick="$('#ov').remove();adv(6)">Lanjut</button><button class=ghost onclick="$('#ov').remove();render()">Tutup</button></div></div></div></div>`)}
function copyKey(){navigator.clipboard?.writeText(S.key).then(()=>alert('API key disalin.')).catch(()=>alert('Salin manual dari kotak hitam.'))}
V[6]=()=>S.key?`<div class=card id=keybox><h2>Kredensial API</h2><p class=mut>Dibuat otomatis setelah pembayaran ${esc(S.receipt?.ref||'')} lunas. Simpan, jangan dibagikan.</p><pre id=keytxt>${esc(S.key)}</pre>
 <button onclick="copyKey()">Salin API key</button> <button class=ghost onclick="showReceipt()">Lihat struk</button> <button onclick="adv(7)">Lanjut ke integrasi</button></div>`
 :`<div class=card id=keybox><h2>Kredensial API</h2><p>API key dibuat otomatis setelah pembayaran berhasil. Selesaikan pembayaran di langkah 6 dulu.</p><button onclick="S.step=5;render()">Ke pembayaran</button></div>`;
Object.assign(TOUR[9],{s:'#paybox',x:'Pilih Virtual Account, QRIS, atau kartu, lalu ikuti petunjuknya. Setelah lunas, struk muncul dan API key dibuat otomatis.'});
Object.assign(TOUR[10],{s:'#keybox',x:'API key muncul di sini secara otomatis setelah pembayaran lunas. Salin dan simpan.'});