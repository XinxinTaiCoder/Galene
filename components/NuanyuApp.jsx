"use client";
import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { detectCrisis, filterAbuse } from "@/lib/safety";
import {
  Heart, MessageCircle, Home, Sparkles, Lock, Shield, Flag,
  Send, ChevronLeft, Sun, Moon, Soup, Smile, X, Lightbulb, Check, Globe
} from "lucide-react";

// ── Warm "dusk tea" palette ────────────────────────────────
const C = {
  bg: "#FBF3EC", card: "#FFFDFB", cardWarm: "#FDF1E8",
  terracotta: "#C9755A", terracottaSoft: "#E8B8A4",
  plum: "#4A2F3D", plumSoft: "#8C7480",
  sage: "#7E9484", peach: "#F5D9C8", line: "#EBDDD2",
};

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@500;700&family=Noto+Sans+SC:wght@400;500&display=swap');`;

const PIN_KEY = "galene_pin";
const LANG_KEY = "galene_lang";
const SEEN_GUIDELINES_KEY = "galene_seen_guidelines";
const ACTIVE_TS_KEY = "galene_last_active";
const GRACE_MS = 3 * 60 * 1000;
const getStoredPin = () => localStorage.getItem(PIN_KEY);
const setStoredPin = (p) => localStorage.setItem(PIN_KEY, p);
const clearStoredPin = () => localStorage.removeItem(PIN_KEY);

// ── i18n ────────────────────────────────────────────────────
const STR = {
  zh: {
    appName: "宁静之海", tagline: "一个女性本位、温柔安全的角落",
    lockSub: "输入密码进入你的安全角落", lockFoot: "别人拿到你的手机，也打不开这里",
    getStarted: "开始", next: "下一步", back: "上一步", done: "进入宁静之海", skip: "暂时跳过",
    stepAvatar: "选一个属于你的头像", stepAvatarSub: "不用真人脸，挑个你喜欢的形象",
    nickLabel: "给自己起个昵称（选填）", nickPlaceholder: "比如：晚风、小满…",
    catFlower: "花花", catAnimal: "可爱动物", catPlant: "可爱植物", catCartoon: "卡通趣味",
    stepInterests: "你喜欢些什么？", stepInterestsSub: "选几个，方便遇到同好（可多选）",
    stepStrengths: "你愿意为别人带来点什么？", stepStrengthsSub: "你最擅长、愿意分享的小本事",
    strengthsHint: "不用是什么了不起的成就，日常的小温柔就很好。",
    feedTitle: "分享", feedSub: "匿名的、温柔的、不必解释的",
    crisisTitle: "如果你现在很难受",
    crisisBody: "同伴的陪伴很珍贵，但它不能替代专业帮助。北京心理危机研究与干预中心热线：010-82951332，24 小时有人接听。",
    hug: "抱抱", reply: "回应", min: "分钟前", anon: "匿名",
    roomsTitle: "倾诉", roomsSub: "找一个房间，说说今天",
    online: "在线", guarded: "内容受社群守护",
    chatPlaceholder: "说点什么…", sendHint: "人在线",
    meName: "匿名的你", meSub: "没有人知道你是谁，这里很安全",
    meAvatar: "更换头像", meInterests: "我的兴趣", meStrengths: "我能帮上的忙",
    meHugs: "我收到的抱抱", meHugsSub: "128 个温柔的瞬间",
    meLock: "App 锁与隐私", meLockSub: "PIN / 面容解锁、聊天本地加密",
    meGuard: "社群守护设置", meGuardSub: "屏蔽词、举报记录、拉黑名单",
    tabFeed: "分享", tabRooms: "倾诉", tabMe: "我的",
    selected: "已选",
    pinStep: "设置密码锁（可选）", pinStepSub: "只保存在你的设备上，App 重启时需要输入",
    pinPrompt: "设置 4 位数字密码", pinConfirm: "再次确认密码",
    pinConfirmSub: "请再输入一次以确认",
    pinMismatch: "两次输入不一致，请重试", pinWrong: "密码错误，请再试一次",
    pinOn: "开启密码锁", pinOnSub: "为 App 添加本地保护",
    pinChange: "修改密码", pinChangeSub: "重新设置你的 4 位密码",
    pinOff: "关闭密码锁", pinOffSub: "移除本地密码保护",
    pinSetupTitle: "设置新密码",
    guideTitle: "💛 社群公约 · 点开看看我们珍视什么",
    guideClose: "收起",
  },
  en: {
    appName: "Galene", tagline: "A woman-centered, gentle, safe corner",
    lockSub: "Enter your passcode to your safe corner", lockFoot: "Even if someone grabs your phone, they can't get in here",
    getStarted: "Get started", next: "Next", back: "Back", done: "Enter Galene", skip: "Skip for now",
    stepAvatar: "Pick an avatar that feels like you", stepAvatarSub: "No real faces — choose a look you love",
    nickLabel: "Add a nickname (optional)", nickPlaceholder: "e.g. Breeze, Luna…",
    catFlower: "Flowers", catAnimal: "Cute animals", catPlant: "Cute plants", catCartoon: "Fun & cartoon",
    stepInterests: "What do you enjoy?", stepInterestsSub: "Pick a few to meet kindred spirits (multi-select)",
    stepStrengths: "What would you love to offer others?", stepStrengthsSub: "The little things you're good at and happy to share",
    strengthsHint: "No need for big achievements — everyday kindnesses count.",
    feedTitle: "Share", feedSub: "Anonymous, gentle, no need to explain",
    crisisTitle: "If you're having a hard time right now",
    crisisBody: "Peer company is precious, but it can't replace professional help. If you're in the US, you can call or text 988 (Suicide & Crisis Lifeline), available 24/7.",
    hug: "Hug", reply: "Reply", min: "min ago", anon: "anonymous",
    roomsTitle: "Confide", roomsSub: "Find a room, talk about your day",
    online: "online", guarded: "Protected by community care",
    chatPlaceholder: "Say something…", sendHint: "online",
    meName: "Anonymous you", meSub: "No one knows who you are — you're safe here",
    meAvatar: "Change avatar", meInterests: "My interests", meStrengths: "How I can help",
    meHugs: "Hugs I've received", meHugsSub: "128 gentle moments",
    meLock: "App lock & privacy", meLockSub: "PIN / Face unlock, local chat encryption",
    meGuard: "Community-care settings", meGuardSub: "Filtered words, reports, block list",
    tabFeed: "Share", tabRooms: "Confide", tabMe: "Me",
    selected: "selected",
    pinStep: "Set a passcode (optional)", pinStepSub: "Stored only on this device — required each time the app opens",
    pinPrompt: "Choose a 4-digit passcode", pinConfirm: "Confirm your passcode",
    pinConfirmSub: "Enter it once more to confirm",
    pinMismatch: "Passcodes don't match — please try again", pinWrong: "Wrong passcode, please try again",
    pinOn: "Turn on passcode lock", pinOnSub: "Add local protection to the app",
    pinChange: "Change passcode", pinChangeSub: "Set a new 4-digit passcode",
    pinOff: "Turn off passcode lock", pinOffSub: "Remove local passcode protection",
    pinSetupTitle: "Set new passcode",
    guideTitle: "💛 Community Values · See what we care about",
    guideClose: "Collapse",
  },
};

// ── Data ────────────────────────────────────────────────────
const AVATARS = {
  people: ["👩","👩🏻","👩🏽","👩🏿","🧚‍♀️","💃","👸","🧜‍♀️","👩‍🎨","👩‍💻","👩‍🎤","👩‍🍳"],
  heart:  ["❤️","🧡","💛","💚","💙","💜","🤍","🖤","💗","💖","💝","🫶"],
  plant:  ["🌹","🌷","🌸","🪷","🌺","💐","🪻","🌻","🌿","🍀","🪴","🎋"],
  animal: ["🐱","🐶","🐰","🦊","🐻","🐼","🐨","🦁","🐸","🦋","🐧","🦉"],
  food:   ["🍜","🧁","🍰","🍩","🍪","🍫","🍡","🍭","☕","🍵","🍦","🥐"],
};

const AVATAR_CATS = [
  { id: "people", zh: "人物", en: "People"  },
  { id: "heart",  zh: "爱心", en: "Hearts"  },
  { id: "plant",  zh: "植物", en: "Plants"  },
  { id: "animal", zh: "动物", en: "Animals" },
  { id: "food",   zh: "美食", en: "Food"    },
];

const INTERESTS = [
  { id: "read", zh: "读书", en: "Reading" }, { id: "film", zh: "电影", en: "Film" },
  { id: "food", zh: "美食", en: "Food" }, { id: "travel", zh: "旅行", en: "Travel" },
  { id: "pets", zh: "猫猫狗狗", en: "Cats & dogs" }, { id: "music", zh: "音乐", en: "Music" },
  { id: "psy", zh: "心理学", en: "Psychology" }, { id: "craft", zh: "手工", en: "Crafts" },
  { id: "fit", zh: "健身", en: "Fitness" }, { id: "game", zh: "游戏", en: "Gaming" },
  { id: "style", zh: "穿搭", en: "Style" }, { id: "plant", zh: "植物", en: "Plants" },
  { id: "photo", zh: "摄影", en: "Photography" }, { id: "career", zh: "职场", en: "Career" },
  { id: "fact", zh: "科学知识", en: "Science" },
];

const STRENGTHS = [
  { id: "listen", zh: "我是个好听众", en: "A good listener" },
  { id: "night", zh: "陪你聊到天亮", en: "Late-night company" },
  { id: "resume", zh: "简历互相看看", en: "Resume swaps" },
  { id: "cook", zh: "做饭烘焙心得", en: "Cooking & baking tips" },
  { id: "recs", zh: "推荐书和电影", en: "Book & film recs" },
  { id: "plant", zh: "帮你养活植物", en: "Keeping plants alive" },
  { id: "photo", zh: "拍照构图小技巧", en: "Photo tips" },
  { id: "lang", zh: "语言学习搭子", en: "Language buddy" },
  { id: "travel", zh: "旅行避坑攻略", en: "Travel know-how" },
  { id: "first", zh: "情绪急救包", en: "Emotional first-aid" },
  { id: "diy", zh: "手工 / DIY", en: "Crafts & DIY" },
  { id: "move", zh: "一起动起来", en: "Workout buddy" },
];

const FEED = [
  { id: 1, av: "🦊", name: { zh: "晚风里的猫", en: "Cat in the Breeze" }, color: "#E8B8A4", mins: 12,
    tag: { zh: "今日趣事", en: "Today's fun" },
    text: { zh: "今天面试官问我最大的缺点，我脱口而出『太诚实』，然后我俩都沉默了三秒😶 现在想想还是想笑。",
            en: "Interviewer asked my biggest flaw, I blurted out 'too honest' — then we both went silent for three seconds 😶 Still cracks me up." },
    hugs: 24, replies: 6 },
  { id: 2, av: "🌷", name: { zh: "一杯温水", en: "Cup of Warm Water" }, color: "#A9C2B4", mins: 38,
    tag: { zh: "美食", en: "Food" },
    text: { zh: "下班路上买了块还热乎的桂花糕，一个人坐在台阶上吃完了。普通的一天，被一口甜救活了。",
            en: "Grabbed a warm osmanthus cake on the way home, ate it alone on the steps. An ordinary day, saved by one sweet bite." },
    img: "🍡", hugs: 41, replies: 9 },
  { id: 3, av: "🦉", name: { zh: "深夜不打烊", en: "Open All Night" }, color: "#D4A5B8", mins: 65,
    tag: { zh: "想倾诉", en: "Need to talk" },
    text: { zh: "最近总觉得没人能接住我说的话。不是没朋友，是不忍心一直麻烦同一个人。来这里说一句，轻松一点。",
            en: "Lately it feels like no one can quite hold what I say. Not that I have no friends — I just can't keep leaning on the same person. Saying it here helps." },
    hugs: 88, replies: 23 },
  { id: 4, av: "🦄", name: { zh: "云朵收集者", en: "Cloud Collector" }, color: "#E8C9A4", mins: 120,
    tag: { zh: "可爱meme", en: "Cute meme" },
    text: { zh: "送大家一只今天的精神状态↓", en: "Here's my mental state today ↓" },
    img: "🫠", hugs: 56, replies: 4 },
];

const ROOMS = [
  { id: "r1", slug: "late-night", icon: Moon, accent: "#8C7480", online: 47,
    title: { zh: "深夜倾诉所", en: "Late-Night Confessions" },
    desc: { zh: "睡不着的时候，有人陪你说说话", en: "When you can't sleep, someone's here to talk" } },
  { id: "r4", slug: "sweetness", icon: Soup, accent: "#7E9484", online: 92,
    title: { zh: "今天有点甜", en: "A Little Sweetness" },
    desc: { zh: "只发开心的事、好吃的、可爱的", en: "Only happy things, good food, cute stuff" } },
  { id: "r2", slug: "job-hunt", icon: Sun, accent: "#C9755A", online: 31,
    title: { zh: "求职互助角", en: "Job-Hunt Support" },
    desc: { zh: "面试、拒信、迷茫，我们都懂", en: "Interviews, rejections, doubt — we get it" } },
  { id: "r3", slug: "fun-fact", icon: Lightbulb, accent: "#D4A15A", online: 58,
    title: { zh: "Fun Fact 知识角", en: "Fun Fact Corner" },
    desc: { zh: "分享一个科学小知识，一起涨见识、慢慢成长", en: "Share a science nugget, grow and learn together" } },
];

const ROOM_MSGS = {
  zh: [
    { id: 1, av: "✨", name: "萤火", text: "刚收到第三封拒信，有点撑不住了。", me: false },
    { id: 2, name: "你", text: "抱抱你。拒信真的不代表你不够好，先喝口水。", me: true },
    { id: 3, av: "🌿", name: "小满", text: "我上个月连拒七封，现在 offer 在手了。会过去的，真的。", me: false },
  ],
  en: [
    { id: 1, av: "✨", name: "Firefly", text: "Just got my third rejection, barely holding it together.", me: false },
    { id: 2, name: "You", text: "Sending you a hug. A rejection doesn't mean you're not enough — drink some water first.", me: true },
    { id: 3, av: "🌿", name: "Xiaoman", text: "I got seven rejections last month and now I have an offer. It does pass, truly.", me: false },
  ],
};

// ── Small bits ──────────────────────────────────────────────
function LangToggle({ lang, setLang, dark }) {
  return (
    <button onClick={() => setLang(lang === "zh" ? "en" : "zh")}
      style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px",
        borderRadius: 999, border: `1px solid ${dark ? "rgba(255,255,255,.3)" : C.line}`,
        background: dark ? "rgba(255,255,255,.12)" : C.card,
        color: dark ? "#fff" : C.plum, fontSize: 12.5, cursor: "pointer" }}>
      <Globe size={13} /> {lang === "zh" ? "EN" : "中文"}
    </button>
  );
}

function Chip({ label, active, onClick }) {
  return (
    <button onClick={onClick}
      style={{ padding: "9px 15px", borderRadius: 999, cursor: "pointer",
        border: `1px solid ${active ? C.terracotta : C.line}`,
        background: active ? C.peach : C.card,
        color: active ? C.terracotta : C.plumSoft, fontSize: 13.5,
        display: "inline-flex", alignItems: "center", gap: 6, transition: "all .18s" }}>
      {active && <Check size={13} />}{label}
    </button>
  );
}

function Avatar({ emoji, color = C.peach, size = 40 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: 999, flexShrink: 0,
      background: color, display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.52 }}>{emoji}</div>
  );
}

// ── PIN components ──────────────────────────────────────────
function PinDots({ filled }) {
  return (
    <div style={{ display: "flex", gap: 18, justifyContent: "center" }}>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} style={{ width: 16, height: 16, borderRadius: "50%",
          border: `2px solid ${C.terracotta}`,
          background: i < filled ? C.terracotta : "transparent", transition: "background .15s" }} />
      ))}
    </div>
  );
}

const KEYPAD_ROWS = [["1","2","3"],["4","5","6"],["7","8","9"],["","0","⌫"]];

function PinKeypad({ onPress }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, width: 240 }}>
      {KEYPAD_ROWS.flat().map((k, i) =>
        k === "" ? <div key={i} /> : (
          <button key={i} onClick={() => onPress(k)}
            style={{ height: 60, borderRadius: 16, border: `1px solid ${C.line}`,
              background: k === "⌫" ? "transparent" : C.card,
              fontSize: k === "⌫" ? 20 : 24, color: C.plum, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 8px rgba(74,47,61,.07)" }}>
            {k}
          </button>
        )
      )}
    </div>
  );
}

function LockScreen({ lang, setLang, onUnlock }) {
  const t = STR[lang];
  const [entry, setEntry] = useState("");
  const [error, setError] = useState(false);

  const handleKey = (key) => {
    if (key === "⌫") { setEntry((e) => e.slice(0, -1)); setError(false); return; }
    const next = entry + key;
    if (next.length > 4) return;
    setEntry(next);
    if (next.length === 4) {
      if (next === getStoredPin()) { onUnlock(); }
      else { setError(true); setEntry(""); }
    }
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center",
      background: `radial-gradient(120% 60% at 50% 0%, ${C.peach} 0%, ${C.bg} 50%)`,
      position: "relative" }}>
      <div style={{ position: "absolute", top: 14, right: 16 }}>
        <LangToggle lang={lang} setLang={setLang} />
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", padding: "0 24px" }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>🔐</div>
        <div style={{ fontFamily: "'Noto Serif SC',serif", fontSize: 26, color: C.plum,
          fontWeight: 700 }}>{t.appName}</div>
        <div style={{ color: C.plumSoft, fontSize: 13.5, marginTop: 8, marginBottom: 36,
          textAlign: "center" }}>{t.lockSub}</div>
        <PinDots filled={entry.length} />
        {error && <div style={{ color: C.terracotta, fontSize: 13, marginTop: 14 }}>{t.pinWrong}</div>}
        <div style={{ marginTop: error ? 14 : 28 }}><PinKeypad onPress={handleKey} /></div>
        <div style={{ color: C.plumSoft, fontSize: 12, marginTop: 32,
          textAlign: "center" }}>{t.lockFoot}</div>
      </div>
    </div>
  );
}

function GuidelinesBanner({ lang, permanent = false }) {
  const t = STR[lang];
  const g = GUIDELINES[lang];
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (permanent) { setVisible(true); return; }
    if (!localStorage.getItem(SEEN_GUIDELINES_KEY)) {
      localStorage.setItem(SEEN_GUIDELINES_KEY, "1");
      setVisible(true);
    }
  }, [permanent]);

  if (!visible) return null;

  return (
    <div style={{ margin: "0 16px 14px", borderRadius: 16, border: `1px solid ${C.terracottaSoft}`,
      background: C.cardWarm, overflow: "hidden" }}>
      <button onClick={() => setOpen((v) => !v)}
        style={{ width: "100%", padding: "12px 16px", background: "none", border: "none",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between",
          textAlign: "left" }}>
        <span style={{ fontSize: 13.5, color: C.terracotta, fontWeight: 500 }}>{t.guideTitle}</span>
        <span style={{ fontSize: 16, color: C.terracotta, display: "inline-block",
          transition: "transform .2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>▾</span>
      </button>
      {open && (
        <div style={{ padding: "0 16px 14px" }}>
          {g.items.map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
              <div style={{ width: 5, height: 5, borderRadius: 999, background: C.terracotta,
                flexShrink: 0, marginTop: 8 }} />
              <div style={{ fontSize: 13, color: C.plum, lineHeight: 1.75 }}>{item}</div>
            </div>
          ))}
          <button onClick={() => setOpen(false)}
            style={{ marginTop: 4, fontSize: 12.5, color: C.plumSoft, background: "none",
              border: "none", cursor: "pointer", padding: 0, textDecoration: "underline" }}>
            {t.guideClose}
          </button>
        </div>
      )}
    </div>
  );
}

function PinSetupModal({ lang, onDone, onClose }) {
  const t = STR[lang];
  const [stage, setStage] = useState("prompt");
  const [first, setFirst] = useState("");
  const [entry, setEntry] = useState("");
  const [error, setError] = useState("");

  const handleKey = (key) => {
    if (key === "⌫") { setEntry((e) => e.slice(0, -1)); setError(""); return; }
    const next = entry + key;
    if (next.length > 4) return;
    setEntry(next);
    if (next.length === 4) {
      if (stage === "prompt") {
        setFirst(next); setEntry(""); setStage("confirm"); setError("");
      } else {
        if (next === first) { onDone(next); }
        else { setError(t.pinMismatch); setEntry(""); setStage("prompt"); setFirst(""); }
      }
    }
  };

  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(74,47,61,.55)",
      display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 200 }}>
      <div style={{ background: C.bg, borderRadius: "24px 24px 0 0", padding: "28px 24px 40px",
        width: "100%", boxShadow: "0 -8px 32px rgba(74,47,61,.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontFamily: "'Noto Serif SC',serif", fontSize: 18, color: C.plum,
            fontWeight: 700 }}>{t.pinSetupTitle}</div>
          <button onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: C.plumSoft }}>
            <X size={20} />
          </button>
        </div>
        <div style={{ fontSize: 14, color: C.plumSoft, marginBottom: 28, textAlign: "center" }}>
          {stage === "prompt" ? t.pinPrompt : t.pinConfirmSub}
        </div>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
          <PinDots filled={entry.length} />
        </div>
        {error && <div style={{ color: C.terracotta, fontSize: 13, textAlign: "center",
          marginBottom: 12 }}>{error}</div>}
        <div style={{ display: "flex", justifyContent: "center", marginTop: error ? 8 : 20 }}>
          <PinKeypad onPress={handleKey} />
        </div>
      </div>
    </div>
  );
}

// ── Onboarding ──────────────────────────────────────────────
function Onboarding({ lang, setLang, onDone, saving }) {
  const t = STR[lang];
  const [step, setStep] = useState(0); // 0 welcome,1 avatar,2 interests,3 strengths,4 pin
  const [cat, setCat] = useState("people");
  const [avatar, setAvatar] = useState(null);
  const [nickname, setNickname] = useState("");
  const [interests, setInterests] = useState([]);
  const [strengths, setStrengths] = useState([]);
  const [pinStage, setPinStage] = useState("prompt");
  const [pinFirst, setPinFirst] = useState("");
  const [pinEntry, setPinEntry] = useState("");
  const [pinError, setPinError] = useState("");

  const toggle = (arr, set, id) =>
    set(arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);

  const finish = (pin) => {
    if (pin) setStoredPin(pin);
    onDone({ avatar: avatar || "👩", nickname: nickname.trim(), interests, strengths });
  };

  const handlePinKey = (key) => {
    if (key === "⌫") { setPinEntry((e) => e.slice(0, -1)); setPinError(""); return; }
    const next = pinEntry + key;
    if (next.length > 4) return;
    setPinEntry(next);
    if (next.length === 4) {
      if (pinStage === "prompt") {
        setPinFirst(next); setPinEntry(""); setPinStage("confirm"); setPinError("");
      } else {
        if (next === pinFirst) { finish(next); }
        else {
          setPinError(t.pinMismatch);
          setPinEntry(""); setPinStage("prompt"); setPinFirst("");
        }
      }
    }
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column",
      background: `radial-gradient(120% 60% at 50% 0%, ${C.peach} 0%, ${C.bg} 50%)` }}>
      <div style={{ display: "flex", justifyContent: "flex-end", padding: "14px 16px 0" }}>
        <LangToggle lang={lang} setLang={setLang} />
      </div>

      {step === 0 && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", padding: 36, textAlign: "center" }}>
          <Avatar emoji="🌿" color={C.card} size={72} />
          <div style={{ fontFamily: "'Noto Serif SC',serif", fontSize: 30, fontWeight: 700,
            color: C.plum, marginTop: 18 }}>{t.appName}</div>
          <div style={{ color: C.plumSoft, fontSize: 14, marginTop: 12, lineHeight: 1.6 }}>{t.tagline}</div>
          <button onClick={() => setStep(1)}
            style={{ marginTop: 40, width: "100%", padding: 15, borderRadius: 16, border: "none",
              background: C.terracotta, color: "#fff", fontSize: 15.5, cursor: "pointer",
              fontFamily: "'Noto Serif SC',serif" }}>{t.getStarted}</button>
        </div>
      )}

      {step > 0 && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* progress */}
          <div style={{ display: "flex", gap: 6, padding: "12px 24px 0" }}>
            {[1, 2, 3, 4].map((s) => (
              <div key={s} style={{ flex: 1, height: 4, borderRadius: 999,
                background: s <= step ? C.terracotta : C.line }} />
            ))}
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "22px 24px" }}>
            {step === 1 && (
              <>
                <div style={{ fontFamily: "'Noto Serif SC',serif", fontSize: 21, color: C.plum, fontWeight: 700 }}>{t.stepAvatar}</div>
                <div style={{ color: C.plumSoft, fontSize: 13, marginTop: 6, marginBottom: 18 }}>{t.stepAvatarSub}</div>
                <div style={{ display: "flex", gap: 7, overflowX: "auto", marginBottom: 16,
                  paddingBottom: 4, WebkitOverflowScrolling: "touch" }}>
                  {AVATAR_CATS.map((c) => (
                    <button key={c.id} onClick={() => setCat(c.id)}
                      style={{ padding: "6px 12px", borderRadius: 999, cursor: "pointer", fontSize: 12.5,
                        flexShrink: 0, border: `1px solid ${cat === c.id ? C.terracotta : C.line}`,
                        background: cat === c.id ? C.terracotta : C.card,
                        color: cat === c.id ? "#fff" : C.plumSoft }}>{c[lang]}</button>
                  ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
                  {AVATARS[cat].map((e) => (
                    <button key={e} onClick={() => setAvatar(e)}
                      style={{ aspectRatio: "1", borderRadius: 16, cursor: "pointer", fontSize: 34,
                        border: `2px solid ${avatar === e ? C.terracotta : C.line}`,
                        background: avatar === e ? C.peach : C.card,
                        display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s" }}>{e}</button>
                  ))}
                </div>
                <div style={{ marginTop: 20 }}>
                  <div style={{ fontSize: 13, color: C.plumSoft, marginBottom: 8 }}>{t.nickLabel}</div>
                  <input value={nickname} onChange={(e) => setNickname(e.target.value)} maxLength={16}
                    placeholder={t.nickPlaceholder}
                    style={{ width: "100%", boxSizing: "border-box", border: `1px solid ${C.line}`,
                      borderRadius: 12, padding: "12px 14px", fontSize: 14, outline: "none",
                      background: C.card, color: C.plum }} />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div style={{ fontFamily: "'Noto Serif SC',serif", fontSize: 21, color: C.plum, fontWeight: 700 }}>{t.stepInterests}</div>
                <div style={{ color: C.plumSoft, fontSize: 13, marginTop: 6, marginBottom: 18 }}>{t.stepInterestsSub}</div>
                <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
                  {INTERESTS.map((it) => (
                    <Chip key={it.id} label={it[lang]} active={interests.includes(it.id)}
                      onClick={() => toggle(interests, setInterests, it.id)} />
                  ))}
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div style={{ fontFamily: "'Noto Serif SC',serif", fontSize: 21, color: C.plum, fontWeight: 700 }}>{t.stepStrengths}</div>
                <div style={{ color: C.plumSoft, fontSize: 13, marginTop: 6 }}>{t.stepStrengthsSub}</div>
                <div style={{ background: C.cardWarm, borderRadius: 12, padding: "10px 13px",
                  fontSize: 12.5, color: C.terracotta, margin: "12px 0 18px", lineHeight: 1.6 }}>
                  🌿 {t.strengthsHint}
                </div>
                <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
                  {STRENGTHS.map((s) => (
                    <Chip key={s.id} label={s[lang]} active={strengths.includes(s.id)}
                      onClick={() => toggle(strengths, setStrengths, s.id)} />
                  ))}
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <div style={{ fontFamily: "'Noto Serif SC',serif", fontSize: 21, color: C.plum,
                  fontWeight: 700 }}>{t.pinStep}</div>
                <div style={{ color: C.plumSoft, fontSize: 13, marginTop: 6,
                  marginBottom: 28 }}>{t.pinStepSub}</div>
                <div style={{ fontSize: 14, color: C.plum, textAlign: "center",
                  marginBottom: 24 }}>
                  {pinStage === "prompt" ? t.pinPrompt : t.pinConfirmSub}
                </div>
                <PinDots filled={pinEntry.length} />
                {pinError && (
                  <div style={{ color: C.terracotta, fontSize: 13, textAlign: "center",
                    marginTop: 14 }}>{pinError}</div>
                )}
                <div style={{ display: "flex", justifyContent: "center",
                  marginTop: pinError ? 14 : 28 }}>
                  <PinKeypad onPress={handlePinKey} />
                </div>
              </>
            )}
          </div>

          {/* footer nav */}
          <div style={{ display: "flex", gap: 12, padding: "12px 24px 22px", borderTop: `1px solid ${C.line}` }}>
            <button onClick={() => { setStep(step - 1); setPinStage("prompt"); setPinFirst(""); setPinEntry(""); setPinError(""); }}
              style={{ padding: "13px 20px", borderRadius: 14, cursor: "pointer", fontSize: 14,
                border: `1px solid ${C.line}`, background: "transparent", color: C.plumSoft }}>{t.back}</button>
            {step < 4 ? (
              <button
                onClick={() => step < 3 ? setStep(step + 1) : setStep(4)}
                disabled={(step === 1 && !avatar) || saving}
                style={{ flex: 1, padding: 13, borderRadius: 14, border: "none", fontSize: 15, cursor: "pointer",
                  background: (step === 1 && !avatar) || saving ? C.terracottaSoft : C.terracotta,
                  color: "#fff", fontFamily: "'Noto Serif SC',serif" }}>
                {step < 3 ? t.next : saving ? (lang === "zh" ? "保存中…" : "Saving…") : t.next}
              </button>
            ) : (
              <button onClick={() => finish(null)} disabled={saving}
                style={{ flex: 1, padding: 13, borderRadius: 14, border: "none", fontSize: 15,
                  cursor: saving ? "default" : "pointer",
                  background: saving ? C.terracottaSoft : C.terracotta,
                  color: "#fff", fontFamily: "'Noto Serif SC',serif" }}>
                {saving ? (lang === "zh" ? "保存中…" : "Saving…") : t.skip}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Reaction ────────────────────────────────────────────────
function Reaction({ icon: Icon, label, count, active, onClick }) {
  return (
    <button onClick={onClick}
      style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 999,
        border: `1px solid ${active ? C.terracotta : C.line}`,
        background: active ? C.peach : "transparent",
        color: active ? C.terracotta : C.plumSoft, fontSize: 13, cursor: "pointer", transition: "all .2s" }}>
      <Icon size={14} fill={active ? C.terracotta : "none"} />
      <span>{label}</span><span style={{ fontWeight: 500 }}>{count}</span>
    </button>
  );
}

function CrisisModal({ lang, onClose }) {
  const isZh = lang === "zh";
  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(74,47,61,.5)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24, zIndex: 100 }}>
      <div style={{ background: C.card, borderRadius: 22, padding: 24,
        border: `1px solid ${C.terracottaSoft}`,
        boxShadow: "0 8px 32px rgba(74,47,61,.2)" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 14 }}>
          <Heart size={20} color={C.terracotta} fill={C.terracotta} style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: 14, fontFamily: "'Noto Serif SC',serif",
            color: C.plum, fontWeight: 700 }}>
            {isZh ? "你不是一个人" : "You are not alone"}
          </div>
        </div>
        <div style={{ fontSize: 13.5, color: C.plum, lineHeight: 1.8, marginBottom: 20 }}>
          {isZh
            ? "看到你现在可能很难受。同伴的陪伴很珍贵，但它无法替代专业帮助。北京心理危机研究与干预中心热线：010-82951332，24 小时有人接听。你不是一个人。"
            : "It sounds like you're going through something heavy right now. Peer support matters, but it can't replace professional help. If you're in the US, you can call or text 988 (Suicide & Crisis Lifeline), 24/7. You are not alone."}
        </div>
        <button onClick={onClose}
          style={{ width: "100%", padding: "12px 0", borderRadius: 14, border: "none",
            background: C.terracotta, color: "#fff", fontSize: 14.5, cursor: "pointer",
            fontFamily: "'Noto Serif SC',serif" }}>
          {isZh ? "我知道了" : "Got it"}
        </button>
      </div>
    </div>
  );
}

function AbuseModal({ lang, onClose }) {
  const isZh = lang === "zh";
  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(74,47,61,.5)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24, zIndex: 100 }}>
      <div style={{ background: C.card, borderRadius: 22, padding: 24,
        border: `1px solid ${C.terracottaSoft}`,
        boxShadow: "0 8px 32px rgba(74,47,61,.2)" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 14 }}>
          <Shield size={20} color={C.terracotta} style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: 14, fontFamily: "'Noto Serif SC',serif",
            color: C.plum, fontWeight: 700 }}>
            {isZh ? "换个说法？" : "Want to rephrase?"}
          </div>
        </div>
        <div style={{ fontSize: 13.5, color: C.plum, lineHeight: 1.8, marginBottom: 20 }}>
          {isZh
            ? "这条里好像有些带攻击性的词。要不要换个说法再发？我们希望这里让每个人都觉得安全、被善待。"
            : "This message seems to contain some hurtful words. Want to rephrase it before posting? We're trying to keep this a space where everyone feels safe and cared for."}
        </div>
        <button onClick={onClose}
          style={{ width: "100%", padding: "12px 0", borderRadius: 14, border: "none",
            background: C.terracotta, color: "#fff", fontSize: 14.5, cursor: "pointer",
            fontFamily: "'Noto Serif SC',serif" }}>
          {isZh ? "好的，我改改" : "Got it, let me rephrase"}
        </button>
      </div>
    </div>
  );
}

function CrisisBanner({ t, onClose }) {
  return (
    <div style={{ margin: "0 16px 14px", padding: 14, borderRadius: 16,
      background: "#FDF6F2", border: `1px solid ${C.terracottaSoft}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "flex", gap: 10 }}>
          <Heart size={18} color={C.terracotta} style={{ marginTop: 2, flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 13.5, color: C.plum, fontWeight: 500, marginBottom: 4 }}>{t.crisisTitle}</div>
            <div style={{ fontSize: 12.5, color: C.plumSoft, lineHeight: 1.6 }}>{t.crisisBody}</div>
          </div>
        </div>
        <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: C.plumSoft }}>
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

// ── Compose Box ─────────────────────────────────────────────
const COMPOSE_EMOJIS = ["🍜", "🫠", "🌿", "☀️", "🌙", "✨", "☕", "🌸"];

const CHAT_EMOJIS = [
  "😊","😄","😂","🥹","😭","😍","🥰","😘","😅","🥺","😩","😤",
  "😴","🤔","🫠","😌","🥲","😔","🤗","🫶",
  "❤️","🧡","💛","💚","💙","💜","🤍","💗","💖","💝",
  "🌸","🌷","🌻","🌺","🌿","🍀","☀️","🌈","🌙","✨","💫","⭐",
  "🐱","🐰","🦊","🐻","🐼","🦉","🐸","🦋",
  "🍜","🧁","🍰","🍩","🍪","🍫","☕","🍵",
  "🎉","🎊","🎈","🌟","🫧","👏","🙌","💪",
];
const COMPOSE_TAGS = {
  zh: ["今日趣事", "美食", "想倾诉", "可爱meme", "职场", "心情"],
  en: ["Today's fun", "Food", "Need to talk", "Cute meme", "Career", "Mood"],
};

function ComposeBox({ lang, profile, text, onTextChange, emoji, onEmojiChange, tag, onTagChange, publishing, onPublish }) {
  return (
    <div style={{ margin: "0 16px 14px", background: C.card, borderRadius: 18,
      padding: 14, border: `1px solid ${C.line}` }}>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        <Avatar emoji={profile?.avatar || "🌿"} color={C.peach} size={32} />
        <textarea
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder={lang === "zh" ? "说点什么，匿名的、温柔的…" : "Share something, anonymously and gently…"}
          maxLength={300}
          rows={2}
          style={{ flex: 1, border: "none", outline: "none", resize: "none", fontSize: 14,
            color: C.plum, background: "transparent", lineHeight: 1.6,
            fontFamily: "'Noto Sans SC',-apple-system,sans-serif" }}
        />
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
        {COMPOSE_EMOJIS.map((e) => (
          <button key={e} onClick={() => onEmojiChange(emoji === e ? "" : e)}
            style={{ width: 30, height: 30, borderRadius: 8, cursor: "pointer", fontSize: 16,
              border: `1px solid ${emoji === e ? C.terracotta : C.line}`,
              background: emoji === e ? C.peach : "transparent" }}>{e}</button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
        {COMPOSE_TAGS[lang].map((tg) => (
          <button key={tg} onClick={() => onTagChange(tag === tg ? "" : tg)}
            style={{ padding: "4px 10px", borderRadius: 999, fontSize: 12, cursor: "pointer",
              border: `1px solid ${tag === tg ? C.terracotta : C.line}`,
              background: tag === tg ? C.peach : "transparent",
              color: tag === tg ? C.terracotta : C.plumSoft }}>{tg}</button>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
        <button onClick={onPublish} disabled={!text.trim() || publishing}
          style={{ padding: "8px 18px", borderRadius: 999, border: "none", fontSize: 13, cursor: "pointer",
            background: !text.trim() || publishing ? C.terracottaSoft : C.terracotta,
            color: "#fff", fontFamily: "'Noto Serif SC',serif" }}>
          {publishing ? (lang === "zh" ? "发布中…" : "Posting…") : (lang === "zh" ? "发布" : "Post")}
        </button>
      </div>
    </div>
  );
}

// ── Post Card ────────────────────────────────────────────────
function PostCard({ post, lang, t, hugged, hugCount, onHug, onReport, reported, timeAgo }) {
  const author = post.profiles || {};
  const av = author.avatar || "🌿";
  const name = author.nickname || (lang === "zh" ? "匿名" : "anonymous");
  return (
    <div style={{ margin: "0 16px 14px", background: C.card, borderRadius: 18,
      padding: 16, border: `1px solid ${C.line}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <Avatar emoji={av} color={C.peach} size={34} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13.5, color: C.plum, fontWeight: 500 }}>{name}</div>
          <div style={{ fontSize: 11, color: C.plumSoft }}>{timeAgo(post.created_at)} · {t.anon}</div>
        </div>
        {post.tag && (
          <span style={{ fontSize: 11, color: C.sage, background: "#EEF3EF",
            padding: "3px 9px", borderRadius: 999 }}>{post.tag}</span>
        )}
      </div>
      <div style={{ fontSize: 14.5, color: C.plum, lineHeight: 1.7 }}>{post.body}</div>
      {post.image_emoji && (
        <div style={{ marginTop: 12, height: 130, borderRadius: 14, background: C.cardWarm,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 56 }}>{post.image_emoji}</div>
      )}
      <div style={{ display: "flex", gap: 8, marginTop: 14, alignItems: "center" }}>
        <Reaction icon={Heart} label={t.hug} count={hugCount} active={hugged} onClick={onHug} />
        {reported ? (
          <span style={{ marginLeft: "auto", fontSize: 12, color: C.sage }}>
            {lang === "zh" ? "已收到，我们会查看 🌿" : "Received, we'll review 🌿"}
          </span>
        ) : (
          <button onClick={onReport}
            style={{ marginLeft: "auto", border: "none", background: "none",
              color: C.plumSoft, cursor: "pointer", display: "flex", alignItems: "center" }}>
            <Flag size={15} />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Feed ────────────────────────────────────────────────────
function Feed({ lang, userId, profile, onCrisisDetected, onAbuseDetected }) {
  const t = STR[lang];
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myHugs, setMyHugs] = useState(new Set());
  const [hugCounts, setHugCounts] = useState({});
  const [reportedIds, setReportedIds] = useState(new Set());
  const [showCrisis, setShowCrisis] = useState(true);
  const [composeText, setComposeText] = useState("");
  const [composeEmoji, setComposeEmoji] = useState("");
  const [composeTag, setComposeTag] = useState("");
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      setLoading(true);
      try {
        const { data: blockData } = await supabase
          .from("blocks").select("blocked_id").eq("blocker_id", userId);
        const blocked = new Set((blockData || []).map((b) => b.blocked_id));

        const { data: postsData, error } = await supabase
          .from("posts")
          .select("*, profiles!author_id(nickname, avatar)")
          .eq("hidden", false)
          .order("created_at", { ascending: false })
          .limit(50);
        if (error) throw error;

        const visible = (postsData || []).filter((p) => !blocked.has(p.author_id));
        setPosts(visible);

        if (visible.length > 0) {
          const ids = visible.map((p) => p.id);
          const { data: hugData } = await supabase
            .from("hugs").select("post_id, profile_id").in("post_id", ids);
          const counts = {};
          const mine = new Set();
          (hugData || []).forEach((h) => {
            counts[h.post_id] = (counts[h.post_id] || 0) + 1;
            if (h.profile_id === userId) mine.add(h.post_id);
          });
          setHugCounts(counts);
          setMyHugs(mine);
        }
      } catch (err) {
        console.error("Feed load error:", err?.message, err?.code, err?.details, err?.hint, err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  const timeAgo = (dateStr) => {
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 60000);
    if (diff < 1) return lang === "zh" ? "刚刚" : "just now";
    if (diff < 60) return `${diff} ${t.min}`;
    const hrs = Math.floor(diff / 60);
    if (hrs < 24) return lang === "zh" ? `${hrs} 小时前` : `${hrs}h ago`;
    return lang === "zh" ? `${Math.floor(hrs / 24)} 天前` : `${Math.floor(hrs / 24)}d ago`;
  };

  const toggleHug = async (postId) => {
    const wasHugged = myHugs.has(postId);
    const prevCount = hugCounts[postId] || 0;
    const newMine = new Set(myHugs);
    if (wasHugged) newMine.delete(postId); else newMine.add(postId);
    setMyHugs(newMine);
    setHugCounts((prev) => ({ ...prev, [postId]: Math.max(0, (prev[postId] || 0) + (wasHugged ? -1 : 1)) }));
    try {
      if (wasHugged) {
        await supabase.from("hugs").delete().eq("post_id", postId).eq("profile_id", userId);
      } else {
        await supabase.from("hugs").insert({ post_id: postId, profile_id: userId });
      }
    } catch (err) {
      setMyHugs(myHugs);
      setHugCounts((prev) => ({ ...prev, [postId]: prevCount }));
      console.error("Hug error:", err?.message, err?.code, err?.details, err?.hint, err);
    }
  };

  const report = async (postId) => {
    try {
      await supabase.from("reports").insert({
        target_type: "post", target_id: postId, reporter_id: userId, reason: null,
      });
      setReportedIds((prev) => new Set([...prev, postId]));
    } catch (err) {
      console.error("Report error:", err?.message, err?.code, err?.details, err?.hint, err);
    }
  };

  const publish = async () => {
    if (!composeText.trim() || !userId) return;
    if (filterAbuse(composeText.trim())) { onAbuseDetected(); return; }
    setPublishing(true);
    try {
      const { data, error } = await supabase
        .from("posts")
        .insert({ author_id: userId, body: composeText.trim(), tag: composeTag || null, image_emoji: composeEmoji || null, hidden: false })
        .select("*, profiles!author_id(nickname, avatar)")
        .single();
      if (error) throw error;
      setPosts((prev) => [data, ...prev]);
      setHugCounts((prev) => ({ ...prev, [data.id]: 0 }));
      if (detectCrisis(data.body)) onCrisisDetected();
      setComposeText(""); setComposeEmoji(""); setComposeTag("");
    } catch (err) {
      console.error("Publish error:", err?.message, err?.code, err?.details, err?.hint, err);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div style={{ paddingBottom: 90 }}>
      <div style={{ padding: "18px 16px 14px" }}>
        <div style={{ fontFamily: "'Noto Serif SC',serif", fontSize: 24, fontWeight: 700, color: C.plum }}>{t.feedTitle}</div>
        <div style={{ color: C.plumSoft, fontSize: 12.5, marginTop: 2 }}>{t.feedSub}</div>
      </div>
      {showCrisis && <CrisisBanner t={t} onClose={() => setShowCrisis(false)} />}
      <GuidelinesBanner lang={lang} />
      <ComposeBox
        lang={lang} profile={profile}
        text={composeText} onTextChange={setComposeText}
        emoji={composeEmoji} onEmojiChange={setComposeEmoji}
        tag={composeTag} onTagChange={setComposeTag}
        publishing={publishing} onPublish={publish}
      />
      {loading ? (
        <div style={{ padding: "40px 16px", textAlign: "center", color: C.plumSoft, fontSize: 13 }}>
          {lang === "zh" ? "载入中…" : "Loading…"}
        </div>
      ) : posts.length === 0 ? (
        <div style={{ padding: "40px 16px", textAlign: "center", color: C.plumSoft, fontSize: 13 }}>
          {lang === "zh" ? "还没有帖子，来发第一条吧 🌿" : "No posts yet — be the first 🌿"}
        </div>
      ) : (
        posts.map((p) => (
          <PostCard
            key={p.id} post={p} lang={lang} t={t}
            hugged={myHugs.has(p.id)} hugCount={hugCounts[p.id] || 0}
            onHug={() => toggleHug(p.id)}
            onReport={() => report(p.id)}
            reported={reportedIds.has(p.id)}
            timeAgo={timeAgo}
          />
        ))
      )}
    </div>
  );
}

// ── Rooms ───────────────────────────────────────────────────
function Rooms({ lang, onEnter }) {
  const t = STR[lang];
  return (
    <div style={{ paddingBottom: 90 }}>
      <div style={{ padding: "18px 16px 14px" }}>
        <div style={{ fontFamily: "'Noto Serif SC',serif", fontSize: 24, fontWeight: 700, color: C.plum }}>{t.roomsTitle}</div>
        <div style={{ color: C.plumSoft, fontSize: 12.5, marginTop: 2 }}>{t.roomsSub}</div>
      </div>
      {ROOMS.map((r) => {
        const Icon = r.icon;
        return (
          <button key={r.id} onClick={() => onEnter(r)}
            style={{ width: "calc(100% - 32px)", margin: "0 16px 14px", textAlign: "left",
              background: C.card, borderRadius: 18, padding: 16, border: `1px solid ${C.line}`,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 46, height: 46, borderRadius: 14, flexShrink: 0, background: r.accent + "1A",
              display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon size={22} color={r.accent} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15.5, color: C.plum, fontWeight: 500, fontFamily: "'Noto Serif SC',serif" }}>{r.title[lang]}</div>
              <div style={{ fontSize: 12.5, color: C.plumSoft, marginTop: 3 }}>{r.desc[lang]}</div>
            </div>
            <div style={{ fontSize: 11, color: C.sage, display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 7, height: 7, borderRadius: 999, background: C.sage }} />{r.online}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ── Chat ────────────────────────────────────────────────────
function ChatRoom({ lang, room, profile, userId, onBack, onCrisisDetected, onAbuseDetected }) {
  const t = STR[lang];
  const [msgs, setMsgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const bottomRef = useRef(null);
  const seenIds = useRef(new Set());
  const inputRef = useRef(null);

  const insertEmoji = (e) => {
    const input = inputRef.current;
    if (!input) { setText((t) => t + e); return; }
    const s = input.selectionStart ?? text.length;
    const end = input.selectionEnd ?? text.length;
    const next = text.slice(0, s) + e + text.slice(end);
    setText(next);
    setTimeout(() => {
      input.setSelectionRange(s + e.length, s + e.length);
      input.focus();
    }, 0);
  };

  useEffect(() => {
    if (!userId) return;

    const load = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("messages")
          .select("*, profiles!author_id(nickname, avatar)")
          .eq("room_slug", room.slug)
          .eq("hidden", false)
          .order("created_at", { ascending: true });
        if (error) throw error;
        const rows = data || [];
        rows.forEach((m) => seenIds.current.add(m.id));
        setMsgs(rows);
      } catch (err) {
        console.error("Chat history error:", err?.message, err?.code, err?.details, err?.hint, err);
      } finally {
        setLoading(false);
      }
    };

    load();

    const channel = supabase
      .channel(`chat:${room.slug}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages",
        filter: `room_slug=eq.${room.slug}` },
        async (payload) => {
          const id = payload.new.id;
          if (seenIds.current.has(id)) return;
          seenIds.current.add(id);
          try {
            const { data } = await supabase
              .from("messages")
              .select("*, profiles!author_id(nickname, avatar)")
              .eq("id", id)
              .single();
            if (data) setMsgs((prev) => [...prev, data]);
          } catch {
            setMsgs((prev) => [...prev, { ...payload.new, profiles: null }]);
          }
        })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [room.slug, userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const send = async () => {
    if (!text.trim() || !userId) return;
    const body = text.trim();
    if (filterAbuse(body)) { onAbuseDetected(); return; }
    setText("");
    setSending(true);
    try {
      const { data, error } = await supabase
        .from("messages")
        .insert({ room_slug: room.slug, author_id: userId, body })
        .select("*, profiles!author_id(nickname, avatar)")
        .single();
      if (error) throw error;
      seenIds.current.add(data.id);
      setMsgs((prev) => [...prev, data]);
      if (detectCrisis(body)) onCrisisDetected();
    } catch (err) {
      console.error("Send error:", err?.message, err?.code, err?.details, err?.hint, err);
      setText(body);
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 14px", borderBottom: `1px solid ${C.line}` }}>
        <button onClick={onBack} style={{ border: "none", background: "none", cursor: "pointer", color: C.plum }}>
          <ChevronLeft size={22} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15.5, fontWeight: 500, color: C.plum, fontFamily: "'Noto Serif SC',serif" }}>{room.title[lang]}</div>
          <div style={{ fontSize: 11, color: C.sage }}>{room.online} {t.sendHint} · {t.guarded}</div>
        </div>
        <Shield size={17} color={C.sage} />
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        {loading ? (
          <div style={{ textAlign: "center", color: C.plumSoft, fontSize: 13, marginTop: 40 }}>
            {lang === "zh" ? "载入中…" : "Loading…"}
          </div>
        ) : msgs.length === 0 ? (
          <div style={{ textAlign: "center", color: C.plumSoft, fontSize: 13, marginTop: 40 }}>
            {lang === "zh" ? "还没有消息，来说第一句话吧 🌿" : "No messages yet — say hello 🌿"}
          </div>
        ) : (
          msgs.map((m) => {
            const isMe = m.author_id === userId;
            const av = isMe ? profile.avatar : (m.profiles?.avatar || "🌿");
            const name = isMe
              ? (profile.nickname || (lang === "zh" ? "你" : "You"))
              : (m.profiles?.nickname || (lang === "zh" ? "匿名" : "anonymous"));
            return (
              <div key={m.id} style={{ display: "flex", gap: 8,
                flexDirection: isMe ? "row-reverse" : "row", alignItems: "flex-end" }}>
                <Avatar emoji={av} color={isMe ? C.terracottaSoft : C.peach} size={28} />
                <div style={{ display: "flex", flexDirection: "column",
                  alignItems: isMe ? "flex-end" : "flex-start", maxWidth: "75%" }}>
                  {!isMe && <div style={{ fontSize: 11, color: C.plumSoft, marginBottom: 3, marginLeft: 4 }}>{name}</div>}
                  <div style={{ padding: "10px 14px", borderRadius: 16,
                    borderBottomRightRadius: isMe ? 4 : 16, borderBottomLeftRadius: isMe ? 16 : 4,
                    background: isMe ? C.terracotta : C.card, color: isMe ? "#fff" : C.plum,
                    fontSize: 14, lineHeight: 1.6, border: isMe ? "none" : `1px solid ${C.line}` }}>{m.body}</div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {showEmojiPicker && (
        <div style={{ borderTop: `1px solid ${C.line}`, background: C.card,
          maxHeight: 188, overflowY: "auto", padding: "8px 10px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
            {CHAT_EMOJIS.map((e, i) => (
              <button key={i} onClick={() => insertEmoji(e)}
                style={{ width: 36, height: 36, border: "none", background: "transparent",
                  borderRadius: 8, fontSize: 22, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center" }}>
                {e}
              </button>
            ))}
          </div>
        </div>
      )}
      <div style={{ padding: 12, borderTop: `1px solid ${C.line}`, display: "flex", gap: 8, alignItems: "center" }}>
        <button onClick={() => setShowEmojiPicker((v) => !v)}
          style={{ width: 36, height: 36, borderRadius: 999, border: `1px solid ${showEmojiPicker ? C.terracotta : C.line}`,
            background: showEmojiPicker ? C.peach : "transparent", flexShrink: 0,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Smile size={18} color={showEmojiPicker ? C.terracotta : C.plumSoft} />
        </button>
        <input ref={inputRef} value={text} onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          placeholder={t.chatPlaceholder}
          style={{ flex: 1, border: `1px solid ${C.line}`, borderRadius: 999, padding: "11px 16px",
            fontSize: 14, outline: "none", background: C.bg, color: C.plum }} />
        <button onClick={send} disabled={sending || !text.trim()}
          style={{ width: 44, height: 44, borderRadius: 999, border: "none", flexShrink: 0,
            background: sending || !text.trim() ? C.terracottaSoft : C.terracotta,
            color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}

// ── Me ──────────────────────────────────────────────────────
function Me({ lang, setLang, profile }) {
  const t = STR[lang];
  const [pinExists, setPinExists] = useState(false);
  const [showPinSetup, setShowPinSetup] = useState(false);

  useEffect(() => { setPinExists(!!getStoredPin()); }, []);

  const myInterests = INTERESTS.filter((i) => profile.interests.includes(i.id));
  const myStrengths = STRENGTHS.filter((s) => profile.strengths.includes(s.id));

  const TagRow = ({ title, items }) => (
    <div style={{ margin: "0 16px 12px", background: C.card, borderRadius: 16, padding: 16, border: `1px solid ${C.line}` }}>
      <div style={{ fontSize: 13, color: C.plumSoft, marginBottom: 10 }}>{title}</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {items.length ? items.map((x) => (
          <span key={x.id} style={{ fontSize: 12.5, padding: "5px 11px", borderRadius: 999,
            background: C.peach, color: C.terracotta }}>{x[lang]}</span>
        )) : <span style={{ fontSize: 12.5, color: C.plumSoft }}>—</span>}
      </div>
    </div>
  );

  const SettingRow = ({ icon: Icon, label, sub, onClick, danger }) => (
    <div onClick={onClick}
      style={{ margin: "0 16px 12px", background: C.card, borderRadius: 16, padding: 16,
        border: `1px solid ${danger ? C.terracottaSoft : C.line}`,
        display: "flex", alignItems: "center", gap: 14, cursor: onClick ? "pointer" : "default" }}>
      <Icon size={20} color={danger ? C.terracotta : C.terracotta} />
      <div>
        <div style={{ fontSize: 14.5, color: danger ? C.terracotta : C.plum, fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 12, color: C.plumSoft, marginTop: 2 }}>{sub}</div>
      </div>
    </div>
  );

  return (
    <div style={{ paddingBottom: 90 }}>
      <div style={{ display: "flex", justifyContent: "flex-end", padding: "14px 16px 0" }}>
        <LangToggle lang={lang} setLang={setLang} />
      </div>
      <div style={{ padding: "12px 16px 20px", textAlign: "center" }}>
        <div style={{ width: 76, height: 76, borderRadius: 999, margin: "0 auto 12px",
          background: `linear-gradient(135deg, ${C.terracottaSoft}, ${C.peach})`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 38 }}>{profile.avatar}</div>
        <div style={{ fontFamily: "'Noto Serif SC',serif", fontSize: 19, color: C.plum,
          fontWeight: 700 }}>{profile.nickname || t.meName}</div>
        <div style={{ fontSize: 12, color: C.plumSoft, marginTop: 4 }}>{t.meSub}</div>
      </div>
      <TagRow title={t.meInterests} items={myInterests} />
      <TagRow title={t.meStrengths} items={myStrengths} />
      <div style={{ margin: "0 16px 12px", borderRadius: 16, padding: 16,
        background: `linear-gradient(135deg, ${C.peach}, ${C.cardWarm})`,
        border: `1px solid ${C.terracottaSoft}`, display: "flex", alignItems: "center", gap: 14 }}>
        <Heart size={22} color={C.terracotta} fill={C.terracotta} />
        <div>
          <div style={{ fontSize: 14.5, color: C.plum, fontWeight: 500 }}>{t.meHugs}</div>
          <div style={{ fontSize: 12, color: C.plumSoft, marginTop: 2 }}>{t.meHugsSub}</div>
        </div>
      </div>
      <GuidelinesBanner lang={lang} permanent />

      {pinExists ? (
        <>
          <SettingRow icon={Lock} label={t.pinChange} sub={t.pinChangeSub}
            onClick={() => setShowPinSetup(true)} />
          <SettingRow icon={Shield} label={t.pinOff} sub={t.pinOffSub} danger
            onClick={() => { clearStoredPin(); setPinExists(false); }} />
        </>
      ) : (
        <SettingRow icon={Lock} label={t.pinOn} sub={t.pinOnSub}
          onClick={() => setShowPinSetup(true)} />
      )}
      <SettingRow icon={Shield} label={t.meGuard} sub={t.meGuardSub} />

      {showPinSetup && (
        <PinSetupModal lang={lang}
          onDone={(pin) => { setStoredPin(pin); setPinExists(true); setShowPinSetup(false); }}
          onClose={() => setShowPinSetup(false)} />
      )}
    </div>
  );
}

function TabBar({ lang, tab, setTab }) {
  const t = STR[lang];
  const tabs = [
    { id: "feed", label: t.tabFeed, icon: Home },
    { id: "rooms", label: t.tabRooms, icon: MessageCircle },
    { id: "me", label: t.tabMe, icon: Sparkles },
  ];
  return (
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, display: "flex",
      background: C.card, borderTop: `1px solid ${C.line}`, padding: "8px 0 14px" }}>
      {tabs.map((tb) => {
        const Icon = tb.icon, on = tab === tb.id;
        return (
          <button key={tb.id} onClick={() => setTab(tb.id)}
            style={{ flex: 1, border: "none", background: "none", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              color: on ? C.terracotta : C.plumSoft }}>
            <Icon size={21} fill={on ? C.terracotta : "none"} />
            <span style={{ fontSize: 11 }}>{tb.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Guidelines ───────────────────────────────────────────────
const GUIDELINES = {
  zh: {
    title: "欢迎来到 Galene · 宁静之海",
    items: [
      "这是一个女性本位的空间，为彼此的情绪、成长和日常而存在。",
      "我们鼓励：真诚倾诉、温柔回应、互相支持。",
      "我们不欢迎：评判、说教、推销、骚扰、攻击。",
      "请保护你和她人的匿名：不打听、不外传。",
      "同伴的陪伴很珍贵，但不能替代专业帮助；如果你正处在危机中，请寻求专业支持。",
    ],
    btn: "我愿意，进入",
    saving: "记录中…",
  },
  en: {
    title: "Welcome to Galene · A Tranquil Sea",
    items: [
      "This is a women-centered space, built for our emotions, growth, and everyday moments.",
      "We encourage: honest sharing, gentle responses, and mutual support.",
      "We ask you not to: judge, lecture, promote, harass, or attack.",
      "Please protect your anonymity and others': don't pry, don't share outside.",
      "Peer companionship is precious, but it can't replace professional help. If you're in crisis, please reach out to a professional.",
    ],
    btn: "I'm in",
    saving: "Saving…",
  },
};

// ── Root ────────────────────────────────────────────────────
export default function NuanyuApp() {
  const [langState, setLangState] = useState("en");
  const [locked, setLocked] = useState(false);
  const [profile, setProfile] = useState(null);
  const [tab, setTab] = useState("feed");
  const [room, setRoom] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState(null);
  const [showCrisisModal, setShowCrisisModal] = useState(false);
  const [showAbuseModal, setShowAbuseModal] = useState(false);

  const lang = langState;
  const setLang = (l) => { setLangState(l); localStorage.setItem(LANG_KEY, l); };

  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = FONT_IMPORT;
    document.head.appendChild(el);
    return () => document.head.removeChild(el);
  }, []);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        localStorage.setItem(ACTIVE_TS_KEY, Date.now().toString());
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    const storedLang = localStorage.getItem(LANG_KEY);
    if (storedLang) setLangState(storedLang);
    const pin = localStorage.getItem(PIN_KEY);
    const lastActive = localStorage.getItem(ACTIVE_TS_KEY);
    const elapsed = lastActive ? Date.now() - parseInt(lastActive, 10) : Infinity;
    setLocked(!!pin && elapsed > GRACE_MS);

    const init = async () => {
      try {
        let currentUser = null;
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          currentUser = user;
        } else {
          const { data, error } = await supabase.auth.signInAnonymously();
          if (error) throw error;
          currentUser = data.user;
        }
        setUserId(currentUser.id);

        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", currentUser.id)
          .single();

        if (profileData) {
          setProfile({
            avatar: profileData.avatar,
            nickname: profileData.nickname || "",
            interests: profileData.interests || [],
            strengths: profileData.strengths || [],
          });
        }
      } catch (err) {
        console.error("Init error:", err);
      } finally {
        setAuthLoading(false);
      }
    };
    init();
  }, []);

  const handleOnboardingDone = async (data) => {
    if (!userId) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").insert({
        id: userId,
        avatar: data.avatar,
        nickname: data.nickname,
        interests: data.interests,
        strengths: data.strengths,
      });
      if (error) throw error;
      setProfile(data);
    } catch (err) {
      console.error("Profile save error:", err);
    } finally {
      setSaving(false);
    }
  };

  const shell = (children) => (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh",
      background: "#EFE6DD", padding: 20, fontFamily: "'Noto Sans SC',-apple-system,sans-serif" }}>
      <div style={{ width: 390, height: 760, borderRadius: 38, overflow: "hidden", position: "relative",
        background: C.bg, boxShadow: "0 30px 70px rgba(74,47,61,.28)", border: "10px solid #2A1C24" }}>
        {children}
      </div>
    </div>
  );

  if (authLoading) {
    return shell(
      <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", gap: 16,
        background: `radial-gradient(120% 60% at 50% 0%, ${C.peach} 0%, ${C.bg} 50%)` }}>
        <div style={{ fontSize: 52 }}>🌿</div>
        <div style={{ fontFamily: "'Noto Serif SC',serif", fontSize: 22, color: C.plum, fontWeight: 700 }}>
          {lang === "zh" ? "宁静之海" : "Galene"}
        </div>
        <div style={{ fontSize: 13, color: C.plumSoft }}>{lang === "zh" ? "载入中…" : "Loading…"}</div>
      </div>
    );
  }

  return shell(
    <>
      {locked ? (
        <LockScreen lang={lang} setLang={setLang} onUnlock={() => setLocked(false)} />
      ) : !profile ? (
        <Onboarding lang={lang} setLang={setLang} onDone={handleOnboardingDone} saving={saving} />
      ) : room ? (
        <ChatRoom lang={lang} room={room} profile={profile} userId={userId}
          onBack={() => setRoom(null)}
          onCrisisDetected={() => setShowCrisisModal(true)}
          onAbuseDetected={() => setShowAbuseModal(true)} />
      ) : (
        <>
          <div style={{ height: "100%", overflowY: "auto" }}>
            {tab === "feed" && <Feed lang={lang} userId={userId} profile={profile}
              onCrisisDetected={() => setShowCrisisModal(true)}
              onAbuseDetected={() => setShowAbuseModal(true)} />}
            {tab === "rooms" && <Rooms lang={lang} onEnter={setRoom} />}
            {tab === "me" && <Me lang={lang} setLang={setLang} profile={profile} />}
          </div>
          <TabBar lang={lang} tab={tab} setTab={setTab} />
        </>
      )}
      {showAbuseModal && (
        <AbuseModal lang={lang} onClose={() => setShowAbuseModal(false)} />
      )}
      {showCrisisModal && (
        <CrisisModal lang={lang} onClose={() => setShowCrisisModal(false)} />
      )}
    </>
  );
}
