import React, { useMemo, useState } from "react";

const initialMeetings = [
  {
    id: 1,
    title: "Website kickoff",
    client: "Brightside Health",
    date: "2024-06-12",
    time: "10:00",
    type: "Call",
    duration: 60,
    status: "Scheduled",
  },
  {
    id: 2,
    title: "Animation review",
    client: "Northwind Labs",
    date: "2024-06-13",
    time: "14:30",
    type: "Review",
    duration: 45,
    status: "Confirmed",
  },
  {
    id: 3,
    title: "QA sync",
    client: "Tri-Tech Internal",
    date: "2024-06-14",
    time: "09:00",
    type: "Internal",
    duration: 30,
    status: "Scheduled",
  },
];

const dayBuckets = ["Mon", "Tue", "Wed", "Thu", "Fri"];

const formatTime = (value) => {
  if (!value) return "Time TBD";
  try {
    return new Date(`2000-01-01T${value}`).toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
};

const formatDateLabel = (value) => {
  if (!value) return "Date TBD";
  return new Date(value).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

export default function Schedule() {
  const [events, setEvents] = useState(initialMeetings);
  const [newEvent, setNewEvent] = useState({
    title: "",
    client: "",
    date: "",
    time: "",
    type: "Call",
    duration: 60,
    status: "Scheduled",
  });

  const upcomingEvents = useMemo(
    () =>
      events
        .slice()
        .sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0))
        .slice(0, 6),
    [events]
  );

  const dailyBuckets = useMemo(() => {
    return dayBuckets.map((day, index) => {
      const currentDate = new Date();
      const diff = index - currentDate.getDay() + 1; // align monday=1
      const dayDate = new Date(currentDate);
      dayDate.setDate(currentDate.getDate() + diff);
      const label = dayDate.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
      const dayEvents = events.filter((event) => {
        if (!event.date) return false;
        const eventDate = new Date(event.date);
        return eventDate.getDay() === dayDate.getDay();
      });
      return { day, label, events: dayEvents };
    });
  }, [events]);

  const stats = useMemo(() => {
    const confirmed = events.filter((event) => event.status === "Confirmed").length;
    const scheduled = events.filter((event) => event.status === "Scheduled").length;
    const callMinutes = events.reduce((sum, event) => sum + Number(event.duration || 0), 0);
    return {
      total: events.length,
      confirmed,
      scheduled,
      hours: (callMinutes / 60).toFixed(1),
    };
  }, [events]);

  const handleAddEvent = (event) => {
    event.preventDefault();
    if (!newEvent.title.trim()) return;
    setEvents((prev) => [
      {
        ...newEvent,
        id: Date.now(),
        title: newEvent.title.trim(),
        client: newEvent.client.trim() || "Client",
      },
      ...prev,
    ]);
    setNewEvent({
      title: "",
      client: "",
      date: "",
      time: "",
      type: "Call",
      duration: 60,
      status: "Scheduled",
    });
  };

  const handleUpdateStatus = (id, status) => {
    setEvents((prev) =>
      prev.map((event) => (event.id === id ? { ...event, status } : event))
    );
  };

  const handleRemoveEvent = (id) => {
    setEvents((prev) => prev.filter((event) => event.id !== id));
  };

  return (
    <div className="page-wrap schedule-page">
      <div className="container">
        <section className="schedule-hero">
          <div className="schedule-hero__content">
            <p className="eyebrow">Scheduling</p>
            <h1>Plan sprints, calls, and reviews</h1>
            <p className="muted hero-lede">
              Keep the whole week visible. Book meetings, track confirmations, and make sure every client touchpoint is covered.
            </p>
          </div>
          <div className="schedule-hero__stats">
            <div className="schedule-stat">
              <p className="muted small">Events</p>
              <strong>{stats.total}</strong>
            </div>
            <div className="schedule-stat">
              <p className="muted small">Confirmed</p>
              <strong>{stats.confirmed}</strong>
            </div>
            <div className="schedule-stat">
              <p className="muted small">Scheduled</p>
              <strong>{stats.scheduled}</strong>
            </div>
            <div className="schedule-stat">
              <p className="muted small">Hours booked</p>
              <strong>{stats.hours}</strong>
            </div>
          </div>
        </section>

        <section className="schedule-grid">
          <div className="schedule-card schedule-card--form">
            <header>
              <h2>Add to calendar</h2>
              <p className="muted small">Clients see clarity when you keep the cadence organized.</p>
            </header>
            <form className="schedule-form" onSubmit={handleAddEvent}>
              <label>
                <span>Title</span>
                <input
                  className="input control"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Design review"
                />
              </label>
              <label>
                <span>Client / Team</span>
                <input
                  className="input control"
                  value={newEvent.client}
                  onChange={(e) => setNewEvent((prev) => ({ ...prev, client: e.target.value }))}
                  placeholder="Client name"
                />
              </label>
              <label>
                <span>Date</span>
                <input
                  className="input control"
                  type="date"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent((prev) => ({ ...prev, date: e.target.value }))}
                />
              </label>
              <label>
                <span>Time</span>
                <input
                  className="input control"
                  type="time"
                  value={newEvent.time}
                  onChange={(e) => setNewEvent((prev) => ({ ...prev, time: e.target.value }))}
                />
              </label>
              <label>
                <span>Duration (mins)</span>
                <input
                  className="input control"
                  type="number"
                  min="15"
                  step="15"
                  value={newEvent.duration}
                  onChange={(e) =>
                    setNewEvent((prev) => ({ ...prev, duration: Number(e.target.value) }))
                  }
                />
              </label>
              <label>
                <span>Type</span>
                <select
                  className="input control"
                  value={newEvent.type}
                  onChange={(e) => setNewEvent((prev) => ({ ...prev, type: e.target.value }))}
                >
                  <option value="Call">Call</option>
                  <option value="Review">Review</option>
                  <option value="Internal">Internal</option>
                  <option value="Delivery">Delivery</option>
                </select>
              </label>
              <button className="btn btn-primary" type="submit">
                Add to schedule
              </button>
            </form>
          </div>

          <div className="schedule-card">
            <header>
              <h2>Upcoming</h2>
              <p className="muted small">Keep clients informed and avoid missed touchpoints.</p>
            </header>
            <ul className="schedule-list">
              {upcomingEvents.map((event) => (
                <li key={event.id}>
                  <div>
                    <strong>{event.title}</strong>
                    <span className="muted small">
                      {event.client} · {formatDateLabel(event.date)} · {formatTime(event.time)}
                    </span>
                  </div>
                  <div className="schedule-list__actions">
                    <select
                      className="input control"
                      value={event.status}
                      onChange={(e) => handleUpdateStatus(event.id, e.target.value)}
                    >
                      <option value="Scheduled">Scheduled</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Completed">Completed</option>
                    </select>
                    <button
                      type="button"
                      className="btn btn-ghost btn-small"
                      onClick={() => handleRemoveEvent(event.id)}
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
              {upcomingEvents.length === 0 && (
                <li>
                  <p className="muted">No events yet. Add one to get started.</p>
                </li>
              )}
            </ul>
          </div>
        </section>

        <section className="schedule-board">
          <div className="schedule-board__header">
            <h2>Week at a glance</h2>
            <p className="muted small">Drag events in your calendar app—but keep a reference here.</p>
          </div>
          <div className="schedule-board__grid">
            {dailyBuckets.map((bucket) => (
              <div className="schedule-day" key={bucket.day}>
                <div className="schedule-day__header">
                  <strong>{bucket.day}</strong>
                  <span className="muted small">{bucket.label}</span>
                </div>
                <div className="schedule-day__body">
                  {bucket.events.length === 0 ? (
                    <p className="muted small">No meetings</p>
                  ) : (
                    bucket.events.map((event) => (
                      <div className="schedule-day__event" key={event.id}>
                        <strong>{event.title}</strong>
                        <span className="muted small">
                          {formatTime(event.time)} · {event.client}
                        </span>
                        <span className={`schedule-pill schedule-pill--${event.status.toLowerCase()}`}>
                          {event.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
