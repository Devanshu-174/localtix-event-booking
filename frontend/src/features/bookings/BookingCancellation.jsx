import React, { useState } from 'react';
import { LoaderCircle, X } from 'lucide-react';

export default function BookingCancellation({ booking, onCancel }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  if (booking.status === 'CANCELLED') return null;
  const reason = (booking.tickets || []).some(
    (ticket) => ticket.status === 'CHECKED_IN',
  )
    ? 'This booking cannot be cancelled because a ticket has already been checked in.'
    : new Date(booking.startsAt) <= new Date()
      ? 'Cancellation closes when the event starts.'
      : '';
  async function confirm() {
    if (pending) return;
    setPending(true);
    setError('');
    try {
      await onCancel();
      setConfirming(false);
    } catch (error) {
      setError(error.message || 'Cancellation failed. Please try again.');
    } finally {
      setPending(false);
    }
  }
  return (
    <section className="booking-cancellation" aria-label="Cancel booking">
      {reason ? (
        <p className="cancellation-note">{reason}</p>
      ) : confirming ? (
        <>
          <h3>
            Cancel all {booking.quantity}{' '}
            {booking.quantity === 1 ? 'ticket' : 'tickets'}?
          </h3>
          <p>
            The QR codes will become invalid and the places will be released.
            This cannot be undone.
          </p>
          {error && (
            <p className="cancellation-error" role="alert">
              {error}
            </p>
          )}
          <div className="cancellation-actions">
            <button
              type="button"
              className="secondary-btn"
              disabled={pending}
              onClick={() => {
                setConfirming(false);
                setError('');
              }}
            >
              Keep tickets
            </button>
            <button
              type="button"
              className="cancel-booking"
              disabled={pending}
              onClick={confirm}
            >
              {pending ? (
                <LoaderCircle size={16} className="spin" />
              ) : (
                <X size={16} />
              )}{' '}
              {pending ? 'Cancelling…' : 'Yes, cancel booking'}
            </button>
          </div>
        </>
      ) : (
        <button
          type="button"
          className="cancel-booking"
          onClick={() => setConfirming(true)}
        >
          Cancel booking
        </button>
      )}
    </section>
  );
}
