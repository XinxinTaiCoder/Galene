const ZH_KEYWORDS = [
  "不想活", "活不下去", "结束这一切", "自杀", "伤害自己",
  "不想撑了", "撑不下去", "不想存在", "想死", "去死", "了结自己", "轻生",
];

// \b works on ASCII; for multi-word EN phrases we allow flexible spacing/punctuation
const EN_PATTERN =
  /\b(kill\s+myself|end\s+it\s+all|don'?t\s+want\s+to\s+live|suicide|self[\s-]harm|want\s+to\s+die|hurt\s+myself|end\s+my\s+life|take\s+my\s+(?:own\s+)?life|no\s+reason\s+to\s+live)\b/i;

export function detectCrisis(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  if (ZH_KEYWORDS.some((kw) => lower.includes(kw))) return true;
  return EN_PATTERN.test(lower);
}
