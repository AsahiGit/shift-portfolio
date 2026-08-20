export type WageInput = {
  startTime: string; // "09:00"
  endTime: string; // "17:00" (endTime <= startTime is treated as an overnight shift)
  breakMinutes: number;
  hourlyWage: number;
  nightRate: number; // multiplier applied to the 22:00-5:00 portion
  overtimeRate: number; // multiplier applied to minutes beyond 8h/day
};

export type WageBreakdown = {
  workedMinutes: number;
  nightMinutes: number;
  overtimeMinutes: number;
  basePay: number;
  nightPremium: number;
  overtimePremium: number;
  totalPay: number;
};

const OVERTIME_THRESHOLD_MINUTES = 8 * 60;
const NIGHT_START_MINUTE = 22 * 60; // 22:00
const NIGHT_END_MINUTE = 5 * 60; // 5:00 next day

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

// Counts minutes of a [startMin, startMin + spanMin) interval that fall
// within the late-night band (22:00-5:00), wrapping past midnight.
function countNightMinutes(startMin: number, spanMin: number): number {
  let count = 0;
  for (let offset = 0; offset < spanMin; offset++) {
    const clock = (startMin + offset) % (24 * 60);
    if (clock >= NIGHT_START_MINUTE || clock < NIGHT_END_MINUTE) count++;
  }
  return count;
}

// Night and overtime premiums are applied additively on top of the base
// hourly wage (rather than compounding), matching how most shift-work
// payroll tools display an estimated breakdown.
export function calculateShiftWage(input: WageInput): WageBreakdown {
  const startMin = timeToMinutes(input.startTime);
  let endMin = timeToMinutes(input.endTime);
  let span = endMin - startMin;
  if (span <= 0) span += 24 * 60; // overnight shift wraps to the next day

  const workedMinutes = Math.max(span - input.breakMinutes, 0);
  const nightMinutes = Math.min(countNightMinutes(startMin, span), workedMinutes);
  const overtimeMinutes = Math.max(workedMinutes - OVERTIME_THRESHOLD_MINUTES, 0);

  const basePay = (input.hourlyWage * workedMinutes) / 60;
  const nightPremium = (input.hourlyWage * (input.nightRate - 1) * nightMinutes) / 60;
  const overtimePremium =
    (input.hourlyWage * (input.overtimeRate - 1) * overtimeMinutes) / 60;

  return {
    workedMinutes,
    nightMinutes,
    overtimeMinutes,
    basePay: Math.round(basePay),
    nightPremium: Math.round(nightPremium),
    overtimePremium: Math.round(overtimePremium),
    totalPay: Math.round(basePay + nightPremium + overtimePremium),
  };
}
