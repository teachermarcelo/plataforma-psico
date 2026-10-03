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
async function changeArchive(p,archive){
 const payload=archive?{status:"archived",archived_at:new Date().toISOString(),retention_until:new Date(Date.now()+5*365.25*86400000).toISOString().slice(0,10)}:{status:"active",archived_at:null,retention_until:null};
 const {error}=await supabase.from("psico_patients").update(payload).eq("id",p.id);
 if(error){alert("Não foi possível atualizar: "+error.message);return false;}
 alert(archive?"Paciente arquivado. O prontuário foi preservado.":"Paciente reativado.");
 location.redocument.addEventListener("click",e=>{if(e.target.id==="archiveBtn"){const p=window.currentPatient;if(p)changeArchive(p,p.status!=="archived")}if(e.target.id==="deleteBtn"){const p=window.currentPatient;if(p)deletePatient(p)}});\nload(); return true;
}
async function deletePatient(p){
 const typed=prompt("EXCLUSÃO DEFINITIVA\n\nEsta ação não pode ser desfeita.\n\nDigite exatamente o nome completo do paciente para confirmar:\n"+p.full_name);
 if(typed!==p.full_name){if(typed!==null)alert("Nome de confirmação incorreto. Nada foi excluído.");return;}
 if(!confirm("Confirma a exclusão DEFINITIVA deste paciente e dos registros vinculados?"))return;
 const pf=await supabase.from("psico_patient_files").select("file_path").eq("patient_id",p.id);
 const docs=await supabase.from("psico_documents").select("file_path").eq("patient_id",p.id);
 const photo=p.photo_path?[p.photo_path]:[];
 const files=(pf.data||[]).map(x=>x.file_path).filter(Boolean);
 const docFiles=(docs.data||[]).map(x=>x.file_path).filter(Boolean);
 if(files.length||photo.length)await supabase.storage.from("psico-patient-files").remove([...files,...photo]);
 if(docFiles.length)await supabase.storage.from("psico-patient-documents").remove(docFiles);
 const {error}=await supabase.from("psico_patients").delete().eq("id",p.id);
 if(error){alert("Não foi possível excluir: "+error.message);return;}
 sessionStorage.removeItem("psico_patient_id");localStorage.removeItem("psico_patient_id");
 alert("Paciente excluído definitivamente.");location.href="pacientes.html";
}
async function load(){
 if(id)(sessionStorage.setItem("psico_patient_id",id),localStorage.setItem("psico_patient_id",id));if(!id){root.innerHTML='<div class="empty"><h3>Paciente não informado.</h3></div>';return;}
 if(!(await admin())){access.hidden=false;root.innerHTML="";return;}
 const {data:p,error}=await supabase.from("psico_patients").select("*").eq("id",id).single();
 if(!error)window.currentPatient=p;\n if(error){root.innerHTML='<div class="empty"><h3>Paciente não encontrado.</h3><p>Verifique o cadastro e tente novamente.</p></div>';return;}
 const g=await supabase.from("psico_patient_guardians").select("is_primary,legal_responsible,psico_guardians(full_name,relationship,cpf,phone,email)").eq("patient_id",id);const guardians=g.data||[];const birth=p.birth_date?new Date(p.birth_date+"T00:00:00").toLocaleDateString("pt-BR"):"—";
 root.innerHTML=`
 <section class="patient-context"><div><p class="eyebrow">👤 PACIENTE ATIVO</p><h3>${esc(p.full_name)}</h3><small>Este prontuário reúne todas as informações deste paciente.</small></div><div class="context-actions"><a class="btn secondary" href="paciente-central.html?patient_id=${id}">Central do paciente</a><a class="btn secondary" href="anamnese.html?patient_id=${id}">Anamnese</a><a class="btn secondary" href="avaliacao.html?patient_id=${id}">Avaliação</a><a class="btn secondary" href="intervencao.html?patient_id=${id}">Intervenção</a><a class="btn secondary" href="sessoes.html?patient_id=${id}">Sessões</a><a class="btn secondary" href="evolucao.html?patient_id=${id}">Evolução</a><a class="btn secondary" href="documentos.html?patient_id=${id}">Documentos</a><button class="btn ${p.status==="archived"?"":"secondary"}" id="archiveBtn" type="button">${p.status==="archived"?"↻ Reativar":"📦 Arquivar"}</button><button class="btn danger" id="deleteBtn" type="button">🗑 Excluir</button></div></section><section class="profile-hero"><div class="avatar-big">👤</div><div><p class="eyebrow">PRONTUÁRIO</p><h2>${esc(p.full_name)}</h2><p class="muted">${p.preferred_name?esc(p.preferred_name)+" · ":""}${p.status==="archived"?"Paciente arquivado":"Paciente ativo"}</p></div></section>
 <section class="record-grid">
 <article class="panel"><p class="eyebrow">DADOS PESSOAIS</p><h3>Informações</h3><div class="details"><div><small>Nome completo</small><strong>${esc(p.full_name)}</strong></div><div><small>Nome preferido</small><strong>${esc(p.preferred_name||"—")}</strong></div><div><small>Nascimento</small><strong>${birth}</strong></div><div><small>Sexo</small><strong>${esc(p.sex||"—")}</strong></div><div><small>CPF</small><strong>${esc(p.cpf||"—")}</strong></div><div><small>Telefone</small><strong>${esc(p.phone||"—")}</strong></div><div><small>E-mail</small><strong>${esc(p.email||"—")}</strong></div><div><small>Localidade</small><strong>${esc([p.city,p.state].filter(Boolean).join(" - ")||"—")}</strong></div></div></article>
 <article class="panel"><p class="eyebrow">RESPONSÁVEIS</p><h3>Pais e responsáveis</h3><div class="details">${guardians.length?guardians.map(x=>`<div><small>${x.legal_responsible?"Responsável legal":"Responsável"} · ${esc(x.psico_guardians?.relationship||"")}</small><strong>${esc(x.psico_guardians?.full_name||"—")}</strong><small>${esc(x.psico_guardians?.phone||"—")} · ${esc(x.psico_guardians?.email||"—")}</small></div>`).join(""):"<div><small>Responsáveis</small><strong>Nenhum cadastrado</strong></div>"}</div></article><article class="panel"><p class="eyebrow">ESCOLA</p><h3>Dados escolares</h3><div class="details"><div><small>Escola</small><strong>${esc(p.school_name||"—")}</strong></div><div><small>Ano/Série</small><strong>${esc(p.school_grade||"—")}</strong></div></div><p class="eyebrow" style="margin-top:24px">OBSERVAÇÕES</p><p class="muted">${esc(p.notes||"Nenhuma observação registrada.")}</p></article></section>
 <section class="tabs"><a class="tab active">Resumo</a><a class="tab" href="avaliacao.html?patient_id=${id}">Avaliação</a><a class="tab" href="intervencao.html?patient_id=${id}">Intervenção</a><a class="tab" href="sessoes.html?patient_id=${id}">Sessões</a><a class="tab" href="evolucao.html?patient_id=${id}">Evolução</a><a class="tab" href="documentos.html?patient_id=${id}">Documentos</a><a class="tab" href="paciente-central.html?patient_id=${id}">📁 Central do paciente</a><a class="tab" href="admin/respostas.html?patient_id=${id}">📊 Respostas</a></section>`;
}
load();
