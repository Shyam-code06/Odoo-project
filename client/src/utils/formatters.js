// Time-aware greeting generator based on current hour
export const getTimeAwareGreeting = (userName = '') => {
  const hour = new Date().getHours();
  let timeGreeting = 'Good day';

  if (hour >= 5 && hour < 12) {
    timeGreeting = 'Good morning';
  } else if (hour >= 12 && hour < 17) {
    timeGreeting = 'Good afternoon';
  } else if (hour >= 17 && hour < 22) {
    timeGreeting = 'Good evening';
  } else {
    timeGreeting = 'Welcome back';
  }

  return userName ? `${timeGreeting}, ${userName}` : timeGreeting;
};

// Indian Currency Formatter (e.g. ₹48,500, ₹1.82 Cr)
export const formatCurrency = (amount = 0, compact = false) => {
  if (typeof amount !== 'number') {
    amount = parseFloat(amount) || 0;
  }

  if (compact) {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`;
    }
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)} Lakh`;
    }
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

// Format Date (e.g., "Sep 05, 2026")
export const formatDate = (dateInput) => {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
};

// Format Time Ago (e.g., "10 mins ago", "2 hours ago")
export const formatTimeAgo = (timestamp) => {
  if (!timestamp) return '';
  const now = new Date();
  const past = new Date(timestamp);
  const diffInSeconds = Math.floor((now - past) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) {
    const mins = Math.floor(diffInSeconds / 60);
    return `${mins} min${mins > 1 ? 's' : ''} ago`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
  const days = Math.floor(diffInSeconds / 86400);
  return `${days} day${days > 1 ? 's' : ''} ago`;
};

// Format Payroll Period Range (e.g., "01 Sep 2026 - 30 Sep 2026")
export const formatPayrollPeriod = (startDate, endDate) => {
  if (!startDate || !endDate) return '—';
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
};
