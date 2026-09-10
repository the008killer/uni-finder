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