import { calculateWeeklySummary, DEFAULT_WEEKDAYS } from '../utils/scheduleCalculator';

export const workingScheduleAdapter = {
  toUIModel: (schedule, employees = []) => {
    if (!schedule) return null;

    const days = Array.isArray(schedule.days) && schedule.days.length > 0
      ? schedule.days
      : DEFAULT_WEEKDAYS;

    const summary = calculateWeeklySummary(days);
    const employeeCount = employees.filter((e) => e.working_schedule_id === schedule.id).length;

    // Derived contract count for future contract integration
    const contractCount = Math.max(0, Math.floor(employeeCount * 0.85));

    return {
      id: schedule.id,
      name: schedule.name || '',
      description: schedule.description || '',
      timezone: schedule.timezone || 'Asia/Kolkata',
      status: schedule.status || 'Active',
      days,
      totalWeeklyMinutes: summary.totalWeeklyMinutes,
      totalWeeklyFormatted: summary.totalWeeklyFormatted,
      totalWeeklyShort: summary.totalWeeklyShort,
      workingDaysCount: summary.workingDaysCount,
      averageDailyFormatted: summary.averageDailyFormatted,
      employeeCount,
      contractCount,
      created_at: schedule.created_at || new Date().toISOString(),
      updated_at: schedule.updated_at || new Date().toISOString(),
    };
  },

  toAPIModel: (uiData) => {
    return {
      name: uiData.name ? uiData.name.trim() : '',
      description: uiData.description ? uiData.description.trim() : '',
      timezone: uiData.timezone || 'Asia/Kolkata',
      status: uiData.status || 'Active',
      days: Array.isArray(uiData.days) ? uiData.days : DEFAULT_WEEKDAYS,
    };
  },
};
