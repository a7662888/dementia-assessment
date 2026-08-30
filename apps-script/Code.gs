/**
 * 失智評估工具 — 接收端（Google Apps Script Web App）
 *
 * 取代原本「無驗證、任何人可 POST」的版本。部署後請把新的 /exec URL 與
 * SHARED_TOKEN 一併更新到 index.html 的 UPLOAD_CONFIG。
 *
 * 安全模型（務必理解其極限）：
 *   前端沒有秘密。SHARED_TOKEN 寫在 index.html 裡就等同公開，它只擋掉
 *   「掃到 /exec 就亂送」的機器人與誤觸，擋不住看過原始碼的人。
 *   真正的強防護是部署時把存取權限收成「僅限特定使用者／機構帳號」，
 *   讓 Google 先驗身分（見 DEPLOY.md）。此檔提供的是在「Anyone」部署下
 *   仍應具備的最低限度防禦：token + schema 驗證 + 大小上限 + 速率限制。
 */

// ── 設定 ─────────────────────────────────────────────
// SHARED_TOKEN 存在 Script Properties，不要寫死在程式碼裡。
// 設定方式：Apps Script 編輯器 → 專案設定 → 指令碼屬性 → 新增
//   屬性 = SHARED_TOKEN，值 = 自行產生的隨機字串（見 DEPLOY.md）
const PROP = PropertiesService.getScriptProperties();
const FOLDER_ID = PROP.getProperty('FOLDER_ID');      // 接收資料的 Drive 資料夾 ID
const SHARED_TOKEN = PROP.getProperty('SHARED_TOKEN'); // 共用權杖

const MAX_BYTES = 100 * 1024;   // 單筆上限 100KB，擋巨量灌注
const RATE_LIMIT_MAX = 20;      // 每個時間窗最多幾筆
const RATE_LIMIT_WINDOW = 600;  // 時間窗（秒）= 10 分鐘

// 允許的欄位（白名單）；未列出的欄位一律丟棄，避免被塞入任意結構
const ALLOWED_TOP_KEYS = [
  'metadata', 'patientInfo', 'responses', 'results',
  'abnormalSymptoms', 'recommendations', 'consent'
];

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/** GET 不提供任何資料，避免端點被當成讀取介面。 */
function doGet() {
  return json_({ success: false, message: 'Method not allowed' });
}

/** 速率限制：以 CacheService 計數，超過即拒收。 */
function rateLimitExceeded_() {
  const cache = CacheService.getScriptCache();
  const key = 'rl_' + Math.floor(Date.now() / (RATE_LIMIT_WINDOW * 1000));
  const current = Number(cache.get(key) || 0);
  if (current >= RATE_LIMIT_MAX) return true;
  cache.put(key, String(current + 1), RATE_LIMIT_WINDOW);
  return false;
}

/** 只保留白名單欄位。 */
function sanitize_(payload) {
  const out = {};
  ALLOWED_TOP_KEYS.forEach(function (k) {
    if (Object.prototype.hasOwnProperty.call(payload, k)) out[k] = payload[k];
  });
  return out;
}

/** 檔名只允許安全字元，避免路徑或控制字元。 */
function safeName_(s) {
  return String(s || 'unknown').replace(/[^A-Za-z0-9_\-]/g, '_').slice(0, 40);
}

function doPost(e) {
  try {
    if (!SHARED_TOKEN || !FOLDER_ID) {
      return json_({ success: false, message: 'Server not configured' });
    }

    // 1) 大小上限
    const raw = (e && e.postData && e.postData.contents) || '';
    if (!raw || raw.length > MAX_BYTES) {
      return json_({ success: false, message: 'Bad request' });
    }

    // 2) 解析
    let payload;
    try {
      payload = JSON.parse(raw);
    } catch (err) {
      return json_({ success: false, message: 'Bad request' });
    }
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return json_({ success: false, message: 'Bad request' });
    }

    // 3) 權杖驗證（訊息一律模糊，不告訴對方是哪一關卡掉的）
    if (payload.token !== SHARED_TOKEN) {
      return json_({ success: false, message: 'Unauthorized' });
    }

    // 4) 結構驗證：必須看起來像一份評估資料
    if (!payload.patientInfo || typeof payload.patientInfo !== 'object' ||
        !payload.responses || typeof payload.responses !== 'object') {
      return json_({ success: false, message: 'Bad request' });
    }

    // 5) 同意紀錄：未取得同意者不收（與前端同意閘門一致）
    if (!payload.consent || payload.consent.agreed !== true) {
      return json_({ success: false, message: 'Consent required' });
    }

    // 6) 速率限制
    if (rateLimitExceeded_()) {
      return json_({ success: false, message: 'Rate limited' });
    }

    // 7) 落地（只寫白名單欄位，token 不寫入檔案）
    const clean = sanitize_(payload);
    clean.serverReceivedAt = new Date().toISOString();

    const fileName = 'assessment_' +
      safeName_(clean.patientInfo && clean.patientInfo.recordId) + '_' +
      Date.now() + '.json';

    const folder = DriveApp.getFolderById(FOLDER_ID);
    const file = folder.createFile(fileName, JSON.stringify(clean, null, 2), MimeType.PLAIN_TEXT);

    return json_({ success: true, fileName: file.getName() });
  } catch (err) {
    // 不把內部錯誤細節回給呼叫端
    console.error(err);
    return json_({ success: false, message: 'Server error' });
  }
}
