/**
 * Utility functions for Attendance worked-hours calculation, status derivation, and exception detection.
 */

export const calculateWorkedMinutes = (checkInISO, checkOutISO) => {
  if (!checkInISO || !checkOutISO) return 0;
  const start = new Date(checkInISO).getTime();
  const end = new Date(checkOutISO).getTime();
  if (isNaN(start) || isNaN(end) || end <= start) return 0;

  const diffMs = end - start;
  return Math.floor(diffMs / (1000 * 60));
};

export const formatMinutesToHours = (totalMinutes) => {
  if (!totalMinutes || totalMinutes <= 0) return '0h 00m';
  const hrs = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (mins === 0) return `${hrs}h 00m`;
  return `${hrs}h ${String(mins).padStart(2, '0')}m`;
};

export const formatTimeOnly = (isoOrTimeStr) => {
  if (!isoOrTimeStr) return 'Not recorded';

  // If it's already HH:MM format
  if (/^\d{2}:\d{2}(:\d{2})?$/.test(isoOrTimeStr)) {
    const [h, m] = isoOrTimeStr.split(':');
    const hourNum = parseInt(h, 10);
    const ampm = hourNum >= 12 ? 'PM' : 'AM';
    const displayHour = hourNum % 12 || 12;
    return `${displayHour}:${m} ${ampm}`;
  }

  const d = new Date(isoOrTimeStr);
  if (isNaN(d.getTime())) return String(isoOrTimeStr);

  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

export const formatDateOnly = (isoOrDateStr) => {
  if (!isoOrDateStr) return '';
  const d = new Date(isoOrDateStr);
  if (isNaN(d.getTime())) return String(isoOrDateStr);

  return d.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const deriveAttendanceStatus = (checkInISO, checkOutISO, workingSchedule = null) => {
  if (!checkInISO) return 'Absent';

  // If working schedule exists, evaluate expected start time
  if (workingSchedule && Array.isArray(workingSchedule.days)) {
    const checkInDate = new Date(checkInISO);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = dayNames[checkInDate.getDay()];
    const dayConfig = workingSchedule.days.find((d) => d.dayOfWeek === dayName);

    if (dayConfig && dayConfig.isWorkingDay && dayConfig.startTime) {
      const [expH, expM] = dayConfig.startTime.split(':').map(Number);
      const actualH = checkInDate.getHours();
      const actualM = checkInDate.getMinutes();

      const expectedTotalMins = expH * 60 + expM;
      const actualTotalMins = actualH * 60 + actualM;

      // Allow 10-minute grace period
      if (actualTotalMins > expectedTotalMins + 10) {
        return 'Late';
      }
    }
  }

  return 'Present';
};

export const detectExceptions = (checkInISO, checkOutISO, workingSchedule = null) => {
  const exceptions = {
    isMissingCheckOut: Boolean(checkInISO && !checkOutISO),
    isLate: false,
    lateMinutes: 0,
    isShortDuration: false,
  };

  if (!checkInISO) return exceptions;

  if (workingSchedule && Array.isArray(workingSchedule.days)) {
    const checkInDate = new Date(checkInISO);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = dayNames[checkInDate.getDay()];
    const dayConfig = workingSchedule.days.find((d) => d.dayOfWeek === dayName);

    if (dayConfig && dayConfig.isWorkingDay && dayConfig.startTime) {
      const [expH, expM] = dayConfig.startTime.split(':').map(Number);
      const actualTotalMins = checkInDate.getHours() * 60 + checkInDate.getMinutes();
      const expectedTotalMins = expH * 60 + expM;

      if (actualTotalMins > expectedTotalMins + 10) {
        exceptions.isLate = true;
        exceptions.lateMinutes = actualTotalMins - expectedTotalMins;
      }
    }
  }

  // Worked duration check
  if (checkInISO && checkOutISO) {
    const workedMins = calculateWorkedMinutes(checkInISO, checkOutISO);
    if (workedMins < 240) {
      // Less than 4 hours
      exceptions.isShortDuration = true;
    }
  }

  return exceptions;
};
