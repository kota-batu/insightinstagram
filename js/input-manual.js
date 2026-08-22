/******************************************************************
 * PROJECT      : Social Media Analytics Center
 * MODULE       : Frontend - Web App
 * FILE         : input-manual.js
 * VERSION      : v1.0.0
 * AUTHOR       : Jimmy Team (dibantu Claude)
 * CREATED      : 2026-08-19
 * LAST UPDATE  : 2026-08-19
 *
 * DESCRIPTION
 * ----------------------------------------------------------------
 * Logika halaman Input Manual (input-manual.html). Form dinamis
 * yang field-nya berubah sesuai sheet tujuan (MAIN, REACH_BY_TYPE,
 * ENGAGEMENT, ACTIVITY). Dipisah dari input.js v1.0.0 sebagai
 * bagian dari restrukturisasi arsitektur halaman terpisah.
 ******************************************************************/

/******************************************************************
 * VERSION HISTORY
 * ----------------------------------------------------------------
 *
 * v1.0.0
 * - Initial Release.
 * - renderManualFields, handleSaveManual, initInputManualPage.
 *
 ******************************************************************/

/******************************************************************
 * DEPENDENCIES
 * ----------------------------------------------------------------
 *
 * Required
 * - api.js
 * - common.js
 *
 * Used By
 * - input-manual.html
 *
 ******************************************************************/

/******************************************************************
 * CONSTANTS
 * ----------------------------------------------------------------
 * Daftar field per sheet untuk form Input Manual.
 ******************************************************************/

const MANUAL_FIELD_SETS = {
  MAIN: [
    { name: 'metric', label: 'Metric', type: 'select', options: ['TAYANGAN', 'FOLLOWER_REACH', 'NON_FOLLOWER_REACH', 'PENGIKUT_BERSIH', 'FOLLOWER_BARU', 'UNFOLLOW', 'INTERAKSI', 'INTERAKSI_FOLLOWER', 'INTERAKSI_NON_FOLLOWER'] },
    { name: 'value', label: 'Value', type: 'number' }
  ],
  REACH_BY_TYPE: [
    { name: 'content_type', label: 'Jenis Konten', type: 'select', options: ['PEMIRSA', 'STORY', 'REELS', 'FEED'] },
    { name: 'audience_type', label: 'Audience', type: 'select', options: ['TOTAL', 'FOLLOWER', 'NON_FOLLOWER'] },
    { name: 'value', label: 'Value', type: 'number' }
  ],
  ENGAGEMENT: [
    { name: 'content_type', label: 'Jenis Konten', type: 'select', options: ['REELS', 'FEED', 'STORY', 'LIVE'] },
    { name: 'metric', label: 'Metric', type: 'select', options: ['LIKE', 'KOMEN', 'POSTING_ULANG', 'BAGIKAN', 'SIMPAN', 'BALASAN'] },
    { name: 'value', label: 'Value', type: 'number' }
  ],
  ACTIVITY: [
    { name: 'time_slot', label: 'Jam', type: 'text' },
    { name: 'active_audience', label: 'Audiens Aktif', type: 'number' }
  ]
};

/******************************************************************
 * CONFIGURATION
 * ----------------------------------------------------------------
 * Tidak ada konfigurasi environment tambahan untuk file ini.
 ******************************************************************/

/******************************************************************
 * FORM RENDERING
 * ----------------------------------------------------------------
 * Fungsi pembuat field form dinamis sesuai sheet tujuan.
 ******************************************************************/

/******************************************************************
 * Function : renderManualFields()
 * Tujuan   : Merender field form sesuai sheet yang dipilih di
 *            dropdown "Sheet Tujuan".
 ******************************************************************/
function renderManualFields() {
  const selectedSheet = document.getElementById('m-sheet').value;
  const fields = MANUAL_FIELD_SETS[selectedSheet] || [];

  document.getElementById('m-fields').innerHTML = fields.map(field => {
    if (field.type === 'select') {
      const optionsHtml = field.options.map(option => `<option value="${option}">${option}</option>`).join('');
      return `<label>${field.label}<select data-field="${field.name}">${optionsHtml}</select></label>`;
    }
    return `<label>${field.label}<input type="${field.type}" data-field="${field.name}"></label>`;
  }).join('');
}

/******************************************************************
 * EVENT HANDLERS
 * ----------------------------------------------------------------
 * Fungsi penangan klik tombol Simpan.
 ******************************************************************/

/******************************************************************
 * Function : handleSaveManual()
 * Tujuan   : Mengumpulkan nilai form manual dan mengirimkannya ke
 *            backend lewat action saveManual.
 ******************************************************************/
async function handleSaveManual() {
  const statusElement = document.getElementById('m-status');
  const selectedSheet = document.getElementById('m-sheet').value;
  const row = {
    account_id: document.getElementById('m-account').value,
    period_id: document.getElementById('m-period').value
  };
  document.querySelectorAll('#m-fields [data-field]').forEach(field => row[field.dataset.field] = field.value);

  setStatus(statusElement, 'Menyimpan...', '');
  try {
    await apiPost(POST_ACTIONS.SAVE_MANUAL, { sheet: selectedSheet, row });
    setStatus(statusElement, '✓ Data berhasil disimpan.', STATUS_CLASS_SUCCESS);
  } catch (error) {
    console.error("[HANDLE_SAVE_MANUAL]", error);
    setStatus(statusElement, 'Gagal menyimpan: ' + error.message, STATUS_CLASS_ERROR);
  }
}

/******************************************************************
 * PAGE BOOTSTRAP
 * ----------------------------------------------------------------
 * Titik mulai halaman Input Manual saat DOM selesai dimuat.
 ******************************************************************/

/******************************************************************
 * Function : initInputManualPage()
 * Tujuan   : Memuat master data (accounts/periods), mengisi
 *            dropdown Account/Period, merender field awal, lalu
 *            memasang event listener perubahan sheet dan tombol Simpan.
 ******************************************************************/
async function initInputManualPage() {
  const statusElement = document.getElementById('m-status');
  try {
    await Promise.all([loadAccounts(), loadPeriods()]);

    fillSelect(document.getElementById('m-account'), ACCOUNTS, 'account_id', 'account_name');
    fillSelect(document.getElementById('m-period'), PERIODS, 'period_id', 'period_name');

    if (PERIODS.length > 0) {
      document.getElementById('m-period').value = PERIODS[PERIODS.length - 1].period_id;
    }

    document.getElementById('m-sheet').addEventListener('change', renderManualFields);
    document.getElementById('m-save').addEventListener('click', handleSaveManual);
    renderManualFields();
  } catch (error) {
    console.error("[INIT_INPUT_MANUAL_PAGE]", error);
    setStatus(statusElement, 'Gagal memuat data awal: ' + error.message, STATUS_CLASS_ERROR);
  }
}

window.addEventListener('DOMContentLoaded', initInputManualPage);
