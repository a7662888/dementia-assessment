/* 生物標記確認與抗類澱粉蛋白單株抗體治療（ATT）醫病共享決策模組
 * 內容取自院內已通過第二次認證之 SDM 輔助工具（證據與價格查核日：2026-08-26）。
 * 所有數值沿用該文件，未另行推估。價格與仿單會變動，介面上會顯示查核日。
 */
window.ATT = {
  ref: 'attSdm',
  checkedOn: '2026-08-26',

  title: '疑似早期阿茲海默症：我要進一步確認類澱粉蛋白，並接受單株抗體治療嗎？',

  framing: '這不是一次只能選一個答案的考題。您面對的是兩個相連但可以分開的決定：第一，是否以 amyloid PET 或腦脊髓液確認腦內類澱粉蛋白病理；第二，若檢查為陽性且安全評估合格，是否接受抗類澱粉蛋白單株抗體治療（ATT）。您可以先檢查、之後再決定治療，也可以暫緩並持續一般照護。',

  suitability: {
    intro: '本模組適合已完成基本臨床評估、懷疑為阿茲海默症造成的輕度認知障礙或輕度失智，正在考慮是否進一步做生物標記檢查及 ATT 的病人與家屬。',
    items: [
      '有客觀認知功能下降，疾病程度仍屬早期（常見參考：CDR 0.5–1；認知量表須由醫師依藥物與個案判讀）。',
      '願意進一步確認 β 類澱粉蛋白病理，並了解陽性不等於一定要治療。',
      '能接受 APOE ε4 基因檢測與檢測前後說明；台灣核准適應症限非帶原者或異型合子。',
      '能完成近期基線 MRI、治療中至少 4 次排程 MRI，以及症狀發生時的額外 MRI。',
      '有可配合輸注、回診、緊急聯絡與觀察症狀的病人／照顧者支持系統。'
    ],
    exclusion: '通常不適用：中度或重度失智、沒有客觀認知障礙、未確認類澱粉蛋白病理、APOE ε4 同型合子、無法接受 MRI、影像或疾病顯示高腦出血風險，或必須長期使用抗凝血劑而風險不可接受者。是否排除須由治療團隊依最新仿單與個案判斷。'
  },

  /* 決定一：確認類澱粉蛋白的方式 */
  biomarkerOptions: [
    {
      name: 'Amyloid PET（首選）',
      how: '靜脈注射追蹤劑後做腦部正子造影，直接判讀腦內 Aβ 斑塊。',
      pros: '非侵入性腰椎穿刺；與腦部病理直接相關；台灣已有核准追蹤劑。',
      cons: '有輻射、自費高；陽性不能單獨判定症狀原因或疾病嚴重度。',
      price: '公開價例約 78,000 元／次。'
    },
    {
      name: 'CSF Roche 生物標記',
      how: '腰椎穿刺取得腦脊髓液，常用 Roche Elecsys Aβ42、p-tau181、t-tau 及其比值。',
      pros: '無 PET 輻射；可同時觀察 amyloid 與 tau 指標。',
      cons: '侵入性；可能短暫頭痛、局部不適，少見出血或感染；需嚴格採檢。',
      price: '公開院所例約 17,500–33,000 元，另計穿刺與門診。'
    },
    {
      name: '血漿 p-tau217（輔助）',
      how: '抽血評估阿茲海默症病理可能性，適合在專科端做初步風險分層。',
      pros: '抽血方便、侵入性低，可幫助決定是否進一步 PET／CSF。',
      cons: '現階段建議只作輔助篩檢／分流，作診斷用途尚無高度共識，不能單獨確認 ATT 資格；應確認檢驗平台與用途已獲 TFDA 認可。',
      price: '公開研究用途價格例約 8,000–10,000 元。'
    },
    {
      name: '暫不做生物標記',
      how: '持續一般臨床追蹤、症狀治療、生活與血管風險管理。',
      pros: '避免檢查費用、輻射或腰椎穿刺；保留之後再評估的彈性。',
      cons: '無法確認 ATT 必要的 amyloid 陽性條件；若病程進展超出早期，之後可能不再符合治療範圍。',
      price: '—'
    }
  ],

  biomarkerNotes: [
    '本工具以 amyloid PET 為首選確認方式；若不適合或希望避免輻射，可與醫師討論 CSF。',
    'MRI 不能取代 amyloid PET／CSF 來確認類澱粉蛋白；它的主要角色是排除其他原因並評估 ATT 的腦出血／ARIA 風險。',
    'Amyloid PET 陽性或 CSF 生物標記符合阿茲海默症病理，只是 ATT 的必要條件之一，並不代表症狀全部由阿茲海默症造成，也不代表一定適合或一定要接受治療。'
  ],

  /* 資格檢核表 */
  eligibility: [
    { item: '疾病階段', detail: '阿茲海默症造成的 MCI 或輕度失智；非中、重度失智。' },
    { item: '類澱粉蛋白', detail: 'Amyloid PET 陽性，或合適 CSF AD 生物標記支持。' },
    { item: 'APOE ε4', detail: '台灣核准限非帶原者或異型合子；同型合子不在核准適應症內。' },
    { item: '基線 MRI', detail: '一年內近期 MRI；無明顯 CAA／高出血風險。試驗／AUR 常排除 >4 個微出血、較大腦出血、皮質表面鐵沉積或嚴重腦血管病變。' },
    { item: '抗凝血／出血', detail: '慢性 warfarin、heparin、apixaban、rivaroxaban 等抗凝血者通常不建議 ATT；不可自行停藥。單一低劑量抗血小板藥須個別評估。' },
    { item: '配合與支持', detail: '能完成規律輸注、MRI、症狀監測、緊急就醫與照顧者聯絡。' }
  ],
  eligibilityNote: '以上多數屬核准適應症、試驗排除條件或適當用藥建議；正式資格由治療團隊依最新 TFDA 仿單、MRI 與個別風險決定。',

  /* 決定二：效益 */
  benefit: {
    heading: '平均效益：延緩退化，不是逆轉',
    rows: [
      { option: 'Lecanemab（樂意保／Leqembi）', period: '18 個月',
        result: 'CDR-SB：治療組平均惡化 1.21 分；安慰劑 1.66 分；平均少惡化 0.45 分（約 27%）。',
        reading: '平均差異不代表每個人都能感受到；長期最佳治療年限仍有不確定性。' },
      { option: 'Donanemab（欣智樂／Kisunla）', period: '76 週',
        result: '整體族群 CDR-SB：治療組平均惡化 1.72 分；安慰劑 2.42 分；平均少惡化 0.70 分（約 29%）。',
        reading: '低／中 tau 族群平均效果較大，但不能保證個人效果；停藥後長期效果仍不確定。' },
      { option: '不接受 ATT', period: '持續追蹤',
        result: '避免 ATT 特有的 ARIA、輸注與高額費用；仍可接受完整一般照護。',
        reading: '無法獲得試驗顯示的平均減緩效果；病程通常仍會逐步退化，速度因人而異。' }
    ],
    warning: '不能直接比名次：兩藥沒有頭對頭試驗。27% 與 29% 來自不同族群、時程與分析，不能據此認定哪一種藥一定比較好。'
  },

  /* 決定二：風險 */
  risk: {
    heading: 'ARIA、輸注反應與緊急風險',
    rows: [
      { option: 'Lecanemab', mri: '任一 ARIA 約 21%；ARIA-E 13%；ARIA-H 17%。',
        symptomatic: '有症狀 ARIA 約 3%；嚴重症狀約 0.7%；>1 cm 腦出血約 0.7%。',
        other: '輸注反應約 26%，多在第一次。' },
      { option: 'Donanemab（現行較慢增量安全資料）', mri: '12 個月：任一 ARIA 約 29%；ARIA-E 16%；ARIA-H 25%。',
        symptomatic: '有症狀 ARIA-E 約 3%；>1 cm 腦出血約 1%。',
        other: '輸注反應約 16%。樞紐試驗原方案的 ARIA 率較高。' },
      { option: '不接受 ATT', mri: '沒有 ATT 所致 ARIA。',
        symptomatic: '仍有疾病本身、腦血管病與其他治療的風險。',
        other: '沒有 ATT 輸注反應。' }
    ],
    note: 'ARIA-E 與 ARIA-H 可發生在同一人，百分比不可相加。多數 ARIA 無症狀且會緩解，但少數可造成癲癇、永久傷害、危及生命或死亡。'
  },

  /* 給藥與監測 */
  regimen: [
    { option: 'Lecanemab', dosing: '10 mg/kg；每 2 週一次；輸注約 1 小時，另加報到、調劑與觀察。18 個月約 36 次。',
      mri: '基線 MRI；依 TFDA 2026 安全修訂，在第 3、5、7、14 次輸注前 MRI（治療中至少 4 次）。有症狀／ARIA 時加做。',
      course: '持續治療策略；18 個月後若繼續，藥品、輸注與監測費會繼續累積。' },
    { option: 'Donanemab', dosing: '每 4 週一次；輸注約 30 分鐘。第 1–3 次逐步 350／700／1,050 mg，第 4 次起 1,400 mg。',
      mri: '基線 MRI；第 2、3、4、7 次輸注前 MRI（治療中至少 4 次）。有症狀／ARIA 時加做。',
      course: '可依 amyloid PET 顯示斑塊降至很低而考慮停藥；可能需要追加 PET。' },
    { option: '不接受 ATT', dosing: '無 ATT 輸注；依病情接受一般門診與藥物／非藥物照護。',
      mri: '依一般臨床需要安排 MRI，不需 ATT 固定 ARIA 監測。',
      course: '可在仍屬早期且條件合適時重新討論。' }
  ],

  /* 費用 */
  cost: {
    heading: '所有應納入預算的項目',
    rows: [
      { cat: '治療前診斷', includes: '記憶門診、認知／生活功能評估、常規抽血與影像', price: '依院所與項目；公開例：掛號 150／200 元、診察 500 元、服務費 1,000 元／20 分鐘，藥品與檢查另計。' },
      { cat: 'Amyloid 確認', includes: 'Amyloid PET 或 CSF Roche panel；p-tau217 只作輔助分流', price: 'PET 約 78,000 元／次；CSF panel 公開例約 17,500–33,000 元另計穿刺；p-tau217 約 8,000–10,000 元。' },
      { cat: '安全評估', includes: 'APOE ε4 檢測＋諮詢、基線 MRI', price: 'APOE 公開例約 2,000 元；MRI 公開例約 12,000 元／次。' },
      { cat: '固定 MRI', includes: '兩藥治療中皆至少 4 次，另加基線共至少 5 次', price: '若以 12,000 元／次估算，至少約 48,000 元；實際依院所及是否含基線。' },
      { cat: 'Lecanemab', includes: '藥品、耗材、調劑、每 2 週輸注與觀察', price: '公開 18 個月藥品／耗材例：60 kg 約 1,481,000 元；80 kg 約 1,967,000 元。公開總估 1.67–2.15 百萬元（使用舊 MRI 排程，更新後通常更高）。' },
      { cat: 'Donanemab', includes: '藥品、耗材、調劑、每 4 週輸注與觀察', price: '公開 18 個月藥品／耗材約 2,091,000 元；含檢查與門診總估約 2.28 百萬元。' },
      { cat: '追蹤與停藥', includes: 'Donanemab 追蹤 amyloid PET；認知量表與專科回診', price: '追加 PET 公開例約 70,000 元；其他依次數。' },
      { cat: '非預期事件', includes: '症狀性／重複 MRI、急診、住院、類固醇、抗癲癇藥、輸注反應處置', price: '無法事前封頂；發生 ARIA 後常需 2–4 個月追加 MRI 至緩解／穩定。' },
      { cat: '家庭間接成本', includes: '交通、停車、陪同、請假、照顧者時間、外地住宿', price: '依家庭情況估算。' }
    ],
    note: '截至查核日，公開資訊顯示兩藥仍為全自費。價格會因院所、體重、藥瓶進位、耗材、檢查次數及是否發生 ARIA 而變動；簽署治療前應取得本院最新書面估價。'
  },

  /* 步驟二：價值澄清 */
  valueItems: [
    '希望即使平均效益不大，也盡量延緩認知與生活功能退化',
    '能接受藥物不是治癒、不能恢復記憶，且個人效果不確定',
    '願意先確認 amyloid 病理，並接受可能帶來心理／保險／家庭影響的診斷結果',
    '能接受 APOE 基因檢測及結果可能影響家屬的意涵',
    '能接受 ARIA、腦出血、癲癇、永久傷害或死亡等少見但嚴重風險',
    '能配合每 2 週或每 4 週輸注、至少 5 次 MRI 與臨時加做檢查',
    '家庭可負擔約 170–230 萬元以上的 18 個月自費與額外事件費用',
    '有家屬／照顧者能陪同、觀察警訊並在急診主動告知 ATT',
    '抗凝血、抗血小板或未來中風治療需求不會造成無法接受的風險',
    '可接受超過 18 個月的長期效益、最佳療程與停藥後效果仍不確定'
  ],

  /* 步驟三：理解確認 */
  quiz: [
    { q: '只要臨床診斷像阿茲海默症，就可以直接施打 ATT，不需確認 amyloid。', a: false },
    { q: 'Amyloid PET 或 CSF 陽性是必要條件，但仍要再看疾病期別、APOE、MRI 與用藥風險。', a: true },
    { q: '截至本表查核日，台灣可只靠一次血漿 p-tau217 陽性決定 ATT 資格。', a: false },
    { q: 'Lecanemab 與 donanemab 的目標是讓平均退化變慢，不是治癒或恢復記憶。', a: true },
    { q: 'APOE ε4 同型合子目前不在台灣兩藥的 TFDA 核准適應症內。', a: true },
    { q: '兩藥都需要基線 MRI，加上治療中至少 4 次排程 MRI；若有症狀可能還要加做。', a: true },
    { q: 'ARIA 多數沒有症狀，所以沒有頭痛就一定沒有 ARIA。', a: false },
    { q: '若出現突然無力、失語或視覺改變，到急診時應先告知正在接受 ATT，因 ARIA 可能像中風。', a: true },
    { q: '為了符合 ATT 條件，可以自行停掉醫師開立的抗凝血劑。', a: false },
    { q: '選擇不接受或暫緩 ATT，仍可持續一般藥物、生活調整、照顧支持與追蹤。', a: true }
  ],

  /* 步驟四：決定 */
  decisionA: {
    heading: '我對「進一步確認類澱粉蛋白」的決定',
    options: [
      '我要做 amyloid PET',
      '我要做 CSF Roche 生物標記檢查',
      '我要先做血漿 p-tau217 作為輔助分流，並知道之後可能仍需 PET／CSF',
      '我目前不做生物標記，繼續一般照護與追蹤',
      '我還無法決定'
    ]
  },
  decisionB: {
    heading: '若 amyloid 陽性且安全評估合格，我對 ATT 的決定',
    options: [
      '我傾向 lecanemab（樂意保／Leqembi）',
      '我傾向 donanemab（欣智樂／Kisunla）',
      '我不接受或暫緩 ATT，繼續一般照護',
      '我要先取得本院個人化費用估價後再決定',
      '我要尋求第二意見或與其他家人討論',
      '我還無法決定'
    ]
  },

  emergency: {
    heading: '出現警訊時立即就醫',
    text: '新發或持續頭痛、意識混亂、視力改變、頭暈、噁心、走路不穩、單側無力／麻木、失語或癲癇。到任何急診都要先告知「正在接受抗類澱粉蛋白單株抗體」，因 ARIA 可能看起來像中風；在排除 ARIA 前，血栓溶解治療可能造成致命腦出血。',
    card: '接受 ATT 後請攜帶治療警示卡，或在手機醫療資訊中註記藥名、最後輸注日期與治療院所。'
  },

  links: [
    { label: 'TFDA 藥品仿單查詢平台（搜尋「樂意保」或「欣智樂」）', url: 'https://mcp.fda.gov.tw' },
    { label: 'TFDA 2026-06-22 類澱粉蛋白單株抗體安全性修訂公告', url: 'https://www.fda.gov.tw/TC/newsContent.aspx?cid=3&id=31574' },
    { label: '台灣臨床失智症學會', url: 'https://www.tds.org.tw' }
  ],

  references: [
    '衛生福利部食品藥物管理署。樂意保（lecanemab）仿單與核准審查資料，衛部菌疫輸字第001273號；查核 2026-08-26。',
    '衛生福利部食品藥物管理署。欣智樂（donanemab）仿單，衛部菌疫輸字第001285號；查核 2026-08-26。',
    '衛生福利部食品藥物管理署。公告類澱粉蛋白單株抗體（lecanemab 及 donanemab）臨床效益及風險再評估結果，2026-06-22，衛授食字第1151404428號。',
    'van Dyck CH, et al. Lecanemab in Early Alzheimer’s Disease. N Engl J Med. 2023;388:9-21. doi:10.1056/NEJMoa2212948. PMID:36449413.',
    'Sims JR, et al. Donanemab in Early Symptomatic Alzheimer Disease: TRAILBLAZER-ALZ 2. JAMA. 2023;330:512-527. doi:10.1001/jama.2023.13239. PMID:37459141.',
    '台灣臨床失智症學會、台灣老年精神醫學會。Lecanemab 台灣適當用藥建議，第 2 版，2025。',
    '蔡欣憲等。抗類澱粉蛋白抗體治療與腦血管疾病處置考量：台灣腦中風學會及台灣臨床失智症學會共識聲明。Formosan J Stroke. 2025;7(2). doi:10.6318/FJS.202506_7(2).0001.',
    'Rabinovici GD, et al. Donanemab: Appropriate Use Recommendations. J Prev Alzheimers Dis. 2025;12(5):100150. doi:10.1016/j.tjpad.2025.100150. PMID:40155270.',
    'Palmqvist S, et al. Alzheimer’s Association Clinical Practice Guideline on blood-based biomarkers in specialty care. Alzheimers Dement. 2025;21:e70535. doi:10.1002/alz.70535.',
    'Jack CR Jr, et al. Revised criteria for diagnosis and staging of Alzheimer’s disease. Alzheimers Dement. 2024;20:5143-5169. doi:10.1002/alz.13859.',
    'Cheng TW, et al. Recommendations for clinical use of plasma biomarkers in Alzheimer’s disease in Taiwan. J Formos Med Assoc. 2024. PMID:38296698.'
  ],

  disclaimer: '本模組提供一般決策資訊，不能取代個別診療。藥品仿單、健保狀態、價格與院內流程可能更新；治療前請由醫療團隊依最新資料重新確認。'
};
