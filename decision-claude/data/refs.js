/* 參考文獻登錄表 — 每一筆都對應本機或線上可查核的原始文件。
   規則：介面上出現的每個數字與建議，都必須指回這裡的一個 id。 */
window.REFS = {
  anstey2022: {
    label: 'Anstey 2022（CogDrisk 開發）',
    cite: 'Anstey KJ, Kootar S, Huque MH, Eramudugolla R, Peters R. Development of the CogDrisk tool to assess risk factors for dementia. Alzheimers Dement (Amst). 2022;14(1):e12336.',
    doi: '10.1002/dad2.12336',
    note: '開放取用（CC BY-NC-ND）。本站 CogDrisk 風險因子點數取自其 Table 1（any dementia）。',
    url: 'https://doi.org/10.1002/dad2.12336'
  },
  cogdriskSF: {
    label: 'CogDrisk Short Form v1.3',
    cite: 'CogDrisk Short Form © version 1.3, 12.06.2025. UNSW Sydney / Neuroscience Research Australia.',
    note: '本站題目結構參考此短版（51 題）。原問卷之使用與改作須向 UNSW（Prof. Kaarin Anstey）取得授權；本站僅重新撰寫繁中題目並標註來源，未逐字重製原問卷。',
    url: 'https://www.cogdrisk.com.au/'
  },
  huque2023: {
    label: 'Huque 2023（風險工具比較）',
    cite: 'Huque MH, Kootar S, Eramudugolla R, et al. CogDrisk, ANU-ADRI, CAIDE, and LIBRA Risk Scores for Estimating Dementia Risk. JAMA Netw Open. 2023;6(8):e2331460.',
    doi: '10.1001/jamanetworkopen.2023.31460',
    note: '在三個高齡世代中 CogDrisk AUC 0.65–0.75；CAIDE 明顯較低（MAP 世代 AUC 0.50）。本站據此不對 65 歲以上使用 CAIDE。',
    url: 'https://doi.org/10.1001/jamanetworkopen.2023.31460'
  },
  livingston2024: {
    label: 'Lancet Commission 2024',
    cite: 'Livingston G, Huntley J, Liu KY, et al. Dementia prevention, intervention, and care: 2024 report of the Lancet standing Commission. Lancet. 2024;404(10452):572-628.',
    doi: '10.1016/S0140-6736(24)01296-0',
    note: '14 項可改變風險因子與加權 PAF（合計 45%）取自其 Table 1。',
    url: 'https://doi.org/10.1016/S0140-6736(24)01296-0'
  },
  who2026: {
    label: 'WHO 指引第二版（2026）',
    cite: 'Risk reduction of cognitive decline and dementia: WHO guidelines, second edition. Geneva: World Health Organization; 2026. ISBN 978-92-4-012355-7.',
    note: '授權 CC BY-NC-SA 3.0 IGO。本站摘譯其 Table A 之失智症專屬建議與證據確信度。此翻譯非由 WHO 製作，WHO 不對翻譯內容或正確性負責，英文原版為具約束力之權威版本。',
    url: 'https://iris.who.int/'
  },
  gold2026: {
    label: "Life's Essential 8 與腦健康（2026）",
    cite: "Gold ME, Chandrasekhar S, Kulshreshtha A, et al. Life's Essential 8: Essential for Brain and Cognitive Health. J Am Heart Assoc. 2026;15:e039048.",
    doi: '10.1161/JAHA.124.039048',
    note: 'AHA LE8 八項指標與認知結果之敘事回顧。',
    url: 'https://doi.org/10.1161/JAHA.124.039048'
  },
  tsai2021: {
    label: 'SCDS 中文版開發（Tsai 2021）',
    cite: 'Tsai HF, Wu CH, Hsu CC, Liu CL, Hsu YH. Development of the Subjective Cognitive Decline Scale for Mandarin-Speaking Population. Am J Alzheimers Dis Other Demen. 2021;36:15333175211038237.',
    doi: '10.1177/15333175211038237',
    note: '14 題三因子（記憶/執行/語言），Cronbach α = .93。原文明載切分點尚待縱貫研究驗證，故本站不設判定閾值。',
    url: 'https://doi.org/10.1177/15333175211038237'
  },
  moretti2025: {
    label: 'ISTAART SCD 立場文件（2025）',
    cite: 'Moretti DV, Kuhn E, Dubbelman MA, et al. Clinical definition, biological characterization, and detection guidelines of subjective cognitive decline due to Alzheimer’s disease and related dementia: A position paper from ISTAART SCD PIA. Alzheimers Dement. 2025.',
    doi: '10.1002/alz.70847',
    note: 'SCD-plus 特徵清單與進展風險描述取自此文。',
    url: 'https://doi.org/10.1002/alz.70847'
  },
  ad8tw: {
    label: 'AD-8 繁體中文版',
    cite: '楊淵韓、劉景寬。極早期失智症篩檢量表（AD-8）中文版。2009 年世界阿茲海默氏失智症大會；台灣失智症協會。原始量表 AD8 © Washington University in St. Louis。',
    note: '題目文字依台南市政府衛生局與天主教失智老人基金會公開版本核對；計分：勾選「是，有改變」每題 1 分，≥2 分建議進一步檢查。',
    url: 'https://www.tada2002.org.tw/'
  },
  attSdm: {
    label: '早期阿茲海默症 ATT 醫病共享決策輔助工具',
    cite: '附件1-2【第二次認證】醫病共享決策（SDM）輔助工具評估表：早期阿茲海默症 ATT（完成版）。證據與價格查核日 2026-08-26。',
    note: '本站 ATT 模組內容取自該院內已認證之 SDM 輔助工具，數值與價格以其查核日為準。',
    url: ''
  }
};
