import { useEffect, useState } from "react";
import { signInAnonymously, onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

type Status = "loading" | "not-staff" | "staff" | "error";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        // 初回アクセス時は匿名認証を行う
        try {
          await signInAnonymously(auth);
        } catch (e) {
          setStatus("error");
          setErrorMessage(String(e));
        }
        return;
      }

      setUser(currentUser);

      // staffUsers/{uid} の存在確認（Firestore Rulesにより、
      // 自分自身のドキュメントのgetだけは常に許可されている）
      try {
        const snap = await getDoc(doc(db, "staffUsers", currentUser.uid));
        setStatus(snap.exists() ? "staff" : "not-staff");
      } catch (e) {
        setStatus("error");
        setErrorMessage(String(e));
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div style={{ fontFamily: "sans-serif", padding: "2rem", maxWidth: 480, margin: "0 auto" }}>
      <h1>配車アシスタント（疎通確認）</h1>

      {status === "loading" && <p>接続中...</p>}

      {status === "error" && (
        <div>
          <p style={{ color: "red" }}>エラーが発生しました。</p>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: "0.8rem" }}>{errorMessage}</pre>
        </div>
      )}

      {status === "not-staff" && user && (
        <div>
          <p>匿名認証には成功しましたが、まだ利用申請が承認されていません。</p>
          <p>以下のUIDを管理者に伝え、staffUsersへの登録を依頼してください。</p>
          <pre
            style={{
              background: "#f0f0f0",
              padding: "0.5rem",
              wordBreak: "break-all",
              userSelect: "all",
            }}
          >
            {user.uid}
          </pre>
        </div>
      )}

      {status === "staff" && (
        <div>
          <p style={{ color: "green" }}>
            ✓ Firebase Hosting / Authentication / Firestore の疎通に成功しました。
          </p>
          <p>UID: {user?.uid}</p>
          <p>staffUsersに登録済みです。ここから画面実装を進めていきます。</p>
        </div>
      )}
    </div>
  );
}

export default App;
