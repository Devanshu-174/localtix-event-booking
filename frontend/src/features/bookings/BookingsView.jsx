import React, { useState } from 'react';
import { Ticket, ArrowRight, LoaderCircle } from 'lucide-react';
import { bookingGroup, admissionStatus } from './bookingTools';

export default function BookingsView({
  bookings,
  loading,
  error,
  onRetry,
  onOpen,
  onDiscover,
  organizer,
}) {
  const [group, setGroup] = useState('Upcoming');
  const groups = ['Upcoming', 'Past', 'Cancelled'];
  const rows = bookings.filter((b) => bookingGroup(b) === group);
  return (
    <main className="dashboard">
      <div className="dash-title">
        <div className="eyebrow muted">
          {organizer ? 'YOUR ATTENDEES' : 'YOUR LOCAL PLANS'}
        </div>
        <h1>
          {organizer ? 'Guest bookings' : 'My tickets'}
          <span className="brand-dot">.</span>
        </h1>
        <p>
          {organizer
            ? 'View booking and check-in status across your events.'
            : 'Find your next event, revisit past plans, or review cancellations.'}
        </p>
      </div>
      <div className="booking-tabs" role="group" aria-label="Booking period">
        {groups.map((value) => (
          <button
            key={value}
            aria-pressed={group === value}
            className={group === value ? 'selected' : ''}
            onClick={() => setGroup(value)}
          >
            {value}
            <span>
              {loading || error
                ? '—'
                : bookings.filter((b) => bookingGroup(b) === value).length}
            </span>
          </button>
        ))}
      </div>
      {loading ? (
        <div className="event-state" role="status">
          <LoaderCircle className="spin" size={18} /> Loading bookings…
        </div>
      ) : error ? (
        <div className="account-error" role="alert">
          {error}
          <button onClick={onRetry}>Retry</button>
        </div>
      ) : (
        <div className="tickets-list">
          {rows.map((b) => (
            <button
              className="ticket-row booking-row"
              key={b.id}
              onClick={() => onOpen(b)}
            >
              <div className="ticket-art">
                <Ticket size={28} />
              </div>
              <div className="ticket-details">
                <b>{b.eventTitle}</b>
                <span>
                  {new Date(b.startsAt).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}{' '}
                  · {b.venue}
                </span>
                {organizer && (
                  <span>
                    {b.customerName} · {b.customerEmail}
                  </span>
                )}
                <small>{b.reference}</small>
                <span
                  className={
                    'booking-status ' +
                    (b.status === 'CANCELLED' ? 'cancelled' : '')
                  }
                >
                  {b.status === 'CANCELLED' ? 'Cancelled' : admissionStatus(b)}
                </span>
              </div>
              <div className="ticket-qty">
                {b.quantity} ticket(s)
                <b>₹{Number(b.total).toLocaleString('en-IN')}</b>
              </div>
              <ArrowRight size={18} />
            </button>
          ))}
          {!rows.length && (
            <div className="empty">
              <p>No {group.toLowerCase()} bookings.</p>
              {!organizer && group === 'Upcoming' && (
                <button onClick={onDiscover}>
                  Find an event <ArrowRight size={15} />
                </button>
              )}
            </div>
          )}
        </div>
      )}
      {!organizer && (
        <p className="booking-policy">
          You can cancel an upcoming booking until the event starts, provided
          none of its tickets have been checked in. Cancellation applies to all
          tickets in the booking.
        </p>
      )}
    </main>
  );
}
