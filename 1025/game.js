
(() => {
  'use strict';

  /* =========================================================
     星海拓殖 · Dushi 64 Planetary Frontier
     Vanilla Three.js / Canvas 2D-free 3D prototype.
     ========================================================= */

  const TAU = Math.PI * 2;
  const STORE_KEY = 'dushi-64-colony-medals.v1';
  const BGM_SRC = 'assets/bgm-colony.wav';
  const BGM_MUTED_KEY = 'dushi-64-colony-muted.v1';
  const BASE_POWER = 4;
  const BASE_RESOURCES = { metal: 60, ice: 35, crystal: 20 };
  const ROVER_SPEED = 8.5;
  const WORLD_RADIUS = 43;
  const CHUNK_SIZE = 28;
  const CHUNK_SEG = 14;
  const CHUNK_RADIUS = 3;
  const BASE_CHUNK_RADIUS = 4;
  const LAUNCH_POS = new THREE.Vector3(0, 0, -38);
  const LANDING_POS = new THREE.Vector3(0, 0, 20);
  const ROVER_START = new THREE.Vector3(0, 0, 10);

  const PLANETS = [
    {
      key: 'rubra', name: '赤砂星', sub: '铁锈荒漠 · 低重力',
      color: 0xb85f43, accent: '#f5a65b', sky: 0x160a10, seed: 11,
      desc: '氧化铁沙丘覆盖地表，日照强、金属富集，但冰层稀薄。',
      traits: { metal: 1.35, ice: 0.62, crystal: 0.92, solar: 1.25, gravity: 0.9, radiation: 0.35, wind: 1.2 }
    },
    {
      key: 'frost', name: '霜环星', sub: '冰环冻原 · 强辐射',
      color: 0x6daec8, accent: '#93c5fd', sky: 0x06131e, seed: 29,
      desc: '永久冻土与冰环包围的冷寂世界，冰资源充沛，日照微弱。',
      traits: { metal: 0.78, ice: 1.52, crystal: 0.84, solar: 0.55, gravity: 0.72, radiation: 0.72, wind: 1.32 }
    },
    {
      key: 'verdant', name: '苍潮星', sub: '潮汐群岛 · 高重力',
      color: 0x3f9d87, accent: '#5eead4', sky: 0x061614, seed: 47,
      desc: '浅海与火山岛交错，晶矿沿潮汐裂隙生长，重力偏高。',
      traits: { metal: 0.92, ice: 1.12, crystal: 1.42, solar: 0.96, gravity: 1.12, radiation: 0.29, wind: 0.82 }
    }
  ];

  const MODULES = {
    solar: {
      name: '光伏阵列', dept: '航空航天', color: 0x67e8f9,
      cost: { metal: 18, ice: 6, crystal: 8 }, use: 0, supply: 4, buildTime: 3.0,
      effect: '提供 4 × 星球光照的电力',
      cardTitle: '为什么太阳能板要朝向恒星？',
      card: '光伏阵列的发电量取决于受光面积与入射角。星球的光照、尘埃和昼夜周期，决定了阵列朝向与储能冗余。'
    },
    metal: {
      name: '采掘阵列', dept: '工业工程系', color: 0xf2b56d,
      cost: { metal: 22, ice: 8, crystal: 5 }, use: 2, rate: { metal: 2.4 }, buildTime: 3.6,
      effect: '金属 +2.4/秒',
      cardTitle: '采掘节拍与设备利用率',
      card: '工业工程用节拍、瓶颈与设备利用率组织产线。采掘阵列不是越密越好，运输与破碎能力必须匹配。'
    },
    ice: {
      name: '冰处理站', dept: '航空航天', color: 0x7dd3fc,
      cost: { metal: 20, ice: 10, crystal: 8 }, use: 2, rate: { ice: 1.9 }, buildTime: 3.6,
      effect: '冰 +1.9/秒',
      cardTitle: '冰为什么是深空燃料？',
      card: '水冰可电解为氢和氧，既提供生命支持，也可作为化学推进剂。冰处理站需要稳定电力来完成加热、分离与储存。'
    },
    crystal: {
      name: '晶矿精炼', dept: '软件学院', color: 0xc4b5fd,
      cost: { metal: 26, ice: 12, crystal: 10 }, use: 3, rate: { crystal: 1.15 }, buildTime: 4.2,
      effect: '晶矿 +1.15/秒',
      cardTitle: '晶圆制造为什么需要洁净环境？',
      card: '晶矿精炼对应半导体材料提纯。微小杂质会改变能带结构，精炼、洁净与检测数据必须闭环控制。'
    },
    mine: {
      name: '深井钻机', dept: '工业工程系', color: 0xfbbf24,
      cost: { metal: 28, ice: 10, crystal: 14 }, use: 3, rate: { crystal: 0.9, metal: 0.4 }, buildTime: 4.8,
      effect: '晶矿 +0.9/秒 · 金属 +0.4/秒',
      cardTitle: '为什么深井开采能拿到更纯的矿？',
      card: '深井钻机向下打穿表土层，直接取样基岩矿脉。钻孔、支护、提升与排水是深井开采的四大工程环节。'
    },
    harvester: {
      name: '地表采集站', dept: '工业工程系', color: 0x86efac,
      cost: { metal: 22, ice: 8, crystal: 6 }, use: 2, rate: { metal: 0.9, ice: 0.5 }, buildTime: 4.0,
      effect: '金属 +0.9/秒 · 冰 +0.5/秒',
      cardTitle: '露天采集为什么也要规划路线？',
      card: '地表采集站派出无人车沿路线取样。路径规划、卸载点布置与车队调度决定采集效率，这就是露天采矿的物流学。'
    },
    software: {
      name: '自动化中枢', dept: '软件学院', color: 0x67e8f9,
      cost: { metal: 30, ice: 16, crystal: 18 }, use: 1, unique: true, buildTime: 4.4,
      effect: '半径 22 内产线 +25%',
      cardTitle: '反馈控制如何稳定产线？',
      card: '自动化中枢采集传感器数据，用反馈控制调节设备。延迟、采样周期与冗余策略，决定了基地在极端环境下的稳定性。'
    },
    industry: {
      name: '工业工坊', dept: '工业工程系', color: 0xf5c96b,
      cost: { metal: 34, ice: 14, crystal: 12 }, use: 2, unique: true, buildTime: 4.8,
      effect: '建造 -15% · 半径 20 内产线 +15%',
      cardTitle: '模块化与产线平衡',
      card: '工业工程把复杂工程拆成可重组的模块，通过布局、库存与节拍平衡减少等待。建造折扣来自标准化与可复用部件。'
    },
    warehouse: {
      name: '物流仓储', dept: '工业工程系', color: 0x93c5fd,
      cost: { metal: 30, ice: 10, crystal: 12 }, use: 1, unique: true, buildTime: 4.4,
      effect: '全基地产线 +12%',
      cardTitle: '库存为什么不是越多越好？',
      card: '仓储中心缓冲上下游的节拍差异。安全库存、周转率与拣选路径共同决定物流成本，过量库存会占用电力与资金。'
    },
    control: {
      name: '轨道测控站', dept: '航空航天', color: 0x5eead4,
      cost: { metal: 40, ice: 22, crystal: 24 }, use: 2, unique: true, buildTime: 5.2,
      effect: '解锁火箭研发 · 研发 -10%',
      cardTitle: '火箭为什么需要测控？',
      card: '轨道测控站负责遥测、跟踪与指令上行。没有姿态与轨道数据，火箭无法完成跨星系转移点火。'
    }
  };

  const STAGES = [
    {
      key: 'structure', title: '结构工程', dept: '工业工程系',
      base: { metal: 1300, ice: 550, crystal: 300 },
      hint: '先判断星球重力，再选择箭体结构。',
      options: [
        { id: 'honeycomb', name: '蜂窝夹层舱段', desc: '抗压与抗弯更强，适合高重力星球。', knowledge: '蜂窝夹层把薄面板与芯层组合，以较低质量获得较高抗弯刚度。' },
        { id: 'truss', name: '轻量桁架舱段', desc: '结构更轻，适合低重力星球。', knowledge: '桁架结构用杆件受拉压，低重力下可牺牲部分刚度换取更低发射质量。' }
      ]
    },
    {
      key: 'avionics', title: '航电与飞控', dept: '软件学院',
      base: { metal: 1100, ice: 450, crystal: 800 },
      hint: '辐射环境决定飞控需要多少冗余。',
      options: [
        { id: 'redundant', name: '三模冗余导航', desc: '容错更强，适合强辐射环境。', knowledge: '三模冗余让三套计算单元并行表决，单粒子翻转时仍能输出可信姿态。' },
        { id: 'light', name: '轻量单板飞控', desc: '质量更小，适合辐射较低的环境。', knowledge: '低辐射环境中可使用更轻的单板飞控，把质量预算留给推进剂与载荷。' }
      ]
    },
    {
      key: 'propulsion', title: '推进与燃料', dept: '航空航天',
      base: { metal: 1600, ice: 950, crystal: 450 },
      hint: '看看星球上最丰富的资源是什么。',
      options: [
        { id: 'methane', name: '甲烷分级发动机', desc: '可就地制取燃料，适合富冰星球。', knowledge: '甲烷与液氧可由水冰和大气中的二氧化碳制取，适合建立本地燃料链。' },
        { id: 'ion', name: '离子推进器', desc: '比冲高，适合日照充足的环境。', knowledge: '离子推进以电能加速工质，比冲高但推力小，适合日照充足的轨道转移。' }
      ]
    }
  ];

  const LAUNCH_COST = { metal: 160, ice: 100, crystal: 80 };

  const ENDLESS_NAMES = ['灰烬星', '霜蚀星', '幽蓝星', '碎环星', '赤铁星', '静海星', '极光星', '荒原星'];
  const MEDAL_KEY = 'dushi-64-colony-medals.v1';
  const MAX_CREWS = 2;
  const CORE_LINK_RADIUS = 24;
  const MODULE_LINK_RADIUS = 22;
  const CORE_LINK_CAP = 3;
  const MODULE_LINK_CAP = 2;
  const CORE_NODE = { core: true, x: 0, z: 0 };
  const UP = new THREE.Vector3(0, 1, 0);
  const MAX_MODULE_LEVEL = 3;
  const LEVEL_OUTPUT = [1, 1.7, 2.6];
  const LEVEL_SOLAR = [1, 1.6, 2.2];
  const DEFAULT_SLOT_COUNT = 3;
  const MAX_SLOTS = 20;
  const BASE_CORE_RATE = { metal: 0.4, ice: 0.3, crystal: 0.2 };
  const COLLECTOR_STORAGE_BASE = 16;
  const COLLECTOR_STORAGE_PER_LEVEL = 10;
  const COLLECTOR_LINE_RATE = 6;
  const WAREHOUSE_LINE_RATE = 24;

  const EVENTS = [
    { id: 'dustStorm', icon: '🌪️', title: '沙尘暴来袭', tone: 'bad', kind: 'choice',
      desc: '强风卷起沙尘，产线面临堵塞风险。',
      avoidCost: { metal: 25 }, avoidLabel: '部署防风网（-25 金属）', avoidToast: '防风网已展开，产线正常',
      acceptLabel: '硬扛（产线 -25% · 35 秒）', mods: { prod: 0.75 }, duration: 35 },
    { id: 'solarWindow', icon: '☀️', title: '日照窗口', tone: 'good', kind: 'auto',
      desc: '恒星活动增强，光伏阵列发电效率暂时提高。', mods: { solar: 1.4 }, duration: 45 },
    { id: 'richVein', icon: '⛏️', title: '富矿矿脉', tone: 'good', kind: 'auto',
      desc: '勘探队在近地表发现一条富矿脉，临时增产。', gain: { metal: 40, crystal: 25 } },
    { id: 'iceFissure', icon: '🧊', title: '冰层裂隙', tone: 'good', kind: 'auto',
      desc: '冰层开裂，暴露大量可开采水冰。', gain: { ice: 35 } },
    { id: 'meteorShower', icon: '☄️', title: '陨石雨', tone: 'bad', kind: 'choice',
      desc: '小型陨石群逼近，可能损坏晶矿精炼线。',
      avoidCost: { crystal: 20 }, avoidLabel: '启动防护罩（-20 晶矿）', avoidToast: '防护罩拦截了陨石',
      acceptLabel: '接受冲击（晶矿 -30% · 25 秒）', mods: { crystalProd: 0.7 }, duration: 25 },
    { id: 'overheat', icon: '🔥', title: '设备过热', tone: 'bad', kind: 'choice',
      desc: '电网负载偏高，冷却系统告警。',
      avoidCost: { ice: 20 }, avoidLabel: '紧急冷却（-20 冰）', avoidToast: '冷却完成，产线稳定',
      acceptLabel: '降功率运行（产线 -20% · 20 秒）', mods: { prod: 0.8 }, duration: 20 },
    { id: 'signalBoost', icon: '📡', title: '信号增强', tone: 'good', kind: 'auto',
      desc: '行星轨道中继信号增强，火箭研发成本暂时下降。', mods: { research: 0.9 }, duration: 60 },
    { id: 'solarFlare', icon: '⚡', title: '太阳耀斑', tone: 'bad', kind: 'auto',
      desc: '耀斑辐射干扰光伏与飞控，发电效率下降。', mods: { solar: 0.65 }, duration: 30 }
  ];

  const SITE_TYPES = {
    sun: { label: '日照台地', color: '#f5c96b', match: 'solar', mul: 1.35, text: '光伏供电 +35%' },
    metal: { label: '金属矿脉', color: '#f2b56d', match: 'metal', mul: 1.35, text: '金属采掘 +35%' },
    ice: { label: '冰层穹丘', color: '#7dd3fc', match: 'ice', mul: 1.35, text: '冰处理 +35%' },
    crystal: { label: '晶簇裂隙', color: '#c4b5fd', match: 'crystal', mul: 1.35, text: '晶矿精炼 +35%' },
    flat: { label: '平整岩台', color: '#cbd5e1', buildMul: 0.7, text: '施工时间 -30%' },
    ridge: { label: '科研高地', color: '#a78bfa', text: '测控站用电 -1 · 研发折扣 +5%' }
  };

  function sitePlan(planet) {
    if (planet.sites) return planet.sites;
    const rng = seededRandom(planet.seed * 73 + 19);
    const base = ['sun', 'metal', 'ice', 'crystal', 'flat', 'ridge'];
    const extras = ['sun', 'metal', 'ice', 'crystal', 'flat', 'ridge'];
    for (let i = extras.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [extras[i], extras[j]] = [extras[j], extras[i]];
    }
    const plan = base.concat(extras);
    for (let i = plan.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [plan[i], plan[j]] = [plan[j], plan[i]];
    }
    planet.sites = plan;
    return plan;
  }

  function siteTypeOf(pad) {
    return SITE_TYPES[pad.site] || SITE_TYPES.flat;
  }

  function siteBonusFor(pad, type) {
    const site = siteTypeOf(pad);
    if (site.match === type) return `地块加成：${site.text}`;
    if (pad.site === 'flat') return `地块加成：${site.text}`;
    if (pad.site === 'ridge' && type === 'control') return `地块加成：${site.text}`;
    return '';
  }

  function siteMultiplier(pad, type) {
    const site = siteTypeOf(pad);
    return site.match === type ? site.mul : 1;
  }

  function effectiveBuildTime(pad, type) {
    const base = MODULES[type].buildTime || 4;
    return siteTypeOf(pad).buildMul ? base * siteTypeOf(pad).buildMul : base;
  }

  function activeCrews() {
    return state.pads.filter(p => p.construction).length;
  }

  function nodeRemaining(node) {
    const cap = node.core ? CORE_LINK_CAP : MODULE_LINK_CAP;
    const children = state.pads.filter(p => p.networkParent === node).length;
    return cap - children;
  }

  function nearestNetworkNode(pad) {
    const candidates = [CORE_NODE];
    for (const p of state.pads) {
      if (p.module && p.connected) candidates.push(p);
    }
    let best = null;
    for (const node of candidates) {
      if (node === pad) continue;
      const remaining = nodeRemaining(node);
      if (remaining <= 0) continue;
      const radius = node.core ? CORE_LINK_RADIUS : MODULE_LINK_RADIUS;
      const distance = Math.hypot(pad.x - node.x, pad.z - node.z);
      if (distance <= radius && (!best || distance < best.distance)) {
        best = { node, distance, radius, remaining };
      }
    }
    return best;
  }

  function computeNetwork() {
    const modules = state.pads.filter(p => p.module);
    for (const p of modules) {
      p.connected = false;
      p.networkParent = null;
    }
    const connected = [CORE_NODE];
    const remaining = new Map();
    remaining.set(CORE_NODE, CORE_LINK_CAP);

    const tryLink = (pad, node) => {
      const cap = remaining.get(node) || 0;
      if (cap <= 0) return false;
      const radius = node.core ? CORE_LINK_RADIUS : MODULE_LINK_RADIUS;
      if (Math.hypot(pad.x - node.x, pad.z - node.z) > radius) return false;
      pad.connected = true;
      pad.networkParent = node;
      remaining.set(node, cap - 1);
      connected.push(pad);
      remaining.set(pad, MODULE_LINK_CAP);
      return true;
    };

    // 先应用玩家手动指定的物流线
    let applied = true;
    while (applied) {
      applied = false;
      for (const pad of modules) {
        if (pad.connected || pad.linkOverride == null) continue;
        let target = null;
        if (pad.linkOverride === 'core') target = CORE_NODE;
        else {
          const idx = +pad.linkOverride;
          const t = state.pads[idx];
          if (t && t.module && t !== pad) target = t;
        }
        if (!target || !connected.includes(target)) continue;
        if (tryLink(pad, target)) applied = true;
      }
    }

    // 其余模块自动就近连接
    let changed = true;
    while (changed) {
      changed = false;
      for (const pad of modules) {
        if (pad.connected) continue;
        let best = null;
        for (const node of connected) {
          const cap = remaining.get(node) || 0;
          if (cap <= 0) continue;
          const radius = node.core ? CORE_LINK_RADIUS : MODULE_LINK_RADIUS;
          const distance = Math.hypot(pad.x - node.x, pad.z - node.z);
          if (distance <= radius && (!best || distance < best.distance)) best = { node, distance };
        }
        if (best) {
          pad.connected = true;
          pad.networkParent = best.node;
          remaining.set(best.node, (remaining.get(best.node) || 0) - 1);
          connected.push(pad);
          remaining.set(pad, MODULE_LINK_CAP);
          changed = true;
        }
      }
    }
    state.network = { connected: modules.filter(p => p.connected).length, total: modules.length };
    return state.network;
  }

  function setLinkTarget(padIndex, key) {
    const pad = state.pads[padIndex];
    if (!pad || !pad.module) return;
    pad.linkOverride = (key === 'auto') ? null : key;
    computeNetwork();
    rebuildNetworkVisuals();
    refreshAllPadLabels();
    updateHud();
    openBuildPanel(pad);
  }

  function pickAt(clientX, clientY) {
    const ndc = new THREE.Vector2(
      (clientX / window.innerWidth) * 2 - 1,
      -(clientY / window.innerHeight) * 2 + 1
    );
    raycaster.setFromCamera(ndc, camera);
    const objects = [];
    for (const pad of state.pads) if (pad.group) objects.push(pad.group);
    if (state.baseCore) objects.push(state.baseCore);
    const hits = raycaster.intersectObjects(objects, true);
    for (const hit of hits) {
      let obj = hit.object;
      while (obj) {
        if (obj.userData && obj.userData.isCore) return { kind: 'core' };
        obj = obj.parent;
      }
    }
    for (const hit of hits) {
      let obj = hit.object;
      while (obj) {
        if (obj.userData && obj.userData.padIndex != null) return { kind: 'pad', index: obj.userData.padIndex };
        obj = obj.parent;
      }
    }
    return null;
  }

  function handleLinePick(clientX, clientY) {
    const pick = pickAt(clientX, clientY);
    if (!pick) return;
    if (state.linePick == null) {
      // 第一步：选中要改线的建筑（必须是已建模块的地块）
      if (pick.kind === 'pad') {
        const pad = state.pads[pick.index];
        if (pad && pad.module) {
          state.linePick = pick.index;
          pad.label.classList.add('line-picked');
          toast(`已选中 ${MODULES[pad.module].name} · 再点击新的进货来源`, 'gold');
        }
      }
      return;
    }
    // 第二步：选择新的进货来源
    const destIndex = state.linePick;
    const dest = state.pads[destIndex];
    if (dest && dest.label) dest.label.classList.remove('line-picked');
    state.linePick = null;
    if (pick.kind === 'core') {
      setLinkTarget(destIndex, 'core');
    } else if (pick.kind === 'pad') {
      const src = state.pads[pick.index];
      if (src && src.module && pick.index !== destIndex) {
        setLinkTarget(destIndex, String(pick.index));
      } else if (pick.index === destIndex) {
        toast('不能连接到自身', 'gold');
      }
    }
  }

  function toggleLineEdit() {
    if (state.phase !== 'play' || state.launching || state.cinematic) return;
    state.lineEdit = !state.lineEdit;
    if (!state.lineEdit) {
      if (state.linePick != null) {
        const pad = state.pads[state.linePick];
        if (pad && pad.label) pad.label.classList.remove('line-picked');
      }
      state.linePick = null;
    }
    ui.hud.classList.toggle('line-edit', state.lineEdit);
    if (ui.line) ui.line.innerHTML = state.lineEdit ? '退出改线 <kbd>L</kbd>' : '改线 <kbd>L</kbd>';
    toast(state.lineEdit ? '产线编辑：点击一个建筑，再点击其新的进货来源' : '已退出产线编辑', state.lineEdit ? 'gold' : '');
    updateHud();
  }

  function hasConnectedModule(type) {
    return state.pads.some(p => p.module === type && p.connected);
  }

  function moduleLevel(pad) {
    return pad.level || 1;
  }

  function upgradeCost(type, targetLevel) {
    const factor = targetLevel === 2 ? 1.4 : 2.4;
    return Object.fromEntries(Object.entries(MODULES[type].cost).map(([k, v]) => [k, Math.ceil(v * factor)]));
  }

  function modulePowerUse(pad) {
    const m = MODULES[pad.module];
    if (!m || !m.use) return 0;
    const ridge = pad.site === 'ridge' && pad.module === 'control' ? 1 : 0;
    return Math.max(0, m.use + (moduleLevel(pad) - 1) - ridge);
  }

  function moduleOutputMultiplier(pad) {
    return LEVEL_OUTPUT[moduleLevel(pad) - 1] || 1;
  }

  function collectorCapacity(pad) {
    return COLLECTOR_STORAGE_BASE + COLLECTOR_STORAGE_PER_LEVEL * (moduleLevel(pad) - 1);
  }

  function nodePosition(node) {
    if (node.core) return new THREE.Vector3(0, terrainHeight(0, 0, state.planet) + 1.15, 0);
    return new THREE.Vector3(node.x, node.y + 1.15, node.z);
  }

  function makeLinkCurve(a, b, planet, offsetY = 0) {
    const points = [];
    const steps = 14;
    const len = Math.hypot(b.x - a.x, b.z - a.z);
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = a.x + (b.x - a.x) * t;
      const z = a.z + (b.z - a.z) * t;
      const sway = Math.sin(t * Math.PI) * (0.8 + Math.min(1.6, len * 0.03));
      const side = Math.sin(t * Math.PI * 2) * 0.35;
      const y = terrainHeight(x, z, planet) + 0.5 + sway + offsetY;
      points.push(new THREE.Vector3(x + side, y, z));
    }
    return new THREE.CatmullRomCurve3(points);
  }

  function rebuildNetworkVisuals() {
    if (!state.worldGroup) return;
    if (state.networkGroup) {
      state.worldGroup.remove(state.networkGroup);
      disposeGroup(state.networkGroup);
      state.networkGroup = null;
    }
    state.linkFlows = [];
    const group = new THREE.Group();
    const mastMat = mat(0x2c3a4f, 0x0a1422, 0.5);
    const hubMat = mat(0x33445c, 0x0b1424, 0.35);
    const powerColor = 0x67e8f9;
    const matColor = 0xf5c96b;
    let linkIndex = 0;
    for (const pad of state.pads) {
      if (!pad.module || !pad.connected || !pad.networkParent) continue;
      const from = nodePosition(pad.networkParent);
      const to = nodePosition(pad);
      const powerCurve = makeLinkCurve(from, to, state.planet, 0.22);
      const matCurve = makeLinkCurve(from, to, state.planet, -0.22);

      const underlay = new THREE.Mesh(
        new THREE.TubeGeometry(powerCurve, 24, 0.40, 4, false),
        new THREE.MeshBasicMaterial({ color: 0x02050b, transparent: true, opacity: 0.55, depthWrite: false })
      );
      group.add(underlay);

      // 电力线：青色实心 + 发光芯
      const powerTube = new THREE.Mesh(
        new THREE.TubeGeometry(powerCurve, 24, 0.2, 4, false),
        new THREE.MeshBasicMaterial({ color: powerColor, transparent: true, opacity: 0.9, depthWrite: false })
      );
      group.add(powerTube);
      const powerStrand = new THREE.Mesh(
        new THREE.TubeGeometry(powerCurve, 24, 0.09, 4, false),
        new THREE.MeshBasicMaterial({ color: 0xa5f3fc, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false })
      );
      group.add(powerStrand);

      // 物资线：琥珀色，略低于电力线
      const matTube = new THREE.Mesh(
        new THREE.TubeGeometry(matCurve, 24, 0.15, 4, false),
        new THREE.MeshBasicMaterial({ color: matColor, transparent: true, opacity: 0.82, depthWrite: false })
      );
      group.add(matTube);

      // 线路中继塔
      for (const tt of [0.25, 0.5, 0.75]) {
        const pp = powerCurve.getPointAt(tt);
        const groundY = terrainHeight(pp.x, pp.z, state.planet);
        const h = Math.max(0.6, pp.y - groundY);
        const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.1, h, 5), mastMat);
        mast.position.set(pp.x, groundY + h / 2, pp.z);
        group.add(mast);
        const beacon = new THREE.Mesh(
          new THREE.SphereGeometry(0.1, 6, 4),
          new THREE.MeshBasicMaterial({ color: 0xf5c96b, transparent: true, opacity: 0.9, depthWrite: false })
        );
        beacon.position.set(pp.x, pp.y + 0.16, pp.z);
        group.add(beacon);
      }

      const hub = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.05, 5, 12), hubMat);
      hub.rotation.x = Math.PI / 2;
      hub.position.set(to.x, to.y - 0.35, to.z);
      group.add(hub);

      // 电力流光（向外，parent -> child）
      const powerDotMat = new THREE.MeshBasicMaterial({ color: 0xa5f3fc, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false });
      for (let k = 0; k < 2; k++) {
        const dot = new THREE.Mesh(new THREE.SphereGeometry(0.16, 6, 4), powerDotMat);
        group.add(dot);
        state.linkFlows.push({ mesh: dot, curve: powerCurve, offset: (k * 0.5 + linkIndex * 0.13) % 1, orient: false, dir: 1 });
      }
      // 物资货物流光（向内，child -> parent）
      const podMat = new THREE.MeshBasicMaterial({ color: matColor, transparent: true, opacity: 0.98, blending: THREE.AdditiveBlending, depthWrite: false });
      for (let k = 0; k < 3; k++) {
        const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.45, 6), podMat);
        group.add(pod);
        const tip = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 4), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, depthWrite: false }));
        pod.add(tip);
        state.linkFlows.push({ mesh: pod, curve: matCurve, offset: (k / 3 + linkIndex * 0.13) % 1, orient: true, dir: -1 });
      }
      linkIndex++;
    }
    state.networkGroup = group;
    state.surfaceGroup.add(group);
  }

  function updateNetworkFlows(dt) {
    if (!state.linkFlows.length) return;
    state.linkTime += dt;
    for (const flow of state.linkFlows) {
      let t = (state.linkTime * 0.16 + flow.offset) % 1;
      if (t < 0) t += 1;
      if (flow.dir < 0) t = 1 - t;
      const pos = flow.curve.getPoint(t);
      flow.mesh.position.copy(pos);
      if (flow.orient) {
        let tan = flow.curve.getTangent(t);
        if (flow.dir < 0) tan = tan.clone().negate();
        tan.normalize();
        if (tan.lengthSq() > 0.0001) flow.mesh.quaternion.setFromUnitVectors(UP, tan);
      }
    }
  }
  const $ = id => document.getElementById(id);

  const state = {
    mode: 'title', phase: 'title', running: false,
    view: 'surface',    planet: null, planetIndex: 0, cycle: 1,
    resources: { metal: 0, ice: 0, crystal: 0 },
    rocket: { stage: 0, choices: [], correct: 0 },
    stats: { mined: 0, built: 0, correct: 0, choices: 0 },
    pads: [], nodes: [], medals: [],
    nearPad: null, nearNode: null, modalOpen: false,
    elapsed: 0, launchT: 0, launching: false,
    nextEventAt: 0, activeEvents: [], lastEvent: null, collecting: null, offloadT: 0,
    cinematic: null, landingT: 0, lander: null, landerBaseY: 0,
    landerRamp: null, landerFlame: null, landerDust: null,
    worldGroup: null, titleGroup: null, rover: null, rocketMesh: null,
    surfaceGroup: null, undergroundGroup: null, terrainGroup: null, baseCore: null,
    lineEdit: false, linePick: null,
    networkGroup: null, linkFlows: [], linkTime: 0, network: { connected: 0, total: 0 },
    collectorBots: [],
    chunks: new Map(), chunkT: 0, terrainMaterial: null,
    labels: [], hudT: 0, nearT: 0, titleAngle: 0, seeded: null
  };

  let renderer, scene, camera, hemi, sun, starField, distantPlanet;
  const raycaster = new THREE.Raycaster();
  let joystick = { x: 0, y: 0, active: false, pointerId: null };
  const keys = Object.create(null);
  const clock = new THREE.Clock();
  let lastHud = 0;

  const ui = {
    title: $('title-screen'), hud: $('hud'), modal: $('modal'), modalBody: $('modal-body'),
    modalKicker: $('modal-kicker'), modalTitle: $('modal-title'),
    complete: $('complete-overlay'), completeTitle: $('complete-title'),
    completeSub: $('complete-sub'), completeMedal: $('complete-medal'),
    completeStats: $('complete-stats'), next: $('btn-next-planet'),
    landing: $('landing-screen'), landingPlanet: $('landing-planet'),
    landingStatus: $('landing-status'), landingProgress: $('landing-progress'),
    landingPhase: $('landing-phase'), landingSkip: $('landing-skip'),
    planet: $('hud-planet'), planetSub: $('hud-sub'), traits: $('hud-traits'),
    cycle: $('hud-cycle'), objective: $('objective-text'),
    metal: $('res-metal'), ice: $('res-ice'), crystal: $('res-crystal'), power: $('res-power'),
    powerChip: document.querySelector('.res-chip.power'),
    statusMode: $('status-mode'), statusPower: $('status-power'), statusCrew: $('status-crew'), statusNetwork: $('status-network'),
    prompt: $('interaction-prompt'), promptIcon: $('prompt-icon'), promptText: $('prompt-text'),
    interact: $('btn-interact'), build: $('btn-build'), research: $('btn-research'), view: $('btn-view'), underground: $('btn-underground'), slot: $('btn-slot'), line: $('btn-line'), settle: $('btn-settle'),
    labels: $('labels'), toasts: $('toasts'),
    eventBanner: $('event-banner'), collectProgress: $('collect-progress'), collectFill: $('collect-fill'),
    medalCount: $('medal-count'), joystick: $('joystick'), joystickKnob: $('joystick-knob')
  };

  /* ---------- boot ---------- */

  function init() {
    if (!window.THREE) {
      showWebglError('Three.js 未能加载，请检查 vendor/three.min.js。');
      return;
    }
    try {
      renderer = new THREE.WebGLRenderer({ canvas: $('scene'), antialias: true, alpha: false, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.08;
    } catch (err) {
      showWebglError(err.message || 'WebGL 初始化失败。');
      return;
    }
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060812);
    scene.fog = new THREE.FogExp2(0x060812, 0.012);
    camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 340);
    hemi = new THREE.HemisphereLight(0x9fc8ff, 0x1a1028, 0.82);
    sun = new THREE.DirectionalLight(0xffe6c7, 1.15);
    sun.position.set(22, 32, 12);
    scene.add(hemi, sun);
    createStars();
    loadMedals();
    bindEvents();
    buildTitleScene();
    window.addEventListener('resize', resize);
    animate();
  }

  function showWebglError(message) {
    const box = $('webgl-error');
    if (box) {
      box.hidden = false;
      const p = box.querySelector('p');
      if (p && message) p.textContent = message;
    }
  }

  function createStars() {
    const positions = [];
    for (let i = 0; i < 1500; i++) {
      const u = Math.random() * 2 - 1;
      const theta = Math.random() * TAU;
      const r = 90 + Math.random() * 130;
      const s = Math.sqrt(1 - u * u);
      positions.push(Math.cos(theta) * s * r, u * r, Math.sin(theta) * s * r);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({ color: 0xb9c9ff, size: 0.36, transparent: true, opacity: 0.78, sizeAttenuation: true, depthWrite: false });
    starField = new THREE.Points(geo, mat);
    scene.add(starField);
  }

  function resize() {
    if (!renderer || !camera) return;
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }

  function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);
    if (state.mode === 'title') updateTitle(dt);
    else if (state.planet) updatePlay(dt);
    renderer.render(scene, camera);
  }

  /* ---------- title scene ---------- */

  function buildTitleScene() {
    clearWorld();
    if (state.titleGroup) removeGroup(state.titleGroup);
    scene.background = new THREE.Color(0x060812);
    scene.fog = new THREE.FogExp2(0x060812, 0.008);
    const g = new THREE.Group();
    const planetMat = new THREE.MeshStandardMaterial({ color: 0x7461c9, roughness: 0.86, metalness: 0.05, flatShading: true });
    const planet = new THREE.Mesh(new THREE.IcosahedronGeometry(6.2, 1), planetMat);
    planet.position.y = 3.6;
    planet.rotation.z = 0.2;
    g.add(planet);
    const atmo = new THREE.Mesh(
      new THREE.IcosahedronGeometry(6.8, 1),
      new THREE.MeshBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 0.06, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    atmo.position.copy(planet.position);
    g.add(atmo);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(8.8, 0.10, 5, 64), new THREE.MeshStandardMaterial({ color: 0xd9b46b, emissive: 0x6b4a17, emissiveIntensity: 0.7, roughness: 0.5 }));
    ring.position.y = 3.6;
    ring.rotation.x = Math.PI / 2.25;
    g.add(ring);
    const moon = new THREE.Mesh(new THREE.IcosahedronGeometry(0.72, 0), new THREE.MeshStandardMaterial({ color: 0xa78bfa, flatShading: true, emissive: 0x2b1b55, emissiveIntensity: 0.6 }));
    moon.position.set(9.4, 9.2, -1.8);
    g.add(moon);
    state.titleGroup = g;
    scene.add(g);
    state.titleAngle = 0;
    camera.position.set(0, 9.5, 24);
    camera.lookAt(0, 3.8, 0);
  }

  function updateTitle(dt) {
    if (!state.titleGroup) return;
    state.titleAngle += dt * 0.12;
    state.titleGroup.rotation.y = state.titleAngle;
    const a = state.titleAngle * 0.65 + 0.5;
    camera.position.set(Math.sin(a) * 23, 9.2 + Math.sin(state.titleAngle * 0.4) * 0.8, Math.cos(a) * 23);
    camera.lookAt(0, 3.8, 0);
    if (starField) starField.rotation.y += dt * 0.004;
  }

  /* ---------- planet generation ---------- */

  function campaignPlanet(index) {
    return PLANETS[index % PLANETS.length];
  }

  function endlessPlanet(cycle, carry) {
    const rng = seededRandom(cycle * 97 + 13);
    const base = PLANETS[(cycle - 1) % PLANETS.length];
    const hue = (cycle * 0.17 + 0.03) % 1;
    const color = new THREE.Color().setHSL(hue, 0.38 + rng() * 0.16, 0.38 + rng() * 0.08).getHex();
    const traits = {
      metal: 0.72 + rng() * 0.72,
      ice: 0.68 + rng() * 0.84,
      crystal: 0.68 + rng() * 0.82,
      solar: 0.7 + rng() * 0.68,
      gravity: 0.68 + rng() * 0.55,
      radiation: 0.2 + rng() * 0.7,
      wind: 0.72 + rng() * 0.62
    };
    return {
      key: 'endless-' + cycle,
      name: ENDLESS_NAMES[(cycle - 1) % ENDLESS_NAMES.length],
      sub: `程序星域 · 无尽航段 ${pad2(cycle)}`,
      color, accent: '#' + new THREE.Color(color).getHexString(),
      sky: new THREE.Color(color).multiplyScalar(0.12).getHex(),
      seed: 100 + cycle * 37,
      desc: `无人星域中的第 ${cycle} 颗可拓殖星球，资源分布与重力条件随机生成。`,
      traits,
      endless: true,
      carry
    };
  }

  function getNextPlanet() {
    if (state.mode === 'campaign') return campaignPlanet(state.planetIndex + 1);
    return endlessPlanet(state.cycle + 1, state.resources);
  }

  function traitLabels(p) {
    const t = p.traits;
    const list = [];
    if (t.metal >= 1.12) list.push(['富金属', 'hot']);
    else if (t.metal <= 0.78) list.push(['贫金属', '']);
    if (t.ice >= 1.12) list.push(['富冰', 'cold']);
    else if (t.ice <= 0.74) list.push(['少冰', '']);
    if (t.crystal >= 1.12) list.push(['晶脉', 'violet']);
    if (t.solar >= 1.1) list.push(['强日照', 'hot']);
    else if (t.solar <= 0.72) list.push(['弱日照', '']);
    if (t.gravity >= 1.05) list.push(['高重力', 'violet']);
    else if (t.gravity <= 0.82) list.push(['低重力', 'cold']);
    if (t.radiation >= 0.58) list.push(['强辐射', 'violet']);
    if (t.wind >= 1.2) list.push(['强风', '']);
    return list;
  }

  /* ---------- world ---------- */

  function loadPlanet(planet, carry = null) {
    state.planet = planet;
    state.cycle = state.mode === 'campaign' ? state.planetIndex + 1 : state.cycle;
    state.resources = {
      metal: BASE_RESOURCES.metal + (carry ? Math.min(42, Math.floor((carry.metal || 0) * 0.2)) : 0),
      ice: BASE_RESOURCES.ice + (carry ? Math.min(24, Math.floor((carry.ice || 0) * 0.2)) : 0),
      crystal: BASE_RESOURCES.crystal + (carry ? Math.min(18, Math.floor((carry.crystal || 0) * 0.2)) : 0)
    };
    state.rocket = { stage: 0, choices: [], correct: 0 };
    state.stats = { mined: 0, built: 0, correct: 0, choices: 0 };
    state.elapsed = 0;
    state.launching = false;
    state.launchT = 0;
    state.nextEventAt = 55 + Math.random() * 25;
    state.activeEvents = [];
    state.lastEvent = null;
    state.collecting = null;
    state.offloadT = 0;
    state.nearPad = null;
    state.nearNode = null;
    state.pads = [];
    state.nodes = [];
    state.labels = [];
    buildSurface(planet);
    state.view = 'surface';
    ui.hud.classList.remove('planet-view');
    ui.view.innerHTML = '星球俯瞰 <kbd>V</kbd>';
    camera.fov = 52;
    camera.up.set(0, 1, 0);
    camera.updateProjectionMatrix();
    updateHud();
    ui.hud.classList.remove('is-launching');
    setPrompt(null);
    ui.modal.hidden = true;
    ui.complete.hidden = true;
    state.modalOpen = false;
    state.phase = 'play';
    state.running = false;
    state.cinematic = 'landing';
    state.landingT = 0;
    ui.hud.hidden = true;
    ui.landing.hidden = false;
    startLandingCinematic(planet, carry);
  }

  function buildSurface(planet) {
    clearWorld();
    scene.background = new THREE.Color(planet.sky);
    scene.fog = new THREE.FogExp2(planet.sky, 0.013);
    hemi.color = new THREE.Color(0x9fc8ff);
    hemi.groundColor = new THREE.Color(planet.sky);
    sun.intensity = planet.key === 'frost' ? 0.75 : 1.15;
    sun.color = new THREE.Color(planet.key === 'rubra' ? 0xffc089 : 0xd7e7ff);
    const g = new THREE.Group();
    state.worldGroup = g;
    scene.add(g);
    state.surfaceGroup = new THREE.Group();
    state.undergroundGroup = new THREE.Group();
    state.terrainGroup = new THREE.Group();
    g.add(state.terrainGroup);
    g.add(state.surfaceGroup);
    g.add(state.undergroundGroup);
    state.undergroundGroup.visible = false;
    state.undergroundGroup.add(createUndergroundCave(planet));

    state.baseCore = createBaseCore(planet);
    state.baseCore.userData.isCore = true;
    state.surfaceGroup.add(state.baseCore);
    state.surfaceGroup.add(createDistantPlanet(planet));
    createPads(state.surfaceGroup, planet);
    createNodes(state.surfaceGroup, planet);
    addRocks(state.surfaceGroup, planet);
    createLaunchPad(state.surfaceGroup);
    createRover(state.surfaceGroup);
    createLander(state.surfaceGroup, planet);
    state.rover.position.set(ROVER_START.x, terrainHeight(ROVER_START.x, ROVER_START.z, planet) + 0.58, ROVER_START.z);
    initTerrainChunks(planet);
    computeNetwork();
    rebuildNetworkVisuals();
    refreshAllPadLabels();
    camera.position.set(21, 28, 33);
    camera.lookAt(state.rover.position.x, state.rover.position.y + 1, state.rover.position.z);
    updateRocketVisual();
  }

  function clearWorld() {
    if (state.worldGroup) {
      removeGroup(state.worldGroup);
      state.worldGroup = null;
    }
    if (state.titleGroup) {
      removeGroup(state.titleGroup);
      state.titleGroup = null;
    }
    state.rover = null;
    state.rocketMesh = null;
    state.surfaceGroup = null;
    state.undergroundGroup = null;
    state.terrainGroup = null;
    state.baseCore = null;
    state.lineEdit = false;
    state.linePick = null;
    state.networkGroup = null;
    state.linkFlows = [];
    state.collectorBots = [];
    state.chunks.clear();
    state.terrainMaterial = null;
    state.chunkT = 0;
    state.labels = [];
    ui.labels.innerHTML = '';
  }

  function removeGroup(group) {
    if (!group) return;
    scene.remove(group);
    group.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach(m => m.dispose());
      }
    });
  }

  function ensureCraters(planet) {
    if (planet.craters) return planet.craters;
    const rng = seededRandom(planet.seed * 41 + 23);
    const craters = [];
    for (let i = 0; i < 4; i++) {
      const a = rng() * TAU;
      const r = 14 + rng() * 20;
      craters.push({
        x: Math.cos(a) * r,
        z: Math.sin(a) * r,
        radius: 4.2 + rng() * 5.2,
        depth: 1.0 + rng() * 2.0
      });
    }
    planet.craters = craters;
    return craters;
  }

  function hash2(ix, iz, seed) {
    let h = Math.imul(ix | 0, 374761393) + Math.imul(iz | 0, 668265263) + Math.imul(seed | 0, 1442695041);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }

  function craterHeight(x, z, planet) {
    const cell = 38;
    const gx = Math.floor(x / cell);
    const gz = Math.floor(z / cell);
    let h = 0;
    for (let ox = -1; ox <= 1; ox++) {
      for (let oz = -1; oz <= 1; oz++) {
        const cxCell = gx + ox;
        const czCell = gz + oz;
        const pick = hash2(cxCell, czCell, planet.seed * 13 + 1);
        if (pick < 0.52) continue;
        const cx = (cxCell + 0.2 + hash2(cxCell, czCell, planet.seed * 17 + 2) * 0.6) * cell;
        const cz = (czCell + 0.2 + hash2(cxCell, czCell, planet.seed * 19 + 3) * 0.6) * cell;
        const radius = 3.0 + hash2(cxCell, czCell, planet.seed * 23 + 4) * 4.8;
        const depth = 0.6 + hash2(cxCell, czCell, planet.seed * 29 + 5) * 1.5;
        const d = Math.hypot(x - cx, z - cz);
        if (d < radius * 1.5) {
          const bowl = Math.max(0, 1 - Math.pow(d / radius, 2));
          h -= depth * bowl * bowl;
          h += Math.exp(-Math.pow((d - radius) / 0.9, 2)) * depth * 0.2;
        }
      }
    }
    return h;
  }

  function terrainHeight(x, z, planet) {
    const r = Math.hypot(x, z);
    const seed = planet.seed * 0.11;
    const flatten = smoothstep(7, 16, r);
    const n1 = Math.sin(x * 0.19 + seed) * Math.cos(z * 0.16 - seed * 0.7) * 1.35;
    const n2 = Math.sin((x + z) * 0.37 + seed * 1.4) * 0.40;
    const n3 = Math.cos((x - z) * 0.53 + seed * 2.1) * 0.22;
    const macro = Math.sin(x * 0.033 + seed * 0.9) * Math.cos(z * 0.039 - seed * 1.4) * 1.25;
    const detail = Math.sin(x * 0.73 + z * 0.61 + seed * 3.2) * 0.12 + Math.cos(x * 1.17 - z * 0.91 + seed) * 0.06;
    const ridge = Math.pow(Math.abs(Math.sin(x * 0.13 + z * 0.17 + seed * 2.7)), 3) * 0.62;
    let y = (n1 + n2 + n3 + macro + detail + ridge) * (0.26 + flatten * 0.9);
    y += craterHeight(x, z, planet) * (0.16 + flatten * 0.84);
    return y - (1 - flatten) * 0.14;
  }

  function createTerrain(planet) {
    const R = 46;
    const RINGS = 56;
    const SEGS = 132;
    const positions = [];
    const colors = [];
    const indices = [];
    const base = new THREE.Color(planet.color);
    const accent = new THREE.Color(planet.accent);
    const dark = base.clone().multiplyScalar(0.44);
    const centerH = terrainHeight(0, 0, planet);
    positions.push(0, centerH, 0);
    colors.push(base.r, base.g, base.b);
    for (let i = 1; i <= RINGS; i++) {
      const r = (R * i) / RINGS;
      for (let j = 0; j < SEGS; j++) {
        const a = (j / SEGS) * TAU;
        const x = Math.cos(a) * r;
        const z = Math.sin(a) * r;
        const y = terrainHeight(x, z, planet);
        positions.push(x, y, z);
        const heightN = clamp((y + 1.2) / 6.5, 0, 1);
        const noise = 0.5 + 0.5 * Math.sin(x * 0.23 + z * 0.18 + planet.seed);
        const c = dark.clone().lerp(base, clamp(0.25 + heightN * 0.65 + noise * 0.16, 0, 1));
        if (heightN > 0.72 && noise > 0.58) c.lerp(accent, 0.35);
        colors.push(c.r, c.g, c.b);
      }
    }
    const ringStart = 1;
    for (let j = 0; j < SEGS; j++) {
      indices.push(0, ringStart + (j + 1) % SEGS, ringStart + j);
    }
    for (let i = 1; i < RINGS; i++) {
      const a = 1 + (i - 1) * SEGS;
      const b = 1 + i * SEGS;
      for (let j = 0; j < SEGS; j++) {
        const j2 = (j + 1) % SEGS;
        indices.push(a + j, b + j2, b + j);
        indices.push(a + j, a + j2, b + j2);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.96, metalness: 0.02, flatShading: true });
    const mesh = new THREE.Mesh(geo, mat);
    const group = new THREE.Group();
    group.add(mesh);
    const skirt = new THREE.Mesh(
      new THREE.CylinderGeometry(R, R - 2.2, 5, 64, 1, true),
      new THREE.MeshStandardMaterial({ color: dark, roughness: 1, flatShading: true, side: THREE.DoubleSide })
    );
    skirt.position.y = -2.7;
    group.add(skirt);
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(R - 0.25, 0.32, 5, 64),
      new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 0.22, roughness: 0.7 })
    );
    rim.position.y = 2.4;
    rim.rotation.x = Math.PI / 2;
    group.add(rim);
    return group;
  }

  function chunkKey(cx, cz) {
    return `${cx},${cz}`;
  }

  function updateChunkNodeVisibility() {
    for (const node of state.nodes) {
      if (node.chunkKey && node.mesh) node.mesh.visible = state.view !== 'orbit';
    }
  }

  function createChunk(cx, cz) {
    const planet = state.planet;
    const base = new THREE.Color(planet.color);
    const accent = new THREE.Color(planet.accent);
    const dark = base.clone().multiplyScalar(0.42);
    const positions = [];
    const colors = [];
    const indices = [];
    const originX = cx * CHUNK_SIZE;
    const originZ = cz * CHUNK_SIZE;
    for (let iz = 0; iz <= CHUNK_SEG; iz++) {
      for (let ix = 0; ix <= CHUNK_SEG; ix++) {
        const x = originX + (ix / CHUNK_SEG) * CHUNK_SIZE;
        const z = originZ + (iz / CHUNK_SEG) * CHUNK_SIZE;
        const y = terrainHeight(x, z, planet);
        positions.push(x, y, z);
        const heightN = clamp((y + 1.6) / 7.2, 0, 1);
        const noise = 0.5 + 0.5 * Math.sin(x * 0.23 + z * 0.18 + planet.seed);
        const c = dark.clone().lerp(base, clamp(0.24 + heightN * 0.66 + noise * 0.16, 0, 1));
        if (heightN > 0.72 && noise > 0.56) c.lerp(accent, 0.34);
        colors.push(c.r, c.g, c.b);
      }
    }
    for (let iz = 0; iz < CHUNK_SEG; iz++) {
      for (let ix = 0; ix < CHUNK_SEG; ix++) {
        const a = iz * (CHUNK_SEG + 1) + ix;
        const b = a + 1;
        const c = a + CHUNK_SEG + 1;
        const d = c + 1;
        indices.push(a, c, b, b, c, d);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, state.terrainMaterial);
    const group = new THREE.Group();
    group.add(mesh);
    state.terrainGroup.add(group);
    const key = chunkKey(cx, cz);
    const chunk = { key, cx, cz, group, mesh, nodes: [] };
    const centerX = (cx + 0.5) * CHUNK_SIZE;
    const centerZ = (cz + 0.5) * CHUNK_SIZE;
    const dist = Math.hypot(centerX, centerZ);
    const rng = seededRandom(((cx * 73856093) ^ (cz * 19349663) ^ (planet.seed * 83492791)) >>> 0);
    if (dist > 38) {
      const count = 6;
      const rockGeo = new THREE.DodecahedronGeometry(0.45, 0);
      const rockMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.98, metalness: 0.02, flatShading: true });
      const rocks = new THREE.InstancedMesh(rockGeo, rockMat, count);
      const dummy = new THREE.Object3D();
      const color = new THREE.Color();
      const hsl = {};
      base.getHSL(hsl);
      for (let i = 0; i < count; i++) {
        const x = originX + (0.08 + rng() * 0.84) * CHUNK_SIZE;
        const z = originZ + (0.08 + rng() * 0.84) * CHUNK_SIZE;
        const scale = 0.2 + rng() * 1.0;
        dummy.position.set(x, terrainHeight(x, z, planet) + scale * 0.2, z);
        dummy.rotation.set(rng() * TAU, rng() * TAU, rng() * TAU);
        dummy.scale.set(scale * (0.7 + rng() * 0.6), scale * (0.45 + rng() * 0.5), scale * (0.7 + rng() * 0.5));
        dummy.updateMatrix();
        rocks.setMatrixAt(i, dummy.matrix);
        color.setHSL(hsl.h, 0.10 + rng() * 0.08, 0.26 + rng() * 0.12);
        rocks.setColorAt(i, color);
      }
      if (rocks.instanceColor) rocks.instanceColor.needsUpdate = true;
      rocks.frustumCulled = false;
      group.add(rocks);
      chunk.rocks = rocks;
      if (dist > 44 && rng() < 0.35) {
        const type = ['metal', 'ice', 'crystal'][Math.floor(rng() * 3)];
        const x = originX + (0.16 + rng() * 0.68) * CHUNK_SIZE;
        const z = originZ + (0.16 + rng() * 0.68) * CHUNK_SIZE;
        const y = terrainHeight(x, z, planet);
        const node = {
          type, x, z, y,
          amount: 4 + Math.floor(rng() * 5),
          cooldown: 0,
          mesh: null,
          near: false,
          chunkKey: key
        };
        const ng = createNodeMesh(type, planet);
        ng.position.set(x, y + 0.25, z);
        ng.visible = state.view !== 'orbit';
        group.add(ng);
        node.mesh = ng;
        chunk.nodes.push(node);
        state.nodes.push(node);
      }
    }
    state.chunks.set(key, chunk);
  }

  function removeChunk(key) {
    const chunk = state.chunks.get(key);
    if (!chunk) return;
    for (const node of chunk.nodes) {
      const i = state.nodes.indexOf(node);
      if (i >= 0) state.nodes.splice(i, 1);
      if (state.nearNode === node) state.nearNode = null;
    }
    if (state.nearNode && state.nearNode.chunkKey === key) state.nearNode = null;
    if (chunk.group.parent) chunk.group.parent.remove(chunk.group);
    chunk.group.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material && obj.material !== state.terrainMaterial) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach(m => m.dispose());
      }
    });
    state.chunks.delete(key);
  }

  function updateChunks(force = false) {
    if (!state.worldGroup || !state.planet || !state.rover) return;
    const needed = new Set();
    const addAround = (x, z, radius) => {
      const cx = Math.floor(x / CHUNK_SIZE);
      const cz = Math.floor(z / CHUNK_SIZE);
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dz = -radius; dz <= radius; dz++) needed.add(chunkKey(cx + dx, cz + dz));
      }
    };
    addAround(0, 0, BASE_CHUNK_RADIUS);
    addAround(state.rover.position.x, state.rover.position.z, CHUNK_RADIUS);
    for (const key of [...state.chunks.keys()]) {
      if (!needed.has(key)) removeChunk(key);
    }
    for (const key of needed) {
      if (state.chunks.has(key)) continue;
      const [cx, cz] = key.split(',').map(Number);
      createChunk(cx, cz);
    }
    state.chunkT = 0;
  }

  function initTerrainChunks(planet) {
    state.terrainMaterial = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.96, metalness: 0.02, flatShading: true });
    state.chunks.clear();
    updateChunks(true);
  }

  function createBaseCore(planet) {
    const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 4.2, 0.9, 6), mat(0x111827, 0x0b1220, 0.45));
    base.position.y = 0.45;
    g.add(base);
    const inner = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.6, 0.35, 6), mat(0x25324c, 0x0a1220, 0.3));
    inner.position.y = 1.03;
    g.add(inner);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.75, 0.06, 6, 6), new THREE.MeshBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 0.8 }));
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 1.25;
    g.add(ring);
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.22, 3.4, 5), mat(0x50627c, 0x0b1726, 0.3));
    tower.position.y = 2.2;
    g.add(tower);
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 6), new THREE.MeshBasicMaterial({ color: 0xf5c96b }));
    beacon.position.y = 4.05;
    g.add(beacon);
    const glow = new THREE.PointLight(0x67e8f9, 0.7, 16, 2);
    glow.position.y = 3;
    g.add(glow);
    // 大型物资存放中心：环绕中心基地的仓储罐
    const tankColors = [0xf2b56d, 0x7dd3fc, 0xc4b5fd];
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * TAU + 0.4;
      const tank = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.1, 2.4, 8), mat(0x2b3548, 0x0c1424, 0.4));
      tank.position.set(Math.cos(a) * 3.3, 1.2, Math.sin(a) * 3.3);
      g.add(tank);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.34, 0.5, 6), mat(tankColors[i], 0x1a1208, 0.25));
      cap.position.set(Math.cos(a) * 3.3, 2.6, Math.sin(a) * 3.3);
      g.add(cap);
      const stripe = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.04, 4, 12), new THREE.MeshBasicMaterial({ color: tankColors[i], transparent: true, opacity: 0.8 }));
      stripe.rotation.x = Math.PI / 2;
      stripe.position.set(Math.cos(a) * 3.3, 1.4, Math.sin(a) * 3.3);
      g.add(stripe);
    }
    g.position.y = terrainHeight(0, 0, planet);
    return g;
  }

  function createUndergroundCave(planet) {
    const g = new THREE.Group();
    const rock = mat(0x1c2736, 0x070d15, 0.6);
    const edge = new THREE.MeshBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 0.4 });
    const lampMat = new THREE.MeshBasicMaterial({ color: 0xffd28a });
    const step = 12;
    const len = 72;
    const chambers = [];
    for (let z = -24; z <= 24; z += step) {
      const tunnel = new THREE.Mesh(new THREE.BoxGeometry(len, 2.6, 2.6), rock);
      tunnel.position.set(0, 0, z);
      g.add(tunnel);
      const strip = new THREE.Mesh(new THREE.BoxGeometry(len, 0.06, 0.06), edge);
      strip.position.set(0, 1.15, z);
      g.add(strip);
      for (let x = -30; x <= 30; x += 15) {
        const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.16, 6, 4), lampMat);
        lamp.position.set(x, 1.05, z);
        g.add(lamp);
      }
    }
    for (let x = -24; x <= 24; x += step) {
      const tunnel = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.6, len), rock);
      tunnel.position.set(x, 0, 0);
      g.add(tunnel);
      const strip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, len), edge);
      strip.position.set(x, 1.15, 0);
      g.add(strip);
      for (let z = -30; z <= 30; z += 15) {
        const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.16, 6, 4), lampMat);
        lamp.position.set(x, 1.05, z);
        g.add(lamp);
      }
    }
    for (let x = -24; x <= 24; x += step) {
      for (let z = -24; z <= 24; z += step) {
        const chamber = new THREE.Mesh(new THREE.SphereGeometry(2.6, 8, 5), rock);
        chamber.position.set(x, 0, z);
        g.add(chamber);
        chambers.push({ x, z });
        if ((Math.abs(x) + Math.abs(z)) % 24 === 0) {
          const crystal = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.7, 5), mat(0xc4b5fd, 0x5b3b9a, 0.3));
          crystal.position.set(x, 0.85, z);
          g.add(crystal);
          const light = new THREE.PointLight(0xc4b5fd, 0.5, 6, 2);
          light.position.set(x, 0.5, z);
          g.add(light);
        }
      }
    }
    [[-24, -24], [24, 24], [-24, 24]].forEach(([x, z]) => {
      const riser = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.9, 5.5, 8), rock);
      riser.position.set(x, 2.7, z);
      g.add(riser);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.05, 5, 16), new THREE.MeshBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 0.6 }));
      ring.rotation.x = Math.PI / 2;
      ring.position.set(x, 5.4, z);
      g.add(ring);
    });
    const floor = new THREE.Mesh(new THREE.BoxGeometry(84, 0.5, 84), rock);
    floor.position.set(0, -1.55, 0);
    g.add(floor);
    const ambientLight = new THREE.PointLight(0x7fb7ff, 0.9, 44, 2);
    ambientLight.position.set(0, 1.2, 0);
    g.add(ambientLight);
    g.userData.chambers = chambers;
    g.position.set(0, -5, 0);
    return g;
  }

  function createDistantPlanet(planet) {
    const g = new THREE.Group();
    const mat0 = new THREE.MeshStandardMaterial({ color: new THREE.Color(planet.color).multiplyScalar(0.75), roughness: 0.9, flatShading: true, transparent: true, opacity: 0.8 });
    const sphere = new THREE.Mesh(new THREE.IcosahedronGeometry(11, 1), mat0);
    g.add(sphere);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(15, 0.12, 5, 64), new THREE.MeshBasicMaterial({ color: new THREE.Color(planet.accent), transparent: true, opacity: 0.24 }));
    ring.rotation.x = Math.PI / 2.4;
    g.add(ring);
    g.position.set(-58, 30, -88);
    return g;
  }

  function createPads(group, planet) {
    const sites = sitePlan(planet);
    const spots = [
      { x: 20.28, z: 5.44 },
      { x: -14.85, z: 14.85 },
      { x: -5.44, z: -20.28 }
    ];
    spots.slice(0, DEFAULT_SLOT_COUNT).forEach((spot, i) => {
      createPadAt(spot.x, spot.z, sites[i % sites.length]);
    });
  }

  function createPadAt(x, z, siteId) {
    const planet = state.planet;
    const y = terrainHeight(x, z, planet);
    const i = state.pads.length;
    const pad = { index: i, x, z, y, site: siteId, module: null, mesh: null, label: null, group: null, near: false, construction: null, linkOverride: null, storage: { metal: 0, ice: 0, crystal: 0 }, full: false };
    const pg = createPadMesh(planet, pad.site);
    pg.userData.padIndex = i;
    pg.position.set(x, y + 0.2, z);
    state.surfaceGroup.add(pg);
    pad.group = pg;
    const label = document.createElement('button');
    label.type = 'button';
    label.className = 'pad-label empty';
    label.innerHTML = `<span class="pad-dot"></span><b>空置地块 ${pad2(i + 1)}</b><small>${siteTypeOf(pad).label} · 点击建造</small>`;
    label.addEventListener('click', () => openBuildPanel(pad));
    ui.labels.appendChild(label);
    pad.label = label;
    state.pads.push(pad);
    state.labels.push({ el: label, pad });
    return pad;
  }

  function randomSite() {
    const keys = Object.keys(SITE_TYPES);
    return keys[Math.floor(Math.random() * keys.length)];
  }

  function slotCost() {
    return { metal: 3, ice: 3, crystal: 3 };
  }

  function addBuildSlot() {
    if (!state.rover || state.view !== 'surface') return;
    if (state.phase !== 'play' || state.launching || state.modalOpen || state.cinematic || state.collecting) return;
    if (state.mode === 'campaign' && state.pads.length >= MAX_SLOTS) { toast('地块已达上限 20', 'gold'); return; }
    const cost = slotCost();
    if (!canAfford(cost)) { toast('资源不足', 'gold'); return; }
    const x = state.rover.position.x;
    const z = state.rover.position.z;
    const link = nearestNetworkNode({ x, z });
    if (!link) { toast('离产线太远 · 先向这里延伸一个地块', 'gold'); return; }
    if (Math.hypot(x, z) < 10) { toast('离中心基地太近', 'gold'); return; }
    for (const p of state.pads) {
      if (Math.hypot(p.x - x, p.z - z) < 6) { toast('离现有地块太近', 'gold'); return; }
    }
    for (const [k, v] of Object.entries(cost)) state.resources[k] -= v;
    createPadAt(x, z, randomSite());
    computeNetwork();
    rebuildNetworkVisuals();
    refreshAllPadLabels();
    updateHud();
    toast('地块已放置', 'gold');
    evaluateObjective();
  }

  function createPadMesh(planet, siteId) {
    const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.45, 0.38, 6), mat(0x202b3d, 0x0a1220, 0.45));
    base.position.y = 0.19;
    g.add(base);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(1.85, 2.0, 0.10, 6), mat(0x33445c, 0x0b1424, 0.25));
    top.position.y = 0.43;
    g.add(top);
    const site = SITE_TYPES[siteId] || SITE_TYPES.flat;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.7, 0.045, 5, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(site.color), transparent: true, opacity: 0.5 }));
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.51;
    g.add(ring);
    for (let i = 0; i < 3; i++) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.48, 0.12), mat(0x50627c, 0x0b1726, 0.3));
      const a = (i / 3) * TAU;
      post.position.set(Math.cos(a) * 1.9, 0.58, Math.sin(a) * 1.9);
      g.add(post);
    }
    return g;
  }

  function addRocks(group, planet) {
    const rng = seededRandom(planet.seed * 67 + 9);
    const count = 130;
    const geo = new THREE.DodecahedronGeometry(0.45, 0);
    const material = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.98, metalness: 0.02, flatShading: true });
    const mesh = new THREE.InstancedMesh(geo, material, count);
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    const planetHsl = {};
    new THREE.Color(planet.color).getHSL(planetHsl);
    let placed = 0;
    let attempts = 0;
    while (placed < count && attempts < 900) {
      attempts++;
      const a = rng() * TAU;
      const r = 5 + rng() * 38;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      if (state.pads.some(p => Math.hypot(x - p.x, z - p.z) < 3.0)) continue;
      if (state.nodes.some(n => Math.hypot(x - n.x, z - n.z) < 1.8)) continue;
      if (Math.hypot(x - LAUNCH_POS.x, z - LAUNCH_POS.z) < 4.0) continue;
      const scale = 0.2 + rng() * 1.15;
      const y = terrainHeight(x, z, planet);
      dummy.position.set(x, y + scale * 0.22, z);
      dummy.rotation.set(rng() * TAU, rng() * TAU, rng() * TAU);
      dummy.scale.set(scale * (0.7 + rng() * 0.6), scale * (0.45 + rng() * 0.5), scale * (0.7 + rng() * 0.5));
      dummy.updateMatrix();
      mesh.setMatrixAt(placed, dummy.matrix);
      color.setHSL(planetHsl.h, 0.10 + rng() * 0.08, 0.26 + rng() * 0.12);
      mesh.setColorAt(placed, color);
      placed++;
    }
    mesh.count = placed;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.frustumCulled = false;
    group.add(mesh);
  }

  function createNodes(group, planet) {
    const rng = seededRandom(planet.seed * 13 + 7);
    const types = ['metal', 'ice', 'crystal'];
    const closeNodes = [
      { type: 'metal', x: 7, z: 5 },
      { type: 'ice', x: -8, z: 7 },
      { type: 'crystal', x: 9, z: 15 }
    ];
    const layout = closeNodes.slice();
    for (let i = 3; i < 12; i++) {
      const a = (i / 12) * TAU + rng() * 0.4;
      const r = 22 + rng() * 14;
      layout.push({ type: types[i % 3], x: Math.cos(a) * r, z: Math.sin(a) * r });
    }
    layout.forEach((item, i) => {
      const x = item.x, z = item.z;
      const y = terrainHeight(x, z, planet);
      const node = { type: item.type, x, z, y, amount: 5 + Math.floor(rng() * 5), cooldown: 0, mesh: null, near: false };
      const ng = createNodeMesh(item.type, planet);
      ng.position.set(x, y + 0.25, z);
      group.add(ng);
      node.mesh = ng;
      state.nodes.push(node);
    });
  }

  function createNodeMesh(type, planet) {
    const g = new THREE.Group();
    const colors = { metal: 0xf2b56d, ice: 0x7dd3fc, crystal: 0xc4b5fd };
    const c = colors[type];
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.9, 0), mat(0x3b3b4c, 0x11121c, 0.85));
    rock.scale.y = 0.65;
    g.add(rock);
    let core;
    if (type === 'ice') core = new THREE.Mesh(new THREE.OctahedronGeometry(0.72, 0), mat(c, c, 0.18, true));
    else if (type === 'crystal') core = new THREE.Mesh(new THREE.ConeGeometry(0.48, 1.45, 5), mat(c, c, 0.22, true));
    else core = new THREE.Mesh(new THREE.DodecahedronGeometry(0.62, 0), mat(c, c, 0.16, true));
    core.position.y = 0.66;
    core.rotation.z = 0.18;
    g.add(core);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.035, 4, 24), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.55 }));
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.42;
    g.add(ring);
    g.userData.core = core;
    g.userData.ring = ring;
    g.userData.type = type;
    return g;
  }

  function createLaunchPad(group) {
    const y = terrainHeight(LAUNCH_POS.x, LAUNCH_POS.z, state.planet);
    LAUNCH_POS.y = y;
    const g = new THREE.Group();
    const dark = mat(0x2d3a4f, 0x0a1422, 0.45);
    const steel = mat(0xdbe5f0, 0x23364d, 0.35);
    const gold = mat(0xf5c96b, 0x5b3c0d, 0.25);

    // 发射台底座（固定，不随火箭起飞）
    const base = new THREE.Mesh(new THREE.CylinderGeometry(3.3, 3.9, 0.6, 8), dark);
    base.position.y = 0.3;
    g.add(base);
    const platform = new THREE.Mesh(new THREE.CylinderGeometry(3.0, 3.1, 0.22, 8), steel);
    platform.position.y = 0.7;
    g.add(platform);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.9, 0.08, 6, 8), new THREE.MeshBasicMaterial({ color: 0xf5c96b, transparent: true, opacity: 0.62 }));
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.84;
    g.add(ring);
    [-1, 1].forEach(side => {
      const exhaust = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.18, 0.6), dark);
      exhaust.position.set(side * 1.8, 0.42, 0);
      g.add(exhaust);
    });

    // 服务塔（固定）
    [-2.1, 2.1].forEach(x => {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.16, 4.4, 0.16), steel);
      post.position.set(x, 2.2, 0);
      g.add(post);
    });
    const beamTop = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.14, 0.14), steel);
    beamTop.position.y = 4.3;
    g.add(beamTop);
    const beamMid = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.1, 0.1), gold);
    beamMid.position.y = 2.1;
    g.add(beamMid);
    const towerLight = new THREE.Mesh(new THREE.SphereGeometry(0.14, 6, 4), new THREE.MeshBasicMaterial({ color: 0xff6b6b }));
    towerLight.position.set(2.1, 4.4, 0);
    g.add(towerLight);

    g.position.set(LAUNCH_POS.x, y, LAUNCH_POS.z);
    group.add(g);
  }

  function createRover(group) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.45, 2.15), mat(0x64748b, 0x15253a, 0.32));
    body.position.y = 0.62;
    g.add(body);
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.55, 0.9), mat(0x9fb4cc, 0x0b1a2c, 0.2));
    cabin.position.set(0, 0.98, -0.18);
    g.add(cabin);
    const glass = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.25, 0.03), new THREE.MeshBasicMaterial({ color: 0x67e8f9 }));
    glass.position.set(0, 1.06, -0.64);
    g.add(glass);
    const wheelMat = mat(0x1e293b, 0x03070d, 0.85);
    [[-0.86, 0.36, -0.72], [0.86, 0.36, -0.72], [-0.86, 0.36, 0.72], [0.86, 0.36, 0.72]].forEach(([x, y, z]) => {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.22, 10), wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, y, z);
      g.add(wheel);
    });
    const dish = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 5, 0, TAU, 0, Math.PI / 2), mat(0xd9e5f5, 0x0b1726, 0.25));
    dish.rotation.x = -0.5;
    dish.position.set(0.52, 1.2, -0.1);
    g.add(dish);
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.8, 5), mat(0x94a3b8, 0x0b1726, 0.25));
    mast.position.set(0.52, 0.94, -0.1);
    g.add(mast);
    const antenna = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 4), new THREE.MeshBasicMaterial({ color: 0x67e8f9 }));
    antenna.position.set(0.52, 1.36, -0.1);
    g.add(antenna);
    const flag = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.55, 0.52), new THREE.MeshBasicMaterial({ color: 0xf5c96b }));
    flag.position.set(-0.2, 1.18, 0.8);
    g.add(flag);
    const lightMat = new THREE.MeshBasicMaterial({ color: 0xffe0a0 });
    [-0.42, 0.42].forEach(x => {
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.09, 0.06), lightMat);
      lamp.position.set(x, 0.69, -1.08);
      g.add(lamp);
    });
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 4), new THREE.MeshBasicMaterial({ color: 0x67e8f9 }));
    beacon.position.set(0, 1.36, -0.18);
    g.add(beacon);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 0.95, 5), mat(0x8fa3ba, 0x102033, 0.3));
    arm.rotation.x = Math.PI / 2.35;
    arm.position.set(0.42, 0.72, -1.02);
    g.add(arm);
    const sampleBox = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.24, 0.3), mat(0x50627c, 0x102033, 0.35));
    sampleBox.position.set(0.42, 0.5, -1.45);
    g.add(sampleBox);
    g.position.set(ROVER_START.x, 0, ROVER_START.z);
    g.scale.setScalar(1.3);
    g.userData.arm = arm;
    g.userData.sampleBox = sampleBox;
    group.add(g);
    state.rover = g;
  }

  function createLander(group, planet) {
    const baseY = terrainHeight(LANDING_POS.x, LANDING_POS.z, planet);
    state.landerBaseY = baseY;
    const g = new THREE.Group();
    const hull = mat(0xd9e3ee, 0x1d3144, 0.3);
    const dark = mat(0x263446, 0x07101a, 0.4);
    const gold = mat(0xf5c96b, 0x5b3c0d, 0.25);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(1.32, 1.12, 2.3, 8), hull);
    body.position.y = 2.55;
    g.add(body);
    const top = new THREE.Mesh(new THREE.ConeGeometry(1.32, 1.15, 8), hull);
    top.position.y = 4.28;
    g.add(top);
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(1.36, 1.4, 0.24, 8), gold);
    collar.position.y = 2.55;
    g.add(collar);
    const glass = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.34, 0.12), new THREE.MeshBasicMaterial({ color: 0x67e8f9 }));
    glass.position.set(0, 3.38, -1.08);
    g.add(glass);
    const hatch = new THREE.Mesh(new THREE.BoxGeometry(0.88, 1.0, 0.08), dark);
    hatch.position.set(0, 1.32, -1.18);
    g.add(hatch);
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.48, 0.06), gold);
    stripe.position.set(0, 1.55, -1.24);
    g.add(stripe);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * TAU + Math.PI / 4;
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.08, 2.0, 5), dark);
      leg.position.set(Math.cos(a) * 1.12, 1.1, Math.sin(a) * 1.12);
      leg.rotation.z = Math.cos(a) * 0.34;
      leg.rotation.x = -Math.sin(a) * 0.34;
      g.add(leg);
      const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 0.18, 6), dark);
      foot.position.set(Math.cos(a) * 1.75, 0.1, Math.sin(a) * 1.75);
      g.add(foot);
    }
    const engine = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.74, 0.48, 8), dark);
    engine.position.y = 1.1;
    g.add(engine);
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.62, 2.2, 8), new THREE.MeshBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 0.72 }));
    flame.rotation.x = Math.PI;
    flame.position.y = -0.15;
    g.add(flame);
    const rampPivot = new THREE.Group();
    rampPivot.position.set(0, 1.0, -1.28);
    const ramp = new THREE.Mesh(new THREE.BoxGeometry(1.28, 0.10, 2.6), dark);
    ramp.position.z = -1.3;
    rampPivot.add(ramp);
    const rampLight = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.03, 0.06), new THREE.MeshBasicMaterial({ color: 0x67e8f9 }));
    rampLight.position.set(0, 0.08, -2.42);
    rampPivot.add(rampLight);
    rampPivot.rotation.x = -1.18;
    g.add(rampPivot);
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 4), new THREE.MeshBasicMaterial({ color: 0xf5c96b }));
    beacon.position.set(0, 4.96, 0);
    g.add(beacon);
    g.position.set(LANDING_POS.x, baseY + 48, LANDING_POS.z);
    group.add(g);
    state.lander = g;
    state.landerRamp = rampPivot;
    state.landerFlame = flame;

    const dust = new THREE.Mesh(
      new THREE.TorusGeometry(2.8, 0.18, 5, 36),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(planet.accent), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })
    );
    dust.rotation.x = Math.PI / 2;
    dust.position.set(LANDING_POS.x, baseY + 0.25, LANDING_POS.z);
    group.add(dust);
    state.landerDust = dust;
    if (state.rover) {
      state.rover.position.set(LANDING_POS.x, baseY + 0.6, LANDING_POS.z - 2.6);
      state.rover.rotation.y = 0;
      state.rover.visible = false;
    }
  }

  /* ---------- rocket ---------- */

  function updateRocketVisual() {
    if (!state.worldGroup) return;
    if (state.rocketMesh) {
      state.worldGroup.remove(state.rocketMesh);
      disposeGroup(state.rocketMesh);
      state.rocketMesh = null;
    }
    const g = new THREE.Group();
    const stage = state.rocket.stage;
    const y = LAUNCH_POS.y || terrainHeight(LAUNCH_POS.x, LAUNCH_POS.z, state.planet);
    const steel = mat(0xe3ecf5, 0x23364d, 0.35);
    const dark = mat(0x2d3a4f, 0x0a1422, 0.5);
    const gold = mat(0xf5c96b, 0x5b3c0d, 0.25);
    const cyan = new THREE.MeshBasicMaterial({ color: 0x67e8f9 });
    const white = new THREE.MeshBasicMaterial({ color: 0xffffff });

    // 箭体（不含发射台/服务塔，发射时只有这部分升空）
    if (stage >= 1) {
      const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 0.55, 12), dark);
      skirt.position.y = 0.33;
      g.add(skirt);
      const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 2.3, 14), steel);
      tank.position.y = 1.7;
      g.add(tank);
      [0.62, 1.32, 2.12, 2.72].forEach((yy, i) => {
        const rib = new THREE.Mesh(new THREE.CylinderGeometry(0.715, 0.715, 0.055, 14), gold);
        rib.position.y = yy;
        g.add(rib);
      });
      // 舷窗
      for (let i = 0; i < 4; i++) {
        const a = i / 4 * TAU;
        const porthole = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 4), cyan);
        porthole.position.set(Math.cos(a) * 0.7, 2.55, Math.sin(a) * 0.7);
        g.add(porthole);
      }
    }
    if (stage >= 2) {
      const inter = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.7, 0.32, 12), dark);
      inter.position.y = 3.02;
      g.add(inter);
      const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.56, 1.6, 12), steel);
      upper.position.y = 3.95;
      g.add(upper);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.035, 4, 20), cyan);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 3.2;
      g.add(ring);
      for (let i = 0; i < 3; i++) {
        const a = i / 3 * TAU;
        const win = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 4), white);
        win.position.set(Math.cos(a) * 0.5, 4.35, Math.sin(a) * 0.5);
        g.add(win);
      }
    }
    if (stage >= 3) {
      const nose = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.3, 12), gold);
      nose.position.y = 5.35;
      g.add(nose);
      const noseBand = new THREE.Mesh(new THREE.CylinderGeometry(0.51, 0.51, 0.08, 12), white);
      noseBand.position.y = 4.85;
      g.add(noseBand);
      // 栅格翼 ×4
      for (let i = 0; i < 4; i++) {
        const a = i / 4 * TAU;
        const fin = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.55, 0.72), gold);
        fin.position.set(Math.cos(a) * 0.68, 2.35, Math.sin(a) * 0.68);
        fin.rotation.y = -a;
        fin.rotation.x = -0.35;
        g.add(fin);
      }
      // 发动机喷管 ×3
      for (let i = 0; i < 3; i++) {
        const a = i / 3 * TAU + 0.5;
        const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.21, 0.42, 8), dark);
        nozzle.position.set(Math.cos(a) * 0.34, -0.1, Math.sin(a) * 0.34);
        g.add(nozzle);
      }
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1.3, 8), new THREE.MeshBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 0.7 }));
      flame.position.y = -0.55;
      flame.rotation.x = Math.PI;
      g.add(flame);
      g.userData.flame = flame;
    }
    g.position.set(LAUNCH_POS.x, y + 0.55, LAUNCH_POS.z);
    state.rocketMesh = g;
    state.surfaceGroup.add(g);
  }

  function disposeGroup(group) {
    group.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach(m => m.dispose());
      }
    });
  }

  /* ---------- movement / update ---------- */

  function startLandingCinematic(planet, carry) {
    state.landingCarry = carry;
    state.cinematic = 'landing';
    state.landingT = 0;
    state.running = false;
    state.phase = 'play';
    ui.hud.hidden = true;
    ui.landing.hidden = false;
    ui.landing.classList.remove('is-impact');
    ui.landingPlanet.textContent = planet.name;
    ui.landingStatus.textContent = '进入大气层 · 反推点火';
    ui.landingPhase.textContent = 'APPROACH';
    ui.landingProgress.style.width = '0%';
    if (state.lander) {
      state.lander.position.y = state.landerBaseY + 48;
      if (state.landerRamp) state.landerRamp.rotation.x = -1.18;
      if (state.landerFlame) state.landerFlame.visible = true;
    }
    if (state.landerDust) {
      state.landerDust.material.opacity = 0;
      state.landerDust.scale.setScalar(1);
    }
    if (state.rover) {
      state.rover.visible = false;
      state.rover.position.set(LANDING_POS.x, terrainHeight(LANDING_POS.x, LANDING_POS.z, planet) + 0.6, LANDING_POS.z - 2.6);
      state.rover.rotation.y = 0;
    }
    camera.position.set(18, 31, 46);
    camera.lookAt(0, 20, LANDING_POS.z);
  }

  function updateLanding(dt) {
    state.landingT += dt;
    const t = state.landingT;
    if (!state.lander) {
      finishLanding();
      return;
    }
    const descent = 2.0;
    const p = clamp(t / descent, 0, 1);
    const ease = 1 - Math.pow(1 - p, 3);
    state.lander.position.y = state.landerBaseY + (1 - ease) * 48;
    if (state.landerFlame) {
      state.landerFlame.visible = t < descent + 0.12;
      state.landerFlame.scale.y = 0.75 + Math.sin(t * 32) * 0.22;
    }
    if (state.landerDust) {
      const dust = state.landerDust;
      dust.material.opacity = t > 1.15 && t < 3.2 ? 0.28 * (1 - clamp((t - 1.15) / 2.05, 0, 1)) : 0;
      dust.scale.setScalar(0.9 + clamp((t - 1.15) / 1.6, 0, 1) * 1.4);
    }
    const open = clamp((t - 2.0) / 0.7, 0, 1);
    if (state.landerRamp) state.landerRamp.rotation.x = -1.18 * (1 - open);
    if (state.rover) {
      state.rover.visible = t > 2.25;
      const roll = clamp((t - 2.3) / 1.55, 0, 1);
      const z = (LANDING_POS.z - 2.6) - roll * (LANDING_POS.z - 2.6 - ROVER_START.z);
      state.rover.position.z = z;
      state.rover.position.y = terrainHeight(state.rover.position.x, z, state.planet) + 0.58;
      state.rover.rotation.y = 0;
    }
    if (t < 2.05) {
      camera.position.lerp(new THREE.Vector3(17, 30, 46), 1 - Math.pow(0.002, dt));
      camera.lookAt(0, Math.max(5, state.lander.position.y + 2), LANDING_POS.z);
    } else {
      camera.position.lerp(new THREE.Vector3(15, 14, 34), 1 - Math.pow(0.002, dt));
      camera.lookAt(0, 2, 14);
    }
    if (t < 1.2) {
      ui.landingStatus.textContent = '进入大气层 · 反推点火';
      ui.landingPhase.textContent = 'APPROACH';
    } else if (t < descent) {
      ui.landingStatus.textContent = '着陆支架展开 · 姿态锁定';
      ui.landingPhase.textContent = 'TOUCHDOWN';
    } else if (t < 2.9) {
      ui.landingStatus.textContent = '舱门开启 · 释放勘探车';
      ui.landingPhase.textContent = 'ROVER DEPLOY';
      ui.landing.classList.add('is-impact');
    } else {
      ui.landingStatus.textContent = '建立前哨 · 系统自检';
      ui.landingPhase.textContent = 'OUTPOST';
    }
    ui.landingProgress.style.width = `${clamp(t / 4.2, 0, 1) * 100}%`;
    if (t >= 4.2) finishLanding();
  }

  function finishLanding() {
    if (state.cinematic !== 'landing') return;
    state.cinematic = null;
    state.landingT = 0;
    state.running = true;
    state.phase = 'play';
    state.elapsed = 0;
    ui.landing.hidden = true;
    ui.hud.hidden = false;
    if (state.lander) {
      state.lander.position.y = state.landerBaseY;
      if (state.landerRamp) state.landerRamp.rotation.x = 0;
      if (state.landerFlame) state.landerFlame.visible = false;
    }
    if (state.landerDust) state.landerDust.material.opacity = 0;
    if (state.rover) {
      state.rover.visible = true;
      state.rover.position.set(ROVER_START.x, terrainHeight(ROVER_START.x, ROVER_START.z, state.planet) + 0.58, ROVER_START.z);
      state.rover.rotation.y = 0;
    }
    camera.position.set(ROVER_START.x + 20, terrainHeight(ROVER_START.x, ROVER_START.z, state.planet) + 27, ROVER_START.z + 31);
    camera.lookAt(state.rover.position.x, state.rover.position.y + 1, state.rover.position.z);
    updateHud();
    updateNearby();
    setPrompt(null);
    toast(`着陆完成 · ${state.planet.name} 前哨已建立`, 'gold');
    if (state.landingCarry) {
      toast(`携带前一站 ${Math.floor((state.landingCarry.metal || 0) * 0.2)} 金属 · ${Math.floor((state.landingCarry.ice || 0) * 0.2)} 冰`, 'violet');
    }
    state.landingCarry = null;
    ui.landing.classList.remove('is-impact');
  }

  function updatePlay(dt) {
    if (!state.planet || !state.rover) return;
    if (state.cinematic === 'landing') {
      updateLanding(dt);
      return;
    }
    if (state.phase !== 'play') {
      updateCamera(dt);
      return;
    }
    if (state.launching) {
      updateLaunch(dt);
      updateCamera(dt);
      return;
    }
    const orbit = state.view === 'orbit';
    const underground = state.view === 'underground';
    if (!orbit && !underground && !state.modalOpen && ui.complete.hidden) {
      updateMovement(dt);
    }
    updateNodes(dt);
    updateConstruction(dt);
    updateModules(dt);
    updateModuleAnimations(dt);
    updateCollectorBots(dt);
    updateNetworkFlows(dt);
    updateCollection(dt);
    state.chunkT += dt;
    if (state.chunkT > 0.26) updateChunks();
    updateProduction(dt);
    updateRocketGlow(dt);
    if (orbit || underground) {
      setPrompt(null);
    } else if (!state.collecting) {
      state.nearT += dt;
      if (state.nearT > 0.14) {
        state.nearT = 0;
        updateNearby();
      }
    }
    updateLabels();
    updateCamera(dt);
    state.elapsed += dt;
    updateEvents();
    state.hudT += dt;
    if (state.hudT > 0.16) {
      state.hudT = 0;
      updateHud();
    }
  }

  function updateMovement(dt) {
    if (!state.running) return;
    let x = 0, z = 0;
    if (keys['w'] || keys['arrowup']) z -= 1;
    if (keys['s'] || keys['arrowdown']) z += 1;
    if (keys['a'] || keys['arrowleft']) x -= 1;
    if (keys['d'] || keys['arrowright']) x += 1;
    x += joystick.x;
    z += joystick.y;
    const len = Math.hypot(x, z);
    if (len > 0.12) {
      x /= Math.max(1, len);
      z /= Math.max(1, len);
      const nx = state.rover.position.x + x * ROVER_SPEED * dt;
      const nz = state.rover.position.z + z * ROVER_SPEED * dt;
      state.rover.position.x = nx;
      state.rover.position.z = nz;
      const targetYaw = Math.atan2(x, z);
      state.rover.rotation.y = angleLerp(state.rover.rotation.y, targetYaw, 1 - Math.pow(0.001, dt));
      const ground = terrainHeight(state.rover.position.x, state.rover.position.z, state.planet);
      state.rover.position.y = ground + 0.58 + Math.sin(state.elapsed * 15) * 0.025;
    } else {
      const ground = terrainHeight(state.rover.position.x, state.rover.position.z, state.planet);
      state.rover.position.y += (ground + 0.58 - state.rover.position.y) * 8 * dt;
    }
    updateNearby();
  }

  function updateNearby() {
    const p = state.rover.position;
    let node = null, nodeD = 3.3;
    for (const n of state.nodes) {
      if (n.cooldown > 0) continue;
      const d = Math.hypot(p.x - n.x, p.z - n.z);
      if (d < nodeD) { node = n; nodeD = d; }
    }
    let pad = null, padD = 4.9;
    for (const s of state.pads) {
      const d = Math.hypot(p.x - s.x, p.z - s.z);
      if (d < padD) { pad = s; padD = d; }
    }
    state.nearNode = node;
    state.nearPad = pad;
    for (const s of state.pads) s.near = s === pad;
    updateLabels();
    if (node) {
      setPrompt(`采集 ${node.type === 'metal' ? '金属' : node.type === 'ice' ? '冰' : '晶矿'} +${node.amount}`, false);
    } else if (pad) {
      setPrompt(pad.module ? `查看 ${MODULES[pad.module].name}` : `建设空置地块 ${pad2(pad.index + 1)}`, true);
    } else {
      setPrompt(null);
    }
  }

  function setPrompt(text, isBuild) {
    if (!text) {
      ui.prompt.hidden = true;
      ui.interact.hidden = true;
      return;
    }
    ui.prompt.hidden = false;
    ui.interact.hidden = false;
    ui.promptText.textContent = text;
    ui.promptIcon.textContent = isBuild ? '▣' : '◆';
    ui.interact.textContent = isBuild ? '建造' : '采集';
    const kbd = document.createElement('kbd');
    kbd.textContent = 'E';
    ui.interact.appendChild(kbd);
  }

  function interact() {
    if (state.launching || state.modalOpen) return;
    if (state.collecting) return;
    if (state.nearNode) {
      startCollecting(state.nearNode);
      return;
    }
    if (state.nearPad) {
      openBuildPanel(state.nearPad);
      return;
    }
    toast('靠近资源点或基地地块后互动', '');
  }

  function updateNodes(dt) {
    for (const n of state.nodes) {
      if (n.cooldown > 0) {
        n.cooldown -= dt;
        if (n.cooldown <= 0) {
          n.mesh.visible = true;
          n.mesh.scale.setScalar(0.01);
        }
      } else {
        if (n.mesh.visible && n.mesh.scale.x < 1) n.mesh.scale.lerp(new THREE.Vector3(1, 1, 1), dt * 5);
        if (n.mesh.userData.core) n.mesh.userData.core.rotation.y += dt * 0.8;
        if (n.mesh.userData.ring) n.mesh.userData.ring.rotation.z += dt * 0.4;
      }
    }
  }

  function updateModules(dt) {
    for (const pad of state.pads) {
      if (!pad.mesh) continue;
      const target = 1.12 + (moduleLevel(pad) - 1) * 0.08;
      if (pad.mesh.scale.x < target - 0.005) {
        pad.mesh.scale.lerp(new THREE.Vector3(target, target, target), 1 - Math.pow(0.001, dt));
      }
    }
  }

  function updateModuleAnimations(dt) {
    const t = state.elapsed;
    for (const pad of state.pads) {
      if (!pad.mesh || !pad.module || !pad.connected) continue;
      const a = pad.mesh.userData.anim;
      if (!a) continue;
      for (const s of a.spins) s.mesh.rotation[s.axis] += dt * s.speed;
      for (const b of a.bobs) b.mesh.position.y = b.base + Math.sin(t * b.speed) * b.amp;
      for (const p of a.pulses) p.mesh.scale.setScalar(p.base + Math.sin(t * p.speed) * p.amp);
      for (const d of a.drills) {
        d.mesh.position.y = d.base + Math.sin(t * d.speed) * d.amp;
        d.mesh.rotation.y += dt * 2.0;
      }
    }
  }

  const COLLECTOR_TYPES = { metal: true, ice: true, crystal: true, mine: true, harvester: true };
  const BOT_COLORS = { metal: 0xf2b56d, ice: 0x7dd3fc, crystal: 0xc4b5fd, mine: 0xfbbf24, harvester: 0x86efac };

  function botEase(t) {
    return t * t * (3 - 2 * t);
  }

  function createCollectorBot(kind) {
    const g = new THREE.Group();
    const color = BOT_COLORS[kind];
    const dark = mat(0x1f2a3a, 0x060c14, 0.5);
    if (kind === 'ice') {
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 5), mat(0xdff7ff, 0x1a6680, 0.25));
      g.add(body);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.03, 4, 12), new THREE.MeshBasicMaterial({ color }));
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.02;
      g.add(ring);
      const rotor = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.03, 0.05), mat(0x9fb4cc, 0x0b1726, 0.3));
      rotor.position.y = 0.24;
      g.add(rotor);
    } else if (kind === 'crystal') {
      const body = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.5, 5), mat(0xc4b5fd, 0x5b3b9a, 0.2, true));
      g.add(body);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.025, 4, 12), new THREE.MeshBasicMaterial({ color }));
      ring.rotation.x = Math.PI / 2;
      ring.position.y = -0.05;
      g.add(ring);
    } else {
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.22, 0.42), mat(0xcbd5e1, 0x1a2a3d, 0.3));
      body.position.y = 0.24;
      g.add(body);
      if (kind === 'mine') {
        const drill = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.5, 6), mat(color, 0x6b4514, 0.2));
        drill.rotation.x = Math.PI;
        drill.position.set(0, -0.05, 0.18);
        g.add(drill);
      } else if (kind === 'harvester') {
        const bucket = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.14, 0.2), mat(0x64748b, 0x15253a, 0.3));
        bucket.position.set(0, 0.1, 0.24);
        g.add(bucket);
      } else {
        const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.4, 4), mat(0xe2e8f0, 0x1b2b3d, 0.25));
        arm.rotation.z = -0.8;
        arm.position.set(0.16, 0.32, -0.1);
        g.add(arm);
      }
      [-0.16, 0.16].forEach(x => {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.07, 8), dark);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(x, 0.1, 0);
        g.add(wheel);
      });
    }
    const light = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 4), new THREE.MeshBasicMaterial({ color }));
    light.position.y = kind === 'ice' ? 0.22 : kind === 'crystal' ? 0.25 : 0.42;
    g.add(light);
    g.scale.setScalar(0.85);
    return g;
  }

  function ensureMineShaft(pad) {
    if (pad.shaft) return pad.shaft;
    const g = new THREE.Group();
    const dark = mat(0x101824, 0x050a12, 0.8);
    const mouth = new THREE.Vector3(pad.x + 1.7, pad.y + 0.05, pad.z + 0.4);
    const depth = 3.2;
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.7, depth, 10, 1, true), dark);
    tube.position.set(mouth.x, mouth.y - depth / 2, mouth.z);
    g.add(tube);
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.04, 12), new THREE.MeshBasicMaterial({ color: 0x050a12 }));
    disc.position.set(mouth.x, mouth.y + 0.015, mouth.z);
    g.add(disc);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.08, 5, 20), new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.85 }));
    rim.rotation.x = Math.PI / 2;
    rim.position.set(mouth.x, mouth.y + 0.02, mouth.z);
    g.add(rim);
    const depthBeacon = new THREE.Mesh(new THREE.SphereGeometry(0.14, 6, 4), new THREE.MeshBasicMaterial({ color: 0xfb923c }));
    depthBeacon.position.set(mouth.x, mouth.y - depth + 0.4, mouth.z);
    g.add(depthBeacon);
    state.surfaceGroup.add(g);
    const shaft = { group: g, mouth: mouth.clone(), bottom: new THREE.Vector3(mouth.x, mouth.y - depth + 0.5, mouth.z) };
    pad.shaft = shaft;
    return shaft;
  }

  function botTargetFor(bot) {
    if (bot.underground) return bot.shaft.mouth.clone();
    const want = bot.kind === 'metal' ? 'metal' : bot.kind === 'ice' ? 'ice' : bot.kind === 'crystal' ? 'crystal' : null;
    let best = null, bestD = 10;
    for (const n of state.nodes) {
      if (n.cooldown > 0) continue;
      if (want && n.type !== want) continue;
      const d = Math.hypot(n.x - bot.pad.x, n.z - bot.pad.z);
      if (d < bestD) { best = n; bestD = d; }
    }
    if (best) return new THREE.Vector3(best.x, best.y + 0.4, best.z);
    const a = Math.random() * TAU;
    const r = 3 + Math.random() * 3;
    const x = bot.pad.x + Math.cos(a) * r;
    const z = bot.pad.z + Math.sin(a) * r;
    return new THREE.Vector3(x, terrainHeight(x, z, state.planet) + 0.4, z);
  }

  function unloadPoint() {
    const wh = state.pads.find(p => p.module === 'warehouse' && p.connected);
    if (wh) return new THREE.Vector3(wh.x, wh.y + 1.2, wh.z);
    return new THREE.Vector3(0, terrainHeight(0, 0, state.planet) + 1.0, 0);
  }

  function makeCollectorBot(pad, kind) {
    const underground = kind === 'mine';
    const group = createCollectorBot(kind);
    const home = new THREE.Vector3(pad.x, pad.y + 1.15, pad.z);
    group.position.copy(home);
    if (underground) state.worldGroup.add(group);
    else state.surfaceGroup.add(group);
    const shaft = underground ? ensureMineShaft(pad) : null;
    const cavePoint = underground
      ? new THREE.Vector3(shaft.mouth.x * 0.35, -5.2, shaft.mouth.z * 0.35)
      : null;
    const bot = {
      pad, kind, underground, group, home,
      shaft, cavePoint,
      phase: 'out', t: 0, dur: 0,
      from: home.clone(), to: home.clone()
    };
    bot.to = botTargetFor(bot);
    bot.from.copy(home);
    bot.dur = 2.4;
    return bot;
  }

  function botGo(bot, to, dur, phase) {
    bot.from.copy(bot.group.position);
    bot.to.copy(to);
    bot.dur = dur;
    bot.t = 0;
    bot.phase = phase;
  }

  function botTransition(bot) {
    if (bot.phase === 'out') {
      if (bot.underground) botGo(bot, bot.cavePoint, 2.4, 'down');
      else { bot.phase = 'work'; bot.dur = 1.0; bot.t = 0; bot.to.copy(bot.group.position); bot.from.copy(bot.group.position); }
    } else if (bot.phase === 'down') {
      bot.phase = 'work'; bot.dur = 1.2; bot.t = 0;
    } else if (bot.phase === 'work') {
      if (bot.underground) botGo(bot, bot.shaft.mouth, 2.4, 'up');
      else botGo(bot, bot.home, 2.4, 'back');
    } else if (bot.phase === 'up') {
      botGo(bot, bot.home, 2.4, 'back');
    } else if (bot.phase === 'back') {
      bot.to = botTargetFor(bot);
      bot.from.copy(bot.group.position);
      bot.dur = 2.4;
      bot.t = 0;
      bot.phase = 'out';
    }
  }

  function syncCollectorBots() {
    const keep = [];
    for (const pad of state.pads) {
      if (!pad.module || !pad.connected) continue;
      if (!COLLECTOR_TYPES[pad.module]) continue;
      const existing = state.collectorBots.filter(b => b.pad === pad);
      while (existing.length < 2) {
        const bot = makeCollectorBot(pad, pad.module);
        state.collectorBots.push(bot);
        existing.push(bot);
      }
      keep.push(...existing);
    }
    for (const bot of state.collectorBots) {
      if (!keep.includes(bot)) {
        if (bot.group.parent) bot.group.parent.remove(bot.group);
        disposeGroup(bot.group);
      }
    }
    state.collectorBots = keep;
  }

  function updateCollectorBots(dt) {
    for (const bot of state.collectorBots) {
      if (bot.dur <= 0) { botTransition(bot); continue; }
      bot.t += dt / bot.dur;
      const k = Math.min(1, bot.t);
      bot.group.position.lerpVectors(bot.from, bot.to, botEase(k));
      if (bot.group.visible) {
        const dx = bot.to.x - bot.from.x, dz = bot.to.z - bot.from.z;
        if (Math.hypot(dx, dz) > 0.01) bot.group.rotation.y = Math.atan2(dx, dz);
      }
      if (bot.t >= 1) botTransition(bot);
    }
    for (const bot of state.collectorBots) {
      if (!bot.group.visible) continue;
      for (const other of state.collectorBots) {
        if (other === bot || !other.group.visible) continue;
        const dx = bot.group.position.x - other.group.position.x;
        const dy = bot.group.position.y - other.group.position.y;
        const dz = bot.group.position.z - other.group.position.z;
        const d = Math.hypot(dx, dy, dz);
        if (d > 0.0001 && d < 0.7) {
          const push = (0.7 - d) * 0.5;
          bot.group.position.x += (dx / d) * push;
          bot.group.position.z += (dz / d) * push;
        }
      }
    }
  }

  function startCollecting(node) {
    if (!node || node.cooldown > 0 || state.collecting) return;
    state.collecting = { node, t: 0, dur: 1.0 };
    state.running = false;
    ui.interact.hidden = true;
    ui.collectProgress.hidden = false;
    setPrompt('采集中…', false);
    updateHud();
  }

  function updateCollection(dt) {
    if (!state.collecting) return;
    const c = state.collecting;
    c.t += dt;
    const p = Math.min(1, c.t / c.dur);
    if (ui.collectFill) ui.collectFill.style.width = `${Math.round(p * 100)}%`;
    if (ui.promptText) ui.promptText.textContent = `采集 ${Math.round(p * 100)}%`;
    const rover = state.rover;
    if (rover && rover.userData.arm) {
      rover.userData.arm.rotation.z = -0.7 + Math.sin(p * Math.PI) * 0.55;
      rover.userData.sampleBox.position.y = 0.5 + Math.sin(p * Math.PI) * 0.22;
    }
    const node = c.node;
    if (node.mesh && node.mesh.userData.core) {
      node.mesh.userData.core.rotation.y += dt * 4;
      const s = 1 + Math.sin(c.t * 20) * 0.12;
      node.mesh.userData.core.scale.setScalar(s);
    }
    if (c.t >= c.dur) finishCollection();
  }

  function finishCollection() {
    const c = state.collecting;
    if (!c) return;
    const node = c.node;
    state.resources[node.type] += node.amount;
    state.stats.mined += node.amount;
    node.cooldown = 45;
    node.mesh.visible = false;
    if (node.mesh.userData.core) node.mesh.userData.core.scale.setScalar(1);
    state.collecting = null;
    state.running = true;
    ui.collectProgress.hidden = true;
    ui.interact.hidden = true;
    toast(`+${node.amount} ${node.type === 'metal' ? '金属' : node.type === 'ice' ? '冰' : '晶矿'}`, 'gold');
    state.nearNode = null;
    updateHud();
    setPrompt(null);
  }

  function padDistance(a, b) {
    return Math.hypot(a.x - b.x, a.z - b.z);
  }

  function coverageCount(pad, type) {
    const radius = type === 'software' ? 22 : 20;
    return state.pads.filter(p => p !== pad && p.module && p.connected && (p.module === 'metal' || p.module === 'ice' || p.module === 'crystal') && padDistance(pad, p) <= radius).length;
  }

  function updateProduction(dt) {
    const info = powerInfo();
    const softwarePads = state.pads.filter(p => p.module === 'software' && p.connected);
    const industryPads = state.pads.filter(p => p.module === 'industry' && p.connected);
    const warehouseBoost = hasConnectedModule('warehouse') ? 1.12 : 1;
    const rates = { metal: 0, ice: 0, crystal: 0 };

    for (const pad of state.pads) {
      if (!pad.module || !pad.connected) continue;
      const m = MODULES[pad.module];
      if (!m.rate) continue;
      let localBoost = warehouseBoost;
      const soft = softwarePads.find(s => padDistance(s, pad) <= 22);
      const ind = industryPads.find(s => padDistance(s, pad) <= 20);
      if (soft) localBoost *= 1.25 + 0.08 * (moduleLevel(soft) - 1);
      if (ind) localBoost *= 1.15 + 0.07 * (moduleLevel(ind) - 1);
      const siteMul = siteMultiplier(pad, pad.module);
      const cap = collectorCapacity(pad);
      if (!pad.storage) pad.storage = { metal: 0, ice: 0, crystal: 0 };
      let full = false;
      for (const key of Object.keys(m.rate)) {
        const richness = state.planet.traits[key] || 1;
        const prod = m.rate[key] * moduleOutputMultiplier(pad) * richness * siteMul * localBoost * info.factor * eventProdFactor(key);
        rates[key] += prod;
        pad.storage[key] = Math.min(cap, pad.storage[key] + prod * dt);
        if (pad.storage[key] >= cap - 0.001) full = true;
      }
      if (full !== pad.full) {
        pad.full = full;
        updatePadLabel(pad);
      }
    }

    // 中心基地每秒少量三种物资产出
    for (const key of Object.keys(BASE_CORE_RATE)) state.resources[key] += BASE_CORE_RATE[key] * dt;

    // 物资沿连接线向中心基地输送（仓储连接线速率远高于采集建筑）
    const lineRate = hasConnectedModule('warehouse') ? WAREHOUSE_LINE_RATE : COLLECTOR_LINE_RATE;
    for (const pad of state.pads) {
      if (!pad.module || !pad.connected || !pad.storage) continue;
      let anyFull = false;
      for (const key of Object.keys(pad.storage)) {
        const moved = Math.min(pad.storage[key], lineRate * dt);
        pad.storage[key] -= moved;
        state.resources[key] += moved;
        if (pad.storage[key] >= collectorCapacity(pad) - 0.001) anyFull = true;
      }
      if (anyFull !== pad.full) {
        pad.full = anyFull;
        updatePadLabel(pad);
      }
    }

    state.rates = rates;
    ui.powerChip.classList.toggle('bad', info.factor < 0.92);
    ui.statusPower.textContent = info.factor < 0.92 ? `供电不足 ${Math.round(info.factor * 100)}%` : '电力稳定';
    ui.statusPower.className = 'status-' + (info.factor < 0.92 ? 'warn' : 'good');
  }

  function togglePlanetView() {
    if (state.phase !== 'play' || state.launching || state.modalOpen || state.cinematic || state.collecting || state.view === 'underground') return;
    state.view = state.view === 'orbit' ? 'surface' : 'orbit';
    const orbit = state.view === 'orbit';
    updateChunkNodeVisibility();
    ui.hud.classList.toggle('planet-view', orbit);
    ui.view.innerHTML = orbit ? '返回地表 <kbd>V</kbd>' : '星球俯瞰 <kbd>V</kbd>';
    camera.fov = orbit ? 58 : 52;
    camera.up.set(0, orbit ? 0 : 1, orbit ? -1 : 0);
    camera.updateProjectionMatrix();
    if (scene.fog) scene.fog.density = orbit ? 0.0025 : 0.013;
    if (orbit) {
      setPrompt(null);
      ui.prompt.hidden = true;
      ui.interact.hidden = true;
      updateLabels();
      toast('轨道俯瞰 · 点击地块建造基地', 'gold');
    } else {
      toast('返回地表 · 继续驾驶勘探车', '');
    }
    updateHud();
  }

  function setUndergroundView(on) {
    if (!state.planet) return;
    if (on) {
      state.view = 'underground';
      state.surfaceGroup.visible = false;
      state.terrainGroup.visible = false;
      state.undergroundGroup.visible = true;
      ui.hud.classList.add('underground');
      ui.hud.classList.remove('planet-view');
      ui.underground.innerHTML = '返回地表 <kbd>U</kbd>';
      if (scene.fog) scene.fog.density = 0.02;
      setPrompt(null);
      ui.prompt.hidden = true;
      ui.interact.hidden = true;
      camera.up.set(0, 1, 0);
    } else {
      state.view = 'surface';
      state.surfaceGroup.visible = true;
      state.terrainGroup.visible = true;
      state.undergroundGroup.visible = false;
      ui.hud.classList.remove('underground');
      ui.underground.innerHTML = '地下视角 <kbd>U</kbd>';
      if (scene.fog) scene.fog.density = 0.013;
    }
    updateHud();
  }

  function toggleUnderground() {
    if (state.phase !== 'play' || state.launching || state.modalOpen || state.cinematic || state.collecting) return;
    setUndergroundView(state.view !== 'underground');
  }

  function updateCamera(dt) {
    if (!state.rover) return;
    if (state.launching) {
      const rocket = state.rocketMesh;
      const tx = rocket ? rocket.position.x : LAUNCH_POS.x;
      const ty = rocket ? rocket.position.y + 2.2 : LAUNCH_POS.y + 2;
      const tz = rocket ? rocket.position.z : LAUNCH_POS.z;
      const desired = new THREE.Vector3(tx + 9, ty + 8, tz - 13);
      camera.position.lerp(desired, 1 - Math.pow(0.002, dt));
      camera.lookAt(tx, ty, tz);
      return;
    }
    if (state.view === 'underground') {
      const desired = new THREE.Vector3(0, -4, 32);
      camera.position.lerp(desired, 1 - Math.pow(0.001, dt));
      camera.lookAt(0, -5, 0);
      return;
    }
    if (state.view === 'orbit') {
      const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      const distance = (48 / (tan * Math.min(1, camera.aspect))) * 1.06;
      const desired = new THREE.Vector3(0, distance, 0.01);
      camera.position.lerp(desired, 1 - Math.pow(0.0004, dt));
      camera.lookAt(0, 0, 0);
      return;
    }
    const p = state.rover.position;
    const desired = new THREE.Vector3(p.x + 20, p.y + 26, p.z + 31);
    camera.position.lerp(desired, 1 - Math.pow(0.002, dt));
    camera.lookAt(p.x, p.y + 1.05, p.z);
  }

  function updateLabels() {
    if (!state.labels.length) return;
    if (state.view === 'underground') {
      for (const item of state.labels) item.el.style.display = 'none';
      return;
    }
    const w = window.innerWidth, h = window.innerHeight;
    const v = new THREE.Vector3();
    for (const item of state.labels) {
      const pad = item.pad;
      v.set(pad.x, pad.y + 3.2, pad.z).project(camera);
      const visible = v.z < 1 && v.z > -1;
      item.el.style.display = visible ? 'flex' : 'none';
      if (!visible) continue;
      item.el.style.left = `${(v.x * 0.5 + 0.5) * w}px`;
      item.el.style.top = `${(-v.y * 0.5 + 0.5) * h}px`;
      item.el.classList.toggle('near', pad.near);
    }
  }

  function updateRocketGlow(dt) {
    if (!state.rocketMesh || !state.rocketMesh.userData.flame) return;
    const flame = state.rocketMesh.userData.flame;
    flame.scale.y = 0.8 + Math.sin(state.elapsed * 18) * 0.25;
    flame.material.opacity = 0.58 + Math.sin(state.elapsed * 22) * 0.15;
  }

  function updateLaunch(dt) {
    state.launchT += dt;
    if (state.rocketMesh) {
      state.rocketMesh.position.y += (2.2 + state.launchT * 5) * dt;
      state.rocketMesh.rotation.y += dt * 0.5;
    }
    if (state.launchT > 2.3) {
      state.launching = false;
      showComplete();
    }
  }

  /* ---------- events ---------- */

  function eventProdFactor(res) {
    let f = 1;
    for (const ev of state.activeEvents) {
      if (ev.mods.prod) f *= ev.mods.prod;
      if (ev.mods[res + 'Prod']) f *= ev.mods[res + 'Prod'];
    }
    return f;
  }

  function eventSolarFactor() {
    let f = 1;
    for (const ev of state.activeEvents) if (ev.mods.solar) f *= ev.mods.solar;
    return f;
  }

  function eventResearchDiscount() {
    let f = 1;
    for (const ev of state.activeEvents) if (ev.mods.research) f *= ev.mods.research;
    return f;
  }

  function triggerEvent() {
    const pool = EVENTS.filter(e => e.id !== state.lastEvent);
    if (!pool.length) return;
    const ev = pool[Math.floor(Math.random() * pool.length)];
    state.lastEvent = ev.id;
    state.nextEventAt = state.elapsed + 55 + Math.random() * 40;
    if (ev.kind === 'auto') {
      if (ev.gain) for (const [k, v] of Object.entries(ev.gain)) state.resources[k] += v;
      if (ev.mods) state.activeEvents.push({ id: ev.id, title: ev.title, icon: ev.icon, tone: ev.tone, mods: ev.mods, until: state.elapsed + ev.duration });
      toast(`${ev.icon} ${ev.title} · ${ev.desc}`, ev.tone === 'bad' ? 'violet' : 'gold');
      updateHud();
    } else {
      openEventModal(ev);
    }
  }

  function openEventModal(ev) {
    openModal('PLANET EVENT', `${ev.icon} ${ev.title}`, `
      <p class="modal-copy">${ev.desc}</p>
      <div class="event-options">
        <button class="ghost-btn" data-action="event-avoid" data-id="${ev.id}">${ev.avoidLabel}</button>
        <button class="launch-btn" data-action="event-accept" data-id="${ev.id}">${ev.acceptLabel}</button>
      </div>
    `);
  }

  function resolveEvent(id, choice) {
    const ev = EVENTS.find(e => e.id === id);
    if (!ev) return;
    if (choice === 'avoid') {
      if (ev.avoidCost) for (const [k, v] of Object.entries(ev.avoidCost)) state.resources[k] -= v;
      toast(`${ev.icon} ${ev.avoidToast}`, 'gold');
    } else {
      if (ev.mods) state.activeEvents.push({ id: ev.id, title: ev.title, icon: ev.icon, tone: ev.tone, mods: ev.mods, until: state.elapsed + ev.duration });
      toast(`${ev.icon} ${ev.title}生效`, ev.tone === 'bad' ? 'violet' : 'gold');
    }
    closeModal();
    updateHud();
  }

  function updateEvents() {
    state.activeEvents = state.activeEvents.filter(ev => ev.until > state.elapsed);
    if (state.phase !== 'play' || state.launching || state.modalOpen || state.cinematic) return;
    if (state.elapsed >= state.nextEventAt) triggerEvent();
  }

  function updateEventBanner() {
    const ev = state.activeEvents.length ? state.activeEvents[state.activeEvents.length - 1] : null;
    if (!ev) { ui.eventBanner.hidden = true; return; }
    const secs = Math.max(0, Math.ceil(ev.until - state.elapsed));
    ui.eventBanner.hidden = false;
    ui.eventBanner.className = 'event-banner ' + (ev.tone === 'bad' ? 'bad' : 'good');
    ui.eventBanner.textContent = `${ev.icon} ${ev.title} · ${secs}s`;
  }

  /* ---------- modules / power ---------- */

  function hasModule(type) {
    return state.pads.some(p => p.module === type);
  }

  function moduleCount(type) {
    return state.pads.filter(p => p.module === type).length;
  }

  function powerInfo() {
    let supply = BASE_POWER;
    let use = 0;
    for (const p of state.pads) {
      if (!p.module || !p.connected) continue;
      const m = MODULES[p.module];
      if (m.supply) supply += m.supply * LEVEL_SOLAR[moduleLevel(p) - 1] * (state.planet.traits.solar || 1) * siteMultiplier(p, 'solar') * eventSolarFactor();
      if (m.use) use += modulePowerUse(p);
    }
    const factor = use > supply ? Math.max(0.25, supply / use) : 1;
    return { supply: Math.round(supply * 10) / 10, use, factor };
  }

  function buildCost(type) {
    const m = MODULES[type];
    const discount = hasConnectedModule('industry') && type !== 'industry' ? 0.85 : 1;
    return Object.fromEntries(Object.entries(m.cost).map(([k, v]) => [k, Math.ceil(v * discount)]));
  }

  function canAfford(cost) {
    return Object.keys(cost).every(k => state.resources[k] >= cost[k]);
  }

  function isBuildingModule(type) {
    return state.pads.some(p => p.construction && p.construction.type === type);
  }

  function startConstruction(pad, type) {
    if (!pad || pad.module || pad.construction) return;
    if (!nearestNetworkNode(pad)) {
      toast('产线未接入 · 先向这个方向延伸一座中继模块', 'gold');
      return;
    }
    if (activeCrews() >= MAX_CREWS) {
      toast(`施工队已满 ${activeCrews()}/${MAX_CREWS} · 等待现有施工完成`, 'gold');
      return;
    }
    const m = MODULES[type];
    if (!m) return;
    if (m.unique && (hasModule(type) || isBuildingModule(type))) {
      toast('该模块全基地只能建造一座', '');
      return;
    }
    const cost = buildCost(type);
    if (!canAfford(cost)) { toast('资源不足', 'gold'); return; }
    for (const [k, v] of Object.entries(cost)) state.resources[k] -= v;
    pad.construction = {
      type,
      progress: 0,
      time: 0,
      duration: effectiveBuildTime(pad, type),
      site: createConstructionSite(pad, type),
      lastPct: -1
    };
    updatePadLabel(pad);
    closeModal();
    updateHud();
    toast(`施工机器人抵达 · ${m.name}${pad.site === 'flat' ? ' · 岩台加速' : ''}`, 'gold');
    evaluateObjective();
  }

  function finalizeConstruction(pad) {
    if (!pad || !pad.construction) return;
    const c = pad.construction;
    const type = c.type;
    const m = MODULES[type];
    if (c.site) {
      if (c.site.group.parent) c.site.group.parent.remove(c.site.group);
      disposeGroup(c.site.group);
    }
    pad.construction = null;
    pad.module = type;
    pad.level = 1;
    const mesh = createModuleMesh(type, m.color);
    mesh.position.set(pad.x, pad.y + 0.28, pad.z);
    mesh.scale.setScalar(0.01);
    pad.mesh = mesh;
    state.surfaceGroup.add(mesh);
    state.stats.built++;
    computeNetwork();
    rebuildNetworkVisuals();
    if (type === 'mine') ensureMineShaft(pad);
    syncCollectorBots();
    refreshAllPadLabels();
    updatePadLabel(pad);
    updateHud();
    toast(`施工完成 · ${m.name}`, 'gold');
    evaluateObjective();
  }

  function updateConstruction(dt) {
    for (const pad of state.pads) {
      const c = pad.construction;
      if (!c) continue;
      c.time += dt;
      c.progress = Math.min(1, c.progress + dt / c.duration);
      const site = c.site;
      if (site) {
        for (let i = 0; i < site.robots.length; i++) {
          const robot = site.robots[i];
          const a = c.time * (0.9 + i * 0.18) + robot.baseAngle;
          robot.group.position.x = Math.cos(a) * (1.1 + i * 0.18);
          robot.group.position.z = Math.sin(a) * (1.1 + i * 0.18);
          robot.group.position.y = 0.38 + Math.sin(c.time * 7 + i) * 0.05;
          robot.group.rotation.y = -a + Math.PI / 2;
          if (robot.arm) robot.arm.rotation.x = Math.sin(c.time * 5 + i) * 0.55;
        }
        if (site.holo) {
          site.holo.rotation.y += dt * 0.55;
          site.holo.scale.setScalar(0.7 + c.progress * 0.35 + Math.sin(c.time * 3) * 0.03);
          site.holo.material.opacity = 0.28 + c.progress * 0.3;
        }
        if (site.ring) site.ring.rotation.z += dt * 0.7;
        if (site.scaffold) site.scaffold.rotation.y += dt * 0.15;
      }
      const pct = Math.floor(c.progress * 100);
      if (pct !== c.lastPct) {
        c.lastPct = pct;
        updatePadLabel(pad);
      }
      if (c.progress >= 1) finalizeConstruction(pad);
    }
  }

  function createConstructionSite(pad, type) {
    const m = MODULES[type];
    const group = new THREE.Group();
    group.position.set(pad.x, pad.y + 0.28, pad.z);
    const color = new THREE.Color(m.color);
    const metal = mat(0x718096, 0x0c1726, 0.25);
    const scaffold = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * TAU;
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.09, 1.55, 0.09), metal);
      post.position.set(Math.cos(a) * 1.55, 0.8, Math.sin(a) * 1.55);
      scaffold.add(post);
    }
    const topRing = new THREE.Mesh(new THREE.TorusGeometry(1.55, 0.035, 4, 24), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.54 }));
    topRing.rotation.x = Math.PI / 2;
    topRing.position.y = 1.55;
    scaffold.add(topRing);
    group.add(scaffold);

    const holo = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(1.46, 1.4, 1.46)),
      new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.35 })
    );
    holo.position.y = 1.05;
    group.add(holo);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.35, 0.035, 4, 28),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.62 })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.36;
    group.add(ring);

    const robots = [];
    for (let i = 0; i < 4; i++) {
      const robot = createConstructionRobot(color);
      robot.baseAngle = (i / 4) * TAU;
      const arm = robot.group.userData.arm;
      group.add(robot.group);
      robots.push({ group: robot.group, baseAngle: robot.baseAngle, arm });
    }
    state.surfaceGroup.add(group);
    return { group, robots, holo, ring, scaffold };
  }

  function createConstructionRobot(color) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.23, 0.4), mat(0xcbd5e1, 0x1a2a3d, 0.3));
    body.position.y = 0.28;
    g.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 5), mat(0x475569, 0x0b1726, 0.3));
    head.position.y = 0.5;
    g.add(head);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 4), new THREE.MeshBasicMaterial({ color }));
    eye.position.set(0, 0.52, -0.13);
    g.add(eye);
    [-0.19, 0.19].forEach(x => {
      const track = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.08, 8), mat(0x1e293b, 0x03070d, 0.5));
      track.rotation.z = Math.PI / 2;
      track.position.set(x, 0.14, 0);
      g.add(track);
    });
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.45, 4), mat(0xe2e8f0, 0x1b2b3d, 0.2));
    arm.position.set(0.22, 0.34, -0.08);
    arm.rotation.z = -0.7;
    g.add(arm);
    g.userData.arm = arm;
    const light = new THREE.PointLight(color, 0.35, 3, 2);
    light.position.set(0, 0.55, -0.1);
    g.add(light);
    g.scale.setScalar(1.85);
    return { group: g };
  }

  function upgradeModule(pad) {
    if (!pad || !pad.module || !pad.connected) return;
    const level = moduleLevel(pad);
    if (level >= MAX_MODULE_LEVEL) { toast('模块已达到最高等级', 'gold'); return; }
    const target = level + 1;
    const cost = upgradeCost(pad.module, target);
    if (!canAfford(cost)) { toast('升级资源不足', 'gold'); return; }
    for (const [k, v] of Object.entries(cost)) state.resources[k] -= v;
    pad.level = target;
    updateModules(1);
    updatePadLabel(pad);
    updateHud();
    openBuildPanel(pad);
    toast(`${MODULES[pad.module].name} 升级至 Lv.${target}`, 'gold');
    evaluateObjective();
  }

  function demolishModule(pad) {
    if (!pad || !pad.module) return;
    const m = MODULES[pad.module];
    const refund = Object.fromEntries(Object.entries(m.cost).map(([k, v]) => [k, Math.ceil(v * 0.45)]));
    for (const [k, v] of Object.entries(refund)) state.resources[k] += v;
    if (pad.mesh) {
      state.worldGroup.remove(pad.mesh);
      disposeGroup(pad.mesh);
      pad.mesh = null;
    }
    if (pad.shaft) {
      state.worldGroup.remove(pad.shaft.group);
      disposeGroup(pad.shaft.group);
      pad.shaft = null;
    }
    toast(`拆除 ${m.name} · 返还部分材料`, 'violet');
    pad.module = null;
    computeNetwork();
    rebuildNetworkVisuals();
    syncCollectorBots();
    refreshAllPadLabels();
    updatePadLabel(pad);
    closeModal();
    updateHud();
    const offline = state.pads.filter(p => p.module && !p.connected).length;
    if (offline) toast(`产线中断 · ${offline} 个下游模块离线`, 'violet');
    evaluateObjective();
  }

  function updatePadLabel(pad) {
    const label = pad.label;
    if (!label) return;
    if (pad.construction) {
      const c = pad.construction;
      const m = MODULES[c.type];
      const pct = Math.floor(c.progress * 100);
      label.className = 'pad-label constructing';
      label.innerHTML = `<span class="pad-dot"></span><b>施工中 · ${m.name}</b><small>${pct}% · ${siteTypeOf(pad).label}</small>`;
    } else if (pad.module) {
      const m = MODULES[pad.module];
      if (!pad.connected) {
        label.className = 'pad-label offline';
        label.innerHTML = `<span class="pad-dot"></span><b>产线中断 · ${m.name}</b><small>${siteTypeOf(pad).label} · 不产出</small>`;
      } else {
        label.className = 'pad-label' + (pad.full ? ' full' : '');
        label.innerHTML = `<span class="pad-dot"></span><b>${pad2(pad.index + 1)} · ${m.name} Lv.${moduleLevel(pad)}</b><small>${siteTypeOf(pad).label} · ${pad.full ? '存储已满' : '产线在线'}</small>`;
      }
    } else {
      const link = nearestNetworkNode(pad);
      label.className = link ? 'pad-label empty' : 'pad-label disconnected';
      label.innerHTML = `<span class="pad-dot"></span><b>空置地块 ${pad2(pad.index + 1)}</b><small>${siteTypeOf(pad).label} · ${link ? '可接入 · 点击建造' : '产线未接入'}</small>`;
    }
  }

  function refreshAllPadLabels() {
    for (const pad of state.pads) updatePadLabel(pad);
  }

  function createModuleMesh(type, color) {
    const g = new THREE.Group();
    const c = color;
    const spins = [], bobs = [], pulses = [], drills = [];
    if (type === 'solar') {
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 1.0, 6), mat(0x60708a, 0x0b1726, 0.3));
      base.position.y = 0.5;
      g.add(base);
      const battery = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.38, 0.34), mat(0xf5c96b, 0x4c3510, 0.3));
      battery.position.set(0, 0.3, 0);
      g.add(battery);
      pulses.push({ mesh: battery, base: 1, amp: 0.08, speed: 2.1 });
      const panelMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, emissive: 0x0b2f6b, emissiveIntensity: 0.4, roughness: 0.35, metalness: 0.45 });
      [-0.9, 0.9].forEach(x => {
        const panel = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.06, 1.1), panelMat);
        panel.position.set(x * 0.7, 1.15, 0);
        panel.rotation.z = x * 0.2;
        g.add(panel);
        const frame = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.08, 1.24), mat(0xd9e5f5, 0x0c1728, 0.3));
        frame.position.set(x * 0.7, 1.08, 0);
        frame.rotation.z = x * 0.2;
        g.add(frame);
        [-0.48, 0.48].forEach(z => {
          const post = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.82, 4), mat(0x9fb4cc, 0x0b1726, 0.25));
          post.position.set(x * 0.7, 0.62, z);
          g.add(post);
        });
      });
    } else if (type === 'metal') {
      const base = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.35, 0.45, 7), mat(0x3f3f46, 0x111118, 0.5));
      base.position.y = 0.22;
      g.add(base);
      const drill = new THREE.Mesh(new THREE.ConeGeometry(0.36, 2.3, 6), mat(0xf2b56d, 0x6b3e15, 0.3));
      drill.position.y = 1.35;
      drill.rotation.z = 0.12;
      g.add(drill);
      drills.push({ mesh: drill, base: 1.35, amp: 0.16, speed: 2.4 });
      const collar = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.08, 5, 16), mat(0x8f6a3a, 0x1d1208, 0.28));
      collar.rotation.x = Math.PI / 2;
      collar.position.y = 0.9;
      g.add(collar);
      const bin = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.48, 0.64), mat(0x8b5a2b, 0x2b1608, 0.35));
      bin.position.set(-0.72, 0.48, 0.32);
      g.add(bin);
      [[-0.72, -0.42], [0.72, -0.42], [-0.72, 0.48], [0.72, 0.48]].forEach(([x, z]) => {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.1), mat(0x6f7885, 0x0b1220, 0.3));
        leg.position.set(x, 0.45, z);
        g.add(leg);
      });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.78, 0.06, 5, 20), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.7 }));
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.62;
      g.add(ring);
    } else if (type === 'ice') {
      const base = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.25, 0.42, 7), mat(0x2c3f52, 0x0b1726, 0.45));
      base.position.y = 0.22;
      g.add(base);
      [-0.55, 0.55].forEach(x => {
        const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.42, 1.55, 8), mat(0x7dd3fc, 0x0d3d5c, 0.25));
        tank.position.set(x, 1.05, 0);
        g.add(tank);
        const cap = new THREE.Mesh(new THREE.SphereGeometry(0.38, 8, 5), mat(0xdff7ff, 0x1a6680, 0.2));
        cap.position.set(x, 1.82, 0);
        g.add(cap);
      });
      const third = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 1.0, 8), mat(0xa5f3fc, 0x0d3d5c, 0.24));
      third.position.set(0, 0.88, 0.68);
      g.add(third);
      pulses.push({ mesh: third, base: 1, amp: 0.08, speed: 2.6 });
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.5, 6), mat(0xc6f3ff, 0x12313d, 0.3));
      pipe.rotation.z = Math.PI / 2;
      pipe.position.set(0, 0.62, 0.46);
      g.add(pipe);
    } else if (type === 'crystal') {
      const base = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.3, 0.4, 6), mat(0x3b2d51, 0x130b20, 0.5));
      base.position.y = 0.2;
      g.add(base);
      const crystals = [];
      for (let i = 0; i < 5; i++) {
        const crystal = new THREE.Mesh(new THREE.ConeGeometry(0.22 + (i % 2) * 0.08, 1.0 + i * 0.17, 5), mat(0xc4b5fd, 0x5b3b9a, 0.2, true));
        const a = (i / 5) * TAU;
        crystal.position.set(Math.cos(a) * 0.46, 0.78 + (i % 2) * 0.14, Math.sin(a) * 0.46);
        crystal.rotation.z = Math.cos(a) * 0.18;
        g.add(crystal);
        crystals.push(crystal);
      }
      crystals.forEach((mesh, i) => pulses.push({ mesh, base: 1, amp: 0.1, speed: 2.0 + i * 0.4 }));
      const light = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16, 0), new THREE.MeshBasicMaterial({ color: 0xe9d5ff }));
      light.position.y = 1.9;
      g.add(light);
      pulses.push({ mesh: light, base: 1, amp: 0.25, speed: 1.8 });
    } else if (type === 'mine') {
      const base = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.45, 0.45, 7), mat(0x4a4238, 0x181410, 0.5));
      base.position.y = 0.22;
      g.add(base);
      const frame = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.8, 1.1), mat(0x9a8256, 0x2b230f, 0.35));
      frame.position.y = 1.35;
      g.add(frame);
      const head = new THREE.Mesh(new THREE.ConeGeometry(0.34, 1.4, 6), mat(0xfbbf24, 0x6b4514, 0.3));
      head.position.y = 2.45;
      g.add(head);
      drills.push({ mesh: head, base: 2.45, amp: 0.2, speed: 3.0 });
      const derrick = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 3.0, 6), mat(0x6f7885, 0x0b1220, 0.3));
      derrick.position.set(0.75, 1.5, 0);
      g.add(derrick);
      const pulley = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.12, 8), mat(0xf5c96b, 0x5b3c0d, 0.25));
      pulley.rotation.x = Math.PI / 2;
      pulley.position.set(0.75, 3.0, 0);
      g.add(pulley);
      spins.push({ mesh: pulley, axis: 'x', speed: 1.4 });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.05, 5, 20), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.7 }));
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.6;
      g.add(ring);
    } else if (type === 'harvester') {
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.6, 1.05), mat(0x86efac, 0x14532d, 0.25));
      body.position.y = 0.62;
      g.add(body);
      const cab = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.7), mat(0xbbf7d0, 0x166534, 0.2));
      cab.position.set(-0.2, 1.0, 0);
      g.add(cab);
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.2, 6), mat(0xe2e8f0, 0x1b2b3d, 0.25));
      arm.rotation.z = -0.9;
      arm.position.set(0.8, 0.9, 0);
      g.add(arm);
      bobs.push({ mesh: arm, base: 0.9, amp: 0.06, speed: 2.2 });
      const bucket = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.28, 0.4), mat(0x64748b, 0x15253a, 0.3));
      bucket.position.set(1.35, 0.4, 0);
      g.add(bucket);
      const wheels = [];
      [[-0.7, -0.55], [0.7, -0.55], [-0.7, 0.55], [0.7, 0.55]].forEach(([x, z]) => {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.2, 10), mat(0x1e293b, 0x03070d, 0.7));
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(x, 0.3, z);
        g.add(wheel);
        wheels.push(wheel);
      });
      wheels.forEach(w => spins.push({ mesh: w, axis: 'x', speed: 2.2 }));
    } else if (type === 'software') {
      const base = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.4, 0.4, 8), mat(0x213c48, 0x0a2530, 0.4));
      base.position.y = 0.2;
      g.add(base);
      const dome = new THREE.Mesh(new THREE.SphereGeometry(0.92, 12, 7, 0, TAU, 0, Math.PI / 2), mat(0x67e8f9, 0x0b4a5b, 0.18));
      dome.position.y = 0.44;
      g.add(dome);
      pulses.push({ mesh: dome, base: 1, amp: 0.04, speed: 1.6 });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.02, 0.035, 4, 24), new THREE.MeshBasicMaterial({ color: 0x67e8f9 }));
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.65;
      g.add(ring);
      spins.push({ mesh: ring, axis: 'y', speed: 0.9 });
      for (let i = 0; i < 3; i++) {
        const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 1.1, 4), mat(0xbfefff, 0x0b3b47, 0.28));
        const a = (i / 3) * TAU;
        mast.position.set(Math.cos(a) * 0.52, 1.25, Math.sin(a) * 0.52);
        g.add(mast);
      }
    } else if (type === 'industry') {
      const base = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.65, 1.55), mat(0x4a4a42, 0x151510, 0.5));
      base.position.y = 0.33;
      g.add(base);
      const building = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 1.1), mat(0x9a8256, 0x2b230f, 0.35));
      building.position.y = 1.16;
      g.add(building);
      const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.25, 1.7, 6), mat(0x6f6a5b, 0x211d12, 0.4));
      chimney.position.set(0.5, 2.35, 0);
      g.add(chimney);
      const conveyor = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.12, 0.34), mat(0x2f3b45, 0x0b1118, 0.4));
      conveyor.position.set(0, 0.72, 0.78);
      g.add(conveyor);
      const silo = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.36, 1.0, 8), mat(0xb7a77b, 0x2d2411, 0.4));
      silo.position.set(-0.85, 0.92, -0.55);
      g.add(silo);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.05, 4, 16), new THREE.MeshBasicMaterial({ color: c }));
      ring.position.set(-0.4, 1.9, 0.61);
      g.add(ring);
      spins.push({ mesh: ring, axis: 'y', speed: 0.8 });
      pulses.push({ mesh: silo, base: 1, amp: 0.05, speed: 1.8 });
    } else if (type === 'control') {
      const base = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.2, 0.45, 7), mat(0x273849, 0x0a1722, 0.45));
      base.position.y = 0.22;
      g.add(base);
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.25, 1.4, 6), mat(0x9fb4cc, 0x132a3a, 0.3));
      tower.position.y = 1.1;
      g.add(tower);
      const dish = new THREE.Mesh(new THREE.SphereGeometry(0.68, 10, 6, 0, TAU, 0, Math.PI / 2), mat(0xdff7ff, 0x1c4c5b, 0.2));
      dish.rotation.x = -0.6;
      dish.position.set(0, 1.9, 0);
      g.add(dish);
      spins.push({ mesh: dish, axis: 'y', speed: 0.5 });
      [[-0.4, -0.28], [0.4, -0.28], [0, 0.46]].forEach(([x, z]) => {
        const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 1.35, 4), mat(0x9fb4cc, 0x0b1726, 0.3));
        strut.position.set(x, 0.92, z);
        strut.rotation.z = -x * 0.2;
        g.add(strut);
      });
      const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 4), new THREE.MeshBasicMaterial({ color: 0x5eead4 }));
      beacon.position.y = 2.4;
      g.add(beacon);
      pulses.push({ mesh: beacon, base: 1, amp: 0.3, speed: 1.6 });
    } else if (type === 'warehouse') {
      const base = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.6, 1.5), mat(0x334155, 0x0f172a, 0.45));
      base.position.y = 0.3;
      g.add(base);
      const building = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.1, 1.2), mat(0x93c5fd, 0x1e3a5f, 0.2));
      building.position.y = 1.1;
      g.add(building);
      const lift = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.14, 0.8), mat(0xe2e8f0, 0x1b2b3d, 0.3));
      lift.position.y = 1.3;
      g.add(lift);
      bobs.push({ mesh: lift, base: 1.3, amp: 0.5, speed: 1.2 });
      [-0.7, 0.7].forEach(x => {
        const rack = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.5, 0.9), mat(0x64748b, 0x15253a, 0.3));
        rack.position.set(x, 1.2, -0.45);
        g.add(rack);
      });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.05, 5, 20), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.7 }));
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.65;
      g.add(ring);
    }
    g.userData.anim = { spins, bobs, pulses, drills };
    g.userData.type = type;
    return g;
  }

  /* ---------- HUD ---------- */

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `T+${pad2(m)}:${pad2(s)}`;
  }

  function updateHud() {
    if (!state.planet) return;
    const p = state.planet;
    ui.planet.textContent = p.name;
    ui.planetSub.textContent = p.sub;
    ui.cycle.textContent = state.mode === 'campaign' ? `航段 0${state.planetIndex + 1}` : `航段 ${pad2(state.cycle)}`;
    ui.traits.innerHTML = traitLabels(p).map(([label, cls]) => `<span class="trait-chip ${cls}">${label}</span>`).join('');
    ui.metal.textContent = Math.floor(state.resources.metal);
    ui.ice.textContent = Math.floor(state.resources.ice);
    ui.crystal.textContent = Math.floor(state.resources.crystal);
    const info = powerInfo();
    ui.power.textContent = `${info.supply} / ${info.use}`;
    ui.statusMode.textContent = `${state.mode === 'campaign' ? '主线远征' : '无尽拓殖'} · ${formatTime(state.elapsed)}`;
    ui.statusPower.textContent = info.factor < 0.92 ? `供电不足 ${Math.round(info.factor * 100)}%` : '电力稳定';
    ui.statusPower.className = 'status-' + (info.factor < 0.92 ? 'warn' : 'good');
    ui.statusCrew.textContent = `施工队 ${activeCrews()} / ${MAX_CREWS}`;
    ui.statusCrew.className = activeCrews() >= MAX_CREWS ? 'status-warn' : 'status-good';
    ui.statusNetwork.textContent = state.network.total
      ? `产线 ${state.network.connected}/${state.network.total}`
      : '产线 0';
    ui.statusNetwork.className = state.network.total > state.network.connected ? 'status-bad' : 'status-good';
    ui.powerChip.classList.toggle('bad', info.factor < 0.92);
    updateEventBanner();
    evaluateObjective();
  }

  function evaluateObjective() {
    if (!state.planet) return;
    if (state.view === 'orbit') {
      ui.objective.textContent = '轨道俯瞰 · 点击发光地块建造基地 / 按 V 返回地表';
      return;
    }
    if (state.view === 'underground') {
      ui.objective.textContent = '地下矿洞 · 矿工机器人正沿矿脉作业 / 按 U 返回地表';
      return;
    }
    let text;
    const offline = state.pads.filter(p => p.module && !p.connected).length;
    if (offline) text = `产线中断 ${offline} 个模块 · 重建中继或拆除后重新规划`;
    else if (!hasModule('metal')) text = '采集地表金属，建造第一座采掘阵列';
    else if (!hasModule('ice')) text = '寻找冰晶，建造冰处理站';
    else if (!hasModule('crystal')) text = '建立晶矿精炼，补齐航电材料';
    else if (!hasConnectedModule('control')) text = hasModule('control') ? '轨道测控站产线中断 · 恢复连接' : '建造轨道测控站，解锁火箭研发';
    else if (state.rocket.stage < 3) text = `完成火箭研发阶段 ${state.rocket.stage + 1}/3 · ${STAGES[state.rocket.stage].title}`;
    else text = '火箭已就绪 · 打开火箭研发面板启动发射';
    ui.objective.textContent = text;
  }

  /* ---------- panels ---------- */

  function openModal(kicker, title, body) {
    ui.modalKicker.textContent = kicker;
    ui.modalTitle.textContent = title;
    ui.modalBody.innerHTML = body;
    ui.modal.hidden = false;
    state.modalOpen = true;
  }

  function closeModal() {
    ui.modal.hidden = true;
    state.modalOpen = false;
  }

  function openBuildPanel(pad) {
    if (!pad) return;
    if (pad.construction) {
      const c = pad.construction;
      const m = MODULES[c.type];
      openModal(`LOT ${pad2(pad.index + 1)} / CONSTRUCTION`, `${m.name} · 施工中`, `
        <p class="modal-copy">小机器人正在组装 ${m.name}。施工进度 ${Math.floor(c.progress * 100)}%。施工完成后模块才会接入电网并开始产出。</p>
        <div class="landing-track"><i style="width:${Math.floor(c.progress * 100)}%"></i></div>
        <div class="help-callout">施工时间约 ${c.duration.toFixed(1)} 秒。可以先去采集资源，或按 V 进入星球俯瞰继续规划其他地块。</div>
      `);
      return;
    }
    if (pad.module) {
      const m = MODULES[pad.module];
      const level = moduleLevel(pad);
      const nextLevel = level + 1;
      const upgrade = nextLevel <= MAX_MODULE_LEVEL ? upgradeCost(pad.module, nextLevel) : null;
      const refund = Object.fromEntries(Object.entries(m.cost).map(([k, v]) => [k, Math.ceil(v * 0.45)]));
      const cover = pad.module === 'software' || pad.module === 'industry' ? coverageCount(pad, pad.module) : 0;
      const softBonus = 25 + 8 * (level - 1);
      const indBonus = 15 + 7 * (level - 1);
      const coverLine = cover ? `<div class="help-callout">当前覆盖 ${cover} 条采掘产线（半径 ${pad.module === 'software' ? 22 : 20}），提供 ${pad.module === 'software' ? `+${softBonus}%` : `+${indBonus}%`} 产出。</div>` : '';
      const offlineLine = pad.connected ? '' : '<div class="help-callout" style="border-left-color:var(--red);color:#fda4af">产线中断：该模块不产出、不供电。需要先恢复一条从基地核心到这里的连接。</div>';
      const rateText = m.rate
        ? Object.entries(m.rate).map(([k, v]) => `${k === 'metal' ? '金属' : k === 'ice' ? '冰' : '晶矿'} +${(v * moduleOutputMultiplier(pad)).toFixed(2)}/秒`).join(' · ')
        : m.supply ? `供电 ${(m.supply * LEVEL_SOLAR[level - 1]).toFixed(1)}` : '无直接产出';
      const storageTotal = Math.floor((pad.storage?.metal || 0) + (pad.storage?.ice || 0) + (pad.storage?.crystal || 0));
      const storageText = m.rate ? ` · 存储 ${storageTotal} / ${collectorCapacity(pad)}${pad.full ? ' · 已满' : ''}` : '';
      const nextText = upgrade
        ? (m.rate
          ? `升级后 ${Object.entries(m.rate).map(([k, v]) => `${k === 'metal' ? '金属' : k === 'ice' ? '冰' : '晶矿'} +${(v * LEVEL_OUTPUT[nextLevel - 1]).toFixed(2)}/秒`).join(' · ')}`
          : m.supply ? `升级后供电 ${(m.supply * LEVEL_SOLAR[nextLevel - 1]).toFixed(1)}` : '升级后效果增强')
        : '已达到最高等级';
      const linkCandidates = [];
      linkCandidates.push({ key: 'auto', label: '自动' });
      if (Math.hypot(pad.x, pad.z) <= CORE_LINK_RADIUS) linkCandidates.push({ key: 'core', label: '基地核心' });
      for (const p of state.pads) {
        if (p === pad || !p.module || !p.connected) continue;
        if (Math.hypot(p.x - pad.x, p.z - pad.z) <= MODULE_LINK_RADIUS) linkCandidates.push({ key: String(p.index), label: `地块 ${pad2(p.index + 1)} · ${MODULES[p.module].name}` });
      }
      const currentKey = pad.linkOverride == null ? 'auto' : pad.linkOverride;
      const linkButtons = linkCandidates.map(c => `<button class="ghost-btn ${c.key === currentKey ? 'link-active' : ''}" data-action="link" data-pad="${pad.index}" data-key="${c.key}">${c.label}${c.key === currentKey ? ' · 当前' : ''}</button>`).join('');
      openModal(`LOT ${pad2(pad.index + 1)} / BASE`, `${m.name} · Lv.${level}`, `
        <p class="modal-copy">${siteTypeOf(pad).label} · ${siteBonusFor(pad, pad.module) || '无匹配加成'}。${m.effect}</p>
        <div class="build-card">
          <div class="bc-head"><strong>${m.name} Lv.${level}</strong><span class="dept">${m.dept}</span></div>
          <div class="bc-effect">${rateText}${storageText} · 用电 ${modulePowerUse(pad)}</div>
          <p>${m.card}</p>
          <div class="bc-cost">回收 <span>金属 ${refund.metal}</span><span>冰 ${refund.ice}</span><span>晶矿 ${refund.crystal}</span></div>
        </div>
        ${offlineLine}
        ${coverLine}
        <div class="section-title"><span>物流线</span><b>更改进货来源</b></div>
        <div class="link-options">${linkButtons}</div>
        ${upgrade ? `<div class="section-title"><span>模块升级</span><b>Lv.${level} → Lv.${nextLevel}</b></div>
          <p class="modal-copy">${nextText}。升级会额外增加 1 点用电，请同步扩容光伏阵列。</p>
          <button class="launch-btn" data-action="upgrade" data-pad="${pad.index}" ${canAfford(upgrade) ? '' : 'disabled'}>升级模块 · 金属 ${upgrade.metal} / 冰 ${upgrade.ice} / 晶矿 ${upgrade.crystal}</button>` : '<div class="help-callout">该模块已达到 Lv.3 最高等级。</div>'}
        <div class="section-title"><span>地块操作</span><b>${state.planet.name} · ${siteTypeOf(pad).label}</b></div>
        <button class="ghost-btn" data-action="demolish" data-pad="${pad.index}">拆除模块（返还45%）</button>
      `);
      return;
    }
    const info = powerInfo();
    const link = nearestNetworkNode(pad);
    const canLink = !!link;
    const linkText = canLink
      ? `产线可接入：最近节点 ${link.node.core ? '基地核心' : '地块 ' + pad2(link.node.index + 1)}，距离 ${link.distance.toFixed(1)} / ${link.radius}，该节点还可下挂 ${link.remaining} 条产线`
      : '产线未接入：需要先向这个方向延伸一座中继模块';
    const cards = Object.keys(MODULES).map(type => {
      const m = MODULES[type];
      const cost = buildCost(type);
      const uniqueBlocked = m.unique && (hasModule(type) || isBuildingModule(type));
      const affordable = canAfford(cost);
      const disabled = !canLink || uniqueBlocked || !affordable;
      const siteLine = siteBonusFor(pad, type);
      const cover = type === 'software' || type === 'industry' ? coverageCount(pad, type) : 0;
      const coverText = type === 'software' || type === 'industry' ? ` · 覆盖 ${cover} 条产线（半径 ${type === 'software' ? 22 : 20}）` : '';
      return `<button class="build-card" data-action="build" data-pad="${pad.index}" data-module="${type}" ${disabled ? 'disabled' : ''}>
        <div class="bc-head"><strong>${m.name}</strong><span class="dept">${m.dept}</span></div>
        <div class="bc-effect">${m.effect}${m.use ? ` · 用电 ${m.use}` : ' · 供电'} · ${effectiveBuildTime(pad, type).toFixed(1)}s 施工${coverText}</div>
        ${siteLine ? `<div class="bc-site">${siteLine}</div>` : ''}
        <div class="bc-cost"><span>金属 ${cost.metal}</span><span>冰 ${cost.ice}</span><span>晶矿 ${cost.crystal}</span></div>
        <div class="bc-know"><b>${m.cardTitle}</b> ${m.card}</div>
        ${!canLink ? '<small class="done-badge">产线未接入</small>' : uniqueBlocked ? '<small class="done-badge">已建成 / 施工中</small>' : !affordable ? '<small class="done-badge">资源不足</small>' : ''}
      </button>`;
    }).join('');
    openModal(`LOT ${pad2(pad.index + 1)} / CONSTRUCTION`, '布设基地模块', `
      <p class="modal-copy">地块 ${pad2(pad.index + 1)} · ${siteTypeOf(pad).label}：${siteTypeOf(pad).text}。${linkText}。当前电力 ${info.supply} / 用电 ${info.use}；施工队 ${activeCrews()}/${MAX_CREWS}。</p>
      ${canLink ? '' : '<div class="help-callout" style="border-left-color:var(--red);color:#fda4af">这个地块还没有接入基地产线。先在它附近的地块建造中继模块，再回来建设。</div>'}
      <div class="build-grid">${cards}</div>
    `);
  }

  function openBaseOverview() {
    const info = powerInfo();
    const rows = state.pads.map(pad => {
      const m = pad.module ? MODULES[pad.module] : null;
      const c = pad.construction;
      const label = m ? (pad.connected ? `${m.name} Lv.${moduleLevel(pad)}` : `${m.name} · 产线中断`) : c ? `施工中 ${Math.floor(c.progress * 100)}%` : (nearestNetworkNode(pad) ? '空置 · 可接入' : '空置 · 产线未接入');
      return `<button class="pad-tile ${m ? 'built' : c ? 'constructing' : 'empty'}" data-action="select-pad" data-pad="${pad.index}">
        <b>地块 ${pad2(pad.index + 1)}</b>
        <small>${siteTypeOf(pad).label} · ${label}</small>
      </button>`;
    }).join('');
    openModal('BASE / OVERVIEW', '基地总览', `
      <p class="modal-copy">默认 3 个地块，可自选位置扩展到最多 20 个；当前 ${state.pads.length} 个地块，电力 ${info.supply} / 用电 ${info.use}，产线 ${state.network.connected}/${state.network.total} 在线。${info.factor < 0.92 ? `供电不足，产线效率 ${Math.round(info.factor * 100)}%。` : '电力稳定。'}</p>
      <div class="pad-grid">${rows}</div>
      <div class="help-callout">产线从基地核心出发，只能接入 24 范围内的地块；已在线模块可把产线延伸到 22 范围内。基地核心最多下挂 3 条产线，普通模块最多下挂 2 条，超出的地块需要另找中继。产线效率还受地块资源丰度、光照、自动化中枢与工业工坊的局部覆盖影响。</div>
    `);
  }

  function controlDiscount() {
    const control = state.pads.find(p => p.module === 'control' && p.connected);
    if (!control) return 1;
    const base = control.site === 'ridge' ? 0.85 : 0.9;
    return Math.max(0.78, base - 0.03 * (moduleLevel(control) - 1));
  }

  function openResearch() {
    const r = state.rocket;
    const hasControl = hasConnectedModule('control');
    const controlBuilt = hasModule('control');
    const progress = [0, 1, 2].map(i => `<span class="${i < r.stage ? 'done' : ''}"></span>`).join('');
    let body = `<div class="rocket-progress">${progress}</div>`;
    if (!hasControl) body += `<div class="help-callout">${controlBuilt ? '轨道测控站已建造但产线中断，无法提供测控数据。' : '尚未建造「轨道测控站」。没有测控数据，火箭研发无法开始。'}</div>`;
    for (let i = 0; i < STAGES.length; i++) {
      const stage = STAGES[i];
      if (i < r.stage) {
        const chosen = stage.options.find(o => o.id === r.choices[i]);
        body += `<div class="stage-block"><div class="stage-head"><strong>${stage.title}</strong><span class="done-badge">已定型 · ${chosen ? chosen.name : ''}</span></div></div>`;
        continue;
      }
      if (i > r.stage) {
        body += `<div class="stage-block"><div class="stage-head"><strong>${stage.title}</strong><span>等待前置阶段</span></div></div>`;
        continue;
      }
      const discount = hasConnectedModule('control') ? controlDiscount() : 1;
      const options = stage.options.map(opt => {
        const cost = stageCost(stage, opt.id, discount);
        const afford = canAfford(cost);
        const disabled = !hasControl || !afford;
        return `<button class="option-card" data-action="research" data-stage="${i}" data-option="${opt.id}" ${disabled ? 'disabled' : ''}>
          <span class="opt-dept">${stage.dept}</span>
          <strong>${opt.name}</strong>
          <p>${opt.desc}</p>
          <span class="opt-cost">金属 ${cost.metal} · 冰 ${cost.ice} · 晶矿 ${cost.crystal}</span>
          <span class="opt-know">知识卡：${opt.knowledge}</span>
        </button>`;
      }).join('');
      body += `<div class="stage-block">
        <div class="stage-head"><strong>${stage.title}</strong><span>阶段 ${i + 1}/3 · ${stage.dept}</span></div>
        <p class="modal-copy">${stage.hint}</p>
        <div class="option-grid">${options}</div>
      </div>`;
    }
    if (r.stage >= 3) {
      const lc = launchCost();
      const canLaunch = canAfford(lc);
      body += `<div class="help-callout">总装与燃料：金属 ${lc.metal} · 冰 ${lc.ice} · 晶矿 ${lc.crystal}。发射会消耗这些资源。</div>
        <button class="launch-btn rocket-launch" data-action="launch" ${canLaunch ? '' : 'disabled'}>启动跨星系飞行器 <span>→</span></button>`;
    }
    openModal('ROCKET / RESEARCH', '跨星系飞行器研发', body);
  }

  function stageCost(stage, choiceId, controlDiscount = 1) {
    const correct = choiceId === correctChoice(stage.key, state.planet);
    const factor = (correct ? 0.8 : 1.28) * controlDiscount * eventResearchDiscount() * (state.mode === 'endless' ? 1 + (state.cycle - 1) * 0.14 : 1);
    return Object.fromEntries(Object.entries(stage.base).map(([k, v]) => [k, Math.ceil(v * factor)]));
  }

  function correctChoice(stageKey, planet) {
    if (stageKey === 'structure') return planet.traits.gravity >= 0.95 ? 'honeycomb' : 'truss';
    if (stageKey === 'avionics') return planet.traits.radiation >= 0.58 ? 'redundant' : 'light';
    if (stageKey === 'propulsion') return planet.traits.ice >= 1.1 ? 'methane' : 'ion';
    return '';
  }

  function chooseResearch(stageIndex, choiceId) {
    if (!hasConnectedModule('control')) { toast('轨道测控站未接入产线', 'gold'); return; }
    if (stageIndex !== state.rocket.stage) return;
    const stage = STAGES[stageIndex];
    const cost = stageCost(stage, choiceId, hasConnectedModule('control') ? controlDiscount() : 1);
    if (!canAfford(cost)) { toast('研发资源不足', 'gold'); return; }
    for (const [k, v] of Object.entries(cost)) state.resources[k] -= v;
    const correct = choiceId === correctChoice(stage.key, state.planet);
    state.rocket.choices[stageIndex] = choiceId;
    state.rocket.stage++;
    state.stats.choices++;
    if (correct) {
      state.rocket.correct++;
      state.stats.correct++;
      toast(`方案匹配 ${state.planet.name} · ${stage.title} 效率优化`, 'gold');
    } else {
      toast(`方案不够匹配 · ${stage.title} 超支 28%`, 'violet');
    }
    updateRocketVisual();
    updateHud();
    openResearch();
  }

  function launchCost() {
    const scale = state.mode === 'endless' ? 1 + (state.cycle - 1) * 0.18 : 1;
    return Object.fromEntries(Object.entries(LAUNCH_COST).map(([k, v]) => [k, Math.ceil(v * scale)]));
  }

  function settlePlanet() {
    if (state.phase !== 'play' || state.launching) return;
    if (state.rocket.stage < 3) { toast('火箭尚未研发完成，无法结算离场', 'gold'); return; }
    const cost = launchCost();
    if (!canAfford(cost)) { toast('结算资源不足', 'gold'); return; }
    for (const [k, v] of Object.entries(cost)) state.resources[k] -= v;
    closeModal();
    showComplete();
  }

  function launchRocket() {
    if (state.rocket.stage < 3) return;
    const cost = launchCost();
    if (!canAfford(cost)) { toast('总装与燃料不足', 'gold'); return; }
    for (const [k, v] of Object.entries(cost)) state.resources[k] -= v;
    closeModal();
    state.launching = true;
    state.launchT = 0;
    state.running = false;
    state.view = 'surface';
    ui.hud.classList.remove('planet-view');
    ui.view.innerHTML = '星球俯瞰 <kbd>V</kbd>';
    camera.up.set(0, 1, 0);
    camera.fov = 52;
    camera.updateProjectionMatrix();
    if (scene.fog) scene.fog.density = 0.013;
    if (state.rocketMesh) {
      camera.position.set(LAUNCH_POS.x + 9, LAUNCH_POS.y + 12, LAUNCH_POS.z - 13);
      camera.lookAt(LAUNCH_POS.x, LAUNCH_POS.y + 5, LAUNCH_POS.z);
    }
    ui.hud.classList.add('is-launching');
    ui.toasts.innerHTML = '';
    toast('点火 · 跨星系飞行器离港', 'gold');
  }

  function openMedals() {
    const medals = state.medals;
    const cards = medals.length ? medals.map(medal => `
      <div class="medal-card">
        ${medalHTML(medal, 72)}
        <strong>${medal.name}</strong>
        <small>${medal.sub || ''}</small>
        ${medalTagsHTML(medal)}
        <small>航段 ${pad2(medal.cycle)} · ${medal.mode === 'campaign' ? '主线' : '无尽'}</small>
      </div>`).join('') : '';
    openModal('ARCHIVE / DUSHI 64', '纪念章墙', `
      <p class="modal-copy">笃实书院64班 · 每完成一颗星球的基地建设与飞行器发射，都会获得一枚纪念章。它们会保存在本机。</p>
      ${medals.length ? `<div class="medal-grid">${cards}</div>` : '<div class="empty-state">还没有纪念章。完成第一颗星球的跨星系航行后，这里会亮起来。</div>'}
    `);
  }

  function openHelp() {
    openModal('FIELD MANUAL / 64', '玩法说明', `
      <ol class="help-list">
        <li><b>探索：</b>用 WASD / 方向键或左侧摇杆驾驶勘探车，靠近发光资源点后按 E 采集（约 1.6 秒作业动画）。</li>
        <li><b>建设：</b>靠近地块按 E 或点「基地建造」选择地块。默认 3 个地块，可按 N 在地表自选位置新增地块（最多 20 个），注意电力供需。</li>
        <li><b>俯瞰：</b>按 V 或点「星球俯瞰」进入轨道视角，点击地表上的发光地块直接规划基地；再按 V 返回勘探车。</li>
        <li><b>地下：</b>按 U 或点「地下视角」切换到地下矿洞层，查看隧道网格与矿室；再按 U 返回地表。</li>
        <li><b>无限地表：</b>星球表面按 28 单位区块持续生成，没有地图边界；开得越远，地形、碎石与资源节点越新。基地和轨道俯瞰始终围绕基地核心。</li>
        <li><b>产线：</b>基地核心最多下挂 3 条产线，普通模块最多下挂 2 条，接入范围为核心 24 / 模块 22。线路会沿地形架设中继塔并运输货物流光，超出的地块必须先建中继；拆除中继会让下游模块离线。</li>
        <li><b>布局：</b>每个地块有随机地形特性：日照台地、金属矿脉、冰层穹丘、晶簇裂隙、平整岩台、科研高地。匹配模块可获得 35% 加成，平整岩台加快施工，科研高地强化测控站。</li>
        <li><b>覆盖：</b>自动化中枢只为半径 22 内的产线提供 +25%，工业工坊只为半径 20 内的产线提供 +15%。建造面板会显示覆盖数量，尽量把支持模块放在采掘模块之间。</li>
        <li><b>施工队：</b>同时最多 2 个工地施工。先建关键产线，还是先建加成模块，需要自己排优先级。</li>
        <li><b>升级：</b>已建模块可以在模块面板中升到 Lv.3。升级提高产出或供电，但每级额外增加 1 点用电；火箭研发与最终发射另需大量资源。</li>
        <li><b>节奏：</b>一颗星球的正常探索、建设、升级与发射约 10 分钟。地表资源点只是补充，主要资源来自采掘产线与升级。</li>
        <li><b>事件：</b>不定期触发沙尘暴、陨石雨、日照窗口等随机事件；负面事件可花费资源规避，或接受一段时间的减产。</li>
        <li><b>知识：</b>每个模块与火箭方案都附有航空航天、软件学院、工业工程系的知识卡。方案与星球条件匹配时会降低成本。</li>
        <li><b>研发：</b>建造「轨道测控站」后，依次完成结构、航电、推进三个阶段，再点火发射。</li>
        <li><b>远征：</b>主线有三颗星球；无尽模式会持续生成随机星球并获得纪念章。</li>
      </ol>
      <div class="help-callout">星球特性会影响资源产出、光伏效率与火箭方案。例如：强辐射环境需要更冗余的飞控，富冰星球适合甲烷燃料。</div>
    `);
  }

  /* ---------- completion / navigation ---------- */

  function showComplete() {
    state.phase = 'complete';
    state.running = false;
    const planet = state.planet;
    const medal = {
      name: planet.name,
      sub: planet.sub,
      key: planet.key,
      color: planet.accent,
      tags: traitLabels(planet),
      cycle: state.mode === 'campaign' ? state.planetIndex + 1 : state.cycle,
      mode: state.mode,
      time: Math.round(state.elapsed),
      correct: state.rocket.correct,
      date: Date.now()
    };
    state.medals.push(medal);
    saveMedals();
    updateMedalCount();
    ui.complete.hidden = false;
    ui.completeTitle.textContent = planet.name + ' · 拓殖完成';
    ui.completeSub.textContent = `${planet.sub} · 笃实书院64班 · 纪念章已归档`;
    ui.completeMedal.innerHTML = medalHTML(medal, 132) + medalTagsHTML(medal);
    ui.completeStats.innerHTML = `
      <div>航段时间<b>${formatTime(state.elapsed)}</b></div>
      <div>知识匹配<b>${state.rocket.correct}/3</b></div>
      <div>建成模块<b>${state.stats.built}</b></div>`;
    const isFinal = state.mode === 'campaign' && state.planetIndex >= PLANETS.length - 1;
    ui.next.textContent = isFinal ? '完成远征，返回星港' : state.mode === 'endless' ? '继续深入下一颗星球' : `前往 ${campaignPlanet(state.planetIndex + 1).name}`;
    if (isFinal) ui.next.textContent = '完成远征 · 查看纪念章墙';
  }

  function nextPlanet() {
    ui.complete.hidden = true;
    if (state.mode === 'campaign' && state.planetIndex >= PLANETS.length - 1) {
      showTitle();
      openMedals();
      return;
    }
    const carry = { ...state.resources };
    if (state.mode === 'campaign') {
      state.planetIndex++;
      loadPlanet(campaignPlanet(state.planetIndex), carry);
    } else {
      state.cycle++;
      loadPlanet(endlessPlanet(state.cycle, carry), carry);
    }
  }

  function medalHTML(medal, size) {
    return `<div class="medal" style="--medal-color:${medal.color};width:${size}px;height:${size}px">
      <span class="medal-ring"></span>
      <img class="medal-emblem" src="assets/class64-badge.png" alt="64">
      <i class="medal-sigil" style="color:${medal.color}">${medal.key ? medal.key.slice(0, 1).toUpperCase() : '★'}</i>
    </div>`;
  }

  function medalTagsHTML(medal) {
    const tags = medal.tags || [];
    if (!tags.length) return '';
    return `<div class="medal-tags">${tags.map(([label, cls]) => `<span class="medal-tag ${cls}">${label}</span>`).join('')}</div>`;
  }

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${pad2(m)}:${pad2(s)}`;
  }

  function showTitle() {
    state.mode = 'title';
    state.phase = 'title';
    state.running = false;
    state.launching = false;
    state.cinematic = null;
    state.modalOpen = false;
    ui.hud.hidden = true;
    ui.modal.hidden = true;
    ui.complete.hidden = true;
    ui.landing.hidden = true;
    ui.landing.classList.remove('is-impact');
    ui.hud.classList.remove('is-launching', 'planet-view');
    state.view = 'surface';
    camera.fov = 52;
    camera.up.set(0, 1, 0);
    camera.updateProjectionMatrix();
    ui.title.hidden = false;
    clearWorld();
    buildTitleScene();
    updateMedalCount();
  }

  function startRun(mode) {
    startBgm();
    state.mode = mode;
    state.planetIndex = 0;
    state.cycle = 1;
    ui.title.hidden = true;
    ui.hud.hidden = false;
    if (mode === 'endless') {
      state.planet = endlessPlanet(1, null);
      loadPlanet(state.planet, null);
    } else {
      loadPlanet(campaignPlanet(0), null);
    }
  }

  function updateMedalCount() {
    const count = state.medals.length;
    if (ui.medalCount) ui.medalCount.textContent = count;
  }

  function loadMedals() {
    try {
      const raw = localStorage.getItem(MEDAL_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      state.medals = Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      state.medals = [];
    }
    updateMedalCount();
  }

  function saveMedals() {
    try { localStorage.setItem(MEDAL_KEY, JSON.stringify(state.medals.slice(-60))); } catch (e) {}
  }

  /* ---------- events ---------- */

  function bindEvents() {
    document.querySelectorAll('[data-mode]').forEach(btn => {
      btn.addEventListener('click', () => {
        initAudio();
        startBgm();
        startRun(btn.dataset.mode);
      });
    });
    $('btn-medals').addEventListener('click', () => { initAudio(); openMedals(); });
    $('btn-help').addEventListener('click', () => { initAudio(); openHelp(); });
    $('btn-sound').addEventListener('click', toggleSound);
    $('btn-sound-hud').addEventListener('click', toggleSound);
    $('btn-pause').addEventListener('click', () => { initAudio(); openHelp(); });
    $('modal-close').addEventListener('click', closeModal);
    ui.modal.addEventListener('click', e => { if (e.target === ui.modal) closeModal(); });
    ui.build.addEventListener('click', () => { initAudio(); openBaseOverview(); });
    ui.research.addEventListener('click', () => { initAudio(); openResearch(); });
    $('btn-view').addEventListener('click', () => { initAudio(); togglePlanetView(); });
    ui.underground.addEventListener('click', () => { initAudio(); toggleUnderground(); });
    ui.slot.addEventListener('click', () => { initAudio(); addBuildSlot(); });
    ui.line.addEventListener('click', () => { initAudio(); toggleLineEdit(); });
    ui.settle.addEventListener('click', () => { initAudio(); settlePlanet(); });
    ui.landingSkip.addEventListener('click', finishLanding);
    ui.interact.addEventListener('click', interact);
    ui.next.addEventListener('click', nextPlanet);
    ui.modalBody.addEventListener('click', e => {
      const target = e.target.closest('[data-action]');
      if (!target) return;
      const action = target.dataset.action;
      if (action === 'build') startConstruction(state.pads[+target.dataset.pad], target.dataset.module);
      else if (action === 'upgrade') upgradeModule(state.pads[+target.dataset.pad]);
      else if (action === 'demolish') demolishModule(state.pads[+target.dataset.pad]);
      else if (action === 'select-pad') openBuildPanel(state.pads[+target.dataset.pad]);
      else if (action === 'research') chooseResearch(+target.dataset.stage, target.dataset.option);
      else if (action === 'launch') launchRocket();
      else if (action === 'event-avoid') resolveEvent(target.dataset.id, 'avoid');
      else if (action === 'event-accept') resolveEvent(target.dataset.id, 'accept');
      else if (action === 'link') setLinkTarget(+target.dataset.pad, target.dataset.key);
    });
    window.addEventListener('keydown', e => {
      startBgm();
      const k = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
      if (k === 'escape') {
        if (state.modalOpen) closeModal();
        else if (state.phase === 'play') openHelp();
        return;
      }
      if (state.modalOpen || state.phase !== 'play') return;
      if (state.cinematic) return;
      if (k === 'e') { interact(); return; }
      if (k === 'b') { openBaseOverview(); return; }
      if (k === 'r') { openResearch(); return; }
      if (k === 'v') { togglePlanetView(); return; }
      if (k === 'u') { toggleUnderground(); return; }
      if (k === 'n') { addBuildSlot(); return; }
      if (k === 'l') { toggleLineEdit(); return; }
      if (k === 'q') { settlePlanet(); return; }
      keys[k] = true;
    });
    window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
    window.addEventListener('blur', () => Object.keys(keys).forEach(k => { keys[k] = false; }));
    document.addEventListener('pointerdown', () => { initAudio(); startBgm(); }, { passive: true });
    document.addEventListener('pointerdown', e => {
      if (state.lineEdit && state.phase === 'play' && !state.modalOpen) {
        if (e.target.closest && e.target.closest('.hud-bottom, .hud-top, .objective-strip, .action-side, .joystick, .modal, #toasts, #event-banner')) return;
        handleLinePick(e.clientX, e.clientY);
      }
    });
    const rotateHint = $('rotate-hint');
    const rotateDismiss = $('rotate-dismiss');
    if (rotateHint && rotateDismiss) {
      const KEY = 'dushi-64-rotate-hint-dismissed.v1';
      try { if (localStorage.getItem(KEY) === '1') rotateHint.style.display = 'none'; } catch (e) {}
      rotateDismiss.addEventListener('click', () => {
        rotateHint.style.display = 'none';
        try { localStorage.setItem(KEY, '1'); } catch (e) {}
      });
    }
    bindJoystick();
    initBgm();
    updateSoundButtons();
    initAudio();
  }

  function bindJoystick() {
    const el = ui.joystick, knob = ui.joystickKnob;
    const move = e => {
      if (!joystick.active || e.pointerId !== joystick.pointerId) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      let dx = e.clientX - cx, dy = e.clientY - cy;
      const max = rect.width * 0.34;
      const len = Math.hypot(dx, dy);
      if (len > max) { dx = dx / len * max; dy = dy / len * max; }
      joystick.x = dx / max;
      joystick.y = dy / max;
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
    };
    el.addEventListener('pointerdown', e => {
      e.preventDefault();
      joystick.active = true;
      joystick.pointerId = e.pointerId;
      el.setPointerCapture(e.pointerId);
      move(e);
    });
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', e => {
      if (e.pointerId !== joystick.pointerId) return;
      joystick.active = false;
      joystick.x = 0;
      joystick.y = 0;
      knob.style.transform = '';
    });
    el.addEventListener('pointercancel', () => {
      joystick.active = false;
      joystick.x = 0;
      joystick.y = 0;
      knob.style.transform = '';
    });
  }

  /* ---------- audio ---------- */

  let audioCtx = null;
  let bgmEl = null;
  let bgmFadeTimer = null;
  let bgmMuted = false;
  try { bgmMuted = localStorage.getItem(BGM_MUTED_KEY) === '1'; } catch (e) {}

  function initBgm() {
    if (bgmEl) return bgmEl;
    bgmEl = new Audio(BGM_SRC);
    bgmEl.loop = true;
    bgmEl.preload = 'auto';
    bgmEl.volume = 0;
    bgmEl.muted = bgmMuted;
    return bgmEl;
  }

  function startBgm() {
    initBgm();
    if (bgmMuted) return;
    if (!bgmEl.paused) return;
    bgmEl.volume = 0;
    const played = bgmEl.play();
    if (played && played.then) played.then(fadeBgmIn).catch(() => {});
    else fadeBgmIn();
  }

  function fadeBgmIn() {
    if (!bgmEl || bgmMuted) return;
    if (bgmFadeTimer) clearInterval(bgmFadeTimer);
    let volume = bgmEl.volume;
    bgmFadeTimer = setInterval(() => {
      if (!bgmEl || bgmMuted) { clearInterval(bgmFadeTimer); bgmFadeTimer = null; return; }
      volume = Math.min(0.3, volume + 0.025);
      bgmEl.volume = volume;
      if (volume >= 0.3) { clearInterval(bgmFadeTimer); bgmFadeTimer = null; }
    }, 80);
  }

  function toggleSound() {
    initBgm();
    initAudio();
    bgmMuted = !bgmMuted;
    try { localStorage.setItem(BGM_MUTED_KEY, bgmMuted ? '1' : '0'); } catch (e) {}
    bgmEl.muted = bgmMuted;
    if (!bgmMuted) startBgm();
    else if (bgmFadeTimer) { clearInterval(bgmFadeTimer); bgmFadeTimer = null; }
    updateSoundButtons();
    toast(bgmMuted ? '背景音乐已关闭' : '背景音乐已开启', bgmMuted ? '' : 'gold');
  }

  function updateSoundButtons() {
    const titleBtn = document.getElementById('btn-sound');
    const hudBtn = document.getElementById('btn-sound-hud');
    if (titleBtn) {
      titleBtn.textContent = bgmMuted ? '♪ 音乐：关' : '♪ 音乐：开';
      titleBtn.classList.toggle('muted', bgmMuted);
      titleBtn.setAttribute('aria-pressed', bgmMuted ? 'false' : 'true');
    }
    if (hudBtn) {
      hudBtn.textContent = bgmMuted ? '♪' : '♫';
      hudBtn.classList.toggle('muted', bgmMuted);
      hudBtn.setAttribute('aria-label', bgmMuted ? '开启背景音乐' : '关闭背景音乐');
    }
  }

  function initAudio() {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audioCtx = new AC();
    }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  }
  function beep(freq = 440, dur = 0.06, type = 'sine', gain = 0.035) {
    if (!audioCtx || bgmMuted) return;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, audioCtx.currentTime);
    g.gain.setValueAtTime(gain, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(); o.stop(audioCtx.currentTime + dur);
  }

  /* ---------- toast ---------- */

  function toast(text, cls = '') {
    while (ui.toasts.children.length >= 3) ui.toasts.firstElementChild.remove();
    const el = document.createElement('div');
    el.className = 'toast ' + cls;
    el.textContent = text;
    ui.toasts.appendChild(el);
    setTimeout(() => {
      el.style.transition = 'opacity .3s, transform .3s';
      el.style.opacity = '0';
      el.style.transform = 'translateY(-4px)';
      setTimeout(() => el.remove(), 320);
    }, 2200);
    if (cls === 'gold') beep(880, .05, 'triangle', .035);
    else beep(520, .035, 'sine', .018);
  }

  /* ---------- utility ---------- */

  function mat(color, emissive = 0x000000, emissiveIntensity = 0, basic = false) {
    if (basic) return new THREE.MeshBasicMaterial({ color });
    return new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity, roughness: 0.78, metalness: 0.08, flatShading: true });
  }

  function smoothstep(min, max, v) {
    const x = clamp((v - min) / (max - min), 0, 1);
    return x * x * (3 - 2 * x);
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function pad2(n) { return String(n).padStart(2, '0'); }
  function angleLerp(a, b, t) {
    let d = (b - a + Math.PI) % TAU;
    if (d < 0) d += TAU;
    d -= Math.PI;
    return a + d * t;
  }
  function seededRandom(seed) {
    let s = seed >>> 0;
    return () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  if (new URLSearchParams(location.search).has('debug')) {
    window.__COLONY_DEBUG__ = {
      state,
      startRun,
      loadPlanet,
      startConstruction,
      upgradeModule,
      demolishModule,
      chooseResearch,
      launchRocket,
      updateRocketVisual,
      computeNetwork,
      rebuildNetworkVisuals,
      triggerEvent,
      startCollecting,
      addBuildSlot,
      setLinkTarget,
      pickAt,
      handleLinePick,
      toggleLineEdit,
      settlePlanet,
      screenPoint(x, y, z) {
        const v = new THREE.Vector3(x, y, z).project(camera);
        return { x: (v.x * 0.5 + 0.5) * window.innerWidth, y: (-v.y * 0.5 + 0.5) * window.innerHeight };
      },
      nextPlanet,
      openResearch,
      openBaseOverview,
      addResources(amount = 200) {
        state.resources.metal += amount;
        state.resources.ice += amount;
        state.resources.crystal += amount;
        updateHud();
      },
      buildAt(index, type) {
        state.resources.metal += 500;
        state.resources.ice += 500;
        state.resources.crystal += 500;
        const pad = state.pads[index];
        startConstruction(pad, type);
        if (pad && pad.construction) {
          pad.construction.progress = 1;
          finalizeConstruction(pad);
        }
      },
      audioState() {
        return {
          muted: bgmMuted,
          bgm: bgmEl ? { paused: bgmEl.paused, volume: +bgmEl.volume.toFixed(2), time: +bgmEl.currentTime.toFixed(2), muted: bgmEl.muted, duration: +bgmEl.duration.toFixed(2), loop: bgmEl.loop } : null
        };
      }
    };
  }

  init();
})();

