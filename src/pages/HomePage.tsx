import { Link } from "react-router-dom";

type EventItem = {
  id: number;
  date: string;
  weekday: string;
  title: string;
  location: string;
  status: string;
};

const events: EventItem[] = [
  { id: 1, date: "7/12", weekday: "土", title: "練習試合", location: "○○小学校", status: "配車未作成" },
  { id: 2, date: "7/19", weekday: "土", title: "通常練習", location: "△△スポーツセンター", status: "配車作成済み" },
  { id: 3, date: "7/26", weekday: "日", title: "公式戦", location: "□□球場", status: "確認待ち" },
];

function HomePage() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">配車アシスタント</p>
          <h1>ホーム</h1>
        </div>
        <div className="topbar-actions">
          <Link className="secondary-button" to="/master">
            マスタ管理
          </Link>
          <button className="primary-button" type="button">
            + イベント作成
          </button>
        </div>
      </header>

      <section className="panel">
        <div className="section-heading">
          <h2>今後のイベント</h2>
          <span>日付順</span>
        </div>

        <div className="event-list" role="list">
          {events.map((event) => (
            <Link key={event.id} className="event-card" to={`/event/${event.id}`}>
              <div className="event-date">
                <strong>{event.date}</strong>
                <span>({event.weekday})</span>
              </div>
              <div className="event-content">
                <h3>{event.title}</h3>
                <p>{event.location}</p>
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
