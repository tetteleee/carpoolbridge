import { useState, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { LoadingIndicator } from '../components/icons';
import { useAuth } from '../firebase/auth';
import { checkStaffUserRegistration } from '../services/auth/staffUserService';
import { AuthGuard } from '../routes/AuthGuard';
import { AppRoutes } from '../router';

/**
 * 自チーム版（Firestore）のアプリ全体シェル。
 * 匿名認証・staffUsers登録確認を行い、AuthGuardでルーティングを制御する。
 * ref: docs/06_認証・権限管理設計.md
 *
 * `@app-shell`エイリアス（vite.config.ts）経由でApp.tsxから使われ、
 * 通常ビルド（自チーム版）ではこのファイルが解決先になる。
 * ref: docs/10_DexieRepository実装設計.md#6 対象外（認証UI・ルーティングの公開版対応）
 */
export function AppShell() {
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
        <LoadingIndicator size={8} />
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
