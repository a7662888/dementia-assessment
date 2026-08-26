/* 流程與畫面
 * 純前端，無框架、無 build step。所有作答只存在瀏覽器分頁（sessionStorage），
 * 不送出、不上傳；關閉分頁即清除。
 */
(function () {
  'use strict';

  var Q = window.QUESTIONS, SC = window.SCALES, P = window.PREVENTION,
      R = window.REFS, ATT = window.ATT, S = window.SCORING;

  var state = { step: 'home', answers: {}, path: null };

  /* ---------------- 持久化（僅分頁存活期間） ---------------- */
  function save() {
    try { sessionStorage.setItem('dcx', JSON.stringify(state)); } catch (e) { /* 隱私模式等情況忽略 */ }
  }
  /* 就地更新，不要重新指派 state：scd.js 透過 __APP_PARTIALS 持有同一個物件參照，
     一旦這裡換成新物件，那邊讀到的就會是還原前的空狀態。 */
  function restore() {
    try {
      var raw = sessionStorage.getItem('dcx');
      if (!raw) return;
      var s = JSON.parse(raw);
      if (!s || !s.step) return;
      state.step = s.step;
      state.path = s.path || null;
      state.answers = s.answers || {};
    } catch (e) { /* 隱私模式或資料毀損時，從頭開始 */ }
  }

  /* ---------------- DOM 小工具 ---------------- */
  function h(tag, attrs, children) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'class') e.className = attrs[k];
      else if (k === 'html') e.innerHTML = attrs[k];
      else if (k === 'text') e.textContent = attrs[k];
      else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] != null && attrs[k] !== false) e.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) {
      if (c == null || c === false) return;
      e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return e;
  }
  function frag(children) {
    var f = document.createDocumentFragment();
    (children || []).forEach(function (c) { if (c) f.appendChild(c); });
    return f;
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function go(step) {
    state.step = step; save(); render();
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
    var hd = document.querySelector('main h1, main h2');
    if (hd) { hd.setAttribute('tabindex', '-1'); hd.focus({ preventScroll: true }); }
  }
  function set(id, v) { state.answers[id] = v; save(); }

  /* ---------------- 共用片段 ---------------- */
  function redFlag() {
    return h('div', { class: 'alert', role: 'alert' }, [
      h('h3', { text: '先確認：現在是不是急症？' }),
      h('p', { html: '如果出現<strong>突然</strong>發生的意識混亂、單側手腳無力或麻木、口齒不清、看不清楚、劇烈頭痛、抽搐，或是<strong>幾天到幾週內快速惡化</strong>的記憶與行為改變——請立即就醫或撥打 119，不要先做線上評估。這些可能是中風或其他需要急診處理的狀況。' })
    ]);
  }

  function disclaimer() {
    return h('p', { class: 'note', html:
      '本網站提供的是<strong>衛教與決策輔助資訊，不是診斷</strong>。所有量表結果都需要由醫療專業人員結合病史、身體檢查與其他評估來判讀。' });
  }

  function progress(cur, total, label) {
    return h('div', { class: 'progress' }, [
      h('div', { class: 'progress__bar' }, [
        h('div', { class: 'progress__fill', style: 'width:' + Math.round(cur / total * 100) + '%' })
      ]),
      h('div', { class: 'progress__label', text: label + '（第 ' + cur + ' 部分，共 ' + total + ' 部分）' })
    ]);
  }

  function actions(list) {
    return h('div', { class: 'actions' }, list);
  }
  function btn(label, onclick, kind) {
    return h('button', { class: 'btn btn--' + (kind || 'primary'), type: 'button', onclick: onclick, text: label });
  }

  function refLine(key) {
    var r = R[key]; if (!r) return null;
    return h('p', { class: 'pcard__src', html: '<b>來源：</b>' + esc(r.cite) + (r.note ? '<br>' + esc(r.note) : '') });
  }

  /* ---------------- 題目渲染 ---------------- */
  function renderChoice(item) {
    return h('div', { class: 'q' }, [
      h('span', { class: 'q__label', text: item.label }),
      item.help ? h('span', { class: 'q__help', text: item.help }) : null,
      h('div', { class: 'opts', role: 'radiogroup', 'aria-label': item.label },
        item.options.map(function (o) {
          return h('label', { class: 'opt' }, [
            h('input', { type: 'radio', name: item.id, value: o.value,
              checked: state.answers[item.id] === o.value,
              onchange: function () { set(item.id, o.value); renderNavState(); } }),
            h('span', { text: o.label })
          ]);
        }))
    ]);
  }

  function renderNumber(item) {
    return h('div', { class: 'q' }, [
      h('label', { class: 'q__label', for: 'f_' + item.id, text: item.label }),
      item.help ? h('span', { class: 'q__help', text: item.help }) : null,
      h('div', { class: 'num' }, [
        h('input', { type: 'number', id: 'f_' + item.id, inputmode: 'numeric',
          min: item.min, max: item.max,
          value: state.answers[item.id] != null ? state.answers[item.id] : '',
          oninput: function (ev) {
            var v = ev.target.value === '' ? undefined : Number(ev.target.value);
            set(item.id, v); renderNavState();
          } }),
        item.unit ? h('span', { text: item.unit }) : null
      ])
    ]);
  }

  function renderScale(item, labels) {
    var n = labels.length;
    return h('div', { class: 'scale' }, [
      h('div', { class: 'scale__q', text: item.label }),
      h('div', { class: 'scale__opts', role: 'radiogroup', 'aria-label': item.label },
        labels.map(function (lab, i) {
          return h('label', { class: 'scale__opt' }, [
            h('input', { type: 'radio', name: item.id, value: i,
              checked: state.answers[item.id] === i,
              onchange: function () { set(item.id, i); renderNavState(); } }),
            h('b', { text: String(i) }),
            h('span', { text: lab })
          ]);
        }))
    ]);
  }

  function renderItems(items, labels) {
    return items.map(function (it) {
      if (it.type === 'choice') return renderChoice(it);
      if (it.type === 'number') return renderNumber(it);
      if (it.type === 'likert5') return renderScale(it, it.labels || labels);
      if (it.type === 'likert4') return renderScale(it, labels);
      return null;
    });
  }

  /* 判斷本頁是否作答完整 */
  function sectionComplete(sec) {
    var all = (sec.items || []).concat(sec.items2 || []);
    return all.every(function (it) {
      var v = state.answers[it.id];
      if (it.dependsOn && !state.answers[it.dependsOn]) return true;  // 天數為 0 時不必填分鐘
      return v !== undefined && v !== null && v !== '';
    });
  }

  function renderNavState() {
    var sec = riskSection();
    var next = document.getElementById('nextBtn');
    if (next && sec) next.disabled = !sectionComplete(sec);
  }

  /* ---------------- 風險路徑 ---------------- */
  function riskIndex() { return Number(state.step.split(':')[1] || 0); }
  function riskSection() {
    if (state.step.indexOf('risk:') !== 0) return null;
    return Q.sections[riskIndex()];
  }

  function viewRisk() {
    var i = riskIndex(), sec = Q.sections[i], total = Q.sections.length;
    var labels = sec.scaleLabels;
    return frag([
      progress(i + 1, total, '風險評估'),
      h('h1', { text: sec.title }),
      sec.intro ? h('p', { class: 'note', text: sec.intro }) : null,
      h('form', { onsubmit: function (e) { e.preventDefault(); } }, [
        frag(renderItems(sec.items || [], labels)),
        sec.items2 ? frag(renderItems(sec.items2, null)) : null
      ]),
      actions([
        h('button', { id: 'nextBtn', class: 'btn btn--primary', type: 'button',
          disabled: !sectionComplete(sec),
          text: i + 1 < total ? '下一部分' : '看我的結果',
          onclick: function () { go(i + 1 < total ? 'risk:' + (i + 1) : 'risk-result'); } }),
        btn(i === 0 ? '回首頁' : '上一部分',
          function () { go(i === 0 ? 'home' : 'risk:' + (i - 1)); }, 'ghost')
      ])
    ]);
  }

  /* ---------------- 風險結果 ---------------- */
  function viewRiskResult() {
    var res = S.score(state.answers);
    var a = state.answers;

    var applied = res.rows.filter(function (r) { return r.applied; });
    var notApplied = res.rows.filter(function (r) { return !r.applied; });

    /* 分數尺規 */
    var span = res.range.max - res.range.min || 1;
    var pos = Math.max(0, Math.min(1, (res.total - res.range.min) / span));
    var bandL = Math.max(0, Math.min(1, (res.assumptionBand.low - res.range.min) / span));
    var bandH = Math.max(0, Math.min(1, (res.assumptionBand.high - res.range.min) / span));

    var gauge = h('div', { class: 'gauge' }, [
      h('div', { class: 'gauge__track' }, [
        h('div', { class: 'gauge__band', style: 'left:' + (bandL * 100).toFixed(1) + '%;width:' +
          Math.max(1, (bandH - bandL) * 100).toFixed(1) + '%' }),
        h('div', { class: 'gauge__mark', style: 'left:calc(' + (pos * 100).toFixed(1) + '% - 2px)' })
      ]),
      h('div', { class: 'gauge__ends' }, [
        h('span', { text: '最低 ' + fmt(res.range.min) }),
        h('span', { text: '最高 ' + fmt(res.range.max) })
      ])
    ]);

    var tableRows = applied.map(function (r) {
      return h('tr', {}, [
        h('td', {}, [
          h('span', { text: r.label }), ' ',
          typeof r.isAssumption === 'string' ? h('span', { class: 'tag tag--assume', text: '操作化假設' }) : null,
          r.isProtective ? h('span', { class: 'tag tag--good', text: '保護因子' }) : null,
          h('div', { class: 'q__help', text: r.answer })
        ]),
        h('td', { class: 'num-cell', text: (r.points > 0 ? '+' : '') + fmt(r.points) })
      ]);
    });

    var offRows = notApplied.map(function (r) {
      return h('tr', { class: 'is-muted' }, [
        h('td', {}, [
          h('span', { text: r.label }), ' ',
          h('span', { class: 'tag tag--off', text: '此年齡不計分' }),
          h('div', { class: 'q__help', text: r.answer + '｜' + r.reason })
        ]),
        h('td', { class: 'num-cell', text: '—' })
      ]);
    });

    return frag([
      h('h1', { text: '您的風險因子點數' }),

      h('div', { class: 'score' }, [
        h('div', {}, [
          h('span', { class: 'score__num', text: fmt(res.total) }),
          h('span', { class: 'score__unit', text: '點' })
        ]),
        h('div', { class: 'score__caption', text:
          '以您的年齡與性別而言，可能的範圍是 ' + fmt(res.range.min) + ' 到 ' + fmt(res.range.max) + ' 點。' }),
        gauge,
        h('div', { class: 'score__caption', text:
          '淺色區段（' + fmt(res.assumptionBand.low) + ' 到 ' + fmt(res.assumptionBand.high) +
          '）是三項操作化假設可能造成的擺盪範圍，說明見下方。' })
      ]),

      h('div', { class: 'caution' }, [
        h('h3', { text: '這個數字不是什麼' }),
        h('p', { html: '<strong>它不是您得到失智症的機率。</strong>原始論文只發表了各風險因子的點數，沒有發表「幾點等於百分之幾風險」的對照表，因此任何把這個分數換算成百分比的做法都是編造的。' }),
        h('p', { html: '<strong>它也不是官方的 CogDrisk 分數。</strong>官方演算法的條件式方程式與加總常數放在論文的補充資料 Part B，本站未取得。本站是依論文正文 Table 1 的已發表點數逐格實作。' }),
        h('p', { html: '它能做的是：讓您看見<strong>自己身上有哪些風險因子、各自的權重多大、哪些還能改變</strong>。真正有用的是下一頁的內容。' })
      ]),

      h('h2', { text: '逐項明細' }),
      h('div', { class: 'tbl-scroll' }, [
        h('table', {}, [
          h('thead', {}, [ h('tr', {}, [ h('th', { text: '風險因子與您的作答' }), h('th', { class: 'num-cell', text: '點數' }) ]) ]),
          h('tbody', {}, tableRows.concat(offRows)),
          h('tfoot', {}, [ h('tr', {}, [ h('th', { text: '合計' }), h('td', { class: 'num-cell', text: fmt(res.total) }) ]) ])
        ])
      ]),

      assumptionsBlock(res),
      subscaleBlock(res),

      h('div', { class: 'card card--flat' }, [
        h('h3', { text: '年齡如何影響這份評估' }),
        h('p', { text: '您今年 ' + a.age + ' 歲。' + ageExplain(a.age) }),
        h('p', { class: 'q__help', html:
          '順帶一提：您可能看過用 CAIDE 分數估算「二十年失智風險百分比」的工具。CAIDE 是以中年（39–64 歲）族群開發的；' +
          'Huque 2023 在三個高齡世代的比較顯示，CogDrisk 的 AUC 為 0.65–0.75，而 CAIDE 最低到 0.50（等同亂猜）。' +
          '本站因此不對高齡使用者輸出 CAIDE 百分比。' })
      ]),
      refLine('anstey2022'),
      refLine('huque2023'),

      actions([
        btn('看我的個人化預防建議', function () { go('prevention'); }),
        btn('修改答案', function () { go('risk:0'); }, 'ghost'),
        btn('回首頁', function () { go('home'); }, 'ghost')
      ])
    ]);
  }

  function ageExplain(age) {
    var parts = [];
    if (age < 60) parts.push('原始權重表的年齡點數自 60 歲起算，所以您這一項是 0 分——這不代表年輕就沒有風險，而是這個工具把年齡當成基準線。');
    else parts.push('年齡本身就佔了相當比重的點數，而年齡是不能改變的，所以請把注意力放在可改變的項目上。');
    if (age <= 65) parts.push('體重（BMI）這一項只在 65 歲以下計分，因為原始證據顯示肥胖主要在中年構成風險。');
    else parts.push('體重（BMI）在 65 歲以上不計分；長者刻意減重反而可能有害。');
    if (age < 60) parts.push('高膽固醇這一項只在 60 歲以下計分，中年才是介入的關鍵期。');
    else parts.push('高膽固醇這一項在 60 歲以上不計分，但這不表示血脂不用管。');
    return parts.join('');
  }

  function assumptionsBlock(res) {
    if (!res.assumptionRows.length) return null;
    return h('details', {}, [
      h('summary', { text: '三項操作化假設（點開看我在哪裡做了判斷）' }),
      h('p', { class: 'q__help', text:
        '原始論文用來定義這三個因子的方式，與本站實際能問到的資料不完全一致。以下如實列出差異，以及各自可能造成的分數擺盪。' }),
      frag(res.assumptionRows.map(function (r) {
        var a = window.COGDRISK.assumptions[r.isAssumption];
        return h('div', { class: 'pcard' }, [
          h('h4', { text: r.label, style: 'margin-top:0' }),
          h('p', { html: '<b>論文的定義：</b>' + esc(a.published) }),
          h('p', { html: '<b>本站的做法：</b>' + esc(a.used) }),
          h('p', { class: 'q__help', text: a.why }),
          h('p', { class: 'q__help', text: '您這一項目前得 ' + fmt(r.points) + ' 點。' })
        ]);
      }))
    ]);
  }

  function subscaleBlock(res) {
    var s = res.subscales, items = [];
    if (s.bmi) items.push(['BMI', s.bmi.bmi.toFixed(1)]);
    if (s.isi) items.push(['失眠嚴重度 ISI', s.isi.total + ' / 28（' + s.isi.band + '）']);
    if (s.cesd) items.push(['憂鬱症狀 CES-D-10', s.cesd.total + ' / 30' + (s.cesd.positive ? '（達 ≥10 之閾值）' : '（未達閾值）')]);
    if (s.cognitive) items.push(['動腦活動', s.cognitive.total + ' / 24']);
    items.push(['每週中高強度活動', s.mvpa + ' 分鐘' + (s.mvpa >= 150 ? '（已達建議量）' : '（未達 150 分鐘）')]);
    return h('details', {}, [
      h('summary', { text: '子量表原始分數' }),
      h('table', {}, [ h('tbody', {}, items.map(function (r) {
        return h('tr', {}, [ h('td', { text: r[0] }), h('td', { class: 'num-cell', text: r[1] }) ]);
      })) ])
    ]);
  }

  function fmt(n) {
    return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, '');
  }

  /* ---------------- 個人化預防 ---------------- */
  function relevantCards() {
    var a = state.answers, res = S.score(a), out = [];
    function want(key, cond) { if (cond) out.push(key); }

    var by = {};
    res.rows.forEach(function (r) { by[r.key] = r; });

    want('hearing', a.hearing && a.hearing !== 'fine' || a.hearingAid === 'notWearing');
    want('cholesterol', a.cholesterol === 'yes');
    /* 動腦活動只要不是最高組就給建議：中間組仍有往上的空間，
       不必等到落在最低組才提醒。 */
    want('education', res.subscales.cognitive && res.subscales.cognitive.tier !== 'highest');
    want('socialIsolation', a.lonely === 'yes' || a.socialContact === 'rarely');
    want('depression', by.depression && by.depression.modifiable);
    want('tbi', a.tbi === 'lost' || a.tbi === 'dazed');
    want('airPollution', a.airPollution === 'some' || a.airPollution === 'high');
    want('physicalActivity', by.physicalActivity && by.physicalActivity.modifiable);
    want('smoking', a.smoking === 'current');
    want('diabetes', a.diabetes === 'yes');
    want('hypertension', a.hypertension === 'yes');
    want('vision', a.vision && a.vision !== 'fine');
    want('obesity', by.bmi && by.bmi.modifiable);
    want('alcohol', a.alcohol === 'regular' || a.alcohol === 'heavy');
    want('sleep', by.insomnia && by.insomnia.modifiable);
    want('diet', by.fish && by.fish.modifiable);

    /* 依 Lancet 加權 PAF 排序 */
    out.sort(function (x, y) {
      var px = (P.cards[x].lancet && P.cards[x].lancet.paf) || 0;
      var py = (P.cards[y].lancet && P.cards[y].lancet.paf) || 0;
      return py - px;
    });
    if (out.length > 1) out.push('multidomain');
    return out;
  }

  function pcard(key) {
    var c = P.cards[key];
    var tags = [];
    if (c.who && c.who.isStrong) tags.push(h('span', { class: 'tag tag--strong', text: 'WHO 強建議' }));
    if (c.who && c.who.isBestEvidence) tags.push(h('span', { class: 'tag tag--strong', text: 'WHO 證據確信度最高' }));
    if (c.who && c.who.isInsufficient) tags.push(h('span', { class: 'tag tag--thin', text: 'WHO：證據不足' }));

    return h('div', { class: 'pcard' }, [
      h('div', { class: 'pcard__head' }, [
        h('h3', { class: 'pcard__title', text: c.title })
      ].concat(tags).concat([
        c.lancet ? h('span', { class: 'pcard__paf',
          text: 'Lancet 2024 加權 PAF ' + c.lancet.paf + '%｜RR ' + c.lancet.rr + '｜' + c.stage }) : null
      ])),
      h('ul', {}, c.actions.map(function (t) { return h('li', { text: t }); })),
      c.note ? h('p', { class: 'note', text: c.note }) : null,
      h('div', { class: 'pcard__src' }, [
        c.who ? h('div', { html: '<b>WHO 2026：</b>' + esc(c.who.rec) +
          '（' + esc(c.who.strength) + (c.who.certainty !== '—' ? '，證據確信度 ' + esc(c.who.certainty) : '') + '）' }) : null,
        c.le8 ? h('div', { html: '<b>Life’s Essential 8：</b>' + esc(c.le8) }) : null,
        c.lancet && c.lancet.note ? h('div', { html: '<b>備註：</b>' + esc(c.lancet.note) }) : null
      ])
    ]);
  }

  function viewPrevention() {
    var keys = relevantCards();
    var others = P.order.filter(function (k) { return keys.indexOf(k) < 0; });
    return frag([
      h('h1', { text: '您的個人化預防重點' }),
      h('p', { text: '以下只列出「您目前具備、而且還能改變」的因子，並依 Lancet 2024 的族群加權 PAF 由大到小排序——也就是把影響最大的放前面。' }),
      h('p', { class: 'note', html: P.overallPaf.text }),

      keys.length
        ? frag(keys.map(pcard))
        : h('div', { class: 'card' }, [
            h('h3', { text: '目前沒有偵測到可改變的風險因子' }),
            h('p', { text: '依您的作答，本站沒有找到需要優先處理的可改變因子。這是好消息，但仍建議維持現有的運動、社交與動腦習慣，並定期健康檢查。' })
          ]),

      h('h2', { text: '其他因子（您目前沒有，或不適用）' }),
      h('p', { class: 'q__help', text: '列在這裡供參考，也讓您知道本站評估了哪些項目。' }),
      frag(others.map(function (k) {
        var c = P.cards[k];
        return h('details', {}, [
          h('summary', { text: c.title + (c.lancet ? '（加權 PAF ' + c.lancet.paf + '%）' : '') }),
          h('ul', {}, c.actions.map(function (t) { return h('li', { text: t }); }))
        ]);
      })),

      h('h2', { text: '要記得的三件事' }),
      h('div', { class: 'card' }, [
        h('p', { html: '一、<strong>證據強度不一樣。</strong>WHO 2026 指引裡真正的「強建議」只有身體活動、戒菸，以及「不要吃維生素 B／E／Omega-3／綜合維他命來預防失智」這三項。其他多數是條件式建議，證據確信度從很低到中等。' }),
        h('p', { html: '二、<strong>多項一起改比單項有效。</strong>WHO 2026 中證據確信度最高的一項（中等至高）是「量身訂做的多面向介入」。' }),
        h('p', { html: '三、<strong>45% 是族群數字，不是您的個人保證。</strong>它的意思是「如果全人口都沒有這些因子」，而不是「您改掉就少 45% 機率」。' })
      ]),

      actions([
        btn('列印或存成 PDF', function () { window.print(); }),
        btn('回結果頁', function () { go('risk-result'); }, 'ghost'),
        btn('回首頁', function () { go('home'); }, 'ghost')
      ])
    ]);
  }

  window.__APP_PARTIALS = { h: h, frag: frag, esc: esc, btn: btn, actions: actions, go: go, set: set,
    state: state, progress: progress, redFlag: redFlag, disclaimer: disclaimer, refLine: refLine,
    renderChoice: renderChoice, renderNumber: renderNumber, renderScale: renderScale, fmt: fmt };

  /* ---------------- 首頁 ---------------- */
  function viewHome() {
    return frag([
      h('h1', { text: '記憶與腦健康：先看懂現在的位置，再決定下一步' }),
      h('p', { text: '這個工具幫您依目前的狀況，找到適合的評估路徑：風險預測與預防、主觀認知減退的釐清，或是已經在考慮生物標記檢查與新藥治療時的決策準備。' }),

      redFlag(),

      h('h2', { text: '請選擇比較接近您的情況' }),
      h('div', { class: 'paths' }, [
        h('button', { class: 'path', type: 'button', onclick: function () { state.path = 'risk'; go('risk:0'); } }, [
          h('span', { class: 'path__kicker', text: '路徑一' }),
          h('span', { class: 'path__title', text: '目前沒有明顯的認知困擾' }),
          h('span', { class: 'path__desc', text: '包含認知正常，或近期做過篩檢結果正常者。可以了解自己有哪些風險因子、各自權重多大，並取得依證據排序的預防重點。約 10 分鐘。' }),
          h('span', { class: 'path__go', text: '開始風險評估與預防建議 →' })
        ]),
        h('button', { class: 'path', type: 'button', onclick: function () { state.path = 'scd'; go('scd-intro'); } }, [
          h('span', { class: 'path__kicker', text: '路徑二' }),
          h('span', { class: 'path__title', text: '自己覺得記憶或思考變差了' }),
          h('span', { class: 'path__desc', text: '由本人填寫台灣主觀認知功能退化量表（SCDS），家屬另填 AD-8，再依 SCD-plus 特徵整理出可以帶去門診討論的摘要。約 15 分鐘。' }),
          h('span', { class: 'path__go', text: '開始主觀認知減退評估 →' })
        ])
      ]),

      h('h2', { text: '已經在考慮檢查或治療？' }),
      h('div', { class: 'paths' }, [
        h('button', { class: 'path', type: 'button', onclick: function () { go('clinical'); } }, [
          h('span', { class: 'path__kicker', text: '延伸' }),
          h('span', { class: 'path__title', text: '臨床診斷會做些什麼' }),
          h('span', { class: 'path__desc', text: '門診會問什麼、做哪些認知測驗與檢查，以及您可以先準備什麼。' }),
          h('span', { class: 'path__go', text: '了解診斷流程 →' })
        ]),
        h('button', { class: 'path', type: 'button', onclick: function () { go('att'); } }, [
          h('span', { class: 'path__kicker', text: '延伸' }),
          h('span', { class: 'path__title', text: '生物標記與新藥治療的決策' }),
          h('span', { class: 'path__desc', text: '已確認或懷疑早期阿茲海默症時，要不要做 amyloid PET／CSF、要不要接受抗類澱粉蛋白單株抗體治療（ATT）。醫病共享決策輔助工具。' }),
          h('span', { class: 'path__go', text: '進入 SDM 決策工具 →' })
        ])
      ]),

      disclaimer(),

      h('details', {}, [
        h('summary', { text: '這個網站的證據來源與方法' }),
        h('div', { id: 'methods' })
      ])
    ]);
  }

  /* ---------------- 路由 ---------------- */
  function render() {
    var main = document.getElementById('view');
    main.textContent = '';
    var v;
    if (state.step === 'home') v = viewHome();
    else if (state.step.indexOf('risk:') === 0) v = viewRisk();
    else if (state.step === 'risk-result') v = viewRiskResult();
    else if (state.step === 'prevention') v = viewPrevention();
    else if (window.SCD_VIEWS && window.SCD_VIEWS[state.step]) v = window.SCD_VIEWS[state.step]();
    else { state.step = 'home'; v = viewHome(); }
    main.appendChild(v);
    if (state.step === 'home') renderMethods();
  }

  function renderMethods() {
    var box = document.getElementById('methods');
    if (!box) return;
    box.appendChild(frag([
      h('p', { text: '本站每一個數字與建議都對應到下列來源之一。介面上凡是本站做了判斷或假設的地方，都會標示出來。' }),
      h('ul', { class: 'refs' }, Object.keys(R).map(function (k) {
        var r = R[k];
        return h('li', {}, [
          h('b', { text: r.label }), h('br'),
          h('cite', { text: r.cite }),
          r.doi ? h('div', {}, [ 'DOI: ', h('a', { href: 'https://doi.org/' + r.doi, target: '_blank', rel: 'noopener', text: r.doi }) ]) : null,
          r.note ? h('div', { class: 'q__help', text: r.note }) : null
        ]);
      })),
      h('h4', { text: '已知的限制' }),
      h('ul', {}, [
        h('li', { text: 'CogDrisk 的官方條件式方程式與加總常數位於論文補充資料 Part B，本站未取得，因此輸出的是依 Table 1 已發表點數計算的「風險因子點數」，不是官方 CogDrisk 分數，也不換算成風險百分比。' }),
        h('li', { text: '本站依論文所述的分數上下限反推條件式規則：中年肥胖與高膽固醇為真正的年齡排除條件；高血壓與心房顫動名稱後的年齡標註屬效應量來源族群註記，全年齡計分。以此規則計算，兩個年齡層的分數上限（45 與 28）與原文完全吻合。原文所述晚年下限 −4.25 本站無法重現。' }),
        h('li', { text: 'CogDrisk Short Form 問卷為 UNSW 版權，使用與改作須取得授權。本站題目為自行撰寫的繁體中文版本，僅沿用因子結構，未逐字重製原問卷。若要正式對外提供，建議先向 UNSW 取得授權。' }),
        h('li', { text: 'SCDS 沒有經驗證的切分點，且無法區分主觀認知減退與輕度認知障礙，本站因此只呈現分數與組別平均的相對位置。' }),
        h('li', { text: 'SCDS 的三因子與最終 14 題的對應，是依原文 Table 3 的題數（6／4／4）與因子內容描述推定，原文未直接列出對照。' }),
        h('li', { text: 'ATT 模組的價格與仿單資訊查核日為 2026-08-26，會隨時間變動。' })
      ])
    ]));
  }

  /* ---------------- 啟動 ----------------
   * 不在這裡直接呼叫 render()：scd.js 要等到本檔執行完才會註冊 window.SCD_VIEWS，
   * 若在此就繪製，重新整理後停在主觀認知減退路徑的使用者會被踢回首頁。
   * 由 index.html 最末的 boot 呼叫。 */
  restore();
  window.__APP_BOOT = render;
})();
