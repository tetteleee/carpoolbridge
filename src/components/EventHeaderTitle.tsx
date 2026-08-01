import { CalendarIcon, MapPinIcon } from './icons';

interface EventHeaderTitleProps {
  /** 日付表示（例: "7/23(木)"）。formatDateWithWeekday済みの文字列を渡す */
  date: string;
  /** イベント名。長い場合は独立して省略表示される */
  title: string;
  /** 開催場所名。指定時のみ日付の右側に追加表示する */
  location?: string;
}

/**
 * ヘッダーのタイトル欄に表示する、イベント名（1行目）＋日付・開催場所（2行目）のブロック。
 * イベント名をボタン数が多い画面でも省略されにくいよう単独の行で大きく表示し、
 * 日付・開催場所は2行目にまとめて小さく表示する。各要素は独立して省略記号（…）で省略する。
 */
export function EventHeaderTitle({ date, title, location }: EventHeaderTitleProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1, minWidth: 0 }}>
      <div
        style={{
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
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0, color: 'var(--text)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
          <CalendarIcon size={13} />
          <span style={{ fontSize: '12.5px', whiteSpace: 'nowrap' }}>{date}</span>
        </span>
        {location && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1, minWidth: 0 }}>
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
          </span>
        )}
      </div>
    </div>
  );
}
