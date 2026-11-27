/* =========================================================
   DentaLink · Formularios paso a paso
   Cualquier <form data-steps> con hijos <div class="step" data-q="Pregunta"> se convierte en:
   una pregunta a la vez + barra de progreso + resumen final con "Cambiar" + botón de confirmar.
   Opciones del <form>:  data-submit="Texto del botón final"   data-fresh (se vacía al abrir su ventana)
   El envío final lo sigue haciendo app.js (o el envío normal del navegador): mismas rutas y mismos campos.
   ========================================================= */
(() => {
  'use strict';
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  function init(form) {
    if (form._sf) return form._sf;
    const steps = Array.from(form.children).filter((el) => el.classList.contains('step'));
    if (!steps.length) return null;
    form.classList.add('sf');

    steps.forEach((s) => {
      if (s.dataset.q && !s.querySelector('.step__q')) {
        s.insertAdjacentHTML('afterbegin', `<h3 class="step__q">${esc(s.dataset.q)}</h3>${s.dataset.hint ? `<p class="step__hint">${esc(s.dataset.hint)}</p>` : ''}`);
      }
    });

    const head = document.createElement('div');
    head.className = 'sf__head';
    head.innerHTML = '<div class="wiz__meta"><strong class="sf__txt"></strong><span class="sf__pct"></span></div><div class="wiz__bar"><span class="sf__fill"></span></div>';
    form.insertBefore(head, steps[0]);

    const sum = document.createElement('div');
    sum.className = 'step step--summary';
    sum.innerHTML = '<h3 class="step__q">Revisa y confirma</h3><p class="step__hint">Si algo no es correcto, usa “Cambiar”.</p><div class="wiz__sum sf__sum"></div>';
    steps[steps.length - 1].after(sum);

    const foot = document.createElement('div');
    foot.className = 'sf__foot';
    foot.innerHTML = `<button type="button" class="btn btn--ghost" data-sf-back>Atrás</button><button type="button" class="btn btn--primary" data-sf-next>Continuar</button><button type="submit" class="btn btn--primary hidden" data-sf-submit>${esc(form.dataset.submit || 'Confirmar')}</button>`;
    sum.after(foot);

    const st = { form, steps: steps.concat(sum), i: 0 };
    form._sf = st;
    show(st, 0, 0);

    const modal = form.closest('.modal');
    if (modal) modal.addEventListener('modal:open', () => { if ('fresh' in form.dataset) form.reset(); show(st, 0, 0); });
    return st;
  }

  const fieldsOf = (step) => Array.from(step.querySelectorAll('input[name], select[name], textarea[name]'))
    .filter((el) => el.name && el.type !== 'hidden' && !el.disabled && !el.closest('.hidden'));

  const labelOf = (el) => {
    const f = el.closest('.field');
    const l = f && f.querySelector('.field__label');
    return (l && l.textContent.trim()) || el.getAttribute('aria-label') || el.name;
  };

  const valueOf = (el) => {
    const v = (el.value || '').trim();
    if (el.tagName === 'SELECT') return el.selectedIndex > -1 && v ? el.options[el.selectedIndex].text : 'Sin seleccionar';
    if (el.type === 'password') return v ? '••••••••' : 'Sin cambios';
    if (!v) return 'Sin especificar';
    if (el.type === 'date') return new Date(v + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    if (el.type === 'time') return v.slice(0, 5) + ' h';
    return v;
  };

  function buildSummary(st) {
    const rows = st.steps.slice(0, -1).map((s, k) => fieldsOf(s).map((el) => `
      <div class="wiz__row"><div><small>${esc(labelOf(el))}</small><strong class="sf__val">${esc(valueOf(el))}</strong></div>
      <button type="button" class="btn btn--ghost btn--sm" data-sf-go="${k}">Cambiar</button></div>`).join('')).join('');
    st.form.querySelector('.sf__sum').innerHTML = rows;
  }

  function show(st, i, dir) {
    const last = st.steps.length - 1;
    st.i = Math.max(0, Math.min(last, i));
    const onSum = st.i === last;
    if (onSum) buildSummary(st);

    st.steps.forEach((s, k) => { s.classList.toggle('is-active', k === st.i); s.classList.remove('sf-fwd', 'sf-back'); });
    const cur = st.steps[st.i];
    if (dir && !reduce()) { void cur.offsetWidth; cur.classList.add(dir > 0 ? 'sf-fwd' : 'sf-back'); }

    const falta = last - st.i;
    const f = st.form;
    f.querySelector('.sf__txt').textContent = onSum ? '¡Listo! Revisa y confirma' : (falta === 1 ? 'Última pregunta' : `Faltan ${falta} preguntas`);
    const pct = onSum ? 100 : Math.round((st.i / last) * 100);
    f.querySelector('.sf__pct').textContent = pct + '%';
    f.querySelector('.sf__fill').style.transform = `scaleX(${Math.max(pct, 4) / 100})`;
    f.querySelector('[data-sf-back]').classList.toggle('is-gone', st.i === 0);
    f.querySelector('[data-sf-next]').classList.toggle('hidden', onSum);
    f.querySelector('[data-sf-submit]').classList.toggle('hidden', !onSum);

    if (dir) {
      setTimeout(() => {
        const t = onSum ? f.querySelector('[data-sf-submit]') : cur.querySelector('input:not([type=hidden]), select, textarea');
        if (t) t.focus({ preventScroll: true });
      }, 60);
    }
  }

  function next(st) {
    const cur = st.steps[st.i];
    for (const el of cur.querySelectorAll('input, select, textarea')) {
      if (!el.closest('.hidden') && !el.checkValidity()) { el.reportValidity(); return; }
    }
    show(st, st.i + 1, 1);
  }

  /* ---------- Eventos ---------- */
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-sf-next], [data-sf-back], [data-sf-go]');
    if (!b) return;
    const st = b.form && b.form._sf;
    if (!st) return;
    if ('sfNext' in b.dataset) next(st);
    else if ('sfBack' in b.dataset) show(st, st.i - 1, -1);
    else show(st, Number(b.dataset.sfGo), -1);
  });

  // Enter en un campo = "Continuar" (en el resumen sí envía)
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || e.isComposing) return;
    const t = e.target;
    if (!t.matches || !t.matches('input')) return;
    const st = t.form && t.form._sf;
    if (!st || st.i === st.steps.length - 1) return;
    e.preventDefault();
    next(st);
  }, true);

  // Ningún formulario paso a paso se envía antes de llegar al resumen
  document.addEventListener('submit', (e) => {
    const st = e.target._sf;
    if (st && st.i !== st.steps.length - 1) { e.preventDefault(); e.stopImmediatePropagation(); next(st); }
  }, true);

  /* ---------- Arranque: también para formularios que llegan al cambiar de vista ---------- */
  const scan = (root) => {
    if (root.nodeType !== 1) return;
    if (root.matches('form[data-steps]')) init(root);
    root.querySelectorAll('form[data-steps]').forEach(init);
  };
  const start = () => {
    scan(document.body);
    new MutationObserver((muts) => muts.forEach((m) => m.addedNodes.forEach(scan))).observe(document.body, { childList: true, subtree: true });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true }); else start();
})();
