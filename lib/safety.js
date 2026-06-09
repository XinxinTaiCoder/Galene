// ── Crisis detection ─────────────────────────────────────────
const ZH_KEYWORDS = [
  "不想活", "活不下去", "结束这一切", "自杀", "伤害自己",
  "不想撑了", "撑不下去", "不想存在", "想死", "去死", "了结自己", "轻生",
];

const EN_CRISIS =
  /\b(kill\s+myself|end\s+it\s+all|don'?t\s+want\s+to\s+live|suicide|self[\s-]harm|want\s+to\s+die|hurt\s+myself|end\s+my\s+life|take\s+my\s+(?:own\s+)?life|no\s+reason\s+to\s+live)\b/i;

export function detectCrisis(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  if (ZH_KEYWORDS.some((kw) => lower.includes(kw))) return true;
  return EN_CRISIS.test(lower);
}

// ── Abuse detection ──────────────────────────────────────────
// Edit these lists to add / remove words as needed.
export const ABUSE_ZH = [
  "傻逼", "操你妈", "你妈的", "贱人", "妓女", "婊子",
  "废物滚", "脑残", "智障", "狗娘养", "王八蛋", "死变态",
  "你去死", "滚去死",
];

export const ABUSE_EN = [
  /\bf+u+c+k\s+(you|off)\b/i,
  /\b(bitch|cunt|whore|slut|bastard|asshole|dickhead|motherfucker)\b/i,
  /\bpiece\s+of\s+(shit|crap)\b/i,
  /\bkill\s+yourself\b/i,
  /\bkys\b/i,
  /\bgo\s+die\b/i,
  /\byou\s+(are\s+|'?re\s+)?(worthless|subhuman|pathetic\s+loser|disgusting\s+pig)\b/i,
];

export function filterAbuse(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  if (ABUSE_ZH.some((kw) => lower.includes(kw))) return true;
  return ABUSE_EN.some((pattern) => pattern.test(lower));
}
