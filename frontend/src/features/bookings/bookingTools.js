export function bookingGroup(booking, now = Date.now()) {
  if (booking.status === 'CANCELLED') return 'Cancelled';
  return new Date(booking.startsAt).getTime() > now ? 'Upcoming' : 'Past';
}
export function admissionStatus(booking) {
  if (booking.status === 'CANCELLED') return 'Cancelled';
  const checked = (booking.tickets || []).filter(
    (ticket) => ticket.status === 'CHECKED_IN',
  ).length;
  return checked
    ? `${checked}/${booking.quantity} checked in`
    : 'Not checked in';
}
export function organizerStats(events, bookings) {
  const active = bookings.filter((booking) => booking.status === 'CONFIRMED');
  return {
    bookings: active.length,
    sold: active.reduce((sum, b) => sum + b.quantity, 0),
    remaining: events
      .filter((e) => new Date(e.startsAt) > new Date())
      .reduce((sum, e) => sum + e.available, 0),
    checkedIn: active
      .flatMap((b) => b.tickets || [])
      .filter((t) => t.status === 'CHECKED_IN').length,
    value: active.reduce((sum, b) => sum + Number(b.total), 0),
  };
}
function csvCell(value) {
  let text = String(value ?? '');
  if (/^[\s]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text)) text = "'" + text;
  return '"' + text.replaceAll('"', '""') + '"';
}
export function guestCsv(bookings) {
  const rows = [
    [
      'Guest',
      'Email',
      'Event',
      'Booking reference',
      'Tickets',
      'Booking status',
      'Check-in',
      'Total (INR)',
    ],
  ];
  bookings.forEach((b) =>
    rows.push([
      b.customerName,
      b.customerEmail,
      b.eventTitle,
      b.reference,
      b.quantity,
      b.status,
      admissionStatus(b),
      b.total,
    ]),
  );
  return '\uFEFF' + rows.map((row) => row.map(csvCell).join(',')).join('\r\n');
}
export function downloadFile(content, type, name) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
