import { useMemo } from 'react';
import type { CarCardData } from '../components/carpool/CarCard';
import type { UnassignedPerson } from '../components/carpool/UnassignedArea';

interface UseCarpoolValidationResult {
  /** 定員超過の車が存在するかどうか */
  hasOverCapacityCar: boolean;
  /** 未配車の子供・コーチが存在するかどうか */
  hasUnassignedPerson: boolean;
  /** いずれかの問題が存在するかどうか */
  hasWarning: boolean;
  /** 警告メッセージ（問題がない場合はnull） */
  message: string | null;
}

/**
 * 配車画面（メイン）の定員超過・未配車をリアルタイムに再判定するフック。
 * ref: docs/03_ユースケース.md#UC-05, docs/02_要件定義.md#14 配車修正機能
 *
 * carCards・unassignedPeopleは人カードの移動（ドラッグ＆ドロップ）のたびに
 * useCarpoolBoardDataで再算出されるため、本フックもそのたびに再計算される。
 */
export function useCarpoolValidation(
  carCards: CarCardData[],
  unassignedPeople: UnassignedPerson[]
): UseCarpoolValidationResult {
  return useMemo(() => {
    const hasOverCapacityCar = carCards.some(
      (car) => car.members.length + 1 > car.capacity
    );
    const hasUnassignedPerson = unassignedPeople.length > 0;
    const hasWarning = hasOverCapacityCar || hasUnassignedPerson;

    let message: string | null = null;
    if (hasOverCapacityCar && hasUnassignedPerson) {
      message = '定員超過の車と未配車の子供があります';
    } else if (hasOverCapacityCar) {
      message = '定員超過の車があります';
    } else if (hasUnassignedPerson) {
      message = '未配車の子供がいます';
    }

    return { hasOverCapacityCar, hasUnassignedPerson, hasWarning, message };
  }, [carCards, unassignedPeople]);
}
