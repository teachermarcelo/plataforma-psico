import { supabase } from "./supabase.js";
const patientSelect=document.getElementById("patient"), scaleSelect=document.getElementById("scale"), form=document.getElementById("form"), msg=document.getElementById("msg"), result=document.getElementById("result"), linkEl=document.getElementById("publicLink");
const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
async function admin(){const {data:{session}}=await supabase.auth.getSession();if(!session?.user)return false;const {data}=await supabase.from("psico_admins").select("user_id").eq("user_id",session.user.id).maybeSingle();return !!data}
async function load(){if(!(await admin())){document.getElementById("access").hidden=false;form.style.display="none";return}
 const p=await supabase.from("psico_patients").select("id,full_name,preferred_name,birth_date").eq("status","active").order("full_name");
 const s=await supabase.from("psico_scales").select("id,name,description,public_enabled,items").eq("active",true).order("name");
 if(p.error||s.error){msg.textContent="Erro ao carregar dados.";return}
 patientSelect.innerHTML='<option value="">Selecione o paciente...</option>'+p.data.map(x=>`<option value="${x.id}">${esc(x.full_name)}${x.preferred_name?" · "+esc(x.preferred_name):""}</option>`).join("");
 scaleSelect.innerHTML='<option value="">Selecione a escala...</option>'+s.data.map(x=>`<option value="${x.id}">${esc(x.name)} — ${Array.isArray(x.items)?x.items.length:0} itens</option>`).join("");
}
scaleSelect.onchange=async()=>{const id=scaleSelect.value;if(!id){document.getElementById("scaleInfo").textContent="";return}const {data}=await supabase.from("psico_scales").select("name,description,public_enabled,items").eq("id",id).single();document.getElementById("scaleInfo").innerHTML=`<strong>${esc(data.name)}</strong><br>${esc(data.description||"Sem descrição.")}<br><small>${Array.isArray(data.items)?data.items.length:0} itens · ${data.public_enabled?"aplicação online disponível":"aplicação online ainda não ativada"}</small>`};
form.onsubmit=async e=>{e.preventDefault();msg.textContent="Criando aplicação...";
 const pid=patientSelect.value,sid=scaleSelect.value;if(!pid||!sid){msg.textContent="Selecione paciente e escala.";return}
 const expires=document.getElementById("expires").value;const payload={patient_id:pid,scale_id:sid,respondent_type:document.getElementById("respondent").value,status:"sent",application_date:new Date().toISOString().slice(0,10),expires_at:expires?new Date(expires+"T23:59:59").toISOString():null};
 const a=await supabase.from("psico_scale_applications").insert(payload).select("id,public_token").single();if(a.error){msg.textContent="Erro: "+a.error.message;return}
 const sentTo=document.getElementById("sent_to").value.trim()||null;const l=await supabase.from("psico_scale_links").insert({application_id:a.data.id,label:document.getElementById("label").value.trim()||"Aplicação online",sent_to:sentTo,expires_at:payload.expires_at}).select("token").single();
 if(l.error){msg.textContent="Aplicação criada, mas o link não foi criado: "+l.error.message;return}
 const publicUrl=new URL("responder-escala.html",location.href);publicUrl.searchParams.set("token",a.data.public_token);linkEl.value=publicUrl.href;result.hidden=false;msg.textContent="✓ Aplicação criada.";};
document.getElementById("copy").onclick=async()=>{await navigator.clipboard.writeText(linkEl.value);msg.textContent="✓ Link copiado.";};load();