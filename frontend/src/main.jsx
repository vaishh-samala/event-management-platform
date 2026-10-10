import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Search,
  Plus,
  CalendarDays,
  MapPin,
  Users,
  Ticket,
  ArrowUpRight,
  Bell,
  X,
  Clock,
  CheckCircle2,
  Filter,
  LayoutDashboard,
  CalendarRange,
  ChevronRight,
  Mail,
  Tag,
  Menu,
  Trash2,
  CheckCheck
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import './styles.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5003/api';
const money = n =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(Number(n || 0));
const dateFmt = s =>
  new Date(s).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
const timeFmt = s =>
  new Date(s).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
const categories = [
  'All',
  'Technology',
  'Community',
  'Music',
  'Business',
  'Education',
  'Arts'
];

function App() {
  const [events, setEvents] = useState([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [tab, setTab] = useState('Discover');
  const [selected, setSelected] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [registerEvent, setRegisterEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [summary, setSummary] = useState({});
  const [mobileMenu, setMobileMenu] = useState(false);
  const searchInputRef = useRef(null);

  // Keyboard shortcut: Cmd+K / Ctrl+K to focus search
  useEffect(() => {
    const handleKeyDown = e => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const [e, n, s] = await Promise.all([
        fetch(
          `${API}/events?q=${encodeURIComponent(query)}&category=${encodeURIComponent(
            category
          )}`
        ),
        fetch(`${API}/notifications`),
        fetch(`${API}/reports/summary`)
      ]);
      if (!e.ok) throw new Error('Could not load events');
      setEvents(await e.json());
      setNotifications(await n.json());
      setSummary(await s.json());
      setError('');
    } catch (err) {
      setError(
        'Could not connect to the API. Make sure the backend is running and PostgreSQL is connected.'
      );
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [query, category]);

  const notify = m => {
    setToast(m);
    setTimeout(() => setToast(''), 3500);
  };

  const openEvent = async id => {
    try {
      const [r, regs] = await Promise.all([
        fetch(`${API}/events/${id}`),
        fetch(`${API}/events/${id}/registrations`).catch(() => null)
      ]);
      if (!r.ok) throw Error();
      const eventData = await r.json();
      const attendeeList = regs && regs.ok ? await regs.json() : [];
      setSelected({ ...eventData, registrations: attendeeList });
    } catch {
      notify('Could not load event details');
    }
  };

  const cancelEvent = async id => {
    if (!window.confirm('Are you sure you want to cancel this event?')) return;
    try {
      const r = await fetch(`${API}/events/${id}`, { method: 'DELETE' });
      if (!r.ok) throw Error('Failed to cancel event');
      notify('Event cancelled successfully');
      setSelected(null);
      await load();
    } catch (err) {
      notify(err.message);
    }
  };

  const unread = notifications.filter(n => !n.is_read).length;
  const upcoming = useMemo(
    () => events.filter(e => e.status === 'published'),
    [events]
  );

  const submitCreate = async e => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const payload = Object.fromEntries(f.entries());
    payload.capacity = Number(payload.capacity);
    payload.price = Number(payload.price);
    try {
      const r = await fetch(`${API}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await r.json();
      if (!r.ok) throw Error(data.error || 'Could not create event');
      setShowCreate(false);
      notify('Event published successfully');
      setTab('Discover');
      await load();
    } catch (err) {
      notify(err.message);
    }
  };

  const submitRegister = async e => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const payload = Object.fromEntries(f.entries());
    payload.quantity = Number(payload.quantity);
    try {
      const r = await fetch(`${API}/events/${registerEvent.id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error || 'Registration failed');
      setRegisterEvent(null);
      setSelected(null);
      notify(`You're registered! Code: ${d.confirmation_code}`);
      await load();
    } catch (err) {
      notify(err.message);
    }
  };

  const markRead = async n => {
    await fetch(`${API}/notifications/${n.id}/read`, { method: 'PATCH' });
    setNotifications(old =>
      old.map(x => (x.id === n.id ? { ...x, is_read: true } : x))
    );
  };

  const markAllRead = async () => {
    const unreadList = notifications.filter(n => !n.is_read);
    await Promise.all(
      unreadList.map(n =>
        fetch(`${API}/notifications/${n.id}/read`, { method: 'PATCH' })
      )
    );
    setNotifications(old => old.map(x => ({ ...x, is_read: true })));
    notify('All notifications marked as read');
  };

  return (
    <div className="app">
      <aside className={`sidebar ${mobileMenu ? 'mobile-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark">
            <CalendarDays size={22} />
          </div>
          <span>
            gather<span className="brand-dot">.</span>
          </span>
        </div>
        <div className="workspace-label">WORKSPACE</div>
        <nav>
          {[
            { name: 'Discover', icon: Search },
            { name: 'My Events', icon: CalendarRange },
            { name: 'Dashboard', icon: LayoutDashboard }
          ].map(x => (
            <button
              key={x.name}
              className={`nav-item ${tab === x.name ? 'active' : ''}`}
              onClick={() => {
                setTab(x.name);
                setMobileMenu(false);
              }}
            >
              <x.icon size={18} />
              {x.name}
              {x.name === 'Discover' && (
                <span className="nav-count">{events.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-icon">✳</div>
            <strong>Make it an event.</strong>
            <p>Bring people together around something meaningful.</p>
            <button onClick={() => setShowCreate(true)}>
              Create an event <ArrowUpRight size={15} />
            </button>
          </div>
          <div className="profile">
            <div className="avatar">VS</div>
            <div className="profile-copy">
              <strong>Event Organizer</strong>
              <span>Free workspace</span>
            </div>
            <button
              className="more-button"
              aria-label="More options"
              onClick={() =>
                notify('gather. workspace · Logged in as Event Organizer')
              }
            >
              •••
            </button>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <button
            className="mobile-toggle icon-button"
            onClick={() => setMobileMenu(!mobileMenu)}
            aria-label="Toggle menu"
          >
            <Menu size={20} />
          </button>
          <div className="breadcrumb">
            Workspace <ChevronRight size={14} />
            <strong>{tab}</strong>
          </div>
          <div className="top-actions">
            <div className="searchbox">
              <Search size={17} />
              <input
                ref={searchInputRef}
                placeholder="Search events..."
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
              <kbd>⌘ K</kbd>
            </div>
            <button
              className="icon-button notification-button"
              onClick={() => setShowNotifications(!showNotifications)}
              aria-label="Notifications"
            >
              <Bell size={19} />
              {unread > 0 && <i />}
            </button>
            <button className="create-button" onClick={() => setShowCreate(true)}>
              <Plus size={17} /> Create event
            </button>
          </div>
          {showNotifications && (
            <div className="notification-popover">
              <div className="popover-head">
                <strong>Notifications</strong>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {unread > 0 && (
                    <button
                      className="mark-all-btn"
                      onClick={markAllRead}
                      title="Mark all as read"
                    >
                      <CheckCheck size={14} style={{ verticalAlign: 'middle' }} /> Mark read
                    </button>
                  )}
                  <button
                    onClick={() => setShowNotifications(false)}
                    aria-label="Close notifications"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
              {notifications.length === 0 ? (
                <p className="empty-small">You're all caught up.</p>
              ) : (
                notifications.slice(0, 10).map(n => (
                  <button
                    className={`notification-row ${n.is_read ? 'read' : ''}`}
                    key={n.id}
                    onClick={() => markRead(n)}
                  >
                    <span className="notification-dot" />
                    <span>
                      <strong>{n.title}</strong>
                      <small>{n.message}</small>
                      <em>{dateFmt(n.created_at)}</em>
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </header>

        <div className="content">
          {tab === 'Discover' ? (
            <>
              <section className="hero">
                <div className="hero-content">
                  <div className="eyebrow">
                    <span className="live-dot" /> YOUR NEXT GREAT EXPERIENCE STARTS
                    HERE
                  </div>
                  <h1>
                    Good things happen
                    <br />
                    when we <span>gather.</span>
                  </h1>
                  <p>
                    Find your people. Learn something new. Make a memory.
                    <br className="desktop-only" /> Discover experiences worth
                    showing up for.
                  </p>
                  <div className="hero-actions">
                    <button
                      className="hero-primary"
                      onClick={() =>
                        document
                          .getElementById('events-section')
                          ?.scrollIntoView({ behavior: 'smooth' })
                      }
                    >
                      Explore events <ArrowUpRight size={17} />
                    </button>
                    <button
                      className="hero-secondary"
                      onClick={() => setShowCreate(true)}
                    >
                      Host an event
                    </button>
                  </div>
                  <div className="hero-meta">
                    <div className="avatar-stack">
                      <i>R</i>
                      <i>A</i>
                      <i>M</i>
                      <i>+</i>
                    </div>
                    <span>
                      <strong>{summary.registrations || '0'}</strong>{' '}
                      registrations and counting
                    </span>
                  </div>
                </div>
                <div className="hero-art">
                  <div className="art-orbit orbit-one" />
                  <div className="art-orbit orbit-two" />
                  <div className="art-sun" />
                  <div className="art-card card-top">
                    <span>✦</span>
                    <div>
                      <b>Ideas worth sharing</b>
                      <small>Community · Learning</small>
                    </div>
                  </div>
                  <div className="art-card card-bottom">
                    <div className="mini-avatars">
                      <i>J</i>
                      <i>K</i>
                      <i>S</i>
                    </div>
                    <div>
                      <b>Find your people</b>
                      <small>Real connections, offline</small>
                    </div>
                  </div>
                  <div className="art-ticket">
                    <Ticket size={25} />
                    <span>
                      YOUR NEXT
                      <br />
                      <b>CHAPTER</b>
                    </span>
                  </div>
                </div>
                <div className="hero-grain" />
              </section>

              <section className="stats-strip">
                <div>
                  <span className="stat-icon purple">
                    <CalendarDays size={17} />
                  </span>
                  <span>
                    <strong>
                      {summary.upcoming_events ?? events.length}
                    </strong>
                    <small>Upcoming events</small>
                  </span>
                </div>
                <div>
                  <span className="stat-icon green">
                    <Users size={17} />
                  </span>
                  <span>
                    <strong>{summary.registrations || 0}</strong>
                    <small>Registrations</small>
                  </span>
                </div>
                <div>
                  <span className="stat-icon orange">
                    <Ticket size={17} />
                  </span>
                  <span>
                    <strong>{summary.tickets_sold || 0}</strong>
                    <small>Tickets reserved</small>
                  </span>
                </div>
                <div className="stats-note">
                  <span className="live-dot" /> New experiences added regularly
                </div>
              </section>

              <section id="events-section" className="events-section">
                <div className="section-heading">
                  <div>
                    <div className="eyebrow muted">CURATED FOR YOU</div>
                    <h2>
                      Find your next <span>thing.</span>
                    </h2>
                    <p>Little moments. Big ideas. Your calendar, upgraded.</p>
                  </div>
                  <button
                    className="view-all"
                    onClick={() => {
                      setCategory('All');
                      setQuery('');
                    }}
                  >
                    View all events <ArrowUpRight size={16} />
                  </button>
                </div>
                <div className="filter-row">
                  <div className="category-pills">
                    {categories.map(c => (
                      <button
                        key={c}
                        onClick={() => setCategory(c)}
                        className={category === c ? 'selected' : ''}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                  <button
                    className="filter-button"
                    onClick={() =>
                      setCategory(category === 'All' ? 'Technology' : 'All')
                    }
                  >
                    <Filter size={15} /> Filter
                  </button>
                </div>

                {error && (
                  <div className="error-banner">
                    {error}
                    <button onClick={load}>Retry</button>
                  </div>
                )}
                {loading ? (
                  <div className="loading-grid">
                    {[1, 2, 3].map(x => (
                      <div className="skeleton" key={x} />
                    ))}
                  </div>
                ) : upcoming.length === 0 ? (
                  <div className="empty-state">
                    <CalendarDays size={34} />
                    <h3>No events found</h3>
                    <p>Try another category or create the first event.</p>
                    <button
                      className="create-button"
                      onClick={() => setShowCreate(true)}
                    >
                      <Plus size={16} /> Create event
                    </button>
                  </div>
                ) : (
                  <div className="event-grid">
                    {upcoming.map((ev, i) => (
                      <EventCard
                        key={ev.id}
                        event={ev}
                        index={i}
                        onClick={() => openEvent(ev.id)}
                      />
                    ))}
                  </div>
                )}
              </section>

              <section className="bottom-cta">
                <div className="cta-symbol">✳</div>
                <div>
                  <h3>Have something worth gathering for?</h3>
                  <p>
                    From a small meetup to a big idea, give it a place on the
                    calendar.
                  </p>
                </div>
                <button onClick={() => setShowCreate(true)}>
                  Bring it to life <ArrowUpRight size={16} />
                </button>
              </section>
            </>
          ) : tab === 'Dashboard' ? (
            <Dashboard summary={summary} events={events} />
          ) : (
            <MyEvents
              events={events}
              onOpen={openEvent}
              onCreate={() => setShowCreate(true)}
            />
          )}
        </div>
        <footer>
          <span>© 2026 gather. Made for moments that matter.</span>
          <span>
            <i className="live-dot" /> All systems operational
          </span>
        </footer>
      </main>

      {showCreate && (
        <Modal
          title="Create an event"
          subtitle="Give people a reason to get together."
          onClose={() => setShowCreate(false)}
        >
          <form className="form-grid" onSubmit={submitCreate}>
            <label className="full">
              Event name
              <input
                name="title"
                placeholder="e.g. Product & Design Meetup"
                required
                maxLength="180"
              />
            </label>
            <label className="full">
              Description
              <textarea
                name="description"
                placeholder="What will guests experience?"
                rows="3"
              />
            </label>
            <label>
              Category
              <select name="category">
                {categories.slice(1).map(c => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label>
              Organizer
              <input
                name="organizer"
                placeholder="Your name or team"
                defaultValue="Event Organizer"
              />
            </label>
            <label className="full">
              Venue
              <input name="venue" placeholder="Venue name or online" required />
            </label>
            <label>
              City
              <input name="city" defaultValue="Hyderabad" required />
            </label>
            <label>
              Capacity
              <input
                name="capacity"
                type="number"
                min="1"
                defaultValue="100"
                required
              />
            </label>
            <label>
              Starts at
              <input name="starts_at" type="datetime-local" required />
            </label>
            <label>
              Ends at
              <input name="ends_at" type="datetime-local" required />
            </label>
            <label>
              Ticket price (₹)
              <input
                name="price"
                type="number"
                min="0"
                step="1"
                defaultValue="0"
                required
              />
            </label>
            <div className="form-actions full">
              <button
                type="button"
                className="cancel-button"
                onClick={() => setShowCreate(false)}
              >
                Cancel
              </button>
              <button className="create-button" type="submit">
                <Plus size={16} /> Publish event
              </button>
            </div>
          </form>
        </Modal>
      )}

      {selected && (
        <Modal
          title={selected.title}
          subtitle={`${selected.category} · Hosted by ${selected.organizer}`}
          onClose={() => setSelected(null)}
          wide
        >
          <div className="event-detail">
            <div className={`detail-banner art-${(selected.id % 4) + 1}`}>
              <span>{selected.category}</span>
              <CalendarDays size={42} />
            </div>
            <p className="detail-description">
              {selected.description ||
                'Join us for a memorable experience with the community.'}
            </p>
            <div className="detail-facts">
              <div>
                <CalendarDays />
                <span>
                  <b>{dateFmt(selected.starts_at)}</b>
                  <small>
                    {timeFmt(selected.starts_at)} – {timeFmt(selected.ends_at)}
                  </small>
                </span>
              </div>
              <div>
                <MapPin />
                <span>
                  <b>{selected.venue}</b>
                  <small>{selected.city}</small>
                </span>
              </div>
              <div>
                <Users />
                <span>
                  <b>
                    {Math.max(
                      0,
                      selected.capacity - selected.tickets_sold
                    )}{' '}
                    spots left
                  </b>
                  <small>{selected.tickets_sold} tickets reserved</small>
                </span>
              </div>
              <div>
                <Ticket />
                <span>
                  <b>
                    {Number(selected.price) === 0
                      ? 'Free'
                      : money(selected.price)}
                  </b>
                  <small>Per ticket</small>
                </span>
              </div>
            </div>

            {selected.agenda?.length > 0 && (
              <div className="agenda">
                <h3>Event schedule</h3>
                {selected.agenda.map(a => (
                  <div key={a.id}>
                    <span>{timeFmt(a.starts_at)}</span>
                    <b>{a.title}</b>
                    <small>{a.speaker}</small>
                  </div>
                ))}
              </div>
            )}

            {selected.registrations?.length > 0 && (
              <div className="attendees-section">
                <h3>
                  <span>Registered Attendees</span>
                  <span className="attendee-badge">
                    {selected.registrations.length} registered
                  </span>
                </h3>
                <div className="attendees-list">
                  {selected.registrations.map(reg => (
                    <div className="attendee-item" key={reg.id}>
                      <span>
                        <b>{reg.attendee_name}</b>
                        <small>{reg.attendee_email}</small>
                      </span>
                      <div style={{ textAlign: 'right' }}>
                        <span className="attendee-badge">
                          {reg.quantity}x {reg.ticket_type}
                        </span>
                        <small
                          style={{
                            display: 'block',
                            color: '#8c95a2',
                            marginTop: '2px',
                            fontSize: '9px'
                          }}
                        >
                          Code: {reg.confirmation_code}
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="detail-actions">
              {selected.capacity - selected.tickets_sold > 0 ? (
                <button
                  className="create-button full-button"
                  onClick={() => setRegisterEvent(selected)}
                >
                  <Ticket size={17} /> Register for event
                </button>
              ) : (
                <button className="create-button full-button disabled-button" disabled>
                  Sold out
                </button>
              )}
              <button
                className="danger-button"
                onClick={() => cancelEvent(selected.id)}
                title="Cancel this event"
              >
                <Trash2 size={15} /> Cancel event
              </button>
            </div>
          </div>
        </Modal>
      )}

      {registerEvent && (
        <Modal
          title="Reserve your spot"
          subtitle={registerEvent.title}
          onClose={() => setRegisterEvent(null)}
        >
          <form className="form-grid" onSubmit={submitRegister}>
            <label className="full">
              Full name
              <input name="attendee_name" placeholder="Your name" required />
            </label>
            <label className="full">
              Email address
              <input
                name="attendee_email"
                type="email"
                placeholder="you@example.com"
                required
              />
            </label>
            <label>
              Ticket type
              <select name="ticket_type">
                <option>General</option>
                <option>Student</option>
                <option>VIP</option>
              </select>
            </label>
            <label>
              Quantity
              <input
                name="quantity"
                type="number"
                min="1"
                max="10"
                defaultValue="1"
                required
              />
            </label>
            <div className="registration-note full">
              <CheckCircle2 size={17} />{' '}
              {Number(registerEvent.price) === 0
                ? 'Free registration. No payment required.'
                : `${money(
                    registerEvent.price
                  )} per ticket. Demo only — payment is not processed.`}
            </div>
            <div className="form-actions full">
              <button
                type="button"
                className="cancel-button"
                onClick={() => setRegisterEvent(null)}
              >
                Cancel
              </button>
              <button type="submit" className="create-button">
                Confirm registration <ArrowUpRight size={16} />
              </button>
            </div>
          </form>
        </Modal>
      )}

      {toast && (
        <div className="toast">
          <CheckCircle2 size={18} />
          {toast}
        </div>
      )}
    </div>
  );
}

function EventCard({ event, index, onClick }) {
  const colors = ['violet', 'orange', 'teal', 'rose'];
  const icons = ['✳', '◉', '✦', '♫'];
  return (
    <button className="event-card" onClick={onClick}>
      <div className={`event-cover ${colors[index % 4]}`}>
        <span className="cover-category">{event.category}</span>
        <span className="cover-symbol">{icons[index % 4]}</span>
        <span className="cover-date">
          <b>
            {new Date(event.starts_at).toLocaleDateString('en-US', {
              day: '2-digit'
            })}
          </b>
          <small>
            {new Date(event.starts_at)
              .toLocaleDateString('en-US', { month: 'short' })
              .toUpperCase()}
          </small>
        </span>
        <div className="cover-decoration deco-one" />
        <div className="cover-decoration deco-two" />
      </div>
      <div className="event-card-body">
        <div className="event-card-title">
          <h3>{event.title}</h3>
          <span className="card-arrow">
            <ArrowUpRight size={17} />
          </span>
        </div>
        <p className="event-excerpt">
          {event.description || 'An experience worth adding to your calendar.'}
        </p>
        <div className="event-info">
          <span>
            <Clock size={14} />
            {timeFmt(event.starts_at)}
          </span>
          <span>
            <MapPin size={14} />
            {event.city}
          </span>
        </div>
        <div className="event-card-bottom">
          <div className="attendee-count">
            <span className="tiny-avatars">
              <i>A</i>
              <i>R</i>
              <i>+</i>
            </span>
            <small>{event.tickets_sold || 0} going</small>
          </div>
          <strong>
            {Number(event.price) === 0 ? 'Free' : money(event.price)}
          </strong>
        </div>
      </div>
    </button>
  );
}

function Modal({ title, subtitle, onClose, children, wide }) {
  return (
    <div
      className="modal-backdrop"
      onMouseDown={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section className={`modal ${wide ? 'wide' : ''}`}>
        <div className="modal-heading">
          <div>
            <h2>{title}</h2>
            <p>{subtitle}</p>
          </div>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={19} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

function Dashboard({ summary, events }) {
  const data = (summary.categories || []).map(c => ({
    name: c.category,
    count: c.count
  }));
  return (
    <div className="dashboard-page">
      <div className="eyebrow muted">YOUR WORKSPACE</div>
      <h2>Dashboard overview</h2>
      <p className="page-subtitle">
        A quick look at the community you're bringing together.
      </p>
      <div className="dashboard-metrics">
        <Metric
          icon={<CalendarDays />}
          label="Published events"
          value={summary.upcoming_events || 0}
        />
        <Metric
          icon={<Users />}
          label="Registrations"
          value={summary.registrations || 0}
        />
        <Metric
          icon={<Ticket />}
          label="Tickets reserved"
          value={summary.tickets_sold || 0}
        />
        <Metric
          icon={<Tag />}
          label="Gross ticket value"
          value={money(summary.gross_ticket_value)}
        />
      </div>
      <div className="report-grid">
        <section className="report-panel">
          <h3>Events by category</h3>
          <p>Published event distribution</p>
          {data.length ? (
            <ResponsiveContainer width="100%" height={270}>
              <BarChart
                data={data}
                margin={{ top: 10, right: 10, left: -22, bottom: 4 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#edf0f4"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#758096', fontSize: 12 }}
                />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#758096', fontSize: 12 }}
                />
                <Tooltip />
                <Bar dataKey="count" fill="#7666d9" radius={[7, 7, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-small">
              Create events to see category reports.
            </div>
          )}
        </section>
        <section className="report-panel">
          <h3>Recently listed</h3>
          <p>Upcoming published events</p>
          {events.slice(0, 5).map(e => (
            <div className="recent-event" key={e.id}>
              <span className="recent-date">
                <b>
                  {new Date(e.starts_at).toLocaleDateString('en-US', {
                    day: '2-digit'
                  })}
                </b>
                <small>
                  {new Date(e.starts_at)
                    .toLocaleDateString('en-US', { month: 'short' })
                    .toUpperCase()}
                </small>
              </span>
              <span>
                <b>{e.title}</b>
                <small>
                  {e.city} · {e.category}
                </small>
              </span>
              <strong>{e.tickets_sold || 0} going</strong>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

function Metric({ icon, label, value }) {
  return (
    <div className="metric-card">
      <span className="metric-icon">{icon}</span>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>Current totals</small>
    </div>
  );
}

function MyEvents({ events, onOpen, onCreate }) {
  return (
    <div className="dashboard-page">
      <div className="eyebrow muted">YOUR CALENDAR</div>
      <div className="my-events-heading">
        <div>
          <h2>My events</h2>
          <p className="page-subtitle">Manage your upcoming event lineup.</p>
        </div>
        <button className="create-button" onClick={onCreate}>
          <Plus size={16} /> Create event
        </button>
      </div>
      {events.length ? (
        <div className="my-event-list">
          {events.map(e => (
            <button
              key={e.id}
              onClick={() => onOpen(e.id)}
              className="my-event-row"
            >
              <span className="recent-date">
                <b>
                  {new Date(e.starts_at).toLocaleDateString('en-US', {
                    day: '2-digit'
                  })}
                </b>
                <small>
                  {new Date(e.starts_at)
                    .toLocaleDateString('en-US', { month: 'short' })
                    .toUpperCase()}
                </small>
              </span>
              <span className="my-event-copy">
                <b>{e.title}</b>
                <small>
                  <MapPin size={13} />
                  {e.venue}, {e.city} · {timeFmt(e.starts_at)}
                </small>
              </span>
              <span className="my-event-status">{e.status || 'Published'}</span>
              <ChevronRight size={18} />
            </button>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <CalendarDays size={34} />
          <h3>No events yet</h3>
          <p>Create your first event to get started.</p>
          <button className="create-button" onClick={onCreate}>
            <Plus size={16} /> Create event
          </button>
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
