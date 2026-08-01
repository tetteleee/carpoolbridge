import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { CarpoolMember } from '../types/event';
import type { PersonCardData } from '../components/carpool/PersonCard';

/** 長押し判定の待機時間（ミリ秒）。この時間ポインターを動かさず押し続けるとドラッグを開始する */
const LONG_PRESS_MS = 150;
/** 長押し確定前にこの距離（px）を超えて指が動いた場合はタップ・スクロール操作とみなしキャンセルする */
const MOVE_CANCEL_THRESHOLD_PX = 10;
/** オートスクロール（上方向）が発生する、画面上端からの範囲（px）のデフォルト値。呼び出し元がtopEdgePxを指定しない場合に使用する */
const DEFAULT_AUTO_SCROLL_EDGE_TOP_PX = 100;
/** オートスクロール（下方向）が発生する、画面下端からの範囲（px）。固定値 */
const AUTO_SCROLL_EDGE_BOTTOM_PX = 60;
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
}

interface UseDragAndDropOptions {
  /** ドロップが確定した時に呼び出す（移動元・移動先のドロップゾーンが異なる場合のみ呼び出される） */
  onDrop: (result: DropResult) => void;
  /**
   * オートスクロール（上方向）が発生する、画面上端からの範囲（px）。
   * sticky header（サマリー表示の有無で高さが変わる）の実高さに追従させるため、
   * 呼び出し元から都度渡せるようにする。省略時はDEFAULT_AUTO_SCROLL_EDGE_TOP_PXを使う。
   */
  topEdgePx?: number;
}

interface UseDragAndDropResult {
  /** 現在ドラッグ中の情報。ドラッグしていない（長押し待ち・非操作中を含む）場合はnull */
  dragState: DragState | null;
  /** ドラッグ中の人カードが現在ホバーしているドロップゾーンID */
  hoveredZoneId: string | null;
  /**
   * 人カードのonPointerDownハンドラー（レンダリングを跨いで参照が変わらない）。
   * 呼び出し元は不要な再レンダリングを避けるため、人カードごとにラップした
   * クロージャーを生成せず、この関数をそのままonPointerDownへ渡すこと
   * （人物・ドラッグ元ゾーンIDは第2・第3引数で都度渡す）。
   */
  handlePersonPointerDown: (
    event: ReactPointerEvent<Element>,
    person: PersonCardData,
    sourceZoneId: string
  ) => void;
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

/** 座標に対するドロップ判定結果。ゾーンIDのみを含む */
interface DropTarget {
  zoneId: string;
}

/**
 * 指定座標の直下にあるドロップゾーン（[data-drop-zone-id]を持つ最も近い要素）を求める。
 * 車内の表示順は集合場所グルーピング＋学年・名前順で一意に決まるため（04_画面設計.md#集合場所グルーピング）、
 * ゾーン内での挿入位置（アンカー）は判定しない。
 */
function resolveDropTarget(x: number, y: number): DropTarget | null {
  const element = document.elementFromPoint(x, y);
  const zoneElement = element?.closest<HTMLElement>('[data-drop-zone-id]');
  const zoneId = zoneElement?.dataset.dropZoneId;
  if (!zoneElement || !zoneId) {
    return null;
  }

  return { zoneId };
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
export function useDragAndDrop({ onDrop, topEdgePx }: UseDragAndDropOptions): UseDragAndDropResult {
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [hoveredZoneId, setHoveredZoneId] = useState<string | null>(null);
  // pointerdown〜pointerup/cancelの1回のジェスチャーを通じて参照し続けるため、
  // 再レンダリングの影響を受けないrefで保持する
  const activeDragRef = useRef<ActiveDrag | null>(null);
  const pendingRef = useRef<PendingPress | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const listenersRef = useRef<AttachedListeners | null>(null);
  // オートスクロールの現在の方向。稼働中はrequestAnimationFrameのループを回し続ける
  const autoScrollDirectionRef = useRef<'up' | 'down' | null>(null);
  const autoScrollFrameRef = useRef<number | null>(null);
  // ドラッグ中のイベントハンドラーはwindowに一度だけ登録するクロージャーのため、
  // 再レンダリングごとに変わるtopEdgePxをrefに反映して参照する
  const topEdgePxRef = useRef(topEdgePx ?? DEFAULT_AUTO_SCROLL_EDGE_TOP_PX);
  useEffect(() => {
    topEdgePxRef.current = topEdgePx ?? DEFAULT_AUTO_SCROLL_EDGE_TOP_PX;
  }, [topEdgePx]);

  // onDropもrefに反映して参照する。人カード側へ渡すhandlePersonPointerDownの参照を
  // レンダリングを跨いで固定するため（React.memo化した車カード・人カードが
  // ドラッグ中の毎フレームの再レンダリングを避けられるようにするための対応）
  const onDropRef = useRef(onDrop);
  useEffect(() => {
    onDropRef.current = onDrop;
  }, [onDrop]);

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const detachListeners = useCallback(() => {
    if (listenersRef.current) {
      window.removeEventListener('pointermove', listenersRef.current.move);
      window.removeEventListener('pointerup', listenersRef.current.up);
      window.removeEventListener('pointercancel', listenersRef.current.cancel);
      listenersRef.current = null;
    }
  }, []);

  const stopAutoScroll = useCallback(() => {
    if (autoScrollFrameRef.current !== null) {
      window.cancelAnimationFrame(autoScrollFrameRef.current);
      autoScrollFrameRef.current = null;
    }
    autoScrollDirectionRef.current = null;
  }, []);

  // requestAnimationFrameで自身を呼び直す再帰関数のため、useCallbackで直接宣言すると
  // 自己参照になってしまう（依存配列[]では更新されない値を参照する形になる）。
  // refの初期値として持たせ、開始トリガー（startAutoScrollLoop）側だけを安定した参照にする。
  const runAutoScrollFrameRef = useRef<() => void>(() => {
    if (autoScrollDirectionRef.current === 'up') {
      window.scrollBy(0, -AUTO_SCROLL_SPEED_PX);
    } else if (autoScrollDirectionRef.current === 'down') {
      window.scrollBy(0, AUTO_SCROLL_SPEED_PX);
    }
    autoScrollFrameRef.current = window.requestAnimationFrame(() => runAutoScrollFrameRef.current());
  });

  const startAutoScrollLoop = useCallback(() => {
    autoScrollFrameRef.current = window.requestAnimationFrame(() => runAutoScrollFrameRef.current());
  }, []);

  /** ポインターのY座標から、画面端に近ければオートスクロールを開始・継続し、離れれば停止する */
  const updateAutoScroll = useCallback(
    (clientY: number) => {
      if (clientY < topEdgePxRef.current) {
        autoScrollDirectionRef.current = 'up';
      } else if (clientY > window.innerHeight - AUTO_SCROLL_EDGE_BOTTOM_PX) {
        autoScrollDirectionRef.current = 'down';
      } else {
        autoScrollDirectionRef.current = null;
      }

      if (autoScrollDirectionRef.current === null) {
        stopAutoScroll();
      } else if (autoScrollFrameRef.current === null) {
        startAutoScrollLoop();
      }
    },
    [stopAutoScroll, startAutoScrollLoop]
  );

  const resetAll = useCallback(() => {
    clearLongPressTimer();
    detachListeners();
    stopAutoScroll();
    activeDragRef.current = null;
    pendingRef.current = null;
    setDragState(null);
    setHoveredZoneId(null);
  }, [clearLongPressTimer, detachListeners, stopAutoScroll]);

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
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
      const target = resolveDropTarget(event.clientX, event.clientY);
      setHoveredZoneId(target?.zoneId ?? null);
      setDragState({
        personId: activeDragRef.current.personId,
        personName: activeDragRef.current.personName,
        member: activeDragRef.current.member,
        sourceZoneId: activeDragRef.current.sourceZoneId,
        x: event.clientX,
        y: event.clientY,
      });
    },
    [resetAll, updateAutoScroll]
  );

  const handlePointerUp = useCallback(
    (event: PointerEvent) => {
      if (!pendingRef.current || event.pointerId !== pendingRef.current.pointerId) {
        return;
      }

      const active = activeDragRef.current;
      if (active) {
        const target = resolveDropTarget(event.clientX, event.clientY);
        if (target) {
          onDropRef.current({
            member: active.member,
            sourceZoneId: active.sourceZoneId,
            targetZoneId: target.zoneId,
          });
        }
      }

      resetAll();
    },
    [resetAll]
  );

  const handlePointerCancel = useCallback(
    (event: PointerEvent) => {
      if (!pendingRef.current || event.pointerId !== pendingRef.current.pointerId) {
        return;
      }
      resetAll();
    },
    [resetAll]
  );

  const handlePersonPointerDown = useCallback(
    (event: ReactPointerEvent<Element>, person: PersonCardData, sourceZoneId: string) => {
      if (event.pointerType === 'mouse' && event.button !== 0) {
        return;
      }

      // マウス操作はカード全体がドラッグ起点のため、長押し確定前に
      // ネイティブテキスト選択が始まらないようここで止める
      // （タッチ／ペンはドラッグハンドルのtouch-action: noneで別途対応済み）
      if (event.pointerType === 'mouse') {
        event.preventDefault();
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
    },
    [resetAll, handlePointerMove, handlePointerUp, handlePointerCancel]
  );

  return { dragState, hoveredZoneId, handlePersonPointerDown };
}
