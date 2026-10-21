/* Ajustes de interacción de la interfaz del asesor; sin servicios de servidor. */
(()=>{'use strict';if(!document.body.classList.contains('asesor'))return;
 const toggle=document.querySelector('[data-advisor-password]');if(toggle){const field=toggle.parentElement.querySelector('input');if(field){toggle.addEventListener('click',()=>{const visible=field.type==='password';field.type=visible?'text':'password';toggle.setAttribute('aria-label',visible?'Ocultar contraseña':'Mostrar contraseña');toggle.setAttribute('aria-pressed',String(visible));});}}
 const selector=document.querySelector('.advisor-selector-overlay');if(!selector)return;
 const close=selector.querySelector('[data-advisor-close]');const input=selector.querySelector('input');
 input?.focus({preventScroll:true});
 input?.addEventListener('input',()=>{const query=input.value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();selector.querySelectorAll('.advisor-selector-option').forEach(row=>{row.hidden=!row.textContent.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(query);});});
 selector.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();close?.click();return;}if(event.key!=='Tab')return;const controls=[...selector.querySelectorAll('a[href],button,input,[tabindex="0"]')].filter(el=>!el.closest('[hidden]'));const first=controls[0],last=controls.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}});
})();
