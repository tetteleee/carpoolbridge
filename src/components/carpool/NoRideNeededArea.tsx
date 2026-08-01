import { FlagIcon } from '../icons';
import { PersonCard, type PersonCardData } from './PersonCard';
import { Card } from '../common/Card';
import { getCaptureShadowRingStyle } from '../../utils/captureShadowRing';

/** 配車不要エリアに表示する人カード1件分のデータ */
export type NoRideNeededPerson = PersonCardData;

interface NoRideNeededAreaProps {
  /** 選択中タブ（行き／帰り）に応じた配車不要の選手一覧 */
  people: NoRideNeededPerson[];
  /**
   * 影の代わりに背景色を塗ったリングで囲むかどうか。
   * LINE共有の共有用画像（html2canvasキャプチャ）で使用する（04_画面設計.md#9.2）。
   */
  dense?: boolean;
}

/**
 * 配車画面（メイン）の配車不要エリア。
 * 参加はするが対象方向の送迎が不要（現地集合・保護者お迎え等）と回答された選手を表示する。
 * 未配車エリアとは異なり画面最下部に配置し、枠線・見出しの色を控えめにすることで
 * 「対応が必要な状態」ではないことを示す。ドラッグ＆ドロップの対象外とする。
 * 配車不要人数が0人の場合はエリア自体を非表示にする。
 * 人カードは車カード・未配車エリアと同じチップ形式（折り返し表示）で並べる。
 * 送迎が不要なため集合場所は表示しない（PersonCardのcompact表示を使用）。
 * ref: docs/04_画面設計.md#8 配車不要エリア
 */
export function NoRideNeededArea({ people, dense = false }: NoRideNeededAreaProps) {
  if (people.length === 0) {
    return null;
  }

  return (
    <div style={getCaptureShadowRingStyle(dense)}>
      <Card as="section" style={{ overflow: 'hidden' }}>
        <h2
          style={{
            margin: 0,
            padding: '10px 12px',
            fontSize: '14px',
            fontWeight: 700,
            color: 'var(--text)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <FlagIcon size={16} />
          {'配車不要　' + people.length + '名'}
        </h2>

        <p
          style={{
            margin: 0,
            padding: '8px 12px',
            fontSize: '11px',
            lineHeight: 1.6,
            color: 'var(--text)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          現地集合・保護者お迎えなど、送迎が不要な参加者です。
        </p>

        <div style={{ padding: dense ? '6px 8px' : '8px 10px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: dense ? '6px' : '10px' }}>
            {people.map((person) => (
              <PersonCard key={person.id} person={person} draggable={false} compact />
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
