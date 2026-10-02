import { supabase } from "./supabase.js";
const id=new URLSearchParams(location.search).get("id");
const root=document.getElementById("record");
const access=document.getElementById("access");
function esc(v=""){return String(v).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
async function admin(){
 const {data:{session}}=await supabase.auth.getSession();
 if(!session?.user)return false;
 const {data}=await supabase.from("psico_admins").select("user_id").eq("user_id",session.user.id).maybeSingle();
 return !!data;
}
async function load(){
 if(!id){root.innerHTML='<div class="empty"><h3>Paciente não informado.</h3></div>';return;}
 if(!(await admin())){access.hidden=false;root.innerHTML="";return;}
 const {data:p,error}=await supabase.from("psico_patients").select("*").eq("id",id).single();
 if(error){root.innerHTML='<div class="empty"><h3>Paciente não encontrado.</h3><p>Verifique o cadastro e tente novamente.</p></div>';return;}
 const birth=p.birth_date?new Date(p.birth_date+"T00:00:00").toLocaleDateString("pt-BR"):"—";
 root.innerHTML=`
 <section class="profile-hero"><div class="avatar-big">👤</div><div><p class="eyebrow">PRONTUÁRIO</p><h2>${esc(p.full_name)}</h2><p class="muted">${p.preferred_name?esc(p.preferred_name)+" · ":""}${p.status==="archived"?"Paciente arquivado":"Paciente ativo"}</p></div></section>
 <section class="record-grid">
 <article class="panel"><p class="eyebrow">DADOS PESSOAIS</p><h3>Informações</h3><div class="details"><div><small>Nome completo</small><strong>${esc(p.full_name)}</strong></div><div><small>Nome preferido</small><strong>${esc(p.preferred_name||"—")}</strong></div><div><small>Nascimento</small><strong>${birth}</strong></div><div><small>Sexo</small><strong>${esc(p.sex||"—")}</strong></div><div><small>CPF</small><strong>${esc(p.cpf||"—")}</strong></div><div><small>Telefone</small><strong>${esc(p.phone||"—")}</strong></div><div><small>E-mail</small><strong>${esc(p.email||"—")}</strong></div><div><small>Localidade</small><strong>${esc([p.city,p.state].filter(Boolean).join(" - ")||"—")}</strong></div></div></article>
 <article class="panel"><p class="eyebrow">ESCOLA</p><h3>Dados escolares</h3><div class="details"><div><small>Escola</small><strong>${esc(p.school_name||"—")}</strong></div><div><small>Ano/Série</small><strong>${esc(p.school_grade||"—")}</strong></div></div><p class="eyebrow" style="margin-top:24px">OBSERVAÇÕES</p><p class="muted">${esc(p.notes||"Nenhuma observação registrada.")}</p></article></section>
 <section class="tabs"><a class="tab active">Resumo</a><a class="tab" href="avaliacao.html?patient_id=${id}">Avaliação</a><a class="tab" href="intervencao.html?patient_id=${id}">Intervenção</a><a class="tab" href="sessoes.html?patient_id=${id}">Sessões</a><a class="tab" href="evolucao.html?patient_id=${id}">Evolução</a><a class="tab" href="documentos.html?patient_id=${id}">Documentos</a></section>`;
}
load();
