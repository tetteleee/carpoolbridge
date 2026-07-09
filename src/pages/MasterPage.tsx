import { Link } from "react-router-dom";

function MasterPage() {
  return (
    <div className="app-shell">
      <div className="panel">
        <div className="section-heading">
          <h1>マスタ管理</h1>
          <Link className="secondary-button" to="/">
            ホームへ戻る
          </Link>
        </div>
        <p>マスタ管理画面の骨格です。</p>
      </div>
    </div>
  );
}

export default MasterPage;
