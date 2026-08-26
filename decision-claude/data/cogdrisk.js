/* CogDrisk 風險因子點數
 * 權重來源：Anstey 2022, Alzheimers Dement (Amst) 14:e12336, Table 1（any dementia）。
 * 逐格對照原表，未做任何調整。
 *
 * 重要限制（已在介面上如實揭露）：
 * 1. 原文的條件式方程式與加總常數位於 Supporting Information Part B，本站未取得，
 *    因此本站輸出「風險因子點數」，不宣稱等同官方 CogDrisk 分數，也不換算絕對風險百分比
 *    （原文並未發表 分數→風險% 的對照）。
 * 2. 三個因子的操作化需要假設（見 ASSUMPTION 標記），介面會另外顯示假設造成的分數區間。
 * 3. CogDrisk Short Form 問卷本身為 UNSW 版權，使用與改作須取得授權；本站題目為自行撰寫之
 *    繁體中文版本，僅沿用因子結構。
 */
window.COGDRISK = {

  /* ---------- 已發表權重（Anstey 2022 Table 1） ---------- */
  weights: {
    age: {
      male:   { '60-64': 0, '65-69': 6, '70-74': 8,  '75-79': 13, '80-84': 17, '85-89': 20, '90+': 22 },
      female: { '60-64': 0, '65-69': 4, '70-74': 7,  '75-79': 11, '80-84': 15, '85-89': 19, '90+': 23 }
    },
    education:      { high: 0, middle: 2, low: 4 },              // >11 年 / 8–11 年 / <8 年
    bmi:            { normal: 0, overweight: 1, underweight: 2, obese: 3 },
    cholesterol:    { no: 0, yes: 3 },                            // >6.5 mmol/L
    diabetes:       { no: 0, male: 2, female: 3 },
    stroke:         { no: 0, yes: 2 },
    tbi:            { no: 0, yes: 2 },
    hypertension:   { no: 0, yes: 1 },
    afib:           { no: 0, yes: 2 },
    insomnia:       { no: 0, yes: 2 },
    depression:     { no: 0, yes: 3 },                            // CES-D > 20（原文定義）
    physicalActivity: { inactive: 0, active: -3 },                // ≥150 分鐘/週 中高強度
    cognitiveEngagement: { lowest: 0, middle: -5, highest: -4 },  // 原表如此，非單調
    loneliness:     { notLonely: 0, lonely: 2 },
    fish:           { less: 0, weekly: -0.25 },
    smoking:        { never: 0, former: 0, current: 1 }
  },

  /* ---------- 年齡條件 ----------
   * 原表在因子名稱後標註了年齡，但這些標註有兩種意義，必須分開處理：
   *
   * (A) 真正的計分排除條件 —— 中年肥胖（≤65 歲）與高膽固醇（<60 歲）。
   *     原文明言「對只在中年有效果的風險因子指定了條件式方程式（高膽固醇、肥胖與過重）」。
   *
   * (B) 只是效應量來源族群的註記 —— 高血壓（>65 歲）與心房顫動（>65 歲）仍全年齡計分。
   *
   * 依據：以 (A) 排除、(B) 保留來計算，兩個年齡層的分數上限都與原文內文完全吻合——
   *   晚年上限 = 年齡23 + 教育4 + 糖尿病3 + 中風2 + 頭傷2 + 高血壓1 + 心房顫動2
   *              + 失眠2 + 憂鬱3 + 孤獨2 + 吸菸1 = 45  （原文：late-life 上限 45）
   *   中年上限 = 教育4 + BMI3 + 膽固醇3 + 糖尿病3 + 中風2 + 頭傷2 + 高血壓1 + 心房顫動2
   *              + 失眠2 + 憂鬱3 + 孤獨2 + 吸菸1 = 28  （原文：midlife 上限 28）
   * 若把高血壓與心房顫動在 65 歲以下排除，中年上限只會得到 24，與原文不符。
   *
   * 未能重現之處：原文所述 late-life 下限 −4.25。本站實作在 60–64 歲、各保護因子均達標時
   * 得到 −8.25（與 midlife 下限相同）。原文的條件式方程式位於 Supporting Information Part B，
   * 本站未取得，故此差異保留並如實揭露。
   */
  ageConditions: {
    age:          { min: 60, note: '原表的年齡點數自 60 歲起算（60–64 歲為參考組），未滿 60 歲不計年齡點數。' },
    bmi:          { max: 65, note: '原表限「中年肥胖（≤65 歲）」，超過 65 歲不計此項點數。' },
    cholesterol:  { max: 59, note: '原表限「高膽固醇（<60 歲）」，60 歲以上不計此項點數。' }
  },

  /* 效應量來源族群的註記（不影響計分，只在說明中顯示） */
  sourceNotes: {
    hypertension: '原表此項的效應量來自 65 歲以上族群，但依原文的分數範圍推算，計分時不分年齡皆納入。',
    afib:         '原表此項的效應量來自 65 歲以上族群、且為未合併中風之心房顫動；依原文的分數範圍推算，計分時不分年齡皆納入。'
  },

  /* ---------- 操作化假設（介面會另外標示） ---------- */
  assumptions: {
    insomnia: {
      published: '臨床診斷之失眠症',
      used: '失眠嚴重度量表（ISI）總分 ≥ 15（中重度）',
      why: 'CogDrisk 短版以 ISI 七題蒐集失眠，但原始權重定義為臨床診斷。ISI ≥15 為常用之臨床顯著閾值。',
      swing: 2
    },
    depression: {
      published: 'CES-D（20 題版）總分 > 20',
      used: 'CES-D-10（10 題版）總分 ≥ 10',
      why: 'CogDrisk 短版採用 10 題版 CES-D，原始權重則以 20 題版定義。兩者閾值不完全等價。',
      swing: 3
    },
    cognitiveEngagement: {
      published: '認知活動量之最低／中間／最高三分組（原始常模）',
      used: '本站認知活動題組總分之三等分',
      why: '原文未發表三分組的切分點，本站改以本問卷可得分數範圍三等分，屬近似分組。',
      swing: 5
    }
  },

  /* ---------- 非 CogDrisk 計分、但納入衛教的因子 ---------- */
  /* 這些是 Lancet 2024 的可改變因子，CogDrisk any-dementia 演算法未納入計分，
     本站仍蒐集，只用於個人化預防建議，不加入點數。 */
  educationOnlyFactors: ['hearing', 'vision', 'alcohol', 'airPollution', 'socialContact'],

  ref: 'anstey2022'
};
