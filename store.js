/* Capa de datos de la demo.
   En la demo todo se guarda en este navegador (localStorage), así la página y el panel
   comparten los turnos en el mismo dispositivo. En la versión real estas funciones
   pasan a leer y escribir en Supabase; el resto de la página no cambia. */
(function(){
const KEY="barberia_demo_v1";
const pad=n=>String(n).padStart(2,"0");
const ymd=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const addDays=(s,n)=>{const d=new Date(s+"T12:00:00");d.setDate(d.getDate()+n);return ymd(d);};
const toMin=hm=>{const[h,m]=hm.split(":").map(Number);return h*60+m;};
const toHM=m=>`${pad(Math.floor(m/60))}:${pad(m%60)}`;
const uid=()=>Math.random().toString(36).slice(2,10);
const today=()=>ymd(new Date());
const nowMin=()=>{const d=new Date();return d.getHours()*60+d.getMinutes();};

function seed(){
  const t=today();
  const s={
    config:{nombre:"Tu Barbería",whatsapp:"5493543626280",direccion:"San Martín 123, Córdoba",cancelHoras:2,slotMin:15,
      horarios:{0:[],1:[],2:[["09:00","13:00"],["15:00","20:00"]],3:[["09:00","13:00"],["15:00","20:00"]],4:[["09:00","13:00"],["15:00","20:00"]],5:[["09:00","13:00"],["15:00","20:00"]],6:[["09:00","14:00"]]}},
    barberos:[{id:"b1",nombre:"Martín"},{id:"b2",nombre:"Lucas"}],
    servicios:[{id:"s1",nombre:"Corte de pelo",dur:45,precio:9000},{id:"s2",nombre:"Barba",dur:30,precio:6000},{id:"s3",nombre:"Corte + barba",dur:60,precio:13000},{id:"s4",nombre:"Corte niño",dur:30,precio:7000}],
    turnos:[],bloqueos:[],demora:null
  };
  const nombres=["Juan Pérez","Diego López","Tomás Gómez","Franco Díaz","Nicolás Ruiz","Matías Sosa","Agustín Paz","Bruno Ríos","Facundo Vera","Ezequiel Luna"];
  const tels=["3515551234","3515552345","3515553456","3515554567","3515555678","3515556789","3515557890","3515558901","3515559012","3515550123"];
  const add=(f,hm,b,sv,i,est="reservado",origen="web")=>s.turnos.push({id:uid(),token:uid()+uid(),fecha:f,ini:toMin(hm),dur:s.servicios.find(x=>x.id===sv).dur,barberoId:b,servicioId:sv,cliente:nombres[i],tel:tels[i],estado:est,origen,creado:Date.now()});
  // historial: clientes que vinieron hace tiempo (para "reservá de vuelta")
  add(addDays(t,-45),"10:00","b1","s1",5,"atendido");add(addDays(t,-38),"16:00","b2","s3",6,"atendido");
  add(addDays(t,-33),"11:00","b1","s2",7,"atendido");add(addDays(t,-62),"17:00","b2","s1",8,"atendido");
  add(addDays(t,-12),"18:00","b1","s1",9,"atendido");
  // hoy y próximos días (solo si el día abre)
  const open=f=>(s.config.horarios[new Date(f+"T12:00:00").getDay()]||[]).length>0;
  let d=t,k=0; const plan=[["09:00","b1","s1",0],["10:00","b2","s3",1],["15:30","b1","s2",2],["17:00","b2","s1",3,"manual"],["18:00","b1","s3",4]];
  while(k<3){ if(open(d)){ plan.forEach(([hm,b,sv,i,o],j)=>{ if((j+k)%2===0||k===0) add(d,hm,b,sv,(i+k*2)%5,"reservado",o||"web"); }); k++; } d=addDays(d,1); }
  return s;
}
function load(){try{const v=localStorage.getItem(KEY); if(v) return JSON.parse(v);}catch(e){} const s=seed(); save(s); return s;}
function save(s){try{localStorage.setItem(KEY,JSON.stringify(s));}catch(e){}}
function reset(){try{localStorage.removeItem(KEY);}catch(e){} return load();}

/* horarios libres de un barbero en una fecha para un servicio */
function slots(s,fecha,barberoId,dur){
  const day=new Date(fecha+"T12:00:00").getDay(), fr=s.config.horarios[day]||[], out=[];
  const busy=[...s.turnos.filter(t=>t.fecha===fecha&&t.barberoId===barberoId&&t.estado==="reservado").map(t=>[t.ini,t.ini+t.dur]),
              ...s.bloqueos.filter(b=>b.fecha===fecha&&(!b.barberoId||b.barberoId===barberoId)).map(b=>[b.ini,b.fin])];
  const min=fecha===today()?nowMin()+15:-1;
  fr.forEach(([a,b])=>{ for(let m=toMin(a);m+dur<=toMin(b);m+=s.config.slotMin){ if(m<min) continue; if(!busy.some(([x,y])=>m<y&&m+dur>x)) out.push(m);} });
  return out;
}
function slotsAny(s,fecha,dur){ const map={}; s.barberos.forEach(b=>slots(s,fecha,b.id,dur).forEach(m=>{(map[m]=map[m]||[]).push(b.id);})); return map; }
function waLink(tel,msg){ let d=String(tel||"").replace(/\D/g,""); if(d.startsWith("0")) d=d.slice(1); if(!d.startsWith("54")) d="549"+d; return `https://wa.me/${d}?text=${encodeURIComponent(msg)}`; }
const fechaLarga=f=>new Date(f+"T12:00:00").toLocaleDateString("es-AR",{weekday:"long",day:"numeric",month:"long"});
const fmt=n=>"$"+n.toLocaleString("es-AR");
window.Store={KEY,load,save,reset,slots,slotsAny,waLink,ymd,addDays,toMin,toHM,uid,today,nowMin,fechaLarga,fmt,pad};
})();
