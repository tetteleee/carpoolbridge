import { useState, useEffect } from 'react';
import './App.css';
import { useAuth } from './firebase/auth';
import { checkStaffUserRegistration } from './services/auth/staffUserService';
import { AuthGuard } from './routes/AuthGuard';

function App() {
  const { uid, loading: authLoading, error: authError } = useAuth();
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null);
  const [staffCheckLoading, setStaffCheckLoading] = useState(false);
  const [staffCheckError, setStaffCheckError] = useState<Error | null>(null);

  useEffect(() => {
    if (!uid) {
      return;
    }

    // staffUsers 登録確認（通常データは読み込まない）
    setStaffCheckLoading(true);
    setStaffCheckError(null);

    checkStaffUserRegistration(uid)
      .then((registered) => {
        setIsRegistered(registered);
      })
      .catch((err) => {
        setStaffCheckError(err instanceof Error ? err : new Error(String(err)));
        setIsRegistered(false);
      })
      .finally(() => {
        setStaffCheckLoading(false);
      });
  }, [uid]);

  const loading = authLoading || staffCheckLoading || (uid !== null && isRegistered === null);

  if (loading) {
    return (
      <div
        id="app-loading"
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100svh',
          flexDirection: 'column',
        }}
      >
        <p>読み込み中...</p>
      </div>
    );
  }

  const error = authError ?? staffCheckError;
  if (error) {
    return (
      <div
        id="app-error"
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100svh',
          flexDirection: 'column',
          color: 'red',
        }}
      >
        <p>エラーが発生しました</p>
        <pre>{error.message}</pre>
      </div>
    );
  }

  if (!uid) {
    return null;
  }

  return (
    <AuthGuard uid={uid} isRegistered={isRegistered ?? false}>
      {/* 登録済みユーザー向けのホーム画面（今後実装） */}
      <div
        id="home-placeholder"
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100svh',
          flexDirection: 'column',
        }}
      >
        <p>ホーム画面</p>
      </div>
    </AuthGuard>
  );
}

export default App;
