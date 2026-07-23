import { useEffect, useState } from 'react';
import { getCarpools } from '../services/event/carpoolService';
import type { Carpool, Direction } from '../types/event';

interface UseCarpoolDirectionResult {
  /** 現在選択中の方向（行き／帰り） */
  direction: Direction;
  /** タブ切り替え時に呼び出す */
  setDirection: (direction: Direction) => void;
  /** 選択中タブの配車結果 */
  carpools: Carpool[];
  /** 行き・帰りそれぞれの配車結果（独立して保持） */
  carpoolsByDirection: Record<Direction, Carpool[]>;
  /** 選択中タブの配車結果の取得中かどうか */
  loading: boolean;
  /** 配車結果の取得に失敗した場合のエラーメッセージ */
  error: string | null;
}

/**
 * 配車画面（メイン）の「行き」「帰り」タブの選択状態を管理するフック。
 *
 * 行き・帰りの配車結果はdirectionごとに独立したstateとして保持するため、
 * 一方のタブで取得したデータがもう一方に影響することはない。
 * タブが選択される（または対象イベントが変わる）たびに、
 * そのタブのdirectionを指定してT20のCarpool読み取り処理を呼び出す。
 *
 * @param eventId 対象のイベントID
 */
export function useCarpoolDirection(
  eventId: string | undefined
): UseCarpoolDirectionResult {
  const [direction, setDirection] = useState<Direction>('OUTWARD');
  const [carpoolsByDirection, setCarpoolsByDirection] = useState<
    Record<Direction, Carpool[]>
  >({ OUTWARD: [], RETURN: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) {
      return;
    }

    let ignore = false;

    Promise.resolve()
      .then(() => {
        setLoading(true);
        setError(null);
        return getCarpools(eventId, direction);
      })
      .then((carpools) => {
        if (ignore) {
          return;
        }
        setCarpoolsByDirection((prev) => ({ ...prev, [direction]: carpools }));
      })
      .catch(() => {
        if (!ignore) {
          setError('配車結果の取得に失敗しました');
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [eventId, direction]);

  return {
    direction,
    setDirection,
    carpools: carpoolsByDirection[direction],
    carpoolsByDirection,
    loading,
    error,
  };
}
