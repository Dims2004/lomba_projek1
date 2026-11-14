/* ReSchedule Studio - pricing.js (dimuat SETELAH enhance.js)
   Harga per reschedule: tiap kali butuh jadwal ulang, beli lagi. 1 API key = 1x reschedule. */
(()=>{
const used=()=>!!S.key&&(!S.key.includes('.')||!!localStorage['rsu:'+S.key]);

window.newBuy=()=>{S.receipt=null;S.key='';PAY.tx=null;save();S.tab=3;render()};

info=function(){const el=$('#chk');if(el)el.innerHTML=checklist();clearTimeout(itm);
 itm=setTimeout(async()=>{const e=$('#est');if(!e||S.tab)return;try{const p=await api('/api/pricing',M());e.innerHTML=p.total?`Estimasi harga: <b>${rup(p.total)}</b> / reschedule`:''}catch(_){}},500)};

const _fd=fDiag;fDiag=()=>_fd().replace(/<label class=pf>Estimasi job per periode[\s\S]*?<\/label>/,'');

W[3]=()=>{const u=used();return`<div class=cd><h2>Pricing</h2><p class=mut>Harga dibayar per reschedule, bukan langganan bulanan. Setiap kali perusahaan butuh jadwal ulang (hari ini, minggu depan, dan seterusnya), beli 1 reschedule lagi. Harganya mengikuti isi model: makin banyak mesin, job, operasi, material, gangguan, dan tujuan, makin tinggi.</p><div id=pricebox>Menghitung…</div><p><button id=btnPrice class=bg onclick="doPrice()">Hitung ulang</button> <button id=btnToPay class=b onclick="${u?'newBuy()':'adv(4)'}">${u?'Beli reschedule baru':'Lanjut ke pembayaran'}</button></p></div>`};

doPrice=async function(){const r=await api('/api/pricing',MM()),b=$('#pricebox');if(!b)return;
 if(r.error)return b.innerHTML=`<p class=err>${esc(r.error)}</p>`;
 b.innerHTML=`<table>${r.items.map(([a,v])=>`<tr><td>${a}<td>${rup(v)}</tr>`).join('')}</table><p class=big>${rup(r.total)}<small class=mut> / reschedule</small></p><p class=mut>Belum termasuk PPN 11%. Satu pembayaran berlaku untuk satu kali reschedule. Free sandbox: maks. ${r.sandbox.machines} mesin, ${r.sandbox.jobs} job, ${r.sandbox.requests} permintaan, tanpa biaya.</p>`};

loadPay=async function(){if(S.receipt||!$('#paysum'))return;const r=await api('/api/pricing',MM());if(r.error)return;
 const tax=Math.round(r.total*.11);PAY.total=r.total+tax;
 $('#paysum').innerHTML=`Tagihan ${rup(r.total)} + PPN 11% ${rup(tax)} = <b>${rup(r.total+tax)}</b> untuk 1x reschedule`;
 const b=$('#btnPay');if(b&&PAY.method=='card')b.textContent='Bayar '+rup(PAY.total)};

const _kp=W[5];W[5]=()=>{const h=_kp();if(!S.key)return h;const u=used();
 return h.replace('</pre>',`</pre><p class="${u?'warn':'okc'}">${u?'Sudah terpakai (1x reschedule). Beli lagi untuk reschedule berikutnya.':'Siap dipakai: berlaku untuk 1x reschedule.'}</p>`)
  .replace(/<\/div>$/,(u?'<p><button class=b onclick="newBuy()">Beli reschedule baru</button></p>':'')+'</div>')};

const _ip=W[6];W[6]=()=>_ip().replace('Kirim model, jadwal berjalan, dan kejadian.','1 API key berlaku untuk 1x reschedule. Kirim model, jadwal berjalan, dan kejadian.');

doTry=async function(){const o=$('#tryout');
 if(!S.key)return alert('Selesaikan pembayaran dulu untuk mendapat API key.');
 if(used()){o.textContent='API key ini sudah dipakai untuk 1x reschedule.\nBeli reschedule baru di tab Pricing.';return}
 MM();const base=await api('/api/benchmark',S.model);if(base.error)return o.textContent=base.error;
 const r=await api('/api/v1/reschedule',{model:S.model,schedule:base.rows[0].schedule,event:{type:'breakdown',machine:S.model.machines[0].id,at:60,duration:90}},{'X-API-Key':S.key});
 if(r.error)return o.textContent=r.error;
 localStorage['rsu:'+S.key]=1;
 o.textContent=JSON.stringify(r.metrics,null,2)+`\n(${r.schedule.length} operasi dijadwalkan)\n\n1 reschedule sudah ditagihkan. API key ini tidak berlaku lagi. Untuk jadwal ulang berikutnya, beli reschedule baru di tab Pricing.`};

Object.assign(TOUR[7],{x:'Rincian harga per reschedule dari isi modelmu. Tiap kali butuh jadwal ulang, beli lagi. Free sandbox tersedia untuk mencoba.'});
Object.assign(TOUR[9],{x:'API key muncul otomatis setelah pembayaran lunas, dan berlaku untuk 1x reschedule.'});
})();
