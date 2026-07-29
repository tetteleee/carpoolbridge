import type { Player } from '../../types/master';
import {
  formatSchoolEntryYearLabel,
  getSchoolEntryYearOptions,
} from '../../utils/schoolGrade';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { UserIcon } from '../icons';

interface PlayerSectionProps {
  playerList: Player[];
  onNameChange: (playerId: string, name: string) => void;
  onSchoolEntryYearChange: (playerId: string, schoolEntryYear: number) => void;
  onActiveToggle: (playerId: string) => void;
  onAdd: () => void;
}

const fieldLabelStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  fontSize: '12px',
  color: 'var(--text)',
} as const;

const inputStyle = {
  padding: '8px 10px',
  borderRadius: '6px',
  border: '1px solid var(--border)',
  fontSize: '16px',
  fontFamily: 'var(--sans)',
  color: 'var(--text-h)',
  background: 'transparent',
  boxSizing: 'border-box',
} as const;

/**
 * マスタ管理画面「選手」セクション（家庭カード内に埋め込む）。
 * 対象家庭に紐づく選手の下書き編集・新規追加を行う。
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
    <div
      id="player-section"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        paddingTop: '8px',
        borderTop: '1px dashed var(--border)',
      }}
    >
      <h3
        style={{
          margin: 0,
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          color: 'var(--text-h)',
        }}
      >
        <UserIcon size={15} />
        選手
      </h3>

      <div
        id="player-list"
        style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
      >
        {playerList.map((player) => (
          <Card
            key={player.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              padding: '10px',
            }}
          >
            <label style={fieldLabelStyle}>
              名前
              <input
                type="text"
                value={player.name}
                onChange={(e) => onNameChange(player.id, e.target.value)}
                style={inputStyle}
              />
            </label>

            <label style={fieldLabelStyle}>
              入学年度
              <select
                value={player.schoolEntryYear}
                onChange={(e) =>
                  onSchoolEntryYearChange(player.id, Number(e.target.value))
                }
                style={inputStyle}
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
            </label>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '4px',
              }}
            >
              <span style={{ fontSize: '12px', color: 'var(--text)' }}>
                在籍中
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={player.isActive}
                onClick={() => onActiveToggle(player.id)}
                style={{
                  padding: '6px 16px',
                  borderRadius: '999px',
                  border: player.isActive
                    ? '1px solid var(--accent-border)'
                    : '1px solid var(--border)',
                  background: player.isActive
                    ? 'var(--accent-bg)'
                    : 'transparent',
                  color: player.isActive ? 'var(--accent)' : 'var(--text)',
                  fontSize: '13px',
                  fontFamily: 'var(--sans)',
                  cursor: 'pointer',
                }}
              >
                {player.isActive ? 'ON' : 'OFF'}
              </button>
            </div>
          </Card>
        ))}
      </div>

      <Button
        variant="secondary"
        size="sm"
        onClick={onAdd}
        style={{ alignSelf: 'flex-end' }}
      >
        + 選手を追加
      </Button>
    </div>
  );
}
