export function formatDateLabel(dateStr) {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (a, b) =>
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();

  if (isSameDay(date, today)) return 'Today';
  if (isSameDay(date, yesterday)) return 'Yesterday';

  const diffDays = Math.floor((today - date) / (1000 * 60 * 60 * 24));
  if (diffDays < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  }

  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
  });
}

// Groups messages by day for date separators
export function groupMessagesByDate(messages) {
  const groups = [];
  let currentDate = null;

  messages.forEach(msg => {
    const label = formatDateLabel(msg.sent_at);
    if (label !== currentDate) {
      groups.push({ type: 'date', label, id: `date-${msg.id}` });
      currentDate = label;
    }
    groups.push({ type: 'message', ...msg });
  });

  return groups;
}

export function formatLocalTime(dateStr) {
  if (!dateStr) return '';
  
  let utcStr = dateStr;
  
  // If the date string doesn't end with 'Z' or contain a offset like '+02:00',
  // it came raw from PostgreSQL. We append 'Z' to force UTC parsing.
  if (typeof dateStr === 'string' && !dateStr.endsWith('Z') && !dateStr.includes('+')) {
    // Convert 'YYYY-MM-DD HH:MM:SS' to ISO format 'YYYY-MM-DDTHH:MM:SSZ'
    utcStr = dateStr.replace(' ', 'T') + 'Z';
  }

  const date = new Date(utcStr);
  
  // Natively reads user system clock settings
  return date.toLocaleTimeString(navigator.language, { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}