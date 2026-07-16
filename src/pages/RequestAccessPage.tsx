import { RequestAccess } from '../components/RequestAccess';

interface RequestAccessPageProps {
  uid: string;
}

/**
 * 未登録ユーザー向けの利用申請ページ。
 * UIDを表示し、コピーボタンでクリップボードへコピーできる画面をレンダリングする。
 * Firestoreへのアクセスは行わない。
 */
export function RequestAccessPage({ uid }: RequestAccessPageProps) {
  return <RequestAccess uid={uid} />;
}
