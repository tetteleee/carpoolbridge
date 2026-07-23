import type { Child } from '../../types/master';
import {
  formatSchoolEntryYearLabel,
  getSchoolEntryYearOptions,
} from '../../utils/schoolGrade';
import { UserIcon } from '../icons';

interface ChildSectionProps {
  childList: Child[];
  onNameChange: (childId: string, name: string) => void;
  onSchoolEntryYearChange: (childId: string, schoolEntryYear: number) => void;
  onActiveToggle: (childId: string) => void;
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
 * マスタ管理画面「子供」セクション（家庭カード内に埋め込む）。
 * 対象家庭に紐づく子供の下書き編集・新規追加を行う。
 * Firestoreへの反映は家庭セクションの保存処理にまとめて委譲する。
 */
export function ChildSection({
  childList,
  onNameChange,
  onSchoolEntryYearChange,
  onActiveToggle,
  onAdd,
}: ChildSectionProps) {
  const schoolEntryYearOptions = getSchoolEntryYearOptions();

  return (
    <div
      id="child-section"
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
        子供
      </h3>

      <div
        id="child-list"
        style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
      >
        {childList.map((child) => (
          <div
            key={child.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              padding: '10px',
              borderRadius: '14px',
              border: '1px solid var(--border)',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
              boxSizing: 'border-box',
            }}
          >
            <label style={fieldLabelStyle}>
              名前
              <input
                type="text"
                value={child.name}
                onChange={(e) => onNameChange(child.id, e.target.value)}
                style={inputStyle}
              />
            </label>

            <label style={fieldLabelStyle}>
              入学年度
              <select
                value={child.schoolEntryYear}
                onChange={(e) =>
                  onSchoolEntryYearChange(child.id, Number(e.target.value))
                }
                style={inputStyle}
              >
                {!schoolEntryYearOptions.includes(child.schoolEntryYear) && (
                  <option value={child.schoolEntryYear}>
                    {formatSchoolEntryYearLabel(child.schoolEntryYear)}
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
                aria-checked={child.isActive}
                onClick={() => onActiveToggle(child.id)}
                style={{
                  padding: '6px 16px',
                  borderRadius: '999px',
                  border: child.isActive
                    ? '1px solid var(--accent-border)'
                    : '1px solid var(--border)',
                  background: child.isActive
                    ? 'var(--accent-bg)'
                    : 'transparent',
                  color: child.isActive ? 'var(--accent)' : 'var(--text)',
                  fontSize: '13px',
                  fontFamily: 'var(--sans)',
                  cursor: 'pointer',
                }}
              >
                {child.isActive ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onAdd}
        style={{
          alignSelf: 'flex-end',
          padding: '8px 16px',
          borderRadius: '999px',
          border: 'none',
          background: 'var(--accent-bg)',
          color: 'var(--accent)',
          fontSize: '13px',
          fontFamily: 'var(--sans)',
          cursor: 'pointer',
        }}
      >
        + 子供を追加
      </button>
    </div>
  );
}
