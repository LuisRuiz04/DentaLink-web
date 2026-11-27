/* =========================================================
   DentaLink · Indicador de mensajes nuevos (bolita roja)
   Pregunta cada 10 s cuántos mensajes sin leer hay y actualiza:
   - la bolita del menú "Mensajes"            - el título de la pestaña: "(3) Agenda · DentaLink"
   - un puntito en las OTRAS clínicas del selector que tengan mensajes
   No consulta mientras la pestaña está oculta; al volver, consulta al instante.
   ========================================================= */
(() => {
  'use strict';
  const DL = window.DL;
  if (!DL) return;
  const CADA = 10000;
  let ultimo = null;
  let anterior = null;
  let timer = null;

  const limpiarTitulo = (t) => t.replace(/^\(\d+\+?\)\s/, '');
  const fmt = (n) => (n > 99 ? '99+' : String(n));

  function pintar(d) {
    const total = d.total || 0;
    const badge = document.getElementById('badgeMensajes');
    if (badge) { badge.textContent = fmt(total); badge.hidden = !total; }

    const t = limpiarTitulo(document.title);
    document.title = total ? `(${fmt(total)}) ${t}` : t;

    // Otras clínicas con mensajes pendientes
    let otras = 0;
    document.querySelectorAll('[data-clinica-id]').forEach((a) => {
      const n = (d.clinicas && d.clinicas[a.dataset.clinicaId]) || 0;
      let dot = a.querySelector('.menu__dot');
      if (n && !a.classList.contains('is-active')) {
        otras += n;
        if (!dot) { dot = document.createElement('span'); dot.className = 'menu__dot'; a.append(dot); }
        dot.textContent = fmt(n);
        dot.title = `${n} ${n === 1 ? 'mensaje sin leer' : 'mensajes sin leer'}`;
      } else if (dot) dot.remove();
    });
    const sw = document.querySelector('.clinica');
    if (sw) sw.classList.toggle('has-dot', otras > 0);
    const ham = document.querySelector('[data-nav-toggle]');
    if (ham) ham.classList.toggle('has-dot', total + otras > 0);

    document.dispatchEvent(new CustomEvent('dl:mensajes', { detail: d }));
  }

  async function consultar() {
    if (!document.getElementById('badgeMensajes')) return;      // pantalla sin menú (login)
    try {
      const r = await fetch('/api/mensajes/pendientes', { credentials: 'same-origin', headers: { Accept: 'application/json' } });
      if (!r.ok || !(r.headers.get('content-type') || '').includes('json')) return;
      const d = await r.json();
      // Aviso discreto si llegaron mensajes nuevos y no estás en la bandeja
      if (anterior !== null && d.total > anterior && !location.pathname.startsWith('/mensajes')) {
        const n = d.total - anterior;
        DL.toast(n === 1 ? 'Tienes un mensaje nuevo' : `Tienes ${n} mensajes nuevos`);
      }
      anterior = d.total;
      ultimo = d;
      pintar(d);
    } catch (e) { /* sin conexión: se reintenta en el siguiente ciclo */ }
  }

  const iniciar = () => {
    consultar();
    clearInterval(timer);
    timer = setInterval(() => { if (!document.hidden) consultar(); }, CADA);
  };

  document.addEventListener('visibilitychange', () => { if (!document.hidden) consultar(); });
  document.addEventListener('dl:view', () => { if (ultimo) pintar(ultimo); });   // el selector de clínica se re-dibuja al navegar

  DL.mensajes = { refresh: consultar };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar, { once: true }); else iniciar();
})();
