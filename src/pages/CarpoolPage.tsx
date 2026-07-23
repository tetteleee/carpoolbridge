import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { CarCard } from '../components/carpool/CarCard';
import { OperationArea } from '../components/carpool/OperationArea';
import { UnassignedArea } from '../components/carpool/UnassignedArea';
import { useCarpoolDirection } from '../hooks/useCarpoolDirection';
import { useCarpoolBoardData } from '../hooks/useCarpoolBoardData';
import { useCarpoolValidation } from '../hooks/useCarpoolValidation';
import { useDragAndDrop, type DropResult } from '../hooks/useDragAndDrop';
import { getEvent } from '../services/event/eventService';
import { moveCarpoolMember, UNASSIGNED_ZONE_ID } from '../services/carpool/carpoolMember';
import { formatDateWithWeekday } from '../utils/date';
import type { Direction, Event } from '../types/event';

const DIRECTION_TABS: { direction: Direction; label: string }[] = [
  { direction: 'OUTWARD', label: '行き' },
  { direction: 'RETURN', label: '帰り' },
];

/**
 * 配車画面（メイン）。
 * 「行き」「帰り」タブで選択中のdirectionに応じて配車結果を切り替える。
 */
export function CarpoolPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
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
    loading: boardDataLoading,
    error: boardDataError,
  } = useCarpoolBoardData(eventId, direction, carpools);
  const [moveError, setMoveError] = useState<string | null>(null);
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

  const handleDrop = ({ member, sourceZoneId, targetZoneId }: DropResult) => {
    if (!eventId) {
      return;
    }
    setMoveError(null);
    moveCarpoolMember(eventId, member, sourceZoneId, targetZoneId, carpools)
      .then(refreshCarpools)
      .catch(() => setMoveError('人の移動に失敗しました'));
  };

  const { dragState, hoveredZoneId, createPointerDownHandler } = useDragAndDrop({
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
          padding: '14px 16px 16px',
          borderBottom: '1px solid var(--border)',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ marginBottom: '12px' }}>
          <Header
            title={event ? `${formatDateWithWeekday(event.date)} ${event.name}` : '配車'}
            backTo="/"
          />
        </div>

        <div role="tablist" style={{ display: 'flex', gap: '8px' }}>
          {DIRECTION_TABS.map((tab) => {
            const selected = tab.direction === direction;
            return (
              <button
                key={tab.direction}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setDirection(tab.direction)}
                style={{
                  padding: '8px 20px',
                  borderRadius: '999px',
                  border: `1px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
                  background: selected ? 'var(--accent-bg)' : 'transparent',
                  color: selected ? 'var(--accent)' : 'var(--text)',
                  fontSize: '14px',
                  fontWeight: 700,
                  fontFamily: 'var(--sans)',
                  cursor: 'pointer',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: '12px' }}>
          <OperationArea
            direction={direction}
            onEditAnswers={handleEditAnswersClick}
            onShare={handleShareClick}
          />
        </div>

        {!loading && !error && hasWarning && (
          <p
            role="alert"
            style={{
              margin: '12px 0 0',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid var(--negative-border)',
              background: 'var(--negative-bg)',
              color: 'var(--negative)',
              fontSize: '13px',
              fontWeight: 700,
              fontFamily: 'var(--sans)',
            }}
          >
            ⚠ {validationMessage}
          </p>
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
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text)' }}>
            読み込み中...
          </p>
        ) : (
          !error && (
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
                  onPersonPointerDown={(person) => createPointerDownHandler(person, car.id)}
                />
              ))}
            </>
          )
        )}
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
    </div>
  );
}
