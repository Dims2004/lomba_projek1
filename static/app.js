/* ReSchedule Studio: halaman auth terpisah + editor ala draw.io */
const $=s=>document.querySelector(s);
const api=(u,b,h={})=>fetch(u,{method:'POST',headers:{'Content-Type':'application/json',...h},body:JSON.stringify(b)}).then(r=>r.json());
const uid=()=>Math.random().toString(36).slice(2,9);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rup=n=>'Rp '+n.toLocaleString('id-ID'),grp=s=>String(s).replace(/(\d{4})(?=\d)/g,'$1 ');
const TYPES=['Cutting','Welding','Painting','Assembly'],COL=['#0F6E8C','#C2571A','#5B8C2A','#7A4FB0','#B0314F','#2F7F6F','#8A6D00'];
const TCOL={Cutting:'#0F6E8C',Welding:'#C2571A',Painting:'#5B8C2A',Assembly:'#7A4FB0'};
const EVN={breakdown:'Machine breakdown',material:'Material delay',urgent:'New urgent order',absence:'Operator absence',deviation:'Processing time deviation'};
const OBN={tardiness:'Minimize total tardiness',disruption:'Minimize schedule disruption',setup:'Minimize setup/changeover cost',utilization:'Maximize machine utilization',makespan:'Minimize makespan'};
let S=null,H={u:[],r:[]},lastD={},itm;

/* ===== akun & routing (halaman terpisah) ===== */
const U=()=>JSON.parse(localStorage.rs_users||'[]'),setU=a=>localStorage.rs_users=JSON.stringify(a),user=()=>U().find(x=>x.email==localStorage.rs_sess);
const hash=async(e,p)=>{const d=e+'|'+p;try{return[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(d)))].map(b=>b.toString(16).padStart(2,'0')).join('')}catch(_){return btoa(d)}};
const ROUTES={'/masuk':pLogin,'/daftar':pRegister,'/perusahaan':pCompany,'/app':pApp};
function nav(p,rep){history[rep?'replaceState':'pushState'](0,'','/'+p.replace(/^\//,''));route()}
function route(){const p=location.pathname.replace(/\/$/,'')||'/',u=user();
 if(!ROUTES[p])return nav(u?(u.company?'/app':'/perusahaan'):'/masuk',1);
 if((p=='/masuk'||p=='/daftar')&&u)return nav(u.company?'/app':'/perusahaan',1);
 if(p=='/perusahaan'&&!u)return nav('/masuk',1);
 if(p=='/app'&&(!u||!u.company))return nav(u?'/perusahaan':'/masuk',1);
 document.body.className=p=='/app'?'dark':'light';ROUTES[p]()}
addEventListener('popstate',route);
const fld=(id,l,t='text',x='')=>`<div class=ff><input id=${id} type=${t} placeholder=" " ${x}><label for=${id}>${l} *</label></div>`;
const pwf=(id,l,x='')=>`<div class=ff><input id=${id} type=password placeholder=" " ${x}><label for=${id}>${l} *</label><button type=button class=eye onclick="const i=this.parentNode.querySelector('input');i.type=i.type=='password'?'text':'password'">👁</button></div>`;
const sf=(id,l,o)=>`<div class=ff><select id=${id}><option value="" hidden></option>${o.map(x=>`<option>${esc(x)}</option>`).join('')}</select><label>${l} *</label></div>`;
const link=(h,t)=>`<a href="${h}" onclick="nav('${h}');return false">${t}</a>`;
function pLogin(){$('#root').innerHTML=`<div class=auth><div class=acard><div class=brand>ReSchedule Studio</div><h1>Masuk</h1><p class=sub>Belum punya akun? ${link('/daftar','Daftar di sini')}</p>
${fld('le','Email Kerja','email','autocomplete=username')}${pwf('lp','Password','autocomplete=current-password')}<p id=err class=err role=alert></p><button id=go class=btnp>Masuk</button></div></div>`;
 $('#go').onclick=async()=>{const e=$('#le').value.trim().toLowerCase(),h=await hash(e,$('#lp').value),u=U().find(x=>x.email==e&&x.hash==h);if(!u)return $('#err').textContent='Email atau password salah.';localStorage.rs_sess=e;nav(u.company?'/app':'/perusahaan')};
 $('#lp').onkeydown=e=>{if(e.key=='Enter')$('#go').click()}}
function pRegister(){$('#root').innerHTML=`<div class=auth><div class=acard><div class=brand>ReSchedule Studio</div><h1>Daftar Akun</h1><p class=sub>Sudah punya akun ReSchedule Studio? ${link('/masuk','Masuk di sini')}</p>
${fld('rn','Nama Lengkap')}<div class="ff ph"><span class=cc><i class=flag></i>+62</span><input id=rh type=tel inputmode=numeric placeholder=" "><label for=rh>Nomor HP *</label></div>${fld('re','Email Kerja','email')}${pwf('rp','Password')}
${sf('rr','Daftar Sebagai',['Owner','Manajer Produksi','Planner / PPIC','Staf IT','Lainnya'])}
<label class=agree><input type=checkbox id=ra><span>Dengan ini saya telah memahami dan menyetujui <a href="#" onclick="return false">Syarat Ketentuan &amp; Kebijakan Privasi</a> yang berlaku.</span></label>
<p id=err class=err role=alert></p><button id=go class=btnp disabled>Daftar Sekarang</button></div></div>`;
 const ids=['rn','rh','re','rp','rr'],chk=()=>$('#go').disabled=!(ids.every(i=>$('#'+i).value.trim())&&$('#ra').checked);
 [...ids,'ra'].forEach(i=>{$('#'+i).oninput=$('#'+i).onchange=chk});
 $('#go').onclick=async()=>{const e=$('#re').value.trim().toLowerCase(),hp=$('#rh').value.replace(/\D/g,'').replace(/^0/,''),er=$('#err');
  if(!/^\S+@\S+\.\S+$/.test(e))return er.textContent='Format email tidak valid.';if(hp.length<8||hp.length>13)return er.textContent='Nomor HP harus 8-13 digit.';
  if($('#rp').value.length<6)return er.textContent='Password minimal 6 karakter.';if(U().some(x=>x.email==e))return er.textContent='Email ini sudah terdaftar. Silakan masuk.';
  setU([...U(),{email:e,hash:await hash(e,$('#rp').value),nama:$('#rn').value.trim(),hp:'+62'+hp,peran:$('#rr').value}]);localStorage.rs_sess=e;nav('/perusahaan')}}
const PROV={'DKI Jakarta':['Jakarta Pusat','Jakarta Barat','Jakarta Selatan','Jakarta Timur','Jakarta Utara'],'Jawa Barat':['Bandung','Bekasi','Bogor','Depok','Karawang','Cirebon'],'Jawa Tengah':['Semarang','Surakarta','Magelang','Kudus','Tegal'],'Jawa Timur':['Surabaya','Sidoarjo','Gresik','Malang','Pasuruan','Mojokerto'],'Banten':['Tangerang','Tangerang Selatan','Serang','Cilegon'],'DI Yogyakarta':['Yogyakarta','Sleman','Bantul'],'Bali':['Denpasar','Badung','Gianyar'],'Sumatera Utara':['Medan','Deli Serdang','Binjai'],'Kalimantan Timur':['Samarinda','Balikpapan','Kutai Kartanegara'],'Sulawesi Selatan':['Makassar','Gowa','Maros']};
function pCompany(){const BID=['Makanan & Minuman','Tekstil & Garmen','Otomotif & Komponen','Logam & Fabrikasi','Elektronik','Kimia & Plastik','Lainnya'];
 $('#root').innerHTML=`<div class=auth><div class=acard><div class=brand>ReSchedule Studio</div><h1>Data Perusahaan</h1><p class=sub>Silakan isi data perusahaan kamu dengan lengkap.</p>
<h3>Identitas Perusahaan</h3>${fld('cn','Nama Perusahaan')}<div class=two>${sf('cb','Pilih Bidang Usaha',BID)}<div class=ff><input id=cl placeholder=" " disabled><label for=cl>Bidang Usaha Lainnya</label></div></div>
<h3>Alamat Perusahaan</h3><div class=ff><textarea id=ca placeholder=" "></textarea><label for=ca>Alamat lengkap *</label></div>
<div class=two>${sf('cp','Pilih Provinsi',Object.keys(PROV))}<div class=ff><select id=ck disabled><option value="" hidden></option></select><label>Pilih Kabupaten/Kota *</label></div></div>
<div class=ff><input id=cz placeholder=" " inputmode=numeric maxlength=5><label for=cz>Kode Pos</label></div>
<h3>Zona Waktu Perusahaan</h3>${sf('ct','Pilih Zona Waktu',['WIB (UTC+7)','WITA (UTC+8)','WIT (UTC+9)'])}
<p id=err class=err role=alert></p><button id=go class=btnp disabled>Lanjutkan →</button></div></div>`;
 const req=['cn','cb','ca','cp','ck','ct'],chk=()=>$('#go').disabled=!(req.every(i=>$('#'+i).value.trim())&&($('#cb').value!='Lainnya'||$('#cl').value.trim()));
 $('#cb').onchange=()=>{$('#cl').disabled=$('#cb').value!='Lainnya';chk()};
 $('#cp').onchange=()=>{const k=$('#ck');k.innerHTML='<option value="" hidden></option>'+PROV[$('#cp').value].map(c=>`<option>${c}</option>`).join('');k.disabled=false;chk()};
 [...req,'cl'].forEach(i=>$('#'+i).oninput=chk);$('#ck').onchange=$('#ct').onchange=chk;
 $('#go').onclick=()=>{const u=user(),us=U(),x=us.find(a=>a.email==u.email);x.company={nama:$('#cn').value.trim(),bidang:$('#cb').value=='Lainnya'?$('#cl').value.trim():$('#cb').value,alamat:$('#ca').value.trim(),prov:$('#cp').value,kota:$('#ck').value,pos:$('#cz').value,tz:$('#ct').value};setU(us);nav('/app')}}
function logout(){localStorage.removeItem('rs_sess');S=null;nav('/masuk')}

/* ===== state & model ===== */
const SK=()=>'rsv2:'+localStorage.rs_sess,save=()=>{if(S&&localStorage.rs_sess)localStorage[SK()]=JSON.stringify({d:S.d,max:S.max,key:S.key,receipt:S.receipt,fav:S.fav})};
const CFG0=()=>({grid:true,gs:10,page:true,conn:true,zoom:1,pw:1400,ph:900,est:100,days:6,start:'07:00',hol:'',es:'arrow',er:'straight'});
const ROLE={mesin:{shape:'rect',w:150,h:64,c:'#0F6E8C',l:'Mesin'},job:{shape:'rounded',w:170,h:70,c:'#C2571A',l:'Job'},material:{shape:'parallelogram',w:160,h:60,c:'#7A4FB0',l:'Material'},event:{shape:'diamond',w:150,h:90,c:'#B0314F',l:'Gangguan'},objective:{shape:'hexagon',w:170,h:70,c:'#2F7F6F',l:'Tujuan'}};
const nid=(p,r)=>{let i=1;while(S.d.nodes.some(n=>n.role==r&&n.p.id==p+i))i++;return p+i};
const DEF={mesin:()=>({id:nid('M','mesin'),type:'Cutting',capacity:1,shift:8,shifts:1}),job:()=>({id:nid('J','job'),priority:2,due:300,ops:[{type:'Cutting',time:30,setup:0}]}),material:()=>({name:'Bahan baru',qty:1,available:0,lead:0}),event:()=>({t:'breakdown'}),objective:()=>({t:'tardiness'})};
function demoD(){const nodes=[],edges=[],mk=(role,x,y,p)=>{const R=ROLE[role],n={id:uid(),shape:R.shape,role,w:R.w,h:R.h,x,y,p};nodes.push(n);return n};
 const ops=(...a)=>a.map(([type,time,setup=0])=>({type,time,setup}));
 const jn=[['J1',3,200,ops(['Cutting',30,5],['Welding',40,5],['Painting',25])],['J2',2,260,ops(['Cutting',45,5],['Welding',30],['Painting',30])],['J3',5,180,ops(['Cutting',20],['Welding',50,5])],['J4',1,320,ops(['Cutting',35],['Painting',40])],['J5',3,280,ops(['Welding',45],['Painting',20,5])]].map(([id,priority,due,o],i)=>mk('job',320,60+i*110,{id,priority,due,ops:o}));
 [['M1','Cutting',1],['M2','Cutting',1.2],['M3','Welding',1],['M4','Painting',1]].forEach(([id,type,capacity],i)=>mk('mesin',640,60+i*110,{id,type,capacity,shift:8,shifts:1}));
 const mt=mk('material',40,170,{name:'Baja plat',qty:1,available:20,lead:0});edges.push({id:uid(),from:mt.id,to:jn[1].id,style:'arrow',route:'straight'});
 ['breakdown','material','urgent','deviation'].forEach((t,i)=>mk('event',930,60+i*110,{t}));['tardiness','disruption','utilization','makespan'].forEach((t,i)=>mk('objective',1170,60+i*110,{t}));
 nodes.push({id:uid(),shape:'text',w:240,h:30,x:40,y:20,text:'Lini Produksi A',fill:'none'});return{nodes,edges}}
function loadS(){let s;try{s=JSON.parse(localStorage[SK()])}catch(e){}S=Object.assign({max:1,key:'',receipt:null,fav:[]},s||{});if(!S.d)S.d={title:'Model Produksi',cfg:CFG0(),...demoD()};S.tab=0;S.sel=S.se=null;S.ft='diag';S.res={};S.n=0}
const NN=id=>S.d.nodes.find(n=>n.id==id),SELN=()=>S.sel&&NN(S.sel),SELE=()=>S.se&&S.d.edges.find(e=>e.id==S.se);
const jobOf=n=>{for(const e of S.d.edges){const o=e.from==n.id?e.to:e.to==n.id?e.from:null,j=o&&NN(o);if(j&&j.role=='job')return j}};
function M(){const d=S.d,c=d.cfg,m={est_jobs:c.est,machines:[],jobs:[],materials:[],events:{breakdown:false,material:false,urgent:false,absence:false,deviation:false},objectives:{tardiness:false,disruption:false,setup:false,utilization:false,makespan:false},calendar:{days:c.days,start:c.start,holidays:c.hol}};
 d.nodes.forEach(n=>{const p=n.p;if(n.role=='mesin')m.machines.push({id:p.id,type:p.type,capacity:+p.capacity,shift:+p.shift,shifts:+p.shifts});else if(n.role=='job')m.jobs.push({id:p.id,priority:+p.priority,due:+p.due,ops:p.ops.map(o=>({type:o.type,time:+o.time,setup:+o.setup}))});
  else if(n.role=='material')m.materials.push({job:jobOf(n)?.p.id||'',name:p.name,qty:+p.qty,available:+p.available,lead:+p.lead});else if(n.role=='event')m.events[p.t]=true;else if(n.role=='objective')m.objectives[p.t]=true});return m}
const MM=()=>S.model=M();
function commit(){const j=JSON.stringify(S.d);if(H.u[H.u.length-1]!==j){H.u.push(j);if(H.u.length>60)H.u.shift();H.r=[]}save();info()}
function undo(){if(H.u.length<2)return;H.r.push(H.u.pop());S.d=JSON.parse(H.u[H.u.length-1]);S.sel=S.se=null;save();paint();drawFmt()}
function redo(){const j=H.r.pop();if(!j)return;H.u.push(j);S.d=JSON.parse(j);S.sel=S.se=null;save();paint();drawFmt()}

/* ===== bentuk ===== */
const PL=p=>`<polygon points="${p}"/>`;
const SHP={rect:()=>'<rect width="100" height="100"/>',square:()=>SHP.rect(),rounded:(w,h)=>`<rect width="100" height="100" rx="${1400/w}" ry="${1400/h}"/>`,text:()=>'',ellipse:()=>'<ellipse cx="50" cy="50" rx="50" ry="50"/>',circle:()=>SHP.ellipse(),
 process:()=>'<rect width="100" height="100"/><path d="M12 0V100M88 0V100"/>',diamond:()=>PL('50,0 100,50 50,100 0,50'),parallelogram:()=>PL('20,0 100,0 80,100 0,100'),hexagon:()=>PL('25,0 75,0 100,50 75,100 25,100 0,50'),triangle:()=>PL('50,0 100,100 0,100'),
 cylinder:()=>'<path d="M0 12V88A50 12 0 0 0 100 88V12"/><ellipse cx="50" cy="12" rx="50" ry="12"/>',cloud:()=>'<path d="M25 80C5 80 0 55 20 50C10 30 35 15 50 28C62 10 92 20 88 42C108 48 100 80 78 80Z"/>',document:()=>'<path d="M0 0H100V85C80 70 70 100 50 88C30 76 20 100 0 85Z"/>',step:()=>PL('0,0 75,0 100,50 75,100 0,100 25,50'),
 trapezoid:()=>PL('20,0 80,0 100,100 0,100'),plus:()=>PL('35,0 65,0 65,35 100,35 100,65 65,65 65,100 35,100 35,65 0,65 0,35 35,35'),pentagon:()=>PL('50,0 100,38 82,100 18,100 0,38'),arrowr:()=>PL('0,25 60,25 60,0 100,50 60,100 60,75 0,75')};
const SH=[['rect','Persegi panjang',120,60],['rounded','Persegi membulat',120,60],['text','Teks',100,30],['process','Proses',120,60],['ellipse','Elips',120,70],['square','Persegi',70,70],['circle','Lingkaran',70,70],['diamond','Belah ketupat',100,80],['parallelogram','Jajar genjang',120,60],['hexagon','Segi enam',120,70],['triangle','Segitiga',80,70],['cylinder','Silinder',70,90],['cloud','Awan',120,70],['document','Dokumen',100,70],['step','Langkah',120,60]];
const SX=[['trapezoid','Trapesium',120,60],['plus','Plus',70,70],['pentagon','Segi lima',80,80],['arrowr','Panah blok',120,60]];
const CN=[['arrow','Panah','<path d="M8 50H78"/><path d="M68 38L92 50L68 62z" fill="currentColor"/>'],['line','Garis','<path d="M8 50H92"/>'],['dashed','Panah putus-putus','<path d="M8 50H78" stroke-dasharray="9 7"/><path d="M68 38L92 50L68 62z" fill="currentColor"/>'],['both','Dua arah','<path d="M20 50H80"/><path d="M70 38L94 50L70 62z M30 38L6 50L30 62z" fill="currentColor"/>']];
const ico=s=>`<svg viewBox="0 0 100 100" preserveAspectRatio="none" fill="none" stroke="currentColor" stroke-width="1.6">${s=='text'?'<text x="50" y="64" font-size="40" text-anchor="middle" fill="currentColor" stroke="none">Teks</text>':SHP[s](36,22)}</svg>`;
const item=t=>{const[k,v]=t.split(':'),r=k=='r',lab=r?ROLE[v].l:(SH.concat(SX).find(a=>a[0]==v)||[0,v])[1];return`<div class="si${r?' ri':''}" ${r?`style="color:${ROLE[v].c}"`:''} draggable="true" title="${lab}" ondragstart="event.dataTransfer.setData('text/plain','${t}')" onclick="${r?`addRole('${v}')`:`addShape('${v}')`}">${ico(r?ROLE[v].shape:v)}${r?`<span>${lab}</span>`:''}</div>`};
function drawShapes(){const es=S.d.cfg.es;$('#shapes').innerHTML=`<div class=scr id=scr ondragover="event.preventDefault()" ondrop="favAdd(event)">${S.fav.length?`<div class=sg>${S.fav.map(item).join('')}</div>`:'Seret elemen ke sini'}</div>
<details open><summary>Umum</summary><div class=sg>${SH.map(a=>item('s:'+a[0])).join('')}</div></details>
<details open><summary>Produksi</summary><div class=rl>${Object.keys(ROLE).map(r=>item('r:'+r)).join('')}</div></details>
<details open><summary>Konektor</summary><div class=sg>${CN.map(([k,t,s])=>`<div class="si${es==k?' on':''}" title="${t}" onclick="setEs('${k}')"><svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="5">${s}</svg></div>`).join('')}</div></details>
<details open><summary>Lain-lain</summary><button class=blue onclick="S.more=!S.more;drawShapes()">+ Bentuk Lainnya</button>${S.more?`<div class=sg style="margin-top:8px">${SX.map(a=>item('s:'+a[0])).join('')}</div>`:''}</details>`}
function favAdd(e){e.preventDefault();const t=e.dataTransfer.getData('text/plain');if(t&&!S.fav.includes(t)){S.fav.push(t);save();drawShapes()}}
const sn=v=>S.d.cfg.grid?Math.round(v/S.d.cfg.gs)*S.d.cfg.gs:Math.round(v);
function put(n,x,y){const c=S.d.cfg,cv=$('#cv');if(x==null){x=cv.scrollLeft/c.zoom+60+(S.n%8)*28;y=cv.scrollTop/c.zoom+50+(S.n++%8)*28}else{x-=n.w/2;y-=n.h/2}
 n.id=uid();n.x=Math.max(0,sn(x));n.y=Math.max(0,sn(y));S.d.nodes.push(n);S.sel=n.id;S.se=null;S.ft='prop';commit();paint();drawFmt()}
function addShape(k,x,y){const d=SH.concat(SX).find(a=>a[0]==k);if(d)put({shape:k,w:d[2],h:d[3],text:k=='text'?'Teks':'',...(k=='text'?{fill:'none'}:{})},x,y)}
function addRole(r,x,y){const R=ROLE[r];put({shape:R.shape,role:r,w:R.w,h:R.h,p:DEF[r]()},x,y)}

/* ===== kanvas ===== */
const fillOf=n=>n.fill||(n.role=='mesin'?TCOL[n.p.type]:n.role?ROLE[n.role].c:'#2b2b30');
function label(n){const p=n.p;if(!n.role)return esc(n.text||'').replace(/\n/g,'<br>');
 if(n.role=='mesin')return`<b>${esc(p.id)}</b>${esc(p.type)} · kap ${p.capacity}`;if(n.role=='job')return`<b>${esc(p.id)} · P${p.priority}</b>${p.ops.length} operasi · due ${p.due}`;
 if(n.role=='material')return`<b>${esc(p.name)}</b>→ ${esc(jobOf(n)?.p.id||'hubungkan ke Job')}`;return`<b>${esc((n.role=='event'?EVN:OBN)[p.t])}</b>`}
function nodeH(n){const sel=S.sel==n.id,t=n.shape=='text',f=t?'none':fillOf(n);
 return`<div class="nd${sel?' sel':''}" data-n="${n.id}" style="left:${n.x}px;top:${n.y}px;width:${n.w}px;height:${n.h}px"><svg class=sh viewBox="0 0 100 100" preserveAspectRatio="none" fill="${n.fill=='none'?'none':f}" stroke="${t&&!n.stroke?'none':n.stroke||'#9aa0a6'}" stroke-width="${n.sw||2}">${SHP[n.shape](n.w,n.h)}</svg><div class=tx style="color:${n.tc||'#fff'}">${label(n)}</div>${sel?['nw','ne','sw','se'].map(k=>`<i class=hd data-h=${k}></i>`).join(''):''}${S.d.cfg.conn?['t','r','b','l'].map(k=>`<b class=cp data-c=${k}>×</b>`).join(''):''}</div>`}
function ep(e){const a=NN(e.from),b=NN(e.to);if(!a||!b)return'';const ca=[a.x+a.w/2,a.y+a.h/2],cb=[b.x+b.w/2,b.y+b.h/2];
 if(e.route=='elbow'){const r=cb[0]>ca[0],x1=r?a.x+a.w:a.x,x2=r?b.x:b.x+b.w,xm=(x1+x2)/2;return`M${x1} ${ca[1]}H${xm}V${cb[1]}H${x2}`}
 const cl=(n,t)=>{const cx=n.x+n.w/2,cy=n.y+n.h/2,dx=t[0]-cx,dy=t[1]-cy;if(!dx&&!dy)return[cx,cy];const s=Math.min(n.w/2/Math.abs(dx||1e-9),n.h/2/Math.abs(dy||1e-9));return[cx+dx*s,cy+dy*s]},p=cl(a,cb),q=cl(b,ca);return`M${p[0]} ${p[1]}L${q[0]} ${q[1]}`}
function edgeH(e){const d=ep(e);if(!d)return'';const sel=S.se==e.id,c=sel?'#4da3ff':e.color||'#9aa0a6',st=e.style||'arrow',m='m'+e.id;
 return`<marker id="${m}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${c}"/></marker><path d="${d}" fill="none" stroke="${c}" stroke-width="${sel?3:2}" ${st=='dashed'?'stroke-dasharray="7 5"':''} ${st!='line'?`marker-end="url(#${m})"`:''} ${st=='both'?`marker-start="url(#${m})"`:''}/><path data-e="${e.id}" d="${d}" fill="none" stroke="transparent" stroke-width="14" style="pointer-events:stroke;cursor:pointer"/>`}
function paint(){const c=S.d.cfg,z=c.zoom,pg=$('#page');if(!pg)return;$('#pgw').style.cssText=`width:${c.pw*z}px;height:${c.ph*z}px`;
 pg.style.cssText=`width:${c.pw}px;height:${c.ph}px;transform:scale(${z});`+(c.grid?`background-image:linear-gradient(#ffffff22 1px,transparent 1px),linear-gradient(90deg,#ffffff22 1px,transparent 1px),linear-gradient(#ffffff0e 1px,transparent 1px),linear-gradient(90deg,#ffffff0e 1px,transparent 1px);background-size:${c.gs*8}px ${c.gs*8}px,${c.gs*8}px ${c.gs*8}px,${c.gs}px ${c.gs}px,${c.gs}px ${c.gs}px`:'');
 pg.className='pg'+(c.page?'':' nopg');pg.innerHTML=`<svg id=esv>${S.d.edges.map(edgeH).join('')}</svg>`+[...S.d.nodes].sort((a,b)=>(a.z||0)-(b.z||0)).map(nodeH).join('')}
const P=e=>{const r=$('#page').getBoundingClientRect(),z=S.d.cfg.zoom;return[(e.clientX-r.left)/z,(e.clientY-r.top)/z]};
function select(n,e){S.sel=n;S.se=e;S.ft=n||e?'prop':'diag';paint();drawFmt()}
function bindPage(){const pg=$('#page');pg.onpointerdown=e=>{if(e.button||e.target.isContentEditable)return;const t=e.target,h=t.closest('[data-h]'),c=t.closest('[data-c]'),nd=t.closest('.nd'),ed=t.closest('[data-e]');
  if(c&&nd){e.preventDefault();return linkStart(e,nd.dataset.n,c.dataset.c)}if(h&&nd){e.preventDefault();return resizeStart(nd.dataset.n,h.dataset.h)}
  if(nd){e.preventDefault();const id=nd.dataset.n,now=Date.now();if(lastD.id==id&&now-lastD.t<400&&!NN(id).role){lastD={};return editText(id)}lastD={id,t:now};select(id,null);return moveStart(e,id)}
  if(ed)return select(null,ed.dataset.e);select(null,null)};
 pg.ondragover=e=>e.preventDefault();pg.ondrop=e=>{e.preventDefault();const t=e.dataTransfer.getData('text/plain'),p=P(e);if(t.startsWith('s:'))addShape(t.slice(2),p[0],p[1]);else if(t.startsWith('r:')&&ROLE[t.slice(2)])addRole(t.slice(2),p[0],p[1])}}
function drag(m,u){const U2=ev=>{removeEventListener('pointermove',m);removeEventListener('pointerup',U2);u(ev)};addEventListener('pointermove',m);addEventListener('pointerup',U2)}
function moveStart(e,id){const n=NN(id),p0=P(e),x0=n.x,y0=n.y;let mv=false;drag(ev=>{const p=P(ev);if(!mv&&Math.hypot(p[0]-p0[0],p[1]-p0[1])<3)return;mv=true;n.x=Math.max(0,sn(x0+p[0]-p0[0]));n.y=Math.max(0,sn(y0+p[1]-p0[1]));paint()},()=>{if(mv)commit()})}
function resizeStart(id,k){const n=NN(id),b={x:n.x,y:n.y,w:n.w,h:n.h};drag(ev=>{const p=P(ev);let x=b.x,y=b.y,r=b.x+b.w,bt=b.y+b.h;if(k[1]=='w')x=Math.min(sn(p[0]),r-30);else r=Math.max(sn(p[0]),x+30);if(k[0]=='n')y=Math.min(sn(p[1]),bt-20);else bt=Math.max(sn(p[1]),y+20);Object.assign(n,{x,y,w:r-x,h:bt-y});paint()},()=>commit())}
function linkStart(e,id,side){const a=NN(id),esv=$('#esv'),t=document.createElementNS('http://www.w3.org/2000/svg','path');[['stroke','#4da3ff'],['stroke-width','2'],['stroke-dasharray','5'],['fill','none']].forEach(x=>t.setAttribute(...x));esv.appendChild(t);
 const ax=a.x+(side=='l'?0:side=='r'?a.w:a.w/2),ay=a.y+(side=='t'?0:side=='b'?a.h:a.h/2);
 drag(ev=>{const p=P(ev);t.setAttribute('d',`M${ax} ${ay}L${p[0]} ${p[1]}`)},ev=>{t.remove();const el=document.elementFromPoint(ev.clientX,ev.clientY)?.closest('.nd'),b=el&&el.dataset.n;
  if(b&&b!=id&&!S.d.edges.some(x=>x.from==id&&x.to==b)){S.d.edges.push({id:uid(),from:id,to:b,style:S.d.cfg.es,route:S.d.cfg.er});commit();paint();drawFmt()}})}
function editText(id){const el=$(`.nd[data-n="${id}"] .tx`),n=NN(id);if(!el)return;el.contentEditable=true;el.style.pointerEvents='auto';el.innerText=n.text||'';el.focus();document.getSelection().selectAllChildren(el);
 const done=ok=>{el.onblur=el.onkeydown=null;if(ok)n.text=el.innerText.trim();commit();paint();drawFmt()};el.onblur=()=>done(1);el.onkeydown=ev=>{if(ev.key=='Enter'&&!ev.shiftKey){ev.preventDefault();el.blur()}if(ev.key=='Escape'){el.onblur=null;done(0)}}}
function del(){if(S.sel){const id=S.sel;S.d.nodes=S.d.nodes.filter(n=>n.id!=id);S.d.edges=S.d.edges.filter(e=>e.from!=id&&e.to!=id)}else if(S.se)S.d.edges=S.d.edges.filter(e=>e.id!=S.se);else return;S.sel=S.se=null;S.ft='diag';commit();paint();drawFmt()}
function dup(){const n=SELN();if(!n)return;const c=JSON.parse(JSON.stringify(n));c.id=uid();c.x+=20;c.y+=20;if(c.role=='mesin')c.p.id=nid('M','mesin');if(c.role=='job')c.p.id=nid('J','job');S.d.nodes.push(c);S.sel=c.id;commit();paint();drawFmt()}
function zord(d){const n=SELN();if(!n)return;const z=S.d.nodes.map(x=>x.z||0);n.z=d>0?Math.max(...z)+1:Math.min(...z)-1;commit();paint()}
function flip(){const e=SELE();if(!e)return;[e.from,e.to]=[e.to,e.from];commit();paint();drawFmt()}
const ZL=[25,50,75,100,125,150,200,300];
function zoom(v){S.d.cfg.zoom=Math.min(3,Math.max(.25,v));drawTbar();paint()}
function zstep(d){const z=Math.round(S.d.cfg.zoom*100);let i=ZL.findIndex(v=>v>=z);if(i<0)i=ZL.length-1;if(ZL[i]!=z&&d<0)i--;else i+=ZL[i]==z?d:0;zoom(ZL[Math.min(ZL.length-1,Math.max(0,i))]/100)}
const tgl=s=>{$(s).hidden=!$(s).hidden};
function cfg(k,v){S.d.cfg[k]=v;commit();paint();drawFmt()}
function setEs(v){S.d.cfg.es=v;const e=SELE();if(e)e.style=v;commit();paint();drawShapes();drawTbar()}
function setEr(v){S.d.cfg.er=v;const e=SELE();if(e)e.route=v;commit();paint();drawTbar()}
function st(k,v){const n=SELN(),e=SELE();if(n)n[k]=v;else if(e&&k=='stroke')e.color=v;else return;paint()}
function np(id,k,v,num){NN(id).p[k]=num?+v:v;paint();info()}
function no(id,i,k,v,num){NN(id).p.ops[i][k]=num?+v:v;paint();info()}
function nt(id,v){NN(id).text=v;paint()}
function opm(id,k,d){const o=NN(id).p.ops,j=k+d;if(j<0||j>=o.length)return;[o[k],o[j]]=[o[j],o[k]];commit();paint();drawFmt()}
function opd(id,k){NN(id).p.ops.splice(k,1);commit();paint();drawFmt()}
function opa(id){NN(id).p.ops.push({type:TYPES[0],time:30,setup:0});commit();paint();drawFmt()}
function newD(){if(!confirm('Kosongkan seluruh diagram?'))return;S.d.nodes=[];S.d.edges=[];S.sel=S.se=null;commit();paint();drawFmt()}
function loadDemo(){if(S.d.nodes.length&&!confirm('Ganti diagram dengan contoh produksi?'))return;Object.assign(S.d,demoD());S.sel=S.se=null;commit();paint();drawFmt()}
function expJ(){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(M(),null,2)],{type:'application/json'}));a.download='model-produksi.json';a.click()}
function editData(){ovl(`<div class=dlg><h3>Data model (JSON)</h3><textarea readonly rows=18>${esc(JSON.stringify(M(),null,2))}</textarea><p><button class=b onclick="navigator.clipboard?.writeText($('.dlg textarea').value)">Salin</button> <button class=bg onclick="$('#ov').remove()">Tutup</button></p></div>`)}
function resetSty(){S.d.nodes.forEach(n=>{delete n.stroke;delete n.tc;delete n.sw;if(n.shape!='text')delete n.fill});commit();paint();drawFmt()}
function snapAll(){S.d.nodes.forEach(n=>{n.x=sn(n.x);n.y=sn(n.y)});commit();paint()}
const PAPER={'Lebar (1400×900)':[1400,900],'A4 Lanskap':[1123,794],'A4 Potret':[794,1123],'A3 Lanskap':[1587,1123]};

/* ===== panel format ===== */
const nm=n=>n?(n.role?(n.p.id||n.p.name||(EVN[n.p.t]||OBN[n.p.t])):(n.text||ROLE[n.shape]?.l||n.shape)):'?';
const ck=(k,v,l)=>`<label class=cb><input type=checkbox ${v?'checked':''} onchange="cfg('${k}',this.checked)">${l}</label>`;
const nf=(l,v,f,t='number')=>`<label class=pf>${l}<input type=${t} step=any value="${esc(v)}" onchange="${f}"></label>`;
const pf=(n,k,l,num)=>`<label class=pf>${l}<input ${num?'type=number step=any':''} value="${esc(n.p[k])}" oninput="np('${n.id}','${k}',this.value,${num?1:0})" onchange="commit()"></label>`;
const ps=(n,k,l,o)=>{const A=Array.isArray(o)?o.map(x=>[x,x]):Object.entries(o);return`<label class=pf>${l}<select onchange="np('${n.id}','${k}',this.value,0);commit();drawFmt()">${A.map(([v,t])=>`<option value="${v}" ${n.p[k]==v?'selected':''}>${esc(t)}</option>`).join('')}</select></label>`};
const of=(n,k,f,l)=>`<label class=pf>${l}<input type=number step=any value="${n.p.ops[k][f]}" oninput="no('${n.id}',${k},'${f}',this.value,1)" onchange="commit()"></label>`;
function checklist(){const m=M(),h=a=>Object.values(a).some(Boolean),L=[['Production Environment',m.machines.length>0],['Job Configuration',m.jobs.length>0],['Production Routing',m.jobs.length>0&&m.jobs.every(j=>j.ops.length&&j.ops.every(o=>m.machines.some(q=>q.type==o.type)))],['Material Configuration',m.materials.some(x=>x.job),1],['Dynamic Events',h(m.events)],['Optimization Objectives',h(m.objectives)]];
 return L.map(([n,ok,o])=>`<div class="ci ${ok?'ok':''}">${ok?'✓':'○'} ${n}${o&&!ok?' (opsional)':''}</div>`).join('')}
function info(){const el=$('#chk');if(el)el.innerHTML=checklist();clearTimeout(itm);itm=setTimeout(async()=>{const e=$('#est');if(!e||S.tab)return;try{const p=await api('/api/pricing',M());e.innerHTML=p.total?`Estimasi harga: <b>${rup(p.total)}</b> / bulan`:''}catch(_){}},500)}
function fDiag(){const c=S.d.cfg;return`<details open><summary>Lihat</summary><div class=ro>${ck('grid',c.grid,'Kisi')}<input class=sm type=number min=5 max=50 value=${c.gs} onchange="cfg('gs',Math.max(5,+this.value||10))"> pt</div>${ck('page',c.page,'Tampilan Halaman')}</details>
<details open><summary>Opsi</summary>${ck('conn',c.conn,'Titik Koneksi')}</details>
<details open><summary>Produksi</summary>${nf('Estimasi job per periode',c.est,"cfg('est',+this.value)")}${nf('Hari kerja per minggu',c.days,"cfg('days',+this.value)")}${nf('Jam mulai kerja',c.start,"cfg('start',this.value)",'text')}${nf('Hari libur',c.hol,"cfg('hol',this.value)",'text')}</details>
<details><summary>Ukuran Kertas</summary><select onchange="const p=PAPER[this.value];S.d.cfg.pw=p[0];S.d.cfg.ph=p[1];commit();paint()">${Object.keys(PAPER).map(k=>`<option ${PAPER[k][0]==c.pw&&PAPER[k][1]==c.ph?'selected':''}>${k}</option>`).join('')}</select></details>
<details open><summary>Kelengkapan model</summary><div id=chk></div><p id=est class=hint></p></details><button class=fb2 onclick="editData()">Sunting Data…</button><button class=fb2 onclick="resetSty()">Hapus Gaya Default</button>`}
function fProp(n,e){if(e){const a=NN(e.from),b=NN(e.to);return`<p class=hint>Koneksi: <b>${esc(nm(a))}</b> → <b>${esc(nm(b))}</b></p><p class=hint>Hubungkan Material ke Job agar kebutuhan bahannya terbaca.</p><button class=fb2 onclick="flip()">Balik arah</button><button class="fb2 dng" onclick="del()">Hapus koneksi</button>`}
 if(!n)return'<p class=hint>Pilih sebuah bentuk atau koneksi untuk mengedit propertinya.</p>';const r=n.role,p=n.p;let h='';
 if(!r)h=`<p class=hint>Bentuk umum (anotasi). Klik dua kali di kanvas untuk mengubah teks.</p><label class=pf>Teks<textarea rows=3 oninput="nt('${n.id}',this.value)" onchange="commit()">${esc(n.text||'')}</textarea></label>`;
 else if(r=='mesin')h=`<h4>Mesin · Production Environment</h4>${pf(n,'id','ID mesin')}${ps(n,'type','Jenis mesin',TYPES)}${pf(n,'capacity','Kapasitas (kecepatan relatif)',1)}${pf(n,'shift','Jam operasional per shift',1)}${pf(n,'shifts','Jumlah shift per hari',1)}`;
 else if(r=='job')h=`<h4>Job · Job & Routing</h4>${pf(n,'id','ID job')}${pf(n,'priority','Prioritas (1-5, 5 tertinggi)',1)}${pf(n,'due','Due date (menit)',1)}<h4>Routing (atas ke bawah)</h4>${p.ops.map((o,k)=>`<div class=opc><label class=pf>Operasi ${k+1}: jenis mesin<select onchange="no('${n.id}',${k},'type',this.value,0);commit()">${TYPES.map(t=>`<option ${o.type==t?'selected':''}>${t}</option>`).join('')}</select></label><div class=r2>${of(n,k,'time','Waktu proses')}${of(n,k,'setup','Setup')}</div><div class=r3><button onclick="opm('${n.id}',${k},-1)">↑</button><button onclick="opm('${n.id}',${k},1)">↓</button><button onclick="opd('${n.id}',${k})">Hapus</button></div></div>`).join('')}<button class=fb2 onclick="opa('${n.id}')">+ Tambah operasi</button>`;
 else if(r=='material')h=`<h4>Material · Material Configuration</h4>${pf(n,'name','Kebutuhan bahan baku')}${pf(n,'qty','Jumlah kebutuhan',1)}${pf(n,'available','Tersedia pada menit ke-',1)}${pf(n,'lead','Lead time (menit)',1)}<p class=hint>Dipakai oleh: <b>${esc(jobOf(n)?.p.id||'belum terhubung (tarik koneksi ke blok Job)')}</b></p>`;
 else h=`<h4>${r=='event'?'Gangguan · Dynamic Events':'Tujuan · Optimization Objectives'}</h4>${ps(n,'t',r=='event'?'Jenis gangguan':'Tujuan optimasi',r=='event'?EVN:OBN)}`;
 return h+`<button class="fb2 dng" onclick="del()">Hapus bentuk</button>`}
function fSty(n,e){const cp=(l,v,k)=>`<label class=pf>${l}<input type=color value="${v}" oninput="st('${k}',this.value)" onchange="commit()"></label>`;
 if(n)return cp('Warna isi',/^#/.test(fillOf(n))?fillOf(n):'#2b2b30','fill')+cp('Warna garis',n.stroke||'#9aa0a6','stroke')+cp('Warna teks',n.tc||'#ffffff','tc')+nf('Tebal garis',n.sw||2,"st('sw',+this.value);commit()");
 if(e)return cp('Warna garis',e.color||'#9aa0a6','stroke')+`<label class=pf>Gaya<select onchange="setEs(this.value)">${CN.map(c=>`<option value=${c[0]} ${e.style==c[0]?'selected':''}>${c[1]}</option>`).join('')}</select></label><label class=pf>Rute<select onchange="setEr(this.value)"><option value=straight ${e.route!='elbow'?'selected':''}>Lurus</option><option value=elbow ${e.route=='elbow'?'selected':''}>Siku</option></select></label>`;
 return'<p class=hint>Pilih bentuk atau koneksi untuk mengubah gayanya.</p>'}
function drawFmt(){const t=S.ft,n=SELN(),e=SELE();$('#fmt').innerHTML=`<div class=ftabs>${[['diag','Diagram'],['prop','Properti'],['sty','Gaya']].map(([k,l])=>`<button class="${t==k?'on':''}" onclick="S.ft='${k}';drawFmt()">${l}</button>`).join('')}</div><div class=fb>${t=='diag'?fDiag():t=='prop'?fProp(n,e):fSty(n,e)}</div>`;if(t=='diag')info()}
function drawTbar(){const c=S.d.cfg,b=(t,f,tt)=>`<button class=tb title="${tt}" onclick="${f}">${t}</button>`,z=Math.round(c.zoom*100);
 $('#tbar').innerHTML=b('▤',"tgl('#shapes')",'Panel bentuk')+`<select class=tsel onchange="zoom(this.value/100)">${(ZL.includes(z)?ZL:[...ZL,z].sort((a,b)=>a-b)).map(v=>`<option value=${v} ${v==z?'selected':''}>${v}%</option>`).join('')}</select>`+b('⊕','zstep(1)','Perbesar')+b('⊖','zstep(-1)','Perkecil')+'<i class=vs></i>'+b('↶','undo()','Urungkan (Ctrl+Z)')+b('↷','redo()','Ulangi (Ctrl+Y)')+'<i class=vs></i>'+b('⌫','del()','Hapus')+b('⧉','dup()','Duplikat (Ctrl+D)')+b('⤒','zord(1)','Ke depan')+b('⤓','zord(-1)','Ke belakang')+'<i class=vs></i>'+
 `<label class=tc title="Warna isi">◧<input type=color value="#2b2b30" oninput="st('fill',this.value)" onchange="commit()"></label><label class=tc title="Warna garis">▭<input type=color value="#9aa0a6" oninput="st('stroke',this.value)" onchange="commit()"></label><i class=vs></i>`+
 `<select class=tsel title="Gaya koneksi" onchange="setEs(this.value)">${CN.map(x=>`<option value=${x[0]} ${c.es==x[0]?'selected':''}>${x[1]}</option>`).join('')}</select><select class=tsel title="Rute koneksi" onchange="setEr(this.value)"><option value=straight ${c.er!='elbow'?'selected':''}>Lurus</option><option value=elbow ${c.er=='elbow'?'selected':''}>Siku</option></select><div class=sp></div>`+b('⛶','document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen()','Layar penuh')+b('▥',"tgl('#fmt')",'Panel format')}

/* ===== menu bar ===== */
let MI=[];
const MENUS=()=>{const c=S.d.cfg;return{Berkas:[['Baru (kosongkan diagram)',newD],['Muat contoh produksi',loadDemo],['Ekspor model (JSON)',expJ],0,['Keluar',logout]],
 Sunting:[['Urungkan',undo,'Ctrl+Z'],['Ulangi',redo,'Ctrl+Y'],0,['Duplikat',dup,'Ctrl+D'],['Hapus',del,'Del']],
 Lihat:[[(c.grid?'✓ ':'')+'Kisi',()=>cfg('grid',!c.grid)],[(c.page?'✓ ':'')+'Tampilan halaman',()=>cfg('page',!c.page)],0,['Perbesar',()=>zstep(1)],['Perkecil',()=>zstep(-1)],['Ukuran sebenarnya',()=>zoom(1)],0,['Panel bentuk',()=>tgl('#shapes')],['Panel format',()=>tgl('#fmt')]],
 Susun:[['Ke depan',()=>zord(1)],['Ke belakang',()=>zord(-1)],0,['Rapikan ke kisi',snapAll]],
 Ekstra:[['Validasi model',()=>goTab(1)],['Jalankan benchmark',()=>goTab(2)],['Lihat pricing',()=>goTab(3)],['Pembayaran',()=>goTab(4)],['Kredensial API',()=>goTab(5)],['Integrasi',()=>goTab(6)]],
 Bantuan:[['Tutorial',()=>tour(0)],['Tentang',()=>alert('ReSchedule Studio: API penjadwalan ulang produksi (Dynamic Optimization & Real-Time Scheduling). Akun dan pembayaran bersifat simulasi.')]]}};
function menu(name,btn){closeMenu();if(btn.classList.contains('on'))return;btn.classList.add('on');MI=[];const r=btn.getBoundingClientRect(),d=document.createElement('div');d.id='dd';d.style.cssText=`left:${r.left}px;top:${r.bottom+2}px`;
 d.innerHTML=MENUS()[name].map(x=>{if(!x)return'<hr>';MI.push(x[1]);return`<div class=mi onclick="MI[${MI.length-1}]();closeMenu()"><span>${x[0]}</span><small>${x[2]||''}</small></div>`}).join('');document.body.appendChild(d)}
function closeMenu(){$('#dd')?.remove();document.querySelectorAll('.mb button.on').forEach(b=>b.classList.remove('on'))}
addEventListener('click',e=>{if(!e.target.closest('.mb')&&!e.target.closest('#dd'))closeMenu()});
addEventListener('keydown',e=>{if(location.pathname!='/app'||!S||S.tab)return;const t=e.target;if(/INPUT|SELECT|TEXTAREA/.test(t.tagName)||t.isContentEditable)return;const k=e.key.toLowerCase(),c=e.ctrlKey||e.metaKey;
 if(k=='delete'||k=='backspace'){e.preventDefault();del()}else if(c&&k=='z'){e.preventDefault();undo()}else if(c&&k=='y'){e.preventDefault();redo()}else if(c&&k=='d'){e.preventDefault();dup()}
 else if(k.startsWith('arrow')&&S.sel){e.preventDefault();const n=SELN(),g=S.d.cfg.grid?S.d.cfg.gs:1;n.x=Math.max(0,n.x+(k=='arrowright'?g:k=='arrowleft'?-g:0));n.y=Math.max(0,n.y+(k=='arrowdown'?g:k=='arrowup'?-g:0));paint();commit()}});

/* ===== shell aplikasi ===== */
const TABS=['Model Produksi','Validasi','Benchmark','Pricing','Pembayaran','Kredensial API','Integrasi'];
function pApp(){const u=user();loadS();H={u:[JSON.stringify(S.d)],r:[]};
 $('#root').innerHTML=`<div id=shell><div class=hdr><div class=logo>R</div><div><input id=ttl value="${esc(S.d.title)}" oninput="S.d.title=this.value;save()" aria-label="Judul diagram"><div class=mb id=mb>${['Berkas','Sunting','Lihat','Susun','Ekstra','Bantuan'].map(m=>`<button onclick="menu('${m}',this)">${m}</button>`).join('')}</div></div><div class=sp></div><span class=usr>${esc(u.nama)} · ${esc(u.company.nama)}</span><button class=blue onclick="logout()">Keluar</button></div>
<div class=tbar id=tbar></div><div class=bd id=bd><aside id=shapes></aside><main id=cv><div id=pgw><div id=page class=pg></div></div></main><main id=content></main><aside id=fmt></aside></div><div class=tabs id=tabs></div></div>`;
 bindPage();render();if(!localStorage.rstour2)setTimeout(()=>tour(0),400)}
function render(){const t=S.tab;$('#shell').dataset.m=t?'step':'model';drawTabs();
 if(!t){drawShapes();drawTbar();paint();drawFmt();return}
 $('#content').innerHTML='<div class=pgc>'+W[t]()+'</div>';if(t==3)setTimeout(doPrice,0);if(t==4)setTimeout(loadPay,0)}
function drawTabs(){$('#tabs').innerHTML=TABS.map((t,i)=>`<button class="tab${i==S.tab?' on':''}${i>S.max?' off':''}" onclick="goTab(${i})">${i+1}. ${t}</button>`).join('')+'<div class=sp></div><span class=mut>Simulasi · data tersimpan di browser</span>'}
function goTab(n){if(n>S.max)return alert('Selesaikan langkah sebelumnya dulu.');S.tab=n;render()}
function adv(n){S.max=Math.max(S.max,n);S.tab=n;save();render()}

/* ===== langkah 2-7 ===== */
const W=[null,
()=>`<div class=cd><h2>Validasi model</h2><p class=mut>Cek apakah model dari kanvas bisa dijadwalkan.</p><button id=btnValidate class=b onclick="doVal()">Validasi sekarang</button><div id=valout></div></div>`,
()=>`<div class=cd><h2>Benchmark</h2><p class=mut>Membuat jadwal awal, lalu menyuntikkan tiap gangguan yang Anda pilih pada 30% waktu produksi. Klik baris untuk melihat Gantt-nya.</p><button id=btnBench class=b onclick="doBench()">Jalankan benchmark</button><div id=bench></div></div>`,
()=>`<div class=cd><h2>Pricing</h2><p class=mut>Harga dihitung dari konfigurasi Anda, bukan per panggilan API.</p><div id=pricebox>Menghitung…</div><p><button id=btnPrice class=bg onclick="doPrice()">Hitung ulang</button> <button id=btnToPay class=b onclick="adv(4)">Lanjut ke pembayaran</button></p></div>`,
payPage,keyPage,intPage];
async function doVal(){const r=await api('/api/validate',MM());$('#valout').innerHTML=(r.errors||[]).map(e=>`<p class=err>✕ ${esc(e)}</p>`).join('')+(r.warnings||[]).map(e=>`<p class=warn>! ${esc(e)}</p>`).join('')+(r.error?`<p class=err>${esc(r.error)}</p>`:(r.errors.length?'<p>Perbaiki dulu di kanvas.</p><button class=bg onclick="goTab(0)">Kembali ke kanvas</button>':'<p class=okc>✓ Model valid.</p><button id=btnToBench class=b onclick="adv(2)">Lanjut ke benchmark</button>'))}
function gantt(s,down,t0){const M=S.model.machines,h=34,W=860,L=40,mk=Math.max(...s.map(o=>o.end),...down.map(d=>d[2]),1),k=(W-L)/mk,ids=S.model.jobs.map(j=>j.id);
 let g=`<svg class=gantt viewBox="0 0 ${W+10} ${M.length*h+24}"><defs><pattern id=hat width=6 height=6 patternUnits=userSpaceOnUse patternTransform=rotate(45)><rect width=6 height=6 fill="#4a2230"/><rect width=2 height=6 fill="#B0314F"/></pattern></defs>`;
 M.forEach((m,i)=>g+=`<text x=0 y=${i*h+22}>${esc(m.id)}</text><line x1=${L} x2=${W} y1=${i*h+h} y2=${i*h+h} stroke=#3a3a40 />`);
 down.forEach(d=>{const i=M.findIndex(m=>m.id==d[0]);g+=`<rect x=${L+d[1]*k} y=${i*h+3} width=${(d[2]-d[1])*k} height=${h-8} fill="url(#hat)"><title>Mesin tidak tersedia</title></rect>`});
 s.forEach(o=>{const i=M.findIndex(m=>m.id==o.machine),j=ids.indexOf(o.job),c=COL[j<0?6:j%7];g+=`<rect x=${L+o.start*k} y=${i*h+5} width=${Math.max(2,(o.end-o.start)*k-1)} height=${h-12} fill=${c} rx=3><title>${esc(o.job)} op${o.op+1}: ${o.start}-${o.end}</title></rect><text class=bl x=${L+o.start*k+3} y=${i*h+22}>${esc(o.job)}</text>`});
 if(t0)g+=`<line x1=${L+t0*k} x2=${L+t0*k} y1=0 y2=${M.length*h} stroke=#E8A200 stroke-width=2 stroke-dasharray=4 /><text x=${L+t0*k+3} y=${M.length*h+16}>gangguan</text>`;
 for(let t=0;t<=mk;t+=Math.ceil(mk/10/10)*10)g+=`<text x=${L+t*k} y=${M.length*h+16}>${t}</text>`;return g+'</svg>'}
async function doBench(){$('#bench').innerHTML='Menghitung…';MM();const r=await api('/api/benchmark',S.model);if(r.error)return $('#bench').innerHTML=`<p class=err>${esc(r.error)}</p>`;S.res.rows=r.rows;
 $('#bench').innerHTML=`<table><tr><th>Skenario<th>Makespan<th>Tardiness<th>Stability<th>Stability (reschedule total)<th>Utilization<th>Speed</tr>${r.rows.map((x,i)=>{const m=x.metrics;return`<tr class="pick ${i?'':'sel'}" onclick="pickRow(${i},this)"><td>${x.event}<td>${m.makespan}<td>${m.tardiness}<td>${Math.round(m.stability*100)}%<td>${x.naive==null?'-':Math.round(x.naive*100)+'%'}<td>${Math.round(m.utilization*100)}%<td>${m.speed_ms} ms</tr>`}).join('')}</table>
 <p class=mut>Stability = persen operasi yang tidak berubah. Kolom "reschedule total" memperlihatkan jika semua jadwal dihitung ulang dari nol.</p><div id=gantt>${gantt(r.rows[0].schedule,[],0)}</div><button id=btnToPrice class=b onclick="adv(3)">Lanjut ke pricing</button>`}
function pickRow(i,el){document.querySelectorAll('tr.pick').forEach(t=>t.classList.remove('sel'));el.classList.add('sel');const x=S.res.rows[i];$('#gantt').innerHTML=gantt(x.schedule,x.down,x.t0)}
async function doPrice(){const r=await api('/api/pricing',MM()),b=$('#pricebox');if(!b)return;if(r.error)return b.innerHTML=`<p class=err>${esc(r.error)}</p>`;b.innerHTML=`<table>${r.items.map(([a,v])=>`<tr><td>${a}<td>${rup(v)}</tr>`).join('')}</table><p class=big>${rup(r.total)}<small class=mut> / bulan</small></p><p class=mut>Free sandbox: maks. ${r.sandbox.machines} mesin, ${r.sandbox.jobs} job, ${r.sandbox.requests} permintaan, tanpa biaya.</p>`}
/* pembayaran */
const PM={va:'Virtual Account',qris:'QRIS',card:'Kartu kredit/debit'},BANKS=['BCA','BNI','BRI','Mandiri'];let PAY={method:'va',bank:'BCA',tx:null,total:0,busy:false};
const ovl=h=>{let o=$('#ov');if(!o){o=document.createElement('div');o.id='ov';document.body.appendChild(o)}o.innerHTML=h};
const payErr=m=>{const e=$('#payerr');if(e)e.textContent=m};
const fmtCard=el=>el.value=grp(el.value.replace(/\D/g,'').slice(0,19)),fmtExp=el=>{const v=el.value.replace(/\D/g,'').slice(0,4);el.value=v.length>2?v.slice(0,2)+'/'+v.slice(2):v};
const cardVals=()=>({number:$('#cn')?.value||'',holder:$('#ch')?.value||'',exp:$('#ce')?.value||'',cvv:$('#cc')?.value||''});
function qrSvg(seed){let h=0;for(const c of seed)h=(h*31+c.charCodeAt(0))>>>0;const r=()=>(h=(h*1664525+1013904223)>>>0)/4294967296,N=29,z=6;let s=`<svg viewBox="0 0 ${N*z+24} ${N*z+24}" width=210 role=img aria-label="QRIS simulasi"><rect width=100% height=100% fill=#fff />`;
 for(let y=0;y<N;y++)for(let x=0;x<N;x++){let on;if((x<8&&y<8)||(x>=N-8&&y<8)||(x<8&&y>=N-8)){const lx=x-(x<8?0:N-7),ly=y-(y<8?0:N-7);on=lx>=0&&lx<=6&&ly>=0&&ly<=6&&(lx==0||lx==6||ly==0||ly==6||(lx>=2&&lx<=4&&ly>=2&&ly<=4))}else on=r()>.5;if(on)s+=`<rect x=${12+x*z} y=${12+y*z} width=${z} height=${z} fill=#14232B />`}return s+'</svg>'}
function payForm(){const m=PAY.method,t=PAY.tx;
 if(m=='va'&&t)return`<div class=instr><p>Transfer tepat sesuai nominal ke Virtual Account <b>${esc(t.detail.bank)}</b>:</p><p class=big>${grp(t.detail.va)}</p><p>Jumlah: <b>${rup(t.total)}</b>, berlaku 24 jam.</p><ol><li>Buka m-banking atau ATM ${esc(t.detail.bank)}.</li><li>Pilih Transfer, lalu Virtual Account.</li><li>Masukkan nomor di atas dan konfirmasi.</li></ol><button id=btnPay class=b onclick="confirmPay()">Simulasikan: saya sudah transfer</button></div>`;
 if(m=='qris'&&t)return`<div class=instr><p>Scan dengan GoPay, OVO, DANA, ShopeePay, atau m-banking apa pun:</p>${qrSvg(t.id)}<p>Jumlah: <b>${rup(t.total)}</b><br><span class=mut>QR ini simulasi, bukan QR asli.</span></p><button id=btnPay class=b onclick="confirmPay()">Simulasikan: scan &amp; bayar</button></div>`;
 if(m=='va')return`<label class=pf style="max-width:240px">Bank<select onchange="PAY.bank=this.value">${BANKS.map(b=>`<option ${b==PAY.bank?'selected':''}>${b}</option>`).join('')}</select></label><p><button id=btnPay class=b onclick="startPay()">Buat nomor Virtual Account</button></p>`;
 if(m=='qris')return`<p><button id=btnPay class=b onclick="startPay()">Tampilkan QRIS</button></p>`;
 return`<div class=cardf><label class=full>Nomor kartu<input id=cn inputmode=numeric autocomplete=off placeholder="4242 4242 4242 4242" oninput="fmtCard(this)"></label><label class=full>Nama pemegang kartu<input id=ch autocomplete=off placeholder="NAMA DI KARTU"></label><label>Berlaku s.d.<input id=ce inputmode=numeric placeholder="MM/YY" oninput="fmtExp(this)"></label><label>CVV<input id=cc type=password inputmode=numeric maxlength=4 autocomplete=off placeholder="123"></label></div><p class=mut>Kartu uji: 4242 4242 4242 4242, masa berlaku bebas asal belum lewat, CVV 123.</p><p><button id=btnPay class=b onclick="startPay()">Bayar ${PAY.total?rup(PAY.total):''}</button></p>`}
function payPage(){if(S.receipt)return`<div class=cd id=paybox><h2>Pembayaran selesai</h2><p>Tagihan ${esc(S.receipt.ref)} sudah lunas. API key dibuat otomatis.</p><button class=b onclick="showReceipt()">Lihat struk</button> <button class=bg onclick="adv(5)">Lihat API key</button></div>`;
 return`<div class=cd id=paybox><h2>Pembayaran</h2><p class=mut>Simulasi: tidak ada uang yang ditagih, dan nomor kartu maupun CVV tidak disimpan.</p><div id=paysum class=mut>Menghitung tagihan…</div><div class=pm>${Object.entries(PM).map(([k,l])=>`<label class="pmo ${PAY.method==k?'on':''}"><input type=radio name=pay ${PAY.method==k?'checked':''} onchange="pickPay('${k}')">${l}</label>`).join('')}</div><div id=payform>${payForm()}</div><p id=payerr class=err role=alert></p></div>`}
function pickPay(k){PAY.method=k;PAY.tx=null;render()}
async function loadPay(){if(S.receipt||!$('#paysum'))return;const r=await api('/api/pricing',MM());if(r.error)return;const tax=Math.round(r.total*.11);PAY.total=r.total+tax;$('#paysum').innerHTML=`Tagihan ${rup(r.total)} + PPN 11% ${rup(tax)} = <b>${rup(r.total+tax)}</b> per bulan`;const b=$('#btnPay');if(b&&PAY.method=='card')b.textContent='Bayar '+rup(PAY.total)}
async function startPay(){const m=PAY.method;if(m=='card'){const c=cardVals();if(!c.number||!c.holder||!c.exp||!c.cvv)return payErr('Lengkapi semua data kartu.')}
 payErr('');let t;try{t=await api('/api/pay/init',{model:MM(),method:m,bank:PAY.bank,customer:user().company.nama})}catch(e){return payErr('Gagal menghubungi server. Coba lagi.')}
 if(t.error)return payErr(t.error);PAY.tx=t;if(m=='card')return confirmPay();$('#payform').innerHTML=payForm()}
async function confirmPay(){if(PAY.busy)return;PAY.busy=true;const msg={va:'Menunggu konfirmasi bank…',qris:'Memverifikasi pembayaran QRIS…',card:'Memproses kartu (3-D Secure)…'}[PAY.method];
 ovl(`<div class=proc role=status><div class=spin></div><b>${msg}</b></div>`);const body={token:PAY.tx.token};if(PAY.method=='card')body.card=cardVals();
 let r;try{[r]=await Promise.all([api('/api/pay/confirm',body),new Promise(f=>setTimeout(f,1600))])}catch(e){r={error:'Gagal menghubungi server. Coba lagi.'}}
 PAY.busy=false;if(r.error){$('#ov')?.remove();return payErr(r.error)}S.receipt=r.receipt;S.key=r.key;S.max=Math.max(S.max,5);save();showReceipt()}
function showReceipt(){const r=S.receipt,L=(a,b)=>`<div class=rl><span>${a}</span><span>${esc(b)}</span></div>`,d=r.detail;
 const det=r.method=='va'?L('Bank',d.bank)+L('No. VA',grp(d.va)):r.method=='qris'?L('Merchant',d.merchant)+L('NMID',d.nmid)+L('RRN',d.rrn):L('Kartu',`${d.brand} •••• ${d.last4}`)+L('Pemegang',d.holder)+L('Kode otorisasi',d.auth);
 ovl(`<div style="width:100%"><div class=printer></div><div class=paper><div class=rcp role=dialog aria-label="Struk pembayaran"><div class=rh>RESCHEDULE STUDIO<small>Struk pembayaran (SIMULASI)</small></div><div class=stamp>LUNAS</div><hr>${L('No. Ref',r.ref)}${L('Waktu',r.paid_at)}${L('Pelanggan',r.customer||'-')}${L('Metode',PM[r.method])}${det}<hr>
 ${r.items.filter(i=>i[1]>0).map(i=>L(i[0],rup(i[1]))).join('')}<hr>${L('Subtotal',rup(r.subtotal))}${L('PPN 11%',rup(r.tax))}<div class="rl tot"><span>TOTAL</span><span>${rup(r.total)}</span></div><hr><div>API key Anda (dibuat otomatis):</div><div class=keyb>${esc(S.key)}</div>
 <div class=rbtn><button onclick="copyKey()">Salin API key</button><button onclick="$('#ov').remove();adv(5)">Lanjut</button><button class=ghost onclick="$('#ov').remove();render()">Tutup</button></div></div></div></div>`)}
const copyKey=()=>navigator.clipboard?.writeText(S.key).then(()=>alert('API key disalin.')).catch(()=>alert('Salin manual dari kotak hitam.'));
function keyPage(){return S.key?`<div class=cd id=keybox><h2>Kredensial API</h2><p class=mut>Dibuat otomatis setelah pembayaran ${esc(S.receipt?.ref||'')} lunas. Simpan, jangan dibagikan.</p><pre>${esc(S.key)}</pre><button class=b onclick="copyKey()">Salin API key</button> <button class=bg onclick="showReceipt()">Lihat struk</button> <button class=b onclick="adv(6)">Lanjut ke integrasi</button></div>`
 :`<div class=cd id=keybox><h2>Kredensial API</h2><p>API key dibuat otomatis setelah pembayaran berhasil. Selesaikan pembayaran dulu.</p><button class=b onclick="goTab(4)">Ke pembayaran</button></div>`}
function intPage(){const m=M().machines[0]?.id||'M1';return`<div class=cd><h2>Integrasi</h2><p class=mut>Kirim model, jadwal berjalan, dan kejadian. API membalas jadwal baru dengan gangguan seminimal mungkin.</p><pre>curl -X POST ${location.origin}/api/v1/reschedule \\\n  -H "X-API-Key: ${esc(S.key||'KUNCI_ANDA')}" -H "Content-Type: application/json" \\\n  -d '{"model": {...}, "schedule": [...], "event": {"type":"breakdown","machine":"${esc(m)}","at":60,"duration":90}}'</pre>
<button id=btnTry class=b onclick="doTry()">Coba panggil API sekarang</button><pre id=tryout>(hasil muncul di sini)</pre></div>`}
async function doTry(){if(!S.key)return alert('Selesaikan pembayaran dulu untuk mendapat API key.');MM();const base=await api('/api/benchmark',S.model);if(base.error)return $('#tryout').textContent=base.error;
 const r=await api('/api/v1/reschedule',{model:S.model,schedule:base.rows[0].schedule,event:{type:'breakdown',machine:S.model.machines[0].id,at:60,duration:90}},{'X-API-Key':S.key});$('#tryout').textContent=r.error?r.error:JSON.stringify(r.metrics,null,2)+`\n(${r.schedule.length} operasi dijadwalkan)`}

/* ===== tutorial ===== */
const TOUR=[{go:0,s:'#mb',t:'Menu seperti draw.io',x:'Berkas, Sunting, Lihat, Susun, Ekstra, dan Bantuan. Menu Ekstra membuka langkah berikutnya (validasi, benchmark, pricing, dst).'},
{go:0,s:'#shapes',t:'Panel bentuk',x:'Bagian Umum berisi bentuk untuk anotasi. Bagian Produksi berisi Mesin, Job, Material, Gangguan, dan Tujuan yang dibaca oleh sistem. Seret ke kanvas atau klik.'},
{go:0,s:'#cv',t:'Kanvas',x:'Seret bentuk untuk memindah, tarik titik kotak di sudut untuk mengubah ukuran. Tarik tanda × di sisi bentuk ke bentuk lain untuk membuat koneksi. Hubungkan Material ke Job. Klik dua kali bentuk umum untuk mengubah teksnya.'},
{go:0,s:'#fmt',t:'Panel format',x:'Tab Diagram: kisi, kalender, dan kelengkapan 6 konfigurasi. Tab Properti: isi nilai bentuk terpilih. Tab Gaya: warna dan garis.'},
{go:0,s:'#tabs',t:'Halaman di bawah',x:'Tab di bawah adalah langkah-langkahnya: model, validasi, benchmark, pricing, pembayaran, kredensial, integrasi.'},
{go:1,s:'#btnValidate',t:'Validasi',x:'Klik "Validasi sekarang". Error harus diperbaiki di kanvas, peringatan boleh diabaikan.'},
{go:2,s:'#btnBench',t:'Benchmark',x:'Klik "Jalankan benchmark" untuk melihat Makespan, Tardiness, Stability, Utilization, dan Speed.'},
{go:3,s:'#pricebox',t:'Pricing',x:'Rincian harga bulanan dari konfigurasi Anda. Free sandbox tersedia untuk mencoba.'},
{go:4,s:'#paybox',t:'Pembayaran',x:'Pilih Virtual Account, QRIS, atau kartu. Setelah lunas, struk muncul dan API key dibuat otomatis.'},
{go:5,s:'#keybox',t:'Kredensial',x:'API key muncul otomatis di sini setelah pembayaran lunas.'},
{go:6,s:'#btnTry',t:'Integrasi',x:'Salin contoh curl ke sistem Anda, atau klik "Coba panggil API sekarang".'}];
function tour(i){const T=$('#tour');if(i<0||i>=TOUR.length){T.hidden=true;localStorage.rstour2=1;return}const t=TOUR[i];T.hidden=false;if(S.tab!=t.go){S.tab=t.go;render()}
 setTimeout(()=>{const el=$(t.s);if(!el)return;el.scrollIntoView?.({block:'nearest'});const r=el.getBoundingClientRect(),h=$('#hl'),p=$('#tip');Object.assign(h.style,{left:r.left-4+'px',top:r.top-4+'px',width:r.width+8+'px',height:r.height+8+'px'});
  p.innerHTML=`<b>${t.t}</b><p>${t.x}</p><div class=nv><span>${i+1} / ${TOUR.length}</span>${i?`<button class=bg onclick="tour(${i-1})">Kembali</button>`:''}<button class=b onclick="tour(${i+1})">${i==TOUR.length-1?'Selesai':'Lanjut'}</button><button class=bg onclick="tour(99)">Tutup</button></div>`;
  const below=r.bottom+14+p.offsetHeight<innerHeight;p.style.top=Math.max(8,below?r.bottom+12:r.top+Math.min(r.height,innerHeight)/2-p.offsetHeight/2)+'px';p.style.left=Math.min(Math.max(8,r.right>innerWidth-340?r.left-340:r.left+(below?0:r.width+12)),innerWidth-340)+'px'},80)}
route();
