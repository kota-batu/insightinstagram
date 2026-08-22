/******************************************************************
 * PROJECT      : Social Media Analytics Center
 * MODULE       : Frontend - Web App
 * FILE         : input-import.js
 * VERSION      : v1.0.0
 * AUTHOR       : Jimmy Team (dibantu Claude)
 * CREATED      : 2026-08-19
 * LAST UPDATE  : 2026-08-19
 *
 * DESCRIPTION
 * ----------------------------------------------------------------
 * Logika halaman Import Data (input-import.html). Alur: tempel
 * teks mentah Instagram Insight -> Parse & Preview -> cek tabel ->
 * Simpan. Dipisah dari input.js v1.0.0 sebagai bagian dari
 * restrukturisasi arsitektur halaman terpisah (bukan tab).
 ******************************************************************/

/******************************************************************
 * VERSION HISTORY
 * ----------------------------------------------------------------
 *
 * v1.0.0
 * - Initial Release.
 * - renderPreviewTable, handlePreviewParse, handleSaveImport,
 *   initInputImportPage.
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
 * - input-import.html
 *
 ******************************************************************/

/******************************************************************
 * CONSTANTS
 * ----------------------------------------------------------------
 * Tidak ada konstanta khusus untuk file ini.
 ******************************************************************/

/******************************************************************
 * CONFIGURATION
 * ----------------------------------------------------------------
 * Tidak ada konfigurasi environment tambahan untuk file ini.
 ******************************************************************/

/******************************************************************
 * SHARED STATE
 * ----------------------------------------------------------------
 * Payload hasil parse terakhir, dipakai saat tombol Simpan diklik.
 ******************************************************************/

let lastParsedImportPayload = null;

/******************************************************************
 * PREVIEW TABLE
 * ----------------------------------------------------------------
 * Fungsi pembuat tabel preview hasil parsing sebelum disimpan.
 ******************************************************************/

/******************************************************************
 * Function : renderPreviewTable()
 * Tujuan   : Membuat tabel HTML preview dari hasil parsePasteData,
 *            supaya user bisa mengecek sebelum menyimpan.
 ******************************************************************/
function renderPreviewTable(parsedResult) {
  const previewRows = [];

  parsedResult.MAIN.forEach(item => previewRows.push([item.originalLabel, 'MAIN', item.oldValue, item.newValue]));
  parsedResult.REACH_BY_TYPE.forEach(item => previewRows.push([`${item.contentType} - ${item.audienceType}`, 'REACH_BY_TYPE', item.oldValue, item.newValue]));
  parsedResult.ENGAGEMENT.forEach(item => previewRows.push([`${item.contentType} - ${item.metric}`, 'ENGAGEMENT', item.oldValue, item.newValue]));
  parsedResult.AUDIENCE_AGE.forEach(item => previewRows.push([`${item.gender} ${item.ageRange}`, 'AUDIENCE_AGE', item.oldValue, item.newValue]));
  parsedResult.ACTIVITY.forEach(item => previewRows.push([item.timeSlot, 'ACTIVITY', item.oldValue, item.newValue]));

  const growth = parsedResult.GROWTH;
  if (growth.percent[0] !== null || growth.percent[1] !== null) {
    previewRows.push(['Growth %', 'FOLLOWER_GROWTH', growth.percent[0], growth.percent[1]]);
    previewRows.push(['Total Follower', 'FOLLOWER_GROWTH', growth.totalFollower[0], growth.totalFollower[1]]);
    previewRows.push(['Wanita', 'FOLLOWER_GROWTH', growth.female[0], growth.female[1]]);
    previewRows.push(['Laki-laki', 'FOLLOWER_GROWTH', growth.male[0], growth.male[1]]);
  }
  parsedResult.TOP_CONTENT.forEach(item => previewRows.push([`#${item.rank} ${item.title}`, 'TOP_CONTENT', '-', item.tag]));

  const tableBodyHtml = previewRows.map(row =>
    `<tr><td>${row[0]}</td><td>${row[1]}</td><td>${row[2] === null ? '-' : row[2]}</td><td>${row[3] === null ? '-' : row[3]}</td></tr>`
  ).join('');

  return `
    <table class="preview-table">
      <thead><tr><th>Label Asli</th><th>Tujuan Sheet</th><th>Nilai Lama</th><th>Nilai Baru</th></tr></thead>
      <tbody>${tableBodyHtml}</tbody>
    </table>
    <p class="hint">Total ${previewRows.length} baris terbaca. Cek dulu sebelum klik Simpan.</p>`;
}

/******************************************************************
 * EVENT HANDLERS
 * ----------------------------------------------------------------
 * Fungsi penangan klik tombol Parse & Preview dan Simpan.
 ******************************************************************/

/******************************************************************
 * Function : handlePreviewParse()
 * Tujuan   : Mengirim teks paste ke backend untuk di-parse,
 *            menampilkan hasilnya sebagai tabel preview.
 ******************************************************************/
async function handlePreviewParse() {
  const statusElement = document.getElementById('i-status');
  const saveButton = document.getElementById('i-save');
  const rawText = document.getElementById('i-raw').value;
  saveButton.disabled = true;

  if (!rawText.trim()) {
    setStatus(statusElement, 'Tempel data dulu.', STATUS_CLASS_ERROR);
    return;
  }

  setStatus(statusElement, 'Memproses...', '');
  try {
    const parsedResult = await apiPost(POST_ACTIONS.PREVIEW_PARSE, { raw_text: rawText });
    document.getElementById('i-preview-area').innerHTML = renderPreviewTable(parsedResult);

    lastParsedImportPayload = {
      account_id: document.getElementById('i-account').value,
      period_old_id: document.getElementById('i-period-old').value,
      period_new_id: document.getElementById('i-period-new').value,
      raw_text: rawText
    };

    saveButton.disabled = false;
    setStatus(statusElement, 'Preview siap. Cek tabel di atas, lalu klik Simpan.', STATUS_CLASS_SUCCESS);
  } catch (error) {
    console.error("[HANDLE_PREVIEW_PARSE]", error);
    setStatus(statusElement, 'Gagal parse: ' + error.message, STATUS_CLASS_ERROR);
  }
}

/******************************************************************
 * Function : handleSaveImport()
 * Tujuan   : Menyimpan hasil parse terakhir ke database lewat
 *            action saveImport.
 ******************************************************************/
async function handleSaveImport() {
  const statusElement = document.getElementById('i-status');
  if (!lastParsedImportPayload) return;

  setStatus(statusElement, 'Menyimpan...', '');
  try {
    await apiPost(POST_ACTIONS.SAVE_IMPORT, lastParsedImportPayload);
    setStatus(statusElement, '✓ Data berhasil disimpan.', STATUS_CLASS_SUCCESS);
    document.getElementById('i-save').disabled = true;
    document.getElementById('i-preview-area').innerHTML = '';
    document.getElementById('i-raw').value = '';
  } catch (error) {
    console.error("[HANDLE_SAVE_IMPORT]", error);
    setStatus(statusElement, 'Gagal menyimpan: ' + error.message, STATUS_CLASS_ERROR);
  }
}

/******************************************************************
 * PAGE BOOTSTRAP
 * ----------------------------------------------------------------
 * Titik mulai halaman Import Data saat DOM selesai dimuat.
 ******************************************************************/

/******************************************************************
 * Function : initInputImportPage()
 * Tujuan   : Memuat master data (accounts/periods), mengisi
 *            dropdown Account/Period Lama/Period Baru dengan nilai
 *            default, lalu memasang event listener tombol Parse
 *            & Preview dan Simpan.
 ******************************************************************/
async function initInputImportPage() {
  const statusElement = document.getElementById('i-status');
  try {
    await Promise.all([loadAccounts(), loadPeriods()]);

    fillSelect(document.getElementById('i-account'), ACCOUNTS, 'account_id', 'account_name');
    fillSelect(document.getElementById('i-period-old'), PERIODS, 'period_id', 'period_name');
    fillSelect(document.getElementById('i-period-new'), PERIODS, 'period_id', 'period_name');

    if (PERIODS.length > 1) {
      document.getElementById('i-period-old').value = PERIODS[PERIODS.length - 2].period_id;
      document.getElementById('i-period-new').value = PERIODS[PERIODS.length - 1].period_id;
    }

    document.getElementById('i-preview').addEventListener('click', handlePreviewParse);
    document.getElementById('i-save').addEventListener('click', handleSaveImport);
  } catch (error) {
    console.error("[INIT_INPUT_IMPORT_PAGE]", error);
    setStatus(statusElement, 'Gagal memuat data awal: ' + error.message, STATUS_CLASS_ERROR);
  }
}

window.addEventListener('DOMContentLoaded', initInputImportPage);
