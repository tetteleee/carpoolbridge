import type { CSSProperties } from 'react';
import type { FamilyMember } from '../../types/master';
import { AddRow } from '../common/AddRow';
import { Button } from '../common/Button';
import { RoleBox } from '../common/RoleBox';
import { Switch } from '../common/Switch';
import { UserIcon } from '../icons';

interface FamilyMemberSectionProps {
  familyMemberList: FamilyMember[];
  /** 所属家庭の在籍中の値。falseの間は在籍中トグルを操作不可にしてグレーアウトする（04_画面設計.md#10.4） */
  familyActive: boolean;
  onNameChange: (familyMemberId: string, name: string) => void;
  onActiveToggle: (familyMemberId: string) => void;
  onAdd: () => void;
  /** 家族の削除ボタン押下時（実際の削除は確認ダイアログを経由する。04_画面設計.md#10.4） */
  onDelete: (familyMemberId: string) => void;
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
 * マスタ管理画面「家族」セクション（家庭カード内に埋め込む）。
 * 選手・コーチ以外で配車の対象になり得る人（兄弟・祖父母など）の下書き編集・新規追加を行う。
 * 入力項目は名前のみ（学年に相当する項目は持たない）。人数の上限はない。
 * 表示順は登録順とし、属性による自動ソートは行わない（04_画面設計.md#10.4）。
 * 家族は配車画面・回答編集画面と同じ役割色（紫）のボックスで表示する。
 * Firestoreへの反映は家庭セクションの保存処理にまとめて委譲する。
 */
export function FamilyMemberSection({
  familyMemberList,
  familyActive,
  onNameChange,
  onActiveToggle,
  onAdd,
  onDelete,
}: FamilyMemberSectionProps) {
  return (
    <div id="family-member-section" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {familyMemberList.map((familyMember) => (
        <RoleBox key={familyMember.id} role="family">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              opacity: familyActive && familyMember.isActive ? 1 : 'var(--disabled-opacity)',
            }}
          >
            <UserIcon size={13} />
            <input
              type="text"
              value={familyMember.name}
              onChange={(e) => onNameChange(familyMember.id, e.target.value)}
              style={nameInputStyle}
            />
          </div>

          <div style={statusRowStyle}>
            <span style={statusLabelStyle}>在籍中</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Switch
                checked={familyMember.isActive}
                onChange={() => onActiveToggle(familyMember.id)}
                ariaLabel={`${familyMember.name || '家族'}の在籍状態`}
                disabled={!familyActive}
              />
              <Button
                variant="danger"
                size="sm"
                style={deleteButtonStyle}
                onClick={() => onDelete(familyMember.id)}
              >
                削除
              </Button>
            </div>
          </div>
        </RoleBox>
      ))}

      <AddRow onClick={onAdd} tint="family">
        + 家族を追加
      </AddRow>
    </div>
  );
}
