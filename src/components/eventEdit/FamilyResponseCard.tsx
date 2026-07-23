import type { CSSProperties } from 'react';
import type { Response } from '../../types/event';
import type { Child, Family } from '../../types/master';
import { getSchoolGrade } from '../../utils/schoolGrade';
import { HomeIcon, UserIcon } from '../icons';
import { DriverAndCapacitySection } from './DriverAndCapacitySection';

interface FamilyResponseCardProps {
  /** 対象家庭 */
  family: Family;
  /** この家庭に属する有効な子供一覧 */
  childList: Child[];
  /** 対象家庭の既存回答（未回答の場合はundefined） */
  response: Response | undefined;
}

const frameStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  padding: '10px 12px',
  borderRadius: '10px',
  border: '1px dashed var(--border)',
  boxSizing: 'border-box',
};

const frameLabelStyle: CSSProperties = {
  fontSize: '12px',
  color: 'var(--text)',
};

const dividerStyle: CSSProperties = {
  border: 'none',
  borderTop: '1px solid var(--border)',
  margin: 0,
};

/**
 * 学年表示ラベルを返す（例：小6）。対象学年外の場合は空文字を返す。
 */
function formatGradeLabel(schoolEntryYear: number): string {
  const grade = getSchoolGrade(schoolEntryYear);
  return grade === null ? '' : `（小${grade}）`;
}

/**
 * イベント編集（回答入力）画面の家庭カード。
 * 家庭名・所属する子供の一覧（名前・学年）、車出し・乗車可能人数（T25）の入力欄を表示するとともに、
 * 子供ごとの回答（T26）・コーチ参加回答（T27）・備考（T28）の入力欄を組み込むための表示領域（枠）を用意する。
 * コーチ参加回答の枠は、家庭にコーチが紐づく場合（coachNameが設定されている場合）のみ表示する。
 */
export function FamilyResponseCard({
  family,
  childList,
  response,
}: FamilyResponseCardProps) {
  const hasCoach = family.coachName !== null;

  return (
    <section
      id={`family-response-card-${family.id}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '16px',
        borderRadius: '16px',
        border: '1px solid var(--border)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
        boxSizing: 'border-box',
      }}
    >
      <h2
        style={{
          margin: 0,
          fontSize: '16px',
          fontWeight: 700,
          color: 'var(--text-h)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <HomeIcon size={16} />
        {family.familyName}
      </h2>

      <DriverAndCapacitySection
        familyId={family.id}
        vehicleCapacity={family.vehicleCapacity}
        initialResponse={response}
      />

      <hr style={dividerStyle} />

      <div
        id={`family-response-card-members-${family.id}`}
        style={{ display: 'flex', flexDirection: 'column' }}
      >
        {childList.map((child, index) => (
          <div key={child.id}>
            {index > 0 && <hr style={dividerStyle} />}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                padding: '8px 0',
              }}
            >
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--text-h)',
                }}
              >
                <UserIcon size={14} />
                {child.name}
                <span style={{ fontSize: '12px', fontWeight: 400 }}>
                  {formatGradeLabel(child.schoolEntryYear)}
                </span>
              </span>
              <div id={`child-response-frame-${child.id}`} style={frameStyle}>
                <span style={frameLabelStyle}>参加</span>
                <span style={frameLabelStyle}>行きの配車不要</span>
                <span style={frameLabelStyle}>帰りの配車不要</span>
              </div>
            </div>
          </div>
        ))}

        {hasCoach && (
          <div>
            {childList.length > 0 && <hr style={dividerStyle} />}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                padding: '8px 0',
              }}
            >
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--text-h)',
                }}
              >
                <UserIcon size={14} />
                {family.coachName}
                <span style={{ fontSize: '12px', fontWeight: 400 }}>
                  コーチ
                </span>
              </span>
              <div id={`coach-response-frame-${family.id}`} style={frameStyle}>
                <span style={frameLabelStyle}>参加</span>
                <span style={frameLabelStyle}>行きの配車不要</span>
                <span style={frameLabelStyle}>帰りの配車不要</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <hr style={dividerStyle} />

      <div id={`remarks-frame-${family.id}`} style={frameStyle}>
        <span style={frameLabelStyle}>備考</span>
      </div>
    </section>
  );
}
