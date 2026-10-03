import { supabase } from "./supabase.js";

const list = document.getElementById("patientList");
const search = document.getElementById("patientSearch");
const modal = document.getElementById("patientModal");
const form = document.getElementById("patientForm");
const message = document.getElementById("patientMessage");
const access = document.getElementById("accessMessage");
const newBtn = document.getElementById("newPatientBtn");
const closeBtn = document.getElementById("closePatientBtn");
const count = document.getElementById("patientCount");
const filter = document.getElementById("patientFilter");
const modalTitle=document.getElementById("modalTitle"), modalEyebrow=document.getElementById("modalEyebrow"), savePatientBtn=document.getElementById("savePatientBtn");

let patients = [];
let editingId = null;

async function isAdmin(){
  const { data:{session} } = await supabase.auth.getSession();
  if(!session?.user) return false;
  const { data, error } = await supabase.from("psico_admins").select("user_id").eq("user_id",session.user.id).maybeSingle();
  return !error && !!data;
}

function esc(v=""){
  return String(v).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
}

function render(){
  const q=(search.value||"").trim().toLowerCase();
  const rows=patients.filter(p=>(filter.value==="all"||p.status===filter.value) &&
    ((p.full_name||"").toLowerCase().includes(q) ||
    (p.preferred_name||"").toLowerCase().includes(q) ||
    (p.school_name||"").toLowerCase().includes(q))
  );
  count.textContent=patients.length;
  if(!rows.length){
    list.innerHTML='<div class="empty"><div>👤</div><h3>Nenhum paciente cadastrado</h3><p>Clique em “+ Novo paciente” para cadastrar o primeiro paciente.</p></div>';
    return;
  }
  list.innerHTML=rows.map(p=>`
    <article class="patient-row">
      <div class="avatar">👤</div>
      <div class="patient-info">
        <h3>${esc(p.full_name)}</h3>
        <p>${p.preferred_name?esc(p.preferred_name)+" · ":""}${p.school_name?esc(p.school_name):"Paciente"}</p>
        <small>${p.city?esc(p.city):""}${p.school_grade?" · "+esc(p.school_grade):""}${p.status==="archived"&&p.retention_until?" · Retenção até "+new Date(p.retention_until+"T00:00:00").toLocaleDateString("pt-BR"):""}</small>
      </div>
      <span class="status ${p.status==="archived"?"archived":""}">${p.status==="archived"?"Arquivado":"Ativo"}</span>
      <div><a class="btn small" href="paciente.html?id=${encodeURIComponent(p.id)}">Prontuário →</a> <button class="btn small secondary edit-patient" data-id="${encodeURIComponent(p.id)}" type="button">Editar</button> <button class="btn small ${p.status==="archived"?"":"secondary"} toggle-archive" data-id="${encodeURIComponent(p.id)}" type="button">${p.status==="archived"?"Reativar":"Arquivar"}</button> <button class="btn small danger delete-patient" data-id="${encodeURIComponent(p.id)}" type="button">Excluir</button></div>
    </article>`).join("");
}

async function load(){
  const ok=await isAdmin();
  if(!ok){
    access.hidden=false;
    newBtn.disabled=true;
    list.innerHTML="";
    return;
  }
  access.hidden=true;
  const {data,error}=await supabase.from("psico_patients").select("*").order("full_name",{ascending:true});
  if(error){
    list.innerHTML='<div class="empty"><h3>Não foi possível carregar os pacientes.</h3><p>Verifique o acesso administrativo e tente novamente.</p></div>';
    return;
  }
  patients=data||[];
  render();
}

function openModal(patient=null){
  form.reset();
  editingId=patient?.id||null;
  modalEyebrow.textContent=editingId?"EDITAR CADASTRO":"NOVO CADASTRO";
  modalTitle.textContent=editingId?"Editar paciente":"Novo paciente";
  savePatientBtn.textContent=editingId?"Salvar alterações":"Salvar paciente";
  message.textContent="";
  modal.classList.add("open");
  if(patient){["full_name","preferred_name","birth_date","sex","cpf","rg","phone","email","address","city","state","school_name","school_grade","photo_path","notes","status"].forEach(k=>{const el=document.getElementById(k);if(el)el.value=patient[k]??""});}
  document.getElementById("full_name").focus();
}
function closeModal(){modal.classList.remove("open");editingId=null;}

form.addEventListener("submit",async e=>{
  e.preventDefault();
  message.textContent="Salvando...";
  const payload={
    full_name:document.getElementById("full_name").value.trim(),
    preferred_name:document.getElementById("preferred_name").value.trim()||null,
    birth_date:document.getElementById("birth_date").value||null,
    sex:document.getElementById("sex").value||null,
    cpf:document.getElementById("cpf").value.trim()||null,
    rg:document.getElementById("rg").value.trim()||null,
    phone:document.getElementById("phone").value.trim()||null,
    email:document.getElementById("email").value.trim()||null,
    address:document.getElementById("address").value.trim()||null,
    city:document.getElementById("city").value.trim()||null,
    state:document.getElementById("state").value.trim()||null,
    school_name:document.getElementById("school_name").value.trim()||null,
    school_grade:document.getElementById("school_grade").value.trim()||null,
    notes:document.getElementById("notes").value.trim()||null,
    photo_path:document.getElementById("photo_path").value.trim()||null,
    status:document.getElementById("status").value||"active"
  };
  if(!payload.full_name){message.textContent="Informe o nome completo.";return;}
  let data=null,error=null;
  if(editingId){const r=await supabase.from("psico_patients").update(payload).eq("id",editingId).select().single();data=r.data;error=r.error;}else{const r=await supabase.from("psico_patients").insert(payload).select().single();data=r.data;error=r.error;}
  if(!error && data && !editingId){
    const guardians=[];
    for(const n of [1,2]){
      const name=document.getElementById("g"+n+"_name").value.trim();
      if(!name) continue;
      const g={full_name:name,relationship:document.getElementById("g"+n+"_relationship").value.trim()||null,cpf:document.getElementById("g"+n+"_cpf").value.trim()||null,phone:document.getElementById("g"+n+"_phone").value.trim()||null,email:document.getElementById("g"+n+"_email").value.trim()||null};
      const gr=await supabase.from("psico_guardians").insert(g).select().single();
      if(gr.error){message.textContent="Paciente salvo, mas houve erro no responsável: "+gr.error.message;return}
      guardians.push({patient_id:data.id,guardian_id:gr.data.id,is_primary:n===1,legal_responsible:document.getElementById("g"+n+"_legal").value==="true"});
    }
    if(guardians.length){const rr=await supabase.from("psico_patient_guardians").insert(guardians);if(rr.error){message.textContent="Paciente salvo, mas não foi possível vincular os responsáveis: "+rr.error.message;return}}
  }
  if(error){message.textContent="Erro ao salvar: "+error.message;return;}
  if(editingId){const i=patients.findIndex(x=>x.id===editingId);if(i>=0)patients[i]=data;}else patients.push(data);
  patients.sort((a,b)=>a.full_name.localeCompare(b.full_name));
  closeModal();
  render();
});

search.addEventListener("input",render);
filter.addEventListener("change",render);
list.addEventListener("click",async e=>{
 const edit=e.target.closest(".edit-patient"); if(edit){const p=patients.find(x=>x.id===decodeURIComponent(edit.dataset.id));if(p)openModal(p);return;}
 const arch=e.target.closest(".toggle-archive"); if(arch){const p=patients.find(x=>x.id===decodeURIComponent(arch.dataset.id));if(!p)return;
   const archived=p.status!=="archived";
   const msg=archived?\`Arquivar ${p.full_name}? O prontuário será preservado e ficará disponível em “Arquivados” por 5 anos.\`:\`Reativar ${p.full_name}?\`;
   if(!confirm(msg))return;
   const payload=archived?{status:"archived",archived_at:new Date().toISOString(),retention_until:new Date(Date.now()+5*365.25*86400000).toISOString().slice(0,10)}:{status:"active",archived_at:null,retention_until:null};
   const r=await supabase.from("psico_patients").update(payload).eq("id",p.id).select().single();
   if(r.error){alert("Não foi possível atualizar: "+r.error.message);return} Object.assign(p,r.data);render();return;
 }
 const del=e.target.closest(".delete-patient"); if(del){const p=patients.find(x=>x.id===decodeURIComponent(del.dataset.id));if(!p)return;
   const confirmName=prompt(\`EXCLUSÃO DEFINITIVA\\n\\nIsso apagará o paciente e os registros vinculados. Esta ação não pode ser desfeita.\\n\\nDigite o nome completo do paciente para confirmar:\\n${p.full_name}\`);
   if(confirmName!==p.full_name)return;
   const pf=await supabase.from("psico_patient_files").select("file_path").eq("patient_id",p.id); const docs=await supabase.from("psico_documents").select("file_path").eq("patient_id",p.id); const photo=p.photo_path?[p.photo_path]:[]; const patientFiles=(pf.data||[]).map(x=>x.file_path).filter(Boolean); const docFiles=(docs.data||[]).map(x=>x.file_path).filter(Boolean); if(patientFiles.length||photo.length)await supabase.storage.from("psico-patient-files").remove([...patientFiles,...photo]); if(docFiles.length)await supabase.storage.from("psico-patient-documents").remove(docFiles); const r=await supabase.from("psico_patients").delete().eq("id",p.id);
   if(r.error){alert("Não foi possível excluir: "+r.error.message);return}
   patients=patients.filter(x=>x.id!==p.id);render();alert("Paciente excluído definitivamente.");
 }
});
newBtn.addEventListener("click",openModal);
closeBtn.addEventListener("click",closeModal);
modal.addEventListener("click",e=>{if(e.target===modal)closeModal();});

supabase.auth.onAuthStateChange(()=>load());
load();
