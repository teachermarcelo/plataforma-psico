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

let patients = [];

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
  const rows=patients.filter(p=>
    (p.full_name||"").toLowerCase().includes(q) ||
    (p.preferred_name||"").toLowerCase().includes(q) ||
    (p.school_name||"").toLowerCase().includes(q)
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
        <small>${p.city?esc(p.city):""}${p.school_grade?" · "+esc(p.school_grade):""}</small>
      </div>
      <span class="status ${p.status==="archived"?"archived":""}">${p.status==="archived"?"Arquivado":"Ativo"}</span>
      <a class="btn small" href="paciente.html?id=${encodeURIComponent(p.id)}">Prontuário →</a>
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

function openModal(){
  form.reset();
  message.textContent="";
  modal.classList.add("open");
  document.getElementById("full_name").focus();
}
function closeModal(){modal.classList.remove("open");}

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
    photo_path:document.getElementById("photo_path").value.trim()||null
  };
  if(!payload.full_name){message.textContent="Informe o nome completo.";return;}
  const {data,error}=await supabase.from("psico_patients").insert(payload).select().single();
  if(!error && data){
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
  patients.push(data);
  patients.sort((a,b)=>a.full_name.localeCompare(b.full_name));
  closeModal();
  render();
});

search.addEventListener("input",render);
newBtn.addEventListener("click",openModal);
closeBtn.addEventListener("click",closeModal);
modal.addEventListener("click",e=>{if(e.target===modal)closeModal();});

supabase.auth.onAuthStateChange(()=>load());
load();
