/* =========================================================
   DentaLink · Asistente "Nueva cita"
   Una pregunta por pantalla, con barra de progreso que dice cuántas faltan.
   Guarda con la ruta de siempre: POST /cita/agendar (pacienteId, fecha, hora_inicio, hora_fin, motivo).
   Se abre desde cualquier vista:  <button data-wizard>  (opcional: data-fecha, data-paciente-id, data-paciente-nombre)
   ========================================================= */
(() => {
  'use strict';
  const DL = window.DL;
  if (!DL) return;
  const $ = (s, r = document) => r.querySelector(s);
  const esc = DL.esc;

  const MOTIVOS = [['Consulta de Valoracion', 'Valoración'], ['Limpieza Dental', 'Limpieza'], ['Caries / Resina', 'Caries / Resina'], ['Endodoncia', 'Endodoncia'], ['Extraccion', 'Extracción'], ['Control de Ortodoncia', 'Ortodoncia'], ['Corona / Puente', 'Corona / Puente'], ['Otro', 'Otro']];
  const DURACIONES = [[30, '30 min'], [45, '45 min'], [60, '1 hora'], [90, '1 h 30 min'], [120, '2 horas']];
  const HORAS = [];
  for (let m = 8 * 60; m < 20 * 60; m += 30) HORAS.push(m);
  const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

  const p2 = (n) => String(n).padStart(2, '0');
  const iso = (d) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
  const fromISO = (s) => new Date(s + 'T12:00:00');
  const hhmm = (m) => `${p2(Math.floor(m / 60))}:${p2(m % 60)}`;
  const toMin = (t) => { const [h, m] = String(t).split(':'); return (parseInt(h, 10) || 0) * 60 + (parseInt(m, 10) || 0); };
  const largo = (s) => fromISO(s).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
  const iniciales = (n) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((x) => x[0]).join('').toUpperCase();
  const limpiar = (s) => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  let S = null;           // estado de la sesión del asistente
  let pacientes = [];
  let citas = [];
  let cargado = false;

  const body = () => $('#wizBody');

  /* ---------- Reglas de horario ---------- */
  const activas = () => citas.filter((c) => c.fecha === S.fecha && c.estado !== 'Cancelada' && String(c.id) !== String(S.editId || ''));
  const choca = (ini, fin) => activas().some((c) => ini < toMin(c.hora_fin) && fin > toMin(c.hora_inicio));

  // Al cambiar la fecha o la hora se conserva lo ya elegido si sigue libre; si no, se pide de nuevo
  const revalidar = () => {
    if (S.hora != null && activas().some((c) => S.hora >= toMin(c.hora_inicio) && S.hora < toMin(c.hora_fin))) { S.hora = null; S.dur = 0; }
    if (S.hora != null && S.dur && (S.hora + S.dur > 24 * 60 || choca(S.hora, S.hora + S.dur))) S.dur = 0;
  };

  /* ---------- Pasos ---------- */
  const total = () => S.steps.length - 1;                 // sin contar el resumen
  const actual = () => S.steps[S.i];

  const progreso = () => {
    const t = total(), enResumen = actual() === 'resumen';
    const falta = t - S.i;
    $('#wizStepTxt').textContent = enResumen ? '¡Listo! Revisa y confirma' : (falta === 1 ? 'Última pregunta' : `Faltan ${falta} preguntas`);
    const pct = enResumen ? 100 : Math.round((S.i / t) * 100);
    $('#wizPct').textContent = pct + '%';
    $('#wizBarFill').style.transform = `scaleX(${Math.max(pct, 4) / 100})`;
    $('#wizBack').disabled = S.i === 0;
  };

  const pie = () => {
    const f = $('#wizFoot'), k = actual();
    let html = '', mostrar = false;
    if (k === 'fecha') { mostrar = true; html = `<button class="btn btn--primary btn--block" type="button" data-w="next" ${S.fecha ? '' : 'disabled'}>Continuar</button>`; }
    const cont = (ok) => `<button class="btn btn--primary btn--block" type="button" data-w="next" ${ok ? '' : 'disabled'}>Continuar</button>`;
    if (k === 'paciente' && S.pacienteId) { mostrar = true; html = cont(true); }
    if (k === 'hora' && S.hora != null) { mostrar = true; html = cont(true); }
    if (k === 'dur' && S.dur) { mostrar = true; html = cont(true); }
    if (k === 'motivo' && (S.motivoOtro || S.motivo)) { mostrar = true; html = cont(S.motivo.trim()); }
    if (k === 'resumen') { mostrar = true; html = `<button class="btn btn--primary btn--block" type="button" data-w="save" style="height:46px">${S.editId ? 'Guardar cambios' : 'Agendar cita'}</button>`; }
    f.innerHTML = html;
    f.classList.toggle('hidden', !mostrar);
  };

  const pasos = {
    fecha() {
      const hoy = iso(new Date());
      const m = S.mes;                                            // primer día del mes mostrado
      const primero = new Date(m.getFullYear(), m.getMonth(), 1);
      const dias = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
      let celdas = '';
      for (let i = 0; i < primero.getDay(); i++) celdas += '<span></span>';
      for (let d = 1; d <= dias; d++) {
        const f = `${m.getFullYear()}-${p2(m.getMonth() + 1)}-${p2(d)}`;
        const cl = ['minical__day', f === hoy ? 'is-today' : '', f === S.fecha ? 'is-selected' : '', citas.some((c) => c.fecha === f && c.estado !== 'Cancelada') ? 'has-citas' : ''].join(' ');
        celdas += `<button type="button" class="${cl}" data-fecha="${f}" ${f < hoy ? 'disabled' : ''}>${d}</button>`;
      }
      const rapidos = [['Hoy', 0], ['Mañana', 1], ['En 1 semana', 7], ['En 2 semanas', 14], ['En 1 mes', 30]].map(([t, n]) => {
        const d = new Date(); d.setDate(d.getDate() + n);
        return `<button type="button" class="chip" data-fecha="${iso(d)}" aria-pressed="${iso(d) === S.fecha}">${t}</button>`;
      }).join('');
      return `
        <h2 class="wiz__q">¿Para cuándo es la cita?</h2>
        <p class="wiz__hint">Elige un día en el calendario o escribe la fecha. Los días con un punto ya tienen citas.</p>
        <div class="chips" style="margin-bottom:14px">${rapidos}</div>
        <div class="minical">
          <div class="minical__head">
            <button type="button" class="icon-btn icon-btn--sm" data-mes="-1" aria-label="Mes anterior"><svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg></button>
            <strong>${esc(m.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' }))}</strong>
            <button type="button" class="icon-btn icon-btn--sm" data-mes="1" aria-label="Mes siguiente"><svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg></button>
          </div>
          <div class="minical__week">${DIAS.map((d) => `<span>${d}</span>`).join('')}</div>
          <div class="minical__grid">${celdas}</div>
        </div>
        <label class="field" style="margin-top:14px"><span class="field__label">Fecha</span>
          <input class="input" type="date" id="wizFecha" min="${hoy}" value="${esc(S.fecha)}"></label>
        ${S.editId && S.original ? `<label class="field" style="margin-top:12px"><span class="field__label">O sumar días a la fecha original (${esc(largo(S.original.fecha))})</span>
          <input class="input" type="number" id="wizSumar" min="1" placeholder="Ej. 22" inputmode="numeric"></label>` : ''}`;
    },

    paciente() {
      if (!cargado) return '<h2 class="wiz__q">¿Quién es el paciente?</h2><div class="skeleton" style="height:56px;margin-bottom:8px"></div><div class="skeleton" style="height:56px"></div>';
      return `
        <h2 class="wiz__q">¿Quién es el paciente?</h2>
        <label class="search" style="margin-bottom:12px"><svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input id="wizBuscar" type="search" placeholder="Buscar por nombre o teléfono" autocomplete="off" value="${esc(S.q || '')}"></label>
        <ul class="wiz__list" id="wizLista">${listaPacientes()}</ul>`;
    },

    hora() {
      const ocupado = (m) => activas().some((c) => m >= toMin(c.hora_inicio) && m < toMin(c.hora_fin));
      const slots = HORAS.map((m) => `<button type="button" class="slot${S.hora === m ? ' is-selected' : ''}" data-hora="${m}" ${ocupado(m) ? 'disabled title="Ocupado"' : ''}>${hhmm(m)}</button>`).join('');
      return `
        <h2 class="wiz__q">¿A qué hora?</h2>
        <p class="wiz__hint">${esc(largo(S.fecha))}. Los horarios ocupados aparecen deshabilitados.</p>
        <div class="slots">${slots}</div>
        <label class="field" style="margin-top:14px"><span class="field__label">¿Otra hora?</span>
          <input class="input" type="time" id="wizOtraHora" step="300" value="${S.hora != null ? hhmm(S.hora) : ''}"></label>`;
    },

    dur() {
      const lista = DURACIONES.slice();
      if (S.dur && !lista.some(([m]) => m === S.dur)) lista.unshift([S.dur, `${S.dur} min (actual)`]);
      const opts = lista.map(([min, t]) => {
        const fin = S.hora + min;
        const bad = fin > 24 * 60 || choca(S.hora, fin);
        return `<button type="button" class="opt${S.dur === min ? ' is-selected' : ''}" data-dur="${min}" ${bad ? 'disabled' : ''}><strong>${t}</strong><span>${bad ? 'Choca con otra cita' : 'Termina a las ' + hhmm(fin)}</span></button>`;
      }).join('');
      return `<h2 class="wiz__q">¿Cuánto va a durar?</h2><p class="wiz__hint">Empieza a las ${hhmm(S.hora)}.</p><div class="opts">${opts}</div>`;
    },

    motivo() {
      const opts = MOTIVOS.map(([v, t]) => {
        const sel = v === 'Otro' ? S.motivoOtro : (!S.motivoOtro && S.motivo === v);
        return `<button type="button" class="opt opt--sm${sel ? ' is-selected' : ''}" data-motivo="${esc(v)}"><strong>${esc(t)}</strong></button>`;
      }).join('');
      return `
        <h2 class="wiz__q">¿Cuál es el motivo de la consulta?</h2>
        <div class="opts opts--wrap">${opts}</div>
        <label class="field ${S.motivoOtro ? '' : 'hidden'}" style="margin-top:14px"><span class="field__label">Escribe el motivo</span>
          <input class="input" id="wizOtro" type="text" placeholder="Ej. Dolor en muela inferior" value="${esc(S.motivoOtro ? S.motivo : '')}"></label>`;
    },

    resumen() {
      const fila = (etq, val, paso) => `<div class="wiz__row"><div><small>${etq}</small><strong>${esc(val)}</strong></div>${paso && S.steps.includes(paso) ? `<button type="button" class="btn btn--ghost btn--sm" data-ir="${paso}">Cambiar</button>` : ''}</div>`;
      return `
        <h2 class="wiz__q">${S.editId ? 'Revisa los cambios' : 'Revisa y confirma'}</h2>
        <p class="wiz__hint">${S.editId && S.original ? `Antes: ${esc(largo(S.original.fecha))}, ${esc(S.original.hora)} h. ` : ''}Si algo no es correcto, usa “Cambiar”.</p>
        <div class="wiz__sum">
          ${fila('Fecha', largo(S.fecha), 'fecha')}
          ${fila('Paciente', S.pacienteNombre, 'paciente')}
          ${fila('Hora', `${hhmm(S.hora)} a ${hhmm(S.hora + S.dur)}`, 'hora')}
          ${fila('Motivo', S.motivo, 'motivo')}
        </div>`;
    }
  };

  function listaPacientes() {
    const q = limpiar(S.q || '');
    const l = pacientes.filter((p) => !q || limpiar(`${p.nombre} ${p.apellidos} ${p.telefono || ''}`).includes(q));
    if (!pacientes.length) return '<li class="empty" style="padding:28px 8px"><strong>Aún no hay pacientes</strong><span>Primero registra uno en la sección Pacientes.</span><a class="btn btn--primary btn--sm" href="/expediente">Ir a Pacientes</a></li>';
    if (!l.length) return '<li class="empty" style="padding:28px 8px"><strong>Sin resultados</strong><span>Prueba con otro nombre o teléfono.</span></li>';
    return l.map((p) => {
      const nom = `${p.nombre} ${p.apellidos}`;
      return `<li><button type="button" class="pick${String(p.id) === String(S.pacienteId) ? ' is-selected' : ''}" data-pid="${esc(p.id)}" data-pnom="${esc(nom)}"><span class="avatar avatar--soft">${esc(iniciales(nom))}</span><span><strong>${esc(nom)}</strong><small>${esc(p.telefono || '')}</small></span></button></li>`;
    }).join('');
  }

  /* ---------- Navegación entre preguntas ---------- */
  function pintar(animar = true) {
    const k = actual();
    const b = body();
    b.className = 'wiz__body' + (animar ? (S.dir > 0 ? ' go-fwd' : ' go-back') : '');
    b.innerHTML = pasos[k]();
    progreso(); pie();
    if (animar) {
      const f = b.querySelector('#wizBuscar, #wizOtro, #wizFecha');
      setTimeout(() => f && k !== 'fecha' && f.focus({ preventScroll: true }), 220);
    }
  }
  const ir = (i, dir) => { S.i = Math.max(0, Math.min(S.steps.length - 1, i)); S.dir = dir; pintar(true); };
  const siguiente = () => {
    const k = actual();
    if (k === 'fecha' && !S.fecha) return;
    if (k === 'motivo' && !S.motivo.trim()) return;
    ir(S.i + 1, 1);
  };
  const avanzarSuave = () => setTimeout(siguiente, 190);       // deja ver la selección antes de pasar

  function abrir(o = {}) {
    const hoy = iso(new Date());
    if (o.edit) return abrirEdicion(o.edit, hoy);
    const steps = ['fecha', 'paciente', 'hora', 'dur', 'motivo', 'resumen'].filter((k) => !(k === 'fecha' && o.fecha) && !(k === 'paciente' && o.pacienteId));
    S = {
      steps, i: 0, dir: 1, q: '',
      fecha: o.fecha && o.fecha >= hoy ? o.fecha : '',
      pacienteId: o.pacienteId || '', pacienteNombre: o.pacienteNombre || '',
      hora: null, dur: 0, motivo: '', motivoOtro: false, editId: null,
      mes: o.fecha ? fromISO(o.fecha) : new Date()
    };
    if (o.fecha && o.fecha < hoy) { S.steps.unshift('fecha'); }
    cargar();
  }

  // Editar una cita existente: mismas preguntas (sin paciente) y ya llenas con sus datos
  function abrirEdicion(c, hoy) {
    const ini = toMin(c.inicio || c.hora_inicio);
    const fin = toMin(c.fin || c.hora_fin);
    const motivo = String(c.motivo || '');
    const conocido = MOTIVOS.some(([v]) => v === motivo && v !== 'Otro');
    const fecha = String(c.fecha || '');
    S = {
      steps: ['fecha', 'hora', 'dur', 'motivo', 'resumen'], i: 0, dir: 1, q: '',
      editId: c.id,
      original: { fecha, hora: hhmm(ini) },
      fecha: fecha >= hoy ? fecha : '',                  // una cita vencida necesita fecha nueva
      pacienteId: c.pacienteId || '', pacienteNombre: c.paciente || c.pacienteNombre || 'Paciente',
      hora: ini, dur: fin > ini ? fin - ini : 30,
      motivo, motivoOtro: !conocido && !!motivo,
      mes: fecha >= hoy ? fromISO(fecha) : new Date()
    };
    cargar();
  }

  function cargar() {
    cargado = false;
    DL.open('wizCita');
    pintar(false);
    Promise.all([
      fetch('/api/pacientes', { credentials: 'same-origin' }).then((r) => (r.ok ? r.json() : [])).catch(() => []),
      fetch('/api/citas', { credentials: 'same-origin' }).then((r) => (r.ok ? r.json() : [])).catch(() => [])
    ]).then(([p, c]) => {
      pacientes = Array.isArray(p) ? p : []; citas = Array.isArray(c) ? c : []; cargado = true;
      if (!S || !$('#wizCita').classList.contains('open')) return;
      if (S.editId) revalidar();
      if (actual() === 'paciente' || actual() === 'fecha') pintar(false);
    });
  }
  DL.wizard = { open: abrir };

  async function guardar(btn) {
    btn.classList.add('is-busy');
    const datos = { fecha: S.fecha, hora_inicio: hhmm(S.hora), hora_fin: hhmm(S.hora + S.dur), motivo: S.motivo.trim() };
    if (!S.editId) datos.pacienteId = S.pacienteId;
    const url = S.editId ? '/cita/editar/' + encodeURIComponent(S.editId) : '/cita/agendar';
    const ERR = { 2: 'Faltan datos de la cita.', 5: 'Ese horario acaba de ocuparse con otra cita. Elige otra hora.', 6: 'La hora de fin debe ser después de la de inicio.' };
    try {
      const r = await fetch(url, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(datos) });
      if (!r.ok) throw new Error('El servidor respondió ' + r.status);
      const codigo = new URL(r.url, location.href).searchParams.get('error');
      if (codigo) {
        btn.classList.remove('is-busy');
        DL.toast(ERR[codigo] || 'No se pudo guardar la cita.', 'error');
        if (codigo === '5') {                              // recargar la agenda y regresar a elegir hora
          citas = await fetch('/api/citas', { credentials: 'same-origin' }).then((x) => x.json()).catch(() => citas);
          revalidar();
          ir(S.steps.indexOf('hora'), -1);
        }
        return;
      }
      DL.close($('#wizCita'));
      DL.toast(S.editId ? `Cita actualizada: ${largo(S.fecha)}, ${hhmm(S.hora)} h` : `Cita agendada: ${largo(S.fecha)}, ${hhmm(S.hora)} h`);
      if (DL.refresh) DL.refresh(); else location.reload();
    } catch (e) {
      console.error('[DentaLink] Error al agendar:', e);
      btn.classList.remove('is-busy');
      DL.toast('No se pudo agendar la cita. ' + (e.message || ''), 'error');
    }
  }

  /* ---------- Eventos (delegados dentro del asistente) ---------- */
  document.addEventListener('click', (e) => {
    const t = e.target;
    const w = t.closest('[data-wizard]');
    if (w) {
      e.preventDefault();
      return abrir({ fecha: w.dataset.fecha, pacienteId: w.dataset.pacienteId, pacienteNombre: w.dataset.pacienteNombre });
    }
    const modal = t.closest('#wizCita');
    if (!modal || !S) return;

    if (t.closest('#wizBack')) return ir(S.i - 1, -1);
    const b = t.closest('[data-w]');
    if (b) return b.dataset.w === 'save' ? guardar(b) : siguiente();

    const ira = t.closest('[data-ir]');
    if (ira) return ir(S.steps.indexOf(ira.dataset.ir), -1);

    const mes = t.closest('[data-mes]');
    if (mes) { S.mes = new Date(S.mes.getFullYear(), S.mes.getMonth() + Number(mes.dataset.mes), 1); return pintar(false); }

    const f = t.closest('[data-fecha]');
    if (f && !f.disabled) { S.fecha = f.dataset.fecha; S.mes = fromISO(S.fecha); revalidar(); return pintar(false); }

    const p = t.closest('[data-pid]');
    if (p) { S.pacienteId = p.dataset.pid; S.pacienteNombre = p.dataset.pnom; p.classList.add('is-selected'); return avanzarSuave(); }

    const h = t.closest('[data-hora]');
    if (h && !h.disabled) { S.hora = Number(h.dataset.hora); revalidar(); h.classList.add('is-selected'); return avanzarSuave(); }

    const d = t.closest('[data-dur]');
    if (d && !d.disabled) { S.dur = Number(d.dataset.dur); d.classList.add('is-selected'); return avanzarSuave(); }

    const m = t.closest('[data-motivo]');
    if (m) {
      const v = m.dataset.motivo;
      if (v === 'Otro') { S.motivoOtro = true; S.motivo = ''; pintar(false); const o = $('#wizOtro'); if (o) o.focus(); return; }
      S.motivoOtro = false; S.motivo = v; m.classList.add('is-selected'); return avanzarSuave();
    }
  });

  document.addEventListener('input', (e) => {
    if (!S || !e.target.closest('#wizCita')) return;
    const t = e.target;
    if (t.id === 'wizBuscar') { S.q = t.value; $('#wizLista').innerHTML = listaPacientes(); }
    if (t.id === 'wizOtro') { S.motivo = t.value; pie(); }
  });

  document.addEventListener('change', (e) => {
    if (!S || !e.target.closest('#wizCita')) return;
    const t = e.target;
    if (t.id === 'wizFecha') {
      const hoy = iso(new Date());
      if (t.value && t.value >= hoy) { S.fecha = t.value; S.mes = fromISO(S.fecha); revalidar(); pintar(false); }
      else if (t.value) DL.toast('Elige una fecha de hoy en adelante.', 'error');
    }
    if (t.id === 'wizSumar' && t.value) {
      const d = fromISO(S.original.fecha);
      d.setDate(d.getDate() + (parseInt(t.value, 10) || 0));
      const nueva = iso(d);
      if (nueva < iso(new Date())) return DL.toast('Esa fecha ya pasó. Suma más días.', 'error');
      S.fecha = nueva; S.mes = fromISO(nueva); revalidar(); pintar(false);
    }
    if (t.id === 'wizOtraHora' && t.value) {
      const m = toMin(t.value);
      if (m >= 24 * 60 - 15) return DL.toast('Elige una hora más temprana.', 'error');
      if (activas().some((c) => m >= toMin(c.hora_inicio) && m < toMin(c.hora_fin))) return DL.toast('Ese horario ya está ocupado.', 'error');
      S.hora = m; revalidar(); siguiente();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || !S || !e.target.closest || !e.target.closest('#wizCita')) return;
    if (e.target.matches('input')) { e.preventDefault(); if (actual() === 'fecha' || actual() === 'motivo') siguiente(); }
  });
})();
