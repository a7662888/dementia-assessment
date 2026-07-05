/**
 * Google Apps Script Web App — 臨床問卷與 MoCA-T 評估資料雙軌分流存檔（v2，2026-07-05 修正版）
 *
 * ⚠️ 本版修正重點（取代 Antigravity 前版）：
 *   1. 前版第 23 行 `HtmlService.createHtmlOutput("").getAs("text/plain").getId()` 為無效呼叫
 *      （Blob 無 getId），部署後會整包拋錯、任何資料都存不進去——已移除。
 *   2. 改用「固定 Drive ID」決定性路由（不再依名稱搜尋，杜絕同名資料夾誤中）：
 *      - MoCA-T 個案 → MoCA評估資料 資料夾（MOCA_FOLDER_ID）＋ 所有MoCA評估資料整合.csv（MOCA_CSV_ID）
 *      - 原結構問卷 → 維持原資料夾（以舊整合表 OLD_CSV_ID 反查其所在資料夾）
 *
 * 部署方式（每次改碼後都要做，否則線上仍跑舊版）：
 *   1. 開啟原部署此服務的 Apps Script 專案，全選貼上本檔內容覆蓋。
 *   2. 「部署」→「管理部署」→ 鉛筆「編輯」→ 版本選「新版本」→「部署」。
 *   3. Web App 網址不變，前端不用改。
 *   4. 部署後用網頁跑一筆測試個案，確認 JSON 進 MoCA評估資料、整合表多一列。
 */

// ====== 固定 Drive ID（來自使用者提供之連結，2026-07-05）======
var MOCA_FOLDER_ID = "1Zcu1MezReE0TupVZ_k5Rxb6zOWYPkcPZ";   // 資料夾：MoCA評估資料
var MOCA_CSV_ID    = "1DH0c5tYnigrhZsQyQGOiRJur8jOvJOHN";   // 檔案：所有MoCA評估資料整合.csv
var OLD_CSV_ID     = "155wCSqCAY3sh8AKlYHKLKxrlOxWAzSGv";   // 檔案：所有評估資料整合.csv（原問卷，用來反查原資料夾）

function doPost(e) {
  try {
    var contents = e.postData.contents;
    var data = JSON.parse(contents);

    // 1. 判斷是否為 MoCA-T 資料（前端 getExportData() 的 tool 欄含 "MoCA"）
    var isMoca = !!(data.tool && String(data.tool).indexOf("MoCA") !== -1) ||
                 !!(data.metadata && data.metadata.toolVersion &&
                    String(data.metadata.toolVersion).indexOf("MoCA") !== -1);

    // 2. 決定目標資料夾（固定 ID，決定性）
    var targetFolder;
    if (isMoca) {
      targetFolder = DriveApp.getFolderById(MOCA_FOLDER_ID);
    } else {
      targetFolder = DriveApp.getFileById(OLD_CSV_ID).getParents().next();
    }

    var chartNumber = (data.patientInfo && data.patientInfo.chartNumber) ? data.patientInfo.chartNumber : "unknown";
    var patientName = (data.patientInfo && data.patientInfo.name) ? data.patientInfo.name : "case";
    var timestamp = new Date().getTime();

    // 3. 儲存個案原始 JSON（前端已排除手繪圖以縮小 payload）
    var fileName = "評估_" + (isMoca ? "moca_" : "") + patientName + "_" + chartNumber + "_" + timestamp + ".json";
    targetFolder.createFile(fileName, contents, "application/json");

    // 4. 追加一列到對應的母整合表
    if (isMoca) {
      appendMocaRow(data, chartNumber, patientName);
    } else {
      appendQuestionnaireRow(data, chartNumber, patientName);
    }

    return ContentService.createTextOutput(JSON.stringify({ success: true, fileName: fileName, route: isMoca ? "moca" : "questionnaire" }))
                         .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: err.toString() }))
                         .setMimeType(ContentService.MimeType.JSON);
  }
}

// ====== MoCA-T 母試算表（欄位順序 = CSV 表頭順序，為跨系統 SSOT，勿任意調換）======
function appendMocaRow(data, chartNumber, patientName) {
  var csvFile;
  try {
    csvFile = DriveApp.getFileById(MOCA_CSV_ID);
  } catch (e2) {
    // 後援：整合表被移動/刪除時，改以名稱在 MoCA 資料夾內找或新建
    var folder = DriveApp.getFolderById(MOCA_FOLDER_ID);
    var files = folder.getFilesByName("所有MoCA評估資料整合.csv");
    if (files.hasNext()) {
      csvFile = files.next();
    } else {
      var header = "評估日期,匯出時間,病歷號,病患姓名,年齡,性別,教育程度(年數),原始總分,教育加分,常模校正總分(Adj),百分等級(PR),z分數,領域_視覺空間原始,領域_命名原始,領域_專注力原始,領域_語言原始,領域_抽象原始,領域_延遲記憶原始,領域_定向原始\n";
      csvFile = folder.createFile("所有MoCA評估資料整合.csv", header, "text/csv;charset=utf-8");
    }
  }

  var p = data.patientInfo || {}, r = data.results || {}, d = data.domains || {}, m = data.metadata || {};
  var row = [
    cleanCsvCell(p.assessmentDate || ""),
    cleanCsvCell(m.exportDate || ""),
    cleanCsvCell(chartNumber),
    cleanCsvCell(patientName),
    cleanCsvCell(p.age !== undefined ? p.age : ""),
    cleanCsvCell(p.gender || ""),
    cleanCsvCell(p.education !== undefined ? p.education : ""),
    cleanCsvCell(r.totalScore !== undefined ? r.totalScore : ""),
    cleanCsvCell(r.educationBonus !== undefined ? r.educationBonus : ""),
    cleanCsvCell(r.adjTotalScore !== undefined && r.adjTotalScore !== null ? r.adjTotalScore : ""),
    cleanCsvCell(r.totalPR !== undefined && r.totalPR !== null ? r.totalPR : "N/A"),
    cleanCsvCell(r.totalZ !== undefined && r.totalZ !== null ? r.totalZ : ""),
    cleanCsvCell(d.vs !== undefined ? d.vs : ""),
    cleanCsvCell(d.naming !== undefined ? d.naming : ""),
    cleanCsvCell(d.attention !== undefined ? d.attention : ""),
    cleanCsvCell(d.language !== undefined ? d.language : ""),
    cleanCsvCell(d.abstract !== undefined ? d.abstract : ""),
    cleanCsvCell(d.memory !== undefined ? d.memory : ""),
    cleanCsvCell(d.orientation !== undefined ? d.orientation : "")
  ].join(",") + "\n";

  csvFile.setContent(csvFile.getBlob().getDataAsString("UTF-8") + row);
}

// ====== 原結構問卷母表（欄位完全維持原樣，不影響既有問卷）======
function appendQuestionnaireRow(data, chartNumber, patientName) {
  var csvFile = DriveApp.getFileById(OLD_CSV_ID);
  var p = data.patientInfo || {}, r = data.results || {}, m = data.metadata || {};
  var pc = r.percentages || {};
  var row = [
    cleanCsvCell(p.assessmentDate || ""),
    cleanCsvCell(m.exportDate || ""),
    cleanCsvCell(chartNumber),
    cleanCsvCell(patientName),
    cleanCsvCell(p.birthDate || ""),
    cleanCsvCell(p.age !== undefined ? p.age : ""),
    cleanCsvCell(p.gender || ""),
    cleanCsvCell(p.education !== undefined ? p.education : ""),
    cleanCsvCell(p.informantName || ""),
    cleanCsvCell(p.informantRelation || ""),
    cleanCsvCell(r.overallRisk || ""),
    cleanCsvCell(r.adlImpairment !== undefined ? r.adlImpairment : ""),
    cleanCsvCell(pc.AD !== undefined ? pc.AD : ""),
    cleanCsvCell(pc.DLB !== undefined ? pc.DLB : ""),
    cleanCsvCell(pc.VaD !== undefined ? pc.VaD : ""),
    cleanCsvCell(pc.FTD !== undefined ? pc.FTD : ""),
    cleanCsvCell(pc.PPA !== undefined ? pc.PPA : "")
  ].join(",") + "\n";
  csvFile.setContent(csvFile.getBlob().getDataAsString("UTF-8") + row);
}

// 輔助：清洗儲存格（半形逗號→全形、去換行）
function cleanCsvCell(val) {
  if (val === null || val === undefined) return "";
  var s = String(val).replace(/,/g, "，");
  s = s.replace(/[\r\n]+/g, " ");
  return s;
}
