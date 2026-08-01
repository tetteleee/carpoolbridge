import { useMemo } from 'react';
import { computeOccupantCount, type CarCardData } from '../utils/carCard';
import type { UnassignedPerson } from '../components/carpool/UnassignedArea';

interface UseCarpoolValidationResult {
  /** 定員超過の車が存在するかどうか */
  hasOverCapacityCar: boolean;
  /** 未配車の選手・コーチ・家族が存在するかどうか */
  hasUnassignedPerson: boolean;
  /** 未回答の選手・コーチ・家族が存在するかどうか */
  hasUnansweredPerson: boolean;
  /** いずれかの問題が存在するかどうか */
  hasWarning: boolean;
  /** 警告メッセージ（問題がない場合はnull。複数該当時は改行区切りで全件表示する） */
  message: string | null;
}

/**
 * 配車画面（メイン）の定員超過・未配車・未回答をリアルタイムに再判定するフック。
 * ref: docs/03_ユースケース.md#UC-05, docs/02_要件定義.md#14 配車修正機能, docs/07_配車アルゴリズム.md#6
 *
 * carCards・unassignedPeopleは人カードの移動（ドラッグ＆ドロップ）のたびに
 * useCarpoolBoardDataで再算出されるため、本フックもそのたびに再計算される。
 * unansweredCountはisParticipating（回答データそのもの）のみに基づくため、ドラッグ＆ドロップの
 * 影響は受けないが、回答編集画面での変更を反映するため同様にuseMemoの依存に含める。
 */
export function useCarpoolValidation(
  carCards: CarCardData[],
  unassignedPeople: UnassignedPerson[],
  unansweredCount: number
): UseCarpoolValidationResult {
  return useMemo(() => {
    const hasOverCapacityCar = carCards.some(
      (car) => computeOccupantCount(car) > car.capacity
    );
    const hasUnassignedPerson = unassignedPeople.length > 0;
    const hasUnansweredPerson = unansweredCount > 0;
    const hasWarning = hasOverCapacityCar || hasUnassignedPerson || hasUnansweredPerson;

    const phrases: string[] = [];
    if (hasOverCapacityCar) {
      phrases.push('定員超過の車があります');
    }
    if (hasUnassignedPerson) {
      phrases.push('未配車の選手がいます');
    }
    if (hasUnansweredPerson) {
      phrases.push(`未回答者が${unansweredCount}名います`);
    }

    const message = phrases.length > 0 ? phrases.join('\n') : null;

    return {
      hasOverCapacityCar,
      hasUnassignedPerson,
      hasUnansweredPerson,
      hasWarning,
      message,
    };
  }, [carCards, unassignedPeople, unansweredCount]);
}
