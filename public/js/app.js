/* =========================================================
   DentaLink · Capa de navegación fluida
   ---------------------------------------------------------
   - El menú lateral y la barra superior NUNCA se recargan: solo se reemplaza <main id="vista">.
   - Los enlaces y formularios se piden con fetch(), se sigue la redirección y se cambia la vista.
   - Cada cambio de vista se anima con la View Transitions API (solo opacity + transform).
   - Prefetch al pasar el cursor, URLs reales (botón "atrás" y recarga funcionan igual que siempre).
   - Si algo falla (sin JS, navegador viejo, sesión vencida) se hace navegación normal: nada se rompe.
   ========================================================= */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const root = document.documentElement;
  const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  // API pública para los scripts de cada vista
  const DL = (window.DL = { version: 8, cleanups: [], guard: null, loaded: new Map() });
  DL.FC = 'https://cdn.jsdelivr.net/npm/fullcalendar@6.1.11/index.global.min.js';
  DL.ready = (fn) => (document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn, { once: true }) : fn());
  DL.esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  DL.load = (src) => {
    if (!DL.loaded.has(src)) {
      DL.loaded.set(src, new Promise((ok, fail) => {
        const s = document.createElement('script');
        s.src = src; s.onload = ok; s.onerror = () => { DL.loaded.delete(src); fail(new Error('No se pudo cargar ' + src)); };
        document.head.append(s);
      }));
    }
    return DL.loaded.get(src);
  };

  /* ---------- Modo oscuro ---------- */
  const setTheme = (t) => {
    root.dataset.theme = t;
    try { localStorage.setItem('dl-theme', t); } catch (e) { /* modo privado */ }
  };
  const toggleTheme = () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    if (document.startViewTransition && !reduceMotion()) document.startViewTransition(() => setTheme(next));
    else setTheme(next);
  };

  /* ---------- Avisos (toasts) ---------- */
  const ICO_OK = '<svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
  const ICO_ERR = '<svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>';
  DL.toast = (msg, type = 'ok') => {
    const box = $('#toasts');
    if (!box || !msg) return;
    const el = document.createElement('div');
    el.className = 'toast toast--' + type;
    el.setAttribute('role', 'status');
    el.innerHTML = (type === 'error' ? ICO_ERR : ICO_OK) + '<span></span>';
    el.lastChild.textContent = msg;
    box.append(el);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 280); }, 3400);
  };

  /* ---------- Modales ---------- */
  let lastFocus = null;
  const fill = (modal, trigger) => {
    const d = (trigger && trigger.dataset) || {};
    const tpl = (s) => s.replace(/\{(\w+)\}/g, (_, k) => encodeURIComponent(d[k] ?? ''));
    $$('[data-fill]', modal).forEach((el) => { el.value = d[el.dataset.fill] ?? ''; });
    $$('[data-action]', modal).forEach((el) => el.setAttribute(el.tagName === 'FORM' ? 'action' : 'formaction', tpl(el.dataset.action)));
    $$('[data-href]', modal).forEach((el) => { el.href = tpl(el.dataset.href); });
  };
  DL.open = (id, trigger) => {
    const m = document.getElementById(id);
    if (!m) return;
    closeMenus();
    fill(m, trigger);
    lastFocus = document.activeElement;
    m.classList.add('open');
    m.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    m.dispatchEvent(new CustomEvent('modal:open', { detail: { trigger } }));
    const first = $('[autofocus], input:not([type=hidden]):not([type=radio]):not([type=checkbox]), textarea, select', m);
    setTimeout(() => first && first.focus({ preventScroll: true }), 60);
  };
  DL.close = (modal) => {
    (modal ? [modal] : $$('.modal.open')).forEach((m) => {
      m.classList.remove('open');
      m.setAttribute('aria-hidden', 'true');
      if (m._resolve) { const r = m._resolve; m._resolve = null; r(false); }
    });
    if (!$('.modal.open')) document.body.classList.remove('modal-open');
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
  };
  DL.confirm = (msg, { ok = 'Eliminar', danger = true } = {}) => new Promise((resolve) => {
    const m = $('#modalConfirm');
    if (!m) return resolve(window.confirm(msg));
    $('#confirmMsg').textContent = msg;
    const btn = $('#confirmOk');
    btn.textContent = ok;
    btn.className = 'btn ' + (danger ? 'btn--danger' : 'btn--primary');
    m._resolve = resolve;
    btn.onclick = () => { m._resolve = null; DL.close(m); resolve(true); };
    DL.open('modalConfirm');
  });

  /* ---------- Menús y barra lateral ---------- */
  function closeMenus() { $$('.menu.open').forEach((m) => m.classList.remove('open')); }
  const closeNav = () => document.body.classList.remove('nav-open');

  /* ---------- Errores que el servidor devuelve como ?error=N ---------- */
  const ERRORES = {
    '/': {
      2: 'Faltan datos de la cita.',
      5: 'Ese horario ya está ocupado por otra cita.',
      6: 'La hora de fin debe ser después de la de inicio.'
    },
    '/expediente': {
      1: 'Ya existe un paciente con ese correo. Usa otro.',
      2: 'Faltan datos o no se pudo guardar. Inténtalo de nuevo.',
      3: 'No se encontró al paciente en este consultorio.',
      4: 'La contraseña debe tener al menos 6 caracteres.'
    }
  };
  // Muestra el aviso de error (si lo hay) y quita ?error= de la URL para que no se repita al recargar
  const avisarError = () => {
    const u = new URL(location.href);
    const codigo = u.searchParams.get('error');
    if (!codigo) return false;
    const grupo = Object.keys(ERRORES).find((p) => u.pathname === p || u.pathname.startsWith(p + '/'));
    DL.toast((grupo && ERRORES[grupo][codigo]) || 'No se pudo completar la acción.', 'error');
    u.searchParams.delete('error');
    history.replaceState(history.state, '', u.pathname + u.search);
    current = u.pathname + u.search;
    return true;
  };

  /* ---------- Navegación (router) ---------- */
  const hasShell = () => !!$('#vista');
  const NATIVE = /^\/(cerrar-sesion|auth|login|registro|receta\/descargar|api\/)/;
  const norm = (u) => { const x = new URL(u, location.href); return x.pathname + x.search; };
  const here = () => location.pathname + location.search;
  const hard = (url) => { location.assign(url); };
  let current = here();
  let navId = 0;
  const cache = new Map();
  const TTL = 20000;

  const fetchPage = async (url, opts = {}) => {
    const r = await fetch(url, { credentials: 'same-origin', ...opts, headers: { 'X-DL': '1', ...(opts.headers || {}) } });
    const type = r.headers.get('content-type') || '';
    return { url: r.url, ok: r.ok, status: r.status, redirected: r.redirected, html: type.includes('text/html') ? await r.text() : '' };
  };
  const prefetch = (url) => {
    const k = norm(url), hit = cache.get(k);
    if (hit && Date.now() - hit.t < TTL) return hit.p;
    const p = fetchPage(k);
    cache.set(k, { t: Date.now(), p });
    p.catch(() => cache.delete(k));
    return p;
  };

  const setActive = (path) => $$('.nav__item').forEach((a) => {
    const on = ('exact' in a.dataset && path === '/') || (a.dataset.match || '').split(' ').some((m) => m && m !== '/' && (path === m || path.startsWith(m + '/')));
    if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });

  const progress = (on) => {
    const p = $('#progress');
    if (!p) return;
    if (on) { p.className = ''; void p.offsetWidth; p.className = 'on'; }
    else if (p.className === 'on') { p.className = 'done'; setTimeout(() => { p.className = ''; }, 500); }
  };
  const busy = (on) => { progress(on); const v = $('#vista'); if (v) v.classList.toggle('is-loading', on); };

  // Los <script> que llegan por innerHTML/DOMParser no se ejecutan: se recrean para que corran.
  const runScripts = (el) => $$('script', el).forEach((old) => {
    if (old.type && !/javascript|module/.test(old.type)) return;
    const s = document.createElement('script');
    Array.from(old.attributes).forEach((a) => s.setAttribute(a.name, a.value));
    s.textContent = old.textContent;
    old.replaceWith(s);
  });
  const swap = (el, from) => { if (el) el.replaceChildren(...(from ? from.childNodes : [])); };
  const syncShell = (doc) => $$('[data-sync]').forEach((el) => {
    const n = doc.getElementById(el.id);
    if (n && n.innerHTML !== el.innerHTML) el.innerHTML = n.innerHTML;
  });

  async function show(page, { push = true, y, toast } = {}) {
    const doc = new DOMParser().parseFromString(page.html || '', 'text/html');
    const next = doc.getElementById('vista');
    if (!next) {
      if (page.ok || page.redirected) return hard(page.url);      // p. ej. sesión vencida -> /auth
      console.error('[DentaLink] Respuesta sin vista:', page.status, page.url);
      return DL.toast(`El servidor respondió ${page.status || 'con error'} en ${new URL(page.url || location.href).pathname}. Revisa la terminal del servidor.`, 'error');
    }
    const url = norm(page.url);
    const samePage = url === current;

    const run = () => {
      history.replaceState({ y: scrollY }, '');
      DL.close();
      closeMenus();
      closeNav();
      DL.cleanups.splice(0).forEach((fn) => { try { fn(); } catch (e) { console.error(e); } });
      DL.guard = null;
      window.onbeforeunload = null;
      swap($('#vista'), next);
      swap($('#vista-extras'), doc.getElementById('vista-extras'));
      // Los scripts corren hasta que vista Y ventanas ya están en el DOM
      runScripts($('#vista')); runScripts($('#vista-extras'));
      syncShell(doc);
      document.dispatchEvent(new CustomEvent('dl:view', { detail: { url } }));
      document.title = doc.title;
      if (push && !samePage) history.pushState({ y: 0 }, '', url);
      current = url;
      setActive(location.pathname);
      if (!samePage) scrollTo(0, y || 0);
      const v = $('#vista'); if (v) v.focus({ preventScroll: true });
    };

    if (!samePage && !reduceMotion() && document.startViewTransition) {
      root.classList.add('vt-nav');
      const t = document.startViewTransition(run);
      t.finished.catch(() => {}).finally(() => root.classList.remove('vt-nav'));
      await t.updateCallbackDone.catch(() => {});
    } else {
      run();
      if (!samePage && !reduceMotion()) {
        $('#vista').animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 240, easing: 'cubic-bezier(.2,.7,.2,1)' });
      }
    }
    if (!avisarError() && toast) DL.toast(toast);
  }

  async function go(url, { push = true, y } = {}) {
    if (!hasShell()) return hard(url);
    const id = ++navId;
    const target = norm(url);
    if (DL.guard && !(await DL.guard())) { if (!push) history.pushState({ y: 0 }, '', current); return; }
    if (/^\/cambiar-clinica/.test(target)) cache.clear();
    setActive(target.split('?')[0]);                  // el menú reacciona al instante
    closeNav();
    const timer = setTimeout(() => busy(true), 120);  // barra de progreso solo si tarda
    let page;
    try { page = await prefetch(target); cache.delete(target); }
    catch (e) { clearTimeout(timer); busy(false); return hard(target); }
    clearTimeout(timer); busy(false);
    if (id !== navId) return;                         // llegó otro clic después: este se descarta
    return show(page, { push, y });
  }
  DL.go = go;
  DL.refresh = () => { cache.clear(); return go(here(), { push: false, y: scrollY }); };

  /* ---------- Eventos globales (delegados: siguen funcionando tras cada cambio de vista) ---------- */
  let downOnBackdrop = false;
  document.addEventListener('mousedown', (e) => { downOnBackdrop = e.target.classList && e.target.classList.contains('modal'); });

  document.addEventListener('click', (e) => {
    const t = e.target;
    if (t.closest('[data-theme-toggle]')) return toggleTheme();

    const tg = t.closest('[data-toggle]');
    if (tg) {
      const m = document.getElementById(tg.dataset.toggle);
      const was = m.classList.contains('open');
      closeMenus();
      m.classList.toggle('open', !was);
      tg.setAttribute('aria-expanded', String(!was));
      return;
    }
    const op = t.closest('[data-open]');
    if (op) { e.preventDefault(); return DL.open(op.dataset.open, op); }
    const cl = t.closest('[data-close]');
    if (cl) return DL.close(cl.closest('.modal'));
    if (t.classList && t.classList.contains('modal') && downOnBackdrop) return DL.close(t);
    if (t.closest('[data-nav-toggle]')) return document.body.classList.toggle('nav-open');
    if (t.closest('[data-nav-close]')) return closeNav();
    if (!t.closest('.menu')) closeMenus();

    // Enlaces internos -> navegación sin recarga
    if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = t.closest('a[href]');
    if (!a || a.target || a.hasAttribute('download') || 'native' in a.dataset || !hasShell()) return;
    const raw = a.getAttribute('href');
    if (!raw || raw.startsWith('#') || /^(mailto|tel|javascript):/.test(raw)) return;
    const u = new URL(a.href, location.href);
    if (u.origin !== location.origin || NATIVE.test(u.pathname)) return;
    e.preventDefault();
    go(u.pathname + u.search);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const open = $$('.modal.open');
    if (open.length) return DL.close(open[open.length - 1]);
    closeMenus(); closeNav();
  });

  // Prefetch: cuando el cursor se posa sobre un enlace, ya vamos trayendo la vista
  let hoverTimer;
  const warm = (e) => {
    const a = e.target.closest && e.target.closest('a[data-prefetch]');
    if (!a || !hasShell()) return;
    const u = new URL(a.href, location.href);
    if (u.origin !== location.origin || NATIVE.test(u.pathname)) return;
    clearTimeout(hoverTimer);
    hoverTimer = setTimeout(() => prefetch(u.pathname + u.search).catch(() => {}), 60);
  };
  document.addEventListener('mouseover', warm);
  document.addEventListener('focusin', warm);
  document.addEventListener('mouseout', () => clearTimeout(hoverTimer));
  document.addEventListener('touchstart', (e) => {
    const a = e.target.closest && e.target.closest('a[data-prefetch]');
    if (a && hasShell()) prefetch(a.href).catch(() => {});
  }, { passive: true });

  // Botón "atrás" / "adelante"
  addEventListener('popstate', (e) => {
    if (hasShell()) go(here(), { push: false, y: e.state && e.state.y });
  });

  // Formularios: se envían con fetch, se sigue la redirección y se cambia solo la vista
  document.addEventListener('submit', async (e) => {
    const f = e.target;
    if (e.defaultPrevented || !(f instanceof HTMLFormElement) || 'native' in f.dataset || !hasShell()) return;
    const sub = e.submitter;
    const method = ((sub && sub.getAttribute('formmethod')) || f.getAttribute('method') || 'get').toLowerCase();
    const action = new URL((sub && sub.getAttribute('formaction')) || f.getAttribute('action') || location.pathname, location.href);
    if (action.origin !== location.origin) return;
    e.preventDefault();

    const msg = (sub && sub.dataset.confirm) || f.dataset.confirm;
    if (msg) {
      const ok = (sub && sub.dataset.confirmOk) || f.dataset.confirmOk || 'Eliminar';
      if (!(await DL.confirm(msg, { ok }))) return;
    }

    let fd;
    try { fd = new FormData(f, sub || undefined); } catch (err) { fd = new FormData(f); }
    const params = new URLSearchParams(fd);

    if (method === 'get') {
      const q = params.toString();
      return go(action.pathname + (q ? '?' + q : ''));
    }

    const buttons = $$('button[type=submit]', f);
    buttons.forEach((b) => b.classList.add('is-busy'));
    progress(true);
    try {
      const page = await fetchPage(action.href, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: params });
      cache.clear();
      $$('input[type=password]', f).forEach((i) => { i.value = ''; });
      await show(page, { push: true, toast: (sub && sub.dataset.toast) || f.dataset.toast });
    } catch (err) {
      console.error(err);
      DL.toast('No se pudo conectar. Revisa tu internet e inténtalo de nuevo.', 'error');
    } finally {
      buttons.forEach((b) => b.classList.remove('is-busy'));
      progress(false);
    }
  });

  /* ---------- Arranque ---------- */
  history.scrollRestoration = 'manual';
  addEventListener('pagehide', () => { try { history.replaceState({ y: scrollY }, ''); } catch (e) { /* nada */ } });
  DL.ready(() => {
    setActive(location.pathname);
    avisarError();
    if (history.state && history.state.y) scrollTo(0, history.state.y);
    // Calienta FullCalendar en tiempo libre para que la Agenda abra al instante desde cualquier vista
    if (hasShell() && 'requestIdleCallback' in window) requestIdleCallback(() => DL.load(DL.FC).catch(() => {}), { timeout: 4000 });
  });
})();
