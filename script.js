// ─── Coda rapportini ───
let coda = [];
let editIndex = -1; // -1 = nuovo, >= 0 = modifica

// ─── Partecipanti ───
let partecipanti = [];

function aggiungiPartecipante() {
  const input = document.getElementById('partecipanteInput');
  const nome = input.value.trim();
  if (!nome) return;
  if (partecipanti.includes(nome)) { toast('Partecipante già aggiunto', false); return; }
  partecipanti.push(nome);
  input.value = '';
  renderPartecipanti();
}

function rimuoviPartecipante(idx) {
  partecipanti.splice(idx, 1);
  renderPartecipanti();
}

function renderPartecipanti() {
  const list = document.getElementById('partecipantiList');
  const countEl = document.getElementById('count-partecipanti');
  if (!partecipanti.length) {
    list.innerHTML = '';
    countEl.textContent = '';
    return;
  }
  countEl.textContent = partecipanti.length + ' partecipant' + (partecipanti.length === 1 ? 'e' : 'i');
  list.innerHTML = partecipanti.map((p, i) =>
    '<span class="tag-partecipante">' + p + '<button class="tag-remove" onclick="rimuoviPartecipante(' + i + ')" title="Rimuovi">✕</button></span>'
  ).join('');
}

// Enter key per aggiungere partecipante
document.addEventListener('DOMContentLoaded', function() {
  const pi = document.getElementById('partecipanteInput');
  if (pi) pi.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') { e.preventDefault(); aggiungiPartecipante(); }
  });
});

// ─── Allegati ───
const allegati = { ricambi: [], impianti: [] };

function addFiles(tipo, input) {
  const files = Array.from(input.files);
  if (!files.length) return;
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = function(e) {
      allegati[tipo].push({
        name: file.name,
        type: file.type,
        size: file.size,
        data: e.target.result
      });
      renderAllegati(tipo);
    };
    reader.readAsDataURL(file);
  });
  input.value = '';
}

function removeFile(tipo, idx) {
  allegati[tipo].splice(idx, 1);
  renderAllegati(tipo);
}

function renderAllegati(tipo) {
  const grid = document.getElementById('grid-' + tipo);
  const countEl = document.getElementById('count-' + tipo);
  const arr = allegati[tipo];

  if (!arr.length) {
    grid.innerHTML = '';
    countEl.textContent = '';
    return;
  }

  countEl.textContent = arr.length + ' allegat' + (arr.length === 1 ? 'o' : 'i');

  grid.innerHTML = arr.map((f, i) => {
    const isImage = f.type && f.type.startsWith('image/');
    const inner = isImage
      ? '<img src="' + f.data + '" alt="' + f.name + '">'
      : '<div style="display:flex;flex-direction:column;align-items:center;padding:6px"><div class="file-icon">📄</div><div class="file-name">' + f.name + '</div></div>';
    return '<div class="attach-thumb">' + inner + '<button class="attach-remove" onclick="removeFile(\'' + tipo + '\',' + i + ')" title="Rimuovi">✕</button></div>';
  }).join('');
}

function resetAllegati() {
  allegati.ricambi = [];
  allegati.impianti = [];
  renderAllegati('ricambi');
  renderAllegati('impianti');
}

function toast(msg, ok=true) {
  document.querySelectorAll('.toast').forEach(t=>t.remove());
  const t = document.createElement('div');
  t.className = 'toast ' + (ok ? 'toast-ok' : 'toast-err');
  t.textContent = msg; document.body.appendChild(t);
  setTimeout(()=>t.remove(), 4000);
}

function fmtDate(d) { return d ? new Date(d+'T00:00:00').toLocaleDateString('it-IT',{day:'2-digit',month:'2-digit',year:'numeric'}) : ''; }

function populateSelect(sel, items, placeholder) {
  sel.innerHTML = '<option value="">' + placeholder + '</option>';
  items.forEach(i => { const o = document.createElement('option'); o.value = i; o.textContent = i; sel.appendChild(o); });
}

function generateId() {
  return 'RAP-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2,4).toUpperCase();
}

function loadStorico() { try { return JSON.parse(localStorage.getItem('rapportini_op_test') || '[]'); } catch { return []; } }
function saveStorico(a) { try { localStorage.setItem('rapportini_op_test', JSON.stringify(a)); } catch {} }

function renderCoda() {
  const list = document.getElementById('queueList');
  const count = document.getElementById('queueCount');
  const actions = document.getElementById('queueActions');
  count.textContent = coda.length;

  if (!coda.length) {
    list.innerHTML = '<div class="queue-empty">Nessun rapportino in coda. Compila il form e clicca "Aggiungi".</div>';
    actions.hidden = true;
    return;
  }

  actions.hidden = false;
  list.innerHTML = coda.map((r, i) => `
    <div class="queue-item">
      <div class="queue-info">
        <div class="qi-title">${r.unita} — ${r.impianto}</div>
        <div class="qi-detail">${r.statoLavoro} · ${r.oreLavorate}h · ${r.responsabileNome}</div>
        ${r.partecipanti && r.partecipanti.length ? '<div class="qi-detail">👥 ' + r.partecipanti.join(', ') + '</div>' : ''}
        <div class="qi-id">${r.id}</div>
        ${(r.allegatiRicambi && r.allegatiRicambi.length) || (r.allegatiImpianti && r.allegatiImpianti.length) ? '<div class="queue-attach-info">' + (r.allegatiRicambi && r.allegatiRicambi.length ? '<span>📷 Ricambi: ' + r.allegatiRicambi.length + '</span>' : '') + (r.allegatiImpianti && r.allegatiImpianti.length ? '<span>📷 Impianti: ' + r.allegatiImpianti.length + '</span>' : '') + '</div>' : ''}
      </div>
      <div class="queue-actions-col">
        <button class="btn-edit" onclick="modificaRapportino(${i})" title="Modifica">✏️</button>
        <button class="btn-remove" onclick="rimuoviDaCoda(${i})" title="Rimuovi">✕</button>
      </div>
    </div>`).join('');
}

function rimuoviDaCoda(idx) {
  coda.splice(idx, 1);
  if (editIndex === idx) editIndex = -1;
  else if (editIndex > idx) editIndex--;
  renderCoda();
  toast('Rapportino rimosso dalla coda');
}

function svuotaCoda() {
  coda = [];
  editIndex = -1;
  renderCoda();
  toast('Coda svuotata');
}

// ─── Modifica rapportino dalla coda ───
function modificaRapportino(idx) {
  const r = coda[idx];
  editIndex = idx;

  document.getElementById('operatore').value = r.operatore;
  document.getElementById('data').value = r.data;
  document.getElementById('unita').value = r.unita;
  document.getElementById('impianto').value = r.impianto;
  document.getElementById('statoLavoro').value = r.statoLavoro;
  document.getElementById('oreLavorate').value = r.oreLavorate;
  document.getElementById('descrizione').value = r.descrizione;
  document.getElementById('materialiUsati').value = r.materialiUsati || '';
  document.getElementById('note').value = r.note || '';
  document.getElementById('responsabile').value = r.emailResponsabile;

  // Ripristina partecipanti
  partecipanti = r.partecipanti ? [...r.partecipanti] : [];
  renderPartecipanti();

  // Ripristina allegati
  allegati.ricambi = r.allegatiRicambi ? r.allegatiRicambi.map(a => ({...a})) : [];
  allegati.impianti = r.allegatiImpianti ? r.allegatiImpianti.map(a => ({...a})) : [];
  renderAllegati('ricambi');
  renderAllegati('impianti');

  // Cambia il bottone del form
  const btn = document.querySelector('#rapForm button[type="submit"]');
  btn.innerHTML = '✏️ Salva Modifiche';
  btn.classList.remove('btn-add');
  btn.classList.add('btn-send');

  // Scroll al form
  document.querySelector('.card').scrollIntoView({ behavior: 'smooth', block: 'start' });
  toast('Modifica il rapportino e clicca "Salva Modifiche"');
}

// Aggiungi o salva rapportino
document.getElementById('rapForm').addEventListener('submit', function(e) {
  e.preventDefault();

  const sel = document.getElementById('responsabile');
  const respNome = sel.options[sel.selectedIndex].dataset.nome || '';

  const rap = {
    id: editIndex >= 0 ? coda[editIndex].id : generateId(),
    operatore: document.getElementById('operatore').value.trim(),
    data: document.getElementById('data').value,
    unita: document.getElementById('unita').value,
    impianto: document.getElementById('impianto').value,
    statoLavoro: document.getElementById('statoLavoro').value,
    oreLavorate: document.getElementById('oreLavorate').value,
    descrizione: document.getElementById('descrizione').value.trim(),
    materialiUsati: document.getElementById('materialiUsati').value.trim(),
    note: document.getElementById('note').value.trim(),
    partecipanti: [...partecipanti],
    approvato: false,
    approvatoDa: '',
    dataApprovazione: '',
    responsabileNome: respNome,
    emailResponsabile: sel.value,
    dataInvio: new Date().toISOString(),
    allegatiRicambi: allegati.ricambi.map(a => ({name:a.name, type:a.type, size:a.size, data:a.data})),
    allegatiImpianti: allegati.impianti.map(a => ({name:a.name, type:a.type, size:a.size, data:a.data}))
  };

  if (editIndex >= 0) {
    coda[editIndex] = rap;
    toast('Rapportino modificato ✔');
    editIndex = -1;
    // Ripristina bottone
    const btn = document.querySelector('#rapForm button[type="submit"]');
    btn.innerHTML = '➕ Aggiungi Rapportino alla Coda';
    btn.classList.remove('btn-send');
    btn.classList.add('btn-add');
  } else {
    coda.push(rap);
    toast('Rapportino aggiunto alla coda (' + coda.length + ')');
  }

  renderCoda();

  // Reset solo campi lavoro, mantieni operatore/data/responsabile
  const keepOp = document.getElementById('operatore').value;
  const keepData = document.getElementById('data').value;
  const keepResp = document.getElementById('responsabile').value;

  document.getElementById('unita').value = '';
  document.getElementById('impianto').value = '';
  document.getElementById('statoLavoro').value = '';
  document.getElementById('oreLavorate').value = '';
  document.getElementById('descrizione').value = '';
  document.getElementById('materialiUsati').value = '';
  document.getElementById('note').value = '';
  partecipanti = [];
  renderPartecipanti();

  document.getElementById('operatore').value = keepOp;
  document.getElementById('data').value = keepData;
  document.getElementById('responsabile').value = keepResp;
  resetAllegati();

  document.getElementById('queueCard').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

// ─── Conferma invio ───
function confermaInvio() {
  if (!coda.length) return;
  const n = coda.length;
  document.getElementById('modalCount').textContent = n;
  document.getElementById('modalPlural').textContent = n === 1 ? 'o' : 'i';
  document.getElementById('modalConferma').hidden = false;
}

function chiudiModal() {
  document.getElementById('modalConferma').hidden = true;
}

// Chiudi modal cliccando fuori
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('modal-overlay')) chiudiModal();
});

// Scarica file .json e apri email
function scaricaEInviaFallback(jsonData, filename, operatore, dataFmt, count) {
  const blob = new Blob([jsonData], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  const subject = encodeURIComponent('Rapportini "' + operatore + '" del "' + dataFmt + '" (' + count + ' rapportin' + (count === 1 ? 'o' : 'i') + ')');
  const body = encodeURIComponent('In allegato quanto in oggetto.\n\n⚠️ RICORDA: allega il file .json scaricato a questa email prima di inviarla.');
  setTimeout(() => {
    window.location.href = 'mailto:' + TEST_EMAIL + '?subject=' + subject + '&body=' + body;
  }, 600);
  toast(count + ' rapportin' + (count === 1 ? 'o' : 'i') + ' — file scaricato, allegalo alla mail!');
}

function inviaRapportini() {
  if (!coda.length) return;

  const operatore = coda[0].operatore;
  const dataRap = coda[0].data;
  const dataFmt = fmtDate(dataRap);

  // Genera file JSON
  const jsonData = JSON.stringify(coda, null, 2);
  const count = coda.length;
  const filename = 'Rapportini_' + operatore.replace(/\s+/g, '_') + '_' + dataFmt.replace(/\//g, '.') + '.json';
  const file = new File([jsonData], filename, { type: 'application/json' });

  // Raccogli tutti gli allegati come File separati per Web Share
  const allFiles = [file];
  coda.forEach((r, ri) => {
    (r.allegatiRicambi || []).forEach((a, ai) => {
      try {
        const byteStr = atob(a.data.split(',')[1]);
        const arr = new Uint8Array(byteStr.length);
        for (let j = 0; j < byteStr.length; j++) arr[j] = byteStr.charCodeAt(j);
        allFiles.push(new File([arr], 'R' + (ri+1) + '_ricambi_' + (ai+1) + '_' + a.name, { type: a.type || 'application/octet-stream' }));
      } catch(e) {}
    });
    (r.allegatiImpianti || []).forEach((a, ai) => {
      try {
        const byteStr = atob(a.data.split(',')[1]);
        const arr = new Uint8Array(byteStr.length);
        for (let j = 0; j < byteStr.length; j++) arr[j] = byteStr.charCodeAt(j);
        allFiles.push(new File([arr], 'R' + (ri+1) + '_impianti_' + (ai+1) + '_' + a.name, { type: a.type || 'application/octet-stream' }));
      } catch(e) {}
    });
  });

  // Salva nello storico e svuota coda
  const storico = loadStorico();
  coda.forEach(r => storico.unshift(r));
  saveStorico(storico);
  coda = [];
  editIndex = -1;
  renderCoda();
  renderStorico();

  // Web Share API (Android con HTTPS)
  if (window.isSecureContext && navigator.canShare && navigator.canShare({ files: allFiles })) {
    navigator.share({
      title: 'Rapportini ' + operatore + ' del ' + dataFmt,
      text: 'In allegato ' + count + ' rapportin' + (count === 1 ? 'o' : 'i') + ' tecnic' + (count === 1 ? 'o' : 'i') + (allFiles.length > 1 ? ' + ' + (allFiles.length - 1) + ' allegat' + (allFiles.length - 1 === 1 ? 'o' : 'i') : '') + '.\n\nDestinatario: ' + TEST_EMAIL,
      files: allFiles
    }).then(() => {
      toast(count + ' rapportin' + (count === 1 ? 'o' : 'i') + ' inviati!');
    }).catch(() => {
      scaricaEInviaFallback(jsonData, filename, operatore, dataFmt, count);
    });
  } else {
    scaricaEInviaFallback(jsonData, filename, operatore, dataFmt, count);
  }
}

function renderStorico() {
  const all = loadStorico();
  const c = document.getElementById('storico');
  if (!all.length) { c.innerHTML = '<div class="empty">Nessun rapportino inviato ancora.</div>'; return; }
  c.innerHTML = all.map(r => `
    <div class="storico-item">
      <div>
        <div class="storico-info"><strong>${r.unita}</strong> — ${r.impianto}</div>
        <div class="storico-id">${r.id} · ${fmtDate(r.data)} · ${r.responsabileNome}</div>
        ${r.partecipanti && r.partecipanti.length ? '<div class="storico-id">👥 ' + r.partecipanti.join(', ') + '</div>' : ''}
      </div>
      <span class="storico-badge">Inviato</span>
    </div>`).join('');
}

// Init
populateSelect(document.getElementById('unita'), UNITA, 'Seleziona unità...');
populateSelect(document.getElementById('impianto'), IMPIANTI, 'Seleziona impianto...');
document.getElementById('data').value = new Date().toISOString().split('T')[0];
renderCoda();
renderStorico();
