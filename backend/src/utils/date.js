export function getMonthBounds(month = new Date().getMonth() + 1, year = new Date().getFullYear()) {
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const end = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
  const lastDay = new Date(nextYear, nextMonth - 1, 0).getDate();
  const displayEnd = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { start, end, displayEnd, month, year, daysInMonth: lastDay };
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function formatDateBR(date) {
  const [year, month, day] = String(date).slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
}
