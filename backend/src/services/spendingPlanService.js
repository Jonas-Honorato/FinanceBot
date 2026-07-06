import { query } from '../db/pool.js';
import { getMonthBounds, todayISO } from '../utils/date.js';

function daysBetweenInclusive(startISO, endISO) {
  const start = new Date(`${startISO}T00:00:00.000Z`);
  const end = new Date(`${endISO}T00:00:00.000Z`);
  return Math.max(1, Math.floor((end - start) / 86400000) + 1);
}

export async function buildSpendingPlan(userId, month, year) {
  const bounds = getMonthBounds(month, year);
  const today = todayISO();
  const currentDay = today >= bounds.start && today <= bounds.displayEnd ? today : bounds.start;
  const daysRemaining = daysBetweenInclusive(currentDay, bounds.displayEnd);
  const weeksRemaining = Math.max(1, Math.ceil(daysRemaining / 7));

  const [{ rows: totals }, { rows: goals }] = await Promise.all([
    query(
      `SELECT COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0)::float income_total,
              COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0)::float expense_total
       FROM transactions
       WHERE user_id = $1 AND date >= $2 AND date < $3`,
      [userId, bounds.start, bounds.end]
    ),
    query(
      `SELECT COALESCE(SUM(monthly_required_amount), 0)::float monthly_goal_total,
              COUNT(*)::int active_goal_count
       FROM goals
       WHERE user_id = $1 AND status = 'active'`,
      [userId]
    )
  ]);

  const incomeTotal = Number(totals[0].income_total);
  const expenseTotal = Number(totals[0].expense_total);
  const monthlyGoalTotal = Number(goals[0].monthly_goal_total);
  const availableThisMonth = incomeTotal - expenseTotal - monthlyGoalTotal;
  const safeAvailableThisMonth = Math.max(0, availableThisMonth);

  return {
    month: bounds.month,
    year: bounds.year,
    incomeTotal,
    expenseTotal,
    monthlyGoalTotal,
    activeGoalCount: Number(goals[0].active_goal_count),
    availableThisMonth,
    safeAvailableThisMonth,
    dailyLimit: Number((safeAvailableThisMonth / daysRemaining).toFixed(2)),
    weeklyLimit: Number((safeAvailableThisMonth / weeksRemaining).toFixed(2)),
    daysRemaining,
    weeksRemaining
  };
}
