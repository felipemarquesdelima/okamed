export interface DateRange {
  from?: Date;
  to?: Date;
}

export const monthInRange = (year: number, month: number, range?: DateRange) => {
  if (!range?.from || !range?.to) return true;
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  return end >= range.from && start <= range.to;
};

export const isRangeActive = (range?: DateRange) => !!(range?.from && range?.to);

export const yearsInRange = (range: DateRange): number[] => {
  if (!range.from || !range.to) return [];
  const ys: number[] = [];
  for (let y = range.from.getFullYear(); y <= range.to.getFullYear(); y++) ys.push(y);
  return ys;
};
