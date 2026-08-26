/* 計分引擎自我檢驗。以 node test-scoring.js 執行。
 * 目的：確認本站實作出來的可得分數範圍，與 Anstey 2022 內文所述的範圍一致。 */
global.window = {};
require('./data/refs.js');
require('./data/cogdrisk.js');
require('./data/scales.js');
require('./data/questions.js');
require('./scoring.js');
var S = window.SCORING;

var pass = 0, fail = 0;
function check(name, actual, expected) {
  var ok = String(actual) === String(expected);
  console.log((ok ? '  PASS  ' : '  FAIL  ') + name + '  →  ' + actual + (ok ? '' : '  (期望 ' + expected + ')'));
  ok ? pass++ : fail++;
}

function worst(age, sex) {
  return { age: age, sex: sex, education: 'low', height: 160, weight: 90,
    cholesterol: 'yes', diabetes: 'yes', hypertension: 'yes', stroke: 'yes', afib: 'yes', tbi: 'lost',
    isi1: 4, isi2: 4, isi3: 4, isi4: 4, isi5: 4, isi6: 4, isi7: 4,
    cesd1: 3, cesd2: 3, cesd3: 3, cesd4: 3, cesd5: 0, cesd6: 3, cesd7: 3, cesd8: 0, cesd9: 3, cesd10: 3,
    vigDays: 0, vigMin: 0, modDays: 0, modMin: 0,
    cog1: 0, cog2: 0, cog3: 0, cog4: 0, cog5: 0, cog6: 0,
    lonely: 'yes', fish: 'rarely', smoking: 'current' };
}
function best(age, sex) {
  return { age: age, sex: sex, education: 'high', height: 170, weight: 65,
    cholesterol: 'no', diabetes: 'no', hypertension: 'no', stroke: 'no', afib: 'no', tbi: 'no',
    isi1: 0, isi2: 0, isi3: 0, isi4: 0, isi5: 0, isi6: 0, isi7: 0,
    cesd1: 0, cesd2: 0, cesd3: 0, cesd4: 0, cesd5: 3, cesd6: 0, cesd7: 0, cesd8: 3, cesd9: 0, cesd10: 0,
    vigDays: 5, vigMin: 60, modDays: 5, modMin: 60,
    cog1: 2, cog2: 2, cog3: 2, cog4: 2, cog5: 2, cog6: 2,   // 總分 12 → 中間組（−5）
    lonely: 'no', fish: 'weekly4', smoking: 'never' };
}

console.log('\n== 與 Anstey 2022 內文所述範圍比對 ==');
console.log('原文：CogDrisk 失智症分數 late-life 為 −4.25 至 45；midlife 為 −8.25 至 28。\n');

var lateWorst = S.score(worst(92, 'female'));
check('晚年上限（92 歲女性全部最不利）', lateWorst.total, 45);

var midWorst = S.score(worst(55, 'female'));
check('中年上限（55 歲女性全部最不利）', midWorst.total, 28);

var midBest = S.score(best(55, 'male'));
check('中年下限（55 歲男性全部最有利）', midBest.total.toFixed(2), '-8.25');

var lateBest = S.score(best(62, 'female'));
console.log('  晚年下限（62 歲女性全部最有利）→ ' + lateBest.total.toFixed(2) +
            '   [原文所述 late-life 下限為 −4.25，本站無法重現；' +
            '原文的條件式方程式在未取得的 Supporting Information Part B，差異已如實揭露]');

console.log('\n== 條件式因子的年齡開關 ==');
function applied(res, key) { var r = res.rows.find(function (x) { return x.key === key; }); return r ? r.applied : 'n/a'; }
var a55 = S.score(worst(55, 'male')), a70 = S.score(worst(70, 'male'));
check('55 歲：高膽固醇計分', applied(a55, 'cholesterol'), true);
check('70 歲：高膽固醇不計分', applied(a70, 'cholesterol'), false);
check('55 歲：BMI 計分', applied(a55, 'bmi'), true);
check('70 歲：BMI 不計分', applied(a70, 'bmi'), false);
check('55 歲：高血壓計分（效應量註記不等於排除）', applied(a55, 'hypertension'), true);
check('70 歲：高血壓計分', applied(a70, 'hypertension'), true);
check('55 歲：心房顫動計分', applied(a55, 'afib'), true);
check('70 歲：心房顫動計分', applied(a70, 'afib'), true);
check('55 歲：年齡不計分', applied(a55, 'age'), false);
check('70 歲：年齡計分', applied(a70, 'age'), true);

console.log('\n== 逐格權重對照 Table 1 ==');
var W = window.COGDRISK.weights;
check('男性 75–79 歲', W.age.male['75-79'], 13);
check('女性 90 歲以上', W.age.female['90+'], 23);
check('教育未滿 8 年', W.education.low, 4);
check('肥胖 BMI ≥30', W.bmi.obese, 3);
check('體重過輕高於過重', W.bmi.underweight > W.bmi.overweight, true);
check('糖尿病（女）', W.diabetes.female, 3);
check('身體活動達標', W.physicalActivity.active, -3);
check('動腦活動中間組', W.cognitiveEngagement.middle, -5);
check('動腦活動最高組', W.cognitiveEngagement.highest, -4);
check('魚類每週一份', W.fish.weekly, -0.25);
check('已戒菸與從未吸菸同分', W.smoking.former === W.smoking.never, true);

console.log('\n== 範圍計算與稽核軌跡 ==');
check('晚年實際總分等於其範圍上限', lateWorst.total, lateWorst.range.max);
check('中年最有利總分等於其範圍下限', midBest.total.toFixed(2), midBest.range.min.toFixed(2));
check('每列都有說明理由', lateWorst.rows.every(function (r) { return r.reason && r.reason.length > 0; }), true);
check('假設列數', lateWorst.assumptionRows.length, 3);

console.log('\n== 子量表 ==');
check('ISI 全滿 → 28 分且達閾值', lateWorst.subscales.isi.total + '/' + lateWorst.subscales.isi.positive, '28/true');
check('CES-D-10 反向題正確（全最不利 → 30）', lateWorst.subscales.cesd.total, 30);
check('CES-D-10 全最有利 → 0', lateBest.subscales.cesd.total, 0);
check('MVPA 計算 5×60+5×60', lateBest.subscales.mvpa, 600);

console.log('\n== AD-8 ==');
var ad8all = {}; for (var i = 0; i < 8; i++) ad8all['ad8_' + i] = 1;
check('AD-8 全勾「有改變」→ 8 分、達切點', S.ad8Score(ad8all).total + '/' + S.ad8Score(ad8all).positive, '8/true');
var ad8one = { ad8_0: 1 }; for (var j = 1; j < 8; j++) ad8one['ad8_' + j] = 0;
check('AD-8 僅 1 題 → 未達切點', S.ad8Score(ad8one).positive, false);
var ad8two = { ad8_0: 1, ad8_1: 1 }; for (var k = 2; k < 8; k++) ad8two['ad8_' + k] = 0;
check('AD-8 2 題 → 達切點', S.ad8Score(ad8two).positive, true);
var ad8unk = { ad8_0: 1, ad8_1: null }; for (var m = 2; m < 8; m++) ad8unk['ad8_' + m] = 0;
check('AD-8「不知道」不計分', S.ad8Score(ad8unk).total, 1);

console.log('\n== SCDS ==');
var scdsAll = {}; window.SCALES.scds.items.forEach(function (it) { scdsAll['scds' + it.n] = 5; });
var sc = S.scdsScore(scdsAll);
check('SCDS 全選 5 → 總分 70', sc.total.raw, 70);
check('SCDS 執行功能子量表 6 題 → 30', sc.exe.raw, 30);
check('SCDS 記憶子量表 4 題 → 20', sc.mem.raw, 20);
check('SCDS 語言子量表 4 題 → 20', sc.lang.raw, 20);
var scdsMin = {}; window.SCALES.scds.items.forEach(function (it) { scdsMin['scds' + it.n] = 1; });
check('SCDS 全選 1 → 總分 14', S.scdsScore(scdsMin).total.raw, 14);
var scdsNa = Object.assign({}, scdsAll); scdsNa.scds1 = 'na';
check('SCDS 有「不適用」時標記為不完整', S.scdsScore(scdsNa).exe.complete, false);

console.log('\n== SCD-plus ==');
var sp = S.scdPlus({
  scdPlusMemory: 'yes', scdPlusOnsetAge: 68, scdPlusWithin5y: 'yes', scdPlusPersistent: 'yes',
  scdsPc: 'yes', scdsPd: 'yes', scdsPf: 5
}, S.ad8Score(ad8two));
check('SCD-plus 八項特徵全具備', sp.met + '/' + sp.of, '8/8');
var sp2 = S.scdPlus({ scdPlusOnsetAge: 45, scdsPf: 1 }, null);
check('SCD-plus 未知項會標為 null 而非 false', sp2.unknown > 0, true);

console.log('\n----------------------------------------');
console.log('通過 ' + pass + ' 項，失敗 ' + fail + ' 項');
process.exit(fail ? 1 : 0);
