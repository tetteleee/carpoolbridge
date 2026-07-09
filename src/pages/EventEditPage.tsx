import { Link, useParams } from "react-router-dom";

function EventEditPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="app-shell">
      <div className="panel">
        <div className="section-heading">
          <h1>イベント編集</h1>
          <Link className="secondary-button" to="/">
            ホームへ戻る
          </Link>
        </div>
        <p>イベント ID: {id ?? "未指定"}</p>
      </div>
    </div>
  );
}

export default EventEditPage;
