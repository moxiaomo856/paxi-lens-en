window.TOOL_REGISTRY ||= {};

function renderAddressConvert() {
  return `
    <div class="card">
      <div class="card-title">${t('addressConvert.title')}</div>
      <div class="tool-desc">${t('addressConvert.desc')}</div>
      <div class="form-group">
        <label class="form-label">Input address</label>
        <input type="text" id="acInput" placeholder="${t('addressConvert.inputPlaceholder')}">
      </div>
      <div class="form-group">
        <label class="form-label">${t('addressConvert.target')}</label>
        <select id="acTarget">
          <option value="paxi">paxi (Paxi Network)</option>
          <option value="cosmos">cosmos (Cosmos Hub)</option>
          <option value="osmosis">osmosis (Osmosis)</option>
          <option value="juno">juno (Juno)</option>
          <option value="stars">stars (Stargaze)</option>
        </select>
      </div>
      <button class="btn btn-primary" onclick="convertAddress()">${t('addressConvert.convertBtn')}</button>
      <div class="status-msg" id="acStatus"></div>
    </div>
  `;
}
function bindAddressConvertEvents() {}
function convertAddress() {
  const input = document.getElementById('acInput').value.trim();
  const targetPrefix = document.getElementById('acTarget').value;
  if (!input) { showStatus('acStatus', 'Please enter an address', 'warning'); return; }
  try {
    const { prefix, data } = bech32Decode(input);
    const converted = bech32Encode(targetPrefix, data);
    showStatus('acStatus', `✅ Conversion result: <code style="word-break:break-all">${converted}</code>`, 'success');
  } catch (e) {
    showStatus('acStatus', '❌ ' + e.message, 'error');
  }
}

const BECH32_ALPHABET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
const BECH32_CONST = 1;
function bech32Polymod(values) {
  const GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
  let chk = 1;
  for (const v of values) {
    const top = chk >> 25;
    chk = (chk & 0x1ffffff) << 5 ^ v;
    for (let i = 0; i < 5; i++) {
      if ((top >> i) & 1) chk ^= GEN[i];
    }
  }
  return chk;
}
function bech32HrpExpand(hrp) {
  const result = [];
  for (const ch of hrp) {
    result.push(ch.charCodeAt(0) >> 5);
  }
  result.push(0);
  for (const ch of hrp) {
    result.push(ch.charCodeAt(0) & 31);
  }
  return result;
}
function bech32VerifyChecksum(hrp, data) {
  return bech32Polymod([...bech32HrpExpand(hrp), ...data]) === BECH32_CONST;
}
function bech32CreateChecksum(hrp, data) {
  const values = [...bech32HrpExpand(hrp), ...data];
  const polymod = bech32Polymod([...values, 0, 0, 0, 0, 0, 0]) ^ BECH32_CONST;
  const result = [];
  for (let i = 0; i < 6; i++) {
    result.push((polymod >> (5 * (5 - i))) & 31);
  }
  return result;
}
function bech32Decode(str) {
  if (str.length > 90) throw new Error('Address too long (over 90 characters)');
  const separatorIdx = str.lastIndexOf('1');
  if (separatorIdx === -1 || separatorIdx === 0) throw new Error('Invalid Bech32 format');
  const prefix = str.slice(0, separatorIdx);
  const dataStr = str.slice(separatorIdx + 1);
  if (dataStr.length < 6) throw new Error('Data part too short');
  const data = [];
  for (const ch of dataStr) {
    const idx = BECH32_ALPHABET.indexOf(ch.toLowerCase());
    if (idx === -1) throw new Error('Invalid character: ' + ch);
    data.push(idx);
  }
  if (!bech32VerifyChecksum(prefix, data)) {
    throw new Error('Bech32 checksum verification failed — invalid address');
  }
  const dataPart = data.slice(0, -6);
  const bytes = convertBits(dataPart, 5, 8, false);
  return { prefix, data: bytes };
}
function bech32Encode(prefix, bytes) {
  const data = convertBits(bytes, 8, 5, true);
  const checksum = bech32CreateChecksum(prefix, data);
  let result = prefix + '1';
  for (const w of [...data, ...checksum]) {
    result += BECH32_ALPHABET[w];
  }
  return result;
}
function convertBits(data, fromBits, toBits, pad) {
  let acc = 0;
  let bits = 0;
  const result = [];
  const maxv = (1 << toBits) - 1;
  for (const value of data) {
    if (value < 0 || (value >> fromBits) !== 0) {
      throw new Error('Value out of range');
    }
    acc = (acc << fromBits) | value;
    bits += fromBits;
    while (bits >= toBits) {
      bits -= toBits;
      result.push((acc >> bits) & maxv);
    }
  }
  if (pad) {
    if (bits > 0) result.push((acc << (toBits - bits)) & maxv);
  } else if (bits >= fromBits || ((acc << (toBits - bits)) & maxv)) {
    throw new Error('Data has leftover padding bits, possibly corrupted');
  }
  return result;
}

window.TOOL_REGISTRY['address-convert'] = { render: renderAddressConvert, bind: bindAddressConvertEvents };
