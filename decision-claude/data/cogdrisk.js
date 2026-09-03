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

  /* ---------- 已由後續文獻確定、不再是假設的項目 ---------- */
  resolved: {
    depression: {
      what: '憂鬱：CES-D-10 總分 ≥ 8',
      why: 'Kootar 2023 的補充資料 Part B 明載 CogDrisk 採「CES-D（10 題版），切分點為 8」。' +
           'Anstey 2022 Table 1 寫的「CES-D > 20」指的是效應量來源所用的 20 題版；' +
           '10 題版的 8 分約當 20 題版的 16 分。以 8 分為切分，Anstey 2024 短版樣本（n=647）中有 33.1% 達標，與此一致。',
      ref: 'kootar2023'
    },
    instruments: {
      what: '失眠採 Morin 失眠嚴重度量表（ISI）、孤獨感採三題版 UCLA 量表、身體活動採 IPAQ 短版、認知活動改編自 MAP 世代題目',
      why: 'Kootar 2023 補充資料 Part B 之 CogDrisk 欄位逐項載明。本站題目依此對齊。',
      ref: 'kootar2023'
    }
  },

  /* ---------- 仍需假設的項目（介面會另外標示） ----------
   * 這三項的「工具」已經確定，不確定的只剩「切分點」。
   * 每一項都附上可對照的已發表比例，以及本站選擇造成的偏誤方向。 */
  assumptions: {
    insomnia: {
      published: 'CogDrisk 採 ISI，但未發表切分點',
      used: 'ISI 總分 ≥ 8（閾下失眠以上）',
      why: 'ISI ≥8 是常用的「閾下失眠以上」切分點。Anstey 2024 短版樣本中有 43.4% 被歸為失眠；' +
           '若改用臨床顯著的 ≥15，社群樣本通常只有一成上下，與 43.4% 明顯不符，因此本站採 ≥8。',
      swing: 2
    },
    loneliness: {
      published: 'CogDrisk 採三題版 UCLA 孤獨感量表，但未發表切分點',
      used: 'UCLA-3 總分 ≥ 6（滿分 9）',
      why: '≥6 是三題版 UCLA 量表最常引用的切分點。但 Anstey 2024 短版樣本中有 65.4% 被歸為孤獨，' +
           '比例高於 ≥6 在一般社群樣本的常見水準，顯示 CogDrisk 實際採用的門檻可能更寬鬆。' +
           '也就是說，本站這一項偏保守，可能少算 2 分。',
      swing: 2
    },
    cognitiveEngagement: {
      published: 'CogDrisk 分最低／中間／最高三組，但未發表切分點',
      used: '本站題組（0–24 分）以 ≤16／17–21／≥22 分組',
      why: '原本的等分三分法是錯的。Anstey 2024 短版樣本的實際分布極度偏斜——' +
           '最低組 88.4%、中間組 10.8%、最高組 0.8%——等分三分會讓遠超過一成的人拿到 −5 分。' +
           '本站因此把門檻拉高，讓中間與最高組成為少數，方向上貼近已發表的分布。',
      swing: 5
    }
  },

  /* ---------- 社群參考分布（Anstey 2024, n=647） ----------
   * 用來讓使用者知道自己的分數在真實人群中的相對位置，比理論範圍有意義得多。
   * 注意：這是澳洲線上社群樣本，不是台灣常模。 */
  reference: {
    mean: 9.7, sd: 5.3, min: -2.6, max: 27.9, n: 647,
    ageRange: '40–89 歲', ageMean: 62.2, femalePct: 50.1,
    note: '澳洲社群成人線上樣本（n=647，平均 62.2 歲，50.1% 女性）之 CogDrisk 短版分數分布。' +
          '非台灣常模，也非疾病風險分級，僅供了解自己的分數在人群中大致落在哪裡。',
    ref: 'anstey2024sf'
  },

  /* ---------- 非 CogDrisk 計分、但納入衛教的因子 ---------- */
  /* 這些是 Lancet 2024 的可改變因子，CogDrisk any-dementia 演算法未納入計分，
     本站仍蒐集，只用於個人化預防建議，不加入點數。 */
  educationOnlyFactors: ['hearing', 'vision', 'alcohol', 'airPollution', 'socialContact'],

  ref: 'anstey2022'
};
