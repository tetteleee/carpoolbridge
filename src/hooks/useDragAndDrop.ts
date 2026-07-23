import { useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { CarpoolMember } from '../types/event';
import type { PersonCardData } from '../components/carpool/PersonCard';

/** 長押し判定の待機時間（ミリ秒）。この時間ポインターを動かさず押し続けるとドラッグを開始する */
const LONG_PRESS_MS = 400;
/** 長押し確定前にこの距離（px）を超えて指が動いた場合はタップ・スクロール操作とみなしキャンセルする */
const MOVE_CANCEL_THRESHOLD_PX = 10;

/** ドラッグ中の情報 */
export interface DragState {
  /** ドラッグ中の人カードのID（PersonCardData.id） */
  personId: string;
  /** ドラッグ中の人物の表示名（フローティング表示用） */
  personName: string;
  /** ドラッグ中の人物の乗車メンバー情報（移動先の配車結果データへの反映に使用） */
  member: CarpoolMember;
  /** ドラッグ元のドロップゾーンID（未配車エリア、またはCarpool.id） */
  sourceZoneId: string;
  /** 現在のポインター座標（フローティング表示用） */
  x: number;
  y: number;
}

/** ドロップが確定した時の移動内容 */
export interface DropResult {
  member: CarpoolMember;
  sourceZoneId: string;
  targetZoneId: string;
}

interface UseDragAndDropOptions {
  /** ドロップが確定した時に呼び出す（移動元・移動先のドロップゾーンが異なる場合のみ呼び出される） */
  onDrop: (result: DropResult) => void;
}

interface UseDragAndDropResult {
  /** 現在ドラッグ中の情報。ドラッグしていない（長押し待ち・非操作中を含む）場合はnull */
  dragState: DragState | null;
  /** ドラッグ中の人カードが現在ホバーしているドロップゾーンID */
  hoveredZoneId: string | null;
  /** 人カードのルート要素に設定するonPointerDownハンドラーを生成する */
  createPointerDownHandler: (
    person: PersonCardData,
    sourceZoneId: string
  ) => (event: ReactPointerEvent<Element>) => void;
}

interface ActiveDrag {
  personId: string;
  personName: string;
  member: CarpoolMember;
  sourceZoneId: string;
  pointerId: number;
}

interface PendingPress {
  x: number;
  y: number;
  pointerId: number;
}

interface AttachedListeners {
  move: (event: PointerEvent) => void;
  up: (event: PointerEvent) => void;
  cancel: (event: PointerEvent) => void;
}

/** 指定座標の直下にあるドロップゾーン（[data-drop-zone-id]を持つ最も近い要素）のIDを返す */
function resolveZoneId(x: number, y: number): string | null {
  const element = document.elementFromPoint(x, y);
  const zoneElement = element?.closest<HTMLElement>('[data-drop-zone-id]');
  return zoneElement?.dataset.dropZoneId ?? null;
}

/**
 * 人カードの長押しドラッグ＆ドロップを扱うフック。
 * ref: docs/04_画面設計.md#8 ドラッグ＆ドロップ
 *
 * 長押し（LONG_PRESS_MS）でドラッグを開始する。長押し確定前にポインターが
 * MOVE_CANCEL_THRESHOLD_PXを超えて動いた場合はタップ・スクロール操作とみなし、
 * ドラッグ開始をキャンセルする。ドラッグ可能な範囲は人カード全体とする
 * （呼び出し元がPersonCardのルート要素にonPointerDownを設定する）。
 */
export function useDragAndDrop({ onDrop }: UseDragAndDropOptions): UseDragAndDropResult {
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [hoveredZoneId, setHoveredZoneId] = useState<string | null>(null);

  // pointerdown〜pointerup/cancelの1回のジェスチャーを通じて参照し続けるため、
  // 再レンダリングの影響を受けないrefで保持する
  const activeDragRef = useRef<ActiveDrag | null>(null);
  const pendingRef = useRef<PendingPress | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const listenersRef = useRef<AttachedListeners | null>(null);

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const detachListeners = () => {
    if (listenersRef.current) {
      window.removeEventListener('pointermove', listenersRef.current.move);
      window.removeEventListener('pointerup', listenersRef.current.up);
      window.removeEventListener('pointercancel', listenersRef.current.cancel);
      listenersRef.current = null;
    }
  };

  const resetAll = () => {
    clearLongPressTimer();
    detachListeners();
    activeDragRef.current = null;
    pendingRef.current = null;
    setDragState(null);
    setHoveredZoneId(null);
  };

  const handlePointerMove = (event: PointerEvent) => {
    if (!pendingRef.current || event.pointerId !== pendingRef.current.pointerId) {
      return;
    }

    if (!activeDragRef.current) {
      const dx = event.clientX - pendingRef.current.x;
      const dy = event.clientY - pendingRef.current.y;
      if (Math.hypot(dx, dy) > MOVE_CANCEL_THRESHOLD_PX) {
        resetAll();
      }
      return;
    }

    event.preventDefault();
    const zoneId = resolveZoneId(event.clientX, event.clientY);
    setHoveredZoneId(zoneId);
    setDragState({
      personId: activeDragRef.current.personId,
      personName: activeDragRef.current.personName,
      member: activeDragRef.current.member,
      sourceZoneId: activeDragRef.current.sourceZoneId,
      x: event.clientX,
      y: event.clientY,
    });
  };

  const handlePointerUp = (event: PointerEvent) => {
    if (!pendingRef.current || event.pointerId !== pendingRef.current.pointerId) {
      return;
    }

    const active = activeDragRef.current;
    if (active) {
      const targetZoneId = resolveZoneId(event.clientX, event.clientY);
      if (targetZoneId && targetZoneId !== active.sourceZoneId) {
        onDrop({
          member: active.member,
          sourceZoneId: active.sourceZoneId,
          targetZoneId,
        });
      }
    }

    resetAll();
  };

  const handlePointerCancel = (event: PointerEvent) => {
    if (!pendingRef.current || event.pointerId !== pendingRef.current.pointerId) {
      return;
    }
    resetAll();
  };

  const createPointerDownHandler =
    (person: PersonCardData, sourceZoneId: string) =>
    (event: ReactPointerEvent<Element>) => {
      if (event.pointerType === 'mouse' && event.button !== 0) {
        return;
      }

      resetAll();

      pendingRef.current = { x: event.clientX, y: event.clientY, pointerId: event.pointerId };
      listenersRef.current = {
        move: handlePointerMove,
        up: handlePointerUp,
        cancel: handlePointerCancel,
      };
      window.addEventListener('pointermove', listenersRef.current.move, { passive: false });
      window.addEventListener('pointerup', listenersRef.current.up);
      window.addEventListener('pointercancel', listenersRef.current.cancel);

      longPressTimerRef.current = window.setTimeout(() => {
        longPressTimerRef.current = null;
        if (!pendingRef.current || pendingRef.current.pointerId !== event.pointerId) {
          return;
        }
        activeDragRef.current = {
          personId: person.id,
          personName: person.name,
          member: person.member,
          sourceZoneId,
          pointerId: event.pointerId,
        };
        setDragState({
          personId: person.id,
          personName: person.name,
          member: person.member,
          sourceZoneId,
          x: pendingRef.current.x,
          y: pendingRef.current.y,
        });
      }, LONG_PRESS_MS);
    };

  return { dragState, hoveredZoneId, createPointerDownHandler };
}
