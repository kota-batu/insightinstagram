/******************************************************************
 * PROJECT      : Social Media Analytics Center
 * MODULE       : Frontend - Web App
 * FILE         : input-pcp.js
 * VERSION      : v1.1.0
 * AUTHOR       : Jimmy Team (dibantu Claude)
 * CREATED      : 2026-08-19
 * LAST UPDATE  : 2026-08-19
 *
 * DESCRIPTION
 * ----------------------------------------------------------------
 * Logika halaman Khusus PCP (input-pcp.html). Form persentase
 * bertingkat untuk akun PCP (Paradise Center Point) — Pemirsa per
 * Jenis Konten dan Demografi Usia+Gender — dihitung otomatis oleh
 * backend. Dipisah dari input.js v1.0.0 sebagai bagian dari
 * restrukturisasi arsitektur halaman terpisah.
 ******************************************************************/

/******************************************************************
 * VERSION HISTORY
 * ----------------------------------------------------------------
 *
 * v1.0.0
 * - Initial Release.
 * - renderPcpAudienceRows, handleSavePcpReach,
 *   handleSavePcpAudience, initInputPcpPage.
 *
 * v1.1.0
 * - PERIODS sekarang datang dari common.js sudah terurut dari
 *   TERBARU ke terlama, default Period dipilih dari index 0.
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
 * - input-pcp.html
 *
 ******************************************************************/

/******************************************************************
 * CONSTANTS
 * ----------------------------------------------------------------
 * account_id akun PCP dikunci (halaman ini khusus PCP saja), dan
 * daftar jenis konten / gender / rentang usia untuk tabel form.
 ******************************************************************/

const PCP_ACCOUNT_ID = 'PCP';
const PCP_REACH_CONTENT_TYPES = ['STORY', 'REELS', 'FEED'];
const PCP_AUDIENCE_GENDERS = ['WANITA', 'PRIA'];
const PCP_AUDIENCE_AGE_RANGES = ['13-17', '18-24', '25-34', '35-44', '45-54', '55-63', '65 UP'];

/******************************************************************
 * CONFIGURATION
 * ----------------------------------------------------------------
 * Tidak ada konfigurasi environment tambahan untuk file ini.
 ******************************************************************/

/******************************************************************
 * FORM RENDERING
 * ----------------------------------------------------------------
 * Fungsi pembuat baris tabel Demografi PCP.
 ******************************************************************/

/******************************************************************
 * Function : renderPcpAudienceRows()
 * Tujuan   : Merender baris tabel Demografi PCP (gender x rentang usia).
 ******************************************************************/
function renderPcpAudienceRows() {
  const rowsHtml = [];
  PCP_AUDIENCE_GENDERS.forEach(gender => {
    PCP_AUDIENCE_AGE_RANGES.forEach((ageRange, index) => {
      rowsHtml.push(`<tr>
        <td>${index === 0 ? gender : ''}</td>
        <td>${index === 0 ? `<input type="number" step="0.1" data-gender="${gender}" data-field="gender_percent">` : ''}</td>
        <td>${ageRange}</td>
        <td><input type="number" step="0.1" data-gender="${gender}" data-age="${ageRange}" data-field="age_percent_in_gender"></td>
      </tr>`);
    });
  });
  document.getElementById('p-audience-rows').innerHTML = rowsHtml.join('');
}

/******************************************************************
 * EVENT HANDLERS
 * ----------------------------------------------------------------
 * Fungsi penangan klik tombol Hitung & Simpan (Pemirsa / Demografi).
 ******************************************************************/

/******************************************************************
 * Function : handleSavePcpReach()
 * Tujuan   : Mengumpulkan input persentase Pemirsa PCP dari tabel,
 *            mengirim ke backend untuk dihitung dan disimpan.
 ******************************************************************/
async function handleSavePcpReach() {
  const statusElement = document.getElementById('p-status');
  const periodId = document.getElementById('p-period').value;
  const rows = [];

  PCP_REACH_CONTENT_TYPES.forEach(contentType => {
    const contentPercent = document.querySelector(`[data-type="${contentType}"][data-field="content_percent"]`).value;
    const followerPercent = document.querySelector(`[data-type="${contentType}"][data-field="follower_percent"]`).value;
    const nonFollowerPercent = document.querySelector(`[data-type="${contentType}"][data-field="nonfollower_percent"]`).value;
    if (contentPercent) {
      rows.push({
        account_id: PCP_ACCOUNT_ID, period_id: periodId, content_type: contentType,
        content_percent: contentPercent, follower_percent: followerPercent, nonfollower_percent: nonFollowerPercent
      });
    }
  });

  setStatus(statusElement, 'Menghitung & menyimpan...', '');
  try {
    await apiPost(POST_ACTIONS.SAVE_PCP_REACH_INPUT, { rows });
    setStatus(statusElement, '✓ Pemirsa PCP berhasil dihitung dan disimpan.', STATUS_CLASS_SUCCESS);
  } catch (error) {
    console.error("[HANDLE_SAVE_PCP_REACH]", error);
    setStatus(statusElement, 'Gagal: ' + error.message, STATUS_CLASS_ERROR);
  }
}

/******************************************************************
 * Function : handleSavePcpAudience()
 * Tujuan   : Mengumpulkan input persentase Demografi PCP dari tabel,
 *            mengirim ke backend untuk dihitung dan disimpan.
 ******************************************************************/
async function handleSavePcpAudience() {
  const statusElement = document.getElementById('p-status');
  const periodId = document.getElementById('p-period').value;
  const rows = [];

  document.querySelectorAll('#p-audience-rows [data-field="age_percent_in_gender"]').forEach(ageInput => {
    const gender = ageInput.dataset.gender;
    const ageRange = ageInput.dataset.age;
    const genderPercentInput = document.querySelector(`[data-gender="${gender}"][data-field="gender_percent"]`);
    if (ageInput.value) {
      rows.push({
        account_id: PCP_ACCOUNT_ID, period_id: periodId, gender,
        gender_percent: genderPercentInput.value, age_range: ageRange, age_percent_in_gender: ageInput.value
      });
    }
  });

  setStatus(statusElement, 'Menghitung & menyimpan...', '');
  try {
    await apiPost(POST_ACTIONS.SAVE_PCP_AUDIENCE_INPUT, { rows });
    setStatus(statusElement, '✓ Demografi PCP berhasil dihitung dan disimpan.', STATUS_CLASS_SUCCESS);
  } catch (error) {
    console.error("[HANDLE_SAVE_PCP_AUDIENCE]", error);
    setStatus(statusElement, 'Gagal: ' + error.message, STATUS_CLASS_ERROR);
  }
}

/******************************************************************
 * PAGE BOOTSTRAP
 * ----------------------------------------------------------------
 * Titik mulai halaman Khusus PCP saat DOM selesai dimuat.
 ******************************************************************/

/******************************************************************
 * Function : initInputPcpPage()
 * Tujuan   : Memuat master data periode, mengisi dropdown Period,
 *            merender tabel Demografi, lalu memasang event
 *            listener kedua tombol Hitung & Simpan.
 ******************************************************************/
async function initInputPcpPage() {
  const statusElement = document.getElementById('p-status');
  try {
    await loadPeriods();

    fillSelect(document.getElementById('p-period'), PERIODS, 'period_id', 'period_name');
    if (PERIODS.length > 0) {
      document.getElementById('p-period').value = PERIODS[0].period_id;
    }

    renderPcpAudienceRows();
    document.getElementById('p-save-reach').addEventListener('click', handleSavePcpReach);
    document.getElementById('p-save-audience').addEventListener('click', handleSavePcpAudience);
  } catch (error) {
    console.error("[INIT_INPUT_PCP_PAGE]", error);
    setStatus(statusElement, 'Gagal memuat data awal: ' + error.message, STATUS_CLASS_ERROR);
  }
}

window.addEventListener('DOMContentLoaded', initInputPcpPage);
