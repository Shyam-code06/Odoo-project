/**
 * Working Schedule Dataset
 */

export let MOCK_WORKING_SCHEDULES = [
  {
    id: 1,
    name: 'Standard 40 Hours',
    description: 'Standard Monday to Friday 9:00 AM - 5:00 PM',
    timezone: 'UTC',
    status: 'Active',
    created_at: '2026-09-05T13:58:42Z',
    updated_at: '2026-09-05T13:58:42Z',
    days: [
      { dayOfWeek: 'Monday', isWorkingDay: true, startTime: '09:00', endTime: '17:00', breakMinutes: 60 },
      { dayOfWeek: 'Tuesday', isWorkingDay: true, startTime: '09:00', endTime: '17:00', breakMinutes: 60 },
      { dayOfWeek: 'Wednesday', isWorkingDay: true, startTime: '09:00', endTime: '17:00', breakMinutes: 60 },
      { dayOfWeek: 'Thursday', isWorkingDay: true, startTime: '09:00', endTime: '17:00', breakMinutes: 60 },
      { dayOfWeek: 'Friday', isWorkingDay: true, startTime: '09:00', endTime: '17:00', breakMinutes: 60 },
      { dayOfWeek: 'Saturday', isWorkingDay: false, startTime: '09:00', endTime: '17:00', breakMinutes: 60 },
      { dayOfWeek: 'Sunday', isWorkingDay: false, startTime: '09:00', endTime: '17:00', breakMinutes: 60 },
    ],
  },
  {
    id: 2,
    name: 'Part Time 20 Hours',
    description: 'Part-time schedule Monday to Wednesday',
    timezone: 'UTC',
    status: 'Active',
    created_at: '2026-09-05T13:58:42Z',
    updated_at: '2026-09-05T13:58:42Z',
    days: [
      { dayOfWeek: 'Monday', isWorkingDay: true, startTime: '09:00', endTime: '17:00', breakMinutes: 60 },
      { dayOfWeek: 'Tuesday', isWorkingDay: true, startTime: '09:00', endTime: '17:00', breakMinutes: 60 },
      { dayOfWeek: 'Wednesday', isWorkingDay: true, startTime: '09:00', endTime: '13:00', breakMinutes: 0 },
      { dayOfWeek: 'Thursday', isWorkingDay: false, startTime: '09:00', endTime: '17:00', breakMinutes: 60 },
      { dayOfWeek: 'Friday', isWorkingDay: false, startTime: '09:00', endTime: '17:00', breakMinutes: 60 },
      { dayOfWeek: 'Saturday', isWorkingDay: false, startTime: '09:00', endTime: '17:00', breakMinutes: 60 },
      { dayOfWeek: 'Sunday', isWorkingDay: false, startTime: '09:00', endTime: '17:00', breakMinutes: 60 },
    ],
  },
];

export const getRawSchedules = () => MOCK_WORKING_SCHEDULES;
export const setRawSchedules = (schedules) => { MOCK_WORKING_SCHEDULES = schedules; };
