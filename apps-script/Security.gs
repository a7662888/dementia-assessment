// 2026-08-30 資安強化＋失智問卷存檔修復
//
// 用途：新增到既有的「失智症評估資料收集系統」Apps Script 專案，成為第二個 .gs 檔。
// 刻意不改動原「程式碼.gs」的結構——原檔同時服務 MoCA-T 與失智問卷兩個工具，
// 整份改寫風險過高。本檔只提供輔助函式，再對原檔做三處單行取代（見 PATCH.md）。
//
// 修的兩件事：
// 1. 失智問卷存檔壞掉：原檔用 DriveApp.getFileById(OLD_CSV_ID) 反查資料夾與整合表，
//    而該檔案 ID 已失效（整合表被重建過，同名但不同 ID）→ 整包拋錯、什麼都存不進去。
//    MoCA 那條路徑本來就有「找不到就依名稱重找或新建」的後援，問卷這條沒有；
//    本檔把同樣的後援補上。
// 2. 端點無任何驗證：加入大小上限、JSON 格式檢查、速率限制，以及可開關的權杖驗證。

// ====== 失智問卷（原結構問卷）的落點 ======
var QUESTIONNAIRE_FOLDER_ID = "19lWr9E2Rzw65Au93TSwcWiJj3K86iW_s"; // 資料夾：失智症評估資料
var QUESTIONNAIRE_CSV_NAME = "所有評估資料整合.csv";

// ====== 濫用防護參數 ======
var MAX_POST_BYTES = 100000; // 單筆上限 100KB
var RATE_MAX = 30;           // 每個時間窗最多幾筆
var RATE_WINDOW_SEC = 600;   // 時間窗 10 分鐘

function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 請求閘門。回傳 null 代表放行；回傳物件代表應直接把它當作回應拒絕。
 *
 * ENFORCE_TOKEN 這個指令碼屬性未設為 "true" 時不強制權杖，
 * 讓「先部署伺服器、再更新前端、最後才開啟強制」可以零停機完成——
 * 否則一部署就會把還沒送權杖的 MoCA-T 前端打死。
 */
function guard_(e) {
  var raw = (e && e.postData && e.postData.contents) ? e.postData.contents : "";
  if (!raw || raw.length > MAX_POST_BYTES) {
    return jsonOut_({ success: false, message: "Bad request" });
  }

  var data = null;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    return jsonOut_({ success: false, message: "Bad request" });
  }
  if (!data || typeof data !== "object") {
    return jsonOut_({ success: false, message: "Bad request" });
  }

  var props = PropertiesService.getScriptProperties();
  if (props.getProperty("ENFORCE_TOKEN") === "true") {
    var expected = props.getProperty("SHARED_TOKEN");
    // 訊息一律模糊，不告訴對方是哪一關卡掉的
    if (!expected || data.token !== expected) {
      return jsonOut_({ success: false, message: "Unauthorized" });
    }
  }

  var cache = CacheService.getScriptCache();
  var key = "rl_" + Math.floor(Date.now() / (RATE_WINDOW_SEC * 1000));
  var n = Number(cache.get(key) || 0);
  if (n >= RATE_MAX) {
    return jsonOut_({ success: false, message: "Rate limited" });
  }
  cache.put(key, String(n + 1), RATE_WINDOW_SEC);

  return null;
}

/** 失智問卷的目標資料夾（直接用資料夾 ID，不再靠檔案反查而失效）。 */
function getQuestionnaireFolder_() {
  return DriveApp.getFolderById(QUESTIONNAIRE_FOLDER_ID);
}

/** 失智問卷的整合表；找不到就依名稱重找，再找不到就新建（與 MoCA 路徑同樣的後援）。 */
function getQuestionnaireCsv_() {
  var folder = getQuestionnaireFolder_();
  var files = folder.getFilesByName(QUESTIONNAIRE_CSV_NAME);
  if (files.hasNext()) {
    return files.next();
  }
  var header = "AssessmentDate,ExportDate,ChartNumber,PatientName,BirthDate,Age,Gender," +
    "Education,InformantName,InformantRelation,OverallRisk,ADLImpairment," +
    "Prob_AD,Prob_DLB,Prob_VaD,Prob_FTD,Prob_PPA\n";
  return folder.createFile(QUESTIONNAIRE_CSV_NAME, header, "text/csv;charset=utf-8");
}
