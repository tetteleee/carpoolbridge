import { useState } from "react";

type EventItem = {
  id: number;
  date: string;
  weekday: string;
  title: string;
  location: string;
  status: string;
  passengers: string;
};

const events: EventItem[] = [
  {
    id: 1,
    date: "7/12",
    weekday: "土",
    title: "練習試合",
    location: "○○小学校",
    status: "配車未作成",
    passengers: "18人",
  },
  {
    id: 2,
    date: "7/19",
    weekday: "土",
    title: "通常練習",
    location: "△△スポーツセンター",
    status: "配車作成済み",
    passengers: "14人",
  },
  {
    id: 3,
    date: "7/26",
    weekday: "日",
    title: "公式戦",
    location: "□□球場",
    status: "確認待ち",
    passengers: "22人",
  },
];

function App() {
  const [selectedEventId, setSelectedEventId] = useState(events[0].id);

  const selectedEvent = events.find((event) => event.id === selectedEventId) ?? events[0];

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">配車アシスタント</p>
          <h1>ホーム</h1>
        </div>
        <button className="primary-button" type="button">
          + イベント作成
        </button>
      </header>

      <section className="panel">
        <div className="section-heading">
          <h2>今後のイベント</h2>
          <span>日付順</span>
        </div>

        <div className="event-list" role="list">
          {events.map((event) => {
            const isActive = event.id === selectedEvent.id;

            return (
              <button
                key={event.id}
                className={`event-card ${isActive ? "active" : ""}`}
                type="button"
                onClick={() => setSelectedEventId(event.id)}
              >
                <div className="event-date">
                  <strong>{event.date}</strong>
                  <span>({event.weekday})</span>
                </div>
                <div className="event-content">
                  <h3>{event.title}</h3>
                  <p>{event.location}</p>
                </div>
                <span className="event-status">{event.status}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="detail-card">
        <div className="detail-header">
          <p className="detail-date">
            {selectedEvent.date} ({selectedEvent.weekday})
          </p>
          <span className="status-pill">{selectedEvent.status}</span>
        </div>

        <h3>{selectedEvent.title}</h3>
        <p className="detail-location">{selectedEvent.location}</p>

        <div className="detail-metrics">
          <div>
            <span className="metric-label">乗車人数</span>
            <strong>{selectedEvent.passengers}</strong>
          </div>
          <div>
            <span className="metric-label">備考</span>
            <strong>集合場所確認中</strong>
          </div>
        </div>

        <div className="detail-actions">
          <button className="secondary-button" type="button">
            編集
          </button>
          <button className="primary-button" type="button">
            配車画面へ
          </button>
        </div>
      </section>
    </div>
  );
}

export default App;
