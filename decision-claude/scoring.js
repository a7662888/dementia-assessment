/* 計分引擎
 * 原則：每一個點數都必須能指回 Anstey 2022 Table 1 的一格，而且要能對使用者說明
 *       「為什麼算」「為什麼不算」。因此每個因子都回傳完整的稽核紀錄。
 */
(function () {
  'use strict';

  var W = window.COGDRISK.weights;
  var COND = window.COGDRISK.ageConditions;
  var S = window.QUESTIONS.scoring;

  /* ---------- 小工具 ---------- */
  function ageBand(age) {
    if (age < 60) return null;
    if (age <= 64) return '60-64';
    if (age <= 69) return '65-69';
    if (age <= 74) return '70-74';
    if (age <= 79) return '75-79';
    if (age <= 84) return '80-84';
    if (age <= 89) return '85-89';
    return '90+';
  }

  function bmiCategory(h, w) {
    if (!h || !w) return null;
    var b = w / Math.pow(h / 100, 2);
    var c = b < S.bmi.underweight ? 'underweight'
          : b < S.bmi.normal ? 'normal'
          : b < S.bmi.overweight ? 'overweight' : 'obese';
    return { bmi: b, cat: c };
  }

  function sum(a) { return a.reduce(function (x, y) { return x + y; }, 0); }

  /* ---------- 子量表 ---------- */
  function isiScore(ans) {
    var ids = ['isi1','isi2','isi3','isi4','isi5','isi6','isi7'];
    var vals = ids.map(function (i) { return ans[i]; });
    if (vals.some(function (v) { return v == null; })) return null;
    var total = sum(vals);
    var band = S.isi.bands.find(function (b) { return total <= b.max; });
    return { total: total, max: S.isi.total, band: band ? band.label : '', positive: total >= S.isi.threshold };
  }

  function cesdScore(ans) {
    var ids = ['cesd1','cesd2','cesd3','cesd4','cesd5','cesd6','cesd7','cesd8','cesd9','cesd10'];
    var vals = ids.map(function (id) {
      var v = ans[id];
      if (v == null) return null;
      return S.cesd10.reverseItems.indexOf(id) >= 0 ? (S.cesd10.perItemMax - v) : v;
    });
    if (vals.some(function (v) { return v == null; })) return null;
    var total = sum(vals);
    return { total: total, max: S.cesd10.total, positive: total >= S.cesd10.threshold };
  }

  function cognitiveScore(ans) {
    var ids = ['cog1','cog2','cog3','cog4','cog5','cog6'];
    var vals = ids.map(function (i) { return ans[i]; });
    if (vals.some(function (v) { return v == null; })) return null;
    var total = sum(vals);
    var tier = total <= S.cognitive.tertiles.lowest ? 'lowest'
             : total <= S.cognitive.tertiles.middle ? 'middle' : 'highest';
    return { total: total, max: S.cognitive.total, tier: tier };
  }

  function mvpaMinutes(ans) {
    var vd = ans.vigDays || 0, vm = ans.vigMin || 0;
    var md = ans.modDays || 0, mm = ans.modMin || 0;
    return vd * vm + md * mm;
  }

  /* ---------- 主計分 ---------- */
  function score(ans) {
    var rows = [];
    var age = ans.age;
    var sex = ans.sex;
    var band = ageBand(age);

    function add(o) { rows.push(o); }

    /* 年齡與性別 */
    if (band === null) {
      add({ key: 'age', label: '年齡與性別', applied: false, points: 0,
        answer: age + ' 歲',
        reason: COND.age.note });
    } else if (sex !== 'male' && sex !== 'female') {
      add({ key: 'age', label: '年齡與性別', applied: false, points: 0,
        answer: age + ' 歲',
        reason: '原始權重表只提供男性與女性的年齡點數，未提供其他選項的估計值，因此本項不計分。' });
    } else {
      var p = W.age[sex][band];
      add({ key: 'age', label: '年齡與性別', applied: true, points: p,
        answer: age + ' 歲（' + band + ' 組，' + (sex === 'male' ? '男性' : '女性') + '）',
        reason: band === '60-64' ? '60–64 歲為原表的參考組，點數為 0。' : '依原表年齡分性別的點數表。',
        modifiable: false });
    }

    /* 教育 */
    if (ans.education) {
      var eduLabel = { high: '12 年以上', middle: '8–11 年', low: '未滿 8 年' }[ans.education];
      add({ key: 'education', label: '教育年數', applied: true, points: W.education[ans.education],
        answer: eduLabel,
        reason: ans.education === 'high' ? '最高組為參考組，點數為 0。' : '依原表教育程度點數。',
        modifiable: false });
    }

    /* 中年肥胖（≤65 歲） */
    var b = bmiCategory(ans.height, ans.weight);
    if (b) {
      var catLabel = { underweight: '過輕', normal: '正常', overweight: '過重', obese: '肥胖' }[b.cat];
      var bmiTxt = 'BMI ' + b.bmi.toFixed(1) + '（' + catLabel + '）';
      if (age <= COND.bmi.max) {
        add({ key: 'bmi', label: '體重（中年）', applied: true, points: W.bmi[b.cat],
          answer: bmiTxt, reason: '原表限中年（≤65 歲）計分。', modifiable: b.cat !== 'normal' });
      } else {
        add({ key: 'bmi', label: '體重（中年）', applied: false, points: 0,
          answer: bmiTxt, reason: COND.bmi.note });
      }
    }

    /* 高膽固醇（<60 歲） */
    if (ans.cholesterol) {
      var cholYes = ans.cholesterol === 'yes';
      var cholTxt = { yes: '是', no: '否', unknown: '不知道' }[ans.cholesterol];
      if (age < 60) {
        add({ key: 'cholesterol', label: '高膽固醇', applied: true, points: cholYes ? W.cholesterol.yes : 0,
          answer: cholTxt,
          reason: ans.cholesterol === 'unknown' ? '回答「不知道」，以未達標準計為 0 分。' : '原表限 <60 歲計分。',
          modifiable: cholYes });
      } else {
        add({ key: 'cholesterol', label: '高膽固醇', applied: false, points: 0,
          answer: cholTxt, reason: COND.cholesterol.note });
      }
    }

    /* 糖尿病（分性別） */
    if (ans.diabetes) {
      var dmYes = ans.diabetes === 'yes';
      var dmTxt = { yes: '是', no: '否', unknown: '不知道' }[ans.diabetes];
      if (dmYes && (sex === 'male' || sex === 'female')) {
        add({ key: 'diabetes', label: '糖尿病', applied: true, points: W.diabetes[sex],
          answer: dmTxt, reason: '原表的糖尿病點數分性別（男 2 分、女 3 分）。', modifiable: true });
      } else if (dmYes) {
        add({ key: 'diabetes', label: '糖尿病', applied: true, points: W.diabetes.male,
          answer: dmTxt, reason: '原表只提供男女兩種點數；未指明性別時本站採較保守的 2 分。',
          modifiable: true, isAssumption: true });
      } else {
        add({ key: 'diabetes', label: '糖尿病', applied: true, points: 0, answer: dmTxt,
          reason: ans.diabetes === 'unknown' ? '回答「不知道」，以無糖尿病計為 0 分。' : '無糖尿病為參考組。' });
      }
    }

    /* 中風 */
    if (ans.stroke) {
      var strokeYes = ans.stroke === 'yes';
      add({ key: 'stroke', label: '中風或 TIA', applied: true, points: strokeYes ? W.stroke.yes : 0,
        answer: { yes: '是', no: '否', unknown: '不知道' }[ans.stroke],
        reason: strokeYes ? '依原表。' : '無中風為參考組。', modifiable: strokeYes });
    }

    /* 頭部外傷 */
    if (ans.tbi) {
      var tbiYes = ans.tbi === 'lost' || ans.tbi === 'dazed';
      add({ key: 'tbi', label: '頭部外傷', applied: true, points: tbiYes ? W.tbi.yes : 0,
        answer: { lost: '有，曾昏迷', dazed: '有，未昏迷', no: '沒有', unknown: '不知道' }[ans.tbi],
        reason: tbiYes ? '原表的頭部外傷含「有無失去意識」兩者，點數相同。' : '無頭部外傷為參考組。',
        modifiable: false });
    }

    /* 高血壓（全年齡計分，見 cogdrisk.js 的年齡條件說明） */
    if (ans.hypertension) {
      var htnYes = ans.hypertension === 'yes';
      add({ key: 'hypertension', label: '高血壓', applied: true, points: htnYes ? W.hypertension.yes : 0,
        answer: { yes: '是', no: '否', unknown: '不知道' }[ans.hypertension],
        reason: htnYes ? window.COGDRISK.sourceNotes.hypertension : '無高血壓為參考組。',
        modifiable: htnYes });
    }

    /* 心房顫動（全年齡計分） */
    if (ans.afib) {
      var afYes = ans.afib === 'yes';
      add({ key: 'afib', label: '心房顫動', applied: true, points: afYes ? W.afib.yes : 0,
        answer: { yes: '是', no: '否', unknown: '不知道' }[ans.afib],
        reason: afYes ? window.COGDRISK.sourceNotes.afib : '無心房顫動為參考組。',
        modifiable: afYes });
    }

    /* 失眠（操作化假設） */
    var isi = isiScore(ans);
    if (isi) {
      add({ key: 'insomnia', label: '失眠', applied: true, points: isi.positive ? W.insomnia.yes : 0,
        answer: 'ISI ' + isi.total + '／' + isi.max + '（' + isi.band + '）',
        reason: '原表定義為「臨床診斷之失眠症」，本站以 ISI ≥ 15 代替。',
        modifiable: isi.positive, isAssumption: 'insomnia' });
    }

    /* 憂鬱（操作化假設） */
    var cesd = cesdScore(ans);
    if (cesd) {
      add({ key: 'depression', label: '憂鬱症狀', applied: true, points: cesd.positive ? W.depression.yes : 0,
        answer: 'CES-D-10 ' + cesd.total + '／' + cesd.max,
        reason: '原表定義為 CES-D（20 題版）> 20，本站採 10 題版 ≥ 10。',
        modifiable: cesd.positive, isAssumption: 'depression' });
    }

    /* 身體活動 */
    if (ans.vigDays != null && ans.modDays != null) {
      var mv = mvpaMinutes(ans);
      var active = mv >= S.mvpa.threshold;
      add({ key: 'physicalActivity', label: '身體活動', applied: true,
        points: active ? W.physicalActivity.active : W.physicalActivity.inactive,
        answer: '每週約 ' + mv + ' 分鐘中高強度活動' + (active ? '（已達 150 分鐘）' : '（未達 150 分鐘）'),
        reason: '原表以「每週 >150 分鐘中至高強度活動」為保護因子（−3 分）。',
        modifiable: !active, isProtective: active });
    }

    /* 認知活動（操作化假設） */
    var cog = cognitiveScore(ans);
    if (cog) {
      var tierLabel = { lowest: '最低組', middle: '中間組', highest: '最高組' }[cog.tier];
      add({ key: 'cognitiveEngagement', label: '動腦活動', applied: true, points: W.cognitiveEngagement[cog.tier],
        answer: cog.total + '／' + cog.max + '（' + tierLabel + '）',
        reason: '原表分最低／中間／最高三組，點數為 0／−5／−4——中間組的減分比最高組多，這是原表如此，本站未做調整。',
        modifiable: cog.tier === 'lowest', isProtective: cog.tier !== 'lowest', isAssumption: 'cognitiveEngagement' });
    }

    /* 孤獨感 */
    if (ans.lonely) {
      var lonelyYes = ans.lonely === 'yes';
      add({ key: 'loneliness', label: '孤獨感', applied: true, points: lonelyYes ? W.loneliness.lonely : 0,
        answer: lonelyYes ? '會覺得孤單' : '不會覺得孤單',
        reason: '原表的社交因子採用的是主觀孤獨感。', modifiable: lonelyYes });
    }

    /* 魚類攝取 */
    if (ans.fish) {
      var fishWeekly = ['weekly', 'weekly23', 'weekly4'].indexOf(ans.fish) >= 0;
      add({ key: 'fish', label: '魚類攝取', applied: true, points: fishWeekly ? W.fish.weekly : 0,
        answer: { rarely: '很少', monthly: '每月 1–3 次', weekly: '每週一次', weekly23: '每週 2–3 次', weekly4: '每週 4 次以上' }[ans.fish],
        reason: '原表只看「每週至少一份魚」，點數為 −0.25，是所有因子中影響最小的。',
        modifiable: !fishWeekly, isProtective: fishWeekly });
    }

    /* 吸菸 */
    if (ans.smoking) {
      add({ key: 'smoking', label: '吸菸', applied: true, points: W.smoking[ans.smoking],
        answer: { current: '目前仍在吸', former: '已戒菸', never: '從未吸菸' }[ans.smoking],
        reason: ans.smoking === 'former' ? '原表對已戒菸者給 0 分，與從未吸菸相同。' : '依原表。',
        modifiable: ans.smoking === 'current' });
    }

    /* ---------- 加總 ---------- */
    var total = rows.filter(function (r) { return r.applied; })
                    .reduce(function (a, r) { return a + r.points; }, 0);

    /* ---------- 該年齡層的可得分數範圍（動態計算，不寫死） ---------- */
    var fixedAge = (band && (sex === 'male' || sex === 'female')) ? W.age[sex][band] : 0;
    var variable = [];
    variable.push([0, W.education.low]);
    if (age <= COND.bmi.max) variable.push([0, W.bmi.obese]);
    if (age < 60) variable.push([0, W.cholesterol.yes]);
    variable.push([0, Math.max(W.diabetes.male, W.diabetes.female)]);
    variable.push([0, W.stroke.yes]);
    variable.push([0, W.tbi.yes]);
    variable.push([0, W.hypertension.yes]);
    variable.push([0, W.afib.yes]);
    variable.push([0, W.insomnia.yes]);
    variable.push([0, W.depression.yes]);
    variable.push([W.physicalActivity.active, 0]);
    variable.push([W.cognitiveEngagement.middle, 0]);
    variable.push([0, W.loneliness.lonely]);
    variable.push([W.fish.weekly, 0]);
    variable.push([0, W.smoking.current]);
    var rangeMin = fixedAge + sum(variable.map(function (v) { return v[0]; }));
    var rangeMax = fixedAge + sum(variable.map(function (v) { return v[1]; }));

    /* ---------- 假設造成的分數擺盪 ---------- */
    var assumptionRows = rows.filter(function (r) { return typeof r.isAssumption === 'string'; });
    var swingDown = 0, swingUp = 0;
    assumptionRows.forEach(function (r) {
      var a = window.COGDRISK.assumptions[r.isAssumption];
      if (!a) return;
      if (r.key === 'cognitiveEngagement') {
        swingDown += Math.abs(W.cognitiveEngagement.middle) - Math.abs(r.points);
        swingUp += Math.abs(r.points);
      } else if (r.points > 0) { swingDown += r.points; }
      else { swingUp += a.swing; }
    });

    return {
      rows: rows,
      total: total,
      range: { min: rangeMin, max: rangeMax },
      assumptionBand: { low: total - swingDown, high: total + swingUp },
      assumptionRows: assumptionRows,
      subscales: { isi: isi, cesd: cesd, cognitive: cog, mvpa: mvpaMinutes(ans), bmi: b },
      ageBand: band
    };
  }

  /* ---------- SCDS ---------- */
  function scdsScore(ans) {
    var items = window.SCALES.scds.items;
    var byFactor = { exe: [], mem: [], lang: [] };
    var answered = 0, na = 0;
    items.forEach(function (it) {
      var v = ans['scds' + it.n];
      if (v === 'na') { na++; return; }
      if (v == null) return;
      answered++;
      byFactor[it.factor].push(v);
    });
    if (answered === 0) return null;
    var norms = window.SCALES.scds.norms;
    function pack(key, arr) {
      var expected = norms[key].items;
      var raw = sum(arr);
      return { raw: raw, n: arr.length, expected: expected, complete: arr.length === expected,
               prorated: arr.length ? raw / arr.length * expected : null };
    }
    var res = {
      exe: pack('exe', byFactor.exe),
      mem: pack('mem', byFactor.mem),
      lang: pack('lang', byFactor.lang),
      total: pack('total', byFactor.exe.concat(byFactor.mem, byFactor.lang)),
      naCount: na, answered: answered
    };
    return res;
  }

  /* Part I 的是／否 */
  function scdsPartI(ans) {
    var out = {};
    window.SCALES.scds.partI.forEach(function (q) { out[q.id] = ans['scdsP' + q.id]; });
    out.worry = ans.scdsPf;
    return out;
  }

  /* ---------- AD-8 ---------- */
  function ad8Score(ans) {
    var vals = window.SCALES.ad8.items.map(function (_, i) { return ans['ad8_' + i]; });
    if (vals.every(function (v) { return v === undefined; })) return null;
    var yes = vals.filter(function (v) { return v === 1; }).length;
    var unknown = vals.filter(function (v) { return v === null; }).length;
    var answered = vals.filter(function (v) { return v !== undefined; }).length;
    return { total: yes, unknown: unknown, answered: answered,
             complete: answered === 8,
             positive: yes >= window.SCALES.ad8.cutoff };
  }

  /* ---------- SCD-plus 特徵 ---------- */
  function scdPlus(ans, ad8) {
    var p = scdsPartI(ans);
    var out = [];
    function push(id, label, met, from) { out.push({ id: id, label: label, met: met, from: from }); }

    push('memory', '以記憶方面的退化為主', ans.scdPlusMemory === 'yes', '本人作答');
    push('onset60', '60 歲以後才開始出現',
      ans.scdPlusOnsetAge != null ? ans.scdPlusOnsetAge >= 60 : null, '由開始年齡推算');
    push('within5y', '症狀在過去 5 年內出現', ans.scdPlusWithin5y === 'yes', '本人作答');
    push('concern', '對此感到擔心', p.worry != null ? p.worry >= 3 : null, 'SCDS 第一部分 f（擔心程度 ≥ 3）');
    push('worseThanPeers', '覺得自己比同年齡的人差', p.c === 'yes', 'SCDS 第一部分 c');
    push('persistent', '症狀持續存在', ans.scdPlusPersistent === 'yes', '本人作答');
    push('helpSeeking', '曾因此求助醫療', p.d === 'yes' || p.e === 'yes', 'SCDS 第一部分 d／e');
    push('informant', '親近的家人或朋友也觀察到',
      ad8 ? ad8.total >= 1 : null, ad8 ? 'AD-8 至少一題勾選「有改變」' : '家屬尚未填寫 AD-8');

    var met = out.filter(function (f) { return f.met === true; }).length;
    var unknown = out.filter(function (f) { return f.met === null; }).length;
    return { features: out, met: met, unknown: unknown, of: out.length };
  }

  window.SCORING = {
    score: score,
    scdsScore: scdsScore,
    scdsPartI: scdsPartI,
    ad8Score: ad8Score,
    scdPlus: scdPlus,
    ageBand: ageBand,
    bmiCategory: bmiCategory
  };
})();
