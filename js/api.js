/******************************************************************
 * PROJECT      : Social Media Analytics Center
 * MODULE       : Frontend - Web App
 * FILE         : api.js
 * VERSION      : v1.0.1
 * AUTHOR       : Jimmy Team (dibantu Claude)
 * CREATED      : 2026-08-18
 * LAST UPDATE  : 2026-08-19
 *
 * DESCRIPTION
 * ----------------------------------------------------------------
 * Wrapper fetch ke Apps Script Web App. Semua pemanggilan backend
 * (GET untuk baca data, POST untuk tulis data) lewat file ini.
 ******************************************************************/

/******************************************************************
 * VERSION HISTORY
 * ----------------------------------------------------------------
 *
 * v1.0.0
 * - Initial Release.
 * - apiGet, apiPost.
 *
 * v1.0.1
 * - Mengisi APPS_SCRIPT_URL dengan URL Web App hasil deploy.
 *
 ******************************************************************/

/******************************************************************
 * DEPENDENCIES
 * ----------------------------------------------------------------
 *
 * Required
 * - (tidak ada, file paling dasar)
 *
 * Used By
 * - common.js
 * - dashboard.js
 * - input-import.js
 * - input-manual.js
 * - input-pcp.js
 *
 ******************************************************************/

/******************************************************************
 * CONSTANTS
 * ----------------------------------------------------------------
 * Nama-nama action harus PERSIS SAMA dengan GET_ACTIONS /
 * POST_ACTIONS di Code.gs (backend).
 ******************************************************************/

const GET_ACTIONS = {
  GET_ACCOUNTS: 'getAccounts',
  GET_PERIODS: 'getPeriods',
  GET_DASHBOARD_DATA: 'getDashboardData'
};

const POST_ACTIONS = {
  PREVIEW_PARSE: 'previewParse',
  SAVE_IMPORT: 'saveImport',
  SAVE_MANUAL: 'saveManual',
  SAVE_PCP_REACH_INPUT: 'savePcpReachInput',
  SAVE_PCP_AUDIENCE_INPUT: 'savePcpAudienceInput'
};

const POST_CONTENT_TYPE = 'text/plain;charset=utf-8'; // hindari CORS preflight ke Apps Script

/******************************************************************
 * CONFIGURATION
 * ----------------------------------------------------------------
 * URL Web App hasil Deploy Apps Script.
 ******************************************************************/

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw9nrP4V0zyHvkB7Z0-a-n0KVTxFszFlJ_Qn0TQyIInhEduu9PNyrVPyGpcGym2mTSSaw/exec';

/******************************************************************
 * HTTP HELPERS
 * ----------------------------------------------------------------
 * Fungsi pemanggil Apps Script Web App.
 ******************************************************************/

/******************************************************************
 * Function : apiGet()
 * Tujuan   : Memanggil action GET (baca data) ke Apps Script.
 ******************************************************************/
async function apiGet(action, params) {
  const requestUrl = new URL(APPS_SCRIPT_URL);
  requestUrl.searchParams.set('action', action);
  Object.keys(params || {}).forEach(key => requestUrl.searchParams.set(key, params[key]));

  console.log("[API_GET]", action, params || {});
  try {
    const response = await fetch(requestUrl.toString());
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    return data;
  } catch (error) {
    console.error("[API_GET]", error);
    throw error;
  }
}

/******************************************************************
 * Function : apiPost()
 * Tujuan   : Memanggil action POST (tulis data) ke Apps Script.
 ******************************************************************/
async function apiPost(action, body) {
  console.log("[API_POST]", action);
  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': POST_CONTENT_TYPE },
      body: JSON.stringify(Object.assign({ action }, body))
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    return data;
  } catch (error) {
    console.error("[API_POST]", error);
    throw error;
  }
}
