import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Button } from '../common/Button';
import { CopyIcon, EditIcon, MoreIcon, ShareIcon } from '../icons';
import type { Direction } from '../../types/event';

interface OperationAreaProps {
  /** 「回答編集」ボタン押下時に呼び出す、イベント編集画面への遷移処理 */
  onEditAnswers: () => void;
  /** 「共有」ボタン押下時に呼び出す、共有モーダルを開く処理 */
  onShare: () => void;
  /** 「⋮」メニューのコピー項目選択時に呼び出す（引数はコピー元の方向） */
  onRequestCopy: (sourceDirection: Direction) => void;
  /** 「行きの配車を帰りにコピー」項目を操作可能にするかどうか（行きに配車結果が1件以上ある場合のみtrue） */
  canCopyOutwardToReturn: boolean;
  /** 「帰りの配車を行きにコピー」項目を操作可能にするかどうか（帰りに配車結果が1件以上ある場合のみtrue） */
  canCopyReturnToOutward: boolean;
}

/** 回答編集・共有・その他ボタン共通の見た目（グレー枠のアイコンのみボタン） */
const iconButtonStyle: CSSProperties = {
  width: '34px',
  height: '34px',
  padding: 0,
  minHeight: 0,
  borderColor: '#D1D5DB',
  color: '#6B7280',
};

/**
 * 配車画面（メイン）の操作エリア。
 * 「回答編集」「共有」ボタンと、行き⇔帰りコピーを格納する「⋮」（その他）メニューを表示する。
 * 共有対象は選択中タブに関わらず常に行き・帰り両方向のため、共有ボタンは方向を渡さない
 * （04_画面設計.md#8 操作エリア）。
 * コピーは往復セットアップ時に1回程度しか使わない低頻度操作のため、常設ボタンにはせず
 * 「⋮」メニューへ格納する（04_画面設計.md#8 行き⇔帰りコピー）。
 */
export function OperationArea({
  onEditAnswers,
  onShare,
  onRequestCopy,
  canCopyOutwardToReturn,
  canCopyReturnToOutward,
}: OperationAreaProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const anchorRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }
    const handlePointerDown = (event: PointerEvent) => {
      if (anchorRef.current && !anchorRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isMenuOpen]);

  const handleCopySelect = (sourceDirection: Direction) => {
    setIsMenuOpen(false);
    onRequestCopy(sourceDirection);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
      <Button
        variant="secondary"
        size="sm"
        aria-label="回答編集"
        onClick={onEditAnswers}
        style={iconButtonStyle}
      >
        <EditIcon size={16} />
      </Button>
      <Button
        variant="secondary"
        size="sm"
        aria-label="共有"
        onClick={onShare}
        style={iconButtonStyle}
      >
        <ShareIcon size={16} />
      </Button>
      <span ref={anchorRef} style={{ position: 'relative' }}>
        <Button
          variant="secondary"
          size="sm"
          aria-label="その他の操作"
          aria-haspopup="menu"
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((open) => !open)}
          style={iconButtonStyle}
        >
          <MoreIcon size={16} />
        </Button>
        {isMenuOpen && (
          <div
            role="menu"
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              right: 0,
              zIndex: 20,
              minWidth: '236px',
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              boxShadow: 'var(--shadow)',
              padding: '6px',
              boxSizing: 'border-box',
            }}
          >
            <MenuItem
              disabled={!canCopyOutwardToReturn}
              onClick={() => handleCopySelect('OUTWARD')}
            >
              行きの配車を帰りにコピー
            </MenuItem>
            {!canCopyOutwardToReturn && <MenuHint>行きの配車結果がまだありません</MenuHint>}
            <MenuItem
              disabled={!canCopyReturnToOutward}
              onClick={() => handleCopySelect('RETURN')}
            >
              帰りの配車を行きにコピー
            </MenuItem>
            {!canCopyReturnToOutward && <MenuHint>帰りの配車結果がまだありません</MenuHint>}
          </div>
        )}
      </span>
    </div>
  );
}

interface MenuItemProps {
  disabled: boolean;
  onClick: () => void;
  children: string;
}

/** 「⋮」メニュー内の1項目（行き⇔帰りコピーの各方向） */
function MenuItem({ disabled, onClick, children }: MenuItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px',
        border: 'none',
        background: 'transparent',
        borderRadius: '8px',
        fontSize: '13.5px',
        fontWeight: 700,
        fontFamily: 'var(--sans)',
        color: disabled ? 'var(--text)' : 'var(--text-h)',
        textAlign: 'left',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 'var(--disabled-opacity)' : 1,
        boxSizing: 'border-box',
      }}
    >
      <CopyIcon size={16} />
      {children}
    </button>
  );
}

/** 「⋮」メニュー項目が無効化されている理由を示す補足文 */
function MenuHint({ children }: { children: string }) {
  return (
    <div style={{ padding: '2px 10px 6px 38px', fontSize: '11.5px', color: 'var(--text)' }}>
      {children}
    </div>
  );
}
