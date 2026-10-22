import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import { money, date, time } from './utils/formatters';
import { fallbackEventImages } from './config/eventImages';
import { API, auth, createApiClient } from './services/api';
import BookingsView from './features/bookings/BookingsView';
import OrganizerOverview from './features/organizer/OrganizerOverview';
import TicketDownload from './features/bookings/TicketDownload';
import BookingCancellation from './features/bookings/BookingCancellation';
import Profile from './features/profile/Profile';
import React, { useEffect, useMemo, useState } from 'react';
import {
  QrCode,
  MapPin,
  CalendarDays,
  Ticket,
  Search,
  Plus,
  UserRound,
  ScanLine,
  ArrowRight,
  Clock3,
  Check,
  ChevronDown,
  Music2,
  Heart,
  X,
  LoaderCircle,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

function savedUser() {
  try {
    return JSON.parse(localStorage.getItem('lt-user') || 'null');
  } catch {
    localStorage.removeItem('lt-user');
    return null;
  }
}
function App() {
  const [user, setUser] = useState(savedUser),
    [theme, setTheme] = useState(() =>
      localStorage.getItem('lt-theme') === 'dark' ? 'dark' : 'light',
    ),
    [events, setEvents] = useState([]),
    [eventsLoading, setEventsLoading] = useState(true),
    [eventsError, setEventsError] = useState(''),
    [bookings, setBookings] = useState([]),
    [accountLoading, setAccountLoading] = useState(false),
    [accountError, setAccountError] = useState(''),
    [favorites, setFavorites] = useState(() => {
      try {
        const saved = JSON.parse(localStorage.getItem('lt-favorites') || '[]');
        return Array.isArray(saved) ? saved : [];
      } catch {
        return [];
      }
    }),
    [query, setQuery] = useState(''),
    [savedOnly, setSavedOnly] = useState(false),
    [sortBy, setSortBy] = useState('soonest'),
    [category, setCategory] = useState('All events'),
    [modal, setModal] = useState(''),
    [selected, setSelected] = useState(null),
    [editingEvent, setEditingEvent] = useState(null),
    [qty, setQty] = useState(1),
    [busy, setBusy] = useState(false),
    [toast, setToast] = useState(''),
    [tab, setTab] = useState('discover'),
    [scanCode, setScanCode] = useState(''),
    [scanResult, setScanResult] = useState(null),
    [form, setForm] = useState({
      name: '',
      email: '',
      password: '',
      role: 'CUSTOMER',
    }),
    [eventForm, setEventForm] = useState({
      title: '',
      description: '',
      category: 'Music',
      venue: '',
      startsAt: '',
      price: '',
      capacity: '',
      imageUrl: '',
    });
  const api = createApiClient(user?.token);
  const load = async () => {
    setEventsLoading(true);
    setEventsError('');
    try {
      setEvents(await api('/events'));
    } catch {
      setEvents([]);
      setEventsError(
        'We couldn’t reach the LocalTix API. Start the backend and try again.',
      );
    } finally {
      setEventsLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);
  useEffect(() => {
    let active = true;
    if (!user) {
      setBookings([]);
      setAccountError('');
      setAccountLoading(false);
      return () => {
        active = false;
      };
    }
    setAccountLoading(true);
    setAccountError('');
    const organizer = user.role === 'ORGANIZER';
    Promise.all([
      api(organizer ? '/bookings/organizer' : '/bookings/mine'),
      organizer ? api('/events/mine') : Promise.resolve(null),
    ])
      .then(([rows, mine]) => {
        if (!active) return;
        setBookings(rows);
        if (mine)
          setEvents((old) => {
            const map = new Map(old.map((e) => [e.id, e]));
            mine.forEach((e) => map.set(e.id, e));
            return [...map.values()];
          });
      })
      .catch((e) => {
        if (active) {
          setBookings([]);
          setAccountError(
            e.message ||
              'Could not load your account data. Please sign in again.',
          );
        }
      })
      .finally(() => {
        if (active) setAccountLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user]);
  useEffect(() => {
    localStorage.setItem('lt-theme', theme);
    document.documentElement.style.colorScheme = theme;
  }, [theme]);
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        document.querySelector('.search input')?.focus();
      }
      if (e.key === 'Escape' && modal) {
        setModal('');
        setEditingEvent(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modal]);
  const categories = [
    'All events',
    'Music',
    'Workshop',
    'Comedy',
    'Food',
    'Film',
    'Art',
    'Wellness',
  ];
  const filtered = useMemo(
    () =>
      events
        .filter(
          (e) =>
            new Date(e.startsAt) > new Date() &&
            (category === 'All events' ||
              e.category?.toLowerCase() === category.toLowerCase()) &&
            (!savedOnly || favorites.includes(e.id)) &&
            `${e.title} ${e.venue} ${e.category}`
              .toLowerCase()
              .includes(query.toLowerCase()),
        )
        .sort((a, b) =>
          sortBy === 'price-low'
            ? a.price - b.price
            : sortBy === 'price-high'
              ? b.price - a.price
              : new Date(a.startsAt) - new Date(b.startsAt),
        ),
    [events, category, query, savedOnly, favorites, sortBy],
  );
  function show(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }
  function toggleFavorite(id) {
    const next = favorites.includes(id)
      ? favorites.filter((x) => x !== id)
      : [...favorites, id];
    setFavorites(next);
    localStorage.setItem('lt-favorites', JSON.stringify(next));
    show(next.includes(id) ? 'Saved to your list' : 'Removed from your list');
  }
  function loginOut() {
    localStorage.removeItem('lt-user');
    setUser(null);
    setBookings([]);
    setSelected(null);
    setModal('');
    setTab('discover');
  }
  async function submitAuth(ev) {
    ev.preventDefault();
    setBusy(true);
    try {
      const u = await auth(
        modal === 'register' ? '/auth/register' : '/auth/login',
        form,
      );
      localStorage.setItem('lt-user', JSON.stringify(u));
      setUser(u);
      setModal(selected?.available !== undefined ? 'event' : '');
      show('You’re in. Welcome to LocalTix!');
    } catch (e) {
      show(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function book() {
    if (!user) {
      setModal('login');
      return;
    }
    if (user.role !== 'CUSTOMER') {
      show('Switch to a customer account to book.');
      return;
    }
    setBusy(true);
    try {
      const b = await api('/bookings', {
        method: 'POST',
        body: JSON.stringify({ eventId: selected.id, quantity: qty }),
      });
      setBookings((old) => [b, ...old]);
      setEvents((old) =>
        old.map((e) =>
          e.id === b.eventId
            ? {
                ...e,
                ticketsSold: e.ticketsSold + qty,
                available: e.available - qty,
              }
            : e,
        ),
      );
      setSelected(b);
      setModal('ticket');
      show('Booking confirmed!');
    } catch (e) {
      show(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function scan() {
    if (busy || !scanCode.trim()) return;
    setBusy(true);
    setScanResult(null);
    try {
      const result = await api('/check-ins/scan', {
        method: 'POST',
        body: JSON.stringify({ code: scanCode.trim() }),
      });
      setScanResult(result);
      if (result.valid) {
        try {
          setBookings(await api('/bookings/organizer'));
        } catch {
          setAccountError(
            'Entry was recorded, but the guest list could not refresh. Please retry.',
          );
        }
      }
    } catch (e) {
      setScanResult({ valid: false, message: e.message });
    } finally {
      setBusy(false);
    }
  }
  async function cancelBooking() {
    if (!selected || busy)
      throw Error('Please wait for the current request to finish.');
    const booking = selected;
    setBusy(true);
    try {
      await api('/bookings/' + booking.id, { method: 'DELETE' });
      const cancelled = {
        ...booking,
        status: 'CANCELLED',
        tickets: (booking.tickets || []).map((t) => ({
          ...t,
          status: 'CANCELLED',
        })),
      };
      setSelected((current) =>
        current?.id === booking.id ? cancelled : current,
      );
      setBookings((old) =>
        old.map((b) => (b.id === cancelled.id ? cancelled : b)),
      );
      await load();
      show('Booking cancelled. The tickets are no longer valid.');
    } finally {
      setBusy(false);
    }
  }
  async function createEvent(ev) {
    ev.preventDefault();
    setBusy(true);
    try {
      const data = {
        ...eventForm,
        price: Number(eventForm.price),
        capacity: Number(eventForm.capacity),
      };
      if (editingEvent)
        await api('/events/' + editingEvent.id, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
      else await api('/events', { method: 'POST', body: JSON.stringify(data) });
      setEventForm({
        title: '',
        description: '',
        category: 'Music',
        venue: '',
        startsAt: '',
        price: '',
        capacity: '',
        imageUrl: '',
      });
      setEditingEvent(null);
      setModal('');
      await load();
      show(editingEvent ? 'Event updated.' : 'Event published.');
    } catch (e) {
      show(e.message);
    } finally {
      setBusy(false);
    }
  }
  function startCreateEvent() {
    setEditingEvent(null);
    setEventForm({
      title: '',
      description: '',
      category: 'Music',
      venue: '',
      startsAt: '',
      price: '',
      capacity: '',
      imageUrl: '',
    });
    setModal('create-event');
  }
  function startEditEvent(e) {
    setEditingEvent(e);
    setEventForm({
      title: e.title,
      description: e.description || '',
      category: e.category,
      venue: e.venue,
      startsAt: e.startsAt?.slice(0, 16) || '',
      price: String(e.price),
      capacity: String(e.capacity),
      imageUrl: e.imageUrl || '',
    });
    setModal('create-event');
  }
  return (
    <div className="app" data-theme={theme}>
      <Header
        user={user}
        theme={theme}
        setTheme={setTheme}
        tab={tab}
        setTab={setTab}
        setModal={setModal}
      />
      {tab === 'discover' && (
        <>
          <main>
            <section className="hero">
              <div className="hero-copy">
                <div className="eyebrow">
                  <span className="pulse" /> THE CITY IS YOURS
                </div>
                <h1>
                  Make room for
                  <br />
                  <em>something local.</em>
                </h1>
                <p>
                  Little moments. Big memories. Find the people, places, and
                  plans that make your city feel like yours.
                </p>
                <button
                  className="hero-cta"
                  onClick={() =>
                    document
                      .getElementById('events')
                      .scrollIntoView({ behavior: 'smooth' })
                  }
                >
                  Find your next thing <ArrowRight size={16} />
                </button>
                <div className="hero-proof">
                  <Ticket size={20} />
                  <span>
                    {eventsLoading ? (
                      'Finding your next experience'
                    ) : eventsError ? (
                      'Discover local experiences'
                    ) : (
                      <>
                        <b>
                          {
                            events.filter(
                              (event) => new Date(event.startsAt) > new Date(),
                            ).length
                          }{' '}
                          upcoming events
                        </b>{' '}
                        to explore in your city
                      </>
                    )}
                  </span>
                </div>
              </div>
              <div className="hero-art">
                <div className="hero-photo" />
                <div className="photo-tag">
                  <span className="tag-icon">
                    <Music2 size={17} />
                  </span>
                  <span>
                    <b>Good things happen here</b>
                    <small>Go find out.</small>
                  </span>
                  <MapPin size={16} className="sparkle" />
                </div>
                <div className="floating-note">
                  <Ticket size={20} aria-hidden="true" /> Less scrolling,
                  <br />
                  more showing up.
                </div>
                <div className="hero-stamp">
                  YOUR
                  <br />
                  CITY
                  <br />
                  <b>AWAITS</b>
                </div>
              </div>
              <div className="hero-bottom">
                <span>CURATED FOR YOUR CORNER OF THE WORLD</span>
                <span>DISCOVER · BOOK · SHOW UP</span>
              </div>
            </section>
            <section className="events-section" id="events">
              <div className="section-head">
                <div>
                  <div className="eyebrow muted">A GOOD PLACE TO START</div>
                  <h2>Out there, waiting.</h2>
                  <p className="section-sub">
                    Things worth leaving the house for.
                  </p>
                </div>
                <span className="event-count">
                  {filtered.length.toString().padStart(2, '0')} EVENTS
                </span>
              </div>
              <div className="tools-row">
                <div className="chips">
                  {categories.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCategory(c)}
                      className={'chip ' + (category === c ? 'selected' : '')}
                    >
                      {c}
                    </button>
                  ))}
                </div>
                <label className="search">
                  <Search size={17} />
                  <input
                    placeholder="Find something..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  <kbd>⌘ K</kbd>
                </label>
                <div className="results-tools">
                  <button
                    className={'saved-filter ' + (savedOnly ? 'selected' : '')}
                    onClick={() => setSavedOnly((v) => !v)}
                  >
                    <Heart
                      size={14}
                      fill={savedOnly ? 'currentColor' : 'none'}
                    />{' '}
                    Saved <span>{favorites.length}</span>
                  </button>
                  <label className="sort-control">
                    Sort{' '}
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                    >
                      <option value="soonest">Soonest</option>
                      <option value="price-low">Price: low to high</option>
                      <option value="price-high">Price: high to low</option>
                    </select>
                  </label>
                </div>
              </div>
              {eventsLoading && (
                <div className="event-state">
                  <LoaderCircle className="spin" size={18} /> Finding local
                  events…
                </div>
              )}
              {eventsError && (
                <div className="event-state error">
                  <span>{eventsError}</span>
                  <button onClick={load}>
                    Try again <ArrowRight size={14} />
                  </button>
                </div>
              )}
              <div
                className="event-grid"
                hidden={eventsLoading || !!eventsError}
              >
                {filtered.map((e, i) => (
                  <article
                    className="event-card"
                    key={e.id}
                    tabIndex="0"
                    aria-label={
                      e.title + ', ' + e.category + ', ' + money(e.price)
                    }
                    onKeyDown={(ev) => {
                      if (
                        ev.target === ev.currentTarget &&
                        (ev.key === 'Enter' || ev.key === ' ')
                      ) {
                        ev.preventDefault();
                        setSelected(e);
                        setQty(1);
                        setModal('event');
                      }
                    }}
                    onClick={() => {
                      setSelected(e);
                      setQty(1);
                      setModal('event');
                    }}
                  >
                    <div
                      className="card-image"
                      style={{
                        backgroundImage: `url(${e.imageUrl || fallbackEventImages[i % fallbackEventImages.length]})`,
                      }}
                    >
                      <span className="category-tag">{e.category}</span>
                      <button
                        className={
                          'like ' + (favorites.includes(e.id) ? 'liked' : '')
                        }
                        onClick={(ev) => {
                          ev.stopPropagation();
                          toggleFavorite(e.id);
                        }}
                        aria-label={
                          favorites.includes(e.id)
                            ? 'Remove from saved events'
                            : 'Save event'
                        }
                      >
                        <Heart
                          size={17}
                          fill={
                            favorites.includes(e.id) ? 'currentColor' : 'none'
                          }
                        />
                      </button>
                      <div className="date-badge">
                        <b>
                          {new Date(e.startsAt).toLocaleDateString('en-US', {
                            day: '2-digit',
                          })}
                        </b>
                        <span>
                          {new Date(e.startsAt)
                            .toLocaleDateString('en-US', { month: 'short' })
                            .toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="card-info">
                      <div className="card-meta">
                        <span>
                          <MapPin size={13} />
                          {e.venue}
                        </span>
                        <span>
                          <Clock3 size={13} />
                          {time(e.startsAt)}
                        </span>
                      </div>
                      <h3>{e.title}</h3>
                      <div className="card-bottom">
                        <span className="price">
                          {money(e.price)}
                          <small> / person</small>
                        </span>
                        <span className="spots">
                          {e.available} spots left <ArrowRight size={14} />
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
              {!eventsLoading && !eventsError && !filtered.length && (
                <div className="empty">
                  {savedOnly
                    ? favorites.length === 0
                      ? 'Save events with the heart button and they will appear here.'
                      : 'No saved events match this category or search.'
                    : query
                      ? 'No events match that search. Try another phrase.'
                      : 'No events in this corner yet. Try another category.'}
                </div>
              )}
              <div className="see-more">
                <span>A CITY FULL OF POSSIBILITIES</span>
                <button
                  onClick={() => {
                    setCategory('All events');
                    setQuery('');
                    setSavedOnly(false);
                  }}
                >
                  See everything <ArrowRight size={15} />
                </button>
              </div>
            </section>
            <section className="host-banner">
              <div className="host-symbol">
                <Ticket size={36} strokeWidth={1.3} />
              </div>
              <div>
                <div className="eyebrow">HAVE A THING GOING?</div>
                <h2>
                  Good things start
                  <br />
                  with <em>people like you.</em>
                </h2>
                <p>
                  Bring your corner of the city together. Put your event out
                  there.
                </p>
              </div>
              <button
                className="light-btn"
                onClick={() =>
                  user?.role === 'ORGANIZER'
                    ? startCreateEvent()
                    : user
                      ? show('An organizer account is needed to host events.')
                      : setModal('register')
                }
              >
                Host an event <ArrowRight size={15} />
              </button>
              <div className="host-pattern">
                LOCAL
                <br />
                IS A<br />
                FEELING
              </div>
            </section>
          </main>
          <Footer />
        </>
      )}
      {tab === 'tickets' && (
        <BookingsView
          bookings={bookings}
          loading={accountLoading}
          error={accountError}
          onRetry={() => setUser({ ...user })}
          onOpen={(booking) => {
            setSelected(booking);
            setModal('ticket');
          }}
          onDiscover={() => setTab('discover')}
          organizer={user?.role === 'ORGANIZER'}
        />
      )}
      {tab === 'organizer' && (
        <main className="dashboard">
          <div className="dash-title dash-organizer">
            <div>
              <div className="eyebrow muted">BACKSTAGE</div>
              <h1>
                Make it happen<span className="brand-dot">.</span>
              </h1>
              <p>Manage your events and welcome your people in.</p>
            </div>
            <button className="dark-btn" onClick={startCreateEvent}>
              <Plus size={17} /> Create event
            </button>
          </div>
          {accountError && (
            <div className="account-error">
              {accountError}
              <button onClick={() => setUser({ ...user })}>Retry</button>
            </div>
          )}
          <div className="organizer-tools">
            <div className="panel scan-panel">
              <div className="panel-icon">
                <ScanLine />
              </div>
              <div>
                <h3>Check someone in</h3>
                <p>
                  Paste the signed QR text, copied from any ticket, to validate
                  entry.
                </p>
              </div>
              <div className="scan-form">
                <input
                  value={scanCode}
                  onChange={(e) => setScanCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && scan()}
                  placeholder="Paste signed QR payload here"
                />
                <button
                  className="dark-btn"
                  disabled={busy || !scanCode}
                  onClick={scan}
                >
                  {busy ? (
                    <LoaderCircle className="spin" size={16} />
                  ) : (
                    <ScanLine size={16} />
                  )}{' '}
                  Scan ticket
                </button>
              </div>
              {scanResult && (
                <div
                  className={
                    'scan-result ' + (scanResult.valid ? 'good' : 'bad')
                  }
                >
                  <b>
                    {scanResult.valid
                      ? '✓ Valid ticket'
                      : '× ' + scanResult.message}
                  </b>
                  {scanResult.eventTitle && (
                    <span>
                      {scanResult.eventTitle} · {scanResult.attendeeName} ·{' '}
                      {scanResult.quantity} ticket · {scanResult.seatLabel}
                    </span>
                  )}
                </div>
              )}
            </div>
            <OrganizerOverview
              events={events.filter((e) => e.organizerId === user?.id)}
              bookings={bookings}
              loading={accountLoading}
              error={accountError}
              onRetry={() => setUser({ ...user })}
              onEdit={startEditEvent}
              onOpen={(booking) => {
                setSelected(booking);
                setModal('ticket');
              }}
            />
          </div>
        </main>
      )}
      {tab === 'profile' && user && (
        <Profile
          user={user}
          apiUrl={API}
          onUpdate={(profile) => {
            const updated = { ...user, ...profile };
            localStorage.setItem('lt-user', JSON.stringify(updated));
            setUser(updated);
          }}
          onLogout={loginOut}
          bookings={bookings}
          events={events}
          activityLoading={accountLoading}
          activityError={accountError}
          theme={theme}
          setTheme={setTheme}
          onTickets={() => setTab('tickets')}
        />
      )}
      {tab !== 'discover' && <Footer />}
      {modal && (
        <div
          className="overlay"
          onMouseDown={(e) => e.target === e.currentTarget && setModal('')}
        >
          <div className={'modal ' + (modal === 'event' ? 'event-modal' : '')}>
            <button
              className="close"
              onClick={() => {
                setModal('');
                setEditingEvent(null);
              }}
            >
              <X size={20} />
            </button>
            {modal === 'login' || modal === 'register' ? (
              <>
                <div className="modal-logo">
                  <span className="brandmark">
                    <QrCode size={18} />
                  </span>{' '}
                  local<span className="brand-light">tix</span>
                  <span className="brand-dot">.</span>
                </div>
                <div className="eyebrow muted">
                  {modal === 'login'
                    ? 'GOOD TO HAVE YOU BACK'
                    : 'YOUR CITY IS CALLING'}
                </div>
                <h2>
                  {modal === 'login' ? 'Welcome back.' : 'Find your people.'}
                </h2>
                <p className="modal-lede">
                  {modal === 'login'
                    ? 'Pick up where the good times left off.'
                    : 'Make an account and make a plan.'}
                </p>
                <form className="form" onSubmit={submitAuth}>
                  {modal === 'register' && (
                    <label>
                      Your name
                      <input
                        required
                        value={form.name}
                        onChange={(e) =>
                          setForm({ ...form, name: e.target.value })
                        }
                        placeholder="Alex Morgan"
                      />
                    </label>
                  )}
                  <label>
                    Email address
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                      placeholder="you@example.com"
                    />
                  </label>
                  <label>
                    Password
                    <input
                      type="password"
                      required
                      minLength="8"
                      value={form.password}
                      onChange={(e) =>
                        setForm({ ...form, password: e.target.value })
                      }
                      placeholder="At least 8 characters"
                    />
                  </label>
                  {modal === 'register' && (
                    <label>
                      I’m here as
                      <select
                        value={form.role}
                        onChange={(e) =>
                          setForm({ ...form, role: e.target.value })
                        }
                      >
                        <option value="CUSTOMER">A curious local</option>
                        <option value="ORGANIZER">An event organizer</option>
                      </select>
                    </label>
                  )}
                  <button className="dark-btn full" disabled={busy}>
                    {busy ? (
                      <LoaderCircle className="spin" size={16} />
                    ) : modal === 'login' ? (
                      'Log in'
                    ) : (
                      'Create my account'
                    )}{' '}
                    <ArrowRight size={15} />
                  </button>
                </form>
                <p className="switch-auth">
                  {modal === 'login'
                    ? 'New around here?'
                    : 'Already one of us?'}{' '}
                  <button
                    onClick={() =>
                      setModal(modal === 'login' ? 'register' : 'login')
                    }
                  >
                    {modal === 'login' ? 'Create an account' : 'Log in'}
                  </button>
                </p>
              </>
            ) : null}
            {modal === 'event' && selected && (
              <>
                <div
                  className="event-modal-photo"
                  style={{
                    backgroundImage: `url(${selected.imageUrl || fallbackEventImages[0]})`,
                  }}
                >
                  <span className="category-tag">{selected.category}</span>
                </div>
                <div className="event-modal-body">
                  <div className="eyebrow muted">A LOCAL THING TO LOVE</div>
                  <h2>{selected.title}</h2>
                  <p>{selected.description}</p>
                  <div className="event-facts">
                    <span>
                      <CalendarDays size={16} />
                      {date(selected.startsAt)} · {time(selected.startsAt)}
                    </span>
                    <span>
                      <MapPin size={16} />
                      {selected.venue}
                    </span>
                    <span>
                      <UserRound size={16} />
                      {selected.organizerName}
                    </span>
                  </div>
                  <div className="booking-bar">
                    <div>
                      <b>{money(selected.price)}</b>
                      <span>per person · {selected.available} left</span>
                    </div>
                    <label className="qty-select">
                      Qty{' '}
                      <select
                        value={qty}
                        onChange={(e) => setQty(+e.target.value)}
                      >
                        {Array.from(
                          {
                            length: Math.max(
                              0,
                              Math.min(10, selected.available),
                            ),
                          },
                          (_, i) => (
                            <option key={i} value={i + 1}>
                              {i + 1}
                            </option>
                          ),
                        )}
                      </select>
                      <ChevronDown size={14} />
                    </label>
                    <button
                      className="dark-btn"
                      disabled={busy || selected.available < 1}
                      onClick={book}
                    >
                      {busy ? (
                        <LoaderCircle className="spin" size={16} />
                      ) : (
                        <>
                          Book · {money(selected.price * qty)}{' '}
                          <ArrowRight size={15} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
            {modal === 'ticket' && selected && (
              <div className="ticket-modal">
                <div className="eyebrow muted">YOU’RE ON THE LIST</div>
                <div className="confirmed-icon">
                  <Check />
                </div>
                <h2>
                  {selected.status === 'CANCELLED'
                    ? 'Booking cancelled'
                    : 'Your entry tickets'}
                </h2>
                <p className="modal-lede">
                  Show each ticket QR at the door. Every ticket admits one
                  person.
                </p>
                <b className="ticket-event-title">{selected.eventTitle}</b>
                <span>
                  {selected.quantity}{' '}
                  {selected.quantity === 1 ? 'ticket' : 'tickets'} ·{' '}
                  {money(selected.total)}
                </span>
                <span>
                  {date(selected.startsAt)} · {selected.venue}
                </span>
                <div className="ticket-ref">BOOKING {selected.reference}</div>
                <TicketDownload booking={selected} onError={show} />
                {user?.role === 'CUSTOMER' && (
                  <BookingCancellation
                    key={selected.id}
                    booking={selected}
                    onCancel={cancelBooking}
                  />
                )}{' '}
                {selected.status === 'CANCELLED' ? (
                  <div className="cancelled-banner">
                    This booking was cancelled. These QR codes can’t be used for
                    entry.
                  </div>
                ) : (
                  <div className="ticket-qr-grid">
                    {(selected.tickets || []).map((t) => (
                      <div className="individual-ticket" key={t.id}>
                        <b>{t.seatLabel}</b>
                        <div className="qr-wrap">
                          <QRCodeSVG
                            value={t.qrPayload}
                            size={136}
                            level="H"
                            includeMargin
                          />
                        </div>
                        <details className="qr-text">
                          <summary>QR text</summary>
                          <code>{t.qrPayload}</code>
                        </details>
                        <small>
                          {t.status === 'CHECKED_IN'
                            ? 'ALREADY CHECKED IN'
                            : 'ONE PERSON · ONE ENTRY'}
                        </small>
                        {t.status !== 'CHECKED_IN' && (
                          <button
                            className="copy-qr"
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(
                                  t.qrPayload,
                                );
                                show('Signed QR copied for check-in');
                              } catch {
                                show(
                                  'Copy failed. Select and copy the QR text below.',
                                );
                              }
                            }}
                          >
                            Copy QR text
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <button className="dark-btn full" onClick={() => setModal('')}>
                  Lovely. Got it <Check size={16} />
                </button>
                <small>QR ENTRY PASS · EACH TICKET VALIDATED ONCE</small>
              </div>
            )}
            {modal === 'create-event' && (
              <>
                <div className="eyebrow muted">MAKE SOMETHING HAPPEN</div>
                <h2>
                  {editingEvent ? 'Give it a fresh spin.' : 'Put it out there.'}
                </h2>
                <p className="modal-lede">Your people are looking for you.</p>
                <form className="form" onSubmit={createEvent}>
                  <label>
                    Event name
                    <input
                      required
                      value={eventForm.title}
                      onChange={(e) =>
                        setEventForm({ ...eventForm, title: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Description
                    <textarea
                      rows="3"
                      value={eventForm.description}
                      onChange={(e) =>
                        setEventForm({
                          ...eventForm,
                          description: e.target.value,
                        })
                      }
                    />
                  </label>
                  <div className="form-split">
                    <label>
                      Category
                      <select
                        value={eventForm.category}
                        onChange={(e) =>
                          setEventForm({
                            ...eventForm,
                            category: e.target.value,
                          })
                        }
                      >
                        {categories.slice(1).map((c) => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Ticket price (₹)
                      <input
                        type="number"
                        min="0"
                        required
                        value={eventForm.price}
                        onChange={(e) =>
                          setEventForm({ ...eventForm, price: e.target.value })
                        }
                      />
                    </label>
                  </div>
                  <label>
                    Venue
                    <input
                      required
                      value={eventForm.venue}
                      onChange={(e) =>
                        setEventForm({ ...eventForm, venue: e.target.value })
                      }
                    />
                  </label>
                  <div className="form-split">
                    <label>
                      Date & time
                      <input
                        type="datetime-local"
                        required
                        value={eventForm.startsAt}
                        onChange={(e) =>
                          setEventForm({
                            ...eventForm,
                            startsAt: e.target.value,
                          })
                        }
                      />
                    </label>
                    <label>
                      Capacity
                      <input
                        type="number"
                        min="1"
                        required
                        value={eventForm.capacity}
                        onChange={(e) =>
                          setEventForm({
                            ...eventForm,
                            capacity: e.target.value,
                          })
                        }
                      />
                    </label>
                  </div>
                  <label>
                    Cover image URL
                    <input
                      value={eventForm.imageUrl}
                      onChange={(e) =>
                        setEventForm({ ...eventForm, imageUrl: e.target.value })
                      }
                      placeholder="https://…"
                    />
                  </label>
                  <button className="dark-btn full" disabled={busy}>
                    {busy ? (
                      <LoaderCircle className="spin" size={16} />
                    ) : editingEvent ? (
                      'Save changes'
                    ) : (
                      'Publish event'
                    )}{' '}
                    <ArrowRight size={15} />
                  </button>
                </form>
              </>
            )}
            {modal === 'menu' && (
              <div className="menu-modal">
                {user && (
                  <button
                    onClick={() => {
                      setTab('profile');
                      setModal('');
                    }}
                  >
                    My profile
                  </button>
                )}
                <button
                  onClick={() => {
                    setTab('discover');
                    setModal('');
                  }}
                >
                  Discover
                </button>
                <button
                  onClick={() => {
                    if (user) {
                      setTab('tickets');
                      setModal('');
                    } else setModal('login');
                  }}
                >
                  {user?.role === 'ORGANIZER' ? 'Guest list' : 'My tickets'}
                </button>
                {user?.role === 'ORGANIZER' && (
                  <button
                    onClick={() => {
                      setTab('organizer');
                      setModal('');
                    }}
                  >
                    Organizer
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      {toast && (
        <div className="toast" role="status">
          <Ticket size={18} aria-hidden="true" />
          {toast}
        </div>
      )}
    </div>
  );
}
export default App;
