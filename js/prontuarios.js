import { supabase } from "./supabase.js";
const list=document.getElementById("recordList"),search=document.getElementById("recordSearch"),access=document.getElementById("access"),count=document.getElementById("recordCount");
let rows=[];
const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
async function admin(){const {data:{session}}=await supabase.auth.getSession();if(!session?.user)return false;const {data}=await supabase.from("psico_admins").select("user_id").eq("user_id",session.user.id).maybeSingle();return !!data}
async function load(){
 if(!(await admin())){access.hidden=false;return}
 const {data,error}=await supabase.from("psico_patients").select("id,full_name,preferred_name,birth_date,school_name,school_grade,status,updated_at").order("updated_at",{ascending:false});
 if(error){list.innerHTML='<div class="empty"><h3>Não foi possível carregar os prontuários.</h3><p>'+esc(error.message)+'</p></div>';return}
 rows=data||[];render();
}
function age(d){if(!d)return "Idade não informada";const b=new Date(d+"T00:00:00"),n=new Date();let a=n.getFullYear()-b.getFullYear();if(n.getMonth()<b.getMonth()||(n.getMonth()===b.getMonth()&&n.getDate()<b.getDate()))a--;return a+" anos"}
function render(){
 const q=(search.value||"").toLowerCase().trim();const r=rows.filter(p=>(p.full_name||"").toLowerCase().includes(q)||(p.preferred_name||"").toLowerCase().includes(q)||(p.school_name||"").toLowerCase().includes(q));count.textContent=r.length;
 if(!r.length){list.innerHTML='<div class="empty"><div>🗂️</div><h3>Nenhum prontuário encontrado</h3><p>Cadastre um paciente para começar.</p><a class="btn" href="pacientes.html">+ Novo paciente</a></div>';return}
 list.innerHTML=r.map(p=>`<article class="record-card"><div class="record-avatar">👤</div><div class="record-main"><div class="record-top"><div><span class="record-label">PRONTUÁRIO</span><h3>${esc(p.full_name)}</h3><p>${p.preferred_name?esc(p.preferred_name)+" · ":""}${age(p.birth_date)}</p></div><span class="record-status ${p.status==="active"?"":"off"}">${p.status==="active"?"Ativo":"Arquivado"}</span></div><div class="record-meta"><span>🏫 ${esc(p.school_name||"Escola não informada")}</span><span>📚 ${esc(p.school_grade||"Ano/série não informado")}</span></div><div class="record-actions"><a class="btn small" href="paciente.html?id=${encodeURIComponent(p.id)}">Abrir prontuário</a><a class="btn secondary small" href="avaliacao.html?patient_id=${encodeURIComponent(p.id)}">Avaliação</a><a class="btn secondary small" href="intervencao.html?patient_id=${encodeURIComponent(p.id)}">Intervenção</a><a class="btn secondary small" href="sessoes.html?patient_id=${encodeURIComponent(p.id)}">Sessões</a></div></div></article>`).join("");
}
search.addEventListener("input",render);load();