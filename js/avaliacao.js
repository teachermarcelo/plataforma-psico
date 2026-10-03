import { supabase } from "./supabase.js";
const patientId=new URLSearchParams(location.search).get("patient_id")||sessionStorage.getItem("psico_patient_id");
const list=document.getElementById("assessmentList"), form=document.getElementById("assessmentForm"), msg=document.getElementById("assessmentMessage"), patientName=document.getElementById("patientName"), patientBox=document.getElementById("patientBox"), newBtn=document.getElementById("newAssessmentBtn"), modal=document.getElementById("assessmentModal");
let assessments=[];
const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
async function admin(){const {data:{session}}=await supabase.auth.getSession();if(!session?.user)return false;const {data}=await supabase.from("psico_admins").select("user_id").eq("user_id",session.user.id).maybeSingle();return !!data}
async function load(){
 if(!(await admin())){document.getElementById("access").hidden=false;return}
 if(!patientId){patientBox.innerHTML='<strong>Selecione um paciente pelo prontuário.</strong><br><a href="pacientes.html">Ir para Pacientes →</a>';newBtn.disabled=true;return}
 const [p,a]=await Promise.all([
  supabase.from("psico_patients").select("id,full_name,preferred_name").eq("id",patientId).single(),
  supabase.from("psico_assessments").select("*").eq("patient_id",patientId).order("assessment_date",{ascending:false})
 ]);
 if(p.error){patientBox.textContent="Paciente não encontrado.";return}
 patientName.textContent=p.data.full_name;sessionStorage.setItem("psico_patient_id",patientId);document.getElementById("contextName").textContent=p.data.full_name;document.getElementById("ctxCentral").href="paciente-central.html?patient_id="+patientId;document.getElementById("ctxAnam").href="anamnese.html?patient_id="+patientId;document.getElementById("ctxResp").href="responsaveis.html?patient_id="+patientId;document.getElementById("ctxInterv").href="intervencao.html?patient_id="+patientId;document.getElementById("ctxSess").href="sessoes.html?patient_id="+patientId;document.getElementById("ctxEvol").href="evolucao.html?patient_id="+patientId;patientBox.innerHTML=`<strong>${esc(p.data.full_name)}</strong><br><span>${esc(p.data.preferred_name||"")}</span>`;
 if(a.error){list.innerHTML='<div class="empty"><h3>Não foi possível carregar as avaliações.</h3></div>';return}
 assessments=a.data||[];render();
}
function render(){
 if(!assessments.length){list.innerHTML='<div class="empty"><div>🧠</div><h3>Nenhuma avaliação registrada</h3><p>Crie a primeira avaliação deste paciente.</p></div>';return}
 list.innerHTML=assessments.map(a=>`<article class="assessment-row"><div class="assessment-icon">🧠</div><div><h3>${esc(a.title)}</h3><p>${a.assessment_date?new Date(a.assessment_date+"T00:00:00").toLocaleDateString("pt-BR"):"Sem data"} · ${a.status==="completed"?"Concluída":a.status==="in_progress"?"Em andamento":"Rascunho"}</p><small>${esc(a.summary||"Sem resumo.")}</small></div><span class="status ${a.status}">${a.status==="completed"?"Concluída":a.status==="in_progress"?"Em andamento":"Rascunho"}</span></article>`).join("");
}
function openModal(){form.reset();msg.textContent="";modal.classList.add("open");}
function closeModal(){modal.classList.remove("open")}
newBtn.onclick=openModal;document.getElementById("closeAssessmentBtn").onclick=closeModal;modal.onclick=e=>{if(e.target===modal)closeModal()};
form.onsubmit=async e=>{e.preventDefault();msg.textContent="Salvando...";
 const payload={patient_id:patientId,title:document.getElementById("title").value.trim(),assessment_date:document.getElementById("assessment_date").value||null,status:document.getElementById("status").value,summary:document.getElementById("summary").value.trim()||null,strengths:document.getElementById("strengths").value.trim()||null,difficulties:document.getElementById("difficulties").value.trim()||null,recommendations:document.getElementById("recommendations").value.trim()||null};
 if(!payload.title){msg.textContent="Informe o título da avaliação.";return}
 const {data,error}=await supabase.from("psico_assessments").insert(payload).select().single();
 if(error){msg.textContent="Erro ao salvar: "+error.message;return} assessments.unshift(data);render();closeModal();
};
load();