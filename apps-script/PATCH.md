# 上線步驟（失智問卷存檔修復＋端點驗證）

> 這份取代先前的 `Code.gs`／`DEPLOY.md`。原本那份假設要「新建一個乾淨的接收端」，
> 但實地查證後發現**既有端點同時服務 MoCA-T 與失智問卷兩個工具**，整份換掉會弄壞
> MoCA-T。因此改為：**保留原專案、只加一個檔＋改三行**。

## 背景：問題出在哪

| 工具 | 存檔狀態 | 原因 |
|---|---|---|
| MoCA-T | ✅ 正常 | `appendMocaRow()` 有「整合表被刪就依名稱重找或新建」的後援 |
| 失智問卷 | ❌ 壞掉 | 走 `DriveApp.getFileById(OLD_CSV_ID)`，而該 ID 已失效（整合表被重建過，同名但不同 ID）→ 整個 `doPost` 拋錯 |

`OLD_CSV_ID = "155wCSqCAY3sh8AKlYHKLKxrlOxWAzSGv"` 對應的檔案已不存在（實測 Drive 回「檔案不存在」）。
資料夾 `失智症評估資料`（`19lWr9E2Rzw65Au93TSwcWiJj3K86iW_s`）與同名新整合表都還在。

---

## 步驟 1：加入 Security.gs

Apps Script 專案 →「檔案」旁的 **+** →「指令碼」→ 命名 `Security` → 把
[`Security.gs`](Security.gs) 的**全部內容**貼進去覆蓋預設的 `myFunction`。

## 步驟 2：改「程式碼.gs」三個地方

用編輯器的尋找取代（Ctrl+H），**依序**執行。第 1 項的字串包含第 2 項，順序不可顛倒。

**① 修好資料夾反查（約第 38 行）**

```
尋找：  DriveApp.getFileById(OLD_CSV_ID).getParents().next()
取代：  getQuestionnaireFolder_()
```

**② 修好整合表反查（約第 129 行）**

```
尋找：  DriveApp.getFileById(OLD_CSV_ID)
取代：  getQuestionnaireCsv_()
```

**③ 加上請求閘門（約第 25 行）**

```
尋找：  var contents = e.postData.contents;
取代：  var g = guard_(e); if (g) return g; var contents = e.postData.contents;
```

改完存檔（Ctrl+S）。

## 步驟 3：設定指令碼屬性

「專案設定」（左側齒輪）→ 指令碼屬性 → 新增：

| 屬性 | 值 |
|---|---|
| `SHARED_TOKEN` | 一段隨機字串，見下方產生指令 |
| `ENFORCE_TOKEN` | **先填 `false`** |

產生權杖（PowerShell）：

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

> ⚠️ `ENFORCE_TOKEN` 先設 `false` 是刻意的：此時只有大小上限、格式檢查與速率限制生效，
> **兩個前端都還不用改就能繼續運作**。等前端都送權杖了再開啟強制（步驟 6），
> 才不會一部署就把 MoCA-T 打死。

## 步驟 4：部署新版本（網址不變）

「部署」→「管理部署作業」→ 既有部署的 **鉛筆（編輯）** → 版本選 **「新版本」** → 「部署」。

⚠️ **不要建立「新增部署作業」**——那會產生新網址，兩個前端都要改。
編輯既有部署會沿用同一個 `/exec` 網址。

## 步驟 5：驗證存檔已修復

1. 開 <https://a7662888.github.io/dementia-assessment/>，用**測試資料**（姓名填「測試」、病歷號填 `TEST001`）跑一次完整評估。
   - 此時前端 `UPLOAD_CONFIG` 若仍是佔位字串就不會上傳；先把 `scriptUrl` 填成既有的 `/exec` 網址、`sharedToken` 填步驟 3 的權杖。
2. 檢查 Drive 的 `失智症評估資料` 資料夾應多出一個 `評估_TEST001_....json`，且 `所有評估資料整合.csv` 多一列。
3. 用 MoCA-T 也跑一筆，確認 `MoCA評估資料` 資料夾同樣有新檔（確認沒被我們改壞）。

## 步驟 6：開啟權杖強制（前端都更新後才做）

確認兩個前端都會送 `token` 之後，把指令碼屬性 `ENFORCE_TOKEN` 改成 `true`。
**這一步不需要重新部署**，屬性即時生效。改完再各跑一筆測試確認仍能存檔。

---

## 仍然存在、且只有你能處理的風險

1. **舊端點網址曾公開在 GitHub**，且舊 commit SHA 目前仍可取得。
   權杖只擋隨機掃描，擋不住看過原始碼的人。**真正的強防護**是把部署的
   「具有存取權的使用者」收成「僅限特定使用者／你的網域」，讓 Google 先驗身分——
   但這會要求填答者登入 Google 帳號，家屬在家自行填寫的情境會不適用。這是取捨，你決定。
2. **資料夾標示「已共用」**，請自行確認分享對象與權限是否符合預期。
3. **無 IRB**：資料夾內已有約 40 筆紀錄（2025-10 至 2026-07），含真實姓名與病歷號。
   若要用於研究或發表，請先與機構 IRB 確認補件程序。往後建議改存代碼化 ID
   （→ 技能 `deidentify`）。
