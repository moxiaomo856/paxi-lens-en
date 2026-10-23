window.TOOL_REGISTRY ||= {};

const AB_DICT = {
  en: {
    title: 'Address Book',
    desc: 'Save frequently used Paxi addresses locally in your browser.',
    addBtn: 'Add',
    exportBtn: 'Export',
    importBtn: 'Import',
    name: 'Name',
    address: 'Address',
    note: 'Note',
    search: 'Search name or address...',
    empty: 'No saved addresses',
    invalidAddr: 'Invalid address format',
    added: 'Added',
    deleted: 'Deleted',
    exported: 'Exported',
    imported: 'Imported',
    confirmDel: 'Delete this address?'
  }
};

const abPt = (k, ...a) => {
  const lang = (typeof currentLang !== 'undefined' && currentLang === 'en') ? 'en' : 'zh';
  let v = AB_DICT[lang][k];
  if (v === undefined) v = AB_DICT.en[k];
  return typeof v === 'function' ? v(...a) : v;
};

const AB_KEY = 'paxi_address_book';

function loadAb() {
  try {
    const raw = localStorage.getItem(AB_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    return [];
  }
}

function saveAb(list) {
  localStorage.setItem(AB_KEY, JSON.stringify(list));
}

function renderAddressBook() {
  return `
    <div class="card">
      <div class="card-title">${abPt('title')}</div>
      <div class="tool-desc">${abPt('desc')}</div>
      <div class="info-box">
        ${abPt('desc')}
      </div>
      <div class="form-group">
        <input id="abSearch" class="input" placeholder="${abPt('search')}" oninput="renderAbList()" />
      </div>
      <div class="form-group" style="display:flex;gap:8px;flex-wrap:wrap;align-items:flex-end;">
        <div style="flex:1;min-width:120px;">
          <label class="form-label">${abPt('name')}</label>
          <input id="abName" class="input" placeholder="${abPt('name')}" />
        </div>
        <div style="flex:2;min-width:200px;">
          <label class="form-label">${abPt('address')}</label>
          <input id="abAddr" class="input" placeholder="paxi1..." />
        </div>
        <div style="flex:1;min-width:120px;">
          <label class="form-label">${abPt('note')}</label>
          <input id="abNote" class="input" placeholder="${abPt('note')}" />
        </div>
        <button class="btn btn-primary" onclick="abAdd()">${abPt('addBtn')}</button>
      </div>
      <div id="abList"></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;">
        <button class="btn btn-outline btn-sm" onclick="abExport()">${abPt('exportBtn')}</button>
        <label class="btn btn-outline btn-sm" style="cursor:pointer;">
          ${abPt('importBtn')}
          <input type="file" accept="application/json,.json" style="display:none;" onchange="abImport(this)" />
        </label>
      </div>
      <div class="status-msg" id="abStatus"></div>
    </div>
  `;
}

function bindAddressBook() {}

function renderAbList() {
  const listEl = document.getElementById('abList');
  if (!listEl) return;
  const list = loadAb();
  const q = (document.getElementById('abSearch')?.value || '').toLowerCase().trim();
  const filtered = q
    ? list.filter(c => (c.name || '').toLowerCase().includes(q) || (c.address || '').toLowerCase().includes(q))
    : list;

  if (filtered.length === 0) {
    listEl.innerHTML = `<div style="padding:16px;text-align:center;color:var(--text-muted);">${q ? abPt('empty') : abPt('empty')}</div>`;
    return;
  }

  const rows = filtered.map((c, i) => {
    const full = list.indexOf(c);
    const shortAddr = c.address.length > 16 ? c.address.slice(0, 10) + '…' + c.address.slice(-6) : c.address;
    return `
      <div class="ab-row" style="display:flex;gap:10px;align-items:center;padding:10px;border:1px solid var(--border);border-radius:8px;margin-bottom:8px;">
        <div style="flex:1;min-width:0;">
          <div style="font-weight:600;">${escapeHtml(c.name)}</div>
          <div style="font-family:monospace;font-size:12px;color:var(--text-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${escapeHtml(c.address)}">${escapeHtml(shortAddr)}</div>
          ${c.note ? `<div style="font-size:12px;color:var(--text-muted);margin-top:2px;">${escapeHtml(c.note)}</div>` : ''}
        </div>
        <button class="btn btn-sm btn-outline" onclick="abCopy(${full})">Copy</button>
        <button class="btn btn-sm btn-outline" onclick="abDelete(${full})">Delete</button>
      </div>`;
  }).join('');

  listEl.innerHTML = rows;
}

function abCopy(index) {
  const list = loadAb();
  const c = list[index];
  if (!c) return;
  copyToClipboard(c.address);
  showToast(abPt('address') + ' ' + c.address.slice(0, 10) + '… ' + 'copied');
}

function abDelete(index) {
  if (!confirm(abPt('confirmDel'))) return;
  const list = loadAb();
  list.splice(index, 1);
  saveAb(list);
  renderAbList();
  showToast(abPt('deleted'));
}

function abAdd() {
  const nameEl = document.getElementById('abName');
  const addrEl = document.getElementById('abAddr');
  const noteEl = document.getElementById('abNote');
  const statusEl = document.getElementById('abStatus');
  const name = nameEl.value.trim();
  const address = addrEl.value.trim();
  const note = noteEl.value.trim();

  if (!name) {
    showStatus('abStatus', abPt('name') + ' ' + '?', 'error');
    return;
  }
  if (!/^paxi1[0-9a-z]{38}$/.test(address)) {
    showStatus('abStatus', abPt('invalidAddr'), 'error');
    return;
  }

  const list = loadAb();
  if (list.some(c => c.address === address)) {
    showStatus('abStatus', abPt('invalidAddr'), 'error');
    return;
  }
  list.push({ name, address, note });
  saveAb(list);
  nameEl.value = '';
  addrEl.value = '';
  noteEl.value = '';
  renderAbList();
  showStatus('abStatus', abPt('added'), 'success');
  showToast(abPt('added'));
}

function abExport() {
  const list = loadAb();
  const blob = new Blob([JSON.stringify(list, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'paxi_address_book.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  const statusEl = document.getElementById('abStatus');
  if (statusEl) showStatus('abStatus', abPt('exported'), 'success');
  showToast(abPt('exported'));
}

function abImport(fileInput) {
  const file = fileInput.files && fileInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const data = JSON.parse(e.target.result);
      if (!Array.isArray(data)) throw new Error('not array');
      const list = loadAb();
      const seen = new Set(list.map(c => c.address));
      let added = 0;
      for (const c of data) {
        if (c && typeof c.address === 'string' && /^paxi1[0-9a-z]{38}$/.test(c.address) && !seen.has(c.address)) {
          list.push({ name: c.name || '', address: c.address, note: c.note || '' });
          seen.add(c.address);
          added++;
        }
      }
      saveAb(list);
      renderAbList();
      showStatus('abStatus', abPt('imported') + (added ? ' (' + added + ')' : ''), 'success');
      showToast(abPt('imported'));
    } catch (err) {
      showStatus('abStatus', 'Invalid file', 'error');
    }
    fileInput.value = '';
  };
  reader.readAsText(file);
}

window.PaxiAddressBook = {
  getContacts: () => loadAb(),
  addContact: (c) => {
    if (!c || typeof c.address !== 'string' || !/^paxi1[0-9a-z]{38}$/.test(c.address)) return false;
    const list = loadAb();
    if (list.some(x => x.address === c.address)) return false;
    list.push({ name: c.name || '', address: c.address, note: c.note || '' });
    saveAb(list);
    return true;
  }
};

window.TOOL_REGISTRY['address-book'] = { render: renderAddressBook, bind: bindAddressBook };
