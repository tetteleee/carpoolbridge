import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FamilyResponseCard } from '../components/eventEdit/FamilyResponseCard';
import { getEvent } from '../services/event/eventService';
import { getFamilies } from '../services/master/familyService';
import { getChildrenByFamilyId } from '../services/master/childService';
import { getResponses } from '../services/event/responseService';
import { formatDateWithWeekday } from '../utils/date';
import type { Event, Response } from '../types/event';
import type { Child, Family } from '../types/master';

/**
 * イベント編集（回答入力）画面。
 * 対象イベントに関わる有効な家庭を家庭単位のカードで一覧表示する。
 * 各入力項目（T25〜T28）は、変更の都度Firestoreへ自動保存される（T29）。
 */
export function EventEditPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [families, setFamilies] = useState<Family[]>([]);
  const [childrenByFamilyId, setChildrenByFamilyId] = useState<
    Record<string, Child[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [responsesByFamilyId, setResponsesByFamilyId] = useState<
    Record<string, Response>
  >({});

  useEffect(() => {
    if (!eventId) {
      return;
    }

    Promise.all([getEvent(eventId), getFamilies(), getResponses(eventId)])
      .then(async ([eventData, familiesData, responsesData]) => {
        setEvent(eventData);

        const activeFamilies = familiesData.filter((family) => family.isActive);
        setFamilies(activeFamilies);

        const childrenByFamily = await Promise.all(
          activeFamilies.map((family) => getChildrenByFamilyId(family.id))
        );
        const childrenMap: Record<string, Child[]> = {};
        activeFamilies.forEach((family, index) => {
          childrenMap[family.id] = childrenByFamily[index].filter(
            (child) => child.isActive
          );
        });
        setChildrenByFamilyId(childrenMap);

        setResponsesByFamilyId(
          Object.fromEntries(
            responsesData.map(({ familyId, ...response }) => [familyId, response])
          )
        );
      })
      .catch(() => setError('データの取得に失敗しました'))
      .finally(() => setLoading(false));
  }, [eventId]);

  return (
    <div
      id="event-edit-page"
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
          padding: '16px',
          borderBottom: '1px solid var(--border)',
          boxSizing: 'border-box',
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: 700,
            color: 'var(--text-h)',
          }}
        >
          {event ? `${formatDateWithWeekday(event.date)} ${event.name}` : '回答入力'}
        </h1>
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
          <p style={{ margin: 0, fontSize: '13px', color: 'crimson' }}>
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
        ) : !error && families.length === 0 ? (
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text)' }}>
            対象の家庭がありません
          </p>
        ) : (
          families.map((family) => (
            <FamilyResponseCard
              key={family.id}
              eventId={eventId}
              family={family}
              childList={childrenByFamilyId[family.id] ?? []}
              response={responsesByFamilyId[family.id]}
            />
          ))
        )}
      </div>
    </div>
  );
}
