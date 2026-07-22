import { useState, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import './App.css';
import { useAuth } from './firebase/auth';
import { checkStaffUserRegistration } from './services/auth/staffUserService';
import { AuthGuard } from './routes/AuthGuard';
import { AppRoutes } from './router';

function App() {
  const { uid, loading: authLoading, error: authError } = useAuth();
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null);
  const [staffCheckError, setStaffCheckError] = useState<Error | null>(null);

  useEffect(() => {
    if (!uid) {
      return;
    }

    // staffUsers 登録確認（通常データは読み込まない）
    checkStaffUserRegistration(uid)
      .then((registered) => {
        setStaffCheckError(null);
        setIsRegistered(registered);
      })
      .catch((err) => {
        setStaffCheckError(err instanceof Error ? err : new Error(String(err)));
        setIsRegistered(false);
      });
  }, [uid]);

  const loading = authLoading || (uid !== null && isRegistered === null);

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
    <BrowserRouter>
      <AuthGuard uid={uid} isRegistered={isRegistered ?? false}>
        <AppRoutes />
      </AuthGuard>
    </BrowserRouter>
  );
}

export default App;
