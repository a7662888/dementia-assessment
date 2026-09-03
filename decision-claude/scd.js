/* 主觀認知減退路徑、臨床診斷說明，以及 ATT 醫病共享決策模組 */
(function () {
  'use strict';

  var A = window.__APP_PARTIALS;
  var h = A.h, frag = A.frag, esc = A.esc, btn = A.btn, actions = A.actions,
      go = A.go, set = A.set, state = A.state, progress = A.progress,
      redFlag = A.redFlag, disclaimer = A.disclaimer, refLine = A.refLine;
  var SC = window.SCALES, S = window.SCORING, ATT = window.ATT;

  function ans() { return state.answers; }
  function filler() { return ans().scdFiller || 'both'; }

  /* 依「誰來填」決定步驟順序。自填與家屬填可以二擇一，不必兩者都做。 */
  var FLOWS = {
    self:      ['scd-p1', 'scd-p2', 'scd-extra', 'scd-result'],
    informant: ['ad8', 'scd-extra', 'scd-result'],
    both:      ['scd-p1', 'scd-p2', 'scd-extra', 'ad8', 'scd-result']
  };
  function flow() { return FLOWS[filler()] || FLOWS.both; }
  function stepIndex(step) { return flow().indexOf(step); }
  function nextOf(step) {
    var f = flow(), i = f.indexOf(step);
    return (i >= 0 && i + 1 < f.length) ? f[i + 1] : 'scd-result';
  }
  function prevOf(step) {
    var f = flow(), i = f.indexOf(step);
    return i > 0 ? f[i - 1] : 'scd-who';
  }
  /* 進度條：不含結果頁 */
  function stepProgress(step) {
    var f = flow().filter(function (s) { return s !== 'scd-result'; });
    return { cur: f.indexOf(step) + 1, total: f.length };
  }
  function prog(step) {
    var p = stepProgress(step);
    return progress(p.cur, p.total, '主觀認知減退評估');
  }

  function yesNo(id, label, yes, no, help) {
    return h('div', { class: 'q' }, [
      h('span', { class: 'q__label', text: label }),
      help ? h('span', { class: 'q__help', text: help }) : null,
      h('div', { class: 'opts', role: 'radiogroup', 'aria-label': label }, [
        ['yes', yes || '是'], ['no', no || '否']
      ].map(function (o) {
        return h('label', { class: 'opt' }, [
          h('input', { type: 'radio', name: id, value: o[0], checked: ans()[id] === o[0],
            onchange: function () { set(id, o[0]); navRefresh(); } }),
          h('span', { text: o[1] })
        ]);
      }))
    ]);
  }

  var navNeeds = [];
  function navRefresh() {
    var b = document.getElementById('nextBtn');
    if (b) b.disabled = !navNeeds.every(function (id) {
      var v = ans()[id]; return v !== undefined && v !== null && v !== '';
    });
  }
  function nextBtn(label, target, needs) {
    navNeeds = needs || [];
    return h('button', { id: 'nextBtn', class: 'btn btn--primary', type: 'button',
      text: label, disabled: !navNeeds.every(function (id) {
        var v = ans()[id]; return v !== undefined && v !== null && v !== ''; }),
      onclick: function () { go(target); } });
  }

  /* ---------------- 引言 ---------------- */
  function intro() {
    navNeeds = [];
    return frag([
      h('h1', { text: '主觀認知減退評估' }),
      redFlag(),
      h('p', { text: '「主觀認知減退」指的是自己覺得記憶或思考能力變差，但一般認知測驗還在正常範圍。它不是疾病診斷，而是一個值得留意、也值得追蹤的狀態。' }),
      h('div', { class: 'card' }, [
        h('h3', { text: '這個評估由兩份問卷組成，可以只填其中一份' }),
        h('p', { html: '<strong>本人填寫：台灣主觀認知功能退化量表（SCDS）。</strong>先問六個關於整體感受的問題，再用 14 題比較「現在」與「一年前」。' }),
        h('p', { html: '<strong>家屬填寫：AD-8。</strong>由最了解當事人日常狀況的家屬或照顧者填寫八題。' }),
        h('p', { html: '<strong>兩份都填最完整</strong>，因為本人的自述與家屬的觀察意義不同，會分開記錄；但只填一份也能得到結果，系統會明確標示哪些項目因此無法判定。' }),
        h('p', { html: '最後會整理 <strong>SCD-plus 特徵</strong>——國際上用來標示「哪些主觀認知減退比較需要留意」的一組特徵，多數可以從前面的答案直接推得。' })
      ]),
      h('p', { class: 'note', html:
        '要先說清楚：<strong>SCDS 沒有經驗證的切分點</strong>，原始論文明白指出切分點仍待縱貫研究驗證。而且在原研究中，主觀認知減退組與輕度認知障礙組的分數幾乎相同（32.86 對 32.73）。' +
        '所以本站不會告訴您「您有」或「您沒有」主觀認知減退，只會呈現您的分數落在哪裡，以及哪些特徵值得帶去門診討論。' }),
      disclaimer(),
      actions([
        btn('開始填寫', function () { go('scd-who'); }),
        btn('回首頁', function () { go('home'); }, 'ghost')
      ])
    ]);
  }

  /* ---------------- 誰來填 ---------------- */
  function who() {
    navNeeds = [];
    function choose(v) { set('scdFiller', v); go(flow()[0]); }
    return frag([
      h('h1', { text: '這次由誰填寫？' }),
      h('p', { text: '選擇最符合現在情況的一項。之後隨時可以回來補填另一份。' }),
      h('div', { class: 'paths' }, [
        h('button', { class: 'path', type: 'button', onclick: function () { choose('both'); } }, [
          h('span', { class: 'path__kicker', text: '最完整' }),
          h('span', { class: 'path__title', text: '本人與家屬都填' }),
          h('span', { class: 'path__desc', text: 'SCDS（本人）＋ AD-8（家屬），八項 SCD-plus 特徵都能判定。約 15 分鐘。' }),
          h('span', { class: 'path__go', text: '兩份都填 →' })
        ]),
        h('button', { class: 'path', type: 'button', onclick: function () { choose('self'); } }, [
          h('span', { class: 'path__kicker', text: '只有本人' }),
          h('span', { class: 'path__title', text: '我自己填' }),
          h('span', { class: 'path__desc', text: '只填 SCDS 與補充題。「家人是否也觀察到」這一項會標為無法判定。約 10 分鐘。' }),
          h('span', { class: 'path__go', text: '本人填寫 →' })
        ]),
        h('button', { class: 'path', type: 'button', onclick: function () { choose('informant'); } }, [
          h('span', { class: 'path__kicker', text: '只有家屬' }),
          h('span', { class: 'path__title', text: '我是家屬，替家人填' }),
          h('span', { class: 'path__desc', text: '只填 AD-8 與補充題。三項屬於當事人主觀經驗的特徵會標為無法判定。約 5 分鐘。' }),
          h('span', { class: 'path__go', text: '家屬填寫 →' })
        ])
      ]),
      h('p', { class: 'note', text:
        'ISTAART 立場文件指出，由親近家屬佐證的主觀認知減退，預測價值高於僅有本人自述。若情況允許，兩份都填會得到比較完整的判讀。' }),
      actions([ btn('上一步', function () { go('scd-intro'); }, 'ghost') ])
    ]);
  }

  /* ---------------- SCDS 第一部分 ---------------- */
  function partI() {
    var w = SC.scds.worry;
    var needs = SC.scds.partI.map(function (q) { return 'scdsP' + q.id; }).concat(['scdsPf']);
    return frag([
      prog('scd-p1'),
      h('h1', { text: '您對自己認知功能的整體感受' }),
      h('p', { class: 'note', text: '這一部分請由本人填寫。' }),
      frag(SC.scds.partI.map(function (q) {
        return yesNo('scdsP' + q.id, q.q, q.yes, q.no);
      })),
      h('div', { class: 'q' }, [
        h('span', { class: 'q__label', text: w.q }),
        h('div', { class: 'scale__opts', role: 'radiogroup', 'aria-label': w.q },
          [1, 2, 3, 4, 5].map(function (v, i) {
            return h('label', { class: 'scale__opt' }, [
              h('input', { type: 'radio', name: 'scdsPf', value: v, checked: ans().scdsPf === v,
                onchange: function () { set('scdsPf', v); navRefresh(); } }),
              h('b', { text: String(v) }),
              h('span', { text: w.anchors[i] || '' })
            ]);
          }))
      ]),
      actions([ nextBtn('下一部分', nextOf('scd-p1'), needs),
                btn('上一步', function () { go(prevOf('scd-p1')); }, 'ghost') ])
    ]);
  }

  /* ---------------- SCDS 第二部分 ---------------- */
  function partII() {
    var needs = SC.scds.items.map(function (it) { return 'scds' + it.n; });
    return frag([
      prog('scd-p2'),
      h('h1', { text: '與一年前相比' }),
      h('p', { class: 'note', text: SC.scds.partIIIntro }),
      frag(SC.scds.items.map(function (it) {
        var id = 'scds' + it.n;
        return h('div', { class: 'scale' }, [
          h('div', { class: 'scale__q', text: it.n + '. ' + it.text }),
          h('div', { class: 'scale__opts', role: 'radiogroup', 'aria-label': it.text },
            SC.scds.likert.map(function (lab, i) {
              var v = i + 1;
              return h('label', { class: 'scale__opt' }, [
                h('input', { type: 'radio', name: id, value: v, checked: ans()[id] === v,
                  onchange: function () { set(id, v); navRefresh(); } }),
                h('b', { text: String(v) }), h('span', { text: lab })
              ]);
            }).concat([
              h('label', { class: 'scale__opt' }, [
                h('input', { type: 'radio', name: id, value: 'na', checked: ans()[id] === 'na',
                  onchange: function () { set(id, 'na'); navRefresh(); } }),
                h('b', { text: '—' }), h('span', { text: '不適用' })
              ])
            ]))
        ]);
      })),
      actions([ nextBtn('下一部分', nextOf('scd-p2'), needs),
                btn('上一步', function () { go(prevOf('scd-p2')); }, 'ghost') ])
    ]);
  }

  /* ---------------- SCD-plus 補充題（自填／家屬版問法不同） ---------------- */
  function extra() {
    var voice = filler() === 'informant' ? 'informant' : 'self';
    var qs = SC.scdPlus.extraQuestions;
    var needs = qs.map(function (q) { return q.id; });
    var nxt = nextOf('scd-extra');
    var nextLabel = nxt === 'ad8' ? '下一部分：家屬填寫 AD-8' : '看整理結果';

    return frag([
      prog('scd-extra'),
      h('h1', { text: '症狀的樣貌' }),
      h('p', { class: 'note', text: voice === 'informant'
        ? '請就您觀察到的情況作答。這幾題用來補齊 SCD-plus 特徵。'
        : '這幾題用來補齊 SCD-plus 特徵。其餘特徵可以從您前面的作答直接推得，不必重複回答。' }),
      frag(qs.map(function (q) {
        var w = q[voice];
        if (q.type === 'yesno') return yesNo(q.id, w.q, w.yes, w.no, q.help);
        return h('div', { class: 'q' }, [
          h('label', { class: 'q__label', for: 'f_' + q.id, text: w.q }),
          q.help ? h('span', { class: 'q__help', text: q.help }) : null,
          h('div', { class: 'num' }, [
            h('input', { type: 'number', id: 'f_' + q.id, inputmode: 'numeric', min: 18, max: 110,
              value: ans()[q.id] != null ? ans()[q.id] : '',
              oninput: function (e) {
                set(q.id, e.target.value === '' ? undefined : Number(e.target.value)); navRefresh(); } }),
            h('span', { text: '歲' })
          ])
        ]);
      })),
      actions([ nextBtn(nextLabel, nxt, needs),
                btn('上一步', function () { go(prevOf('scd-extra')); }, 'ghost') ])
    ]);
  }

  /* ---------------- AD-8 ---------------- */
  function ad8() {
    var needs = SC.ad8.items.map(function (_, i) { return 'ad8_' + i; });
    return frag([
      prog('ad8'),
      h('h1', { text: '家屬版 AD-8' }),
      h('p', { class: 'note', text: SC.ad8.intro }),
      h('div', { class: 'card card--flat' },
        SC.ad8.notes.map(function (t) { return h('p', { class: 'q__help', text: '· ' + t }); })),
      frag(SC.ad8.items.map(function (t, i) {
        var id = 'ad8_' + i;
        return h('div', { class: 'scale' }, [
          h('div', { class: 'scale__q', text: (i + 1) + '. ' + t }),
          h('div', { class: 'scale__opts', role: 'radiogroup', 'aria-label': t },
            SC.ad8.options.map(function (o) {
              return h('label', { class: 'scale__opt' }, [
                h('input', { type: 'radio', name: id, checked: ans()[id] === o.value,
                  onchange: function () { set(id, o.value); navRefresh(); } }),
                h('span', { text: o.label })
              ]);
            }))
        ]);
      })),
      h('p', { class: 'q__help', text: SC.ad8.scoring }),
      actions([ nextBtn('看整理結果', nextOf('ad8'), needs),
                btn('上一步', function () { go(prevOf('ad8')); }, 'ghost') ])
    ]);
  }

  /* ---------------- 結果 ---------------- */
  function normRow(label, val, n) {
    function band(m, sd) { return m.toFixed(1) + ' ± ' + sd.toFixed(1); }
    return h('tr', {}, [
      h('td', { text: label }),
      h('td', { class: 'num-cell', text: val == null ? '—' : String(Math.round(val * 10) / 10) }),
      h('td', { class: 'num-cell', text: band(n.cn[0], n.cn[1]) }),
      h('td', { class: 'num-cell', text: band(n.scd[0], n.scd[1]) }),
      h('td', { class: 'num-cell', text: band(n.mci[0], n.mci[1]) })
    ]);
  }

  function result() {
    navNeeds = [];
    var a = ans();
    var sc = S.scdsScore(a);
    var ad = S.ad8Score(a);
    var sp = S.scdPlus(a, ad);
    var n = SC.scds.norms;

    function v(x) { return x ? (x.complete ? x.raw : x.prorated) : null; }

    var f = filler();
    var fillerLabel = { self: '本人填寫', informant: '家屬填寫', both: '本人與家屬都填寫' }[f];

    return frag([
      h('h1', { text: '整理結果' }),
      h('p', { text: '以下整理成可以直接帶去門診的摘要。請注意：這是整理，不是判讀，更不是診斷。' }),
      h('p', { class: 'note', html: '本次填寫方式：<strong>' + esc(fillerLabel) + '</strong>。' +
        esc(SC.scdPlus.coverageNotes[f] || '') }),
      f !== 'both' ? h('div', { class: 'actions' }, [
        btn(f === 'self' ? '補填家屬版 AD-8' : '補填本人版 SCDS', function () {
          set('scdFiller', 'both');
          go(f === 'self' ? 'ad8' : 'scd-p1');
        }, 'ghost')
      ]) : null,

      /* AD-8 */
      (ad || f !== 'self') ? h('h2', { text: '家屬觀察（AD-8）' }) : null,
      ad ? h('div', { class: 'card' }, [
        h('div', { class: 'score' }, [
          h('div', {}, [ h('span', { class: 'score__num', text: String(ad.total) }),
                         h('span', { class: 'score__unit', text: '／ 8 分' }) ]),
          h('div', { class: 'score__caption',
            text: ad.positive ? '達到「建議進一步檢查」的門檻（≥2 分）。' : '未達 2 分的門檻。' })
        ]),
        ad.unknown ? h('p', { class: 'note', text:
          '其中有 ' + ad.unknown + ' 題回答「不知道」，依規則不計分，總分可能因此低估。' }) : null,
        h('p', { html: ad.positive
          ? '<strong>本站使用的量表中，只有 AD-8 有經驗證的切分點。</strong>達到 2 分代表建議安排進一步的臨床評估，但這是篩檢結果，不是診斷。'
          : '<strong>未達切分點不等於沒有問題。</strong>AD-8 針對的是「與過去相比的改變」，很早期或以非記憶症狀為主的變化可能不會被抓到。若本人持續有困擾，仍值得就醫評估。' }),
        h('ul', {}, SC.ad8.caveats.map(function (t) { return h('li', { class: 'q__help', text: t }); }))
      ]) : (f !== 'self' ? h('p', { text: '尚未填寫。' }) : null),
      ad ? refLine('ad8tw') : null,

      /* SCDS */
      (sc || f !== 'informant') ? h('h2', { text: '本人自述（SCDS）' }) : null,
      sc ? frag([
        h('p', { text: '下表是您的分數，以及原始研究中三組人的平均值與標準差，供對照參考。' }),
        h('div', { class: 'tbl-scroll' }, [
          h('table', {}, [
            h('thead', {}, [ h('tr', {}, [
              h('th', { text: '' }), h('th', { class: 'num-cell', text: '您的分數' }),
              h('th', { class: 'num-cell', text: '認知正常組' }),
              h('th', { class: 'num-cell', text: '主觀認知減退組' }),
              h('th', { class: 'num-cell', text: '輕度認知障礙組' })
            ]) ]),
            h('tbody', {}, [
              normRow('總分（14 題）', v(sc.total), n.total),
              normRow('執行功能與定向（6 題）', v(sc.exe), n.exe),
              normRow('記憶（4 題）', v(sc.mem), n.mem),
              normRow('語言（4 題）', v(sc.lang), n.lang)
            ])
          ])
        ]),
        sc.naCount ? h('p', { class: 'note', text:
          '您有 ' + sc.naCount + ' 題選了「不適用」。這些題目不計入，表中的分數已按題數換算，與組別平均比較時請多留意。' }) : null,
        h('div', { class: 'caution' }, [
          h('h3', { text: '這張表怎麼讀，怎麼不能讀' }),
          h('p', { html: '注意主觀認知減退組（32.9）與輕度認知障礙組（32.7）的總分<strong>幾乎一樣</strong>。這代表 SCDS 分數高，並不能告訴您是哪一組；它只能顯示您的自覺退化程度，比認知正常組（26.5）高或低。' }),
          h('p', { text: '原始研究只有 175 人，且組別平均是以教育程度與擔憂量表為共變數調整後的結果。把個人分數和這些平均值比較，只能當作粗略定位。' })
        ]),
        h('ul', {}, SC.scds.caveats.map(function (t) { return h('li', { class: 'q__help', text: t }); }))
      ]) : (f !== 'informant' ? h('p', { text: '尚未填寫。' }) : null),
      sc ? refLine('tsai2021') : null,

      /* SCD-plus */
      h('h2', { text: 'SCD-plus 特徵' }),
      h('p', { html: '在可以判定的 <strong>' + sp.assessable + '</strong> 項當中，您具備 <strong>' +
        sp.met + '</strong> 項。' +
        (sp.unknown ? '另有 ' + sp.unknown + ' 項因為這次沒有填寫對應的問卷，無法判定。' : '八項全部都能判定。') }),
      sp.unknown ? h('p', { class: 'q__help', text:
        '無法判定的項目一律標為「資料不足」，不會被當成「沒有這個特徵」——否則只填一邊的人會被系統性低估。' }) : null,
      h('div', { class: 'tbl-scroll' }, [
        h('table', {}, [
          h('thead', {}, [ h('tr', {}, [ h('th', { text: '特徵' }), h('th', { text: '判定' }), h('th', { text: '依據' }) ]) ]),
          h('tbody', {}, sp.features.map(function (ft) {
            return h('tr', { class: ft.met === true ? '' : 'is-muted' }, [
              h('td', { text: ft.label }),
              h('td', {}, [ ft.met === true
                ? h('span', { class: 'tag tag--strong', text: '具備' })
                : ft.met === false ? h('span', { class: 'tag tag--off', text: '無' })
                : h('span', { class: 'tag tag--thin', text: '資料不足' }) ]),
              h('td', { class: 'q__help', text: ft.from })
            ]);
          }))
        ])
      ]),
      h('div', { class: 'card card--flat' },
        SC.scdPlus.interpretation.map(function (t) { return h('p', { class: 'q__help', text: '· ' + t }); })),
      refLine('moretti2025'),

      /* 建議 */
      h('h2', { text: '建議的下一步' }),
      h('div', { class: 'card' }, nextSteps(ad, sp)),

      actions([
        btn('列印或存成 PDF（帶去門診）', function () { window.print(); }),
        btn('了解臨床診斷會做什麼', function () { go('clinical'); }),
        btn('修改答案', function () { go(flow()[0]); }, 'ghost'),
        btn('回首頁', function () { go('home'); }, 'ghost')
      ])
    ]);
  }

  function nextSteps(ad, sp) {
    var out = [];
    /* 只填一邊時可判定的特徵較少，因此除了絕對項數，也看「可判定項目中的比例」，
       避免因為沒填另一份問卷而被低估。 */
    var manyFeatures = sp.met >= 5 ||
      (sp.assessable >= 4 && sp.met / sp.assessable >= 0.75);
    var reasons = [];
    if (ad && ad.positive) reasons.push('家屬版 AD-8 已達 2 分的門檻');
    if (manyFeatures) reasons.push('在可判定的 ' + sp.assessable + ' 項 SCD-plus 特徵中具備了 ' + sp.met + ' 項');

    if (reasons.length) {
      out.push(h('p', { html: '<strong>建議安排神經內科或記憶門診的評估。</strong>' +
        reasons.join('，而且') + '。' }));
    } else {
      out.push(h('p', { html: '<strong>目前沒有明確指向需要立刻就醫的訊號，但這不是「沒事」的證明。</strong>' +
        '如果困擾持續、加重，或家人開始注意到變化，請安排門診評估。' }));
    }
    if (sp.unknown) {
      out.push(h('p', { class: 'note', text:
        '這次有 ' + sp.unknown + ' 項特徵因為只填了一邊而無法判定，上面的判斷是在資料不完整的情況下做的。' +
        '補填另一份問卷會讓判讀更完整。' }));
    }
    out.push(h('p', { text: '不論結果如何，以下三件事都值得做：' }));
    out.push(h('ul', {}, [
      h('li', { html: '<strong>把這份摘要印出來帶去門診。</strong>醫師需要的是「什麼時候開始、怎麼變化、家人怎麼看」，這些比一個分數有用得多。' }),
      h('li', { html: '<strong>同時處理可改變的風險因子。</strong>主觀認知減退者一樣適用預防措施，而且這是目前唯一有證據能影響長期走向的做法。' }),
      h('li', { html: '<strong>檢查情緒與睡眠。</strong>憂鬱、焦慮與失眠都會造成或放大認知困擾，而且它們是可以治療的。' })
    ]));
    out.push(h('div', { class: 'actions' }, [
      btn('順便做風險評估與預防建議', function () { go('risk:0'); }, 'ghost')
    ]));
    return out;
  }

  /* ---------------- 臨床診斷說明 ---------------- */
  function clinical() {
    navNeeds = [];
    return frag([
      h('h1', { text: '臨床診斷會做些什麼' }),
      h('p', { text: '線上量表能做的到此為止。真正的診斷需要面對面的病史詢問、認知測驗、身體與神經學檢查，以及排除其他可治療的原因。以下說明門診大致的流程，讓您知道可以先準備什麼。' }),

      h('h2', { text: '一、結構性病史' }),
      h('div', { class: 'card' }, [
        h('p', { text: '這是最重要的一步。醫師會問：什麼時候開始、怎麼開始（突然或慢慢）、退化的速度、影響到哪些日常功能、有沒有行為或個性改變、幻覺、動作變慢或跌倒、睡眠時大喊大叫等等。這些細節決定要往哪個方向查。' }),
        h('p', { class: 'q__help', text: '家屬提供的資訊往往比本人的自述更關鍵。可能的話，請熟悉日常狀況的家人一起去。' }),
        h('p', {}, [ '本站所屬的專案已經有一份可直接使用的工具：',
          h('a', { href: '../index.html', text: '臨床病史失智診斷結構性問卷' }), '（含 CDR 分項），供醫療人員使用。' ])
      ]),

      h('h2', { text: '二、認知測驗' }),
      h('div', { class: 'card' }, [
        h('p', { text: '常見的有 MMSE、MoCA、CASI 等。測驗結果要對照年齡與教育程度判讀——教育程度低的人分數天生偏低，不能直接套用同一個切分點。' }),
        h('p', {}, [ '本專案提供台灣版 MoCA（含國、台語語音導引）：',
          h('a', { href: '../moca-t/index.html', text: 'MoCA-T 施測版' }), '、',
          h('a', { href: '../moca-t/self.html', text: 'MoCA-T 自我施測版' }), '。' ]),
        h('p', { class: 'q__help', text: '認知測驗正常，不能排除主觀認知減退；認知測驗異常，也不等於失智症——要看是否影響日常功能。' })
      ]),

      h('h2', { text: '三、排除可治療的原因' }),
      h('div', { class: 'card' }, [
        h('p', { text: '這一步的目的是找出「改善之後認知就會好轉」的狀況。常規會安排抽血（甲狀腺功能、維生素 B12、電解質、肝腎功能、血糖、梅毒與 HIV 篩檢等）與一次腦部影像（CT 或 MRI）。' }),
        h('p', { text: '也要檢視用藥：抗膽鹼藥物、鎮靜安眠藥、部分抗組織胺與膀胱用藥都可能造成認知變差。憂鬱、睡眠呼吸中止、慢性疼痛同樣會表現成記憶問題。' })
      ]),

      h('h2', { text: '四、功能評估與分期' }),
      h('div', { class: 'card' }, [
        h('p', { text: '認知障礙是否已經影響到獨立生活，是區分「輕度認知障礙」與「失智症」的關鍵。常用 CDR（臨床失智評估量表）來分期：CDR 0.5 通常對應輕度認知障礙或極輕度失智，CDR 1 為輕度失智。' }),
        h('p', { class: 'q__help', text: 'CDR 需由受過訓練的人員依家屬與本人的訪談評定，不是自填問卷。' })
      ]),

      h('h2', { text: '五、需要時才做的生物標記' }),
      h('div', { class: 'card' }, [
        h('p', { text: '在完成上述評估、且結果會影響治療決定時，才會考慮 amyloid PET、腦脊髓液生物標記或血漿標記。它們回答的是「腦內是否有阿茲海默症相關病理」，不能單獨回答「症狀是什麼造成的」。' }),
        h('p', {}, [ '如果您已經走到這一步，', h('a', { href: '#', onclick: function (e) { e.preventDefault(); go('att'); }, text: '請進入生物標記與 ATT 的決策工具' }), '。' ])
      ]),

      actions([
        btn('進入生物標記與 ATT 決策工具', function () { go('att'); }),
        btn('回首頁', function () { go('home'); }, 'ghost')
      ])
    ]);
  }

  /* ---------------- ATT 醫病共享決策 ---------------- */
  function attView() {
    navNeeds = [];
    return frag([
      h('h1', { text: ATT.title }),
      h('p', { class: 'note', html:
        '醫病共享決策輔助工具｜請與您的醫療團隊共同討論｜證據與價格查核日：<strong>' + esc(ATT.checkedOn) + '</strong>' }),
      h('p', { text: ATT.framing }),

      h('div', { class: 'caution' }, [
        h('h3', { text: '這個工具適合誰' }),
        h('p', { text: ATT.suitability.intro }),
        h('ul', {}, ATT.suitability.items.map(function (t) { return h('li', { text: t }); })),
        h('p', { class: 'q__help', text: ATT.suitability.exclusion })
      ]),

      h('h2', { text: '第一個決定：要不要進一步確認類澱粉蛋白病理？' }),
      frag(ATT.biomarkerNotes.map(function (t) { return h('p', { class: 'note', text: t }); })),
      h('div', { class: 'tbl-scroll' }, [
        h('table', {}, [
          h('thead', {}, [ h('tr', {}, [ h('th', { text: '選項' }), h('th', { text: '怎麼做' }),
            h('th', { text: '可能好處' }), h('th', { text: '限制與費用' }) ]) ]),
          h('tbody', {}, ATT.biomarkerOptions.map(function (o) {
            return h('tr', {}, [ h('td', {}, [ h('b', { text: o.name }) ]), h('td', { text: o.how }),
              h('td', { text: o.pros }), h('td', { text: o.cons + (o.price !== '—' ? ' ' + o.price : '') }) ]);
          }))
        ])
      ]),

      h('h2', { text: '第二個決定：若確認陽性且符合安全條件，是否接受 ATT？' }),

      h('h3', { text: ATT.benefit.heading }),
      h('div', { class: 'tbl-scroll' }, [
        h('table', {}, [
          h('thead', {}, [ h('tr', {}, [ h('th', { text: '選項' }), h('th', { text: '證據期間' }),
            h('th', { text: '研究觀察到的平均結果' }), h('th', { text: '怎麼理解' }) ]) ]),
          h('tbody', {}, ATT.benefit.rows.map(function (r) {
            return h('tr', {}, [ h('td', {}, [ h('b', { text: r.option }) ]), h('td', { text: r.period }),
              h('td', { text: r.result }), h('td', { text: r.reading }) ]);
          }))
        ])
      ]),
      h('p', { class: 'note', html: '<strong>' + esc(ATT.benefit.warning) + '</strong>' }),

      h('h3', { text: ATT.risk.heading }),
      h('div', { class: 'tbl-scroll' }, [
        h('table', {}, [
          h('thead', {}, [ h('tr', {}, [ h('th', { text: '選項' }), h('th', { text: 'MRI 可能看到' }),
            h('th', { text: '有症狀／嚴重事件' }), h('th', { text: '其他' }) ]) ]),
          h('tbody', {}, ATT.risk.rows.map(function (r) {
            return h('tr', {}, [ h('td', {}, [ h('b', { text: r.option }) ]), h('td', { text: r.mri }),
              h('td', { text: r.symptomatic }), h('td', { text: r.other }) ]);
          }))
        ])
      ]),
      h('p', { class: 'note', text: ATT.risk.note }),

      h('div', { class: 'alert', role: 'alert' }, [
        h('h3', { text: ATT.emergency.heading }),
        h('p', { text: ATT.emergency.text }),
        h('p', { class: 'q__help', text: ATT.emergency.card })
      ]),

      h('details', {}, [
        h('summary', { text: '給藥方式、MRI 排程與療程' }),
        h('div', { class: 'tbl-scroll' }, [
          h('table', {}, [
            h('thead', {}, [ h('tr', {}, [ h('th', { text: '選項' }), h('th', { text: '施打方式' }),
              h('th', { text: 'MRI 排程' }), h('th', { text: '療程／停藥' }) ]) ]),
            h('tbody', {}, ATT.regimen.map(function (r) {
              return h('tr', {}, [ h('td', {}, [ h('b', { text: r.option }) ]), h('td', { text: r.dosing }),
                h('td', { text: r.mri }), h('td', { text: r.course }) ]);
            }))
          ])
        ])
      ]),

      h('details', {}, [
        h('summary', { text: ATT.cost.heading + '（自費，請務必看完）' }),
        h('div', { class: 'tbl-scroll' }, [
          h('table', {}, [
            h('thead', {}, [ h('tr', {}, [ h('th', { text: '類別' }), h('th', { text: '包含內容' }), h('th', { text: '公開參考價／提醒' }) ]) ]),
            h('tbody', {}, ATT.cost.rows.map(function (r) {
              return h('tr', {}, [ h('td', {}, [ h('b', { text: r.cat }) ]), h('td', { text: r.includes }), h('td', { text: r.price }) ]);
            }))
          ])
        ]),
        h('p', { class: 'note', text: ATT.cost.note })
      ]),

      h('details', {}, [
        h('summary', { text: '資格檢核表（由醫療團隊核對）' }),
        h('div', { class: 'tbl-scroll' }, [
          h('table', {}, [
            h('thead', {}, [ h('tr', {}, [ h('th', { text: '評估項目' }), h('th', { text: '判斷重點' }) ]) ]),
            h('tbody', {}, ATT.eligibility.map(function (e) {
              return h('tr', {}, [ h('td', {}, [ h('b', { text: e.item }) ]), h('td', { text: e.detail }) ]);
            }))
          ])
        ]),
        h('p', { class: 'q__help', text: ATT.eligibilityNote })
      ]),

      h('h2', { text: '您在意哪些事？' }),
      h('p', { text: '請就每一項標示重要程度（0 = 完全不重要，5 = 非常重要）。沒有標準答案，病人與家屬也可以分別填寫。' }),
      frag(ATT.valueItems.map(function (t, i) {
        var id = 'attVal' + i;
        return h('div', { class: 'scale' }, [
          h('div', { class: 'scale__q', text: t }),
          h('div', { class: 'scale__opts', role: 'radiogroup', 'aria-label': t },
            [0, 1, 2, 3, 4, 5].map(function (v) {
              return h('label', { class: 'scale__opt' }, [
                h('input', { type: 'radio', name: id, value: v, checked: ans()[id] === v,
                  onchange: function () { set(id, v); } }),
                h('b', { text: String(v) })
              ]);
            }))
        ]);
      })),

      h('h2', { text: '確認理解' }),
      h('p', { text: '先自己作答，再與醫療人員核對。任何一題不確定，就是值得在門診問清楚的地方。' }),
      frag(ATT.quiz.map(function (q, i) { return quizItem(q, i); })),

      h('h2', { text: '我目前的想法' }),
      decisionBlock('attA', ATT.decisionA),
      decisionBlock('attB', ATT.decisionB),

      h('details', {}, [
        h('summary', { text: '延伸資訊與參考文獻' }),
        h('ul', {}, ATT.links.map(function (l) {
          return h('li', {}, [ h('a', { href: l.url, target: '_blank', rel: 'noopener', text: l.label }) ]);
        })),
        h('ol', { class: 'refs' }, ATT.references.map(function (r) { return h('li', { text: r }); }))
      ]),

      h('p', { class: 'note', text: ATT.disclaimer }),

      actions([
        btn('列印或存成 PDF（帶去門診）', function () { window.print(); }),
        btn('回首頁', function () { go('home'); }, 'ghost')
      ])
    ]);
  }

  function quizItem(q, i) {
    var id = 'attQ' + i;
    var opts = [['true', '對'], ['false', '不對'], ['unsure', '不確定']];
    /* 就地更新回饋，不重繪整頁——這是一份很長的表單，
       每答一題就跳回頁首會讓人無法作答。 */
    var box = h('div', { class: 'quiz-fb', 'aria-live': 'polite' });

    function paint(chosen) {
      box.textContent = '';
      if (chosen === 'true' || chosen === 'false') {
        var correct = (chosen === 'true') === q.a;
        box.appendChild(h('p', { class: correct ? 'q__help' : 'note',
          html: correct ? '✓ 正確。'
            : '正解是「' + (q.a ? '對' : '不對') + '」。這一題值得在門診再確認一次。' }));
      } else if (chosen === 'unsure') {
        box.appendChild(h('p', { class: 'note',
          text: '正解是「' + (q.a ? '對' : '不對') + '」。請把這一題記下來問醫療團隊。' }));
      }
    }
    paint(ans()[id]);

    return h('div', { class: 'scale' }, [
      h('div', { class: 'scale__q', text: (i + 1) + '. ' + q.q }),
      h('div', { class: 'scale__opts', role: 'radiogroup', 'aria-label': q.q },
        opts.map(function (o) {
          return h('label', { class: 'scale__opt' }, [
            h('input', { type: 'radio', name: id, value: o[0], checked: ans()[id] === o[0],
              onchange: function () { set(id, o[0]); paint(o[0]); } }),
            h('span', { text: o[1] })
          ]);
        })),
      box
    ]);
  }

  function decisionBlock(prefix, d) {
    return h('div', { class: 'card' }, [
      h('h3', { text: d.heading, style: 'margin-top:0' }),
      h('div', { class: 'opts', role: 'radiogroup', 'aria-label': d.heading },
        d.options.map(function (o, i) {
          return h('label', { class: 'opt' }, [
            h('input', { type: 'radio', name: prefix, value: i, checked: ans()[prefix] === i,
              onchange: function () { set(prefix, i); } }),
            h('span', { text: o })
          ]);
        }))
    ]);
  }

  window.SCD_VIEWS = {
    'scd-intro': intro,
    'scd-who': who,
    'scd-p1': partI,
    'scd-p2': partII,
    'scd-extra': extra,
    'ad8': ad8,
    'scd-result': result,
    'clinical': clinical,
    'att': attView
  };
})();
