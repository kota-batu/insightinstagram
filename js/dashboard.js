/******************************************************************
 * PROJECT      : Social Media Analytics Center
 * MODULE       : Frontend - Web App
 * FILE         : dashboard.js
 * VERSION      : v1.3.1
 * AUTHOR       : Jimmy Team (dibantu Claude)
 * CREATED      : 2026-08-18
 * LAST UPDATE  : 2026-08-19
 *
 * DESCRIPTION
 * ----------------------------------------------------------------
 * Logika halaman Dashboard (index.html). Mengambil data dashboard
 * dari backend dan merender kartu KPI serta chart (Reach,
 * Engagement, Audience, Activity) memakai Chart.js.
 ******************************************************************/

/******************************************************************
 * VERSION HISTORY
 * ----------------------------------------------------------------
 *
 * v1.0.0
 * - Initial Release.
 *
 * v1.1.0
 * - Restrukturisasi: Dashboard jadi halaman HTML mandiri.
 *
 * v1.2.0
 * - Default Period/Compare dari PERIODS terbaru dulu, filter
 *   Compare sesuai jenis periode (Mingguan/Bulanan).
 *
 * v1.3.0
 * - renderTopContentCard() sekarang menampilkan insight per konten
 *   (Like/Komen/Posting Ulang/Bagikan/Simpan), tombol link Instagram
 *   tetap otomatis muncul kalau field link diisi.
 * - Ditambahkan kartu baru renderTopLocationsCard() — daftar 5
 *   negara/lokasi audiens terpopuler.
 *
 * v1.3.1
 * - Perbaikan istilah komentar: "negara" -> "kota" (menyesuaikan
 *   label form Input Manual v2.1.1). Tidak ada perubahan kode.
 *
 ******************************************************************/

/******************************************************************
 * DEPENDENCIES
 * ----------------------------------------------------------------
 *
 * Required
 * - api.js
 * - common.js
 * - Chart.js (CDN, dimuat di index.html)
 *
 * Used By
 * - index.html
 *
 ******************************************************************/

/******************************************************************
 * CONSTANTS
 * ----------------------------------------------------------------
 * Label tampilan, urutan kategori chart, dan warna tema — supaya
 * tidak ada string/hex ditulis berulang di banyak tempat.
 ******************************************************************/

const MAIN_METRIC_LABELS = {
  TAYANGAN: 'Tayangan',
  FOLLOWER_REACH: 'Follower Reach',
  NON_FOLLOWER_REACH: 'Non-Follower Reach',
  PENGIKUT_BERSIH: 'Pengikut Bersih',
  FOLLOWER_BARU: 'Follower Baru',
  UNFOLLOW: 'Unfollow',
  INTERAKSI: 'Interaksi',
  INTERAKSI_FOLLOWER: 'Interaksi dari Follower',
  INTERAKSI_NON_FOLLOWER: 'Interaksi dari Non-Follower'
};

const TOP_CONTENT_INSIGHT_LABELS = {
  like: 'Like', komen: 'Komen', posting_ulang: 'Posting Ulang', bagikan: 'Bagikan', simpan: 'Simpan'
};

const REACH_CONTENT_TYPES = ['STORY', 'REELS', 'FEED'];
const ENGAGEMENT_CONTENT_TYPES = ['REELS', 'FEED', 'STORY', 'LIVE'];
const ENGAGEMENT_CHART_METRICS = ['LIKE', 'KOMEN', 'BAGIKAN', 'SIMPAN'];
const AUDIENCE_AGE_RANGES = ['13-17', '18-24', '25-34', '35-44', '45-54', '55-63', '65+'];
const AUDIENCE_AGE_RANGE_ALIAS_65 = '65 UP';

const CHART_COLOR_ACCENT = '#e0a24a';
const CHART_COLOR_NEUTRAL = '#3d4653';
const CHART_COLOR_GREEN = '#4caf7d';
const CHART_COLOR_BLUE = '#5b8def';
const CHART_COLOR_PURPLE = '#c96bd6';
const CHART_COLOR_TICK = '#9aa3b0';
const CHART_COLOR_GRID = '#2c333d';
const CHART_COLOR_LEGEND_TEXT = '#e9ecf1';

const LOCALE_ID = 'id-ID';

/******************************************************************
 * CONFIGURATION
 * ----------------------------------------------------------------
 * Tidak ada konfigurasi environment tambahan untuk file ini.
 ******************************************************************/

/******************************************************************
 * CHART STATE
 * ----------------------------------------------------------------
 * Referensi instance Chart.js aktif, dihancurkan sebelum render ulang.
 ******************************************************************/

let activeCharts = {};

/******************************************************************
 * Function : destroyCharts()
 * Tujuan   : Menghancurkan seluruh instance Chart.js aktif sebelum
 *            render ulang, supaya tidak menumpuk chart lama.
 ******************************************************************/
function destroyCharts() {
  Object.values(activeCharts).forEach(chart => chart && chart.destroy());
  activeCharts = {};
}

/******************************************************************
 * KPI CARD
 * ----------------------------------------------------------------
 * Kartu ringkasan Performa Utama dan Follower Growth.
 ******************************************************************/

/******************************************************************
 * Function : changeBadge()
 * Tujuan   : Membuat badge HTML kecil (panah + persen) untuk
 *            menunjukkan arah perubahan suatu metrik.
 ******************************************************************/
function changeBadge(changePercent) {
  if (changePercent === null || changePercent === undefined || isNaN(changePercent)) {
    return '<span class="kpi-change flat">–</span>';
  }
  const direction = changePercent > 0 ? 'up' : (changePercent < 0 ? 'down' : 'flat');
  const arrow = changePercent > 0 ? '▲' : (changePercent < 0 ? '▼' : '–');
  return `<span class="kpi-change ${direction}">${arrow} ${Math.abs(changePercent).toFixed(1)}%</span>`;
}

/******************************************************************
 * Function : renderKpiCard()
 * Tujuan   : Merender kartu HTML untuk data MAIN (Performa Utama).
 ******************************************************************/
function renderKpiCard(dashboardData) {
  const kpiRows = dashboardData.main.map(item => `
    <div class="kpi-row">
      <span class="kpi-label">${MAIN_METRIC_LABELS[item.metric] || item.metric}</span>
      <span><span class="kpi-value">${item.value.toLocaleString(LOCALE_ID)}</span>${changeBadge(item.change_percent)}</span>
    </div>`).join('');
  return `<div class="card"><h3>Performa Utama</h3><div class="kpi-list">${kpiRows || '<p class="hint">Belum ada data.</p>'}</div></div>`;
}

/******************************************************************
 * Function : renderGrowthCard()
 * Tujuan   : Merender kartu HTML untuk data FOLLOWER_GROWTH.
 ******************************************************************/
function renderGrowthCard(dashboardData) {
  const growth = dashboardData.follower_growth;
  if (!growth) return `<div class="card"><h3>Follower Growth</h3><p class="hint">Belum ada data.</p></div>`;
  return `<div class="card">
    <h3>Follower Growth</h3>
    <div class="kpi-list">
      <div class="kpi-row"><span class="kpi-label">Growth</span><span class="kpi-value">${growth.growth_percent}%</span></div>
      <div class="kpi-row"><span class="kpi-label">Total Follower</span><span class="kpi-value">${Number(growth.total_follower).toLocaleString(LOCALE_ID)}</span></div>
      <div class="kpi-row"><span class="kpi-label">Wanita</span><span class="kpi-value">${Number(growth.female_total).toLocaleString(LOCALE_ID)}</span></div>
      <div class="kpi-row"><span class="kpi-label">Pria</span><span class="kpi-value">${Number(growth.male_total).toLocaleString(LOCALE_ID)}</span></div>
    </div>
  </div>`;
}

/******************************************************************
 * CHART CARDS
 * ----------------------------------------------------------------
 * Kartu berisi canvas Chart.js untuk Reach, Engagement, Audience,
 * dan Activity. Render kartu HTML dan gambar chart dipisah supaya
 * canvas sudah ada di DOM sebelum Chart.js dijalankan.
 ******************************************************************/

/******************************************************************
 * Function : renderReachCard()
 * Tujuan   : Merender kartu HTML (kosong, berisi canvas) untuk
 *            chart Tayangan per Jenis Konten.
 ******************************************************************/
function renderReachCard() {
  return `<div class="card"><h3>Tayangan per Jenis Konten</h3><canvas id="chart-reach" height="200"></canvas></div>`;
}

/******************************************************************
 * Function : drawReachChart()
 * Tujuan   : Menggambar bar chart Follower vs Non-Follower per
 *            jenis konten (Story/Reels/Feed).
 ******************************************************************/
function drawReachChart(dashboardData) {
  const canvas = document.getElementById('chart-reach');
  if (!canvas) return;

  const followerValues = REACH_CONTENT_TYPES.map(contentType => {
    const row = dashboardData.reach_by_type.find(item => item.content_type === contentType && item.audience_type === 'FOLLOWER');
    return row ? Number(row.value) : 0;
  });
  const nonFollowerValues = REACH_CONTENT_TYPES.map(contentType => {
    const row = dashboardData.reach_by_type.find(item => item.content_type === contentType && item.audience_type === 'NON_FOLLOWER');
    return row ? Number(row.value) : 0;
  });

  activeCharts.reach = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: REACH_CONTENT_TYPES,
      datasets: [
        { label: 'Follower', data: followerValues, backgroundColor: CHART_COLOR_ACCENT },
        { label: 'Non-Follower', data: nonFollowerValues, backgroundColor: CHART_COLOR_NEUTRAL }
      ]
    },
    options: chartBaseOptions()
  });
}

/******************************************************************
 * Function : renderEngagementCard()
 * Tujuan   : Merender kartu HTML (kosong, berisi canvas) untuk
 *            chart Engagement per Jenis Konten.
 ******************************************************************/
function renderEngagementCard() {
  return `<div class="card"><h3>Engagement per Jenis Konten</h3><canvas id="chart-engagement" height="200"></canvas></div>`;
}

/******************************************************************
 * Function : drawEngagementChart()
 * Tujuan   : Menggambar bar chart Like/Komen/Bagikan/Simpan per
 *            jenis konten (Reels/Feed/Story/Live).
 ******************************************************************/
function drawEngagementChart(dashboardData) {
  const canvas = document.getElementById('chart-engagement');
  if (!canvas) return;

  const metricColors = [CHART_COLOR_ACCENT, CHART_COLOR_GREEN, CHART_COLOR_BLUE, CHART_COLOR_PURPLE];
  const datasets = ENGAGEMENT_CHART_METRICS.map((metric, index) => ({
    label: metric,
    backgroundColor: metricColors[index],
    data: ENGAGEMENT_CONTENT_TYPES.map(contentType => {
      const row = dashboardData.engagement.find(item => item.content_type === contentType && item.metric === metric);
      return row ? Number(row.value) : 0;
    })
  }));

  activeCharts.engagement = new Chart(canvas, {
    type: 'bar',
    data: { labels: ENGAGEMENT_CONTENT_TYPES, datasets },
    options: chartBaseOptions()
  });
}

/******************************************************************
 * Function : renderTopContentCard()
 * Tujuan   : Merender daftar Konten Populer beserta insight per
 *            konten (Like/Komen/Posting Ulang/Bagikan/Simpan) dan
 *            link Instagram (kalau sudah diisi).
 ******************************************************************/
function renderTopContentCard(dashboardData) {
  const items = dashboardData.top_content.map(item => {
    const insightHtml = Object.keys(TOP_CONTENT_INSIGHT_LABELS)
      .filter(metricKey => item[metricKey] !== undefined && item[metricKey] !== '')
      .map(metricKey => `<span class="top-content-insight-item">${TOP_CONTENT_INSIGHT_LABELS[metricKey]}: <b>${Number(item[metricKey]).toLocaleString(LOCALE_ID)}</b></span>`)
      .join('');

    return `
    <div class="top-content-item">
      <span class="rank-badge">${item.rank}</span>
      <div>
        <div class="top-content-title">${item.title}</div>
        ${insightHtml ? `<div class="top-content-insight">${insightHtml}</div>` : ''}
        ${item.link ? `<a class="top-content-link" href="${item.link}" target="_blank">Buka Instagram →</a>` : ''}
      </div>
    </div>`;
  }).join('');
  return `<div class="card"><h3>Konten Populer</h3>${items || '<p class="hint">Belum ada data.</p>'}</div>`;
}

/******************************************************************
 * Function : renderTopLocationsCard()
 * Tujuan   : Merender daftar 5 kota audiens terpopuler beserta
 *            persentasenya.
 ******************************************************************/
function renderTopLocationsCard(dashboardData) {
  const locations = dashboardData.top_locations || [];
  const items = locations.map(item => `
    <div class="kpi-row">
      <span class="kpi-label">#${item.rank} ${item.location_name}</span>
      <span class="kpi-value">${item.percentage !== '' && item.percentage !== undefined ? item.percentage + '%' : '-'}</span>
    </div>`).join('');
  return `<div class="card"><h3>Lokasi Populer</h3><div class="kpi-list">${items || '<p class="hint">Belum ada data.</p>'}</div></div>`;
}

/******************************************************************
 * Function : renderAudienceCard()
 * Tujuan   : Merender kartu HTML (kosong, berisi canvas) untuk
 *            chart Demografi Usia + Gender.
 ******************************************************************/
function renderAudienceCard() {
  return `<div class="card"><h3>Demografi Usia + Gender</h3><canvas id="chart-audience" height="200"></canvas></div>`;
}

/******************************************************************
 * Function : drawAudienceChart()
 * Tujuan   : Menggambar bar chart jumlah follower per rentang usia,
 *            dipisah Wanita/Pria.
 ******************************************************************/
function drawAudienceChart(dashboardData) {
  const canvas = document.getElementById('chart-audience');
  if (!canvas) return;

  function findAgeValue(gender, ageRange) {
    const row = dashboardData.audience_age.find(item =>
      item.gender === gender && (item.age_range === ageRange || (item.age_range === AUDIENCE_AGE_RANGE_ALIAS_65 && ageRange === '65+'))
    );
    return row ? Number(row.value) : 0;
  }

  const wanitaValues = AUDIENCE_AGE_RANGES.map(ageRange => findAgeValue('WANITA', ageRange));
  const priaValues = AUDIENCE_AGE_RANGES.map(ageRange => findAgeValue('PRIA', ageRange));

  activeCharts.audience = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: AUDIENCE_AGE_RANGES,
      datasets: [
        { label: 'Wanita', data: wanitaValues, backgroundColor: CHART_COLOR_ACCENT },
        { label: 'Pria', data: priaValues, backgroundColor: CHART_COLOR_BLUE }
      ]
    },
    options: chartBaseOptions()
  });
}

/******************************************************************
 * Function : renderActivityCard()
 * Tujuan   : Merender kartu HTML (kosong, berisi canvas) untuk
 *            chart Jam Aktif Audiens.
 ******************************************************************/
function renderActivityCard() {
  return `<div class="card wide"><h3>Jam Aktif Audiens</h3><canvas id="chart-activity" height="120"></canvas></div>`;
}

/******************************************************************
 * Function : drawActivityChart()
 * Tujuan   : Menggambar line chart jumlah audiens aktif per jam.
 ******************************************************************/
function drawActivityChart(dashboardData) {
  const canvas = document.getElementById('chart-activity');
  if (!canvas) return;

  activeCharts.activity = new Chart(canvas, {
    type: 'line',
    data: {
      labels: dashboardData.activity.map(item => item.time_slot),
      datasets: [{
        label: 'Audiens Aktif',
        data: dashboardData.activity.map(item => Number(item.active_audience)),
        borderColor: CHART_COLOR_ACCENT,
        backgroundColor: 'rgba(224,162,74,0.15)',
        fill: true,
        tension: 0.3
      }]
    },
    options: Object.assign(chartBaseOptions(), { plugins: { legend: { display: false } } })
  });
}

/******************************************************************
 * Function : chartBaseOptions()
 * Tujuan   : Opsi Chart.js standar (warna teks, grid) supaya
 *            seragam di semua chart dashboard.
 ******************************************************************/
function chartBaseOptions() {
  return {
    responsive: true,
    plugins: { legend: { labels: { color: CHART_COLOR_LEGEND_TEXT } } },
    scales: {
      x: { ticks: { color: CHART_COLOR_TICK }, grid: { color: CHART_COLOR_GRID } },
      y: { ticks: { color: CHART_COLOR_TICK }, grid: { color: CHART_COLOR_GRID } }
    }
  };
}

/******************************************************************
 * PERIOD / COMPARE FILTERING
 * ----------------------------------------------------------------
 * Fungsi penyaring dropdown Compare supaya jenisnya (Mingguan/
 * Bulanan) selalu sama dengan dropdown Period.
 ******************************************************************/

/******************************************************************
 * Function : refreshCompareOptions()
 * Tujuan   : Mengisi ulang dropdown Compare hanya dengan periode
 *            yang period_type-nya sama dengan Period yang sedang
 *            dipilih, lalu pilih otomatis periode berikutnya yang
 *            paling dekat sebagai default.
 ******************************************************************/
function refreshCompareOptions() {
  const periodSelect = document.getElementById('d-period');
  const compareSelect = document.getElementById('d-compare');
  const selectedPeriod = PERIODS.find(period => period.period_id === periodSelect.value);
  if (!selectedPeriod) return;

  const sameTypePeriods = PERIODS.filter(period => period.period_type === selectedPeriod.period_type && period.period_id !== selectedPeriod.period_id);
  fillSelect(compareSelect, sameTypePeriods, 'period_id', 'period_name');
  if (sameTypePeriods.length > 0) compareSelect.value = sameTypePeriods[0].period_id;
}

/******************************************************************
 * DASHBOARD LOADER
 * ----------------------------------------------------------------
 * Fungsi utama pemuat dan penginisialisasi halaman Dashboard.
 ******************************************************************/

/******************************************************************
 * Function : loadDashboard()
 * Tujuan   : Mengambil data dashboard dari backend sesuai pilihan
 *            Account/Period/Compare, lalu merender seluruh kartu
 *            dan chart.
 ******************************************************************/
async function loadDashboard() {
  const statusElement = document.getElementById('d-status');
  const contentElement = document.getElementById('d-content');
  const accountId = document.getElementById('d-account').value;
  const periodId = document.getElementById('d-period').value;
  const comparePeriodId = document.getElementById('d-compare').value;

  setStatus(statusElement, 'Memuat data...', '');
  contentElement.innerHTML = '';
  destroyCharts();

  try {
    const dashboardData = await apiGet(GET_ACTIONS.GET_DASHBOARD_DATA, { account_id: accountId, period_id: periodId, compare_period_id: comparePeriodId });

    contentElement.innerHTML =
      renderKpiCard(dashboardData) +
      renderGrowthCard(dashboardData) +
      renderReachCard() +
      renderEngagementCard() +
      renderTopContentCard(dashboardData) +
      renderTopLocationsCard(dashboardData) +
      renderAudienceCard() +
      renderActivityCard();

    drawReachChart(dashboardData);
    drawEngagementChart(dashboardData);
    drawAudienceChart(dashboardData);
    drawActivityChart(dashboardData);

    setStatus(statusElement, '', '');
  } catch (error) {
    console.error("[LOAD_DASHBOARD]", error);
    setStatus(statusElement, 'Gagal memuat: ' + error.message, STATUS_CLASS_ERROR);
  }
}

/******************************************************************
 * PAGE BOOTSTRAP
 * ----------------------------------------------------------------
 * Titik mulai halaman Dashboard saat DOM selesai dimuat.
 ******************************************************************/

/******************************************************************
 * Function : initDashboardPage()
 * Tujuan   : Memuat master data (accounts/periods — sudah terurut
 *            terbaru dulu), mengisi dropdown Account/Period dengan
 *            nilai default (periode terbaru), menyaring dropdown
 *            Compare sesuai jenis periode, memasang event listener
 *            tombol "Lihat Analytics", lalu memuat dashboard
 *            pertama kali.
 ******************************************************************/
async function initDashboardPage() {
  const statusElement = document.getElementById('d-status');
  try {
    await Promise.all([loadAccounts(), loadPeriods()]);

    fillSelect(document.getElementById('d-account'), ACCOUNTS, 'account_id', 'account_name');
    fillSelect(document.getElementById('d-period'), PERIODS, 'period_id', 'period_name');

    if (PERIODS.length > 0) {
      document.getElementById('d-period').value = PERIODS[0].period_id;
    }
    refreshCompareOptions();

    document.getElementById('d-period').addEventListener('change', refreshCompareOptions);
    document.getElementById('d-load').addEventListener('click', loadDashboard);
    await loadDashboard();
  } catch (error) {
    console.error("[INIT_DASHBOARD_PAGE]", error);
    setStatus(statusElement, 'Gagal memuat data awal: ' + error.message, STATUS_CLASS_ERROR);
  }
}

window.addEventListener('DOMContentLoaded', initDashboardPage);
