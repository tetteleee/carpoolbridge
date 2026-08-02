import { useState } from 'react';

/** 初回利用ガイドを表示済みかどうかを、この端末のlocalStorageに保存するキー */
const TUTORIAL_SEEN_KEY = 'tutorialSeen';

interface UseTutorialGuideResult {
  /** 初回利用ガイドを表示するかどうか */
  show: boolean;
  /** ガイドを閉じる（スキップ・最終ステップ完了のどちらも同じ扱い） */
  dismiss: () => void;
}

function hasSeenTutorial(): boolean {
  try {
    return localStorage.getItem(TUTORIAL_SEEN_KEY) !== null;
  } catch {
    // プライベートブラウジング等でlocalStorageが使えない場合は表示しない
    return true;
  }
}

/**
 * 初回利用ガイド（チュートリアル）の自動表示要否を判定するフック。
 * この端末で一度でも閉じていればtrueは返さない。ホーム画面の？ボタンからの
 * 手動再表示はこのフックの外（呼び出し側のローカルstate）で扱う。
 * ref: docs/04_画面設計.md#5 ホーム（イベント一覧）
 */
export function useTutorialGuide(): UseTutorialGuideResult {
  const [show, setShow] = useState(() => !hasSeenTutorial());

  const dismiss = () => {
    setShow(false);
    try {
      localStorage.setItem(TUTORIAL_SEEN_KEY, 'true');
    } catch {
      // 保存に失敗しても、今回のセッションで閉じる動作自体は継続する
    }
  };

  return { show, dismiss };
}
