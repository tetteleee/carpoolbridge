import { useEffect, useMemo, useState } from 'react';
import type { CarCardData } from '../utils/carCard';
import type { UnassignedPerson } from '../components/carpool/UnassignedArea';
import type { PersonCardData } from '../components/carpool/PersonCard';
import {
  loadBoardMasterData,
  buildCarpoolBoardData,
  type BoardMasterData,
} from '../services/carpool/carpoolBoardData';
import { reconcileCarpools } from '../services/carpool/reconcileCarpools';
import type { Carpool, Direction } from '../types/event';

interface UseCarpoolBoardDataResult {
  /** 選択中タブ（行き／帰り）の未配車の人カード一覧 */
  unassignedPeople: UnassignedPerson[];
  /** 選択中タブ（行き／帰り）の配車不要（参加かつ送迎不要）の人カード一覧 */
  noRideNeededPeople: PersonCardData[];
  /** 選択中タブ（行き／帰り）の車カード一覧 */
  carCards: CarCardData[];
  /** 対象イベントの回答が1件もないかどうか（一部家庭のみ未回答の場合は含まない） */
  hasNoResponses: boolean;
  /** マスタ・回答データの取得中かどうか */
  loading: boolean;
  /** マスタ・回答データの取得に失敗した場合のエラーメッセージ */
  error: string | null;
}

/**
 * 配車画面（メイン）の未配車エリア・車カードに表示する実データを算出するフック。
 * ref: docs/04_画面設計.md#8 未配車エリア・車カード, docs/05_データ設計.md#9,#10
 *
 * T20のCarpool読み取り処理・マスタデータ（Family・Player・PickupLocation）・回答（Response）の
 * 取得と突き合わせ自体はservices/carpool/carpoolBoardData.tsに切り出しており、
 * 本フックはReactの状態管理（取得中・エラー・自動整合の副作用）を担う薄いラッパーとする。
 * 突き合わせ処理自体を方向を指定して呼び出せる形にしているのは、LINE共有の共有用画像生成
 * （行き・帰り両方向分が必要）でも同じ変換処理を再利用するため。
 *
 * @param eventId 対象のイベントID
 * @param direction 選択中タブ（行き／帰り）
 * @param carpools 選択中タブの配車結果（T20経由で取得済みのもの）
 * @param onCarpoolsReconciled 回答変更により対象外になったメンバーをCarpoolから取り除いた場合に呼び出す
 *   （呼び出し側でcarpoolsを再取得させ、除去結果を画面へ反映させるために使用する）
 */
export function useCarpoolBoardData(
  eventId: string | undefined,
  direction: Direction,
  carpools: Carpool[],
  onCarpoolsReconciled: () => void
): UseCarpoolBoardDataResult {
  const [masterData, setMasterData] = useState<BoardMasterData | null>(null);
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
        return loadBoardMasterData(eventId);
      })
      .then((data) => {
        if (!ignore) {
          setMasterData(data);
        }
      })
      .catch(() => {
        if (!ignore) {
          setError('配車画面のデータ取得に失敗しました');
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
  }, [eventId]);

  /**
   * 回答変更後の配車結果自動整合（回答編集画面での変更を、配車画面を開いたタイミングで反映する）。
   * 対象方向にCarpoolが1件も存在しない（自動配車が未実行の）場合は何もしない。
   * ref: 04_画面設計.md#8 画面を開いた際の自動整合
   */
  useEffect(() => {
    if (!eventId || !masterData || carpools.length === 0) {
      return;
    }

    let ignore = false;

    reconcileCarpools(eventId, direction, carpools, masterData).then((changed) => {
      if (!ignore && changed) {
        onCarpoolsReconciled();
      }
    });

    return () => {
      ignore = true;
    };
  }, [eventId, direction, carpools, masterData, onCarpoolsReconciled]);

  const boardData = useMemo(() => {
    if (!masterData) {
      return { unassignedPeople: [], noRideNeededPeople: [], carCards: [] };
    }
    return buildCarpoolBoardData(direction, carpools, masterData);
  }, [masterData, carpools, direction]);

  const hasNoResponses = masterData !== null && masterData.responseByFamilyId.size === 0;

  return { ...boardData, hasNoResponses, loading, error };
}
