import { useRef, useState, type CSSProperties } from 'react';
import type { Response, ResponseChild } from '../../types/event';
import type { Child, Family } from '../../types/master';
import { getSchoolGrade } from '../../utils/schoolGrade';
import { createResponse, updateResponse } from '../../services/event/responseService';
import { HomeIcon, UserIcon } from '../icons';
import { Card } from '../common/Card';
import { ChildResponseRow } from './ChildResponseRow';
import { CoachResponseRow } from './CoachResponseRow';
import { DriverAndCapacitySection } from './DriverAndCapacitySection';
import { RemarksSection } from './RemarksSection';

interface FamilyResponseCardProps {
  /** 対象イベントID */
  eventId: string;
  /** 対象家庭 */
  family: Family;
  /** この家庭に属する有効な子供一覧 */
  childList: Child[];
  /** 対象家庭の既存回答（未回答の場合はundefined） */
  response: Response | undefined;
}

const dividerStyle: CSSProperties = {
  border: 'none',
  borderTop: '1px solid var(--border)',
  margin: '4px 0',
};

const memberNameStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: '14px',
  fontWeight: 600,
  color: 'var(--text-h)',
};

/** 子供・コーチ1人ごとの回答をまとめる内側ボックスの共通スタイル */
const memberBoxBaseStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  padding: '10px 16px',
};

/** 子供カードの内側ボックス（役割色：背景＋枠線＋左帯） */
const childMemberBoxStyle: CSSProperties = {
  ...memberBoxBaseStyle,
  background: 'var(--child-bg)',
  border: '1px solid var(--child-border)',
  borderLeft: '5px solid var(--child-accent)',
};

/** コーチカードの内側ボックス（役割色：背景＋枠線＋左帯） */
const coachMemberBoxStyle: CSSProperties = {
  ...memberBoxBaseStyle,
  background: 'var(--coach-bg)',
  border: '1px solid var(--coach-border)',
  borderLeft: '5px solid var(--coach-accent)',
};

/**
 * 学年表示ラベルを返す（例：小6）。対象学年外の場合は空文字を返す。
 */
function formatGradeLabel(schoolEntryYear: number): string {
  const grade = getSchoolGrade(schoolEntryYear);
  return grade === null ? '' : `（小${grade}）`;
}

/** 子供個別回答の初期値（未回答） */
function buildInitialResponseChild(childId: string): ResponseChild {
  return {
    childId,
    isParticipating: null,
    noOutwardRide: false,
    noReturnRide: false,
  };
}

/** 家庭の回答の初期値（既存回答が存在する場合はそれを使用し、なければ未回答の初期値を組み立てる） */
function buildInitialResponse(childList: Child[], response: Response | undefined): Response {
  if (response) {
    return response;
  }
  return {
    driverOutward: null,
    driverReturn: null,
    capacityToday: null,
    coachParticipating: null,
    remarks: '',
    children: childList.map((child) => buildInitialResponseChild(child.id)),
  };
}

/**
 * イベント編集（回答入力）画面の家庭カード。
 * 家庭名・所属する子供の一覧（名前・学年）、車出し・乗車可能人数（T25）、
 * 子供ごとの回答（T26）・コーチ参加回答（T27）・備考（T28）の入力欄を表示する。
 * コーチ参加回答の枠は、家庭にコーチが紐づく場合（coachNameが設定されている場合）のみ表示する。
 * 回答内容は家庭単位でこのコンポーネントが状態を保持し、変更の都度Firestoreへ自動保存する（T29）。
 * 「保存」ボタンは設けない（対象設計書#7）。
 */
export function FamilyResponseCard({
  eventId,
  family,
  childList,
  response,
}: FamilyResponseCardProps) {
  const hasCoach = family.coachName !== null;
  const [current, setCurrent] = useState<Response>(() =>
    buildInitialResponse(childList, response)
  );
  // 対象家庭のResponseドキュメントが既にFirestore上に存在するか（新規作成か更新かの判定に使用）
  const hasDocRef = useRef<boolean>(response !== undefined);

  /**
   * 家庭単位のResponseドキュメントへ自動保存する。
   * ドキュメントが未作成の場合は現在の全項目で新規作成し、以降は変更分のみを更新する。
   */
  const persist = (next: Response, patch: Partial<Response>) => {
    if (!hasDocRef.current) {
      hasDocRef.current = true;
      void createResponse(eventId, family.id, next).catch((error) => {
        console.error('回答の自動保存（新規作成）に失敗しました', error);
      });
      return;
    }
    void updateResponse(eventId, family.id, patch).catch((error) => {
      console.error('回答の自動保存（更新）に失敗しました', error);
    });
  };

  /** 家庭情報（車出し・乗車可能人数・コーチ参加・備考）の変更を反映し、自動保存する */
  const applyPatch = (patch: Partial<Response>) => {
    const next = { ...current, ...patch };
    setCurrent(next);
    persist(next, patch);
  };

  /** 子供個別の回答（参加・行き／帰りの配車不要）の変更を反映し、自動保存する */
  const applyChildPatch = (childId: string, patch: Partial<ResponseChild>) => {
    const exists = current.children.some((responseChild) => responseChild.childId === childId);
    const nextChildren = exists
      ? current.children.map((responseChild) =>
          responseChild.childId === childId ? { ...responseChild, ...patch } : responseChild
        )
      : [...current.children, { ...buildInitialResponseChild(childId), ...patch }];
    const next = { ...current, children: nextChildren };
    setCurrent(next);
    persist(next, { children: nextChildren });
  };

  return (
    <Card
      as="section"
      id={`family-response-card-${family.id}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        padding: '12px 16px',
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
        driverOutward={current.driverOutward}
        driverReturn={current.driverReturn}
        capacityToday={current.capacityToday}
        onChangeDriverOffer={(driverOutward, driverReturn) =>
          applyPatch({ driverOutward, driverReturn })
        }
        onChangeCapacityToday={(value) => applyPatch({ capacityToday: value })}
      />

      <hr style={dividerStyle} />

      <div
        id={`family-response-card-members-${family.id}`}
        style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
      >
        {childList.map((child) => {
          const responseChild =
            current.children.find((c) => c.childId === child.id) ??
            buildInitialResponseChild(child.id);

          return (
            <Card key={child.id} variant="compact" style={childMemberBoxStyle}>
              <span style={memberNameStyle}>
                <UserIcon size={14} />
                {child.name}
                <span style={{ fontSize: '12px', fontWeight: 400 }}>
                  {formatGradeLabel(child.schoolEntryYear)}
                </span>
              </span>
              <ChildResponseRow
                childId={child.id}
                isParticipating={responseChild.isParticipating}
                noOutwardRide={responseChild.noOutwardRide}
                noReturnRide={responseChild.noReturnRide}
                onChangeIsParticipating={(value) =>
                  applyChildPatch(
                    child.id,
                    // 参加（○）にした瞬間、行き・帰りの送迎は両方ON（送迎あり）を既定にする
                    // （04_画面設計.md#7）。不参加（✕）にする場合は既存の送迎要否をそのまま保持する
                    value === true
                      ? { isParticipating: true, noOutwardRide: false, noReturnRide: false }
                      : { isParticipating: value }
                  )
                }
                onChangeNoOutwardRide={(value) =>
                  applyChildPatch(child.id, { noOutwardRide: value })
                }
                onChangeNoReturnRide={(value) =>
                  applyChildPatch(child.id, { noReturnRide: value })
                }
              />
            </Card>
          );
        })}

        {hasCoach && (
          <Card variant="compact" style={coachMemberBoxStyle}>
            <span style={memberNameStyle}>
              <UserIcon size={14} />
              {family.coachName}
              <span style={{ fontSize: '12px', fontWeight: 400 }}>
                コーチ
              </span>
            </span>
            <CoachResponseRow
              familyId={family.id}
              coachParticipating={current.coachParticipating}
              onChange={(value) => applyPatch({ coachParticipating: value })}
            />
          </Card>
        )}
      </div>

      <hr style={dividerStyle} />

      <RemarksSection
        familyId={family.id}
        remarks={current.remarks}
        onChange={(value) => applyPatch({ remarks: value })}
      />
    </Card>
  );
}
