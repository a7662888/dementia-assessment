# 臨床病史失智診斷結構性問卷

🏥 互動式失智症評估工具，具備自動化資料收集與統計分析功能

## 🌟 功能特色

- ✅ **互動式評估介面** - 友善的問卷填寫體驗
- ✅ **即時風險評估** - 自動計算各類型失智症機率
- ✅ **多格式報告** - 生成文字報告與 JSON 資料
- ✅ **自動化統計** - GitHub Actions 自動合併分析
- ✅ **Excel 報表** - 多工作表統計分析報告
- ✅ **隱私保護** - 資料加密傳輸與安全儲存

## 📊 使用方式

### 線上評估
1. 前往 https://a7662888.github.io/dementia-assessment/
2. 填寫基本資料
3. 完成評估問卷（9大項目）
4. 查看評估結果
5. 下載報告或上傳到 GitHub

### 資料上傳
1. 完成評估後選擇「匯出資料」
2. 選擇上傳到 GitHub
3. 輸入 GitHub Personal Access Token
4. 系統自動處理並生成統計報表

### 查看報表
- 前往 `reports/` 資料夾
- 下載 `all_assessments_latest.xlsx`
- 包含完整資料、摘要統計、交叉分析等

## 🔧 技術架構

- **前端**: HTML5 + CSS3 + JavaScript (純靜態網頁)
- **資料處理**: Python + Pandas + OpenPyXL
- **自動化**: GitHub Actions
- **儲存**: GitHub Repository

## 📁 檔案結構