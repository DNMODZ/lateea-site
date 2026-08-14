/* LateEA v0508Deep — 3D scene + micro interactions
   Anti-spec: ไม่มี particle explosion/neon — ใช้ "ฝุ่นทอง" จางๆ ลอยช้าๆ
*/
(function () {
  'use strict';

  /* ---------- 3D scene ---------- */
  var scene, camera, renderer, dustGroup;

  function init3D() {
    var el = document.getElementById('scene');
    if (!el || !window.THREE) return;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 200);
    camera.position.set(0, 3.4, 12);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    el.appendChild(renderer.domElement);

    // ---- แสง: อบอุ่น เหมือนโคมไฟ ----
    scene.add(new THREE.AmbientLight(0xffe8b0, 0.55));

    // ---- ฝุ่นทอง (อนุภาคน้อยๆ ไม่ overload) ----
    dustGroup = new THREE.Group();
    var dustCount = 260;
    var dustGeo = new THREE.BufferGeometry();
    var positions = new Float32Array(dustCount * 3);
    for (var d = 0; d < dustCount; d++) {
      positions[d * 3]     = (Math.random() - 0.5) * 34;
      positions[d * 3 + 1] = Math.random() * 12;
      positions[d * 3 + 2] = (Math.random() - 0.5) * 18 - 2;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    var dustMat = new THREE.PointsMaterial({
      color: 0xd8b26a,
      size: 0.035,
      transparent: true,
      opacity: 0.5,
      depthWrite: false
    });
    dustGroup.add(new THREE.Points(dustGeo, dustMat));
    scene.add(dustGroup);

    window.addEventListener('resize', onResize);
    animate();
  }

  function animate() {
    requestAnimationFrame(animate);
    var t = performance.now() * 0.001;

    // ฝุ่นทองไหลขึ้นช้าๆ + วนรอบ
    dustGroup.position.y = (t * 0.08) % 1;
    dustGroup.rotation.y = t * 0.02;

    renderer.render(scene, camera);
  }

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  /* ---------- ปุ่มคัดลอก (copy) ---------- */
  function initCopy() {
    var btns = document.querySelectorAll('.copy-btn');
    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var text = btn.getAttribute('data-copy');
        if (!text) return;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(function () { done(); }, function () { fallback(); });
        } else { fallback(); }
        function done() {
          btn.textContent = '✅ คัดลอกแล้ว';
          btn.classList.add('done');
          setTimeout(function () { btn.textContent = 'คัดลอก'; btn.classList.remove('done'); }, 1800);
        }
        function fallback() {
          var ta = document.createElement('textarea');
          ta.value = text;
          ta.style.position = 'fixed';
          ta.style.opacity = '0';
          document.body.appendChild(ta);
          ta.select();
          try { document.execCommand('copy'); } catch (e) {}
          document.body.removeChild(ta);
          done();
        }
      });
    });
  }

  /* ---------- reveal on scroll ---------- */
  function initReveal() {
    var targets = document.querySelectorAll('.sec, .hero, footer');
    targets.forEach(function (el) {
      el.classList.add('reveal');
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12 });
    targets.forEach(function (el) { io.observe(el); });
  }

  /* ---------- ticker วนซ้ำ 2 ชุดเนื้อหา (เพื่อลูปต่อเนื่อง) ---------- */
  function initTicker() {
    var track = document.getElementById('tickerTrack');
    if (!track) return;
    track.innerHTML += track.innerHTML;
  }

  /* ---------- topbar: ใช้ตัวแปรธีมเสมอ ---------- */
  function initTopbar() {
    var bar = document.getElementById('topbar');
    if (!bar) return;
    var onScroll = function () {
      // CSS var --header-bg จัดการเองตามธีม — ตรงนี้แค่ปรับ opacity
      bar.style.background = window.scrollY > 40
        ? 'var(--header-bg)'
        : 'var(--header-bg)';
    };
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- โหมดกลางวัน/กลางคืน ----------
     ค่าเริ่มต้น: กลางวัน (โหมดสว่าง)
     กลางคืน = body.theme-night
     จำการเลือกไว้ใน localStorage ('lateea-theme') */
  function initTheme() {
    var body = document.body;
    var toggle = document.getElementById('themeToggle');
    var switchBox = document.getElementById('themeSwitch');

    var saved = null;
    try { saved = localStorage.getItem('lateea-theme'); } catch (e) {}
    var night = saved === 'night';          // กลางวัน = ค่าเริ่มต้น

    function apply(nightMode) {
      body.classList.toggle('theme-night', nightMode);
      if (toggle) toggle.textContent = nightMode ? '🌙' : '☀️';
      if (switchBox) switchBox.checked = !nightMode;   // checked = กลางวัน
      try { localStorage.setItem('lateea-theme', nightMode ? 'night' : 'day'); } catch (e) {}
    }

    apply(night);

    if (toggle) {
      toggle.addEventListener('click', function () {
        apply(!body.classList.contains('theme-night'));
      });
    }
    if (switchBox) {
      switchBox.addEventListener('change', function () {
        apply(!switchBox.checked);   // uncheck = กลางคืน
      });
    }
  }

  /* ---------- ปุ่มสลับความเสี่ยงใน section กำไร (low / normal) ---------- */
  function initRiskToggle() {
    var wrap = document.querySelector('.risk-toggle');
    if (!wrap) return;
    var btns = wrap.querySelectorAll('.risk-btn');
    var ledes = document.querySelectorAll('.sec-lede[data-risk]');
    var explains = document.querySelectorAll('.profit-explain[data-risk]');

    var saved = null;
    try { saved = localStorage.getItem('lateea-risk'); } catch (e) {}
    var risk = saved === 'normal' ? 'normal' : 'low';

    function apply(which) {
      btns.forEach(function (b) { b.classList.toggle('is-active', b.getAttribute('data-risk') === which); });
      ledes.forEach(function (el) { el.hidden = el.getAttribute('data-risk') !== which; });
      explains.forEach(function (el) { el.hidden = el.getAttribute('data-risk') !== which; });
      try { localStorage.setItem('lateea-risk', which); } catch (e) {}
    }

    apply(risk);
    btns.forEach(function (b) {
      b.addEventListener('click', function () { apply(b.getAttribute('data-risk')); });
    });
  }

  /* ============================================================
     Telegram เดโม่ — จำลองบอท LateEA ตัวจริง (กดปุ่มได้จริง)
     Menu state machine จาก Build*Menu() ในโค้ด EA
     ============================================================ */
  // หน้าเวอร์ชันใหม่ (v16-luna-1408.html) มี data-version="1408" → แสดงฟีเจอร์ใหม่เพิ่ม
  var tgIsLuna1408 = document.body && document.body.getAttribute('data-version') === '1408';
  var tgNewsImpactHigh = false;   // false = High+Medium (ค่าเริ่มต้นของโค้ด v16deep-1408)

  var tgState = 'menu';
  var tgStateParams = null;
  var tgStateCount = 0;
  var tgEAOn = true;
  var tgCurLotMode = 2;   // LOTMODE_STEP_001_EVERY_2 (ค่าเริ่มต้นของโค้ด)
  var tgStartLot = 0.01;
  var tgMaxLot = 0.40;
  var tgMultiplier = 1.5;
  var tgDistance = 280;
  var tgBasket = 400;
  var tgDelay = 5;
  var tgSpreadMax = 80;
  var tgNewsFilter = true;
  var tgDynamicGrid = false;
  var tgTrailing = false;
  var tgSpreadFilter = true;
  var tgHoursEnabled = false;
  var tgHoursStart = 0;
  var tgHoursEnd = 0;

  var TG_LOT_NAMES = {
    0: 'คูณ 1.50', 1: 'บวกทีละ 0.01', 2: 'บวก 0.01 ทุก 2 ไม้',
    3: 'ขั้นบันได Dynamic', 4: 'Lot คงที่'
  };

  function tgNormalizeLot(l) { return Math.min(Math.round(l * 100) / 100, tgMaxLot); }

  // จำลอง ComputeNextMainLot() จากโค้ดจริง — level 0 = ไม้แรก
  function tgNextLot(level) {
    if (level === 0) return tgNormalizeLot(tgStartLot);
    var lot = tgStartLot;
    if (tgCurLotMode === 0) {           // MULTI: คูณ
      lot = tgStartLot * Math.pow(tgMultiplier, level);
    } else if (tgCurLotMode === 4) {    // FIXED
      lot = tgStartLot;
    } else {
      for (var lv = 1; lv <= level; lv++) {
        if (tgCurLotMode === 1 && lv >= 1) { lot += 0.01; }                     // STEP 0.01 ทุกไม้
        else if (tgCurLotMode === 2 && (lv % 2) === 0) { lot += 0.01; }          // ทุก 2 ไม้
        else if (tgCurLotMode === 3 && (lv % 2) === 0) {                        // ขั้นบันได
          var step = 0.01;
          if (lot >= 0.30) step = 0.06; else if (lot >= 0.20) step = 0.05;
          else if (lot >= 0.14) step = 0.04; else if (lot >= 0.10) step = 0.02;
          lot += step;
        }
      }
    }
    return tgNormalizeLot(lot);
  }

  var TG_MENUS = {
    menu: {
      title: 'เมนูหลัก — เลือกคำสั่งด้านล่างได้เลยครับ 👇',
      rows: [
        ['⚡ เปิด / ปิด EA', '/ea', 'toggle', '/menu'],
        ['🟢 ซื้อ (Buy)', '/buy', 'เปิดคำสั่ง BUY XAUUSD 0.01 ล็อต ที่ราคาตลาดแล้ว ✅', '/menu'],
        ['🔴 ขาย (Sell)', '/sell', 'เปิดคำสั่ง SELL XAUUSD 0.01 ล็อต ที่ราคาตลาดแล้ว ✅', '/menu'],
        ['♻️ ปิดชดเชย', '/pairclose_offset', 'ปิดคู่ชดเชยอัตโนมัติ (Pair Close Offset) แล้ว', '/menu'],
        ['❌ ปิดทั้งหมด', '/closeall', 'ปิดตำแหน่งทั้งหมดในพอร์ตแล้ว ✅', '/menu'],
        ['📊 สถานะ', '/status', 'status', '/menu'],
        ['💳 บัญชี', '/account', 'account', '/menu'],
        ['🧮 ตาราง Lot', '/calclot', 'calclot', '/menu'],
        ['⚙️ ตั้งค่า', '/settings', '⚙️ การตั้งค่า — เลือกหมวดที่ต้องการครับ', 'settings'],
        ['❓ ช่วยเหลือ', '/help', '📖 วิธีใช้ LateEA\n• /menu — เปิดเมนูหลัก\n• กดปุ่มเพื่อสั่งงาน ระบบยืนยันทุกครั้ง\n• คำสั่งบางอย่างต้องใช้ PIN (ล็อค/ปลดล็อค)\n• ติดต่อผู้พัฒนา: guns.lol/lostsky777', '/menu'],
        ['📋 รายการบัญชีที่อนุญาต', '/account_list', '📋 บัญชีที่อนุญาตให้ใช้\n#86005930 ✅\n#26755980 ✅\n#86006596 ✅\n#21041781 ✅', '/menu']
      ]
    },
    settings: {
      title: '⚙️ การตั้งค่า — เลือกหมวดที่ต้องการครับ',
      rows: [
        ['🤖 โหมด: SEMI', '/auto on', '✅ โหมด AUTO เปิดแล้ว — ระบบบริหารพอร์ตเอง', 'settings'],
        ['📊 เทรดทั่วไป', '/menu_basic_cat', '📊 เทรดทั่วไป — ตั้งค่าหลัก', 'basic'],
        ['♻️ ปิดชดเชย', '/menu_pairclose_cat', '♻️ ปิดชดเชย — ตั้งค่าการปิดคู่', 'pairclose'],
        ['🛡 Hedge', '/menu_hedge_cat', '🛡 Hedge — ระบบเฮดจ์แบบขั้นบันได', 'hedge'],
        ['🚑 รักษาพอร์ต', '/menu_recovery_cat', '🚑 รักษาพอร์ต — ตัดขาดทุน/กู้คืน', 'recovery'],
        ['🛡 กรองกระชาก', '/menu_filter', '🛡 กรองกระชาก (Filter)', 'filter'],
        ['🚀 Trailing: ปิด', '/trailmode', 'toggle_trail', 'settings'],
        ['📏 สเปรด: เปิด / 80 pts', '/menu_spread', '📏 ตั้งค่าสเปรดสูงสุดที่ยอมรับได้', 'spread'],
        ['⏰ เวลาซื้อขาย', '/menu_hours', '⏰ เวลาซื้อขาย (เวลาไทย)', 'hours'],
        ['🔓 ล็อคระบบ', '/lock', '🔒 ระบบถูกล็อคแล้ว — ต้องใช้ PIN ปลดล็อค', '/menu'],
        ['🔙 กลับเมนูหลัก', '/menu', '', 'menu']
      ]
    },
    basic: {
      title: '📊 เทรดทั่วไป — ตั้งค่าหลัก',
      rows: [
        ['📐 โหมดการออกไม้: คูณ 1.50', '/menu_lotmode', '📐 เลือกรูปแบบการคูณไม้แก้', 'lotmode'],
        ['🔢 Lot เริ่มต้น: 0.01', '/menu_startlot', '🔢 เลือกล็อตเริ่มต้น', 'startlot'],
        ['↔️ ระยะห่าง (Distance): 280', '/menu_distance', '↔️ เลือกระยะห่างการเปิดไม้แก้ (จุด)', 'distance'],
        ['🎯 เป้ากำไร (Basket): 400', '/menu_basket', '🎯 เลือกเป้ากำไรรวม (Basket Points)', 'basket'],
        ['⏳ หน่วงเวลา (Delay): 5s', '/menu_delay', '⏳ เลือกระยะหน่วงก่อนเปิดไม้ถัดไป', 'delay'],
        ['📊 Dynamic Grid: ปิด', '/dynamicgrid', 'toggle_dg', 'basic'],
        ['ข่าวกรอง: เปิด', '/newsfilter', 'toggle_news', 'basic'],
        ['🔝 เพดาน Max Lot: 0.40', '/menu_maxlot', '🔝 ตั้งเพดานล็อตสูงสุด', 'maxlot'],
        ['🔙 กลับหน้าตั้งค่า', '/settings', '', 'settings']
      ]
    },
    lotmode: {
      title: '📐 เลือกรูปแบบการคูณไม้แก้:\n(วิธีเพิ่ม Lot เมื่อเปิดไม้ใหม่ต่อเนื่อง)',
      rows: [
        ['คูณ 1.50', '/mode 1', 'set_lotmode_0', 'lotmode'],
        ['บวกทีละ 0.01', '/mode 2', 'set_lotmode_1', 'lotmode'],
        ['บวก 0.01 ทุก 2 ไม้', '/mode 3', 'set_lotmode_2', 'lotmode'],
        ['ขั้นบันได Dynamic (ทุก 2 ไม้)', '/mode 4', 'set_lotmode_3', 'lotmode'],
        ['Lot คงที่', '/mode 5', 'set_lotmode_4', 'lotmode'],
        ['🔙 กลับหน้าตั้งค่า', '/settings', '', 'settings']
      ]
    },
    startlot: {
      title: '🔢 เลือกล็อตเริ่มต้น',
      rows: [
        ['0.01', '/startlot 0.01', 'set_startlot_0.01', 'startlot'],
        ['0.02', '/startlot 0.02', 'set_startlot_0.02', 'startlot'],
        ['0.03', '/startlot 0.03', 'set_startlot_0.03', 'startlot'],
        ['0.05', '/startlot 0.05', 'set_startlot_0.05', 'startlot'],
        ['🔙 กลับหน้าตั้งค่า', '/settings', '', 'settings']
      ]
    },
    distance: {
      title: '↔️ เลือกระยะห่างการเปิดไม้แก้ (จุด)\n(ยิ่งน้อย ยิ่งเปิดถี่ ยิ่งเสี่ยง)',
      rows: [
        ['200', '/distance 200', 'set_distance_200', 'distance'],
        ['250', '/distance 250', 'set_distance_250', 'distance'],
        ['280', '/distance 280', 'set_distance_280', 'distance'],
        ['300', '/distance 300', 'set_distance_300', 'distance'],
        ['400', '/distance 400', 'set_distance_400', 'distance'],
        ['🔙 กลับหน้าตั้งค่า', '/settings', '', 'settings']
      ]
    },
    basket: {
      title: '🎯 เลือกเป้ากำไรรวม (Basket Points)\n(กำไรรวมทุกไม้ถึงเป้า ปิดทั้งหมด)',
      rows: [
        ['300', '/basket 300', 'set_basket_300', 'basket'],
        ['400', '/basket 400', 'set_basket_400', 'basket'],
        ['500', '/basket 500', 'set_basket_500', 'basket'],
        ['600', '/basket 600', 'set_basket_600', 'basket'],
        ['🔙 กลับหน้าตั้งค่า', '/settings', '', 'settings']
      ]
    },
    delay: {
      title: '⏳ เลือกระยะหน่วงก่อนเปิดไม้ถัดไป',
      rows: [
        ['5 วิ', '/delay 5', 'set_delay_5', 'delay'],
        ['10 วิ', '/delay 10', 'set_delay_10', 'delay'],
        ['15 วิ', '/delay 15', 'set_delay_15', 'delay'],
        ['30 วิ', '/delay 30', 'set_delay_30', 'delay'],
        ['1 นาที', '/delay 60', 'set_delay_60', 'delay'],
        ['🔙 กลับหน้าตั้งค่า', '/settings', '', 'settings']
      ]
    },
    maxlot: {
      title: '🔝 ตั้งเพดานล็อตสูงสุด (กันพอร์ตระเบิด)',
      rows: [
        ['0.20', '/maxlot 0.20', 'set_maxlot_0.20', 'maxlot'],
        ['0.40', '/maxlot 0.40', 'set_maxlot_0.40', 'maxlot'],
        ['0.80', '/maxlot 0.80', 'set_maxlot_0.80', 'maxlot'],
        ['1.00', '/maxlot 1.00', 'set_maxlot_1.00', 'maxlot'],
        ['🔙 กลับหน้าตั้งค่า', '/settings', '', 'settings']
      ]
    },
    hedge: {
      title: '🛡 Hedge — ระบบเฮดจ์แบบขั้นบันได',
      rows: [
        ['ระบบ Hedge: เปิด', '/hedge_toggle', '✅ ระบบ Hedge เปิดแล้ว', 'hedge'],
        ['🧮 รูปแบบ Lot: %', '/hedge_lot_mode', '✅ เปลี่ยนรูปแบบ Lot เป็นล็อตคงที่แล้ว', 'hedge'],
        ['🟦 L1: 20.00', '/hedge_l1_menu', '🟦 L1 — ตั้งค่าชั้นเฮดจ์แรก', 'hedge'],
        ['🟪 L2: 15.00', '/hedge_l2_menu', '🟪 L2 — ตั้งค่าชั้นเฮดจ์ที่สอง', 'hedge'],
        ['🟥 L3: 10.00', '/hedge_l3_menu', '🟥 L3 — ตั้งค่าชั้นเฮดจ์ที่สาม', 'hedge'],
        ['🎯 Hedge TP: 100 pts', '/menu_hedgetp', '🎯 ตั้งค่า TP ของระบบเฮดจ์', 'hedgetp'],
        ['🔙 กลับหน้าตั้งค่า', '/settings', '', 'settings']
      ]
    },
    hedgetp: {
      title: '🎯 รูปแบบ Hedge TP',
      rows: [
        ['Fixed TP ✅', '/sethedgetp 0', '✅ ตั้ง Fixed TP แล้ว', 'hedgetp'],
        ['Dynamic TP (ATR)', '/sethedgetp 1', '✅ ตั้ง Dynamic TP (ATR) แล้ว', 'hedgetp'],
        ['Trailing SL', '/sethedgetp 2', '✅ ตั้ง Trailing SL แล้ว', 'hedgetp'],
        ['🔙 กลับเมนู Hedge', '/menu_hedge_cat', '', 'hedge']
      ]
    },
    pairclose: {
      title: '♻️ ปิดชดเชย — ตั้งค่าการปิดคู่',
      rows: [
        ['🟦 เริ่ม Pair Close (กี่ไม้)', '/menu_pairclose', '🟦 ตั้งจำนวนไม้ที่เริ่มปิดชดเชย', 'pairclose'],
        ['🟨 ขั้นต่ำปิดชดเชย (กี่ไม้)', '/menu_offsetpairclose', '🟨 ตั้งจำนวนไม้ขั้นต่ำสำหรับปิดชดเชย', 'pairclose'],
        ['♻️ ปิดชดเชยอัตโนมัติ: เปิด', '/pairclose_auto', '✅ ปิดชดเชยอัตโนมัติ เปิดแล้ว', 'pairclose'],
        ['🔙 กลับหน้าตั้งค่า', '/settings', '', 'settings']
      ]
    },
    recovery: {
      title: '🚑 รักษาพอร์ต — ตัดขาดทุน/กู้คืน',
      rows: [
        ['🛡 รักษาพอร์ต (Save DD): 50%', '/menu_savedd', '🛡 ตั้งเป้ารักษาพอร์ต (Drawdown)', 'recovery'],
        ['✂️ โหมดกู้คืน (Recovery)', '/menu_recovery', '✂️ โหมดกู้คืน — ตัดไม้ขาดทุนแล้วกู้คืน', 'cut'],
        ['🔙 กลับหน้าตั้งค่า', '/settings', '', 'settings']
      ]
    },
    cut: {
      title: '✂️ โหมดกู้คืน (Cut & Switch Recovery)',
      rows: [
        ['🟦 ไม้ขั้นต่ำที่ยอม Cut: 3', '/menu_cutmin', '🟦 ตั้งจำนวนไม้ขั้นต่ำก่อนตัด', 'cutmin'],
        ['🟪 ตัวคูณ Lot กู้คืน: x2.0', '/menu_cutmult', '🟪 ตั้งตัวคูณล็อตสำหรับกู้คืน', 'cutmult'],
        ['🔙 กลับหน้าตั้งค่า', '/settings', '', 'settings']
      ]
    },
    cutmin: {
      title: '🟦 จำนวนไม้ขั้นต่ำก่อนตัดขาดทุน',
      rows: [
        ['3 ไม้', '/cutmin 3', '✅ ตั้งตัดที่ 3 ไม้แล้ว', 'cutmin'],
        ['5 ไม้', '/cutmin 5', '✅ ตั้งตัดที่ 5 ไม้แล้ว', 'cutmin'],
        ['10 ไม้', '/cutmin 10', '✅ ตั้งตัดที่ 10 ไม้แล้ว', 'cutmin'],
        ['15 ไม้', '/cutmin 15', '✅ ตั้งตัดที่ 15 ไม้แล้ว', 'cutmin'],
        ['🔙 กลับเมนูกู้คืน', '/menu_recovery', '', 'cut']
      ]
    },
    cutmult: {
      title: '🟪 ตัวคูณล็อตสำหรับกู้คืน',
      rows: [
        ['x2.0', '/cutmult 2.0', '✅ ตั้งตัวคูณ x2.0 แล้ว', 'cutmult'],
        ['x2.5', '/cutmult 2.5', '✅ ตั้งตัวคูณ x2.5 แล้ว', 'cutmult'],
        ['🔙 กลับเมนูกู้คืน', '/menu_recovery', '', 'cut']
      ]
    },
    filter: {
      title: '🛡 กรองกระชาก — กันเปิดไม้ช่วงราคาวิ่งแรง',
      rows: [
        ['RSI: 14 · 25/75', '/filter_rsi', '✅ ตั้งค่า RSI Oversold 25 / Overbought 75 แล้ว', 'filter'],
        ['กัน Candle กระชาก: 2000 pts', '/filter_crash', '✅ เปิดกันราคากระชาก 2000 จุดแล้ว', 'filter'],
        ['เปิด/ปิด', '/filter_toggle', '✅ สลับการกรองแล้ว', 'filter'],
        ['🔙 กลับหน้าตั้งค่า', '/settings', '', 'settings']
      ]
    },
    spread: {
      title: '📏 สเปรดสูงสุดที่ยอมรับได้ (จุด)',
      rows: [
        ['30', '/spreadmax 30', 'set_spread_30', 'spread'],
        ['50', '/spreadmax 50', 'set_spread_50', 'spread'],
        ['80', '/spreadmax 80', 'set_spread_80', 'spread'],
        ['100', '/spreadmax 100', 'set_spread_100', 'spread'],
        ['150', '/spreadmax 150', 'set_spread_150', 'spread'],
        ['200', '/spreadmax 200', 'set_spread_200', 'spread'],
        ['🔙 กลับหน้าตั้งค่า', '/settings', '', 'settings']
      ]
    },
    hours: {
      title: '⏰ เวลาซื้อขาย (เวลาไทย)\nตอนนี้: เปิดตลอด (24 ชม.)',
      rows: [
        ['⏰ เปิดตลอด 24 ชม. ✅', '/hours off', '✅ ตั้งเป็นเปิดตลอด 24 ชม. แล้ว', 'hours'],
        ['เปิด 08:00 – 22:00', '/hours on', '⏰ กรอกเวลาที่ต้องการ เช่น:\n/hours_set 08:00 22:00', 'hours'],
        ['ตั้งเวลา (HH:MM)', '/hours_set', '⏰ พิมพ์คำสั่ง:\n/hours_set HH:MM HH:MM\nตัวอย่าง: /hours_set 22:00 04:00 (ข้ามเที่ยงคืนได้)', 'hours'],
        ['🔙 กลับหน้าตั้งค่า', '/settings', '', 'settings']
      ]
    }
  };

  // กลับไปค่าเริ่มต้นของเดโม่ (เหมือนเปิดหน้าใหม่ครั้งแรก)
  function tgResetState() {
    tgState = 'menu';
    tgStateParams = null;
    tgStateCount = 0;
    tgEAOn = true;
    tgCurLotMode = 2;
    tgStartLot = 0.01;
    tgMaxLot = 0.40;
    tgMultiplier = 1.5;
    tgDistance = 280;
    tgBasket = 400;
    tgDelay = 5;
    tgSpreadMax = 80;
    tgNewsFilter = true;
    tgNewsImpactHigh = false;
    tgDynamicGrid = false;
    tgTrailing = false;
    tgSpreadFilter = true;
    tgHoursEnabled = false;
    tgHoursStart = 0;
    tgHoursEnd = 0;

    // หน้า v16-luna-1408: เพิ่มปุ่ม "ระดับข่าวที่กรอง" ในเมนูเทรดทั่วไป (หน้าเก่าไม่มี)
    var basic = TG_MENUS.basic.rows;
    var hasNewsImpact = basic.some(function (r) { return r[1] === '/newsimpact'; });
    if (tgIsLuna1408 && !hasNewsImpact) {
      basic.splice(basic.length - 1, 0, ['🎚 ระดับข่าวที่กรอง: High+Medium', '/newsimpact', 'newsimpact', 'basic']);
    } else if (!tgIsLuna1408 && hasNewsImpact) {
      for (var i = basic.length - 1; i >= 0; i--) {
        if (basic[i][1] === '/newsimpact') { basic.splice(i, 1); break; }
      }
    }
  }

  function tgBoot() {
    tgResetState();
    tgAddBubble('bot', 'ยินดีต้อนรับครับ พิมพ์ <b>/menu</b> เพื่อดูปุ่มใช้งาน');
    tgAddBubble('me', '/menu');
    tgAddBubble('bot', TG_MENUS.menu.title);
    tgRenderMenu('menu');
  }

  // XSS guard — ใช้กับข้อความจากผู้ใช้/คำสั่งก่อนใส่ bubble (กัน HTML injection)
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function tgAddBubble(who, html) {
    var chat = document.getElementById('tgChat');
    if (!chat) return;
    var b = document.createElement('div');
    b.className = 'bub ' + (who === 'me' ? 'me' : 'bot');
    b.innerHTML = html;
    chat.appendChild(b);
    chat.scrollTop = chat.scrollHeight;
  }

  // Label เมนูตาม state จริง (เหมือน Build*Menu() คำนวณจาก runtime)
  function tgLabel(key, row) {
    var label = row[0];
    switch (key) {
      case 'menu':
        if (row[1] === '/ea') label = tgEAOn ? '⏸️ ปิด EA' : '⚡ เปิด EA';
        break;
      case 'settings':
        if (row[1] === '/trailmode') label = '🚀 Trailing: ' + (tgTrailing ? 'เปิด' : 'ปิด');
        if (row[1] === '/menu_spread') label = '📏 สเปรด: ' + (tgSpreadFilter ? 'เปิด' : 'ปิด') + ' / ' + tgSpreadMax + ' pts';
        break;
      case 'basic':
        if (row[1] === '/menu_lotmode') label = '📐 โหมดการออกไม้: ' + TG_LOT_NAMES[tgCurLotMode];
        if (row[1] === '/menu_startlot') label = '🔢 Lot เริ่มต้น: ' + tgStartLot.toFixed(2);
        if (row[1] === '/menu_distance') label = '↔️ ระยะห่าง (Distance): ' + tgDistance;
        if (row[1] === '/menu_basket') label = '🎯 เป้ากำไร (Basket): ' + tgBasket;
        if (row[1] === '/menu_delay') label = '⏳ หน่วงเวลา (Delay): ' + tgDelay + 's';
        if (row[1] === '/dynamicgrid') label = '📊 Dynamic Grid: ' + (tgDynamicGrid ? 'เปิด' : 'ปิด');
        if (row[1] === '/newsfilter') label = '📰 กรองข่าว: ' + (tgNewsFilter ? 'เปิด' : 'ปิด');
        if (row[1] === '/newsimpact') label = '🎚 ระดับข่าวที่กรอง: ' + (tgNewsImpactHigh ? 'High เท่านั้น' : 'High+Medium');
        if (row[1] === '/menu_maxlot') label = '🔝 เพดาน Max Lot: ' + tgMaxLot.toFixed(2);
        break;
      case 'lotmode':
        if (row[1] === '/mode 1') label = 'คูณ ' + tgMultiplier.toFixed(2) + (tgCurLotMode === 0 ? ' ✅' : '');
        if (row[1] === '/mode 2') label = 'บวกทีละ 0.01' + (tgCurLotMode === 1 ? ' ✅' : '');
        if (row[1] === '/mode 3') label = 'บวก 0.01 ทุก 2 ไม้' + (tgCurLotMode === 2 ? ' ✅' : '');
        if (row[1] === '/mode 4') label = 'ขั้นบันได Dynamic (ทุก 2 ไม้)' + (tgCurLotMode === 3 ? ' ✅' : '');
        if (row[1] === '/mode 5') label = 'Lot คงที่' + (tgCurLotMode === 4 ? ' ✅' : '');
        break;
      case 'startlot':
        if (row[1] === '/startlot 0.01') label = '0.01' + (Math.abs(tgStartLot - 0.01) < 0.001 ? ' ✅' : '');
        if (row[1] === '/startlot 0.02') label = '0.02' + (Math.abs(tgStartLot - 0.02) < 0.001 ? ' ✅' : '');
        if (row[1] === '/startlot 0.03') label = '0.03' + (Math.abs(tgStartLot - 0.03) < 0.001 ? ' ✅' : '');
        if (row[1] === '/startlot 0.05') label = '0.05' + (Math.abs(tgStartLot - 0.05) < 0.001 ? ' ✅' : '');
        break;
      case 'spread':
        if (row[1] === '/spreadmax ' + tgSpreadMax) label = row[0] + ' ✅';
        break;
      case 'hours':
        if (row[1] === '/hours off') label = '⏰ เปิดตลอด 24 ชม.' + (!tgHoursEnabled ? ' ✅' : '');
        break;
    }
    return label;
  }

  function tgRenderMenu(key) {
    var kb = document.getElementById('tgKb');
    var menu = TG_MENUS[key];
    if (!kb || !menu) return;
    kb.innerHTML = '';
    menu.rows.forEach(function (row) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'kb-btn';
      var label = tgLabel(key, row);
      btn.innerHTML = '<span>' + label + '</span><span class="cmd">' + row[1] + '</span>';
      btn.addEventListener('click', function () { tgPress(row); });
      kb.appendChild(btn);
    });
  }

  function tgNowText() {
    var d = new Date();
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    return pad(d.getHours()) + ':' + pad(d.getMinutes());
  }
  function tgHoursLabel() {
    if (!tgHoursEnabled) return 'เปิดตลอด (24 ชม.)';
    var s = pad(tgHoursStart) + ':' + pad(tgHoursEnd);
    return s;
  }

  // แอกชันพิเศษ — จำลอง handler จริงของ EA
  function tgAction(action, cmd) {
    var msg = '';
    switch (action) {
      case 'toggle': {
        tgEAOn = !tgEAOn;
        msg = tgEAOn
          ? '✅ เปิด EA แล้ว — ระบบเริ่มทำงาน'
          : '⏸️ ปิด EA แล้ว — ระบบหยุดเปิดออเดอร์ใหม่ (ออเดอร์เดิมยังอยู่)';
        break;
      }
      case 'status': {
        msg =
          '📊 สถานะระบบ (Current Status)\n' +
          '──────────────\n' +
          'EA: ' + (tgEAOn ? '🟢 เปิด' : '🔴 ปิด') + '\n' +
          'โหมด: SEMI AUTO\n' +
          'AutoSide: TREND\n' +
          'LotMode: ' + TG_LOT_NAMES[tgCurLotMode] + '\n' +
          'StartLot: ' + tgStartLot.toFixed(2) + '\n' +
          'MaxLot: ' + tgMaxLot.toFixed(2) + '\n' +
          'Distance: ' + tgDistance + ' pts\n' +
          'Basket: ' + tgBasket + ' pts\n' +
          'Delay: ' + tgDelay + 's\n' +
          'Spread: เปิด / ' + tgSpreadMax + ' pts\n' +
          'Drawdown Lock: ปิด\n' +
          'Recovery: ปิด (x2.0)\n' +
          'Filter: ' + (tgNewsFilter ? 'เปิด' : 'ปิด') + '\n' +
          'Trailing: ' + (tgTrailing ? 'เปิด' : 'ปิด') + '\n' +
          'Dynamic Grid: ' + (tgDynamicGrid ? 'เปิด' : 'ปิด') + '\n' +
          '──────────────\n' +
          'เวลาไทย: ' + tgNowText() + ' (' + tgHoursLabel() + ')\n' +
          'เวลาซื้อขาย: ' + tgHoursLabel();
        break;
      }
      case 'account': {
        msg =
          '💳 ข้อมูลบัญชี (My Account)\n\n' +
          '🏢 เซิร์ฟเวอร์: ICMarkets-Demo\n' +
          '🆔 เลขบัญชี: 86005930\n' +
          '💵 สกุลเงิน: USD\n' +
          '💰 Balance: 1234.56\n' +
          '📈 Equity: 1227.00\n\n' +
          '🏆 EA Profit: 12.40 USD';
        break;
      }
      case 'calclot': {
        var mode_text = TG_LOT_NAMES[tgCurLotMode];
        msg = '🧮 ตารางคำนวณ Lot ล่วงหน้า (30 ไม้)\n' +
              'โหมด: ' + mode_text + '\n' +
              'เพดาน Max Lot: ' + tgMaxLot.toFixed(2) + '\n\n';
        var total = 0;
        for (var i = 0; i < 30; i++) {
          var lot = tgNextLot(i);
          msg += 'ไม้ที่ ' + (i + 1) + ': ' + lot.toFixed(2) + '\n';
          total += lot;
        }
        msg += '\n📊 รวม Lot ทั้งหมด (30 ไม้): ' + total.toFixed(2) + ' Lot\n\n' +
               '📦 ออเดอร์ปัจจุบัน: 0 ไม้ (Buy: 0, Sell: 0)\n' +
               '🛡️ ทนลากได้อีก: - จุด (ยังไม่มีออเดอร์)';
        break;
      }
      case 'toggle_dg': { tgDynamicGrid = !tgDynamicGrid; msg = tgDynamicGrid ? '✅ Dynamic Grid เปิดแล้ว' : '⏸️ Dynamic Grid ปิดแล้ว'; break; }
      case 'toggle_news': { tgNewsFilter = !tgNewsFilter; msg = tgNewsFilter ? '✅ กรองข่าวเปิดแล้ว — หยุดเปิดไม้ช่วงข่าวแรง' : '⏸️ กรองข่าวปิดแล้ว'; break; }
      case 'newsimpact': { tgNewsImpactHigh = !tgNewsImpactHigh; msg = tgNewsImpactHigh ? '✅ ระบบหลบข่าวจะกรองเฉพาะ High impact เท่านั้น' : '✅ ระบบหลบข่าวจะกรอง High + Medium'; break; }
      case 'toggle_trail': { tgTrailing = !tgTrailing; msg = tgTrailing ? '✅ Trailing เปิดแล้ว — ตามกำไรอัตโนมัติ' : '⏸️ Trailing ปิดแล้ว'; break; }
      case 'set_lotmode_0': { tgCurLotMode = 0; msg = '✅ ตั้งโหมดคูณล็อต ×1.50 แล้ว'; break; }
      case 'set_lotmode_1': { tgCurLotMode = 1; msg = '✅ ตั้งโหมดบวกทีละ 0.01 แล้ว'; break; }
      case 'set_lotmode_2': { tgCurLotMode = 2; msg = '✅ ตั้งโหมดบวก 0.01 ทุก 2 ไม้ แล้ว'; break; }
      case 'set_lotmode_3': { tgCurLotMode = 3; msg = '✅ ตั้งโหมดขั้นบันได Dynamic แล้ว'; break; }
      case 'set_lotmode_4': { tgCurLotMode = 4; msg = '✅ ตั้งโหมดล็อตคงที่แล้ว'; break; }
      default:
        if (action.indexOf('set_startlot_') === 0) { tgStartLot = parseFloat(action.slice(12)); msg = '✅ ตั้งล็อตเริ่มต้น ' + tgStartLot.toFixed(2) + ' แล้ว'; }
        else if (action.indexOf('set_distance_') === 0) { tgDistance = parseInt(action.slice(12), 10); msg = '✅ ตั้งระยะห่าง ' + tgDistance + ' จุดแล้ว'; }
        else if (action.indexOf('set_basket_') === 0) { tgBasket = parseInt(action.slice(10), 10); msg = '✅ ตั้งเป้ากำไรรวม ' + tgBasket + ' จุดแล้ว'; }
        else if (action.indexOf('set_delay_') === 0) { tgDelay = parseInt(action.slice(9), 10); msg = '✅ ตั้งหน่วง ' + tgDelay + ' วินาทีแล้ว'; }
        else if (action.indexOf('set_maxlot_') === 0) { tgMaxLot = parseFloat(action.slice(10)); msg = '✅ ตั้งเพดานล็อต ' + tgMaxLot.toFixed(2) + ' แล้ว'; }
        else if (action.indexOf('set_spread_') === 0) { tgSpreadMax = parseInt(action.slice(10), 10); msg = '✅ ตั้งสเปรดสูงสุด ' + tgSpreadMax + ' จุดแล้ว'; }
        break;
    }
    return msg;
  }

  function tgPress(row) {
    var cmd = row[1];
    var reply = row[2];
    var next = row[3];

    // ส่งคำสั่ง (เหมือนผู้ใช้กดปุ่ม) — esc กัน HTML injection
    tgAddBubble('me', esc(cmd));

    // แอกชันพิเศษ (toggle / status / calclot / set_*)
    if (reply.indexOf('toggle') === 0 ||
        reply.indexOf('status') === 0 ||
        reply.indexOf('account') === 0 ||
        reply.indexOf('calclot') === 0 ||
        reply.indexOf('newsimpact') === 0 ||
        reply.indexOf('set_') === 0) {
      var msg = tgAction(reply, cmd);
      if (msg) tgAddBubble('bot', msg);
      // กลับไปหน้าเดิม (ค่าเปลี่ยน → label ใหม่)
      tgState = next && TG_MENUS[next] ? next : (next === '/menu' ? 'menu' : 'settings');
      tgStateCount = 0;
      tgRenderMenu(tgState);
      return;
    }

    // ไปเมนูอื่น
    if (next === '/menu') {
      tgAddBubble('bot', reply);
      tgState = 'menu';
      tgStateCount = 0;
      tgRenderMenu('menu');
      return;
    }
    if (next && TG_MENUS[next]) {
      tgState = next;
      tgStateCount = 0;
      if (reply) tgAddBubble('bot', reply);
      tgAddBubble('bot', TG_MENUS[next].title);
      tgRenderMenu(next);
      return;
    }

    // default
    tgStateCount++;
    if (reply) tgAddBubble('bot', reply);
    tgState = 'settings';
    tgAddBubble('bot', TG_MENUS.settings.title);
    tgRenderMenu('settings');
  }

  function initTelegram() {
    var root = document.getElementById('tgDemo');
    if (!root) return;
    tgBoot();
    var reset = document.getElementById('tgReset');
    if (reset) {
      reset.addEventListener('click', function () {
        document.getElementById('tgChat').innerHTML = '';
        tgBoot();   // tgBoot เรียก tgResetState() ให้ด้วย
      });
    }
  }

  window.addEventListener('DOMContentLoaded', function () {
    initTheme();
    initRiskToggle();
    init3D();
    initReveal();
    initTicker();
    initTopbar();
    initTelegram();
    initCopy();
  });
})();
