import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { EventHeaderTitle } from '../components/EventHeaderTitle';
import { LoadingIndicator } from '../components/icons';
import { CarCard } from '../components/carpool/CarCard';
import { CarpoolCopyDialog } from '../components/carpool/CarpoolCopyDialog';
import { CarpoolEmptyState } from '../components/carpool/CarpoolEmptyState';
import { CarpoolReconcileToast } from '../components/carpool/CarpoolReconcileToast';
import { CarpoolSummaryBar } from '../components/carpool/CarpoolSummaryBar';
import { CarpoolWarningPopup } from '../components/carpool/CarpoolWarningPopup';
import { DirectionToggle } from '../components/carpool/DirectionToggle';
import { NoRideNeededArea } from '../components/carpool/NoRideNeededArea';
import { OperationArea } from '../components/carpool/OperationArea';
import { UnassignedArea } from '../components/carpool/UnassignedArea';
import { ShareModal } from '../components/lineShare/ShareModal';
import { useCarpoolDirection } from '../hooks/useCarpoolDirection';
import { useCarpoolBoardData } from '../hooks/useCarpoolBoardData';
import { useCarpoolValidation } from '../hooks/useCarpoolValidation';
import { useDragAndDrop, type DropResult } from '../hooks/useDragAndDrop';
import { getEvent } from '../services/event/eventService';
import { getDestination } from '../services/master/destinationService';
import { moveCarpoolMember, UNASSIGNED_ZONE_ID } from '../services/carpool/carpoolMember';
import { copyDirectionCarpools } from '../services/carpool/copyDirectionCarpools';
import { loadBoardMasterData } from '../services/carpool/carpoolBoardData';
import { formatDateWithWeekday } from '../utils/date';
import type { Direction, Event } from '../types/event';

/**
 * オートスクロール開始位置（画面上端からの距離）を、sticky header（ヘッダー＋トグル＋サマリー）の
 * 実高さに、指がヘッダー付近に入った時点で早めに反応させるための余白を足した値とする。
 * サマリー表示・非表示で高さが変わるため、固定値ではなくResizeObserverで実測する。
 */
const AUTO_SCROLL_TOP_BUFFER_PX = 20;

/**
 * 配車画面（メイン）。
 * 「行き」「帰り」の切り替えボタンで選択中のdirectionに応じて配車結果を切り替える。
 */
export function CarpoolPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [destinationName, setDestinationName] = useState('');
  const {
    direction,
    setDirection,
    carpools,
    carpoolsByDirection,
    loading: carpoolsLoading,
    error: carpoolsError,
    refresh: refreshCarpools,
  } = useCarpoolDirection(eventId);
  const {
    unassignedPeople,
    noRideNeededPeople,
    carCards,
    unansweredCount,
    hasNoResponses,
    loading: boardDataLoading,
    error: boardDataError,
    reconcileNotice,
  } = useCarpoolBoardData(eventId, direction, carpools, refreshCarpools);
  const [moveError, setMoveError] = useState<string | null>(null);
  const [isSummaryVisible, setIsSummaryVisible] = useState(true);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copySourceDirection, setCopySourceDirection] = useState<Direction | null>(null);
  const [copyProcessing, setCopyProcessing] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const { hasWarning, message: validationMessage } = useCarpoolValidation(
    carCards,
    unassignedPeople,
    unansweredCount
  );

  // sticky header（ヘッダー＋トグル＋サマリー）の実高さを測り、オートスクロール開始位置に反映する
  const stickyHeaderRef = useRef<HTMLDivElement>(null);
  const [stickyHeaderHeight, setStickyHeaderHeight] = useState(0);

  useEffect(() => {
    const element = stickyHeaderRef.current;
    if (!element) {
      return;
    }
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setStickyHeaderHeight(entry.contentRect.height);
      }
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const loading = carpoolsLoading || boardDataLoading;
  const error = carpoolsError ?? boardDataError ?? moveError ?? copyError;

  useEffect(() => {
    if (!eventId) {
      return;
    }
    getEvent(eventId).then(setEvent);
  }, [eventId]);

  useEffect(() => {
    if (!event) {
      return;
    }
    getDestination(event.destinationId).then((destination) =>
      setDestinationName(destination?.name ?? '')
    );
  }, [event]);

  const handleDrop = ({ member, sourceZoneId, targetZoneId }: DropResult) => {
    if (!eventId) {
      return;
    }
    setMoveError(null);
    moveCarpoolMember(eventId, member, sourceZoneId, targetZoneId, carpools)
      .then(refreshCarpools)
      .catch(() => {
        setMoveError('人の移動に失敗しました');
        // 失敗時も画面表示を実データに同期し、乖離に気づけない状態を防ぐ
        refreshCarpools();
      });
  };

  const { dragState, hoveredZoneId, handlePersonPointerDown } = useDragAndDrop({
    onDrop: handleDrop,
    topEdgePx: stickyHeaderHeight + AUTO_SCROLL_TOP_BUFFER_PX,
  });

  const warningPopupMessage =
    !loading && !error && hasWarning && !dragState ? validationMessage : null;

  const handleEditAnswersClick = () => {
    if (!eventId) {
      return;
    }
    navigate(`/events/${eventId}/edit`);
  };

  const handleShareClick = () => setIsShareModalOpen(true);

  const handleRequestCopy = (sourceDirection: Direction) => {
    setCopyError(null);
    setCopySourceDirection(sourceDirection);
  };

  const handleCancelCopy = () => {
    setCopySourceDirection(null);
  };

  const handleConfirmCopy = async () => {
    if (!eventId || !copySourceDirection) {
      return;
    }
    const sourceDirection = copySourceDirection;
    const targetDirection: Direction = sourceDirection === 'OUTWARD' ? 'RETURN' : 'OUTWARD';
    setCopyProcessing(true);
    setCopyError(null);
    try {
      const masterData = await loadBoardMasterData(eventId);
      await copyDirectionCarpools(eventId, sourceDirection, targetDirection, masterData);
      setCopySourceDirection(null);
      if (direction === targetDirection) {
        await refreshCarpools();
      } else {
        setDirection(targetDirection);
      }
    } catch {
      setCopyError('コピーに失敗しました');
    } finally {
      setCopyProcessing(false);
    }
  };

  return (
    <div
      id="carpool-page"
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        maxWidth: '480px',
        margin: '0 auto',
        boxSizing: 'border-box',
      }}
    >
      <div
        ref={stickyHeaderRef}
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: 'var(--panel-bg)',
          borderBottom: '1px solid var(--border)',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ padding: '14px 16px', boxSizing: 'border-box' }}>
          <Header
            title={event ? event.name : ''}
            backTo="/"
            titleContent={
              event && (
                <EventHeaderTitle
                  date={formatDateWithWeekday(event.date)}
                  title={event.name}
                  location={destinationName || undefined}
                />
              )
            }
            trailing={
              <OperationArea
                onEditAnswers={handleEditAnswersClick}
                onShare={handleShareClick}
                onRequestCopy={handleRequestCopy}
                canCopyOutwardToReturn={carpoolsByDirection.OUTWARD.length > 0}
                canCopyReturnToOutward={carpoolsByDirection.RETURN.length > 0}
              />
            }
          />
        </div>

        <div style={{ padding: '0 16px 12px', boxSizing: 'border-box' }}>
          <DirectionToggle direction={direction} onChange={setDirection} />
        </div>

        {!loading && !error && !hasNoResponses && (
          <CarpoolSummaryBar
            carCards={carCards}
            unassignedCount={unassignedPeople.length}
            noRideNeededCount={noRideNeededPeople.length}
            expanded={isSummaryVisible}
            onToggleExpanded={() => setIsSummaryVisible((visible) => !visible)}
          />
        )}
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          padding: '16px',
          boxSizing: 'border-box',
        }}
      >
        {error && (
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--negative)' }}>
            {error}
          </p>
        )}

        {!eventId ? (
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text)' }}>
            イベントIDが指定されていません
          </p>
        ) : loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
            <LoadingIndicator />
          </div>
        ) : (
          !error && (
            hasNoResponses ? (
              <CarpoolEmptyState onEditAnswers={handleEditAnswersClick} />
            ) : (
              <>
                <UnassignedArea
                  people={unassignedPeople}
                  isDropTarget={dragState !== null && hoveredZoneId === UNASSIGNED_ZONE_ID}
                  draggingPersonId={dragState?.personId ?? null}
                  onPersonPointerDown={handlePersonPointerDown}
                />
                {carCards.map((car) => (
                  <CarCard
                    key={car.id}
                    car={car}
                    isDropTarget={dragState !== null && hoveredZoneId === car.id}
                    draggingPersonId={dragState?.personId ?? null}
                    onPersonPointerDown={handlePersonPointerDown}
                  />
                ))}
                <NoRideNeededArea people={noRideNeededPeople} />
              </>
            )
          )
        )}
      </div>

      <div
        style={{
          position: 'fixed',
          left: '50%',
          bottom: '16px',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: '480px',
          padding: '0 16px',
          boxSizing: 'border-box',
          zIndex: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          pointerEvents: 'none',
        }}
      >
        <CarpoolReconcileToast
          key={reconcileNotice ? `reconcile-${reconcileNotice.id}` : 'reconcile-none'}
          message={reconcileNotice?.message ?? null}
        />
        <CarpoolWarningPopup
          key={warningPopupMessage ? `warning-${warningPopupMessage}` : 'warning-none'}
          message={warningPopupMessage}
        />
      </div>

      {dragState && (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            left: dragState.x,
            top: dragState.y,
            transform: 'translate(-50%, -120%)',
            pointerEvents: 'none',
            zIndex: 100,
            padding: '6px 12px',
            borderRadius: '6px',
            background: 'var(--accent)',
            color: '#fff',
            fontSize: '13px',
            fontWeight: 700,
            fontFamily: 'var(--sans)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
            whiteSpace: 'nowrap',
          }}
        >
          {dragState.personName}
        </div>
      )}

      <ShareModal
        open={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        eventId={eventId}
        event={event}
        destinationName={destinationName}
      />

      <CarpoolCopyDialog
        sourceDirection={copySourceDirection}
        processing={copyProcessing}
        onCancel={handleCancelCopy}
        onConfirm={handleConfirmCopy}
      />
    </div>
  );
}
