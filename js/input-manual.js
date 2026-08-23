/******************************************************************
 * PROJECT      : Social Media Analytics Center
 * MODULE       : Frontend - Web App
 * FILE         : input-manual.js
 * VERSION      : v2.1.0
 * AUTHOR       : Jimmy Team (dibantu Claude)
 * CREATED      : 2026-08-19
 * LAST UPDATE  : 2026-08-19
 *
 * DESCRIPTION
 * ----------------------------------------------------------------
 * Logika halaman Input Manual (input-manual.html) — form lengkap
 * satu periode. Field Reach/Interaksi/Gender/Usia punya toggle
 * Angka/Persentase, dikonversi ke angka asli di client sebelum
 * dikirim. Konten Populer sekarang membawa Link + insight per
 * konten (Like/Komen/Posting Ulang/Bagikan/Simpan). Ada section
 * baru Lokasi Populer (5 negara/lokasi audiens terpopuler).
 ******************************************************************/

/******************************************************************
 * VERSION HISTORY
 * ----------------------------------------------------------------
 *
 * v1.0.0
 * - Initial Release. Form per-baris via dropdown Sheet Tujuan.
 *
 * v2.0.0 — REDESIGN TOTAL
 * - Diganti jadi form penuh: buildMainPayload, buildReachByTypePayload,
 *   buildTopContentPayload, buildEngagementPayload,
 *   buildGrowthAndAudiencePayload, buildActivityPayload,
 *   validateForm, handleSaveAll.
 *
 * v2.1.0
 * - renderTopContentRows() dan buildTopContentPayload() dirombak:
 *   field Tag diganti Link, ditambah 5 field insight per konten
 *   (Like, Komen, Posting Ulang, Bagikan, Simpan).
 * - Ditambahkan renderTopLocationRows() dan
 *   buildTopLocationsPayload() untuk section baru Lokasi Populer.
 * - handleSaveAll() menyertakan top_locations di payload.
 * - Tidak ada perubahan pada buildEngagementPayload() dan bagian
 *   Rentang Usia — ID field HTML tetap sama meskipun tampilannya
 *   direstrukturisasi di input-manual.html v2.1.0.
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
 * Jumlah baris tetap Konten Populer, Lokasi Populer, & Jam Aktif
 * awal, daftar jenis konten/metric Engagement, dan daftar rentang
 * usia.
 ******************************************************************/

const TOP_CONTENT_ROW_COUNT = 5;
const TOP_LOCATION_ROW_COUNT = 5;
const DEFAULT_ACTIVITY_ROW_COUNT = 5;

const TOP_CONTENT_INSIGHT_METRICS = [
  ['like', 'Like'], ['komen', 'Komen'], ['posting_ulang', 'Posting Ulang'],
  ['bagikan', 'Bagikan'], ['simpan', 'Simpan']
];

const ENGAGEMENT_CONTENT_TYPE_KEYS = [['reels', 'REELS'], ['feed', 'FEED'], ['story', 'STORY'], ['live', 'LIVE']];
const ENGAGEMENT_METRIC_KEYS = [['like', 'LIKE'], ['komen', 'KOMEN'], ['posting_ulang', 'POSTING_ULANG'], ['bagikan', 'BAGIKAN'], ['simpan', 'SIMPAN'], ['balasan', 'BALASAN']];
const REACH_CONTENT_TYPE_KEYS = [['story', 'STORY'], ['reels', 'REELS'], ['feed', 'FEED']];
const AGE_RANGE_KEYS = ['13-17', '18-24', '25-34', '35-44', '45-54', '55-63', '65-up'];
const AGE_RANGE_LABELS = { '13-17': '13-17', '18-24': '18-24', '25-34': '25-34', '35-44': '35-44', '45-54': '45-54', '55-63': '55-63', '65-up': '65 UP' };

const MODE_PERCENT = 'PERCENT';

/******************************************************************
 * CONFIGURATION
 * ----------------------------------------------------------------
 * Tidak ada konfigurasi environment tambahan untuk file ini.
 ******************************************************************/

/******************************************************************
 * FORM VALUE HELPERS
 * ----------------------------------------------------------------
 * Fungsi bantu baca nilai input, mengembalikan null kalau kosong
 * (supaya field kosong tidak ikut terkirim / tidak dianggap 0).
 ******************************************************************/

/******************************************************************
 * Function : getInputValue()
 * Tujuan   : Membaca nilai input number berdasarkan id, null kalau
 *            kosong.
 ******************************************************************/
function getInputValue(elementId) {
  const element = document.getElementById(elementId);
  if (!element || element.value.trim() === '') return null;
  return parseFloat(element.value);
}

/******************************************************************
 * Function : getSelectedMode()
 * Tujuan   : Membaca nilai radio button mode (Angka/Persentase)
 *            berdasarkan nama grupnya.
 ******************************************************************/
function getSelectedMode(radioGroupName) {
  const checkedRadio = document.querySelector(`input[name="${radioGroupName}"]:checked`);
  return checkedRadio ? checkedRadio.value : 'COUNT';
}

/******************************************************************
 * DYNAMIC ROW RENDERING
 * ----------------------------------------------------------------
 * Fungsi pembuat baris Konten Populer (tetap 5), Lokasi Populer
 * (tetap 5), dan Jam Aktif (dinamis, bisa ditambah/dihapus).
 ******************************************************************/

/******************************************************************
 * Function : renderTopContentRows()
 * Tujuan   : Merender 5 blok form Konten Populer — Judul, Link,
 *            dan 5 insight (Like/Komen/Posting Ulang/Bagikan/Simpan).
 ******************************************************************/
function renderTopContentRows() {
  const container = document.getElementById('mf-top-content-rows');
  let blocksHtml = '';
  for (let rank = 1; rank <= TOP_CONTENT_ROW_COUNT; rank++) {
    const insightFieldsHtml = TOP_CONTENT_INSIGHT_METRICS.map(([metricKey, metricLabel]) =>
      `<label>${metricLabel}<input type="number" id="mf-top-${metricKey}-${rank}"></label>`
    ).join('');

    blocksHtml += `
      <div class="top-content-block">
        <div class="top-content-header">
          <span class="rank-label">#${rank}</span>
          <label>Judul<input type="text" id="mf-top-title-${rank}"></label>
          <label>Link<input type="text" id="mf-top-link-${rank}" placeholder="https://instagram.com/..."></label>
        </div>
        <div class="field-grid five-col">${insightFieldsHtml}</div>
      </div>`;
  }
  container.innerHTML = blocksHtml;
}

/******************************************************************
 * Function : renderTopLocationRows()
 * Tujuan   : Merender 5 baris form Lokasi Populer — Nama Negara +
 *            Persentase.
 ******************************************************************/
function renderTopLocationRows() {
  const container = document.getElementById('mf-top-location-rows');
  let rowsHtml = '';
  for (let rank = 1; rank <= TOP_LOCATION_ROW_COUNT; rank++) {
    rowsHtml += `<div class="field-grid top-location-row">
      <span class="rank-label">#${rank}</span>
      <label>Nama Negara<input type="text" id="mf-loc-name-${rank}"></label>
      <label>Persentase (%)<input type="number" step="0.01" id="mf-loc-percent-${rank}"></label>
    </div>`;
  }
  container.innerHTML = rowsHtml;
}

/******************************************************************
 * Function : addActivityRow()
 * Tujuan   : Menambahkan satu baris form Jam Aktif (Jam + Audiens
 *            Aktif + tombol hapus baris).
 ******************************************************************/
function addActivityRow(timeSlotValue, activeAudienceValue) {
  const container = document.getElementById('mf-activity-rows');
  const rowDiv = document.createElement('div');
  rowDiv.className = 'activity-row';
  rowDiv.innerHTML = `
    <input type="text" placeholder="Jam (contoh: 9 SIANG)" class="mf-activity-time" value="${timeSlotValue || ''}">
    <input type="number" placeholder="Audiens Aktif" class="mf-activity-value" value="${activeAudienceValue !== undefined && activeAudienceValue !== null ? activeAudienceValue : ''}">
    <button type="button" class="btn-remove-row">✕</button>
  `;
  container.appendChild(rowDiv);
  rowDiv.querySelector('.btn-remove-row').addEventListener('click', () => rowDiv.remove());
}

/******************************************************************
 * Function : initActivityRows()
 * Tujuan   : Mengisi baris awal Jam Aktif (kosong, siap diisi) dan
 *            memasang tombol Tambah Jam.
 ******************************************************************/
function initActivityRows() {
  for (let i = 0; i < DEFAULT_ACTIVITY_ROW_COUNT; i++) addActivityRow();
  document.getElementById('mf-activity-add').addEventListener('click', () => addActivityRow());
}

/******************************************************************
 * PAYLOAD BUILDERS
 * ----------------------------------------------------------------
 * Fungsi pengumpul nilai form jadi payload siap kirim ke backend,
 * termasuk konversi persen ke angka untuk field yang mode-nya
 * Persentase.
 ******************************************************************/

/******************************************************************
 * Function : buildMainPayload()
 * Tujuan   : Mengumpulkan field sheet MAIN. Reach dan Interaksi
 *            Follower/Non-Follower dikonversi dari persen ke angka
 *            kalau mode-nya Persentase (base: Tayangan / Interaksi).
 ******************************************************************/
function buildMainPayload() {
  const main = {};
  const tayangan = getInputValue('mf-tayangan');
  const interaksi = getInputValue('mf-interaksi');

  if (tayangan !== null) main.TAYANGAN = tayangan;
  const pengikutBersih = getInputValue('mf-pengikut-bersih');
  if (pengikutBersih !== null) main.PENGIKUT_BERSIH = pengikutBersih;
  const followerBaru = getInputValue('mf-follower-baru');
  if (followerBaru !== null) main.FOLLOWER_BARU = followerBaru;
  const unfollow = getInputValue('mf-unfollow');
  if (unfollow !== null) main.UNFOLLOW = unfollow;
  if (interaksi !== null) main.INTERAKSI = interaksi;

  const reachMode = getSelectedMode('mf-reach-mode');
  const reachFollowerRaw = getInputValue('mf-reach-follower');
  const reachNonFollowerRaw = getInputValue('mf-reach-nonfollower');
  if (reachFollowerRaw !== null) {
    main.FOLLOWER_REACH = reachMode === MODE_PERCENT ? Math.round(tayangan * reachFollowerRaw / 100) : reachFollowerRaw;
  }
  if (reachNonFollowerRaw !== null) {
    main.NON_FOLLOWER_REACH = reachMode === MODE_PERCENT ? Math.round(tayangan * reachNonFollowerRaw / 100) : reachNonFollowerRaw;
  }

  const interaksiMode = getSelectedMode('mf-interaksi-mode');
  const interaksiFollowerRaw = getInputValue('mf-interaksi-follower');
  const interaksiNonFollowerRaw = getInputValue('mf-interaksi-nonfollower');
  if (interaksiFollowerRaw !== null) {
    main.INTERAKSI_FOLLOWER = interaksiMode === MODE_PERCENT ? Math.round(interaksi * interaksiFollowerRaw / 100) : interaksiFollowerRaw;
  }
  if (interaksiNonFollowerRaw !== null) {
    main.INTERAKSI_NON_FOLLOWER = interaksiMode === MODE_PERCENT ? Math.round(interaksi * interaksiNonFollowerRaw / 100) : interaksiNonFollowerRaw;
  }

  return main;
}

/******************************************************************
 * Function : buildReachByTypePayload()
 * Tujuan   : Mengumpulkan field Pemirsa + Story/Reels/Feed
 *            Follower/Non-Follower jadi array baris REACH_BY_TYPE.
 ******************************************************************/
function buildReachByTypePayload() {
  const rows = [];
  const pemirsa = getInputValue('mf-pemirsa');
  if (pemirsa !== null) rows.push({ content_type: 'PEMIRSA', audience_type: 'TOTAL', value: pemirsa });

  REACH_CONTENT_TYPE_KEYS.forEach(([idKey, label]) => {
    const followerValue = getInputValue(`mf-${idKey}-follower`);
    const nonFollowerValue = getInputValue(`mf-${idKey}-nonfollower`);
    if (followerValue !== null) rows.push({ content_type: label, audience_type: 'FOLLOWER', value: followerValue });
    if (nonFollowerValue !== null) rows.push({ content_type: label, audience_type: 'NON_FOLLOWER', value: nonFollowerValue });
  });

  return rows;
}

/******************************************************************
 * Function : buildTopContentPayload()
 * Tujuan   : Mengumpulkan 5 blok form Konten Populer (Judul, Link,
 *            insight Like/Komen/Posting Ulang/Bagikan/Simpan).
 *            Hanya baris yang Judul-nya diisi yang dikirim.
 ******************************************************************/
function buildTopContentPayload() {
  const rows = [];
  for (let rank = 1; rank <= TOP_CONTENT_ROW_COUNT; rank++) {
    const title = document.getElementById(`mf-top-title-${rank}`).value.trim();
    if (!title) continue;

    const link = document.getElementById(`mf-top-link-${rank}`).value.trim();
    const row = { rank, title, link };
    TOP_CONTENT_INSIGHT_METRICS.forEach(([metricKey]) => {
      const value = getInputValue(`mf-top-${metricKey}-${rank}`);
      if (value !== null) row[metricKey] = value;
    });
    rows.push(row);
  }
  return rows;
}

/******************************************************************
 * Function : buildTopLocationsPayload()
 * Tujuan   : Mengumpulkan 5 baris form Lokasi Populer (Nama Negara
 *            + Persentase). Hanya baris yang nama negaranya diisi
 *            yang dikirim.
 ******************************************************************/
function buildTopLocationsPayload() {
  const rows = [];
  for (let rank = 1; rank <= TOP_LOCATION_ROW_COUNT; rank++) {
    const locationName = document.getElementById(`mf-loc-name-${rank}`).value.trim();
    if (!locationName) continue;

    const percentage = getInputValue(`mf-loc-percent-${rank}`);
    rows.push({ rank, location_name: locationName, percentage: percentage === null ? '' : percentage });
  }
  return rows;
}

/******************************************************************
 * Function : buildEngagementPayload()
 * Tujuan   : Mengumpulkan seluruh field Engagement (4 jenis konten
 *            x 6 metric) jadi array baris ENGAGEMENT. ID field
 *            tidak berubah meskipun tampilan direstrukturisasi
 *            jadi per-metrik di HTML v2.1.0.
 ******************************************************************/
function buildEngagementPayload() {
  const rows = [];
  ENGAGEMENT_CONTENT_TYPE_KEYS.forEach(([typeKey, typeLabel]) => {
    ENGAGEMENT_METRIC_KEYS.forEach(([metricKey, metricLabel]) => {
      const value = getInputValue(`mf-eng-${typeKey}-${metricKey}`);
      if (value !== null) rows.push({ content_type: typeLabel, metric: metricLabel, value });
    });
  });
  return rows;
}

/******************************************************************
 * Function : buildGrowthAndAudiencePayload()
 * Tujuan   : Mengumpulkan FOLLOWER_GROWTH dan AUDIENCE_AGE. Gender
 *            dan Rentang Usia dikonversi dari persen ke angka kalau
 *            mode-nya Persentase (base: Total Follower untuk
 *            gender, jumlah gender hasil hitung untuk usia).
 ******************************************************************/
function buildGrowthAndAudiencePayload() {
  const growthPercent = getInputValue('mf-growth-percent');
  const totalFollower = getInputValue('mf-total-follower');
  const genderMode = getSelectedMode('mf-gender-mode');
  const wanitaRaw = getInputValue('mf-wanita');
  const lakilakiRaw = getInputValue('mf-lakilaki');

  let followerGrowth = null;
  let wanitaCount = null;
  let lakilakiCount = null;

  if (growthPercent !== null || totalFollower !== null || wanitaRaw !== null || lakilakiRaw !== null) {
    wanitaCount = wanitaRaw === null ? null : (genderMode === MODE_PERCENT ? Math.round(totalFollower * wanitaRaw / 100) : wanitaRaw);
    lakilakiCount = lakilakiRaw === null ? null : (genderMode === MODE_PERCENT ? Math.round(totalFollower * lakilakiRaw / 100) : lakilakiRaw);
    followerGrowth = {
      growth_percent: growthPercent,
      total_follower: totalFollower,
      female_total: wanitaCount,
      male_total: lakilakiCount
    };
  }

  const audienceRows = [];
  AGE_RANGE_KEYS.forEach(ageKey => {
    const ageLabel = AGE_RANGE_LABELS[ageKey];

    const wanitaAgeRaw = getInputValue(`mf-age-wanita-${ageKey}`);
    if (wanitaAgeRaw !== null) {
      const value = genderMode === MODE_PERCENT && wanitaCount !== null ? Math.round(wanitaCount * wanitaAgeRaw / 100) : wanitaAgeRaw;
      audienceRows.push({ gender: 'WANITA', age_range: ageLabel, value });
    }

    const priaAgeRaw = getInputValue(`mf-age-pria-${ageKey}`);
    if (priaAgeRaw !== null) {
      const value = genderMode === MODE_PERCENT && lakilakiCount !== null ? Math.round(lakilakiCount * priaAgeRaw / 100) : priaAgeRaw;
      audienceRows.push({ gender: 'PRIA', age_range: ageLabel, value });
    }
  });

  return { followerGrowth, audienceRows };
}

/******************************************************************
 * Function : buildActivityPayload()
 * Tujuan   : Mengumpulkan seluruh baris Jam Aktif yang diisi
 *            (Jam + Audiens Aktif keduanya wajib diisi per baris).
 ******************************************************************/
function buildActivityPayload() {
  const rows = [];
  document.querySelectorAll('#mf-activity-rows .activity-row').forEach(rowElement => {
    const timeSlot = rowElement.querySelector('.mf-activity-time').value.trim();
    const activeAudienceRaw = rowElement.querySelector('.mf-activity-value').value;
    if (timeSlot && activeAudienceRaw !== '') {
      rows.push({ time_slot: timeSlot, active_audience: parseFloat(activeAudienceRaw) });
    }
  });
  return rows;
}

/******************************************************************
 * VALIDATION
 * ----------------------------------------------------------------
 * Fungsi pengecek supaya mode Persentase tidak dipakai tanpa
 * base value yang dibutuhkan untuk menghitungnya.
 ******************************************************************/

/******************************************************************
 * Function : validateForm()
 * Tujuan   : Mengecek base value (Tayangan, Interaksi, Total
 *            Follower) sudah diisi kalau mode Persentase dipilih
 *            untuk field terkait. Mengembalikan pesan error, atau
 *            null kalau valid.
 ******************************************************************/
function validateForm() {
  const tayangan = getInputValue('mf-tayangan');
  const interaksi = getInputValue('mf-interaksi');
  const totalFollower = getInputValue('mf-total-follower');

  const reachMode = getSelectedMode('mf-reach-mode');
  const reachFollowerRaw = getInputValue('mf-reach-follower');
  const reachNonFollowerRaw = getInputValue('mf-reach-nonfollower');
  if (reachMode === MODE_PERCENT && tayangan === null && (reachFollowerRaw !== null || reachNonFollowerRaw !== null)) {
    return 'Mode Persentase untuk Reach butuh nilai Tayangan diisi dulu.';
  }

  const interaksiMode = getSelectedMode('mf-interaksi-mode');
  const interaksiFollowerRaw = getInputValue('mf-interaksi-follower');
  const interaksiNonFollowerRaw = getInputValue('mf-interaksi-nonfollower');
  if (interaksiMode === MODE_PERCENT && interaksi === null && (interaksiFollowerRaw !== null || interaksiNonFollowerRaw !== null)) {
    return 'Mode Persentase untuk Interaksi butuh nilai Interaksi diisi dulu.';
  }

  const genderMode = getSelectedMode('mf-gender-mode');
  const wanitaRaw = getInputValue('mf-wanita');
  const lakilakiRaw = getInputValue('mf-lakilaki');
  if (genderMode === MODE_PERCENT && totalFollower === null && (wanitaRaw !== null || lakilakiRaw !== null)) {
    return 'Mode Persentase untuk Gender butuh nilai Total Follower diisi dulu.';
  }

  return null;
}

/******************************************************************
 * EVENT HANDLERS
 * ----------------------------------------------------------------
 * Fungsi penangan klik tombol Simpan Semua.
 ******************************************************************/

/******************************************************************
 * Function : handleSaveAll()
 * Tujuan   : Validasi form, kumpulkan seluruh payload dari semua
 *            section, lalu kirim ke backend lewat action
 *            saveManualFull.
 ******************************************************************/
async function handleSaveAll() {
  const statusElement = document.getElementById('mf-status');
  const validationError = validateForm();
  if (validationError) {
    setStatus(statusElement, validationError, STATUS_CLASS_ERROR);
    return;
  }

  const growthAndAudience = buildGrowthAndAudiencePayload();
  const payload = {
    account_id: document.getElementById('mf-account').value,
    period_id: document.getElementById('mf-period').value,
    main: buildMainPayload(),
    reach_by_type: buildReachByTypePayload(),
    top_content: buildTopContentPayload(),
    top_locations: buildTopLocationsPayload(),
    engagement: buildEngagementPayload(),
    follower_growth: growthAndAudience.followerGrowth,
    audience_age: growthAndAudience.audienceRows,
    activity: buildActivityPayload()
  };

  setStatus(statusElement, 'Menyimpan...', '');
  try {
    await apiPost(POST_ACTIONS.SAVE_MANUAL_FULL, payload);
    setStatus(statusElement, '✓ Semua data berhasil disimpan.', STATUS_CLASS_SUCCESS);
  } catch (error) {
    console.error("[HANDLE_SAVE_ALL]", error);
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
 *            dropdown Account/Period, merender baris dinamis
 *            (Konten Populer, Lokasi Populer, Jam Aktif), lalu
 *            memasang event listener tombol Simpan Semua.
 ******************************************************************/
async function initInputManualPage() {
  const statusElement = document.getElementById('mf-status');
  try {
    await Promise.all([loadAccounts(), loadPeriods()]);

    fillSelect(document.getElementById('mf-account'), ACCOUNTS, 'account_id', 'account_name');
    fillSelect(document.getElementById('mf-period'), PERIODS, 'period_id', 'period_name');
    if (PERIODS.length > 0) {
      document.getElementById('mf-period').value = PERIODS[0].period_id;
    }

    renderTopContentRows();
    renderTopLocationRows();
    initActivityRows();
    document.getElementById('mf-save').addEventListener('click', handleSaveAll);
  } catch (error) {
    console.error("[INIT_INPUT_MANUAL_PAGE]", error);
    setStatus(statusElement, 'Gagal memuat data awal: ' + error.message, STATUS_CLASS_ERROR);
  }
}

window.addEventListener('DOMContentLoaded', initInputManualPage);
