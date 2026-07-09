import { Link, useParams } from "react-router-dom";

function DispatchPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="app-shell">
      <div className="panel">
        <div className="section-heading">
          <h1>配車画面</h1>
          <Link className="secondary-button" to={`/event/${id ?? ""}`}>
            イベント編集へ戻る
          </Link>
        </div>
        <p>この画面は今後の配車ロジック実装前の仮ページです。</p>
      </div>
    </div>
  );
}

export default DispatchPage;
