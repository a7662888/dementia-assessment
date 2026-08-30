# 部署新的接收端（Apps Script）

取代舊的「無驗證、任何人可 POST」端點。全程約 10 分鐘。

## 1. 產生 SHARED_TOKEN

在 PowerShell 執行，取得一段隨機字串：

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

## 2. 建立／更新 Apps Script 專案

1. 開啟 <https://script.google.com> → 新增專案（或開啟既有專案）。
2. 把 `Code.gs` 的內容整份貼進編輯器，覆蓋舊程式碼。
3. 左側「專案設定」→ 勾選「在編輯器中顯示 `appsscript.json`」（若需調整權限範圍）。
4. 「專案設定」→ **指令碼屬性** → 新增兩筆：

   | 屬性 | 值 |
   |---|---|
   | `SHARED_TOKEN` | 步驟 1 產生的字串 |
   | `FOLDER_ID` | 接收資料的 Drive 資料夾 ID（資料夾網址 `/folders/` 後那段） |

## 3. 部署

「部署」→「新增部署作業」→ 類型選「網頁應用程式」：

| 設定 | 建議值 |
|---|---|
| 執行身分 | 我（你的帳號） |
| 具有存取權的使用者 | **視情況，見下方** |

- **僅供你或機構同仁使用** → 選「僅限 <你的網域> 的使用者」。**這是最強的防護**：Google 會先驗身分，未登入者根本打不到你的程式。
- **需讓不特定家屬填寫** → 只能選「任何人」，此時 `Code.gs` 的 token＋速率限制＋schema 驗證就是你唯一的防線。請理解 token 寫在前端等同公開，它擋機器人、不擋人。

部署後複製 `/exec` 網址。

## 4. 回填前端

編輯 `index.html` 的 `UPLOAD_CONFIG`：

```js
const UPLOAD_CONFIG = {
    scriptUrl: 'https://script.google.com/macros/s/你的新ID/exec',
    sharedToken: '步驟1產生的字串'
};
```

## 5. 封存舊部署

Apps Script 編輯器 →「部署」→「管理部署作業」→ 把所有舊版本**封存**。
已知存在至少兩個舊部署（`AKfycbw3…`、`AKfycbz…`），兩個都要處理。

## 6. 驗證

1. 用測試資料跑一次完整流程 → 瀏覽器 Console 應出現 `Upload success:`。
2. 不勾選同意再跑一次 → 應出現 `Upload skipped: no consent.`，且 Drive 不應有新檔。
3. 用錯誤 token 手動送一筆 → 應回 `Unauthorized`。
