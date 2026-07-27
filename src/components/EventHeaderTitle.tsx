import { MapPinIcon } from './icons';

interface EventHeaderTitleProps {
  /** 日付表示（例: "7/23(木)"）。formatDateWithWeekday済みの文字列を渡す */
  date: string;
  /** イベント名。長い場合は独立して省略表示される */
  title: string;
  /** 開催場所名。指定時のみ2行目に表示する */
  location?: string;
}

/**
 * ヘッダーのタイトル欄に表示する、日時＋イベント名（＋開催場所）のブロック。
 * 戻るボタンの上下幅に収まるよう、日時とタイトルを1行にまとめ、
 * 場所がある場合のみ2行目に追加する。各要素は独立して省略記号（…）で省略する。
 */
export function EventHeaderTitle({ date, title, location }: EventHeaderTitleProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', minWidth: 0 }}>
        <span
          style={{
            flexShrink: 0,
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--text)',
            whiteSpace: 'nowrap',
          }}
        >
          {date}
        </span>
        <span
          style={{
            flex: 1,
            minWidth: 0,
            fontSize: '16px',
            fontWeight: 700,
            color: 'var(--text-h)',
            textAlign: 'left',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {title}
        </span>
      </div>
      {location && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0, color: 'var(--text)' }}>
          <MapPinIcon size={13} />
          <span
            style={{
              flex: 1,
              minWidth: 0,
              fontSize: '12.5px',
              textAlign: 'left',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {location}
          </span>
        </div>
      )}
    </div>
  );
}
