import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { Button } from '../components/common/Button';
import { LoadingIndicator, MapPinIcon, SummaryIcon } from '../components/icons';
import { CarCard } from '../components/carpool/CarCard';
import { CarpoolEmptyState } from '../components/carpool/CarpoolEmptyState';
import { CarpoolSummaryBar } from '../components/carpool/CarpoolSummaryBar';
import { CarpoolWarningPopup } from '../components/carpool/CarpoolWarningPopup';
import { DirectionToggle } from '../components/carpool/DirectionToggle';
import { OperationArea } from '../components/carpool/OperationArea';
import { UnassignedArea } from '../components/carpool/UnassignedArea';
import { useCarpoolDirection } from '../hooks/useCarpoolDirection';
import { useCarpoolBoardData } from '../hooks/useCarpoolBoardData';
import { useCarpoolValidation } from '../hooks/useCarpoolValidation';
import { useDragAndDrop, type DropResult } from '../hooks/useDragAndDrop';
import { getEvent } from '../services/event/eventService';
import { getDestination } from '../services/master/destinationService';
import { moveCarpoolMember, UNASSIGNED_ZONE_ID } from '../services/carpool/carpoolMember';
import { formatDateWithWeekday } from '../utils/date';
import type { Direction, Event } from '../types/event';

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
    loading: carpoolsLoading,
    error: carpoolsError,
    refresh: refreshCarpools,
  } = useCarpoolDirection(eventId);
  const {
    unassignedPeople,
    carCards,
    hasNoResponses,
    loading: boardDataLoading,
    error: boardDataError,
  } = useCarpoolBoardData(eventId, direction, carpools);
  const [moveError, setMoveError] = useState<string | null>(null);
  const [isSummaryVisible, setIsSummaryVisible] = useState(true);
  const { hasWarning, message: validationMessage } = useCarpoolValidation(
    carCards,
    unassignedPeople
  );

  const loading = carpoolsLoading || boardDataLoading;
  const error = carpoolsError ?? boardDataError ?? moveError;

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

  const handleDrop = ({ member, sourceZoneId, targetZoneId, targetAnchorKey }: DropResult) => {
    if (!eventId) {
      return;
    }
    setMoveError(null);
    moveCarpoolMember(eventId, member, sourceZoneId, targetZoneId, targetAnchorKey, carpools)
      .then(refreshCarpools)
      .catch(() => setMoveError('人の移動に失敗しました'));
  };

  const { dragState, hoveredZoneId, insertionAnchorKey, createPointerDownHandler } = useDragAndDrop({
    onDrop: handleDrop,
  });

  const handleEditAnswersClick = () => {
    if (!eventId) {
      return;
    }
    navigate(`/events/${eventId}/edit`);
  };

  // LINE共有画面への遷移先接続はT46aで行う
  const handleShareClick = (_shareDirection: Direction) => {};

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
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: 'var(--bg)',
          borderBottom: '1px solid var(--border)',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ padding: '14px 16px', boxSizing: 'border-box' }}>
          <Header
            title={event ? event.name : ''}
            titleFontSize="18px"
            backTo="/"
            trailing={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Button
                  variant="secondary"
                  size="sm"
                  aria-label={isSummaryVisible ? 'サマリーを非表示' : 'サマリーを表示'}
                  aria-pressed={isSummaryVisible}
                  onClick={() => setIsSummaryVisible((visible) => !visible)}
                  style={{
                    width: '34px',
                    height: '34px',
                    padding: 0,
                    minHeight: 0,
                    borderColor: isSummaryVisible ? 'var(--accent-border)' : '#D1D5DB',
                    background: isSummaryVisible ? 'var(--accent-bg)' : 'transparent',
                    color: isSummaryVisible ? 'var(--accent)' : '#6B7280',
                  }}
                >
                  <SummaryIcon size={16} />
                </Button>
                <OperationArea
                  direction={direction}
                  onEditAnswers={handleEditAnswersClick}
                  onShare={handleShareClick}
                />
              </div>
            }
          />

          {event && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: '10px',
                paddingLeft: '2px',
              }}
            >
              <span
                style={{
                  flexShrink: 0,
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'var(--text-h)',
                  whiteSpace: 'nowrap',
                }}
              >
                {formatDateWithWeekday(event.date)}
              </span>
              {destinationName && (
                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: 'var(--text)',
                    textAlign: 'left',
                  }}
                >
                  <MapPinIcon size={14} />
                  <span
                    style={{
                      flex: 1,
                      minWidth: 0,
                      fontSize: '13px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {destinationName}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ padding: '0 16px 12px', boxSizing: 'border-box' }}>
          <DirectionToggle direction={direction} onChange={setDirection} />
        </div>

        {!loading && !error && !hasNoResponses && (
          <div
            style={{
              display: 'grid',
              gridTemplateRows: isSummaryVisible ? '1fr' : '0fr',
              transition: 'grid-template-rows 0.2s ease',
            }}
          >
            <div style={{ overflow: 'hidden' }}>
              <CarpoolSummaryBar carCards={carCards} unassignedCount={unassignedPeople.length} />
            </div>
          </div>
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
                  onPersonPointerDown={(person) =>
                    createPointerDownHandler(person, UNASSIGNED_ZONE_ID)
                  }
                />
                {carCards.map((car) => (
                  <CarCard
                    key={car.id}
                    car={car}
                    isDropTarget={dragState !== null && hoveredZoneId === car.id}
                    draggingPersonId={dragState?.personId ?? null}
                    insertionAnchorKey={hoveredZoneId === car.id ? insertionAnchorKey : null}
                    onPersonPointerDown={(person) => createPointerDownHandler(person, car.id)}
                  />
                ))}
              </>
            )
          )
        )}
      </div>

      <CarpoolWarningPopup
        message={
          !loading && !error && hasWarning && !dragState ? validationMessage : null
        }
      />

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
    </div>
  );
}
