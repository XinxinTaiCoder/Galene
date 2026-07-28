"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { detectCrisis, filterAbuse } from "@/lib/safety";
import { registerPushNotifications, unregisterPushToken } from "@/lib/pushNotifications";
import {
  Heart, MessageCircle, Home, Sparkles, Lock, Shield, Flag,
  Send, ChevronLeft, Sun, Moon, Soup, Smile, X, Lightbulb, Check, Globe, UserX,
  Image as ImageIcon, Bell, Trash2, PhoneCall, Eye, EyeOff, LogOut,
  Download, Share2,
} from "lucide-react";

// ── Warm "dusk tea" palette ────────────────────────────────
const C = {
  bg: "#FBF3EC", card: "#FFFDFB", cardWarm: "#FDF1E8",
  terracotta: "#C9755A", terracottaSoft: "#E8B8A4",
  plum: "#4A2F3D", plumSoft: "#8C7480",
  sage: "#7E9484", peach: "#F5D9C8", line: "#EBDDD2",
};

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@500;700&family=Noto+Sans+SC:wght@400;500&display=swap');`;

const MISS_GALENE_ID = "00000000-0000-0000-0000-000000000001";

const PIN_KEY = "galene_pin";
const LANG_KEY = "galene_lang";
const SEEN_GUIDELINES_KEY = "galene_seen_guidelines";
const ACTIVE_TS_KEY = "galene_last_active";
const GRACE_MS = 3 * 60 * 1000;
const getStoredPin = () => localStorage.getItem(PIN_KEY);
const setStoredPin = (p) => localStorage.setItem(PIN_KEY, p);
const clearStoredPin = () => localStorage.removeItem(PIN_KEY);

// Shows only the first few characters of the local part — for the user's own
// eyes on the Me page only. Never send/render this for other users.
const maskEmail = (email) => {
  if (!email || !email.includes("@")) return email || "";
  const [name, domain] = email.split("@");
  const visible = name.slice(0, Math.min(3, name.length));
  return `${visible}***@${domain}`;
};

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
    editProfile: "编辑资料", save: "保存", saving: "保存中…",
    profileInterests: "兴趣", profileStrengths: "可以提供的帮助",
    block: "屏蔽", unblock: "取消屏蔽", reportUser: "举报",
    reportTitle: "举报该用户",
    reportSubmit: "提交举报", reportDone: "感谢你的举报，我们会认真处理 💛",
    reportReasonHarass: "骚扰", reportReasonAbuse: "攻击性言论",
    reportReasonSpam: "垃圾推销", reportReasonOther: "其他",
    reportNote: "补充说明（选填）",
    guardTitle: "社群守护设置", blockListTitle: "拉黑名单",
    blockListEmpty: "你还没有屏蔽过任何人 🌿",
    comingSoon: "即将推出",
    bannedMsg: "你的账号因违反社群公约已被限制，无法发布内容",
    sendHug: "送出抱抱 🤗", hugSent: "已送出 🤗",
    commentPlaceholder: "回应一下…",
    noComments: "还没有回应，来说第一句吧 🌿",
    addImage: "添加图片",
    imageTooLarge: "图片太大了（上限 2MB），换一张小一点的吧 🌿",
    agreeAge: "我已年满 17 岁",
    agreeTerms: "我已阅读并同意",
    termsLink: "用户协议",
    andWord: "与",
    privacyLink: "隐私政策",
    crisisResources: "心理健康危机资源", crisisResourcesSub: "危机热线，随时可用",
    deleteAccount: "删除账号", deleteAccountSub: "永久删除你的所有数据",
    deleteAccountTitle: "确认删除账号",
    deleteAccountWarn: "这将永久删除你所有的帖子、消息、评论和账号记录，且无法撤销。",
    deleteAccountConfirm: "我确认要删除",
    deleteAccountCancel: "取消",
    deleteAccountDeleting: "正在删除…",
    deleteAccountError: "删除失败，请稍后重试",
    pushPrompt: "想在有人抱你或回复时收到提醒吗？开启通知 🌸",
    pushEnable: "开启通知", pushNotNow: "暂不",
    installPromptAndroid: "把宁静之海添加到主屏幕，像 App 一样随时打开 🌿",
    installNow: "添加到主屏幕", installNotNow: "暂不",
    installPromptIOS: "点击浏览器底部的分享按钮 📤，选择「添加到主屏幕」，就能像 App 一样打开宁静之海",
    installGotIt: "知道了",
    signUpBtn: "注册", alreadyHaveAccount: "已有账号？登录",
    logInBtn: "登录", dontHaveAccount: "还没有账号？注册",
    signUpTitle: "创建账号", logInTitle: "登录",
    emailLabel: "邮箱地址", emailPlaceholder: "你的邮箱",
    passwordLabel: "密码（至少 8 位）", passwordPlaceholder: "输入密码",
    confirmPasswordLabel: "确认密码", confirmPasswordPlaceholder: "再次输入密码",
    phoneComingSoon: "手机号注册即将推出",
    continueBtn: "继续",
    forgotPassword: "忘记密码？",
    resetSent: "重置邮件已发送，请查收",
    resetEmailNeeded: "请先输入邮箱地址",
    errorEmailInUse: "该邮箱已注册，请直接登录",
    errorPasswordMismatch: "两次密码不一致",
    errorInvalidEmail: "邮箱格式看起来不太对，请检查一下",
    errorPasswordTooShort: "密码至少需要 8 位",
    errorInvalidCredentials: "邮箱或密码不正确，请再试一次",
    errorGeneric: "出了点小问题，请稍后再试",
    confirmEmailPending: "注册成功，但邮箱验证尚未关闭 —— 请联系管理员在 Supabase 关闭 Confirm email",
    accountLabel: "账号：",
    signOut: "退出登录", signOutSub: "退出后需要重新登录",
    signOutConfirmTitle: "确认退出登录？",
    signOutConfirmBody: "退出后需要重新登录，确认退出吗？",
    signOutConfirmYes: "确认退出", signOutConfirmCancel: "取消",
    signOutInProgress: "正在退出…",
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
    editProfile: "Edit profile", save: "Save", saving: "Saving…",
    profileInterests: "Interests", profileStrengths: "Can offer",
    block: "Block", unblock: "Unblock", reportUser: "Report",
    reportTitle: "Report this user",
    reportSubmit: "Submit report", reportDone: "Thank you — we'll review this carefully 💛",
    reportReasonHarass: "Harassment", reportReasonAbuse: "Abusive language",
    reportReasonSpam: "Spam", reportReasonOther: "Other",
    reportNote: "Additional note (optional)",
    guardTitle: "Community-care settings", blockListTitle: "Block list",
    blockListEmpty: "You haven't blocked anyone yet 🌿",
    comingSoon: "Coming soon",
    bannedMsg: "Your account has been restricted for violating community guidelines",
    sendHug: "Send a hug 🤗", hugSent: "Sent 🤗",
    commentPlaceholder: "Reply…",
    noComments: "No replies yet — be the first 🌿",
    addImage: "Add photo",
    imageTooLarge: "Image too large (max 2 MB) — please try a smaller one 🌿",
    crisisResources: "Mental health crisis resources", crisisResourcesSub: "Crisis lines, always available",
    agreeAge: "I am 17 years of age or older",
    agreeTerms: "I have read and agree to the",
    termsLink: "Terms of Service",
    andWord: "and",
    privacyLink: "Privacy Policy",
    deleteAccount: "Delete Account", deleteAccountSub: "Permanently delete all your data",
    deleteAccountTitle: "Delete your account?",
    deleteAccountWarn: "This will permanently delete all your posts, messages, comments, and account data. This cannot be undone.",
    deleteAccountConfirm: "Yes, delete everything",
    deleteAccountCancel: "Cancel",
    deleteAccountDeleting: "Deleting…",
    deleteAccountError: "Deletion failed — please try again later",
    pushPrompt: "Want to know when someone hugs you or replies? Allow notifications 🌸",
    pushEnable: "Enable notifications", pushNotNow: "Not now",
    installPromptAndroid: "Add Galene to your home screen — open it like an app anytime 🌿",
    installNow: "Add to Home Screen", installNotNow: "Not now",
    installPromptIOS: "Tap the Share button 📤 in your browser, then choose \"Add to Home Screen\" to open Galene like an app",
    installGotIt: "Got it",
    signUpBtn: "Sign up", alreadyHaveAccount: "Already have an account? Log in",
    logInBtn: "Log in", dontHaveAccount: "Don't have an account? Sign up",
    signUpTitle: "Create your account", logInTitle: "Log in",
    emailLabel: "Email address", emailPlaceholder: "Your email",
    passwordLabel: "Password (at least 8 characters)", passwordPlaceholder: "Enter password",
    confirmPasswordLabel: "Confirm password", confirmPasswordPlaceholder: "Re-enter password",
    phoneComingSoon: "Phone number sign-up coming soon",
    continueBtn: "Continue",
    forgotPassword: "Forgot password?",
    resetSent: "Reset email sent — please check your inbox",
    resetEmailNeeded: "Please enter your email first",
    errorEmailInUse: "This email is already registered — please log in instead",
    errorPasswordMismatch: "Passwords don't match",
    errorInvalidEmail: "That email doesn't look quite right — please check it",
    errorPasswordTooShort: "Password must be at least 8 characters",
    errorInvalidCredentials: "Email or password is incorrect — please try again",
    errorGeneric: "Something went wrong — please try again shortly",
    confirmEmailPending: "Account created, but email confirmation is still on — ask your admin to disable Confirm email in Supabase",
    accountLabel: "Account: ",
    signOut: "Log out", signOutSub: "You'll need to log in again",
    signOutConfirmTitle: "Log out?",
    signOutConfirmBody: "You'll need to log in again afterward. Are you sure?",
    signOutConfirmYes: "Yes, log out", signOutConfirmCancel: "Cancel",
    signOutInProgress: "Logging out…",
  },
};

// ── Data ────────────────────────────────────────────────────
const AVATARS = {
  people: ["👩","👩🏻","👩🏽","👩🏿","🧚‍♀️","💃","👸","🧜‍♀️","👩‍🎨","👩‍💻","👩‍🎤","👩‍🍳","🤖","👻","👽","🧸"],
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
  { id: "r1", slug: "late-night", icon: Moon, accent: "#8C7480",
    title: { zh: "深夜倾诉所", en: "Late-Night Confessions" },
    desc: { zh: "睡不着的时候，有人陪你说说话", en: "When you can't sleep, someone's here to talk" } },
  { id: "r4", slug: "sweetness", icon: Soup, accent: "#7E9484",
    title: { zh: "今天有点甜", en: "A Little Sweetness" },
    desc: { zh: "只发开心的事、好吃的、可爱的", en: "Only happy things, good food, cute stuff" } },
  { id: "r2", slug: "job-hunt", icon: Sun, accent: "#C9755A",
    title: { zh: "求职互助角", en: "Career and Growth Support" },
    desc: { zh: "面试、拒信、迷茫，我们都懂", en: "Interviews, rejections, doubt — we get it" } },
  { id: "r3", slug: "fun-fact", icon: Lightbulb, accent: "#D4A15A",
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

// ── Web Push helpers ────────────────────────────────────────
const PUSH_PROMPTED_KEY = "galene_push_prompted";

// ── PWA install prompt ───────────────────────────────────────
const INSTALL_PROMPTED_KEY = "galene_install_prompted";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

function isPushSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  );
}

async function subscribeToPush(userId) {
  const registration = await navigator.serviceWorker.register("/sw-push.js", { scope: "/" });
  await navigator.serviceWorker.ready;
  const sub = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY),
  });
  await supabase.from("profiles").update({ push_subscription: sub.toJSON() }).eq("id", userId);
  return sub;
}

// ── Notification helpers ────────────────────────────────────
async function insertNotif({ recipientId, type, actorId, refId }) {
  if (!recipientId || recipientId === actorId) return;
  try {
    await supabase.from("notifications").insert({
      recipient_id: recipientId, type, actor_id: actorId, ref_id: refId || null,
    });
  } catch (err) {
    console.error("Notif insert error:", err?.message);
  }
}

function timeAgoStr(dateStr, lang) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 60000);
  if (diff < 1) return lang === "zh" ? "刚刚" : "just now";
  if (diff < 60) return lang === "zh" ? `${diff} 分钟前` : `${diff}m ago`;
  const hrs = Math.floor(diff / 60);
  if (hrs < 24) return lang === "zh" ? `${hrs} 小时前` : `${hrs}h ago`;
  return lang === "zh" ? `${Math.floor(hrs / 24)} 天前` : `${Math.floor(hrs / 24)}d ago`;
}

// ── Translation ─────────────────────────────────────────────
function detectLang(text) {
  return /[一-鿿]/.test(text) ? "zh" : "en";
}

async function translateText(text) {
  const src = detectLang(text);
  const pair = src === "zh" ? "zh-CN|en-GB" : "en-GB|zh-CN";
  const res = await fetch(
    `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.slice(0, 500))}&langpair=${pair}`
  );
  const json = await res.json();
  return json.responseData?.translatedText || null;
}

function useLongPress(callback, delay = 600) {
  const timer = useRef(null);
  const moved = useRef(false);
  const start = useCallback(() => {
    moved.current = false;
    timer.current = setTimeout(() => { if (!moved.current) callback(); }, delay);
  }, [callback, delay]);
  const cancel = useCallback(() => clearTimeout(timer.current), []);
  const move = useCallback(() => { moved.current = true; clearTimeout(timer.current); }, []);
  return { onPointerDown: start, onPointerUp: cancel, onPointerLeave: cancel, onPointerCancel: cancel, onPointerMove: move };
}

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
    <div style={{ position: "fixed", top: 0, bottom: 0, left: 0, right: 0, maxWidth: 480, margin: "0 auto", background: "rgba(74,47,61,.55)",
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

// ── Email/password auth ────────────────────────────────────
function PasswordField({ value, onChange, placeholder, autoComplete }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <input type={show ? "text" : "password"} value={value} onChange={onChange}
        placeholder={placeholder} autoComplete={autoComplete}
        style={{ width: "100%", boxSizing: "border-box", border: `1px solid ${C.line}`,
          borderRadius: 12, padding: "12px 44px 12px 14px", fontSize: 14, outline: "none",
          background: C.card, color: C.plum }} />
      <button type="button" onClick={() => setShow((s) => !s)}
        style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
          background: "none", border: "none", cursor: "pointer", color: C.plumSoft, padding: 4,
          display: "flex" }}>
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}

function AuthTextField({ label, ...inputProps }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 13, color: C.plumSoft, marginBottom: 8 }}>{label}</div>
      <input {...inputProps}
        style={{ width: "100%", boxSizing: "border-box", border: `1px solid ${C.line}`,
          borderRadius: 12, padding: "12px 14px", fontSize: 14, outline: "none",
          background: C.card, color: C.plum }} />
    </div>
  );
}

function AuthWelcome({ lang, setLang, onSignUp, onLogin }) {
  const t = STR[lang];
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column",
      background: `radial-gradient(120% 60% at 50% 0%, ${C.peach} 0%, ${C.bg} 50%)` }}>
      <div style={{ display: "flex", justifyContent: "flex-end", padding: "14px 16px 0" }}>
        <LangToggle lang={lang} setLang={setLang} />
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", padding: 36, textAlign: "center" }}>
        <Avatar emoji="🌿" color={C.card} size={72} />
        <div style={{ fontFamily: "'Noto Serif SC',serif", fontSize: 30, fontWeight: 700,
          color: C.plum, marginTop: 18 }}>{t.appName}</div>
        <div style={{ color: C.plumSoft, fontSize: 14, marginTop: 12, lineHeight: 1.6 }}>{t.tagline}</div>
        <div style={{ marginTop: 40, width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
          <button onClick={onSignUp}
            style={{ width: "100%", padding: 15, borderRadius: 16, border: "none",
              background: C.terracotta, color: "#fff", fontSize: 15.5, cursor: "pointer",
              fontFamily: "'Noto Serif SC',serif" }}>{t.signUpBtn}</button>
          <button onClick={onLogin}
            style={{ width: "100%", padding: 15, borderRadius: 16, cursor: "pointer", fontSize: 14.5,
              border: `1px solid ${C.terracotta}`, background: "transparent", color: C.terracotta,
              fontFamily: "'Noto Serif SC',serif" }}>{t.alreadyHaveAccount}</button>
        </div>
      </div>
    </div>
  );
}

function SignUpForm({ lang, setLang, onSwitchToLogin }) {
  const t = STR[lang];
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleSubmit = async () => {
    setError("");
    const trimmedEmail = email.trim();
    if (!isValidEmail(trimmedEmail)) { setError(t.errorInvalidEmail); return; }
    if (password.length < 8) { setError(t.errorPasswordTooShort); return; }
    if (password !== confirmPassword) { setError(t.errorPasswordMismatch); return; }

    setSubmitting(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: trimmedEmail, password,
      });
      if (signUpError) {
        console.error("Sign up error:", signUpError.message, signUpError.status, signUpError);
        if (signUpError.message?.toLowerCase().includes("already registered") ||
            signUpError.message?.toLowerCase().includes("already been registered")) {
          setError(t.errorEmailInUse);
        } else {
          setError(t.errorGeneric);
        }
        return;
      }
      // With "Confirm email" disabled (the intended project setting), signing
      // up with an already-registered email returns success with no error,
      // but no session and an empty identities array.
      if (!data?.session && (!data?.user?.identities || data.user.identities.length === 0)) {
        setError(t.errorEmailInUse);
        return;
      }
      // If the project still has "Confirm email" turned on, a genuinely new
      // signup comes back with a user but no session — surface that instead
      // of silently doing nothing.
      if (!data?.session) {
        setError(t.confirmEmailPending);
        return;
      }
      // Real success: the App-level onAuthStateChange listener picks up the
      // new session and moves us into onboarding automatically.
    } catch (err) {
      console.error("Sign up exception:", err?.message, err);
      setError(t.errorGeneric);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflowY: "auto",
      background: `radial-gradient(120% 60% at 50% 0%, ${C.peach} 0%, ${C.bg} 50%)` }}>
      <div style={{ display: "flex", justifyContent: "flex-end", padding: "14px 16px 0" }}>
        <LangToggle lang={lang} setLang={setLang} />
      </div>
      <div style={{ flex: 1, padding: "20px 28px 36px", display: "flex", flexDirection: "column" }}>
        <div style={{ fontFamily: "'Noto Serif SC',serif", fontSize: 22, color: C.plum, fontWeight: 700,
          marginBottom: 24 }}>{t.signUpTitle}</div>

        <AuthTextField label={t.emailLabel} type="email" value={email} autoComplete="email"
          onChange={(e) => setEmail(e.target.value)} placeholder={t.emailPlaceholder} />

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: C.plumSoft, marginBottom: 8 }}>{t.passwordLabel}</div>
          <PasswordField value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder={t.passwordPlaceholder} autoComplete="new-password" />
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 13, color: C.plumSoft, marginBottom: 8 }}>{t.confirmPasswordLabel}</div>
          <PasswordField value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder={t.confirmPasswordPlaceholder} autoComplete="new-password" />
        </div>

        <div style={{ fontSize: 12, color: C.plumSoft, marginBottom: 20 }}>{t.phoneComingSoon}</div>

        {error && <div style={{ color: C.terracotta, fontSize: 13, marginBottom: 14 }}>{error}</div>}

        <button onClick={handleSubmit} disabled={submitting}
          style={{ width: "100%", padding: 15, borderRadius: 16, border: "none",
            background: submitting ? C.terracottaSoft : C.terracotta, color: "#fff", fontSize: 15.5,
            cursor: submitting ? "default" : "pointer", fontFamily: "'Noto Serif SC',serif" }}>
          {submitting ? t.saving : t.continueBtn}
        </button>

        <button onClick={onSwitchToLogin}
          style={{ marginTop: 18, background: "none", border: "none", cursor: "pointer",
            color: C.plumSoft, fontSize: 13, textDecoration: "underline", alignSelf: "center" }}>
          {t.alreadyHaveAccount}
        </button>
      </div>
    </div>
  );
}

function LoginForm({ lang, setLang, onSwitchToSignUp }) {
  const t = STR[lang];
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleSubmit = async () => {
    setError(""); setNotice("");
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) { setError(t.errorInvalidCredentials); return; }
    setSubmitting(true);
    try {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail, password,
      });
      if (signInError) {
        console.error("Sign in error:", signInError.message, signInError.status, signInError);
        setError(t.errorInvalidCredentials);
      } else {
        fetch("/api/notify-login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${signInData?.session?.access_token}`,
          },
        }).catch(() => {});
      }
      // Success handled by the App-level onAuthStateChange listener.
    } catch (err) {
      console.error("Sign in exception:", err?.message, err);
      setError(t.errorGeneric);
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    setError(""); setNotice("");
    const trimmedEmail = email.trim();
    if (!trimmedEmail) { setError(t.resetEmailNeeded); return; }
    setResetting(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(trimmedEmail);
      if (resetError) {
        console.error("Reset password error:", resetError.message, resetError);
        setError(t.errorGeneric);
      } else {
        setNotice(t.resetSent);
      }
    } catch (err) {
      console.error("Reset password exception:", err?.message, err);
      setError(t.errorGeneric);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflowY: "auto",
      background: `radial-gradient(120% 60% at 50% 0%, ${C.peach} 0%, ${C.bg} 50%)` }}>
      <div style={{ display: "flex", justifyContent: "flex-end", padding: "14px 16px 0" }}>
        <LangToggle lang={lang} setLang={setLang} />
      </div>
      <div style={{ flex: 1, padding: "20px 28px 36px", display: "flex", flexDirection: "column" }}>
        <div style={{ fontFamily: "'Noto Serif SC',serif", fontSize: 22, color: C.plum, fontWeight: 700,
          marginBottom: 24 }}>{t.logInTitle}</div>

        <AuthTextField label={t.emailLabel} type="email" value={email} autoComplete="email"
          onChange={(e) => setEmail(e.target.value)} placeholder={t.emailPlaceholder} />

        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 13, color: C.plumSoft, marginBottom: 8 }}>{t.passwordLabel}</div>
          <PasswordField value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder={t.passwordPlaceholder} autoComplete="current-password" />
        </div>

        <button onClick={handleForgotPassword} disabled={resetting}
          style={{ alignSelf: "flex-end", background: "none", border: "none",
            cursor: resetting ? "default" : "pointer", color: C.terracotta, fontSize: 12.5,
            marginBottom: 16, padding: 0 }}>
          {t.forgotPassword}
        </button>

        {error && <div style={{ color: C.terracotta, fontSize: 13, marginBottom: 14 }}>{error}</div>}
        {notice && <div style={{ color: C.sage, fontSize: 13, marginBottom: 14 }}>{notice}</div>}

        <button onClick={handleSubmit} disabled={submitting}
          style={{ width: "100%", padding: 15, borderRadius: 16, border: "none",
            background: submitting ? C.terracottaSoft : C.terracotta, color: "#fff", fontSize: 15.5,
            cursor: submitting ? "default" : "pointer", fontFamily: "'Noto Serif SC',serif" }}>
          {submitting ? t.saving : t.logInBtn}
        </button>

        <button onClick={onSwitchToSignUp}
          style={{ marginTop: 18, background: "none", border: "none", cursor: "pointer",
            color: C.plumSoft, fontSize: 13, textDecoration: "underline", alignSelf: "center" }}>
          {t.dontHaveAccount}
        </button>
      </div>
    </div>
  );
}

function SignOutModal({ lang, onClose, onConfirm }) {
  const t = STR[lang];
  const [signingOut, setSigningOut] = useState(false);

  const handleConfirm = async () => {
    setSigningOut(true);
    await onConfirm();
  };

  return (
    <div style={{ position: "fixed", top: 0, bottom: 0, left: 0, right: 0, maxWidth: 480, margin: "0 auto", background: "rgba(74,47,61,.55)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24, zIndex: 300 }}>
      <div style={{ background: C.card, borderRadius: 22, padding: 24, width: "100%",
        border: `1px solid ${C.terracottaSoft}`,
        boxShadow: "0 8px 32px rgba(74,47,61,.2)" }}>
        <div style={{ fontSize: 16, fontFamily: "'Noto Serif SC',serif",
          color: C.plum, fontWeight: 700, marginBottom: 12 }}>{t.signOutConfirmTitle}</div>
        <div style={{ fontSize: 13.5, color: C.plumSoft, lineHeight: 1.7, marginBottom: 20 }}>
          {t.signOutConfirmBody}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} disabled={signingOut}
            style={{ flex: 1, padding: "12px 0", borderRadius: 14,
              border: `1px solid ${C.line}`, background: "transparent",
              color: C.plumSoft, fontSize: 14, cursor: "pointer" }}>
            {t.signOutConfirmCancel}
          </button>
          <button onClick={handleConfirm} disabled={signingOut}
            style={{ flex: 1, padding: "12px 0", borderRadius: 14, border: "none",
              background: C.terracotta, color: "#fff", fontSize: 14, cursor: "pointer" }}>
            {signingOut ? t.signOutInProgress : t.signOutConfirmYes}
          </button>
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
  const [agreedAge, setAgreedAge] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);

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
          <div style={{ marginTop: 32, width: "100%", textAlign: "left", display: "flex", flexDirection: "column", gap: 14 }}>
            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
              <input type="checkbox" checked={agreedAge} onChange={(e) => setAgreedAge(e.target.checked)}
                style={{ marginTop: 2, accentColor: C.terracotta, width: 16, height: 16, flexShrink: 0 }} />
              <span style={{ fontSize: 13.5, color: C.plum, lineHeight: 1.5 }}>{t.agreeAge}</span>
            </label>
            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
              <input type="checkbox" checked={agreedTerms} onChange={(e) => setAgreedTerms(e.target.checked)}
                style={{ marginTop: 2, accentColor: C.terracotta, width: 16, height: 16, flexShrink: 0 }} />
              <span style={{ fontSize: 13.5, color: C.plum, lineHeight: 1.5 }}>
                {t.agreeTerms}{" "}
                <a href="/terms" target="_blank" rel="noopener"
                  style={{ color: C.terracotta, textDecoration: "underline" }}>{t.termsLink}</a>
                {" "}{t.andWord}{" "}
                <a href="/privacy" target="_blank" rel="noopener"
                  style={{ color: C.terracotta, textDecoration: "underline" }}>{t.privacyLink}</a>
              </span>
            </label>
          </div>
          <button onClick={() => setStep(1)} disabled={!agreedAge || !agreedTerms}
            style={{ marginTop: 28, width: "100%", padding: 15, borderRadius: 16, border: "none",
              background: agreedAge && agreedTerms ? C.terracotta : C.terracottaSoft,
              color: "#fff", fontSize: 15.5,
              cursor: agreedAge && agreedTerms ? "pointer" : "default",
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
    <div style={{ position: "fixed", top: 0, bottom: 0, left: 0, right: 0, maxWidth: 480, margin: "0 auto", background: "rgba(74,47,61,.5)",
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

function DeleteAccountModal({ lang, userId, onClose, onDeleted }) {
  const t = STR[lang];
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("No session");
      const res = await fetch("/api/delete-account", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed");
      }
      await unregisterPushToken(userId);
      await supabase.auth.signOut();
      onDeleted();
    } catch (err) {
      console.error("Delete account error:", err?.message);
      setError(t.deleteAccountError);
      setDeleting(false);
    }
  };

  return (
    <div style={{ position: "fixed", top: 0, bottom: 0, left: 0, right: 0, maxWidth: 480, margin: "0 auto", background: "rgba(74,47,61,.55)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24, zIndex: 300 }}>
      <div style={{ background: C.card, borderRadius: 22, padding: 24, width: "100%",
        border: `1px solid ${C.terracottaSoft}`,
        boxShadow: "0 8px 32px rgba(74,47,61,.2)" }}>
        <div style={{ fontSize: 16, fontFamily: "'Noto Serif SC',serif",
          color: C.plum, fontWeight: 700, marginBottom: 12 }}>{t.deleteAccountTitle}</div>
        <div style={{ fontSize: 13.5, color: C.plumSoft, lineHeight: 1.7, marginBottom: 20 }}>
          {t.deleteAccountWarn}
        </div>
        {error && (
          <div style={{ fontSize: 12.5, color: C.terracotta, marginBottom: 14,
            padding: "8px 12px", background: "#FFF0EC", borderRadius: 10 }}>{error}</div>
        )}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} disabled={deleting}
            style={{ flex: 1, padding: "12px 0", borderRadius: 14,
              border: `1px solid ${C.line}`, background: "transparent",
              color: C.plumSoft, fontSize: 14, cursor: "pointer" }}>
            {t.deleteAccountCancel}
          </button>
          <button onClick={handleDelete} disabled={deleting}
            style={{ flex: 1, padding: "12px 0", borderRadius: 14, border: "none",
              background: deleting ? C.terracottaSoft : "#C0392B",
              color: "#fff", fontSize: 14, cursor: deleting ? "default" : "pointer" }}>
            {deleting ? t.deleteAccountDeleting : t.deleteAccountConfirm}
          </button>
        </div>
      </div>
    </div>
  );
}

function PushPrompt({ lang, onEnable, onDismiss }) {
  const t = STR[lang];
  return (
    <div style={{ position: "fixed", left: 0, right: 0, maxWidth: 480, margin: "0 auto",
      bottom: "calc(76px + env(safe-area-inset-bottom, 0px))", zIndex: 90, padding: "0 16px" }}>
      <div style={{ background: C.card, border: `1px solid ${C.terracottaSoft}`, borderRadius: 16,
        padding: 14, boxShadow: "0 8px 24px rgba(74,47,61,.15)",
        display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ fontSize: 13, color: C.plum, lineHeight: 1.6 }}>{t.pushPrompt}</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onDismiss}
            style={{ flex: 1, padding: "9px 0", borderRadius: 12, border: `1px solid ${C.line}`,
              background: "transparent", color: C.plumSoft, fontSize: 13, cursor: "pointer" }}>
            {t.pushNotNow}
          </button>
          <button onClick={onEnable}
            style={{ flex: 1, padding: "9px 0", borderRadius: 12, border: "none",
              background: C.terracotta, color: "#fff", fontSize: 13, cursor: "pointer" }}>
            {t.pushEnable}
          </button>
        </div>
      </div>
    </div>
  );
}

function InstallPrompt({ lang, platform, onInstall, onDismiss }) {
  const t = STR[lang];
  const isIOS = platform === "ios";
  return (
    <div style={{ position: "fixed", left: 0, right: 0, maxWidth: 480, margin: "0 auto",
      bottom: "calc(76px + env(safe-area-inset-bottom, 0px))", zIndex: 90, padding: "0 16px" }}>
      <div style={{ background: C.card, border: `1px solid ${C.terracottaSoft}`, borderRadius: 16,
        padding: 14, boxShadow: "0 8px 24px rgba(74,47,61,.15)",
        display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          {isIOS
            ? <Share2 size={17} color={C.terracotta} style={{ flexShrink: 0, marginTop: 1 }} />
            : <Download size={17} color={C.terracotta} style={{ flexShrink: 0, marginTop: 1 }} />}
          <div style={{ fontSize: 13, color: C.plum, lineHeight: 1.6 }}>
            {isIOS ? t.installPromptIOS : t.installPromptAndroid}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {isIOS ? (
            <button onClick={onDismiss}
              style={{ flex: 1, padding: "9px 0", borderRadius: 12, border: "none",
                background: C.terracotta, color: "#fff", fontSize: 13, cursor: "pointer" }}>
              {t.installGotIt}
            </button>
          ) : (
            <>
              <button onClick={onDismiss}
                style={{ flex: 1, padding: "9px 0", borderRadius: 12, border: `1px solid ${C.line}`,
                  background: "transparent", color: C.plumSoft, fontSize: 13, cursor: "pointer" }}>
                {t.installNotNow}
              </button>
              <button onClick={onInstall}
                style={{ flex: 1, padding: "9px 0", borderRadius: 12, border: "none",
                  background: C.terracotta, color: "#fff", fontSize: 13, cursor: "pointer" }}>
                {t.installNow}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function AbuseModal({ lang, onClose }) {
  const isZh = lang === "zh";
  return (
    <div style={{ position: "fixed", top: 0, bottom: 0, left: 0, right: 0, maxWidth: 480, margin: "0 auto", background: "rgba(74,47,61,.5)",
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

function TranslationSheet({ original, translated, loading, lang, onClose }) {
  return (
    <div style={{ position: "fixed", top: 0, bottom: 0, left: 0, right: 0, maxWidth: 480, margin: "0 auto", background: "rgba(74,47,61,.4)",
      display: "flex", alignItems: "flex-end", zIndex: 300 }} onClick={onClose}>
      <div style={{ background: C.bg, borderRadius: "20px 20px 0 0", width: "100%",
        padding: "20px 20px 36px", boxShadow: "0 -8px 32px rgba(74,47,61,.2)" }}
        onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: C.plumSoft, display: "flex", alignItems: "center", gap: 5 }}>
            <Globe size={12} />
            {lang === "zh" ? "翻译" : "Translation"}
          </div>
          <button onClick={onClose}
            style={{ border: "none", background: "none", cursor: "pointer", color: C.plumSoft, padding: 2 }}>
            <X size={17} />
          </button>
        </div>
        <div style={{ fontSize: 12.5, color: C.plumSoft, lineHeight: 1.6, marginBottom: 12,
          paddingBottom: 12, borderBottom: `1px solid ${C.line}` }}>
          {original}
        </div>
        {loading ? (
          <div style={{ fontSize: 13, color: C.plumSoft, padding: "10px 0", textAlign: "center" }}>
            {lang === "zh" ? "翻译中…" : "Translating…"}
          </div>
        ) : (
          <div style={{ fontSize: 14, color: C.plum, lineHeight: 1.75 }}>{translated}</div>
        )}
      </div>
    </div>
  );
}

function ProfileCard({ profile, lang, onClose, onBlock, onReport, onHug, isHugged }) {
  const t = STR[lang];
  const interests = INTERESTS.filter((i) => (profile.interests || []).includes(i.id));
  const strengths = STRENGTHS.filter((s) => (profile.strengths || []).includes(s.id));
  return (
    <div style={{ position: "fixed", top: 0, bottom: 0, left: 0, right: 0, maxWidth: 480, margin: "0 auto", background: "rgba(74,47,61,.45)",
      display: "flex", alignItems: "flex-end", zIndex: 150 }}>
      <div style={{ background: C.bg, borderRadius: "24px 24px 0 0", width: "100%",
        maxHeight: "72%", overflowY: "auto", padding: "0 0 36px",
        boxShadow: "0 -8px 32px rgba(74,47,61,.2)" }}>
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "16px 18px 0" }}>
          <button onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: C.plumSoft }}>
            <X size={20} />
          </button>
        </div>
        <div style={{ textAlign: "center", padding: "4px 24px 20px" }}>
          <div style={{ width: 72, height: 72, borderRadius: 999, margin: "0 auto 12px",
            background: `linear-gradient(135deg, ${C.terracottaSoft}, ${C.peach})`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 38 }}>
            {profile.avatar || "🌿"}
          </div>
          <div style={{ fontFamily: "'Noto Serif SC',serif", fontSize: 18, color: C.plum,
            fontWeight: 700 }}>
            {profile.nickname || (lang === "zh" ? "匿名" : "anonymous")}
          </div>
        </div>
        {interests.length > 0 && (
          <div style={{ padding: "0 24px 16px" }}>
            <div style={{ fontSize: 12, color: C.plumSoft, marginBottom: 8 }}>{t.profileInterests}</div>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
              {interests.map((i) => (
                <span key={i.id} style={{ fontSize: 12.5, padding: "5px 11px", borderRadius: 999,
                  background: C.peach, color: C.terracotta }}>{i[lang]}</span>
              ))}
            </div>
          </div>
        )}
        {strengths.length > 0 && (
          <div style={{ padding: "0 24px" }}>
            <div style={{ fontSize: 12, color: C.plumSoft, marginBottom: 8 }}>{t.profileStrengths}</div>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
              {strengths.map((s) => (
                <span key={s.id} style={{ fontSize: 12.5, padding: "5px 11px", borderRadius: 999,
                  background: C.cardWarm, color: C.plumSoft }}>{s[lang]}</span>
              ))}
            </div>
          </div>
        )}
        {interests.length === 0 && strengths.length === 0 && (
          <div style={{ textAlign: "center", color: C.plumSoft, fontSize: 13, padding: "0 24px" }}>
            {lang === "zh" ? "Ta 还没有填写资料 🌿" : "No profile info yet 🌿"}
          </div>
        )}
        {onHug && (
          <div style={{ padding: "20px 24px 0" }}>
            <button onClick={onHug}
              style={{ width: "100%", padding: "12px 0", borderRadius: 14,
                border: `1px solid ${isHugged ? C.terracotta : C.terracottaSoft}`,
                background: isHugged ? C.peach : C.card,
                color: isHugged ? C.terracotta : C.plumSoft,
                fontSize: 14.5, cursor: "pointer", fontFamily: "'Noto Serif SC',serif" }}>
              {isHugged ? t.hugSent : t.sendHug}
            </button>
          </div>
        )}
        {(onBlock || onReport) && (
          <div style={{ display: "flex", gap: 10, padding: "12px 24px 0" }}>
            {onReport && (
              <button onClick={onReport}
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                  gap: 6, padding: "10px 0", borderRadius: 12, border: `1px solid ${C.line}`,
                  background: C.card, color: C.plumSoft, fontSize: 13.5, cursor: "pointer" }}>
                <Flag size={14} />{t.reportUser}
              </button>
            )}
            {onBlock && (
              <button onClick={onBlock}
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                  gap: 6, padding: "10px 0", borderRadius: 12,
                  border: `1px solid ${C.terracottaSoft}`,
                  background: "#FFF5F2", color: C.terracotta, fontSize: 13.5, cursor: "pointer" }}>
                <UserX size={14} />{t.block}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ReportUserModal({ lang, targetId, reporterId, onClose }) {
  const t = STR[lang];
  const REASONS = [
    { id: "harass", label: t.reportReasonHarass },
    { id: "abuse",  label: t.reportReasonAbuse },
    { id: "spam",   label: t.reportReasonSpam },
    { id: "other",  label: t.reportReasonOther },
  ];
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (!reason) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("reports").insert({
        reporter_id: reporterId,
        target_type: "user",
        target_id: targetId,
        reason: note.trim() ? `${reason}: ${note.trim()}` : reason,
        status: "open",
      });
      if (error) throw error;
      setDone(true);
    } catch (err) {
      console.error("Report user error:", err?.message, err?.code, err?.details, err?.hint, err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ position: "fixed", top: 0, bottom: 0, left: 0, right: 0, maxWidth: 480, margin: "0 auto", background: "rgba(74,47,61,.55)",
      display: "flex", alignItems: "flex-end", zIndex: 200 }}>
      <div style={{ background: C.bg, borderRadius: "24px 24px 0 0", width: "100%",
        maxHeight: "80%", overflowY: "auto", padding: "0 0 40px",
        boxShadow: "0 -8px 32px rgba(74,47,61,.25)" }}>
        <div style={{ display: "flex", alignItems: "center", padding: "16px 18px 0" }}>
          <button onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: C.plumSoft, padding: 2 }}>
            <X size={20} />
          </button>
          <div style={{ flex: 1, textAlign: "center", fontFamily: "'Noto Serif SC',serif",
            fontSize: 16, color: C.plum, fontWeight: 700 }}>{t.reportTitle}</div>
          <div style={{ width: 28 }} />
        </div>
        {done ? (
          <div style={{ textAlign: "center", padding: "32px 24px" }}>
            <div style={{ fontSize: 36, marginBottom: 14 }}>💛</div>
            <div style={{ fontSize: 14.5, color: C.plum, lineHeight: 1.7 }}>{t.reportDone}</div>
            <button onClick={onClose}
              style={{ marginTop: 20, padding: "10px 28px", borderRadius: 999, border: "none",
                background: C.terracotta, color: "#fff", fontSize: 14, cursor: "pointer" }}>
              {lang === "zh" ? "关闭" : "Close"}
            </button>
          </div>
        ) : (
          <div style={{ padding: "20px 20px 0" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
              {REASONS.map((r) => (
                <button key={r.id} onClick={() => setReason(r.id)}
                  style={{ padding: "13px 16px", borderRadius: 14, textAlign: "left",
                    border: `2px solid ${reason === r.id ? C.terracotta : C.line}`,
                    background: reason === r.id ? C.peach : C.card,
                    color: C.plum, fontSize: 14, cursor: "pointer" }}>
                  {r.label}
                </button>
              ))}
            </div>
            <textarea value={note} onChange={(e) => setNote(e.target.value)}
              placeholder={t.reportNote} maxLength={200} rows={3}
              style={{ width: "100%", boxSizing: "border-box", border: `1px solid ${C.line}`,
                borderRadius: 12, padding: "11px 14px", fontSize: 13.5, outline: "none",
                background: C.card, color: C.plum, resize: "none", marginBottom: 16,
                fontFamily: "'Noto Sans SC',-apple-system,sans-serif" }} />
            <button onClick={submit} disabled={!reason || submitting}
              style={{ width: "100%", padding: "13px 0", borderRadius: 14, border: "none",
                background: !reason || submitting ? C.terracottaSoft : C.terracotta,
                color: "#fff", fontSize: 14.5, cursor: !reason || submitting ? "default" : "pointer",
                fontFamily: "'Noto Serif SC',serif" }}>
              {submitting ? (lang === "zh" ? "提交中…" : "Submitting…") : t.reportSubmit}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function GuardSettings({ lang, userId, onClose }) {
  const t = STR[lang];
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from("blocks")
          .select("blocked_id, profiles!blocked_id(avatar, nickname)")
          .eq("blocker_id", userId);
        if (error) throw error;
        setBlocks(data || []);
      } catch (err) {
        console.error("Block list error:", err?.message, err?.code, err?.details, err?.hint, err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  const unblock = async (blockedId) => {
    try {
      const { error } = await supabase.from("blocks")
        .delete().eq("blocker_id", userId).eq("blocked_id", blockedId);
      if (error) throw error;
      setBlocks((prev) => prev.filter((b) => b.blocked_id !== blockedId));
    } catch (err) {
      console.error("Unblock error:", err?.message, err?.code, err?.details, err?.hint, err);
    }
  };

  return (
    <div style={{ position: "fixed", top: 0, bottom: 0, left: 0, right: 0, maxWidth: 480, margin: "0 auto", background: C.bg, zIndex: 200,
      display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", padding: "14px 16px",
        borderBottom: `1px solid ${C.line}`, flexShrink: 0 }}>
        <button onClick={onClose}
          style={{ background: "none", border: "none", cursor: "pointer", color: C.plumSoft, padding: 4 }}>
          <X size={20} />
        </button>
        <div style={{ flex: 1, textAlign: "center", fontFamily: "'Noto Serif SC',serif",
          fontSize: 16, color: C.plum, fontWeight: 700 }}>{t.guardTitle}</div>
        <div style={{ width: 28 }} />
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px 40px" }}>
        <div style={{ fontSize: 13, color: C.plumSoft, fontWeight: 500, marginBottom: 12 }}>
          {t.blockListTitle}
        </div>
        {loading ? (
          <div style={{ color: C.plumSoft, fontSize: 13, textAlign: "center", padding: "24px 0" }}>
            {lang === "zh" ? "载入中…" : "Loading…"}
          </div>
        ) : blocks.length === 0 ? (
          <div style={{ color: C.plumSoft, fontSize: 13, padding: "12px 0" }}>
            {t.blockListEmpty}
          </div>
        ) : (
          blocks.map((b) => (
            <div key={b.blocked_id}
              style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10,
                background: C.card, borderRadius: 16, padding: "12px 14px",
                border: `1px solid ${C.line}` }}>
              <div style={{ fontSize: 24, flexShrink: 0, lineHeight: 1 }}>
                {b.profiles?.avatar || "🌿"}
              </div>
              <div style={{ flex: 1, fontSize: 14, color: C.plum }}>
                {b.profiles?.nickname || (lang === "zh" ? "匿名" : "anonymous")}
              </div>
              <button onClick={() => unblock(b.blocked_id)}
                style={{ fontSize: 12, color: C.terracotta, background: "none",
                  border: `1px solid ${C.terracottaSoft}`, borderRadius: 999,
                  padding: "5px 12px", cursor: "pointer" }}>
                {t.unblock}
              </button>
            </div>
          ))
        )}
        <div style={{ marginTop: 28, fontSize: 13, color: C.plumSoft, fontWeight: 500, marginBottom: 10 }}>
          {lang === "zh" ? "屏蔽词设置" : "Blocked words"}
        </div>
        <div style={{ background: C.card, borderRadius: 14, padding: "14px 16px",
          border: `1px solid ${C.line}`, color: C.plumSoft, fontSize: 13 }}>
          {t.comingSoon} ✨
        </div>
        <div style={{ marginTop: 20, fontSize: 13, color: C.plumSoft, fontWeight: 500, marginBottom: 10 }}>
          {lang === "zh" ? "举报记录" : "Report history"}
        </div>
        <div style={{ background: C.card, borderRadius: 14, padding: "14px 16px",
          border: `1px solid ${C.line}`, color: C.plumSoft, fontSize: 13 }}>
          {t.comingSoon} ✨
        </div>
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
const REACTION_EMOJIS = ["🤗", "👍", "❤️", "😂", "😢", "✨"];

async function compressImage(file) {
  const MAX_DIM = 1200;
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > MAX_DIM || height > MAX_DIM) {
        if (width >= height) { height = Math.round(height * MAX_DIM / width); width = MAX_DIM; }
        else { width = Math.round(width * MAX_DIM / height); height = MAX_DIM; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error("toBlob failed")),
        "image/jpeg", 0.78
      );
    };
    img.onerror = reject;
    img.src = url;
  });
}

const COMPOSE_TAGS = {
  zh: ["今日趣事", "美食", "想倾诉", "可爱meme", "职场", "心情"],
  en: ["Today's fun", "Food", "Need to talk", "Cute meme", "Career", "Mood"],
};

function ComposeBox({ lang, profile, text, onTextChange, emoji, onEmojiChange, tags, onTagsChange,
  publishing, onPublish, imagePreview, onImageSelect, onImageClear, imageError }) {
  const t = STR[lang];
  const fileInputRef = useRef(null);
  return (
    <div style={{ margin: "0 16px 14px", background: C.card, borderRadius: 18,
      padding: 14, border: `1px solid ${C.line}` }}>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        <Avatar emoji={profile?.avatar || "🌿"} color={C.peach} size={32} />
        <textarea
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder={lang === "zh" ? "说点什么，匿名的、温柔的…" : "Share something, anonymously and gently…"}
          maxLength={1000}
          rows={2}
          style={{ flex: 1, border: "none", outline: "none", resize: "none", fontSize: 14,
            color: C.plum, background: "transparent", lineHeight: 1.6,
            fontFamily: "'Noto Sans SC',-apple-system,sans-serif" }}
        />
      </div>
      {imagePreview && (
        <div style={{ position: "relative", marginTop: 10, display: "inline-block" }}>
          <img src={imagePreview} alt=""
            style={{ maxHeight: 90, maxWidth: "100%", borderRadius: 10, display: "block" }} />
          <button onClick={onImageClear}
            style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20,
              borderRadius: 999, border: "none", background: C.terracotta, color: "#fff",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={10} />
          </button>
        </div>
      )}
      {imageError && (
        <div style={{ fontSize: 11.5, color: C.terracotta, marginTop: 6 }}>{imageError}</div>
      )}
      <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
        {COMPOSE_EMOJIS.map((e) => (
          <button key={e} onClick={() => onEmojiChange(emoji === e ? "" : e)}
            style={{ width: 30, height: 30, borderRadius: 8, cursor: "pointer", fontSize: 16,
              border: `1px solid ${emoji === e ? C.terracotta : C.line}`,
              background: emoji === e ? C.peach : "transparent" }}>{e}</button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
        {COMPOSE_TAGS[lang].map((tg) => {
          const active = tags.includes(tg);
          return (
            <button key={tg} onClick={() => onTagsChange(active ? tags.filter(t => t !== tg) : [...tags, tg])}
              style={{ padding: "4px 10px", borderRadius: 999, fontSize: 12, cursor: "pointer",
                border: `1px solid ${active ? C.terracotta : C.line}`,
                background: active ? C.peach : "transparent",
                color: active ? C.terracotta : C.plumSoft }}>{tg}</button>
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
        <button onClick={() => fileInputRef.current?.click()}
          style={{ border: "none", background: "none", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, padding: "6px 0",
            color: imagePreview ? C.terracotta : C.plumSoft }}>
          <ImageIcon size={15} />
          {imagePreview ? (lang === "zh" ? "已选图" : "Photo added") : t.addImage}
        </button>
        <button onClick={onPublish} disabled={!text.trim() || publishing}
          style={{ padding: "8px 18px", borderRadius: 999, border: "none", fontSize: 13, cursor: "pointer",
            background: !text.trim() || publishing ? C.terracottaSoft : C.terracotta,
            color: "#fff", fontFamily: "'Noto Serif SC',serif" }}>
          {publishing ? (lang === "zh" ? "发布中…" : "Posting…") : (lang === "zh" ? "发布" : "Post")}
        </button>
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }}
        onChange={(e) => { onImageSelect(e.target.files?.[0]); e.target.value = ""; }} />
    </div>
  );
}

// ── Comments ──────────────────────────────────────────────────
function CommentItem({ comment, allComments, lang, onReply, onDelete, userId, depth }) {
  const replies = allComments.filter((c) => c.parent_id === comment.id);
  const av = comment.profiles?.avatar || "🌿";
  const name = comment.profiles?.nickname || (lang === "zh" ? "匿名" : "anonymous");
  const isMissGalene = comment.author_id === MISS_GALENE_ID;
  const isOwn = comment.author_id === userId;
  return (
    <div style={{ marginLeft: depth * 18, marginBottom: 8 }}>
      <div style={{ display: "flex", gap: 7, alignItems: "flex-start" }}>
        <Avatar emoji={av} color={C.peach} size={22} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: C.plumSoft, marginBottom: 1, display: "flex", alignItems: "center", gap: 5 }}>
            {name}
            {isMissGalene && (
              <span style={{ fontSize: 10, color: "rgba(201,117,90,0.6)" }}>
                {lang === "zh" ? "社群助手" : "Community Companion"}
              </span>
            )}
          </div>
          <div style={{ fontSize: 13.5, color: C.plum, lineHeight: 1.5 }}>{comment.body}</div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 1 }}>
            <button onClick={() => onReply(comment)}
              style={{ background: "none", border: "none", cursor: "pointer",
                color: C.sage, fontSize: 11, padding: "2px 0" }}>
              {lang === "zh" ? "回复" : "Reply"}
            </button>
            {isOwn && (
              <button onClick={() => onDelete(comment.id)}
                style={{ background: "none", border: "none", cursor: "pointer",
                  color: C.plumSoft, fontSize: 11, padding: "2px 0",
                  display: "flex", alignItems: "center", gap: 2 }}>
                <Trash2 size={11} />
              </button>
            )}
          </div>
        </div>
      </div>
      {replies.map((r) => (
        <CommentItem key={r.id} comment={r} allComments={allComments} lang={lang} onReply={onReply}
          onDelete={onDelete} userId={userId} depth={depth + 1} />
      ))}
    </div>
  );
}

function CommentsSection({ postId, userId, lang, t, postAuthorId, defaultExpanded }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(!!defaultExpanded);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [sending, setSending] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from("comments")
          .select("*, profiles!author_id(nickname, avatar)")
          .eq("post_id", postId)
          .eq("hidden", false)
          .order("created_at", { ascending: true });
        if (error) throw error;
        setComments(data || []);
      } catch (err) {
        console.error("Comments load error:", err?.message, err?.code, err?.details, err?.hint, err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [postId]);

  const submit = async () => {
    if (!text.trim() || !userId) return;
    setSending(true);
    try {
      const row = { post_id: postId, author_id: userId, body: text.trim(), hidden: false };
      if (replyTo) row.parent_id = replyTo.id;
      const { data, error } = await supabase
        .from("comments")
        .insert(row)
        .select("*, profiles!author_id(nickname, avatar)")
        .single();
      if (error) throw error;
      setComments((prev) => [...prev, data]);
      setExpanded(true);
      setText(""); setReplyTo(null);
      insertNotif({ recipientId: postAuthorId, type: "comment", actorId: userId, refId: postId });
    } catch (err) {
      console.error("Comment submit error:", err?.message, err?.code, err?.details, err?.hint, err);
    } finally {
      setSending(false);
    }
  };

  const deleteComment = async (commentId) => {
    try {
      const { error } = await supabase.from("comments").delete().eq("id", commentId).eq("author_id", userId);
      if (error) throw error;
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      console.error("Delete comment error:", err?.message);
    }
  };

  const topLevel = comments.filter((c) => !c.parent_id);
  const PREVIEW = 2;
  const hasMore = !expanded && topLevel.length > PREVIEW;
  const visibleTop = hasMore ? topLevel.slice(-PREVIEW) : topLevel;

  return (
    <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 10, marginTop: 4 }}>
      {loading ? (
        <div style={{ padding: "6px 0", color: C.plumSoft, fontSize: 12, textAlign: "center" }}>
          {lang === "zh" ? "载入中…" : "Loading…"}
        </div>
      ) : topLevel.length === 0 ? (
        <div style={{ padding: "4px 0 2px", color: C.plumSoft, fontSize: 12 }}>
          {t.noComments}
        </div>
      ) : (
        <>
          {hasMore && (
            <button onClick={() => setExpanded(true)}
              style={{ border: "none", background: "none", cursor: "pointer",
                color: C.sage, fontSize: 12, padding: "2px 0", marginBottom: 6, display: "block" }}>
              {lang === "zh"
                ? `查看全部 ${comments.length} 条评论`
                : `View all ${comments.length} comment${comments.length === 1 ? "" : "s"}`}
            </button>
          )}
          {visibleTop.map((c) => (
            <CommentItem key={c.id} comment={c} allComments={comments} lang={lang}
              onReply={(c) => { setReplyTo(c); setTimeout(() => inputRef.current?.focus(), 0); }}
              onDelete={deleteComment} userId={userId} depth={0} />
          ))}
        </>
      )}
      {replyTo && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "6px 0 4px",
          background: C.cardWarm, borderRadius: 8, padding: "5px 10px" }}>
          <span style={{ fontSize: 11, color: C.plumSoft, flex: 1 }}>
            {lang === "zh" ? "回复 " : "Replying to "}
            <b>{replyTo.profiles?.nickname || (lang === "zh" ? "匿名" : "anonymous")}</b>
          </span>
          <button onClick={() => setReplyTo(null)}
            style={{ background: "none", border: "none", cursor: "pointer", color: C.plumSoft, padding: 1 }}>
            <X size={11} />
          </button>
        </div>
      )}
      <div style={{ display: "flex", gap: 7, alignItems: "center", marginTop: 8 }}>
        <input ref={inputRef} value={text} onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && submit()}
          placeholder={t.commentPlaceholder}
          style={{ flex: 1, border: `1px solid ${C.line}`, borderRadius: 999,
            padding: "8px 12px", fontSize: 13, outline: "none",
            background: C.bg, color: C.plum }} />
        <button onClick={submit} disabled={sending || !text.trim()}
          style={{ width: 32, height: 32, borderRadius: 999, border: "none", flexShrink: 0,
            background: sending || !text.trim() ? C.terracottaSoft : C.terracotta,
            color: "#fff", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Send size={13} />
        </button>
      </div>
    </div>
  );
}

// ── Post Card ────────────────────────────────────────────────
function PostCard({ post, lang, t, hugged, hugCount, onHug, onReport, reported, timeAgo, onProfileClick, userId, onDelete, onTranslate, openComments }) {
  const author = post.profiles || {};
  const av = author.avatar || "🌿";
  const name = author.nickname || (lang === "zh" ? "匿名" : "anonymous");
  const isMissGalene = post.author_id === MISS_GALENE_ID;
  const translateCb = useCallback(() => onTranslate(post.body), [onTranslate, post.body]);
  const lp = useLongPress(translateCb);
  return (
    <div id={`post-${post.id}`} style={{ margin: "0 16px 14px", background: C.card, borderRadius: 18,
      padding: 16, border: `1px solid ${C.line}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <button onClick={onProfileClick}
          style={{ background: "none", border: "none", padding: 0,
            cursor: onProfileClick ? "pointer" : "default", flexShrink: 0 }}>
          <Avatar emoji={av} color={C.peach} size={34} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div onClick={onProfileClick}
              style={{ fontSize: 13.5, color: C.plum, fontWeight: 500,
                cursor: onProfileClick ? "pointer" : "default" }}>{name}</div>
            {isMissGalene && (
              <span style={{ fontSize: 11, color: "rgba(201,117,90,0.6)" }}>
                {lang === "zh" ? "社群助手" : "Community Companion"}
              </span>
            )}
          </div>
          <div style={{ fontSize: 11, color: C.plumSoft }}>{timeAgo(post.created_at)} · {t.anon}</div>
        </div>
        {post.tag && post.tag.split(", ").map((tg) => (
          <span key={tg} style={{ fontSize: 11, color: C.sage, background: "#EEF3EF",
            padding: "3px 9px", borderRadius: 999 }}>{tg}</span>
        ))}
      </div>
      <div {...lp} style={{ fontSize: 14.5, color: C.plum, lineHeight: 1.7, userSelect: "none" }}>{post.body}</div>
      {post.image_emoji && (
        <div style={{ marginTop: 12, height: 130, borderRadius: 14, background: C.cardWarm,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 56 }}>{post.image_emoji}</div>
      )}
      {post.image_url && (
        <img src={post.image_url} alt=""
          style={{ marginTop: 12, width: "100%", borderRadius: 14,
            objectFit: "cover", maxHeight: 280, display: "block" }} />
      )}
      <div style={{ display: "flex", gap: 8, marginTop: 14, alignItems: "center" }}>
        <Reaction icon={Heart} label={t.hug} count={hugCount} active={hugged} onClick={onHug} />
        {onDelete && (
          <button onClick={onDelete}
            style={{ border: "none", background: "none", color: C.plumSoft,
              cursor: "pointer", display: "flex", alignItems: "center", padding: 2 }}>
            <Trash2 size={14} />
          </button>
        )}
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
      {userId && <CommentsSection postId={post.id} userId={userId} lang={lang} t={t} postAuthorId={post.author_id} defaultExpanded={openComments} />}
    </div>
  );
}

// ── Feed ────────────────────────────────────────────────────
function Feed({ lang, userId, profile, onCrisisDetected, onAbuseDetected, highlightPostId, openCommentsFor, onHighlightDone }) {
  const t = STR[lang];
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myHugs, setMyHugs] = useState(new Set());
  const [hugCounts, setHugCounts] = useState({});
  const [reportedIds, setReportedIds] = useState(new Set());
  const [showCrisis, setShowCrisis] = useState(true);
  const [composeText, setComposeText] = useState("");
  const [composeEmoji, setComposeEmoji] = useState("");
  const [composeTags, setComposeTags] = useState([]);
  const [composeImage, setComposeImage] = useState(null);
  const [composeImagePreview, setComposeImagePreview] = useState(null);
  const [imageError, setImageError] = useState(null);
  const [publishing, setPublishing] = useState(false);
  const [viewingProfile, setViewingProfile] = useState(null);
  const [blockedIds, setBlockedIds] = useState(new Set());
  const [profileHugsSent, setProfileHugsSent] = useState(new Set());
  const [showReportModal, setShowReportModal] = useState(false);
  const [bannedAlert, setBannedAlert] = useState(false);
  const [txSheet, setTxSheet] = useState(null);
  const [goneToast, setGoneToast] = useState(false);

  const handleTranslate = useCallback(async (text) => {
    setTxSheet({ text, translated: null, loading: true });
    try {
      const result = await translateText(text);
      setTxSheet((s) => s ? { ...s, translated: result, loading: false } : null);
    } catch {
      setTxSheet((s) => s ? { ...s, loading: false,
        translated: lang === "zh" ? "翻译失败，请重试" : "Translation failed, please try again" } : null);
    }
  }, [lang]);

  const fetchProfile = async (authorId) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, avatar, nickname, interests, strengths")
        .eq("id", authorId)
        .single();
      if (error) throw error;
      setViewingProfile(data);
    } catch (err) {
      console.error("Profile fetch error:", err?.message, err?.code, err?.details, err?.hint, err);
    }
  };

  const blockUser = async (targetId) => {
    try {
      const { error } = await supabase.from("blocks").insert({ blocker_id: userId, blocked_id: targetId });
      if (error) throw error;
      setBlockedIds((prev) => new Set([...prev, targetId]));
      setPosts((prev) => prev.filter((p) => p.author_id !== targetId));
      setViewingProfile(null);
    } catch (err) {
      console.error("Block error:", err?.message, err?.code, err?.details, err?.hint, err);
    }
  };

  const toggleProfileHug = async (targetId) => {
    const wasHugged = profileHugsSent.has(targetId);
    const next = new Set(profileHugsSent);
    if (wasHugged) next.delete(targetId); else next.add(targetId);
    setProfileHugsSent(next);
    try {
      if (wasHugged) {
        const { error } = await supabase.from("profile_hugs")
          .delete().eq("from_id", userId).eq("to_id", targetId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("profile_hugs")
          .insert({ from_id: userId, to_id: targetId });
        if (error) throw error;
        insertNotif({ recipientId: targetId, type: "profile_hug", actorId: userId, refId: null });
      }
    } catch (err) {
      setProfileHugsSent(profileHugsSent);
      console.error("Profile hug error:", err?.message, err?.code, err?.details, err?.hint, err);
    }
  };

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      setLoading(true);
      try {
        const { data: blockData } = await supabase
          .from("blocks").select("blocked_id").eq("blocker_id", userId);
        const blocked = new Set((blockData || []).map((b) => b.blocked_id));
        setBlockedIds(blocked);

        const { data: phData } = await supabase
          .from("profile_hugs").select("to_id").eq("from_id", userId);
        setProfileHugsSent(new Set((phData || []).map((h) => h.to_id)));

        const { data: postsData, error } = await supabase
          .from("posts")
          .select("*, profiles!author_id(nickname, avatar, banned)")
          .eq("hidden", false)
          .order("created_at", { ascending: false })
          .limit(50);
        if (error) throw error;

        const visible = (postsData || []).filter(
          (p) => !blocked.has(p.author_id) && !p.profiles?.banned
        );
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

  useEffect(() => {
    if (!highlightPostId || loading) return;
    requestAnimationFrame(() => {
      const el = document.getElementById(`post-${highlightPostId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        setGoneToast(true);
        setTimeout(() => setGoneToast(false), 3000);
      }
      if (onHighlightDone) onHighlightDone();
    });
  }, [loading, highlightPostId]);

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
        const post = posts.find((p) => p.id === postId);
        if (post) insertNotif({ recipientId: post.author_id, type: "post_hug", actorId: userId, refId: postId });
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
        target_type: "post", target_id: postId, reporter_id: userId, reason: null, status: "open",
      });
      setReportedIds((prev) => new Set([...prev, postId]));
    } catch (err) {
      console.error("Report error:", err?.message, err?.code, err?.details, err?.hint, err);
    }
  };

  const handleImageSelect = async (file) => {
    if (!file) return;
    setImageError(null);
    try {
      const blob = await compressImage(file);
      if (blob.size > 2 * 1024 * 1024) {
        setImageError(t.imageTooLarge);
        return;
      }
      if (composeImagePreview) URL.revokeObjectURL(composeImagePreview);
      setComposeImage(blob);
      setComposeImagePreview(URL.createObjectURL(blob));
    } catch (err) {
      console.error("Image compress error:", err?.message, err);
      setImageError(lang === "zh" ? "图片处理失败，请重试" : "Failed to process image, please try again");
    }
  };

  const clearImage = () => {
    if (composeImagePreview) URL.revokeObjectURL(composeImagePreview);
    setComposeImage(null);
    setComposeImagePreview(null);
    setImageError(null);
  };

  const deletePost = async (postId) => {
    try {
      const { error } = await supabase.from("posts").delete().eq("id", postId).eq("author_id", userId);
      if (error) throw error;
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) {
      console.error("Delete post error:", err?.message);
    }
  };

  const publish = async () => {
    if (!composeText.trim() || !userId) return;
    if (profile.banned) { setBannedAlert(true); return; }
    if (filterAbuse(composeText.trim())) { onAbuseDetected(); return; }
    setPublishing(true);
    try {
      let imageUrl = null;
      if (composeImage) {
        const path = `${userId}/${Date.now()}.jpg`;
        const { error: upErr } = await supabase.storage
          .from("post-images")
          .upload(path, composeImage, { contentType: "image/jpeg", upsert: false });
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from("post-images").getPublicUrl(path);
        imageUrl = urlData.publicUrl;
      }
      const { data, error } = await supabase
        .from("posts")
        .insert({ author_id: userId, body: composeText.trim(),
          tag: composeTags.length > 0 ? composeTags.join(", ") : null,
          image_emoji: composeEmoji || null, image_url: imageUrl, hidden: false })
        .select("*, profiles!author_id(nickname, avatar)")
        .single();
      if (error) throw error;
      setPosts((prev) => [data, ...prev]);
      setHugCounts((prev) => ({ ...prev, [data.id]: 0 }));
      if (detectCrisis(data.body)) onCrisisDetected();
      setComposeText(""); setComposeEmoji(""); setComposeTags([]);
      clearImage();
    } catch (err) {
      console.error("Publish error:", err?.message, err?.code, err?.details, err?.hint, err);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div style={{ paddingBottom: "calc(90px + env(safe-area-inset-bottom, 0px))" }}>
      <div style={{ padding: "18px 16px 14px" }}>
        <div style={{ fontFamily: "'Noto Serif SC',serif", fontSize: 24, fontWeight: 700, color: C.plum }}>{t.feedTitle}</div>
        <div style={{ color: C.plumSoft, fontSize: 12.5, marginTop: 2 }}>{t.feedSub}</div>
      </div>
      {showCrisis && <CrisisBanner t={t} onClose={() => setShowCrisis(false)} />}
      <GuidelinesBanner lang={lang} />
      {bannedAlert && (
        <div style={{ margin: "0 16px 10px", padding: "11px 14px", borderRadius: 12,
          background: "#FFF0EC", border: `1px solid ${C.terracottaSoft}`,
          display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12.5, color: C.terracotta, flex: 1 }}>{t.bannedMsg}</span>
          <button onClick={() => setBannedAlert(false)}
            style={{ background: "none", border: "none", cursor: "pointer",
              color: C.plumSoft, padding: 2, flexShrink: 0 }}>
            <X size={14} />
          </button>
        </div>
      )}
      <ComposeBox
        lang={lang} profile={profile}
        text={composeText} onTextChange={setComposeText}
        emoji={composeEmoji} onEmojiChange={setComposeEmoji}
        tags={composeTags} onTagsChange={setComposeTags}
        publishing={publishing} onPublish={publish}
        imagePreview={composeImagePreview} onImageSelect={handleImageSelect}
        onImageClear={clearImage} imageError={imageError}
      />
      {goneToast && (
        <div style={{ margin: "0 16px 10px", padding: "11px 14px", borderRadius: 12,
          background: "#FFF0EC", border: `1px solid ${C.terracottaSoft}`,
          fontSize: 12.5, color: C.terracotta, textAlign: "center" }}>
          {lang === "zh" ? "这条内容已不存在" : "This content no longer exists"}
        </div>
      )}
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
            onProfileClick={p.author_id !== userId ? () => fetchProfile(p.author_id) : undefined}
            userId={userId}
            onDelete={p.author_id === userId ? () => deletePost(p.id) : undefined}
            onTranslate={handleTranslate}
            openComments={p.id === openCommentsFor}
          />
        ))
      )}
      {viewingProfile && (
        <>
          <ProfileCard profile={viewingProfile} lang={lang}
            onClose={() => { setViewingProfile(null); setShowReportModal(false); }}
            onBlock={() => blockUser(viewingProfile.id)}
            onReport={() => setShowReportModal(true)}
            onHug={() => toggleProfileHug(viewingProfile.id)}
            isHugged={profileHugsSent.has(viewingProfile.id)}
          />
          {showReportModal && (
            <ReportUserModal lang={lang} targetId={viewingProfile.id} reporterId={userId}
              onClose={() => { setShowReportModal(false); setViewingProfile(null); }} />
          )}
        </>
      )}
      {txSheet && (
        <TranslationSheet
          original={txSheet.text} translated={txSheet.translated}
          loading={txSheet.loading} lang={lang}
          onClose={() => setTxSheet(null)}
        />
      )}
    </div>
  );
}

// ── Rooms ───────────────────────────────────────────────────
function Rooms({ lang, onEnter }) {
  const t = STR[lang];
  const [onlineCounts, setOnlineCounts] = useState({});

  useEffect(() => {
    const channels = ROOMS.map((r) => {
      const ch = supabase.channel(`chat:${r.slug}`);
      ch.on("presence", { event: "sync" }, () => {
        setOnlineCounts((prev) => ({ ...prev, [r.slug]: Object.keys(ch.presenceState()).length }));
      }).subscribe();
      return ch;
    });
    return () => { channels.forEach((ch) => supabase.removeChannel(ch)); };
  }, []);

  return (
    <div style={{ paddingBottom: "calc(90px + env(safe-area-inset-bottom, 0px))" }}>
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
              <span style={{ width: 7, height: 7, borderRadius: 999, background: C.sage }} />{onlineCounts[r.slug] ?? 0}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ── Chat ────────────────────────────────────────────────────
function ChatRoom({ lang, room, profile, userId, onBack, onCrisisDetected, onAbuseDetected, highlightMsgId }) {
  const t = STR[lang];
  const [msgs, setMsgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [viewingProfile, setViewingProfile] = useState(null);
  const [blockedIds, setBlockedIds] = useState(new Set());
  const [profileHugsSent, setProfileHugsSent] = useState(new Set());
  const [showReportModal, setShowReportModal] = useState(false);
  const [bannedAlert, setBannedAlert] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [rxCounts, setRxCounts] = useState({});
  const [myReactions, setMyReactions] = useState({});
  const [onlineCount, setOnlineCount] = useState(1);
  const [rxPickerFor, setRxPickerFor] = useState(null);
  const [txSheet, setTxSheet] = useState(null);
  const blockedIdsRef = useRef(new Set());
  const lpTimers = useRef({});
  const bottomRef = useRef(null);
  const seenIds = useRef(new Set());
  const inputRef = useRef(null);
  const pendingHighlight = useRef(null);
  const [goneToast, setGoneToast] = useState(false);

  useEffect(() => { blockedIdsRef.current = blockedIds; }, [blockedIds]);

  const fetchProfile = async (authorId) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, avatar, nickname, interests, strengths")
        .eq("id", authorId)
        .single();
      if (error) throw error;
      setViewingProfile(data);
    } catch (err) {
      console.error("Profile fetch error:", err?.message, err?.code, err?.details, err?.hint, err);
    }
  };

  const blockUser = async (targetId) => {
    try {
      const { error } = await supabase.from("blocks").insert({ blocker_id: userId, blocked_id: targetId });
      if (error) throw error;
      setBlockedIds((prev) => new Set([...prev, targetId]));
      setMsgs((prev) => prev.filter((m) => m.author_id !== targetId));
      setViewingProfile(null);
    } catch (err) {
      console.error("Block error:", err?.message, err?.code, err?.details, err?.hint, err);
    }
  };

  const toggleProfileHug = async (targetId) => {
    const wasHugged = profileHugsSent.has(targetId);
    const next = new Set(profileHugsSent);
    if (wasHugged) next.delete(targetId); else next.add(targetId);
    setProfileHugsSent(next);
    try {
      if (wasHugged) {
        const { error } = await supabase.from("profile_hugs")
          .delete().eq("from_id", userId).eq("to_id", targetId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("profile_hugs")
          .insert({ from_id: userId, to_id: targetId });
        if (error) throw error;
        insertNotif({ recipientId: targetId, type: "profile_hug", actorId: userId, refId: null });
      }
    } catch (err) {
      setProfileHugsSent(profileHugsSent);
      console.error("Profile hug error:", err?.message, err?.code, err?.details, err?.hint, err);
    }
  };

  const toggleReaction = async (msgId, emoji) => {
    const mySet = myReactions[msgId] || new Set();
    const hasIt = mySet.has(emoji);
    const prevCounts = rxCounts;
    const prevMine = myReactions;
    const newSet = new Set(mySet);
    if (hasIt) newSet.delete(emoji); else newSet.add(emoji);
    setMyReactions({ ...myReactions, [msgId]: newSet });
    const cur = rxCounts[msgId] || {};
    setRxCounts({ ...rxCounts, [msgId]: { ...cur, [emoji]: Math.max(0, (cur[emoji] || 0) + (hasIt ? -1 : 1)) } });
    setRxPickerFor(null);
    try {
      if (hasIt) {
        const { error } = await supabase.from("message_reactions")
          .delete().eq("message_id", msgId).eq("profile_id", userId).eq("emoji", emoji);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("message_reactions")
          .insert({ message_id: msgId, profile_id: userId, emoji });
        if (error) throw error;
      }
    } catch (err) {
      setMyReactions(prevMine);
      setRxCounts(prevCounts);
      console.error("Reaction error:", err?.message, err?.code, err?.details, err?.hint, err);
    }
  };

  const translateMsg = useCallback(async (msgText) => {
    setTxSheet({ text: msgText, translated: null, loading: true });
    try {
      const result = await translateText(msgText);
      setTxSheet((s) => s ? { ...s, translated: result, loading: false } : null);
    } catch {
      setTxSheet((s) => s ? { ...s, loading: false,
        translated: lang === "zh" ? "翻译失败，请重试" : "Translation failed, please try again" } : null);
    }
  }, [lang]);

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
        const { data: blockData } = await supabase
          .from("blocks").select("blocked_id").eq("blocker_id", userId);
        const blocked = new Set((blockData || []).map((b) => b.blocked_id));
        setBlockedIds(blocked);

        const { data: phData } = await supabase
          .from("profile_hugs").select("to_id").eq("from_id", userId);
        setProfileHugsSent(new Set((phData || []).map((h) => h.to_id)));

        const { data, error } = await supabase
          .from("messages")
          .select("*, profiles!author_id(nickname, avatar, banned)")
          .eq("room_slug", room.slug)
          .eq("hidden", false)
          .order("created_at", { ascending: true });
        if (error) throw error;
        const rows = (data || []).filter(
          (m) => !blocked.has(m.author_id) && !m.profiles?.banned
        );
        rows.forEach((m) => seenIds.current.add(m.id));
        if (highlightMsgId) pendingHighlight.current = highlightMsgId;
        setMsgs(rows);

        if (rows.length > 0) {
          const msgIds = rows.map((r) => r.id);
          const { data: rxData } = await supabase
            .from("message_reactions")
            .select("message_id, profile_id, emoji")
            .in("message_id", msgIds);
          const counts = {};
          const mine = {};
          (rxData || []).forEach(({ message_id, profile_id, emoji }) => {
            if (!counts[message_id]) counts[message_id] = {};
            counts[message_id][emoji] = (counts[message_id][emoji] || 0) + 1;
            if (profile_id === userId) {
              if (!mine[message_id]) mine[message_id] = new Set();
              mine[message_id].add(emoji);
            }
          });
          setRxCounts(counts);
          setMyReactions(mine);
        }
      } catch (err) {
        console.error("Chat history error:", err?.message, err?.code, err?.details, err?.hint, err);
      } finally {
        setLoading(false);
      }
    };

    load();

    const channel = supabase
      .channel(`chat:${room.slug}`, { config: { presence: { key: userId } } })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages",
        filter: `room_slug=eq.${room.slug}` },
        async (payload) => {
          const id = payload.new.id;
          if (seenIds.current.has(id)) return;
          if (blockedIdsRef.current.has(payload.new.author_id)) return;
          seenIds.current.add(id);
          try {
            const { data } = await supabase
              .from("messages")
              .select("*, profiles!author_id(nickname, avatar, banned)")
              .eq("id", id)
              .single();
            if (data?.profiles?.banned) return;
            if (data) setMsgs((prev) => [...prev, data]);
          } catch {
            setMsgs((prev) => [...prev, { ...payload.new, profiles: null }]);
          }
        })
      .on("presence", { event: "sync" }, () => {
        setOnlineCount(Object.keys(channel.presenceState()).length);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => { supabase.removeChannel(channel); };
  }, [room.slug, userId]);

  useEffect(() => {
    if (pendingHighlight.current) {
      const id = pendingHighlight.current;
      pendingHighlight.current = null;
      requestAnimationFrame(() => {
        const el = document.getElementById(`msg-${id}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        } else {
          setGoneToast(true);
          setTimeout(() => setGoneToast(false), 3000);
          bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        }
      });
      return;
    }
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const send = async () => {
    if (!text.trim() || !userId) return;
    const body = text.trim();
    if (profile.banned) { setBannedAlert(true); return; }
    if (filterAbuse(body)) { onAbuseDetected(); return; }
    const replyToId = replyTo?.id || null;
    const savedReplyTo = replyTo;
    setText("");
    setReplyTo(null);
    setSending(true);
    try {
      const { data, error } = await supabase
        .from("messages")
        .insert({ room_slug: room.slug, author_id: userId, body, reply_to: replyToId })
        .select("*, profiles!author_id(nickname, avatar)")
        .single();
      if (error) throw error;
      seenIds.current.add(data.id);
      setMsgs((prev) => [...prev, data]);
      if (detectCrisis(body)) onCrisisDetected();
      if (replyToId && savedReplyTo?.author_id) {
        insertNotif({ recipientId: savedReplyTo.author_id, type: "message_reply", actorId: userId, refId: replyToId });
      }
    } catch (err) {
      console.error("Send error:", err?.message, err?.code, err?.details, err?.hint, err);
      setText(body);
      setReplyTo(savedReplyTo);
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
          <div style={{ fontSize: 11, color: C.sage }}>{onlineCount} {t.sendHint} · {t.guarded}</div>
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
            const quotedMsg = m.reply_to ? msgs.find((x) => x.id === m.reply_to) : null;
            const msgRxCounts = rxCounts[m.id] || {};
            const msgMyRx = myReactions[m.id] || new Set();
            const hasReactions = Object.values(msgRxCounts).some((c) => c > 0);
            return (
              <div key={m.id} id={`msg-${m.id}`} style={{ display: "flex", gap: 8,
                flexDirection: isMe ? "row-reverse" : "row", alignItems: "flex-end" }}>
                <button onClick={() => !isMe && fetchProfile(m.author_id)}
                  style={{ background: "none", border: "none", padding: 0, flexShrink: 0,
                    cursor: isMe ? "default" : "pointer" }}>
                  <Avatar emoji={av} color={isMe ? C.terracottaSoft : C.peach} size={28} />
                </button>
                <div style={{ display: "flex", flexDirection: "column",
                  alignItems: isMe ? "flex-end" : "flex-start", maxWidth: "75%" }}>
                  {!isMe && (
                    <div onClick={() => fetchProfile(m.author_id)}
                      style={{ fontSize: 11, color: C.plumSoft, marginBottom: 3, marginLeft: 4,
                        cursor: "pointer" }}>{name}</div>
                  )}
                  <div
                    onPointerDown={() => { lpTimers.current[m.id] = setTimeout(() => translateMsg(m.body), 600); }}
                    onPointerUp={() => clearTimeout(lpTimers.current[m.id])}
                    onPointerLeave={() => clearTimeout(lpTimers.current[m.id])}
                    onPointerCancel={() => clearTimeout(lpTimers.current[m.id])}
                    onPointerMove={() => clearTimeout(lpTimers.current[m.id])}
                    style={{ padding: "10px 14px", borderRadius: 16,
                      borderBottomRightRadius: isMe ? 4 : 16, borderBottomLeftRadius: isMe ? 16 : 4,
                      background: isMe ? C.terracotta : C.card, color: isMe ? "#fff" : C.plum,
                      fontSize: 14, lineHeight: 1.6, border: isMe ? "none" : `1px solid ${C.line}`,
                      userSelect: "none" }}>
                    {quotedMsg && (
                      <div style={{ borderLeft: `3px solid ${isMe ? "rgba(255,255,255,.5)" : C.terracottaSoft}`,
                        paddingLeft: 8, marginBottom: 6, fontSize: 12,
                        color: isMe ? "rgba(255,255,255,.8)" : C.plumSoft,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180 }}>
                        {quotedMsg.body}
                      </div>
                    )}
                    {m.body}
                  </div>
                  {hasReactions && (
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
                      {Object.entries(msgRxCounts).filter(([, c]) => c > 0).map(([emoji, count]) => (
                        <button key={emoji} onClick={() => toggleReaction(m.id, emoji)}
                          style={{ padding: "2px 7px", borderRadius: 999, cursor: "pointer", fontSize: 12,
                            border: `1px solid ${msgMyRx.has(emoji) ? C.terracotta : C.line}`,
                            background: msgMyRx.has(emoji) ? C.peach : C.card,
                            color: msgMyRx.has(emoji) ? C.terracotta : C.plumSoft,
                            display: "flex", alignItems: "center", gap: 3 }}>
                          {emoji} <span>{count}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 2, marginTop: 3 }}>
                    <button onClick={() => setRxPickerFor((v) => v === m.id ? null : m.id)}
                      style={{ border: "none", background: "none", cursor: "pointer",
                        color: C.plumSoft, padding: "1px 4px", fontSize: 13, borderRadius: 6 }}>🙂</button>
                    <button onClick={() => { setReplyTo(m); inputRef.current?.focus(); }}
                      style={{ border: "none", background: "none", cursor: "pointer",
                        color: C.plumSoft, padding: "1px 4px", fontSize: 13, borderRadius: 6 }}>↩</button>
                  </div>
                  {rxPickerFor === m.id && (
                    <div style={{ display: "flex", gap: 3, padding: "5px 8px", borderRadius: 12,
                      background: C.card, border: `1px solid ${C.line}`,
                      boxShadow: "0 2px 8px rgba(74,47,61,.10)", marginTop: 4 }}>
                      {REACTION_EMOJIS.map((e) => (
                        <button key={e} onClick={() => toggleReaction(m.id, e)}
                          style={{ border: "none", cursor: "pointer", fontSize: 20, padding: 2, borderRadius: 6,
                            background: msgMyRx.has(e) ? C.peach : "transparent" }}>
                          {e}
                        </button>
                      ))}
                    </div>
                  )}
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
      {goneToast && (
        <div style={{ margin: "0 12px 4px", padding: "9px 12px", borderRadius: 10,
          background: "#FFF0EC", border: `1px solid ${C.terracottaSoft}`,
          fontSize: 12.5, color: C.terracotta, textAlign: "center" }}>
          {lang === "zh" ? "这条内容已不存在" : "This content no longer exists"}
        </div>
      )}
      {bannedAlert && (
        <div style={{ margin: "0 12px 4px", padding: "9px 12px", borderRadius: 10,
          background: "#FFF0EC", border: `1px solid ${C.terracottaSoft}`,
          display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: C.terracotta, flex: 1 }}>{t.bannedMsg}</span>
          <button onClick={() => setBannedAlert(false)}
            style={{ background: "none", border: "none", cursor: "pointer",
              color: C.plumSoft, padding: 2, flexShrink: 0 }}>
            <X size={13} />
          </button>
        </div>
      )}
      {replyTo && (
        <div style={{ margin: "0 12px 4px", padding: "8px 12px", borderRadius: 10,
          background: C.cardWarm, border: `1px solid ${C.line}`,
          display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: C.plumSoft, marginBottom: 1 }}>
              {lang === "zh" ? "引用回复" : "Replying to"}
            </div>
            <div style={{ fontSize: 12.5, color: C.plum, overflow: "hidden",
              whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{replyTo.body}</div>
          </div>
          <button onClick={() => setReplyTo(null)}
            style={{ background: "none", border: "none", cursor: "pointer",
              color: C.plumSoft, padding: 2 }}>
            <X size={13} />
          </button>
        </div>
      )}
      <div style={{ paddingTop: 12, paddingLeft: 12, paddingRight: 12,
        paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))",
        borderTop: `1px solid ${C.line}`, display: "flex", gap: 8, alignItems: "center" }}>
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
      {viewingProfile && (
        <>
          <ProfileCard profile={viewingProfile} lang={lang}
            onClose={() => { setViewingProfile(null); setShowReportModal(false); }}
            onBlock={() => blockUser(viewingProfile.id)}
            onReport={() => setShowReportModal(true)}
            onHug={() => toggleProfileHug(viewingProfile.id)}
            isHugged={profileHugsSent.has(viewingProfile.id)}
          />
          {showReportModal && (
            <ReportUserModal lang={lang} targetId={viewingProfile.id} reporterId={userId}
              onClose={() => { setShowReportModal(false); setViewingProfile(null); }} />
          )}
        </>
      )}
      {txSheet && (
        <TranslationSheet
          original={txSheet.text} translated={txSheet.translated}
          loading={txSheet.loading} lang={lang}
          onClose={() => setTxSheet(null)}
        />
      )}
    </div>
  );
}

// ── EditProfileModal ─────────────────────────────────────────
function EditProfileModal({ lang, profile, userId, onSave, onClose }) {
  const t = STR[lang];
  const [cat, setCat] = useState("people");
  const [avatar, setAvatar] = useState(profile.avatar || "👩");
  const [nickname, setNickname] = useState(profile.nickname || "");
  const [interests, setInterests] = useState(profile.interests || []);
  const [strengths, setStrengths] = useState(profile.strengths || []);
  const [saving, setSaving] = useState(false);

  const toggle = (arr, set, id) =>
    set(arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);

  const save = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").update({
        avatar, nickname: nickname.trim(), interests, strengths,
      }).eq("id", userId);
      if (error) throw error;
      onSave({ avatar, nickname: nickname.trim(), interests, strengths });
    } catch (err) {
      console.error("Profile update error:", err?.message, err?.code, err?.details, err?.hint, err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: "fixed", top: 0, bottom: 0, left: 0, right: 0, maxWidth: 480, margin: "0 auto", background: C.bg, zIndex: 200,
      display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", padding: "14px 16px",
        borderBottom: `1px solid ${C.line}`, flexShrink: 0 }}>
        <button onClick={onClose}
          style={{ background: "none", border: "none", cursor: "pointer", color: C.plumSoft, padding: 4 }}>
          <X size={20} />
        </button>
        <div style={{ flex: 1, textAlign: "center", fontFamily: "'Noto Serif SC',serif",
          fontSize: 16, color: C.plum, fontWeight: 700 }}>{t.editProfile}</div>
        <button onClick={save} disabled={saving}
          style={{ background: "none", border: "none", cursor: saving ? "default" : "pointer",
            color: saving ? C.plumSoft : C.terracotta, fontSize: 15, fontWeight: 500, padding: 4 }}>
          {saving ? t.saving : t.save}
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px 40px" }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ width: 72, height: 72, borderRadius: 999, margin: "0 auto",
            background: `linear-gradient(135deg, ${C.terracottaSoft}, ${C.peach})`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 38 }}>
            {avatar}
          </div>
        </div>

        <div style={{ display: "flex", gap: 7, overflowX: "auto", marginBottom: 12,
          paddingBottom: 4, WebkitOverflowScrolling: "touch" }}>
          {AVATAR_CATS.map((c) => (
            <button key={c.id} onClick={() => setCat(c.id)}
              style={{ padding: "6px 12px", borderRadius: 999, cursor: "pointer", fontSize: 12.5,
                flexShrink: 0, border: `1px solid ${cat === c.id ? C.terracotta : C.line}`,
                background: cat === c.id ? C.terracotta : C.card,
                color: cat === c.id ? "#fff" : C.plumSoft }}>{c[lang]}</button>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 24 }}>
          {AVATARS[cat].map((e) => (
            <button key={e} onClick={() => setAvatar(e)}
              style={{ aspectRatio: "1", borderRadius: 16, cursor: "pointer", fontSize: 34,
                border: `2px solid ${avatar === e ? C.terracotta : C.line}`,
                background: avatar === e ? C.peach : C.card,
                display: "flex", alignItems: "center", justifyContent: "center" }}>{e}</button>
          ))}
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, color: C.plumSoft, marginBottom: 8 }}>{t.nickLabel}</div>
          <input value={nickname} onChange={(e) => setNickname(e.target.value)} maxLength={16}
            placeholder={t.nickPlaceholder}
            style={{ width: "100%", boxSizing: "border-box", border: `1px solid ${C.line}`,
              borderRadius: 12, padding: "12px 14px", fontSize: 14, outline: "none",
              background: C.card, color: C.plum }} />
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, color: C.plumSoft, marginBottom: 10 }}>{t.stepInterests}</div>
          <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
            {INTERESTS.map((it) => (
              <Chip key={it.id} label={it[lang]} active={interests.includes(it.id)}
                onClick={() => toggle(interests, setInterests, it.id)} />
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 13, color: C.plumSoft, marginBottom: 10 }}>{t.stepStrengths}</div>
          <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
            {STRENGTHS.map((s) => (
              <Chip key={s.id} label={s[lang]} active={strengths.includes(s.id)}
                onClick={() => toggle(strengths, setStrengths, s.id)} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Me ──────────────────────────────────────────────────────
function Me({ lang, setLang, profile, userId, email, onProfileUpdate, notifCount, onNavigateToFeed, onNavigateToRoom, onNotifRead, onNavigateToPost, onNavigateToProfile }) {
  const t = STR[lang];
  const [pinExists, setPinExists] = useState(false);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showGuard, setShowGuard] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [showSignOut, setShowSignOut] = useState(false);
  const [totalHugs, setTotalHugs] = useState(null);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) console.error("Sign out error:", error.message, error);
    } catch (err) {
      console.error("Sign out exception:", err?.message, err);
    } finally {
      clearStoredPin();
      localStorage.removeItem(ACTIVE_TS_KEY);
      setShowSignOut(false);
    }
  };

  useEffect(() => { setPinExists(!!getStoredPin()); }, []);

  useEffect(() => {
    if (!userId) return;
    const loadHugs = async () => {
      try {
        const { data: myPosts } = await supabase
          .from("posts").select("id").eq("author_id", userId);
        const postIds = (myPosts || []).map((p) => p.id);
        let postHugCount = 0;
        if (postIds.length > 0) {
          const { count } = await supabase
            .from("hugs").select("post_id", { count: "exact", head: true })
            .in("post_id", postIds);
          postHugCount = count || 0;
        }
        const { count: profileHugCount } = await supabase
          .from("profile_hugs").select("from_id", { count: "exact", head: true })
          .eq("to_id", userId);
        setTotalHugs(postHugCount + (profileHugCount || 0));
      } catch (err) {
        console.error("Hug count error:", err?.message, err?.code, err?.details, err?.hint, err);
      }
    };
    loadHugs();
  }, [userId]);

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
    <div style={{ paddingBottom: "calc(90px + env(safe-area-inset-bottom, 0px))" }}>
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center",
        gap: 10, padding: "14px 16px 0" }}>
        <button onClick={() => setShowNotifs(true)}
          style={{ position: "relative", background: "none", border: "none",
            cursor: "pointer", color: C.plum, padding: 4, display: "flex" }}>
          <Bell size={20} />
          {notifCount > 0 && (
            <div style={{ position: "absolute", top: 0, right: 0, minWidth: 16, height: 16,
              borderRadius: 999, background: C.terracotta, color: "#fff",
              fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center",
              justifyContent: "center", padding: "0 3px", lineHeight: 1 }}>
              {notifCount > 99 ? "99+" : notifCount}
            </div>
          )}
        </button>
        <LangToggle lang={lang} setLang={setLang} />
      </div>
      <div style={{ padding: "12px 16px 20px", textAlign: "center" }}>
        <div style={{ width: 76, height: 76, borderRadius: 999, margin: "0 auto 12px",
          background: `linear-gradient(135deg, ${C.terracottaSoft}, ${C.peach})`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 38 }}>{profile.avatar}</div>
        <div style={{ fontFamily: "'Noto Serif SC',serif", fontSize: 19, color: C.plum,
          fontWeight: 700 }}>{profile.nickname || t.meName}</div>
        <div style={{ fontSize: 12, color: C.plumSoft, marginTop: 4 }}>{t.meSub}</div>
        {email && (
          <div style={{ fontSize: 11, color: C.plumSoft, marginTop: 4 }}>
            {t.accountLabel}{maskEmail(email)}
          </div>
        )}
        <button onClick={() => setShowEditProfile(true)}
          style={{ marginTop: 10, padding: "7px 18px", borderRadius: 999, border: `1px solid ${C.terracotta}`,
            background: "transparent", color: C.terracotta, fontSize: 13, cursor: "pointer" }}>
          {t.editProfile}
        </button>
      </div>
      <TagRow title={t.meInterests} items={myInterests} />
      <TagRow title={t.meStrengths} items={myStrengths} />
      <div style={{ margin: "0 16px 12px", borderRadius: 16, padding: 16,
        background: `linear-gradient(135deg, ${C.peach}, ${C.cardWarm})`,
        border: `1px solid ${C.terracottaSoft}`, display: "flex", alignItems: "center", gap: 14 }}>
        <Heart size={22} color={C.terracotta} fill={C.terracotta} />
        <div>
          <div style={{ fontSize: 14.5, color: C.plum, fontWeight: 500 }}>{t.meHugs}</div>
          <div style={{ fontSize: 12, color: C.plumSoft, marginTop: 2 }}>
            {totalHugs === null
              ? (lang === "zh" ? "载入中…" : "Loading…")
              : lang === "zh"
                ? `${totalHugs} 个温柔的瞬间`
                : `${totalHugs} gentle moment${totalHugs === 1 ? "" : "s"}`}
          </div>
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
      <SettingRow icon={Shield} label={t.meGuard} sub={t.meGuardSub}
        onClick={() => setShowGuard(true)} />
      <SettingRow icon={PhoneCall} label={t.crisisResources} sub={t.crisisResourcesSub}
        onClick={() => window.open("/support", "_blank", "noopener")} />
      <SettingRow icon={LogOut} label={t.signOut} sub={t.signOutSub} danger
        onClick={() => setShowSignOut(true)} />
      <SettingRow icon={Trash2} label={t.deleteAccount} sub={t.deleteAccountSub} danger
        onClick={() => setShowDeleteAccount(true)} />

      {/* Footer links */}
      <div style={{ display: "flex", justifyContent: "center", gap: 16,
        padding: "12px 16px 4px", flexWrap: "wrap" }}>
        {[
          { label: lang === "zh" ? "隐私政策" : "Privacy Policy", href: "/privacy" },
          { label: lang === "zh" ? "用户协议" : "Terms of Service", href: "/terms" },
          { label: lang === "zh" ? "帮助与支持" : "Support", href: "/support" },
        ].map(({ label, href }) => (
          <a key={href} href={href} target="_blank" rel="noopener"
            style={{ fontSize: 11.5, color: C.plumSoft, textDecoration: "underline" }}>
            {label}
          </a>
        ))}
      </div>
      <div style={{ textAlign: "center", fontSize: 11, color: C.line, paddingBottom: 8 }}>
        Galene v1.0
      </div>

      {showPinSetup && (
        <PinSetupModal lang={lang}
          onDone={(pin) => { setStoredPin(pin); setPinExists(true); setShowPinSetup(false); }}
          onClose={() => setShowPinSetup(false)} />
      )}
      {showEditProfile && (
        <EditProfileModal lang={lang} profile={profile} userId={userId}
          onSave={(updated) => { onProfileUpdate(updated); setShowEditProfile(false); }}
          onClose={() => setShowEditProfile(false)} />
      )}
      {showGuard && (
        <GuardSettings lang={lang} userId={userId} onClose={() => setShowGuard(false)} />
      )}
      {showDeleteAccount && (
        <DeleteAccountModal lang={lang} userId={userId}
          onClose={() => setShowDeleteAccount(false)}
          onDeleted={() => window.location.reload()} />
      )}
      {showSignOut && (
        <SignOutModal lang={lang}
          onClose={() => setShowSignOut(false)}
          onConfirm={handleSignOut} />
      )}
      {showNotifs && (
        <NotificationsPage lang={lang} userId={userId}
          onClose={() => setShowNotifs(false)}
          onNavigateToFeed={onNavigateToFeed}
          onNavigateToRoom={onNavigateToRoom}
          onNotifRead={onNotifRead}
          onNavigateToPost={onNavigateToPost}
          onNavigateToProfile={onNavigateToProfile}
        />
      )}
    </div>
  );
}

// ── Notifications ────────────────────────────────────────────
function NotificationsPage({ lang, userId, onClose, onNavigateToFeed, onNavigateToRoom, onNotifRead, onNavigateToPost, onNavigateToProfile }) {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [goneToast, setGoneToast] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from("notifications")
          .select("*, actor:actor_id(nickname, avatar)")
          .eq("recipient_id", userId)
          .order("created_at", { ascending: false })
          .limit(50);
        if (error) throw error;
        setNotifs(data || []);
      } catch (err) {
        console.error("Notifs load:", err?.message, err?.code, err?.details, err?.hint, err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  const markRead = async (notif) => {
    if (notif.read) return;
    try {
      const { error } = await supabase.from("notifications").update({ read: true }).eq("id", notif.id);
      if (error) throw error;
      setNotifs((prev) => prev.map((n) => n.id === notif.id ? { ...n, read: true } : n));
      onNotifRead();
    } catch (err) {
      console.error("Notif mark read:", err?.message);
    }
  };

  const handleClick = async (notif) => {
    await markRead(notif);
    if (notif.type === "post_hug" || notif.type === "comment" ||
        notif.type === "new_post_alert" || notif.type === "peer_nudge") {
      onClose();
      if (notif.ref_id) {
        onNavigateToPost(notif.ref_id, notif.type === "comment" || notif.type === "new_post_alert" || notif.type === "peer_nudge");
      } else {
        onNavigateToFeed();
      }
    } else if (notif.type === "profile_hug") {
      onClose();
      if (notif.actor_id) onNavigateToProfile(notif.actor_id);
    } else if (notif.type === "message_reply" && notif.ref_id) {
      try {
        const { data, error } = await supabase
          .from("messages")
          .select("room_slug, hidden")
          .eq("id", notif.ref_id)
          .single();
        if (error || !data || data.hidden) {
          setGoneToast(true);
          setTimeout(() => setGoneToast(false), 3000);
          return;
        }
        const room = ROOMS.find((r) => r.slug === data.room_slug);
        if (room) { onClose(); onNavigateToRoom(room, notif.ref_id); }
      } catch (err) {
        console.error("Notif nav:", err?.message);
      }
    }
  };

  const describe = (n) => {
    const actor = n.actor?.nickname || (lang === "zh" ? "有人" : "Someone");
    if (lang === "zh") {
      if (n.type === "post_hug")        return `${actor} 给你的帖子送了抱抱 🤗`;
      if (n.type === "profile_hug")     return `${actor} 给你送了抱抱 🤗`;
      if (n.type === "comment")         return `${actor} 评论了你的帖子`;
      if (n.type === "message_reply")   return `${actor} 在聊天室回复了你的消息`;
      if (n.type === "new_post_alert")  return "新帖子提醒：有用户发帖，Miss Galene 已自动回复 🌸 点击查看";
      if (n.type === "peer_nudge")      return "有人刚刚分享了心里话，你愿意给 ta 一点温暖吗？🌸";
    } else {
      if (n.type === "post_hug")        return `${actor} hugged your post 🤗`;
      if (n.type === "profile_hug")     return `${actor} sent you a hug 🤗`;
      if (n.type === "comment")         return `${actor} replied to your post`;
      if (n.type === "message_reply")   return `${actor} replied to your message in a room`;
      if (n.type === "new_post_alert")  return "New post alert: Miss Galene has auto-replied 🌸 Tap to view";
      if (n.type === "peer_nudge")      return "Someone just shared something. Feel like offering a kind word? 🌸";
    }
    return n.type;
  };

  return (
    <div style={{ position: "fixed", top: 0, bottom: 0, left: 0, right: 0, maxWidth: 480, margin: "0 auto", background: C.bg, zIndex: 200,
      display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", padding: "14px 16px",
        borderBottom: `1px solid ${C.line}`, flexShrink: 0 }}>
        <button onClick={onClose}
          style={{ background: "none", border: "none", cursor: "pointer", color: C.plumSoft, padding: 4 }}>
          <X size={20} />
        </button>
        <div style={{ flex: 1, textAlign: "center", fontFamily: "'Noto Serif SC',serif",
          fontSize: 16, color: C.plum, fontWeight: 700 }}>
          {lang === "zh" ? "通知" : "Notifications"}
        </div>
        <div style={{ width: 28 }} />
      </div>
      {goneToast && (
        <div style={{ margin: "10px 16px 0", padding: "10px 14px", borderRadius: 12,
          background: "#FFF0EC", border: `1px solid ${C.terracottaSoft}`,
          fontSize: 12.5, color: C.terracotta, textAlign: "center" }}>
          {lang === "zh" ? "这条内容已不存在" : "This content no longer exists"}
        </div>
      )}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {loading ? (
          <div style={{ textAlign: "center", color: C.plumSoft, fontSize: 13, padding: "40px 0" }}>
            {lang === "zh" ? "载入中…" : "Loading…"}
          </div>
        ) : notifs.length === 0 ? (
          <div style={{ textAlign: "center", color: C.plumSoft, fontSize: 14, padding: "48px 24px" }}>
            {lang === "zh" ? "暂无通知 🌿" : "No notifications yet 🌿"}
          </div>
        ) : notifs.map((n) => (
          <div key={n.id} onClick={() => handleClick(n)}
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
              borderBottom: `1px solid ${C.line}`, cursor: "pointer",
              background: n.read ? "transparent" : C.cardWarm }}>
            <div style={{ width: 38, height: 38, borderRadius: 999, flexShrink: 0,
              background: C.peach, display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 20 }}>
              {(n.type === "new_post_alert" || n.type === "peer_nudge") ? "🌸" : (n.actor?.avatar || "🌿")}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, color: C.plum, lineHeight: 1.5 }}>{describe(n)}</div>
              <div style={{ fontSize: 11, color: C.plumSoft, marginTop: 3 }}>
                {timeAgoStr(n.created_at, lang)}
              </div>
            </div>
            {!n.read && (
              <div style={{ width: 8, height: 8, borderRadius: 999,
                background: C.terracotta, flexShrink: 0 }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function HugSurpriseModal({ lang, hugs, onClose, onViewProfile }) {
  const [idx, setIdx] = useState(0);
  const [modalPhase, setModalPhase] = useState("in");
  const [slidePhase, setSlidePhase] = useState("in");
  const doneRef = useRef(false);

  const closeAll = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    setModalPhase("out");
    setTimeout(onClose, 480);
  }, [onClose]);

  const advance = useCallback(() => {
    if (idx < hugs.length - 1) {
      setSlidePhase("out");
      setTimeout(() => { setIdx((i) => i + 1); setSlidePhase("in"); }, 320);
    } else {
      closeAll();
    }
  }, [idx, hugs.length, closeAll]);

  const advanceRef = useRef(advance);
  advanceRef.current = advance;
  useEffect(() => {
    const t = setTimeout(() => advanceRef.current(), 2600);
    return () => clearTimeout(t);
  }, [idx]);

  const current = hugs[idx] || {};
  const actor = current.actor || {};
  const name = actor.nickname || (lang === "zh" ? "Ta" : "Someone");
  const tagline = lang === "zh"
    ? `${name} 悄悄抱了你一下`
    : `${name} sent you a quiet hug`;

  return (
    <>
      <style>{`
        @keyframes hugPop{0%{transform:scale(0.12);opacity:0}62%{transform:scale(1.16);opacity:1}82%{transform:scale(0.94)}100%{transform:scale(1)}}
        @keyframes hugFloat{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-8px) scale(1.05)}}
        @keyframes hugGlow{0%,100%{box-shadow:0 0 0 0 rgba(201,117,90,0)}50%{box-shadow:0 0 0 10px rgba(201,117,90,0.18),0 0 24px 4px rgba(245,217,200,0.55)}}
        @keyframes hugFadeIn{from{opacity:0}to{opacity:1}}
        @keyframes hugFadeOut{from{opacity:1}to{opacity:0}}
        @keyframes slideIn{from{opacity:0;transform:translateY(12px) scale(0.92)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes slideOut{from{opacity:1;transform:translateY(0) scale(1)}to{opacity:0;transform:translateY(-10px) scale(0.92)}}
      `}</style>
      <div onClick={closeAll}
        style={{ position: "fixed", top: 0, bottom: 0, left: 0, right: 0, maxWidth: 480, margin: "0 auto", zIndex: 500,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          background: `radial-gradient(ellipse at 50% 40%, ${C.peach} 0%, rgba(251,243,236,0.97) 65%)`,
          animation: modalPhase === "in" ? "hugFadeIn 0.42s ease forwards" : "hugFadeOut 0.48s ease forwards",
          cursor: "pointer", userSelect: "none" }}>

        {/* per-slide block, keyed so keyframes restart */}
        <div key={idx}
          style={{ display: "flex", flexDirection: "column", alignItems: "center",
            animation: slidePhase === "in" ? "slideIn 0.38s ease forwards" : "slideOut 0.32s ease forwards" }}>

          {/* hug emoji */}
          <div style={{ fontSize: 72, lineHeight: 1, marginBottom: 20,
            animation: "hugPop 0.62s cubic-bezier(.36,.07,.19,.97) both, hugFloat 2.3s ease-in-out 0.62s infinite" }}>
            🤗
          </div>

          {/* clickable actor avatar */}
          <div
            onClick={(e) => { e.stopPropagation(); onViewProfile(current.actor_id); }}
            title={lang === "zh" ? "点击查看 TA 的主页" : "View profile"}
            style={{ width: 72, height: 72, borderRadius: 999, cursor: "pointer",
              background: `linear-gradient(135deg, ${C.terracottaSoft}, ${C.peach})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 38, marginBottom: 10,
              border: `3px solid rgba(255,255,255,0.85)`,
              animation: "hugGlow 2.2s ease-in-out 0.5s infinite" }}>
            {actor.avatar || "🌿"}
          </div>

          {/* nickname */}
          <div style={{ fontFamily: "'Noto Serif SC',serif", fontSize: 15, fontWeight: 700,
            color: C.plum, marginBottom: 5 }}>
            {name}
          </div>

          {/* tagline */}
          <div style={{ fontSize: 13.5, color: C.plumSoft, textAlign: "center",
            padding: "0 44px", lineHeight: 1.65 }}>
            {tagline}
          </div>
        </div>

        {/* slide dot indicators */}
        {hugs.length > 1 && (
          <div style={{ display: "flex", gap: 6, marginTop: 26 }}>
            {hugs.map((_, i) => (
              <div key={i} style={{ height: 6, borderRadius: 999,
                width: i === idx ? 18 : 6,
                background: i === idx ? C.terracotta : C.terracottaSoft,
                transition: "all 0.3s ease" }} />
            ))}
          </div>
        )}

        <div style={{ marginTop: 14, fontSize: 11, color: C.plumSoft, opacity: 0.58 }}>
          {lang === "zh" ? "点头像查看 TA · 轻触其他位置关闭" : "Tap avatar to view · tap elsewhere to close"}
        </div>
      </div>
    </>
  );
}

function TabBar({ lang, tab, setTab, notifCount }) {
  const t = STR[lang];
  const tabs = [
    { id: "feed", label: t.tabFeed, icon: Home },
    { id: "rooms", label: t.tabRooms, icon: MessageCircle },
    { id: "me", label: t.tabMe, icon: Sparkles },
  ];
  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, maxWidth: 480, margin: "0 auto",
      display: "flex", zIndex: 100,
      background: C.card, borderTop: `1px solid ${C.line}`,
      paddingTop: 8, paddingLeft: 0, paddingRight: 0,
      paddingBottom: "calc(14px + env(safe-area-inset-bottom, 0px))" }}>
      {tabs.map((tb) => {
        const Icon = tb.icon, on = tab === tb.id;
        return (
          <button key={tb.id} onClick={() => setTab(tb.id)}
            style={{ flex: 1, border: "none", background: "none", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              color: on ? C.terracotta : C.plumSoft, position: "relative" }}>
            <div style={{ position: "relative", display: "inline-flex" }}>
              <Icon size={21} fill={on ? C.terracotta : "none"} />
              {tb.id === "me" && notifCount > 0 && (
                <div style={{ position: "absolute", top: -3, right: -5, width: 8, height: 8,
                  borderRadius: 999, background: C.terracotta,
                  border: `1.5px solid ${C.card}` }} />
              )}
            </div>
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

// ── Error boundary ──────────────────────────────────────────
// Without this, any uncaught render error anywhere in the tree unmounts the
// whole app to a blank screen with no way to recover or diagnose — this
// catches it, shows the actual error message on screen (so it can be
// screenshotted and reported), and offers a reload button.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error("App crashed:", error?.message, error?.stack, info?.componentStack);
  }
  render() {
    if (this.state.error) {
      const isZh = this.props.lang === "zh";
      return (
        <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", padding: 32, textAlign: "center", gap: 14,
          background: `radial-gradient(120% 60% at 50% 0%, ${C.peach} 0%, ${C.bg} 50%)` }}>
          <div style={{ fontSize: 44 }}>🌿</div>
          <div style={{ fontFamily: "'Noto Serif SC',serif", fontSize: 17, color: C.plum, fontWeight: 700 }}>
            {isZh ? "出了点小问题" : "Something went wrong"}
          </div>
          <button onClick={() => window.location.reload()}
            style={{ padding: "12px 28px", borderRadius: 14, border: "none",
              background: C.terracotta, color: "#fff", fontSize: 14.5, cursor: "pointer",
              fontFamily: "'Noto Serif SC',serif" }}>
            {isZh ? "重新加载" : "Reload"}
          </button>
          <div style={{ marginTop: 6, fontSize: 11.5, color: C.plumSoft, maxWidth: 320,
            wordBreak: "break-word", lineHeight: 1.6 }}>
            {String(this.state.error?.message || this.state.error)}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

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
  const [session, setSession] = useState(null);
  const [authView, setAuthView] = useState("welcome"); // 'welcome' | 'signup' | 'login'
  const [showCrisisModal, setShowCrisisModal] = useState(false);
  const [showAbuseModal, setShowAbuseModal] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [hugNotifs, setHugNotifs] = useState(null);
  const [hugViewProfile, setHugViewProfile] = useState(null);
  const [hugProfileHugged, setHugProfileHugged] = useState(false);
  const [feedHighlightPostId, setFeedHighlightPostId] = useState(null);
  const [feedOpenCommentsFor, setFeedOpenCommentsFor] = useState(null);
  const [chatHighlightMsgId, setChatHighlightMsgId] = useState(null);
  const [showPushPrompt, setShowPushPrompt] = useState(false);
  const [installEvent, setInstallEvent] = useState(null);
  const [installPlatform, setInstallPlatform] = useState(null); // 'android' | 'ios' | null
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

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
    if (!profile || locked || !userId || room) return;
    if (showInstallPrompt) return; // don't stack the two banners
    if (!isPushSupported()) return;
    if (typeof Notification === "undefined" || Notification.permission !== "default") return;
    if (localStorage.getItem(PUSH_PROMPTED_KEY)) return;
    setShowPushPrompt(true);
  }, [profile, locked, userId, room, showInstallPrompt]);

  // Capture the browser's native "Add to Home Screen" prompt as early as
  // possible — beforeinstallprompt only fires once per page load, so we
  // can't wait for onboarding to finish before registering the listener.
  // iOS Safari has no equivalent API — there's no way to trigger the native
  // prompt programmatically, so we just detect the platform and later show
  // manual instructions instead.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches
      || window.navigator.standalone === true;
    if (isStandalone) return;

    const ua = navigator.userAgent;
    const isIOS = /iPhone|iPad|iPod/i.test(ua) && !window.MSStream;
    const isAndroid = /Android/i.test(ua);

    if (isIOS) { setInstallPlatform("ios"); return; }
    if (!isAndroid) return; // mobile only, per product request

    const handler = (e) => {
      e.preventDefault();
      setInstallEvent(e);
      setInstallPlatform("android");
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // Show the install banner once the user has reached the main app (mirrors
  // the push-notification prompt's gating), and only if not dismissed before.
  useEffect(() => {
    if (!profile || locked || !userId || room) return;
    if (!installPlatform) return;
    if (installPlatform === "android" && !installEvent) return;
    if (localStorage.getItem(INSTALL_PROMPTED_KEY)) return;
    setShowInstallPrompt(true);
    setShowPushPrompt(false); // authoritative: don't let both banners show at once
  }, [profile, locked, userId, room, installPlatform, installEvent]);

  const handleInstallClick = async () => {
    localStorage.setItem(INSTALL_PROMPTED_KEY, "1");
    setShowInstallPrompt(false);
    if (installPlatform === "android" && installEvent) {
      try {
        installEvent.prompt();
        await installEvent.userChoice;
      } catch (err) {
        console.error("Install prompt error:", err?.message);
      }
      setInstallEvent(null);
    }
  };

  const handleDismissInstall = () => {
    localStorage.setItem(INSTALL_PROMPTED_KEY, "1");
    setShowInstallPrompt(false);
  };

  const handleEnablePush = async () => {
    localStorage.setItem(PUSH_PROMPTED_KEY, "1");
    setShowPushPrompt(false);
    try {
      const perm = await Notification.requestPermission();
      if (perm === "granted") await subscribeToPush(userId);
    } catch (err) {
      console.error("Push subscribe error:", err?.message);
    }
  };

  const handleDismissPush = () => {
    localStorage.setItem(PUSH_PROMPTED_KEY, "1");
    setShowPushPrompt(false);
  };

  useEffect(() => {
    const storedLang = localStorage.getItem(LANG_KEY);
    if (storedLang) setLangState(storedLang);
    const pin = localStorage.getItem(PIN_KEY);
    const lastActive = localStorage.getItem(ACTIVE_TS_KEY);
    const elapsed = lastActive ? Date.now() - parseInt(lastActive, 10) : Infinity;
    setLocked(!!pin && elapsed > GRACE_MS);

    const bootstrapProfile = async (uid) => {
      try {
        const { data: profileData, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", uid)
          .single();

        if (error) {
          if (error.code === "PGRST116") {
            // "No rows" — genuinely a brand-new user with no profile yet.
            setProfile(null);
          } else {
            // Transient error (network blip, or a JWT-propagation race right
            // after a token refresh — Supabase can re-fire SIGNED_IN just from
            // the app regaining focus/foreground, which happens far more
            // often for an installed PWA than a regular browser tab). Don't
            // wipe out a profile that's already loaded and correct.
            console.error("Fetch profile error:", error.message, error.code, error.details, error.hint);
          }
          return;
        }

        setProfile(profileData ? {
          avatar: profileData.avatar,
          nickname: profileData.nickname || "",
          interests: profileData.interests || [],
          strengths: profileData.strengths || [],
          banned: profileData.banned || false,
        } : null);
      } catch (err) {
        console.error("Fetch profile exception:", err?.message, err);
      }
    };

    const init = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        if (currentSession?.user) {
          setUserId(currentSession.user.id);
          registerPushNotifications(currentSession.user.id);
          await bootstrapProfile(currentSession.user.id);
        }
      } catch (err) {
        console.error("Init error:", err);
      } finally {
        setAuthLoading(false);
      }
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (newSession?.user) {
        setSession(newSession);
        setUserId(newSession.user.id);
        if (event === "SIGNED_IN") {
          registerPushNotifications(newSession.user.id);
          bootstrapProfile(newSession.user.id);
        }
        return;
      }
      // Only a real, explicit sign-out should boot the user back to the
      // welcome screen. Other events can fire with a momentarily-null
      // session (e.g. a failed background token-refresh attempt — standalone
      // PWAs get backgrounded/foregrounded far more aggressively than a
      // regular browser tab, especially on iOS) and shouldn't wipe an
      // active session out from under the user mid-interaction.
      if (event === "SIGNED_OUT") {
        setSession(null);
        setUserId(null);
        setProfile(null);
        setAuthView("welcome");
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) return;
    const fetchCount = async () => {
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("recipient_id", userId)
        .eq("read", false);
      setNotifCount(count ?? 0);
    };
    fetchCount();

    const fetchHugs = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("id, actor_id, actor:actor_id(nickname, avatar)")
        .eq("recipient_id", userId)
        .eq("type", "profile_hug")
        .eq("read", false)
        .order("created_at", { ascending: true });
      if (data && data.length > 0) setHugNotifs(data);
    };
    fetchHugs();

    const ch = supabase
      .channel(`notifs:${userId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `recipient_id=eq.${userId}`,
      }, () => setNotifCount((n) => n + 1))
      .subscribe();

    return () => supabase.removeChannel(ch);
  }, [userId]);

  const dismissHugModal = useCallback(async () => {
    if (!hugNotifs?.length) return;
    const ids = hugNotifs.map((n) => n.id);
    setHugNotifs(null);
    setNotifCount((prev) => Math.max(0, prev - ids.length));
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .in("id", ids);
      if (error) console.error("Mark hugs read error:", error.message, error.code, error.details, error.hint);
    } catch (err) {
      console.error("Mark hugs read exception:", err?.message, err);
    }
  }, [hugNotifs]);

  const handleViewHugProfile = useCallback(async (actorId) => {
    dismissHugModal();
    try {
      const { data } = await supabase
        .from("profiles")
        .select("id, avatar, nickname, interests, strengths")
        .eq("id", actorId)
        .single();
      if (data) { setHugViewProfile(data); setHugProfileHugged(false); }
    } catch (err) { console.error("Fetch hug profile error:", err?.message); }
  }, [dismissHugModal]);

  const navigateToActorProfile = useCallback(async (actorId) => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("id, avatar, nickname, interests, strengths")
        .eq("id", actorId)
        .single();
      if (data) { setHugViewProfile(data); setHugProfileHugged(false); }
    } catch (err) { console.error("Navigate to profile error:", err?.message); }
  }, []);

  const handleOnboardingDone = async (data) => {
    if (!userId) {
      // Auth not ready (e.g. anonymous sign-in failed) — proceed locally so buttons aren't dead
      console.warn("handleOnboardingDone: userId is null, skipping DB write");
      setProfile(data);
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").upsert({
        id: userId,
        avatar: data.avatar,
        nickname: data.nickname,
        interests: data.interests,
        strengths: data.strengths,
      });
      if (error) throw error;
    } catch (err) {
      console.error("Profile save error:", err?.message, err?.code, err?.details, err?.hint, err);
    } finally {
      setSaving(false);
      setProfile(data); // always exit onboarding even if DB write failed
    }
  };

  const shell = (children) => (
    <div className="galene-outer"
      style={{ display: "flex", justifyContent: "center", alignItems: "flex-start",
        minHeight: "100dvh", background: C.bg,
        fontFamily: "'Noto Sans SC',-apple-system,sans-serif" }}>
      <div className="galene-shell"
        style={{ width: "100%", maxWidth: 480, minHeight: "100dvh", overflow: "hidden",
          position: "relative", background: C.bg,
          boxShadow: "0 0 40px rgba(74,47,61,.10)" }}>
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
    <ErrorBoundary lang={lang}>
    <>
      {!session ? (
        authView === "signup" ? (
          <SignUpForm lang={lang} setLang={setLang} onSwitchToLogin={() => setAuthView("login")} />
        ) : authView === "login" ? (
          <LoginForm lang={lang} setLang={setLang} onSwitchToSignUp={() => setAuthView("signup")} />
        ) : (
          <AuthWelcome lang={lang} setLang={setLang}
            onSignUp={() => setAuthView("signup")}
            onLogin={() => setAuthView("login")} />
        )
      ) : locked ? (
        <LockScreen lang={lang} setLang={setLang} onUnlock={() => setLocked(false)} />
      ) : !profile ? (
        <Onboarding lang={lang} setLang={setLang} onDone={handleOnboardingDone} saving={saving} />
      ) : room ? (
        <ChatRoom lang={lang} room={room} profile={profile} userId={userId}
          onBack={() => { setRoom(null); setChatHighlightMsgId(null); }}
          onCrisisDetected={() => setShowCrisisModal(true)}
          onAbuseDetected={() => setShowAbuseModal(true)}
          highlightMsgId={chatHighlightMsgId} />
      ) : (
        <>
          <div style={{ height: "100%", overflowY: "auto" }}>
            {tab === "feed" && <Feed lang={lang} userId={userId} profile={profile}
              onCrisisDetected={() => setShowCrisisModal(true)}
              onAbuseDetected={() => setShowAbuseModal(true)}
              highlightPostId={feedHighlightPostId}
              openCommentsFor={feedOpenCommentsFor}
              onHighlightDone={() => { setFeedHighlightPostId(null); setFeedOpenCommentsFor(null); }} />}
            {tab === "rooms" && <Rooms lang={lang} onEnter={setRoom} />}
            {tab === "me" && <Me lang={lang} setLang={setLang} profile={profile} userId={userId}
              email={session?.user?.email}
              onProfileUpdate={(p) => setProfile(p)}
              notifCount={notifCount}
              onNotifRead={() => setNotifCount((n) => Math.max(0, n - 1))}
              onNavigateToFeed={() => setTab("feed")}
              onNavigateToRoom={(r, msgId) => { setRoom(r); setChatHighlightMsgId(msgId || null); }}
              onNavigateToPost={(postId, openComments) => {
                setFeedHighlightPostId(postId);
                setFeedOpenCommentsFor(openComments ? postId : null);
                setTab("feed");
              }}
              onNavigateToProfile={navigateToActorProfile} />}
          </div>
          <TabBar lang={lang} tab={tab} setTab={setTab} notifCount={notifCount} />
          {showInstallPrompt && (
            <InstallPrompt lang={lang} platform={installPlatform}
              onInstall={handleInstallClick} onDismiss={handleDismissInstall} />
          )}
          {showPushPrompt && (
            <PushPrompt lang={lang} onEnable={handleEnablePush} onDismiss={handleDismissPush} />
          )}
        </>
      )}
      {hugNotifs?.length > 0 && profile && !locked && (
        <HugSurpriseModal lang={lang} hugs={hugNotifs} onClose={dismissHugModal} onViewProfile={handleViewHugProfile} />
      )}
      {hugViewProfile && (
        <ProfileCard
          profile={hugViewProfile} lang={lang}
          onClose={() => { setHugViewProfile(null); setHugProfileHugged(false); }}
          onHug={() => {
            insertNotif({ recipientId: hugViewProfile.id, type: "profile_hug", actorId: userId });
            setHugProfileHugged(true);
          }}
          isHugged={hugProfileHugged}
        />
      )}
      {showAbuseModal && (
        <AbuseModal lang={lang} onClose={() => setShowAbuseModal(false)} />
      )}
      {showCrisisModal && (
        <CrisisModal lang={lang} onClose={() => setShowCrisisModal(false)} />
      )}
    </>
    </ErrorBoundary>
  );
}
