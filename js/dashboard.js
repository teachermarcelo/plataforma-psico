import {supabase} from "./js/supabase.js";
const stats={patients:document.querySelector(".stat:nth-child(1) strong"),sessions:document.querySelector(".stat:nth-child(2) strong"),documents:document.querySelector(".stat:nth-child(3) strong"),materials:document.querySelector(".stat:nth-child(4) strong")};
const subs=[["patients","psico_patients", "status"],["sessions","psico_sessions"],["documents","psico_documents"],["materials","psico_materials"]];
async function count(key,table,statusCol){let q=supabase.from(table).select("id",{count:"exact",head:true});if(statusCol)q=q.eq(statusCol,"active");const {count,error}=await q;if(error){console.error(table,error);stats[key].textContent="0";}else stats[key].textContent=count??0;}
async function load(){
 await Promise.all(subs.map(x=>count(...x)));
 const labels=document.querySelectorAll(".stat small");
 labels[0].textContent="Pacientes cadastrados como ativos";
 labels[1].textContent="Atendimentos registrados";
 labels[2].textContent="Documentos do prontuário";
 labels[3].textContent="Materiais cadastrados";
}
load();