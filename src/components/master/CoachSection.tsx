import type { CSSProperties } from 'react';
import type { Coach } from '../../types/master';
import { AddRow } from '../common/AddRow';
import { Button } from '../common/Button';
import { RoleBox } from '../common/RoleBox';
import { Switch } from '../common/Switch';
import { UserIcon } from '../icons';

interface CoachSectionProps {
  coachList: Coach[];
  /** 所属家庭の在籍中の値。falseの間は在籍中トグルを操作不可にしてグレーアウトする（04_画面設計.md#10.4） */
  familyActive: boolean;
  onNameChange: (coachId: string, name: string) => void;
  onActiveToggle: (coachId: string) => void;
  onAdd: () => void;
  /** コーチの削除ボタン押下時（実際の削除は確認ダイアログを経由する。04_画面設計.md#10.4） */
  onDelete: (coachId: string) => void;
}

const deleteButtonStyle: CSSProperties = {
  padding: '6px 12px',
  minHeight: '30px',
  fontSize: '12px',
};

const nameInputStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  padding: '6px 8px',
  borderRadius: '6px',
  border: '1px solid var(--border)',
  // iOSはinput/selectのfont-sizeが16px未満だとフォーカス時に自動でズームしてしまうため16px以上にする
  fontSize: '16px',
  fontWeight: 700,
  fontFamily: 'var(--sans)',
  color: 'var(--text-h)',
  background: 'var(--bg)',
  boxSizing: 'border-box',
};

const statusRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const statusLabelStyle: CSSProperties = {
  fontSize: '12px',
  color: 'var(--text)',
  fontWeight: 600,
};

/**
 * マスタ管理画面「コーチ」セクション（家庭カード内に埋め込む）。
 * 選手・家族と同様、デフォルト非表示・「＋コーチを追加」で行を追加する形式の下書き編集・新規追加を行う。
 * 入力項目は名前のみ（学年に相当する項目は持たない）。1家庭に複数人登録できる（人数の上限はない）。
 * 表示順は登録順とし、属性による自動ソートは行わない（04_画面設計.md#10.4）。
 * コーチは配車画面・回答編集画面と同じ役割色（黄土色）のボックスで表示する。
 * Firestoreへの反映は家庭セクションの保存処理にまとめて委譲する。
 */
export function CoachSection({
  coachList,
  familyActive,
  onNameChange,
  onActiveToggle,
  onAdd,
  onDelete,
}: CoachSectionProps) {
  return (
    <div id="coach-section" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {coachList.map((coach) => (
        <RoleBox key={coach.id} role="coach">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              opacity: familyActive && coach.isActive ? 1 : 'var(--disabled-opacity)',
            }}
          >
            <UserIcon size={13} />
            <input
              type="text"
              value={coach.name}
              onChange={(e) => onNameChange(coach.id, e.target.value)}
              style={nameInputStyle}
            />
          </div>

          <div style={statusRowStyle}>
            <span style={statusLabelStyle}>在籍中</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Switch
                checked={coach.isActive}
                onChange={() => onActiveToggle(coach.id)}
                ariaLabel={`${coach.name || 'コーチ'}の在籍状態`}
                disabled={!familyActive}
              />
              <Button
                variant="danger"
                size="sm"
                style={deleteButtonStyle}
                onClick={() => onDelete(coach.id)}
              >
                削除
              </Button>
            </div>
          </div>
        </RoleBox>
      ))}

      <AddRow onClick={onAdd} tint="coach">
        + コーチを追加
      </AddRow>
    </div>
  );
}
