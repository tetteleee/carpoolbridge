import { Link } from "react-router-dom";
import { getEvents } from "../mocks/eventStore";
import { formatDateWithWeekday } from "../lib/date";
import type { Event } from "../types";


function HomePage() {
  const sortedEvents: Event[] = [...getEvents()].sort((a, b) => a.date.localeCompare(b.date));
  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">配車アシスタント</p>
          <h1>イベント一覧</h1>
        </div>
        <div className="topbar-actions">
          <Link className="secondary-button" to="/master">
            マスタ管理
          </Link>
          <Link className="primary-button" to="/events/new">
            + イベント作成
          </Link>
        </div>
      </header>

      <section className="panel">
        <div className="section-heading">
          <h2>今後のイベント</h2>
          <span>日付順</span>
        </div>

        <div className="event-list" role="list">
          {sortedEvents.map((event) => (
            <Link key={event.id} className="event-card" to={`/events/${event.id}/edit`}>
              <div className="event-date">
                <strong>{formatDateWithWeekday(event.date)}</strong>
              </div>
              <div className="event-content">
                <h3>{event.name}</h3>
                <p>{event.destinationName}</p>
              </div>
              <span className="event-status">{event.status}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

export default HomePage;
