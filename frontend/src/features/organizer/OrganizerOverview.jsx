import React, { useState } from 'react';
import { Search, Download, ArrowRight, LoaderCircle } from 'lucide-react';
import {
  organizerStats,
  admissionStatus,
  guestCsv,
  downloadFile,
} from '../bookings/bookingTools';

export default function OrganizerOverview({
  events,
  bookings,
  loading,
  error,
  onRetry,
  onEdit,
  onOpen,
}) {
  const [query, setQuery] = useState('');
  const [eventId, setEventId] = useState('all');
  const [status, setStatus] = useState('all');
  const [exportError, setExportError] = useState('');
  const stats = organizerStats(events, bookings);
  const rows = bookings.filter(
    (b) =>
      (eventId === 'all' || String(b.eventId) === eventId) &&
      (status === 'all' || b.status === status) &&
      [b.customerName, b.customerEmail, b.eventTitle, b.reference]
        .join(' ')
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  if (loading)
    return (
      <div className="event-state" role="status">
        <LoaderCircle className="spin" size={18} /> Loading your dashboard…
      </div>
    );
  if (error)
    return (
      <div className="account-error" role="alert">
        {error}
        <button onClick={onRetry}>Retry</button>
      </div>
    );
  return (
    <>
      <div className="organizer-stats">
        {[
          ['Confirmed bookings', stats.bookings],
          ['Tickets sold', stats.sold],
          ['Upcoming places left', stats.remaining],
          ['Attendees checked in', stats.checkedIn],
          [
            'Confirmed booking value',
            '₹' + stats.value.toLocaleString('en-IN'),
          ],
        ].map(([label, value]) => (
          <div className="panel" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <section className="panel">
        <div className="panel-head">
          <div>
            <h3>Your events</h3>
            <p>Availability and sales across your events.</p>
          </div>
          <span>{events.length} EVENTS</span>
        </div>
        <div className="managed-list">
          {events.map((e) => (
            <div key={e.id}>
              <span>
                <b>{e.title}</b>
                <small>
                  {new Date(e.startsAt).toLocaleDateString('en-IN')} · {e.venue}
                </small>
              </span>
              <span className="managed-actions">
                <span className="sold">
                  {e.ticketsSold} / {e.capacity} sold · {e.available} left
                </span>
                <button onClick={() => onEdit(e)}>Edit</button>
              </span>
            </div>
          ))}
          {!events.length && (
            <p className="empty-small">
              Create your first event to start welcoming guests.
            </p>
          )}
        </div>
      </section>
      <section className="panel">
        <div className="guest-heading">
          <div>
            <h3>Guest list</h3>
            <p>
              {rows.length} matching booking{rows.length === 1 ? '' : 's'}.
              Search, review, or export attendees.
            </p>
          </div>
          <button
            className="secondary-btn"
            disabled={!rows.length}
            onClick={() => {
              setExportError('');
              try {
                downloadFile(
                  guestCsv(rows),
                  'text/csv;charset=utf-8',
                  'LocalTix-guests.csv',
                );
              } catch {
                setExportError('Export failed. Please try again.');
              }
            }}
          >
            <Download size={16} /> Export CSV
          </button>
        </div>
        <div className="guest-filters">
          <label className="search">
            <Search size={16} />
            <input
              aria-label="Search guests"
              placeholder="Name, email, event or reference"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <label>
            Event
            <select
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
            >
              <option value="all">All events</option>
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            Status
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">All bookings</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </label>
        </div>
        {exportError && (
          <p className="profile-feedback error" role="alert">
            {exportError}
          </p>
        )}
        <div className="guest-table-wrap">
          <table className="guest-table">
            <thead>
              <tr>
                <th>Guest</th>
                <th>Event</th>
                <th>Tickets</th>
                <th>Status / check-in</th>
                <th>
                  <span className="visually-hidden">Details</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.id}>
                  <td>
                    <b>{b.customerName}</b>
                    <small>{b.customerEmail}</small>
                  </td>
                  <td>
                    {b.eventTitle}
                    <small>{b.reference}</small>
                  </td>
                  <td>{b.quantity}</td>
                  <td>
                    <span
                      className={
                        'booking-status ' +
                        (b.status === 'CANCELLED' ? 'cancelled' : '')
                      }
                    >
                      {b.status === 'CANCELLED' ? 'Cancelled' : 'Confirmed'}
                    </span>
                    <small>{admissionStatus(b)}</small>
                  </td>
                  <td>
                    <button
                      className="icon-btn"
                      aria-label={'View booking for ' + b.customerName}
                      onClick={() => onOpen(b)}
                    >
                      <ArrowRight size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!rows.length && (
          <p className="empty-small">
            {bookings.length
              ? 'No guests match these filters.'
              : 'Bookings will appear here when customers reserve tickets.'}
          </p>
        )}
      </section>
    </>
  );
}
