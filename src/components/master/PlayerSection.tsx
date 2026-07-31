import type { CSSProperties } from 'react';
import type { Player } from '../../types/master';
import {
  formatSchoolEntryYearLabel,
  getSchoolEntryYearOptions,
} from '../../utils/schoolGrade';
import { AddRow } from '../common/AddRow';
import { RoleBox } from '../common/RoleBox';
import { Switch } from '../common/Switch';
import { UserIcon } from '../icons';

interface PlayerSectionProps {
  playerList: Player[];
  onNameChange: (playerId: string, name: string) => void;
  onSchoolEntryYearChange: (playerId: string, schoolEntryYear: number) => void;
  onActiveToggle: (playerId: string) => void;
  onAdd: () => void;
}

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

const gradeSelectStyle: CSSProperties = {
  flexShrink: 0,
  width: '150px',
  padding: '6px 4px',
  borderRadius: '6px',
  border: '1px solid var(--border)',
  // iOSはinput/selectのfont-sizeが16px未満だとフォーカス時に自動でズームしてしまうため16px以上にする
  fontSize: '16px',
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
 * マスタ管理画面「選手」セクション（家庭カード内に埋め込む）。
 * 対象家庭に紐づく選手の下書き編集・新規追加を行う。
 * 選手は配車画面・回答編集画面と同じ役割色（青灰色）のボックスで表示する（04_画面設計.md#10.4）。
 * Firestoreへの反映は家庭セクションの保存処理にまとめて委譲する。
 */
export function PlayerSection({
  playerList,
  onNameChange,
  onSchoolEntryYearChange,
  onActiveToggle,
  onAdd,
}: PlayerSectionProps) {
  const schoolEntryYearOptions = getSchoolEntryYearOptions();

  return (
    <div id="player-section" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {playerList.map((player) => (
        <RoleBox key={player.id} role="player">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              opacity: player.isActive ? 1 : 'var(--disabled-opacity)',
            }}
          >
            <UserIcon size={13} />
            <input
              type="text"
              value={player.name}
              onChange={(e) => onNameChange(player.id, e.target.value)}
              style={nameInputStyle}
            />
            <select
              value={player.schoolEntryYear}
              onChange={(e) => onSchoolEntryYearChange(player.id, Number(e.target.value))}
              style={gradeSelectStyle}
            >
              {!schoolEntryYearOptions.includes(player.schoolEntryYear) && (
                <option value={player.schoolEntryYear}>
                  {formatSchoolEntryYearLabel(player.schoolEntryYear)}
                </option>
              )}
              {schoolEntryYearOptions.map((year) => (
                <option key={year} value={year}>
                  {formatSchoolEntryYearLabel(year)}
                </option>
              ))}
            </select>
          </div>

          <div style={statusRowStyle}>
            <span style={statusLabelStyle}>在籍中</span>
            <Switch
              checked={player.isActive}
              onChange={() => onActiveToggle(player.id)}
              ariaLabel={`${player.name || '選手'}の在籍状態`}
            />
          </div>
        </RoleBox>
      ))}

      <AddRow onClick={onAdd} tint="player">
        + 選手を追加
      </AddRow>
    </div>
  );
}
