import { useMemo } from 'react';
import {
  computeOccupantCount,
  isCoachSeatOccupied,
  type CarCardData,
} from '../components/carpool/CarCard';
import type { UnassignedPerson } from '../components/carpool/UnassignedArea';

interface UseCarpoolValidationResult {
  /** 定員超過の車が存在するかどうか */
  hasOverCapacityCar: boolean;
  /** 運転者不在（参加コーチが自分の家庭の車に乗っていない）の車が存在するかどうか */
  hasMissingDriverCoach: boolean;
  /** 未配車の子供・コーチが存在するかどうか */
  hasUnassignedPerson: boolean;
  /** いずれかの問題が存在するかどうか */
  hasWarning: boolean;
  /** 警告メッセージ（問題がない場合はnull） */
  message: string | null;
}

/**
 * 配車画面（メイン）の定員超過・運転者不在・未配車をリアルタイムに再判定するフック。
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
      (car) => computeOccupantCount(car) > car.capacity
    );
    const hasMissingDriverCoach = carCards.some(
      (car) => car.expectedCoachPersonId !== null && !isCoachSeatOccupied(car)
    );
    const hasUnassignedPerson = unassignedPeople.length > 0;
    const hasWarning = hasOverCapacityCar || hasMissingDriverCoach || hasUnassignedPerson;

    const phrases: string[] = [];
    if (hasOverCapacityCar) {
      phrases.push('定員超過の車');
    }
    if (hasMissingDriverCoach) {
      phrases.push('運転者不在の車');
    }
    if (hasUnassignedPerson) {
      phrases.push('未配車の子供');
    }

    let message: string | null = null;
    if (phrases.length === 1 && hasUnassignedPerson) {
      message = `${phrases[0]}がいます`;
    } else if (phrases.length > 0) {
      message = `${phrases.join('と')}があります`;
    }

    return {
      hasOverCapacityCar,
      hasMissingDriverCoach,
      hasUnassignedPerson,
      hasWarning,
      message,
    };
  }, [carCards, unassignedPeople]);
}
