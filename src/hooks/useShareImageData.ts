import { useEffect, useState } from 'react';
import {
  loadBoardMasterData,
  buildCarpoolBoardData,
  type CarpoolBoardData,
} from '../services/carpool/carpoolBoardData';
import { getCarpools } from '../services/event/carpoolService';
import type { Direction } from '../types/event';

interface UseShareImageDataResult {
  /** 行き・帰り両方向分の表示用データ（未配車・配車不要・車カード） */
  boardDataByDirection: Record<Direction, CarpoolBoardData> | null;
  /** 取得中かどうか */
  loading: boolean;
  /** 取得に失敗した場合のエラーメッセージ */
  error: string | null;
}

/**
 * LINE共有の共有用画像生成に必要な、行き・帰り両方向分の表示用データを取得するフック。
 * 配車画面（メイン）のuseCarpoolBoardDataは選択中タブ1方向分のみを算出するのに対し、
 * 共有用画像は行き・帰りを1枚にまとめるため両方向分が必要になる（04_画面設計.md#9.2）。
 *
 * @param eventId 対象のイベントID
 * @param enabled trueの間のみ取得を行う（共有モーダルが開いている間だけ取得するため）
 */
export function useShareImageData(
  eventId: string | undefined,
  enabled: boolean
): UseShareImageDataResult {
  const [boardDataByDirection, setBoardDataByDirection] =
    useState<Record<Direction, CarpoolBoardData> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId || !enabled) {
      return;
    }

    let ignore = false;

    Promise.resolve()
      .then(() => {
        setLoading(true);
        setError(null);
        setBoardDataByDirection(null);
        return Promise.all([
          loadBoardMasterData(eventId),
          getCarpools(eventId, 'OUTWARD'),
          getCarpools(eventId, 'RETURN'),
        ]);
      })
      .then(([masterData, outwardCarpools, returnCarpools]) => {
        if (ignore) {
          return;
        }
        setBoardDataByDirection({
          OUTWARD: buildCarpoolBoardData('OUTWARD', outwardCarpools, masterData),
          RETURN: buildCarpoolBoardData('RETURN', returnCarpools, masterData),
        });
      })
      .catch(() => {
        if (!ignore) {
          setError('共有用画像のデータ取得に失敗しました');
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
  }, [eventId, enabled]);

  return { boardDataByDirection, loading, error };
}
