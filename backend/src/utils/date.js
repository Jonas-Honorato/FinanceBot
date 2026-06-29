export function getMonthBounds(month = new Date().getMonth() + 1, year = new Date().getFullYear()) {
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const end = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
  return { start, end, month, year };
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
