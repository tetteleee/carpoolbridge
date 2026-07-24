import { useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { CarpoolMember } from '../types/event';
import type { PersonCardData } from '../components/carpool/PersonCard';
import { memberKey } from '../services/carpool/carpoolMember';

/** 長押し判定の待機時間（ミリ秒）。この時間ポインターを動かさず押し続けるとドラッグを開始する */
const LONG_PRESS_MS = 150;
/** 長押し確定前にこの距離（px）を超えて指が動いた場合はタップ・スクロール操作とみなしキャンセルする */
const MOVE_CANCEL_THRESHOLD_PX = 10;
/** オートスクロールが発生する、画面上端・下端からの範囲（px）。ヘッダーの実高さには依存させない固定値 */
const AUTO_SCROLL_EDGE_PX = 60;
/** オートスクロールの速度（1フレームあたりのスクロール量、px） */
const AUTO_SCROLL_SPEED_PX = 12;

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
  /** 移動先ゾーン内で、このメンバーの直前に挿入するべき乗車メンバーのキー（memberKeyの形式）。ゾーン内の末尾に挿入する場合はnull */
  targetAnchorKey: string | null;
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
  /** ホバー中のドロップゾーン内で、挿入先となる直前の乗車メンバーのキー。ゾーン内末尾に挿入される場合、またはドロップゾーンをホバーしていない場合はnull */
  insertionAnchorKey: string | null;
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

/** 座標に対するドロップ判定結果。ゾーンIDと、そのゾーン内での挿入位置（挿入先の直前の乗車メンバーのキー）を含む */
interface DropTarget {
  zoneId: string;
  /** このキーを持つ乗車メンバーの直前に挿入する。ゾーン内末尾に挿入する場合はnull */
  anchorKey: string | null;
}

/**
 * 指定座標の直下にあるドロップゾーン（[data-drop-zone-id]を持つ最も近い要素）と、
 * そのゾーン内での挿入位置を求める。
 * 挿入位置は、ゾーン内の各人カード（[data-person-key]）の縦方向の中点とyを比較し、
 * 中点がyより下側にある最初の人カードの直前に挿入する、という判定で求める
 * （elementFromPointのスタッキング挙動に依存しないよう、ジオメトリ比較のみで判定する）。
 * ドラッグ中の本人のカード（excludeKey）は挿入位置の判定対象から除外する。
 */
function resolveDropTarget(x: number, y: number, excludeKey: string): DropTarget | null {
  const element = document.elementFromPoint(x, y);
  const zoneElement = element?.closest<HTMLElement>('[data-drop-zone-id]');
  const zoneId = zoneElement?.dataset.dropZoneId;
  if (!zoneElement || !zoneId) {
    return null;
  }

  const candidates = Array.from(
    zoneElement.querySelectorAll<HTMLElement>('[data-person-key]')
  ).filter((candidate) => candidate.dataset.personKey !== excludeKey);

  let anchorKey: string | null = null;
  for (const candidate of candidates) {
    const rect = candidate.getBoundingClientRect();
    const midpointY = rect.top + rect.height / 2;
    if (y < midpointY) {
      anchorKey = candidate.dataset.personKey ?? null;
      break;
    }
  }

  return { zoneId, anchorKey };
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
  const [insertionAnchorKey, setInsertionAnchorKey] = useState<string | null>(null);

  // pointerdown〜pointerup/cancelの1回のジェスチャーを通じて参照し続けるため、
  // 再レンダリングの影響を受けないrefで保持する
  const activeDragRef = useRef<ActiveDrag | null>(null);
  const pendingRef = useRef<PendingPress | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const listenersRef = useRef<AttachedListeners | null>(null);
  // オートスクロールの現在の方向。稼働中はrequestAnimationFrameのループを回し続ける
  const autoScrollDirectionRef = useRef<'up' | 'down' | null>(null);
  const autoScrollFrameRef = useRef<number | null>(null);

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

  const stopAutoScroll = () => {
    if (autoScrollFrameRef.current !== null) {
      window.cancelAnimationFrame(autoScrollFrameRef.current);
      autoScrollFrameRef.current = null;
    }
    autoScrollDirectionRef.current = null;
  };

  const runAutoScrollFrame = () => {
    if (autoScrollDirectionRef.current === 'up') {
      window.scrollBy(0, -AUTO_SCROLL_SPEED_PX);
    } else if (autoScrollDirectionRef.current === 'down') {
      window.scrollBy(0, AUTO_SCROLL_SPEED_PX);
    }
    autoScrollFrameRef.current = window.requestAnimationFrame(runAutoScrollFrame);
  };

  /** ポインターのY座標から、画面端に近ければオートスクロールを開始・継続し、離れれば停止する */
  const updateAutoScroll = (clientY: number) => {
    if (clientY < AUTO_SCROLL_EDGE_PX) {
      autoScrollDirectionRef.current = 'up';
    } else if (clientY > window.innerHeight - AUTO_SCROLL_EDGE_PX) {
      autoScrollDirectionRef.current = 'down';
    } else {
      autoScrollDirectionRef.current = null;
    }

    if (autoScrollDirectionRef.current === null) {
      stopAutoScroll();
    } else if (autoScrollFrameRef.current === null) {
      autoScrollFrameRef.current = window.requestAnimationFrame(runAutoScrollFrame);
    }
  };

  const resetAll = () => {
    clearLongPressTimer();
    detachListeners();
    stopAutoScroll();
    activeDragRef.current = null;
    pendingRef.current = null;
    setDragState(null);
    setHoveredZoneId(null);
    setInsertionAnchorKey(null);
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
    updateAutoScroll(event.clientY);
    const excludeKey = memberKey(activeDragRef.current.member);
    const target = resolveDropTarget(event.clientX, event.clientY, excludeKey);
    setHoveredZoneId(target?.zoneId ?? null);
    setInsertionAnchorKey(target?.anchorKey ?? null);
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
      const excludeKey = memberKey(active.member);
      const target = resolveDropTarget(event.clientX, event.clientY, excludeKey);
      if (target) {
        onDrop({
          member: active.member,
          sourceZoneId: active.sourceZoneId,
          targetZoneId: target.zoneId,
          targetAnchorKey: target.anchorKey,
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

  return { dragState, hoveredZoneId, insertionAnchorKey, createPointerDownHandler };
}
