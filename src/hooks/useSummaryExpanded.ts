import { useCallback, useState } from 'react';

/** サマリー帯の開閉状態を、この端末のlocalStorageに保存するキー */
const SUMMARY_EXPANDED_KEY = 'carpoolSummaryExpanded';

interface UseSummaryExpandedResult {
  /** サマリー帯（チップ部分）の開閉状態 */
  expanded: boolean;
  /** 開閉状態を反転し、この端末に保存する */
  toggleExpanded: () => void;
}

function loadInitialExpanded(): boolean {
  try {
    const saved = localStorage.getItem(SUMMARY_EXPANDED_KEY);
    return saved === null ? true : saved === 'true';
  } catch {
    // プライベートブラウジング等でlocalStorageが使えない場合は常に表示から始める
    return true;
  }
}

/**
 * 配車画面（メイン）のサマリー帯の開閉状態を、この端末のlocalStorageに保存・復元するフック。
 * イベント・行き／帰りタブをまたいだ、端末ごとの1つの状態として扱う。
 * ref: docs/04_画面設計.md#8 配車サマリー帯
 */
export function useSummaryExpanded(): UseSummaryExpandedResult {
  const [expanded, setExpanded] = useState(loadInitialExpanded);

  const toggleExpanded = useCallback(() => {
    setExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SUMMARY_EXPANDED_KEY, String(next));
      } catch {
        // 保存に失敗しても、今回の開閉動作自体は継続する
      }
      return next;
    });
  }, []);

  return { expanded, toggleExpanded };
}
