import {supabase} from "./supabase.js";
const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));
export async function loadClinicHeader(targetId="clinicHeader"){
 const el=document.getElementById(targetId); if(!el)return;
 const {data}=await supabase.from("psico_system_settings").select("key,value").in("key",["institution","document_footer"]);
 const settings={};(data||[]).forEach(x=>settings[x.key]=x.value||{});
 const i=settings.institution||{};
 el.innerHTML='<strong>'+esc(i.name||"ESPAÇO GRAÇA LTDA")+'</strong><span>'+esc(i.address||"")+(i.city?' · '+esc(i.city):"")+'</span><span>'+esc(i.cnpj||"")+(i.phone?' · '+esc(i.phone):"")+'</span>';
 const footer=document.getElementById("clinicFooter"); if(footer) footer.textContent=settings.document_footer?.text||"";
}