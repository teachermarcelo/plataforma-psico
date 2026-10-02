import { PORTAGE_ITEMS } from "./portage-data.js";
const ENDPOINT="https://rvgcniaowzmsudzliozf.supabase.co/functions/v1/psico-scale-response";
const token=new URLSearchParams(location.search).get("token");
const app=document.getElementById("app"),loading=document.getElementById("loading"),errorBox=document.getElementById("error"),questionBox=document.getElementById("questionBox"),done=document.getElementById("done"),bar=document.getElementById("bar"),progress=document.getElementById("progress"),counter=document.getElementById("counter"),area=document.getElementById("area"),question=document.getElementById("question"),options=document.getElementById("options"),back=document.getElementById("back"),next=document.getElementById("next"),finish=document.getElementById("finish");
let items=[],answers={},index=0,scaleName="";
const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
function showError(t){loading.hidden=true;app.hidden=true;errorBox.hidden=false;errorBox.innerHTML="<strong>Não foi possível abrir esta avaliação.</strong><br>"+esc(t)}
async function start(){
 if(!token)return showError("O link da avaliação está incompleto.");
 try{
  const r=await fetch(ENDPOINT+"?token="+encodeURIComponent(token));const d=await r.json();
  if(!r.ok)throw new Error(d.error||"Link inválido.");
  scaleName=d.scale?.name||"Avaliação";
  items=(scaleName.toLowerCase().includes("portage")?PORTAGE_ITEMS:(Array.isArray(d.scale?.items)?d.scale.items:[]));
  if(!items.length)throw new Error("Esta escala ainda não possui itens configurados.");
  document.getElementById("scaleName").textContent=scaleName;
  document.getElementById("intro").textContent=d.scale?.description||"Responda às perguntas conforme a sua observação da criança.";
  loading.hidden=true;app.hidden=false;render();
 }catch(e){showError(e.message)}
}
function render(){
 const total=items.length,pct=Math.round((index/total)*100),it=items[index],chosen=answers[index];
 area.textContent=it.area||"Avaliação";question.textContent=it.question;counter.textContent=(index+1)+" de "+total;progress.textContent=pct+"%";bar.style.width=Math.max(3,pct)+"%";
 options.innerHTML=(it.options||["S","N","AV"]).map(o=>{const labels={S:"Sim",N:"Não",AV:"Às vezes"};return `<button type="button" class="answer ${chosen===o?"selected":""}" data-value="${esc(o)}"><span class="dot">${esc(o)}</span><span><strong>${labels[o]||o}</strong><small>${o==="S"?"Alcançou":o==="N"?"Ainda não alcançou":"Às vezes"}</small></span></button>`}).join("");
 options.querySelectorAll(".answer").forEach(b=>b.onclick=()=>{answers[index]=b.dataset.value;render();});
 back.disabled=index===0;next.hidden=index===total-1;finish.hidden=index!==total-1;next.disabled=chosen==null;finish.disabled=chosen==null;
}
back.onclick=()=>{if(index>0){index--;render()}};
next.onclick=()=>{if(answers[index]!=null&&index<items.length-1){index++;render()}};
finish.onclick=async()=>{
 if(answers[index]==null)return;
 finish.disabled=true;finish.textContent="Enviando...";
 const response_data=items.map((it,i)=>({number:it.number,area:it.area,age_range:it.age_range,question:it.question,answer:answers[i]??null}));
 const byArea={};for(const r of response_data){if(!byArea[r.area])byArea[r.area]={S:0,N:0,AV:0,total:0};if(r.answer)byArea[r.area][r.answer]++;byArea[r.area].total++;}
 const r=await fetch(ENDPOINT+"?token="+encodeURIComponent(token),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({response_data,result_summary:byArea,notes:"Aplicação online"} )});
 const d=await r.json();if(!r.ok){finish.disabled=false;finish.textContent="Finalizar avaliação";alert(d.error||"Erro ao enviar.");return}
 questionBox.hidden=true;done.hidden=false;
};
start();