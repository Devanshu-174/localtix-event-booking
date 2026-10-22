export const money = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
export const date = (s) =>
  new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date(s));
export const time = (s) =>
  new Intl.DateTimeFormat('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(s));
