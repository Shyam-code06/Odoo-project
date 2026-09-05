/**
 * Working Schedule Mock Dataset
 */

export let MOCK_WORKING_SCHEDULES = [
  {
    id: 'sched-001',
    name: 'Full-Time Standard',
    description: 'Standard 40-hour work week, Monday to Friday 09:30 to 18:30 with 1 hour lunch break.',
    timezone: 'Asia/Kolkata',
    status: 'Active',
    created_at: '2024-01-01T09:00:00Z',
    updated_at: '2026-09-01T10:00:00Z',
    days: [
      { dayOfWeek: 'Monday', isWorkingDay: true, startTime: '09:30', endTime: '18:30', breakMinutes: 60 },
      { dayOfWeek: 'Tuesday', isWorkingDay: true, startTime: '09:30', endTime: '18:30', breakMinutes: 60 },
      { dayOfWeek: 'Wednesday', isWorkingDay: true, startTime: '09:30', endTime: '18:30', breakMinutes: 60 },
      { dayOfWeek: 'Thursday', isWorkingDay: true, startTime: '09:30', endTime: '18:30', breakMinutes: 60 },
      { dayOfWeek: 'Friday', isWorkingDay: true, startTime: '09:30', endTime: '18:30', breakMinutes: 60 },
      { dayOfWeek: 'Saturday', isWorkingDay: false, startTime: '09:30', endTime: '18:30', breakMinutes: 60 },
      { dayOfWeek: 'Sunday', isWorkingDay: false, startTime: '09:30', endTime: '18:30', breakMinutes: 60 },
    ],
  },
  {
    id: 'sched-002',
    name: 'Flexi Shift',
    description: 'Flexible daytime shift, Monday to Friday 10:00 to 19:00 with 1 hour lunch break.',
    timezone: 'Asia/Kolkata',
    status: 'Active',
    created_at: '2024-02-15T09:00:00Z',
    updated_at: '2026-09-01T10:00:00Z',
    days: [
      { dayOfWeek: 'Monday', isWorkingDay: true, startTime: '10:00', endTime: '19:00', breakMinutes: 60 },
      { dayOfWeek: 'Tuesday', isWorkingDay: true, startTime: '10:00', endTime: '19:00', breakMinutes: 60 },
      { dayOfWeek: 'Wednesday', isWorkingDay: true, startTime: '10:00', endTime: '19:00', breakMinutes: 60 },
      { dayOfWeek: 'Thursday', isWorkingDay: true, startTime: '10:00', endTime: '19:00', breakMinutes: 60 },
      { dayOfWeek: 'Friday', isWorkingDay: true, startTime: '10:00', endTime: '19:00', breakMinutes: 60 },
      { dayOfWeek: 'Saturday', isWorkingDay: false, startTime: '10:00', endTime: '19:00', breakMinutes: 60 },
      { dayOfWeek: 'Sunday', isWorkingDay: false, startTime: '10:00', endTime: '19:00', breakMinutes: 60 },
    ],
  },
  {
    id: 'sched-003',
    name: 'Part-Time Morning',
    description: 'Part-time morning shift, Monday to Thursday 09:00 to 13:00 with 15 minute break.',
    timezone: 'Asia/Kolkata',
    status: 'Active',
    created_at: '2024-03-20T09:00:00Z',
    updated_at: '2026-09-01T10:00:00Z',
    days: [
      { dayOfWeek: 'Monday', isWorkingDay: true, startTime: '09:00', endTime: '13:00', breakMinutes: 15 },
      { dayOfWeek: 'Tuesday', isWorkingDay: true, startTime: '09:00', endTime: '13:00', breakMinutes: 15 },
      { dayOfWeek: 'Wednesday', isWorkingDay: true, startTime: '09:00', endTime: '13:00', breakMinutes: 15 },
      { dayOfWeek: 'Thursday', isWorkingDay: true, startTime: '09:00', endTime: '13:00', breakMinutes: 15 },
      { dayOfWeek: 'Friday', isWorkingDay: false, startTime: '09:00', endTime: '13:00', breakMinutes: 15 },
      { dayOfWeek: 'Saturday', isWorkingDay: false, startTime: '09:00', endTime: '13:00', breakMinutes: 15 },
      { dayOfWeek: 'Sunday', isWorkingDay: false, startTime: '09:00', endTime: '13:00', breakMinutes: 15 },
    ],
  },
  {
    id: 'sched-004',
    name: 'Weekend Support Shift',
    description: 'Special weekend support schedule, Saturday and Sunday 10:00 to 18:00.',
    timezone: 'Asia/Kolkata',
    status: 'Inactive',
    created_at: '2024-05-10T09:00:00Z',
    updated_at: '2026-09-01T10:00:00Z',
    days: [
      { dayOfWeek: 'Monday', isWorkingDay: false, startTime: '10:00', endTime: '18:00', breakMinutes: 60 },
      { dayOfWeek: 'Tuesday', isWorkingDay: false, startTime: '10:00', endTime: '18:00', breakMinutes: 60 },
      { dayOfWeek: 'Wednesday', isWorkingDay: false, startTime: '10:00', endTime: '18:00', breakMinutes: 60 },
      { dayOfWeek: 'Thursday', isWorkingDay: false, startTime: '10:00', endTime: '18:00', breakMinutes: 60 },
      { dayOfWeek: 'Friday', isWorkingDay: false, startTime: '10:00', endTime: '18:00', breakMinutes: 60 },
      { dayOfWeek: 'Saturday', isWorkingDay: true, startTime: '10:00', endTime: '18:00', breakMinutes: 60 },
      { dayOfWeek: 'Sunday', isWorkingDay: true, startTime: '10:00', endTime: '18:00', breakMinutes: 60 },
    ],
  },
];

export const getRawSchedules = () => MOCK_WORKING_SCHEDULES;
export const setRawSchedules = (schedules) => { MOCK_WORKING_SCHEDULES = schedules; };
