import { type ReactNode } from 'react';
import { RequestAccessPage } from '../pages/RequestAccessPage';

interface AuthGuardProps {
  /** 匿名認証で取得したUID */
  uid: string;
  /** staffUsers登録済みかどうか */
  isRegistered: boolean;
  /** 登録済みユーザーに表示するコンテンツ */
  children: ReactNode;
}

/**
 * staffUsers登録状態に基づいてルーティングを制御するガードコンポーネント。
 *
 * - 登録済みユーザー: childrenをレンダリングする（通常画面へアクセス可能）
 * - 未登録ユーザー: RequestAccessPageのみをレンダリングする（通常データは読み込まない）
 */
export function AuthGuard({ uid, isRegistered, children }: AuthGuardProps) {
  if (!isRegistered) {
    return <RequestAccessPage uid={uid} />;
  }

  return <>{children}</>;
}
