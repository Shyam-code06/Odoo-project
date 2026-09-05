/**
 * Utility functions for Working Schedule time calculations and validation.
 */

export const parseTimeToMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const parts = timeStr.split(':');
  if (parts.length < 2) return 0;
  const hours = parseInt(parts[0], 10) || 0;
  const mins = parseInt(parts[1], 10) || 0;
  return hours * 60 + mins;
};

export const formatMinutesToHours = (totalMinutes) => {
  if (!totalMinutes || totalMinutes <= 0) return '0h 00m';
  const hrs = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (mins === 0) return `${hrs}h 00m`;
  return `${hrs}h ${String(mins).padStart(2, '0')}m`;
};

export const formatMinutesShort = (totalMinutes) => {
  if (!totalMinutes || totalMinutes <= 0) return '0h';
  const hrs = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (mins === 0) return `${hrs}h`;
  if (hrs === 0) return `${mins}m`;
  return `${hrs}h ${mins}m`;
};

export const calculateDailyMinutes = (startTime, endTime, breakMinutes = 0, isWorkingDay = true) => {
  if (!isWorkingDay || !startTime || !endTime) return 0;

  const startMins = parseTimeToMinutes(startTime);
  const endMins = parseTimeToMinutes(endTime);

  if (endMins <= startMins) return 0; // Cross-midnight or invalid

  const totalShiftMins = endMins - startMins;
  const actualWorkMins = totalShiftMins - (parseInt(breakMinutes, 10) || 0);

  return Math.max(0, actualWorkMins);
};

export const validateDaySchedule = (startTime, endTime, breakMinutes = 0, isWorkingDay = true) => {
  if (!isWorkingDay) return null;

  if (!startTime || !endTime) {
    return 'Start time and End time are required for working days.';
  }

  const startMins = parseTimeToMinutes(startTime);
  const endMins = parseTimeToMinutes(endTime);

  if (endMins <= startMins) {
    return 'Schedules cannot cross midnight. End time must be later than start time.';
  }

  const shiftDuration = endMins - startMins;
  const bMins = parseInt(breakMinutes, 10) || 0;

  if (bMins < 0) {
    return 'Break duration cannot be negative.';
  }

  if (bMins >= shiftDuration) {
    return 'Break duration cannot equal or exceed total shift duration.';
  }

  return null;
};

export const calculateWeeklySummary = (days = []) => {
  let totalWeeklyMinutes = 0;
  let workingDaysCount = 0;

  days.forEach((day) => {
    if (day.isWorkingDay) {
      const dailyMins = calculateDailyMinutes(
        day.startTime,
        day.endTime,
        day.breakMinutes,
        day.isWorkingDay
      );
      if (dailyMins > 0) {
        totalWeeklyMinutes += dailyMins;
        workingDaysCount += 1;
      }
    }
  });

  const averageDailyMinutes = workingDaysCount > 0 ? Math.round(totalWeeklyMinutes / workingDaysCount) : 0;

  return {
    totalWeeklyMinutes,
    totalWeeklyFormatted: formatMinutesToHours(totalWeeklyMinutes),
    totalWeeklyShort: formatMinutesShort(totalWeeklyMinutes),
    workingDaysCount,
    averageDailyMinutes,
    averageDailyFormatted: formatMinutesShort(averageDailyMinutes),
  };
};

export const DEFAULT_WEEKDAYS = [
  { dayOfWeek: 'Monday', isWorkingDay: true, startTime: '09:30', endTime: '18:30', breakMinutes: 60 },
  { dayOfWeek: 'Tuesday', isWorkingDay: true, startTime: '09:30', endTime: '18:30', breakMinutes: 60 },
  { dayOfWeek: 'Wednesday', isWorkingDay: true, startTime: '09:30', endTime: '18:30', breakMinutes: 60 },
  { dayOfWeek: 'Thursday', isWorkingDay: true, startTime: '09:30', endTime: '18:30', breakMinutes: 60 },
  { dayOfWeek: 'Friday', isWorkingDay: true, startTime: '09:30', endTime: '18:30', breakMinutes: 60 },
  { dayOfWeek: 'Saturday', isWorkingDay: false, startTime: '09:30', endTime: '18:30', breakMinutes: 60 },
  { dayOfWeek: 'Sunday', isWorkingDay: false, startTime: '09:30', endTime: '18:30', breakMinutes: 60 },
];
