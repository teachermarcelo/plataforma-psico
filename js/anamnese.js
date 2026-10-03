import { supabase } from "./supabase.js";
const patientId=new URLSearchParams(location.search).get("patient_id")||(sessionStorage.getItem("psico_patient_id")||localStorage.getItem("psico_patient_id"));
const form=document.getElementById("anamnesisForm"), msg=document.getElementById("msg"), nameEl=document.getElementById("patientName"), access=document.getElementById("access");
const fields=["main_complaint","pregnancy","birth","development","language_development","motor_development","feeding","sleep","medical_history","family_history","school_history","routine","behavior","learning_history","other_information"];
const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
async function admin(){const {data:{session}}=await supabase.auth.getSession();if(!session?.user)return false;const {data}=await supabase.from("psico_admins").select("user_id").eq("user_id",session.user.id).maybeSingle();return !!data}
async function load(){
 if(!(await admin())){access.hidden=false;return}
 if(!patientId){nameEl.textContent="Paciente não selecionado";form.style.display="none";return}
 const p=await supabase.from("psico_patients").select("full_name,preferred_name").eq("id",patientId).single();
 if(p.error){nameEl.textContent="Paciente não encontrado";form.style.display="none";return}
 nameEl.textContent=p.data.full_name;(sessionStorage.setItem("psico_patient_id",patientId),localStorage.setItem("psico_patient_id",patientId));document.getElementById("contextName").textContent=p.data.full_name;
 const a=await supabase.from("psico_anamneses").select("*").eq("patient_id",patientId).maybeSingle();
 if(a.data) fields.forEach(f=>{const el=document.getElementById(f);if(el)el.value=a.data[f]||""});
}
form.onsubmit=async e=>{e.preventDefault();msg.textContent="Salvando...";
 const payload={patient_id:patientId};fields.forEach(f=>payload[f]=document.getElementById(f).value.trim()||null);
 const existing=await supabase.from("psico_anamneses").select("id").eq("patient_id",patientId).maybeSingle();
 let q=existing.data?.id?supabase.from("psico_anamneses").update(payload).eq("id",existing.data.id):supabase.from("psico_anamneses").insert(payload);
 const {error}=await q;
 msg.textContent=error?"Erro ao salvar: "+error.message:"✓ Anamnese salva com sucesso.";
};
load();