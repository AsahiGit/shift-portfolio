export type WageRuleInput = {
  label: string;
  startTime: string;
  endTime: string;
  rate: number; // multiplier, e.g. 1.1 = +10%
};

export type WageInput = {
  startTime: string; // "09:00"
  endTime: string; // "17:00" (endTime <= startTime is treated as an overnight shift)
  breakMinutes: number;
  hourlyWage: number;
  nightRate: number; // multiplier applied to the 22:00-5:00 portion
  overtimeRate: number; // multiplier applied to minutes beyond 8h/day
  wageRules?: WageRuleInput[]; // custom time-band premiums (e.g. weekend/evening bonus)
};

export type WageRuleBreakdown = {
  label: string;
  minutes: number;
  premium: number;
};

export type WageBreakdown = {
  workedMinutes: number;
  nightMinutes: number;
  overtimeMinutes: number;
  basePay: number;
  nightPremium: number;
  overtimePremium: number;
  ruleBreakdown: WageRuleBreakdown[];
  totalPay: number;
};

const OVERTIME_THRESHOLD_MINUTES = 8 * 60;
const NIGHT_START_MINUTE = 22 * 60; // 22:00
const NIGHT_END_MINUTE = 5 * 60; // 5:00 next day
const MINUTES_PER_DAY = 24 * 60;

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function inBand(clock: number, bandStartMin: number, bandEndMin: number): boolean {
  if (bandStartMin === bandEndMin) return false;
  if (bandStartMin < bandEndMin) return clock >= bandStartMin && clock < bandEndMin;
  return clock >= bandStartMin || clock < bandEndMin; // band wraps past midnight
}

// Counts minutes of a [startMin, startMin + spanMin) interval that fall
// within [bandStartMin, bandEndMin), wrapping past midnight if needed.
function countBandMinutes(startMin: number, spanMin: number, bandStartMin: number, bandEndMin: number): number {
  let count = 0;
  for (let offset = 0; offset < spanMin; offset++) {
    const clock = (startMin + offset) % MINUTES_PER_DAY;
    if (inBand(clock, bandStartMin, bandEndMin)) count++;
  }
  return count;
}

// Night/overtime/custom time-band premiums are applied additively on top of
// the base hourly wage (rather than compounding), matching how most
// shift-work payroll tools display an estimated breakdown.
export function calculateShiftWage(input: WageInput): WageBreakdown {
  const startMin = timeToMinutes(input.startTime);
  let endMin = timeToMinutes(input.endTime);
  let span = endMin - startMin;
  if (span <= 0) span += MINUTES_PER_DAY; // overnight shift wraps to the next day

  const workedMinutes = Math.max(span - input.breakMinutes, 0);
  const nightMinutes = Math.min(
    countBandMinutes(startMin, span, NIGHT_START_MINUTE, NIGHT_END_MINUTE),
    workedMinutes
  );
  const overtimeMinutes = Math.max(workedMinutes - OVERTIME_THRESHOLD_MINUTES, 0);

  const basePay = (input.hourlyWage * workedMinutes) / 60;
  const nightPremium = (input.hourlyWage * (input.nightRate - 1) * nightMinutes) / 60;
  const overtimePremium =
    (input.hourlyWage * (input.overtimeRate - 1) * overtimeMinutes) / 60;

  const ruleBreakdown: WageRuleBreakdown[] = (input.wageRules ?? []).map((rule) => {
    const ruleStartMin = timeToMinutes(rule.startTime);
    const ruleEndMin = timeToMinutes(rule.endTime);
    const minutes = Math.min(
      countBandMinutes(startMin, span, ruleStartMin, ruleEndMin),
      workedMinutes
    );
    const premium = (input.hourlyWage * (rule.rate - 1) * minutes) / 60;
    return { label: rule.label, minutes, premium: Math.round(premium) };
  });

  const rulePremiumTotal = ruleBreakdown.reduce((sum, r) => sum + r.premium, 0);

  return {
    workedMinutes,
    nightMinutes,
    overtimeMinutes,
    basePay: Math.round(basePay),
    nightPremium: Math.round(nightPremium),
    overtimePremium: Math.round(overtimePremium),
    ruleBreakdown,
    totalPay: Math.round(basePay + nightPremium + overtimePremium) + rulePremiumTotal,
  };
}
