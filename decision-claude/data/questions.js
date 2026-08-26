/* 風險評估問卷題目（繁體中文，自行撰寫）
 * 因子結構參考 CogDrisk Short Form v1.3，但題目文字為本站自行撰寫，未逐字重製原問卷。
 * 原問卷之使用與改作須向 UNSW 取得授權（見 REFS.cogdriskSF）。
 *
 * scores: true  → 該題會進入 CogDrisk 點數計算
 * scores: false → 只用於個人化預防衛教，不計分（Lancet 2024 有列、CogDrisk 演算法未納入者）
 */
window.QUESTIONS = {

  sections: [

    /* ---------------- 基本資料 ---------------- */
    { id: 'basic', title: '基本資料', intro: '這幾題決定哪些風險因子適用於您的年齡層。', items: [
      { id: 'age', type: 'number', scores: true, label: '您的年齡', unit: '歲', min: 18, max: 110,
        help: 'CogDrisk 的年齡點數自 60 歲起算，且部分因子只適用於特定年齡層。' },
      { id: 'sex', type: 'choice', scores: true, label: '您的生理性別',
        help: '年齡與糖尿病的點數在原始權重表中是分性別的。',
        options: [
          { value: 'male', label: '男性' },
          { value: 'female', label: '女性' },
          { value: 'other', label: '其他／不願回答' }
        ] },
      { id: 'education', type: 'choice', scores: true, label: '您完成的正規教育共幾年？',
        help: '包含國小起算的所有正規學制年數。',
        options: [
          { value: 'high', label: '12 年以上（高中職畢業以上）' },
          { value: 'middle', label: '8 至 11 年（國中畢業至高中肄業）' },
          { value: 'low', label: '未滿 8 年（國小畢業或以下）' }
        ] },
      { id: 'height', type: 'number', scores: true, label: '身高', unit: '公分', min: 100, max: 220 },
      { id: 'weight', type: 'number', scores: true, label: '體重', unit: '公斤', min: 25, max: 200 }
    ]},

    /* ---------------- 健康狀況 ---------------- */
    { id: 'health', title: '健康狀況', intro: '請依醫師曾經告知過的診斷作答。', items: [
      { id: 'cholesterol', type: 'choice', scores: true,
        label: '過去 2 年內，醫師或醫療人員是否告訴過您膽固醇偏高，或總膽固醇高於 6.5 mmol/L（約 251 mg/dL）？',
        help: '台灣檢驗報告多以 mg/dL 表示。6.5 mmol/L 換算約為 251 mg/dL。',
        options: [
          { value: 'yes', label: '是' },
          { value: 'no', label: '否' },
          { value: 'unknown', label: '不知道' }
        ] },
      { id: 'diabetes', type: 'choice', scores: true, label: '醫師是否曾告訴您有糖尿病？',
        options: [ { value: 'yes', label: '是' }, { value: 'no', label: '否' }, { value: 'unknown', label: '不知道' } ] },
      { id: 'hypertension', type: 'choice', scores: true, label: '醫師是否曾告訴您有高血壓？',
        help: 'CogDrisk 只在 65 歲以上把高血壓計入點數，但中年高血壓仍是重要的介入時機。',
        options: [ { value: 'yes', label: '是' }, { value: 'no', label: '否' }, { value: 'unknown', label: '不知道' } ] },
      { id: 'stroke', type: 'choice', scores: true, label: '醫師是否曾告訴您有中風或短暫性腦缺血發作（TIA）？',
        options: [ { value: 'yes', label: '是' }, { value: 'no', label: '否' }, { value: 'unknown', label: '不知道' } ] },
      { id: 'afib', type: 'choice', scores: true, label: '醫師是否曾告訴您有心房顫動（心律不整）？',
        options: [ { value: 'yes', label: '是' }, { value: 'no', label: '否' }, { value: 'unknown', label: '不知道' } ] },
      { id: 'tbi', type: 'choice', scores: true,
        label: '您是否曾有頭部外傷或撞擊，導致意識恍惚、混亂、失去方向感，或昏迷？',
        options: [
          { value: 'lost', label: '有，曾經昏迷（失去意識）' },
          { value: 'dazed', label: '有，意識恍惚或混亂，但沒有昏迷' },
          { value: 'no', label: '沒有' },
          { value: 'unknown', label: '不知道' }
        ] }
    ]},

    /* ---------------- 感官（不計分，僅用於衛教） ---------------- */
    { id: 'senses', title: '聽力與視力', intro: '這兩項在 CogDrisk 的計分公式中沒有納入，但在 Lancet 2024 的 14 項可改變因子中都有；本站蒐集後只用於預防建議。', items: [
      { id: 'hearing', type: 'choice', scores: false, label: '您覺得目前的聽力足以應付各種場合嗎？',
        options: [
          { value: 'fine', label: '可以，沒有問題' },
          { value: 'groups', label: '在多人場合聽不清楚別人說話' },
          { value: 'missWords', label: '對話中常漏聽字詞' },
          { value: 'serious', label: '聽力對我是嚴重的問題' }
        ] },
      { id: 'hearingAid', type: 'choice', scores: false, label: '醫療人員是否曾建議您使用助聽器或人工電子耳？',
        options: [
          { value: 'wearing', label: '有，而且我有在配戴' },
          { value: 'notWearing', label: '有，但我沒有配戴' },
          { value: 'no', label: '沒有' },
          { value: 'unknown', label: '不知道' }
        ] },
      { id: 'vision', type: 'choice', scores: false, label: '您的視力狀況（配戴眼鏡後）如何？',
        options: [
          { value: 'fine', label: '良好，日常生活沒有影響' },
          { value: 'mild', label: '有些模糊，但還能應付日常' },
          { value: 'impaired', label: '明顯看不清楚，影響日常活動' },
          { value: 'untreated', label: '有已知的眼疾但尚未治療（如白內障、青光眼、黃斑部病變）' }
        ] }
    ]},

    /* ---------------- 睡眠：ISI ---------------- */
    { id: 'sleep', title: '睡眠', intro: '請就最近兩週的狀況，評估您失眠問題的嚴重程度。（失眠嚴重度量表 ISI）',
      scaleLabels: ['沒有', '輕度', '中度', '重度', '非常嚴重'],
      items: [
        { id: 'isi1', type: 'likert5', scores: true, label: '入睡困難' },
        { id: 'isi2', type: 'likert5', scores: true, label: '維持睡眠困難（半夜醒來後難再入睡）' },
        { id: 'isi3', type: 'likert5', scores: true, label: '太早醒來' }
      ],
      items2: [
        { id: 'isi4', type: 'likert5', scores: true, label: '您對目前的睡眠型態有多不滿意？', labels: ['完全不會', '有一點', '有些', '相當多', '非常多'] },
        { id: 'isi5', type: 'likert5', scores: true, label: '您認為您的睡眠問題有多影響您的日常功能（白天疲倦、情緒、工作或家事能力、專注力、記憶等）？', labels: ['完全不會', '有一點', '有些', '相當多', '非常多'] },
        { id: 'isi6', type: 'likert5', scores: true, label: '您認為別人有多容易察覺您的睡眠問題影響了您的生活品質？', labels: ['完全不會', '有一點', '有些', '相當多', '非常多'] },
        { id: 'isi7', type: 'likert5', scores: true, label: '您對目前的睡眠問題有多擔心或困擾？', labels: ['完全不會', '有一點', '有些', '相當多', '非常多'] }
      ]
    },

    /* ---------------- 情緒：CES-D-10 ---------------- */
    { id: 'mood', title: '最近一週的感受', intro: '請就過去一週內，您有這些感受的天數作答。（CES-D 10 題版）',
      scaleLabels: ['少於 1 天', '1–2 天', '3–4 天', '5–7 天'],
      items: [
        { id: 'cesd1',  type: 'likert4', scores: true, label: '我被平常不會困擾我的事情困擾。' },
        { id: 'cesd2',  type: 'likert4', scores: true, label: '我很難把注意力放在正在做的事情上。' },
        { id: 'cesd3',  type: 'likert4', scores: true, label: '我覺得心情低落。' },
        { id: 'cesd4',  type: 'likert4', scores: true, label: '我覺得做任何事情都很費力。' },
        { id: 'cesd5',  type: 'likert4', scores: true, reverse: true, label: '我對未來感到有希望。' },
        { id: 'cesd6',  type: 'likert4', scores: true, label: '我感到害怕。' },
        { id: 'cesd7',  type: 'likert4', scores: true, label: '我的睡眠不安穩。' },
        { id: 'cesd8',  type: 'likert4', scores: true, reverse: true, label: '我覺得快樂。' },
        { id: 'cesd9',  type: 'likert4', scores: true, label: '我感到孤單。' },
        { id: 'cesd10', type: 'likert4', scores: true, label: '我提不起勁來。' }
      ]
    },

    /* ---------------- 身體活動 ---------------- */
    { id: 'activity', title: '身體活動', intro: '請回想最近 7 天的狀況。只計算每次至少持續 10 分鐘的活動。', items: [
      { id: 'vigDays', type: 'number', scores: true, label: '高強度活動（讓您喘得很厲害，例如提重物、挖土、有氧運動、快速騎車）共做了幾天？', unit: '天', min: 0, max: 7 },
      { id: 'vigMin', type: 'number', scores: true, label: '這些日子裡，您通常每天做多久高強度活動？', unit: '分鐘', min: 0, max: 600, dependsOn: 'vigDays' },
      { id: 'modDays', type: 'number', scores: true, label: '中等強度活動（呼吸比平常稍喘，例如快走、提輕物、以平常速度騎車）共做了幾天？', unit: '天', min: 0, max: 7,
        help: '快走請算在這一題。' },
      { id: 'modMin', type: 'number', scores: true, label: '這些日子裡，您通常每天做多久中等強度活動？', unit: '分鐘', min: 0, max: 600, dependsOn: 'modDays' }
    ]},

    /* ---------------- 認知活動 ---------------- */
    { id: 'cognitive', title: '動腦活動', intro: '過去一年中，您從事下列活動的頻率如何？（含線上進行者）',
      scaleLabels: ['一年一次或更少', '一年數次', '一個月數次', '一週數次', '幾乎每天'],
      items: [
        { id: 'cog1', type: 'likert5', scores: true, label: '閱讀報紙（含線上）' },
        { id: 'cog2', type: 'likert5', scores: true, label: '閱讀書籍或雜誌（含線上）' },
        { id: 'cog3', type: 'likert5', scores: true, label: '下棋或玩桌遊、紙牌' },
        { id: 'cog4', type: 'likert5', scores: true, label: '從事動腦訓練活動，例如數獨、填字、益智遊戲或相關電腦程式' },
        { id: 'cog5', type: 'likert5', scores: true, label: '書寫信件或電子郵件' },
        { id: 'cog6', type: 'likert5', scores: true, label: '其他需要動腦或有智識刺激的活動（例如學習新事物、上課、需要思考的工作或志工）' }
      ]
    },

    /* ---------------- 社交 ---------------- */
    { id: 'social', title: '社交', items: [
      { id: 'lonely', type: 'choice', scores: true, label: '整體而言，您會覺得孤單嗎？',
        help: 'CogDrisk 計分採用的是主觀孤獨感，而不是社交活動的次數。',
        options: [ { value: 'yes', label: '會' }, { value: 'no', label: '不會' } ] },
      { id: 'socialContact', type: 'choice', scores: false, label: '您多久與家人或朋友面對面往來一次？',
        options: [
          { value: 'weekly', label: '每週至少一次' },
          { value: 'monthly', label: '大約每月一次' },
          { value: 'rarely', label: '幾個月一次或更少' }
        ] }
    ]},

    /* ---------------- 飲食與習慣 ---------------- */
    { id: 'habits', title: '飲食與生活習慣', items: [
      { id: 'fish', type: 'choice', scores: true, label: '您多久吃一次非油炸的魚或海鮮？',
        help: '一份約為 100 公克魚肉或一小罐魚罐頭。',
        options: [
          { value: 'rarely', label: '很少' },
          { value: 'monthly', label: '每月 1–3 次' },
          { value: 'weekly', label: '每週一次' },
          { value: 'weekly23', label: '每週 2–3 次' },
          { value: 'weekly4', label: '每週 4 次以上' }
        ] },
      { id: 'smoking', type: 'choice', scores: true, label: '您有吸菸（香菸、雪茄、菸斗或其他菸品）嗎？',
        options: [
          { value: 'current', label: '有，目前仍在吸' },
          { value: 'former', label: '有，但已經戒了' },
          { value: 'never', label: '從未吸菸' }
        ] },
      { id: 'alcohol', type: 'choice', scores: false, label: '您的飲酒狀況？',
        options: [
          { value: 'none', label: '不喝酒' },
          { value: 'light', label: '偶爾少量' },
          { value: 'regular', label: '規律飲酒' },
          { value: 'heavy', label: '經常大量飲酒，或曾被提醒喝太多' }
        ] },
      { id: 'airPollution', type: 'choice', scores: false, label: '您的居住或工作環境是否有明顯的空氣污染暴露？',
        help: '例如長期在交通繁忙路段、工業區，或家中有燃香、二手菸、通風不良的燃燒式炊具。',
        options: [
          { value: 'no', label: '沒有明顯暴露' },
          { value: 'some', label: '有一些' },
          { value: 'high', label: '長期明顯暴露' }
        ] }
    ]}
  ],

  /* 量表計分參數 */
  scoring: {
    isi: { items: 7, perItemMax: 4, total: 28, threshold: 15,
      thresholdLabel: 'ISI ≥ 15 視為中重度失眠',
      bands: [ { max: 7, label: '無臨床顯著失眠' }, { max: 14, label: '閾下失眠' }, { max: 21, label: '中度臨床失眠' }, { max: 28, label: '重度臨床失眠' } ] },
    cesd10: { items: 10, perItemMax: 3, total: 30, threshold: 10, reverseItems: ['cesd5', 'cesd8'],
      thresholdLabel: 'CES-D-10 ≥ 10 視為具憂鬱症狀' },
    cognitive: { items: 6, perItemMax: 4, total: 24,
      tertiles: { lowest: 8, middle: 16 },
      note: '原文未發表三分組的切分點，本站以本題組可得分數範圍（0–24）三等分：0–8 為最低、9–16 為中間、17–24 為最高。' },
    mvpa: { threshold: 150, note: 'MVPA 分鐘／週 = 高強度天數 × 每天分鐘 + 中等強度天數 × 每天分鐘。' },
    bmi: { underweight: 18.5, normal: 25, overweight: 30 }
  }
};
