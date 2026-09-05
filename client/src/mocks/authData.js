import { ROLES } from '../config/permissions';

export const MOCK_CURRENT_USER = {
  id: 'usr_001',
  name: 'Sarah Jenkins',
  email: 'sarah.jenkins@hrms.io',
  avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  jobTitle: 'Senior HR Operations Lead',
  department: 'Human Resources',
  role: ROLES.HR_MANAGER,
};

export const MOCK_NOTIFICATIONS = [
  {
    id: 'notif_1',
    title: 'New Leave Request',
    description: 'Alex Morgan submitted a vacation request for 3 days.',
    time: '10 minutes ago',
    read: false,
    type: 'time-off',
  },
  {
    id: 'notif_2',
    title: 'Monthly Payrun Approved',
    description: 'September 2026 Payrun has been verified by Finance.',
    time: '2 hours ago',
    read: false,
    type: 'payroll',
  },
  {
    id: 'notif_3',
    title: 'Contract Expiration Alert',
    description: 'Contract for David Miller expires in 14 days.',
    time: 'Yesterday',
    read: true,
    type: 'contract',
  },
  {
    id: 'notif_4',
    title: 'New Employee Onboarded',
    description: 'Elena Rostova joined Product Design department.',
    time: '2 days ago',
    read: true,
    type: 'employee',
  },
];
