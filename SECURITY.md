# 資安審查與處置紀錄

- **審查日期**：2026-08-30
- **審查依據**：`web-app-security-review` 技能（四階段：前端原始碼／傳輸與標頭／儲存與公開面／個資法・IRB）
- **受審標的**：`https://a7662888.github.io/dementia-assessment/` 與其 GitHub repo、Google Apps Script 接收端
- **當時狀態**：repo 內僅有測試資料（姓名／病歷號為 `123`、`456` 等），**未發現真實受試者資料外洩**

---

## 1. 發現與處置

| # | 嚴重度 | 發現 | 證據 | 處置 |
|---|---|---|---|---|
| S1 | 🔴 危急 | GAS 接收端無任何身分驗證，端點 URL 明碼於前端；任何人可 POST 任意 JSON | 對 `/exec` 送測試 POST 回 HTTP 200 並進入處理流程 | 已寫 `apps-script/Code.gs`（token＋schema 驗證＋大小上限＋速率限制＋同意檢查）；前端改為 `UPLOAD_CONFIG`。**待你部署** |
| S2 | 🔴 危急 | 收集資料與彙整報表位於 **公開** repo（`data/*.json`、`reports/*.xlsx|csv`），且 CI 自動 commit | `git ls-files` 列出 13 個檔案；`process-data.yml` 有 `contents: write` 並自動 push | 已 `git rm --cached` 全部移出版控、新增 `.gitignore`、停用該 workflow。**git 歷史仍在，待你執行 §2 清理** |
| S3 | 🟠 高 | 文案宣稱「自動加密儲存至雲端」，實際僅 HTTPS 傳輸，落地為明文 JSON | `index.html` 說明區 | 已改為據實描述（HTTPS 傳輸／Drive 未加密儲存） |
| S4 | 🟠 高 | 無個資法 §8 告知事項、無同意機制即上傳可識別醫療資料 | 前端無同意流程 | 已加入告知事項區塊與同意勾選；**未勾選則不上傳**，僅本機評估 |
| S5 | ⚪ 不成立 | 初判疑似 `innerHTML` XSS | 複查：兩處 `innerHTML` 僅渲染題庫定義與運算結果，`patientInfo` 從未進入 HTML | 無需修補；相關的**檔名注入**已修（`safeFileNamePart`） |
| S6 | 🔵 低 | 存在多個 GAS 部署（live 用 `AKfycbw3…`，另有 `AKfycbz…`），來源不明 | 前端原始碼 vs 使用者提供的 URL | 前端已移除硬編碼端點；**待你盤點並停用舊部署**（§3） |

> 分級定義見技能 `web-app-security-review`：🔴 上線／收真人前必修；🟠 高；🟡 中；🔵 低。

---

## 2. 已執行：清除 git 歷史中的資料檔（2026-08-30）

已完成：

1. `git filter-repo` 從全部 37 個 commit 移除 `data/*.json`、`reports/*.csv`、`reports/*.xlsx`（保留 `.gitkeep`）。
2. 一併移除 `.github/workflows/`——該管線會把含個資的報表自動 commit 回公開 repo，是 S2 的成因；本機統計改跑 `py -3 -X utf8 scripts/merge_data.py`（腳本仍在）。
3. `git push --force` 改寫遠端 main。
4. 備份保留於 `D:\secondbrain\Codex\dementia-assessment.backup-20260830-134330`。

驗證：走 main 路徑的資料檔皆已 404。

### ⚠️ 殘留風險：舊 commit SHA 仍可下載

實測確認，force push **不會**讓 GitHub 立即回收 unreachable objects：

| 路徑 | 結果 |
|---|---|
| `raw.githubusercontent.com/.../main/reports/all_assessments_latest.csv` | 404 ✅ |
| `raw.githubusercontent.com/.../764e5a4.../reports/all_assessments_latest.csv` | **200，內容完整** ❌ |

舊的 `index.html`（含硬編碼 GAS 端點）同樣仍可由舊 SHA 取得。

因目前外洩的只有測試資料（姓名／病歷號為 `123`、`456`），風險可接受。**但收真人資料前**應擇一處理：

1. 向 GitHub Support 申請對本 repo 執行 gc／清除 unreachable objects（官方處理敏感資料外洩的途徑）。
2. 或刪除 repo 重建。

⚠️ 舊端點 URL 既然已經公開過，**唯一有效的處置是封存該 GAS 部署**（見 §3.2），而不是把 URL 從程式碼裡刪掉。

## 3. 待執行：repo 可見性與 GAS 部署

### 3.1 repo 可見性（需你決定）
把 repo 設為 private 是消除 S2 的最徹底做法，但 **GitHub Pages 在免費方案下不支援 private repo**，網站會下線。三個選項：

| 選項 | 結果 |
|---|---|
| A. 維持 public，但資料絕不進 repo（已由 `.gitignore` 與停用 CI 落實） | 網站續行；需持續紀律 |
| B. repo 設 private + 升級付費方案 | 網站續行且資料面最安全 |
| C. 拆成兩個 repo：public 只放前端、private 放資料與分析 | 較乾淨，需一次搬遷 |

目前預設走 **A**（不改動你的帳號設定）。

### 3.2 部署新的 Apps Script 接收端
見 `apps-script/DEPLOY.md`。完成後把 `/exec` URL 與 token 填入 `index.html` 的 `UPLOAD_CONFIG`，並**停用所有舊部署**（Apps Script 編輯器 → 部署 → 管理部署作業 → 封存）。

---

## 4. Go / No-Go

**目前：收真人個資 = BLOCK。**

解除條件（全部達成才可收真人）：
1. `apps-script/Code.gs` 已部署，且 `UPLOAD_CONFIG` 已填入新 URL 與 token（解除 S1）
2. 已執行 §2 歷史清理，且確認 repo 不再出現任何資料檔（解除 S2）
3. 舊 GAS 部署已全部封存（解除 S6）
4. 告知事項中的「蒐集者」已填為實際負責機構／研究者
5. 研究用途者：已取得 IRB 核准與受試者同意書（→ 技能 `irb-consent-assistant`）
6. 已評估是否改存代碼化 ID 而非姓名＋病歷號（→ 技能 `deidentify`）

**目前可做**：本機評估、下載報告、以測試資料驗證流程。
