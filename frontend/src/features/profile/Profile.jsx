import React, { useEffect, useState } from 'react';
import {
  UserRound,
  Mail,
  ShieldCheck,
  LogOut,
  Check,
  LoaderCircle,
  Ticket,
  CalendarDays,
} from 'lucide-react';

export default function Profile({
  user,
  apiUrl,
  onUpdate,
  onLogout,
  bookings,
  events,
  activityLoading,
  activityError,
  theme,
  setTheme,
  onTickets,
}) {
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    fetch(apiUrl + '/profile', {
      headers: { Authorization: 'Bearer ' + user.token },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok)
          throw Error(
            response.status === 401 || response.status === 403
              ? 'Your session has expired. Sign out and log in again.'
              : 'Unable to load your profile. Please try again.',
          );
        return response.json();
      })
      .then((data) => {
        setProfile(data);
        setName(data.name);
      })
      .catch((error) => {
        if (error.name !== 'AbortError') setError(error.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [apiUrl, user.token, retry]);
  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch(apiUrl + '/profile', {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer ' + user.token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!response.ok)
        throw Error('Could not save your profile. Please try again.');
      const updated = await response.json();
      setProfile(updated);
      setName(updated.name);
      onUpdate(updated);
      setSuccess('Your profile has been updated.');
    } catch (error) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  }
  const organizer = user.role === 'ORGANIZER';
  const confirmed = bookings.filter(
    (booking) => booking.status === 'CONFIRMED',
  );
  return (
    <main className="dashboard profile-page">
      <div className="dash-title">
        <div className="eyebrow muted">YOUR ACCOUNT</div>
        <h1>
          My profile<span className="brand-dot">.</span>
        </h1>
        <p>Your details, preferences, and local adventures.</p>
      </div>
      <div className="profile-layout">
        <aside className="panel profile-summary">
          <div className="profile-avatar" aria-hidden="true">
            {(profile?.name || user.name)
              .trim()
              .split(/\s+/)
              .slice(0, 2)
              .map((part) => part[0])
              .join('')
              .toUpperCase()}
          </div>
          <h2>{profile?.name || user.name}</h2>
          <span className="role-badge">
            <ShieldCheck size={14} />
            {organizer ? 'Event organizer' : 'Customer'}
          </span>
          <p className="profile-email">
            <Mail size={15} />
            {profile?.email || user.email}
          </p>
          {profile && (
            <p className="member-since">
              Member since{' '}
              {new Date(profile.createdAt).toLocaleDateString('en-IN', {
                month: 'long',
                year: 'numeric',
              })}
            </p>
          )}
          <button className="secondary-btn" onClick={onTickets}>
            <Ticket size={16} />
            {organizer ? 'View guest list' : 'View my tickets'}
          </button>
          <button className="signout-btn" onClick={onLogout}>
            <LogOut size={16} /> Sign out
          </button>
        </aside>
        <div className="profile-content">
          <section className="panel profile-details">
            <div className="panel-heading">
              <UserRound size={20} />
              <div>
                <h2>Personal details</h2>
                <p>Keep your name up to date for bookings and check-in.</p>
              </div>
            </div>
            {loading ? (
              <p className="profile-feedback" role="status">
                <LoaderCircle className="spin" size={18} /> Loading your
                profile…
              </p>
            ) : (
              <>
                {error && (
                  <div className="profile-feedback error" role="alert">
                    {error}
                    {!profile && (
                      <button
                        className="secondary-btn"
                        onClick={() => setRetry((value) => value + 1)}
                      >
                        Retry
                      </button>
                    )}
                  </div>
                )}
                {success && (
                  <div className="profile-feedback success" role="status">
                    <Check size={16} />
                    {success}
                  </div>
                )}
                {profile && (
                  <form className="form" onSubmit={save}>
                    <label>
                      Full name
                      <input
                        autoComplete="name"
                        required
                        maxLength={100}
                        value={name}
                        onChange={(event) => {
                          setName(event.target.value);
                          setSuccess('');
                        }}
                      />
                    </label>
                    <label>
                      Email address
                      <input
                        type="email"
                        value={profile.email}
                        readOnly
                        aria-describedby="email-note"
                      />
                    </label>
                    <small id="email-note">
                      Your email is the sign-in address for this account.
                    </small>
                    <button
                      className="dark-btn"
                      disabled={
                        saving || !name.trim() || name.trim() === profile.name
                      }
                    >
                      {saving ? (
                        <LoaderCircle className="spin" size={16} />
                      ) : (
                        <Check size={16} />
                      )}{' '}
                      {saving ? 'Saving…' : 'Save changes'}
                    </button>
                  </form>
                )}
              </>
            )}
          </section>
          <section className="panel profile-preferences">
            <h2>Appearance</h2>
            <p>Choose the theme that feels right for you.</p>
            <div
              className="theme-options"
              role="group"
              aria-label="Colour theme"
            >
              {['light', 'dark'].map((value) => (
                <button
                  key={value}
                  aria-pressed={theme === value}
                  onClick={() => setTheme(value)}
                  className={theme === value ? 'selected' : ''}
                >
                  <span className={'theme-preview ' + value} />
                  {value === 'light' ? 'Light' : 'Dark'}
                  {theme === value && <Check size={16} />}
                </button>
              ))}
            </div>
          </section>
          <section className="panel">
            <div className="panel-heading">
              <CalendarDays size={20} />
              <h2>Your activity</h2>
            </div>
            {activityError ? (
              <p className="profile-feedback error">
                Activity is temporarily unavailable.
              </p>
            ) : (
              <div className="profile-stats">
                <div>
                  <strong>{activityLoading ? '—' : confirmed.length}</strong>
                  <span>Confirmed bookings</span>
                </div>
                <div>
                  <strong>
                    {activityLoading
                      ? '—'
                      : organizer
                        ? events.filter(
                            (event) => event.organizerId === user.id,
                          ).length
                        : confirmed.reduce(
                            (total, booking) => total + booking.quantity,
                            0,
                          )}
                  </strong>
                  <span>{organizer ? 'Events hosted' : 'Tickets booked'}</span>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
