/******************************************************************
 * PROJECT      : Social Media Analytics Center
 * MODULE       : Frontend - Web App
 * FILE         : common.js
 * VERSION      : v1.0.0
 * AUTHOR       : Jimmy Team (dibantu Claude)
 * CREATED      : 2026-08-19
 * LAST UPDATE  : 2026-08-19
 *
 * DESCRIPTION
 * ----------------------------------------------------------------
 * Utilitas dasar yang dipakai di semua halaman (Dashboard,
 * Import Data, Input Manual, Khusus PCP): status message,
 * pengisian dropdown, dan pemuat master data (accounts & periods).
 * Menggantikan app.js v1.0.0 — logika tab dihapus karena setiap
 * halaman sekarang file HTML terpisah, bukan tab dalam satu halaman.
 ******************************************************************/

/******************************************************************
 * VERSION HISTORY
 * ----------------------------------------------------------------
 *
 * v1.0.0
 * - Initial Release.
 * - Menggantikan app.js: setStatus, fillSelect, loadAccounts,
 *   loadPeriods. Fungsi tab switching dihapus (tidak dipakai lagi
 *   setelah halaman dipisah per file).
 *
 ******************************************************************/

/******************************************************************
 * DEPENDENCIES
 * ----------------------------------------------------------------
 *
 * Required
 * - api.js
 *
 * Used By
 * - dashboard.js
 * - input-import.js
 * - input-manual.js
 * - input-pcp.js
 *
 ******************************************************************/

/******************************************************************
 * CONSTANTS
 * ----------------------------------------------------------------
 * Nama class CSS untuk status pesan error.
 ******************************************************************/

const STATUS_CLASS_ERROR = 'error';
const STATUS_CLASS_SUCCESS = 'success';

/******************************************************************
 * CONFIGURATION
 * ----------------------------------------------------------------
 * Tidak ada konfigurasi environment tambahan untuk file ini.
 ******************************************************************/

/******************************************************************
 * SHARED STATE
 * ----------------------------------------------------------------
 * Data master (accounts/periods), dimuat sekali per halaman lewat
 * loadAccounts() / loadPeriods(), lalu dipakai oleh script halaman
 * masing-masing untuk mengisi dropdown.
 ******************************************************************/

let ACCOUNTS = [];
let PERIODS = [];

/******************************************************************
 * UI HELPERS
 * ----------------------------------------------------------------
 * Fungsi bantu umum untuk status message dan pengisian dropdown.
 ******************************************************************/

/******************************************************************
 * Function : setStatus()
 * Tujuan   : Menampilkan pesan status (netral/sukses/error) di
 *            elemen tertentu.
 ******************************************************************/
function setStatus(element, message, type) {
  element.textContent = message;
  element.className = 'status-msg' + (type ? ' ' + type : '');
}

/******************************************************************
 * Function : fillSelect()
 * Tujuan   : Mengisi elemen <select> dari array of objects.
 ******************************************************************/
function fillSelect(selectElement, items, valueKey, labelKey) {
  selectElement.innerHTML = items.map(item => `<option value="${item[valueKey]}">${item[labelKey]}</option>`).join('');
}

/******************************************************************
 * MASTER DATA LOADERS
 * ----------------------------------------------------------------
 * Fungsi pemuat data accounts & periods dari backend. Tidak
 * menyentuh DOM — pengisian dropdown dilakukan oleh script
 * masing-masing halaman, karena tiap halaman punya dropdown berbeda.
 ******************************************************************/

/******************************************************************
 * Function : loadAccounts()
 * Tujuan   : Mengambil daftar akun dari backend, simpan ke ACCOUNTS.
 ******************************************************************/
async function loadAccounts() {
  ACCOUNTS = await apiGet(GET_ACTIONS.GET_ACCOUNTS);
  console.log("[LOAD_ACCOUNTS]", ACCOUNTS.length + ' akun dimuat');
  return ACCOUNTS;
}

/******************************************************************
 * Function : loadPeriods()
 * Tujuan   : Mengambil daftar periode dari backend, simpan ke PERIODS.
 ******************************************************************/
async function loadPeriods() {
  PERIODS = await apiGet(GET_ACTIONS.GET_PERIODS);
  console.log("[LOAD_PERIODS]", PERIODS.length + ' periode dimuat');
  return PERIODS;
}
