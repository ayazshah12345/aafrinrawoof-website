/**
 * Indian Standard Time (IST) Date & Time Utilities
 * Timezone: Asia/Kolkata (IST, UTC+5:30)
 */

export const IST_TIMEZONE = 'Asia/Kolkata';

export const formatISTDate = (dateInput?: string | Date | null): string => {
  if (!dateInput) return 'N/A';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('en-IN', {
    timeZone: IST_TIMEZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

export const formatISTDateTime = (dateInput?: string | Date | null): string => {
  if (!dateInput) return 'N/A';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString('en-IN', {
    timeZone: IST_TIMEZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
};

export const formatISTTime = (dateInput?: string | Date | null): string => {
  if (!dateInput) return 'N/A';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return 'N/A';
  return date.toLocaleTimeString('en-IN', {
    timeZone: IST_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
};
