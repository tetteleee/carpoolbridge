import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { OperationArea } from '../components/carpool/OperationArea';
import {
  UnassignedArea,
  type UnassignedPerson,
} from '../components/carpool/UnassignedArea';
import { useCarpoolDirection } from '../hooks/useCarpoolDirection';
import { getEvent } from '../services/event/eventService';
import { formatDateWithWeekday } from '../utils/date';
import type { Direction, Event } from '../types/event';

const DIRECTION_TABS: { direction: Direction; label: string }[] = [
  { direction: 'OUTWARD', label: '行き' },
  { direction: 'RETURN', label: '帰り' },
];

/**
 * 配車画面（メイン）。
 * 「行き」「帰り」タブで選択中のdirectionに応じて配車結果を切り替える。
 * 車カード・人カードなどの表示自体はT41〜T42で実装する。
 */
export function CarpoolPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const { direction, setDirection, carpools, loading, error } =
    useCarpoolDirection(eventId);

  useEffect(() => {
    if (!eventId) {
      return;
    }
    getEvent(eventId).then(setEvent);
  }, [eventId]);

  // イベント編集画面への遷移先接続はT39aで行う
  const handleEditAnswersClick = () => {};

  // LINE共有画面への遷移先接続はT46aで行う
  const handleShareClick = (_shareDirection: Direction) => {};

  // 未配車データの取得・算出処理は対象設計書に規定がないためT40の対象外とし、
  // 呼び出し元（本コンポーネント）から未配車一覧データを渡す前提とする
  const unassignedPeople: UnassignedPerson[] = [];

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
          padding: '16px',
          borderBottom: '1px solid var(--border)',
          boxSizing: 'border-box',
        }}
      >
        <h1
          style={{
            margin: '0 0 12px',
            fontSize: '18px',
            fontWeight: 700,
            color: 'var(--text-h)',
          }}
        >
          {event ? `${formatDateWithWeekday(event.date)} ${event.name}` : '配車'}
        </h1>

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
        ) : (
          !error && (
            <>
              <UnassignedArea people={unassignedPeople} />
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--text)' }}>
                配車 {carpools.length}台
              </p>
            </>
          )
        )}
      </div>
    </div>
  );
}
