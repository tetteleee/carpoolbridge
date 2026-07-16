import { useState, useEffect } from 'react';
import {
  signInAnonymously,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { auth } from '../firebase';

/**
 * Firebase Authenticationの匿名認証を初期化する。
 * 既にログイン済みの場合はそのユーザーを返し、未ログインの場合は匿名ログインを行います。
 */
export function initializeAuth(): Promise<User> {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        unsubscribe();
        if (user) {
          resolve(user);
        } else {
          try {
            const userCredential = await signInAnonymously(auth);
            resolve(userCredential.user);
          } catch (error) {
            reject(error);
          }
        }
      },
      (error) => {
        unsubscribe();
        reject(error);
      }
    );
  });
}

/**
 * 現在ログインしているユーザーのUIDを取得します。
 * 未ログインの場合はnullを返します。
 */
export function getCurrentUid(): string | null {
  return auth.currentUser?.uid ?? null;
}

/**
 * Reactコンポーネントで匿名認証の状態を取得・維持するためのカスタムフック。
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        if (currentUser) {
          setUser(currentUser);
          setLoading(false);
        } else {
          try {
            const credential = await signInAnonymously(auth);
            setUser(credential.user);
          } catch (err) {
            setError(err instanceof Error ? err : new Error(String(err)));
          } finally {
            setLoading(false);
          }
        }
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return {
    user,
    uid: user?.uid ?? null,
    loading,
    error,
  };
}
