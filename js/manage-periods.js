/******************************************************************
 * PROJECT      : Social Media Analytics Center
 * MODULE       : Frontend - Web App
 * FILE         : manage-periods.js
 * VERSION      : v1.0.0
 * AUTHOR       : Jimmy Team (dibantu Claude)
 * CREATED      : 2026-08-19
 * LAST UPDATE  : 2026-08-19
 *
 * DESCRIPTION
 * ----------------------------------------------------------------
 * Logika halaman Kelola Periode (manage-periods.html). Kirim satu
 * tanggal + jenis periode (Mingguan/Bulanan) ke backend, backend
 * yang menghitung rentang tanggal dan menyimpan ke sheet PERIODS.
 * Halaman ini juga menampilkan daftar periode yang sudah ada.
 ******************************************************************/

/******************************************************************
 * VERSION HISTORY
 * ----------------------------------------------------------------
 *
 * v1.0.0
 * - Initial Release.
 * - renderPeriodList, handleAddPeriod, initManagePeriodsPage.
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
 * - manage-periods.html
 *
 ******************************************************************/

/******************************************************************
 * CONSTANTS
 * ----------------------------------------------------------------
 * Label tampilan untuk jenis periode.
 ******************************************************************/

const PERIOD_TYPE_LABELS = { WEEKLY: 'Mingguan', MONTHLY: 'Bulanan' };

/******************************************************************
 * CONFIGURATION
 * ----------------------------------------------------------------
 * Tidak ada konfigurasi environment tambahan untuk file ini.
 ******************************************************************/

/******************************************************************
 * LIST RENDERING
 * ----------------------------------------------------------------
 * Fungsi penampil daftar periode yang sudah tersimpan.
 ******************************************************************/

/******************************************************************
 * Function : renderPeriodList()
 * Tujuan   : Merender tabel daftar periode (terbaru di atas).
 ******************************************************************/
function renderPeriodList() {
  const tableBody = document.getElementById('mp-list-body');
  tableBody.innerHTML = PERIODS.map(period => `
    <tr>
      <td>${period.period_name}</td>
      <td>${PERIOD_TYPE_LABELS[period.period_type] || period.period_type}</td>
      <td>${period.start_date}</td>
      <td>${period.end_date}</td>
      <td>${period.period_id}</td>
    </tr>`).join('');
}

/******************************************************************
 * EVENT HANDLERS
 * ----------------------------------------------------------------
 * Fungsi penangan klik tombol Tambah Periode.
 ******************************************************************/

/******************************************************************
 * Function : handleAddPeriod()
 * Tujuan   : Mengirim tanggal + jenis periode ke backend
 *            (action addPeriod), lalu memuat ulang daftar periode.
 ******************************************************************/
async function handleAddPeriod() {
  const statusElement = document.getElementById('mp-status');
  const dateValue = document.getElementById('mp-date').value;
  const periodType = document.getElementById('mp-type').value;

  if (!dateValue) {
    setStatus(statusElement, 'Pilih tanggal dulu.', STATUS_CLASS_ERROR);
    return;
  }

  setStatus(statusElement, 'Menyimpan...', '');
  try {
    const newPeriod = await apiPost(POST_ACTIONS.ADD_PERIOD, { date: dateValue, period_type: periodType });
    setStatus(statusElement, `✓ Periode "${newPeriod.period_name}" siap dipakai.`, STATUS_CLASS_SUCCESS);
    await loadPeriods();
    renderPeriodList();
  } catch (error) {
    console.error("[HANDLE_ADD_PERIOD]", error);
    setStatus(statusElement, 'Gagal menyimpan: ' + error.message, STATUS_CLASS_ERROR);
  }
}

/******************************************************************
 * PAGE BOOTSTRAP
 * ----------------------------------------------------------------
 * Titik mulai halaman Kelola Periode saat DOM selesai dimuat.
 ******************************************************************/

/******************************************************************
 * Function : initManagePeriodsPage()
 * Tujuan   : Memuat daftar periode yang sudah ada, merender
 *            tabelnya, lalu memasang event listener tombol Tambah.
 ******************************************************************/
async function initManagePeriodsPage() {
  const statusElement = document.getElementById('mp-status');
  try {
    await loadPeriods();
    renderPeriodList();
    document.getElementById('mp-add').addEventListener('click', handleAddPeriod);
  } catch (error) {
    console.error("[INIT_MANAGE_PERIODS_PAGE]", error);
    setStatus(statusElement, 'Gagal memuat data awal: ' + error.message, STATUS_CLASS_ERROR);
  }
}

window.addEventListener('DOMContentLoaded', initManagePeriodsPage);
