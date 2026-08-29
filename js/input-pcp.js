/******************************************************************
 * PROJECT      : Social Media Analytics Center
 * MODULE       : Frontend - Web App
 * FILE         : input-pcp.js
 * VERSION      : v2.0.0
 * AUTHOR       : Jimmy Team (dibantu Claude)
 * CREATED      : 2026-08-19
 * LAST UPDATE  : 2026-08-19
 *
 * DESCRIPTION
 * ----------------------------------------------------------------
 * Logika halaman Khusus PCP (input-pcp.html) — form lengkap 1
 * periode, account dikunci ke PCP. Struktur & sebagian besar fungsi
 * sama persis dengan input-manual.js, KECUALI bagian Reach by Type
 * yang memakai rumus persentase bertingkat khusus PCP:
 *   Total Pemirsa x %JenisKonten = Pemirsa Jenis Konten
 *   Pemirsa Jenis Konten x %Follower/NonFollower = angka akhir
 * Semua field (termasuk hasil hitungan Reach) dikirim jadi satu
 * lewat action saveManualFull — tidak lagi lewat action
 * savePcpReachInput/savePcpAudienceInput yang lama.
 ******************************************************************/

/******************************************************************
 * VERSION HISTORY
 * ----------------------------------------------------------------
 *
 * v1.0.0
 * - Initial Release. 2 section terpisah (Reach & Audience), pakai
 *   action savePcpReachInput/savePcpAudienceInput.
 *
 * v1.1.0
 * - Default Period dari PERIODS terbaru dulu (index 0).
 *
 * v2.0.0 — REDESIGN TOTAL
 * - Diganti jadi form lengkap 7 section sama seperti Input Manual
 *   v2.2.0 (account dikunci PCP, tidak ada dropdown Account).
 * - buildPcpReachByTypePayload() baru — hitung rumus persentase
 *   bertingkat PCP di browser, hasilnya dikirim sebagai angka biasa
 *   lewat saveManualFull (bukan lagi savePcpReachInput).
 * - Semua fungsi lain (buildMainPayload, buildTopContentPayload,
 *   buildEngagementPayload, buildGrowthAndAudiencePayload,
 *   buildActivityPayload, buildTopLocationsPayload, validateForm)
 *   disalin dari input-manual.js, ID field diganti prefix "pf-".
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
 * Account dikunci ke PCP. Jumlah baris tetap Konten Populer,
 * Lokasi Populer, & Jam Aktif awal, daftar jenis konten/metric
 * Engagement, dan daftar rentang usia.
 ******************************************************************/

const PCP_ACCOUNT_ID = 'PCP';

const TOP_CONTENT_ROW_COUNT = 5;
const TOP_LOCATION_ROW_COUNT = 5;
const DEFAULT_ACTIVITY_ROW_COUNT = 5;

const TOP_CONTENT_INSIGHT_METRICS = [
  ['like', 'Like'], ['komen', 'Komen'], ['posting_ulang', 'Posting Ulang'],
  ['bagikan', 'Bagikan'], ['simpan', 'Simpan']
];

const ENGAGEMENT_CONTENT_TYPE_KEYS = [['reels', 'REELS'], ['feed', 'FEED'], ['story', 'STORY'], ['live', 'LIVE']];
const ENGAGEMENT_METRIC_KEYS = [['like', 'LIKE'], ['komen', 'KOMEN'], ['posting_ulang', 'POSTING_ULANG'], ['bagikan', 'BAGIKAN'], ['simpan', 'SIMPAN'], ['balasan', 'BALASAN']];
const PCP_REACH_CONTENT_TYPE_KEYS = [['story', 'STORY'], ['reels', 'REELS'], ['feed', 'FEED']];
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
 * Fungsi bantu baca nilai input, mengembalikan null kalau kosong.
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
  const container = document.getElementById('pf-top-content-rows');
  let blocksHtml = '';
  for (let rank = 1; rank <= TOP_CONTENT_ROW_COUNT; rank++) {
    const insightFieldsHtml = TOP_CONTENT_INSIGHT_METRICS.map(([metricKey, metricLabel]) =>
      `<label>${metricLabel}<input type="number" id="pf-top-${metricKey}-${rank}"></label>`
    ).join('');

    blocksHtml += `
      <div class="top-content-block">
        <div class="top-content-header">
          <span class="rank-label">#${rank}</span>
          <label>Judul<input type="text" id="pf-top-title-${rank}"></label>
          <label>Link<input type="text" id="pf-top-link-${rank}" placeholder="https://instagram.com/..."></label>
        </div>
        <div class="field-grid five-col">${insightFieldsHtml}</div>
      </div>`;
  }
  container.innerHTML = blocksHtml;
}

/******************************************************************
 * Function : renderTopLocationRows()
 * Tujuan   : Merender 5 baris form Lokasi Populer — Nama Kota +
 *            Persentase.
 ******************************************************************/
function renderTopLocationRows() {
  const container = document.getElementById('pf-top-location-rows');
  let rowsHtml = '';
  for (let rank = 1; rank <= TOP_LOCATION_ROW_COUNT; rank++) {
    rowsHtml += `<div class="field-grid top-location-row">
      <span class="rank-label">#${rank}</span>
      <label>Nama Kota<input type="text" id="pf-loc-name-${rank}"></label>
      <label>Persentase (%)<input type="number" step="0.01" id="pf-loc-percent-${rank}"></label>
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
  const container = document.getElementById('pf-activity-rows');
  const rowDiv = document.createElement('div');
  rowDiv.className = 'activity-row';
  rowDiv.innerHTML = `
    <input type="text" placeholder="Jam (contoh: 9 SIANG)" class="pf-activity-time" value="${timeSlotValue || ''}">
    <input type="number" placeholder="Audiens Aktif" class="pf-activity-value" value="${activeAudienceValue !== undefined && activeAudienceValue !== null ? activeAudienceValue : ''}">
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
  document.getElementById('pf-activity-add').addEventListener('click', () => addActivityRow());
}

/******************************************************************
 * PAYLOAD BUILDERS
 * ----------------------------------------------------------------
 * Fungsi pengumpul nilai form jadi payload siap kirim ke backend.
 ******************************************************************/

/******************************************************************
 * Function : buildMainPayload()
 * Tujuan   : Mengumpulkan field sheet MAIN. Reach dan Interaksi
 *            Follower/Non-Follower dikonversi dari persen ke angka
 *            kalau mode-nya Persentase (base: Tayangan / Interaksi).
 ******************************************************************/
function buildMainPayload() {
  const main = {};
  const tayangan = getInputValue('pf-tayangan');
  const interaksi = getInputValue('pf-interaksi');

  if (tayangan !== null) main.TAYANGAN = tayangan;
  const pengikutBersih = getInputValue('pf-pengikut-bersih');
  if (pengikutBersih !== null) main.PENGIKUT_BERSIH = pengikutBersih;
  const followerBaru = getInputValue('pf-follower-baru');
  if (followerBaru !== null) main.FOLLOWER_BARU = followerBaru;
  const unfollow = getInputValue('pf-unfollow');
  if (unfollow !== null) main.UNFOLLOW = unfollow;
  if (interaksi !== null) main.INTERAKSI = interaksi;

  const reachMode = getSelectedMode('pf-reach-mode');
  const reachFollowerRaw = getInputValue('pf-reach-follower');
  const reachNonFollowerRaw = getInputValue('pf-reach-nonfollower');
  if (reachFollowerRaw !== null) {
    main.FOLLOWER_REACH = reachMode === MODE_PERCENT ? Math.round(tayangan * reachFollowerRaw / 100) : reachFollowerRaw;
  }
  if (reachNonFollowerRaw !== null) {
    main.NON_FOLLOWER_REACH = reachMode === MODE_PERCENT ? Math.round(tayangan * reachNonFollowerRaw / 100) : reachNonFollowerRaw;
  }

  const interaksiMode = getSelectedMode('pf-interaksi-mode');
  const interaksiFollowerRaw = getInputValue('pf-interaksi-follower');
  const interaksiNonFollowerRaw = getInputValue('pf-interaksi-nonfollower');
  if (interaksiFollowerRaw !== null) {
    main.INTERAKSI_FOLLOWER = interaksiMode === MODE_PERCENT ? Math.round(interaksi * interaksiFollowerRaw / 100) : interaksiFollowerRaw;
  }
  if (interaksiNonFollowerRaw !== null) {
    main.INTERAKSI_NON_FOLLOWER = interaksiMode === MODE_PERCENT ? Math.round(interaksi * interaksiNonFollowerRaw / 100) : interaksiNonFollowerRaw;
  }

  return main;
}

/******************************************************************
 * Function : buildPcpReachByTypePayload()
 * Tujuan   : Menghitung rumus persentase bertingkat khusus PCP:
 *            Total Pemirsa x %JenisKonten = Pemirsa Jenis Konten,
 *            lalu x %Follower/NonFollower = angka akhir. Hasilnya
 *            angka biasa, dikirim dalam bentuk yang sama seperti
 *            REACH_BY_TYPE akun lain.
 ******************************************************************/
function buildPcpReachByTypePayload() {
  const rows = [];
  const totalPemirsa = getInputValue('pf-pemirsa');
  if (totalPemirsa !== null) rows.push({ content_type: 'PEMIRSA', audience_type: 'TOTAL', value: totalPemirsa });

  PCP_REACH_CONTENT_TYPE_KEYS.forEach(([idKey, label]) => {
    const contentPercent = getInputValue(`pf-${idKey}-content-percent`);
    const followerPercent = getInputValue(`pf-${idKey}-follower-percent`);
    const nonFollowerPercent = getInputValue(`pf-${idKey}-nonfollower-percent`);
    if (contentPercent === null) return;

    const contentPemirsa = totalPemirsa * (contentPercent / 100);
    if (followerPercent !== null) {
      rows.push({ content_type: label, audience_type: 'FOLLOWER', value: Math.round(contentPemirsa * (followerPercent / 100)) });
    }
    if (nonFollowerPercent !== null) {
      rows.push({ content_type: label, audience_type: 'NON_FOLLOWER', value: Math.round(contentPemirsa * (nonFollowerPercent / 100)) });
    }
  });

  return rows;
}

/******************************************************************
 * Function : buildTopContentPayload()
 * Tujuan   : Mengumpulkan 5 blok form Konten Populer (Judul, Link,
 *            insight Like/Komen/Posting Ulang/Bagikan/Simpan).
 ******************************************************************/
function buildTopContentPayload() {
  const rows = [];
  for (let rank = 1; rank <= TOP_CONTENT_ROW_COUNT; rank++) {
    const title = document.getElementById(`pf-top-title-${rank}`).value.trim();
    if (!title) continue;

    const link = document.getElementById(`pf-top-link-${rank}`).value.trim();
    const row = { rank, title, link };
    TOP_CONTENT_INSIGHT_METRICS.forEach(([metricKey]) => {
      const value = getInputValue(`pf-top-${metricKey}-${rank}`);
      if (value !== null) row[metricKey] = value;
    });
    rows.push(row);
  }
  return rows;
}

/******************************************************************
 * Function : buildTopLocationsPayload()
 * Tujuan   : Mengumpulkan 5 baris form Lokasi Populer (Nama Kota +
 *            Persentase).
 ******************************************************************/
function buildTopLocationsPayload() {
  const rows = [];
  for (let rank = 1; rank <= TOP_LOCATION_ROW_COUNT; rank++) {
    const locationName = document.getElementById(`pf-loc-name-${rank}`).value.trim();
    if (!locationName) continue;

    const percentage = getInputValue(`pf-loc-percent-${rank}`);
    rows.push({ rank, location_name: locationName, percentage: percentage === null ? '' : percentage });
  }
  return rows;
}

/******************************************************************
 * Function : buildEngagementPayload()
 * Tujuan   : Mengumpulkan seluruh field Engagement (4 jenis konten
 *            x 6 metric) jadi array baris ENGAGEMENT.
 ******************************************************************/
function buildEngagementPayload() {
  const rows = [];
  ENGAGEMENT_CONTENT_TYPE_KEYS.forEach(([typeKey, typeLabel]) => {
    ENGAGEMENT_METRIC_KEYS.forEach(([metricKey, metricLabel]) => {
      const value = getInputValue(`pf-eng-${typeKey}-${metricKey}`);
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
  const growthPercent = getInputValue('pf-growth-percent');
  const totalFollower = getInputValue('pf-total-follower');
  const genderMode = getSelectedMode('pf-gender-mode');
  const wanitaRaw = getInputValue('pf-wanita');
  const lakilakiRaw = getInputValue('pf-lakilaki');

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

    const wanitaAgeRaw = getInputValue(`pf-age-wanita-${ageKey}`);
    if (wanitaAgeRaw !== null) {
      const value = genderMode === MODE_PERCENT && wanitaCount !== null ? Math.round(wanitaCount * wanitaAgeRaw / 100) : wanitaAgeRaw;
      audienceRows.push({ gender: 'WANITA', age_range: ageLabel, value });
    }

    const priaAgeRaw = getInputValue(`pf-age-pria-${ageKey}`);
    if (priaAgeRaw !== null) {
      const value = genderMode === MODE_PERCENT && lakilakiCount !== null ? Math.round(lakilakiCount * priaAgeRaw / 100) : priaAgeRaw;
      audienceRows.push({ gender: 'PRIA', age_range: ageLabel, value });
    }
  });

  return { followerGrowth, audienceRows };
}

/******************************************************************
 * Function : buildActivityPayload()
 * Tujuan   : Mengumpulkan seluruh baris Jam Aktif yang diisi.
 ******************************************************************/
function buildActivityPayload() {
  const rows = [];
  document.querySelectorAll('#pf-activity-rows .activity-row').forEach(rowElement => {
    const timeSlot = rowElement.querySelector('.pf-activity-time').value.trim();
    const activeAudienceRaw = rowElement.querySelector('.pf-activity-value').value;
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
 *            Pemirsa, Total Follower) sudah diisi kalau mode
 *            Persentase / rumus PCP butuh itu. Mengembalikan pesan
 *            error, atau null kalau valid.
 ******************************************************************/
function validateForm() {
  const tayangan = getInputValue('pf-tayangan');
  const interaksi = getInputValue('pf-interaksi');
  const totalFollower = getInputValue('pf-total-follower');
  const totalPemirsa = getInputValue('pf-pemirsa');

  const reachMode = getSelectedMode('pf-reach-mode');
  const reachFollowerRaw = getInputValue('pf-reach-follower');
  const reachNonFollowerRaw = getInputValue('pf-reach-nonfollower');
  if (reachMode === MODE_PERCENT && tayangan === null && (reachFollowerRaw !== null || reachNonFollowerRaw !== null)) {
    return 'Mode Persentase untuk Reach butuh nilai Tayangan diisi dulu.';
  }

  const interaksiMode = getSelectedMode('pf-interaksi-mode');
  const interaksiFollowerRaw = getInputValue('pf-interaksi-follower');
  const interaksiNonFollowerRaw = getInputValue('pf-interaksi-nonfollower');
  if (interaksiMode === MODE_PERCENT && interaksi === null && (interaksiFollowerRaw !== null || interaksiNonFollowerRaw !== null)) {
    return 'Mode Persentase untuk Interaksi butuh nilai Interaksi diisi dulu.';
  }

  const genderMode = getSelectedMode('pf-gender-mode');
  const wanitaRaw = getInputValue('pf-wanita');
  const lakilakiRaw = getInputValue('pf-lakilaki');
  if (genderMode === MODE_PERCENT && totalFollower === null && (wanitaRaw !== null || lakilakiRaw !== null)) {
    return 'Mode Persentase untuk Gender butuh nilai Total Follower diisi dulu.';
  }

  const anyReachPercentFilled = PCP_REACH_CONTENT_TYPE_KEYS.some(([idKey]) => getInputValue(`pf-${idKey}-content-percent`) !== null);
  if (anyReachPercentFilled && totalPemirsa === null) {
    return 'Tayangan Berdasarkan Jenis Konten butuh nilai Pemirsa (Total) diisi dulu.';
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
 *            section (termasuk hasil hitungan rumus PCP), lalu
 *            kirim ke backend lewat action saveManualFull.
 ******************************************************************/
async function handleSaveAll() {
  const statusElement = document.getElementById('pf-status');
  const validationError = validateForm();
  if (validationError) {
    setStatus(statusElement, validationError, STATUS_CLASS_ERROR);
    return;
  }

  const growthAndAudience = buildGrowthAndAudiencePayload();
  const payload = {
    account_id: PCP_ACCOUNT_ID,
    period_id: document.getElementById('pf-period').value,
    main: buildMainPayload(),
    reach_by_type: buildPcpReachByTypePayload(),
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
    setStatus(statusElement, '✓ Semua data PCP berhasil disimpan.', STATUS_CLASS_SUCCESS);
  } catch (error) {
    console.error("[HANDLE_SAVE_ALL]", error);
    setStatus(statusElement, 'Gagal menyimpan: ' + error.message, STATUS_CLASS_ERROR);
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
 *            merender baris dinamis (Konten Populer, Lokasi
 *            Populer, Jam Aktif), lalu memasang event listener
 *            tombol Simpan Semua.
 ******************************************************************/
async function initInputPcpPage() {
  const statusElement = document.getElementById('pf-status');
  try {
    await loadPeriods();

    fillSelect(document.getElementById('pf-period'), PERIODS, 'period_id', 'period_name');
    if (PERIODS.length > 0) {
      document.getElementById('pf-period').value = PERIODS[0].period_id;
    }

    renderTopContentRows();
    renderTopLocationRows();
    initActivityRows();
    document.getElementById('pf-save').addEventListener('click', handleSaveAll);
  } catch (error) {
    console.error("[INIT_INPUT_PCP_PAGE]", error);
    setStatus(statusElement, 'Gagal memuat data awal: ' + error.message, STATUS_CLASS_ERROR);
  }
}

window.addEventListener('DOMContentLoaded', initInputPcpPage);
