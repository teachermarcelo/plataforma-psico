import { supabase } from "./supabase.js";
const qs=new URLSearchParams(location.search);let id=qs.get("patient_id")||sessionStorage.getItem("psico_patient_id");if(!id&&document.referrer){try{const u=new URL(document.referrer);id=u.searchParams.get("patient_id")||u.searchParams.get("id")}catch(e){}}if(id)sessionStorage.setItem("psico_patient_id",id);
const $=x=>document.getElementById(x);
const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
let plans=[],activities=[];
async function admin(){const {data:{session}}=await supabase.auth.getSession();if(!session?.user){location.href="admin/index.html";return false}const {data}=await supabase.from("psico_admins").select("user_id").eq("user_id",session.user.id).maybeSingle();if(!data){location.href="admin/index.html";return false}return true}
function planLabel(s){return {draft:"Em planejamento",active:"Em andamento",completed:"Concluído",archived:"Arquivado"}[s]||s}
async function load(){
 if(!(await admin()))return;
 if(!id){$("patientName").textContent="Nenhum paciente selecionado";$("planForm").style.display="none";return}
 const p=await supabase.from("psico_patients").select("full_name").eq("id",id).single();
 if(p.data){$("patientName").textContent=p.data.full_name;$("back").href="paciente.html?id="+id;$("prontLink").href="paciente-central.html?patient_id="+id;$("anamneseLink").href="anamnese.html?patient_id="+id}
 const r=await supabase.from("psico_intervention_plans").select("*").eq("patient_id",id).order("created_at",{ascending:false});
 plans=r.data||[]; renderPlans(); fillPlanSelects(); await loadGoals(); await loadActivities()
}
function renderPlans(){
 $("plans").innerHTML=plans.length?plans.map(p=>'<div class="row"><div><strong>'+esc(p.title)+'</strong><div class="muted">'+esc(p.frequency||"Frequência não informada")+' · '+esc(p.start_date||"Sem início")+'</div></div><span class="tag">'+esc(planLabel(p.status))+'</span></div>').join(""):'<div class="empty">Nenhum plano cadastrado.</div>';
}
function fillPlanSelects(){
 const opts='<option value="">Selecione o plano...</option>'+plans.map(p=>'<option value="'+p.id+'">'+esc(p.title)+'</option>').join("");
 $("goalPlan").innerHTML=opts;$("activityPlan").innerHTML=opts
}
async function loadGoals(){
 const ids=plans.map(x=>x.id);if(!ids.length){$("goals").innerHTML='<div class="empty">Cadastre um plano primeiro.</div>';return}
 const r=await supabase.from("psico_intervention_goals").select("*").in("plan_id",ids).order("created_at",{ascending:false});
 $("goals").innerHTML=r.data?.length?r.data.map(g=>{const p=plans.find(x=>x.id===g.plan_id);return '<div class="row"><div><strong>'+esc(g.goal)+'</strong><div class="muted">'+esc(g.area||"Área não informada")+' · '+esc(g.priority||"Sem prioridade")+'</div><small>'+esc(p?.title||"")+'</small></div><span class="tag">'+esc(g.status==="achieved"?"Alcançado":g.status==="in_progress"?"Em andamento":"Pendente")+'</span></div>'}).join(""):'<div class="empty">Nenhum objetivo cadastrado.</div>'
}
async function loadActivities(){
 const r=await supabase.from("psico_activities").select("id,title,category,area").eq("active",true).order("title");
 activities=r.data||[];$("activity").innerHTML='<option value="">Selecione a atividade...</option>'+activities.map(a=>'<option value="'+a.id+'">'+esc(a.title)+'</option>').join("");
 const ids=plans.map(x=>x.id);if(!ids.length){$("activities").innerHTML='<div class="empty">Cadastre um plano primeiro.</div>';return}
 const x=await supabase.from("psico_plan_activities").select("plan_id,activity_id,notes,psico_activities(title,category,area)").in("plan_id",ids);
 $("activities").innerHTML=x.data?.length?x.data.map(a=>{const p=plans.find(x=>x.id===a.plan_id);return '<div class="row"><div><strong>'+esc(a.psico_activities?.title)+'</strong><div class="muted">'+esc(a.psico_activities?.area||a.psico_activities?.category||"Atividade")+'</div><small>'+esc(p?.title||"")+'</small></div></div>'}).join(""):'<div class="empty">Nenhuma atividade vinculada.</div>'
}
$("planForm").onsubmit=async e=>{e.preventDefault();if(!id)return;$("planMsg").textContent="Salvando...";const x=await supabase.from("psico_intervention_plans").insert({patient_id:id,title:$("title").value.trim(),general_goal:$("general").value.trim()||null,start_date:$("start").value||null,end_date:$("end").value||null,frequency:$("frequency").value.trim()||null,status:$("status").value,notes:$("notes").value.trim()||null});$("planMsg").textContent=x.error?"Erro: "+x.error.message:"✓ Plano salvo";if(!x.error){$("planForm").reset();$("status").value="active";await load()}}
$("goalForm").onsubmit=async e=>{e.preventDefault();const x=await supabase.from("psico_intervention_goals").insert({plan_id:$("goalPlan").value,goal:$("goal").value.trim(),area:$("area").value.trim()||null,priority:$("priority").value||null,indicator:$("indicator").value.trim()||null});if(x.error)alert("Erro: "+x.error.message);else{e.target.reset();await loadGoals()}}
$("activityForm").onsubmit=async e=>{e.preventDefault();const x=await supabase.from("psico_plan_activities").upsert({plan_id:$("activityPlan").value,activity_id:$("activity").value,notes:$("activityNotes").value.trim()||null},{onConflict:"plan_id,activity_id"});if(x.error)alert("Erro: "+x.error.message);else{e.target.reset();await loadActivities()}}
load();