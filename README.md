# 臨床病史失智診斷結構性問卷 v2.0

🏥 **互動式失智症評估工具 v2.0，精確區分 PDD/DLB，具備自動化雲端資料收集與統計分析功能。**

🌟 **功能特色**

* ✅ **互動式評估介面** - 友善的問卷填寫體驗，優化題目結構。
* ✅ **即時風險評估** - 自動計算各類型失智症 (AD, VaD, FTD, PPA) 相對機率。
* ✅ **精確鑑別診斷** - 依據最新臨床「一年條款」指引，自動區分 **PDD** (巴金森病失智症) 與 **DLB** (路易氏體失智症)。
* ✅ **優化權重系統** - 強化 Lewy 體光譜 (LBS) 核心症狀權重 (x2.0)，並納入中風病史對 AD/LBS 的診斷排斥效應。
* ✅ **多格式報告** - 即時生成網頁報告、下載文字 (.txt) 報告與原始 JSON 資料。
* ✅ **自動雲端儲存** - 完成評估後，資料 **自動、無感** 上傳至 Google Drive (需由使用者自行設定 Google Apps Script)。
* ✅ **返回修改功能** - 結果頁面可返回問卷修改答案。
* ✅ **隱私保護** - 純前端運算，資料加密傳輸至使用者指定的 Google Drive。
* *（可選，如仍使用）* ✅ **自動化統計 (GitHub)** - 可搭配 GitHub Actions 自動合併分析上傳的資料。
* *（可選，如仍使用）* ✅ **Excel 報表 (GitHub)** - 自動生成多工作表統計分析報告 (需 GitHub Actions)。

📊 **使用方式**

**線上評估 (主要功能)**

1.  前往 [https://a7662888.github.io/dementia-assessment/](https://a7662888.github.io/dementia-assessment/)
2.  填寫基本資料。
3.  依序完成評估問卷（共 10 大項目）。
4.  查看即時生成的評估結果報告。
5.  資料將在背景 **自動儲存** 至預先設定的 Google Drive。
6.  可選擇「下載文字報告」或「僅匯出 JSON」以供本機存檔或進一步分析。

**查看報表 (需搭配額外設定)**

* **Google Drive**: 前往您設定接收資料的 Google Drive 資料夾，查看儲存的 JSON 檔案或對應 Google Sheet (需自行設定 Apps Script 寫入試算表)。
* **GitHub Actions (如仍使用)**:
    1.  前往 `reports/` 資料夾。
    2.  下載 `all_assessments_latest.xlsx`。
    3.  查看包含完整資料、摘要統計、交叉分析等的報表。

🔧 **技術架構**

* **前端**: HTML5 + CSS3 + JavaScript (純靜態網頁，無後端依賴)
* **資料上傳**: Fetch API 將 JSON 資料 POST 至 Google Apps Script Web App
* **雲端儲存**: Google Drive (透過 Google Apps Script)
* *（可選）* **自動統計 (GitHub)**: Python + Pandas + OpenPyXL (用於 GitHub Actions)
* *（可選）* **自動化 (GitHub)**: GitHub Actions

📁 **檔案結構**

* `index.html`: 主要的評估工具網頁。
* `reports/`: (如果使用 GitHub Actions) 存放自動生成的 Excel 統計報表。
* `README.md`: 本說明文件。
* `.github/workflows/`: (如果使用 GitHub Actions) 包含自動化處理腳本。

---

*請注意：自動上傳至 Google Drive 的功能需要使用者自行創建並部署一個 Google Apps Script Web App，並將其 URL 填入 `index.html` 檔案中的 `scriptUrl` 變數。*
