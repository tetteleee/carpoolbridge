import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { addEvent } from "../mocks/eventStore";
import { mockDestinations } from "../mocks/destinations";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function CreateEventPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [date, setDate] = useState(today());
  const [destinationId, setDestinationId] = useState("");

  const isValid = name.trim() !== "" && date !== "";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;

    const destination = mockDestinations.find((d) => d.id === destinationId);

    addEvent({
      id: crypto.randomUUID(),
      name: name.trim(),
      date,
      destinationName: destination ? destination.name : "",
      status: "回答中",
    });

    navigate("/");
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">配車アシスタント</p>
          <h1>イベント作成</h1>
        </div>
      </header>

      <section className="panel">
        <Link to="/" className="back-link">← イベント一覧</Link>

        <form onSubmit={handleSubmit} className="create-event-form">
          <div className="form-field">
            <label htmlFor="event-name">イベント名</label>
            <input
              id="event-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例：練習試合"
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="event-date">日付</label>
            <input
              id="event-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="event-destination">目的地</label>
            <select
              id="event-destination"
              value={destinationId}
              onChange={(e) => setDestinationId(e.target.value)}
            >
              <option value="">（未選択）</option>
              {mockDestinations.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <button
            id="save-event-button"
            type="submit"
            className="primary-button"
            disabled={!isValid}
          >
            保存
          </button>
        </form>
      </section>
    </div>
  );
}

export default CreateEventPage;
