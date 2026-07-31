import { useEffect, useRef, useState } from 'react';
import { Button } from '../common/Button';
import { CloseIcon, LoadingIndicator, ShareIcon } from '../icons';
import { ShareImageLayout } from './ShareImageLayout';
import { useShareImageData } from '../../hooks/useShareImageData';
import { generateShareImage } from '../../services/lineShare/generateShareImage';
import { shareImage } from '../../services/lineShare/shareImage';
import type { Event } from '../../types/event';

/** 共有用画像を描画するオフスクリーン要素の幅（px）。スマホ1枚の写真として見やすい幅を固定で使う */
const SHARE_IMAGE_WIDTH_PX = 380;

interface ShareModalProps {
  /** モーダルの表示・非表示 */
  open: boolean;
  /** ✕・背景タップ時 */
  onClose: () => void;
  /** 対象イベントID */
  eventId: string | undefined;
  /** 対象イベント（見出しの生成に使用） */
  event: Event | null;
  /** 目的地名（見出しの生成に使用） */
  destinationName: string;
}

/**
 * LINE共有の共有モーダル。
 * 行き・帰りの配車結果を1枚にまとめた共有用画像をプレビュー表示し、
 * 「共有」ボタンからWeb Share APIで画像を送信する（非対応環境は画像ダウンロード）。
 * 独立した画面・URLは持たず、配車画面（メイン）の上にオーバーレイ表示する。
 * ref: docs/04_画面設計.md#9 LINE共有
 */
export function ShareModal({ open, onClose, eventId, event, destinationName }: ShareModalProps) {
  const { boardDataByDirection, error: dataError } = useShareImageData(eventId, open);

  const hiddenContainerRef = useRef<HTMLDivElement>(null);
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  // モーダルを閉じたら、次に開いたときに前回の画像が一瞬見えないよう状態をリセットする
  useEffect(() => {
    if (open) {
      return;
    }
    Promise.resolve().then(() => {
      setImageUrl((prev) => {
        if (prev) {
          URL.revokeObjectURL(prev);
        }
        return null;
      });
      setImageBlob(null);
      setCaptureError(null);
      setShareFeedback(null);
    });
  }, [open]);

  // データが揃い次第、画面外に描画したShareImageLayoutを画像へ変換する（04_画面設計.md#9.1）
  useEffect(() => {
    if (!open || !event || !boardDataByDirection || imageUrl) {
      return;
    }

    let ignore = false;
    const frame = requestAnimationFrame(() => {
      const container = hiddenContainerRef.current;
      if (!container) {
        return;
      }
      generateShareImage(container)
        .then((blob) => {
          if (ignore) {
            return;
          }
          setImageBlob(blob);
          setImageUrl(URL.createObjectURL(blob));
        })
        .catch(() => {
          if (!ignore) {
            setCaptureError('画像の生成に失敗しました');
          }
        });
    });

    return () => {
      ignore = true;
      cancelAnimationFrame(frame);
    };
  }, [open, event, boardDataByDirection, imageUrl]);

  if (!open) {
    return null;
  }

  const handleShare = async () => {
    if (!imageBlob || !event) {
      return;
    }
    setSharing(true);
    setShareFeedback(null);
    try {
      const safeEventName = event.name.replace(/[\\/]/g, '_');
      const result = await shareImage(imageBlob, `配車_${event.date}_${safeEventName}.png`);
      if (result === 'downloaded') {
        setShareFeedback('ダウンロードした画像をLINEに添付して送信してください');
      }
    } catch {
      setShareFeedback('共有に失敗しました');
    } finally {
      setSharing(false);
    }
  };

  const errorMessage = dataError ?? captureError;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="LINE共有"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.4)',
        padding: '16px',
        boxSizing: 'border-box',
        zIndex: 100,
      }}
    >
      <div
        onClick={(clickEvent) => clickEvent.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '420px',
          maxHeight: '86vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '16px',
          background: 'var(--bg)',
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            padding: '10px 10px 0',
          }}
        >
          <Button
            variant="secondary"
            size="sm"
            aria-label="閉じる"
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              padding: 0,
              minHeight: 0,
              borderRadius: '50%',
              borderColor: '#D1D5DB',
              color: '#6B7280',
            }}
          >
            <CloseIcon size={14} />
          </Button>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '4px 16px 16px',
            boxSizing: 'border-box',
          }}
        >
          {errorMessage ? (
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--negative)' }}>
              {errorMessage}
            </p>
          ) : imageUrl ? (
            <img
              src={imageUrl}
              alt="共有用画像プレビュー"
              style={{
                display: 'block',
                width: '100%',
                borderRadius: '10px',
                boxShadow: '0 -1px 2px rgba(0, 0, 0, 0.02), 0 6px 16px rgba(0, 0, 0, 0.10)',
              }}
            />
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px',
                padding: '40px 0',
                color: 'var(--text)',
              }}
            >
              <LoadingIndicator />
              <span style={{ fontSize: '13px' }}>画像を生成しています…</span>
            </div>
          )}
        </div>

        <div style={{ padding: '0 16px 16px', boxSizing: 'border-box' }}>
          {shareFeedback && (
            <p
              style={{
                margin: '0 0 8px',
                fontSize: '12.5px',
                lineHeight: 1.6,
                color: 'var(--text)',
                textAlign: 'center',
              }}
            >
              {shareFeedback}
            </p>
          )}
          <Button
            variant="primary"
            icon={<ShareIcon size={16} />}
            disabled={!imageBlob || sharing}
            onClick={handleShare}
            style={{ width: '100%' }}
          >
            {sharing ? '共有中…' : '共有'}
          </Button>
        </div>
      </div>

      {/* 共有用画像のキャプチャ元。画面外に描画し、生成が終わったら破棄せず保持する（再生成は行わない） */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: '-9999px',
          width: `${SHARE_IMAGE_WIDTH_PX}px`,
        }}
      >
        {event && boardDataByDirection && (
          <div ref={hiddenContainerRef}>
            <ShareImageLayout
              eventName={event.name}
              eventDate={event.date}
              destinationName={destinationName}
              boardDataByDirection={boardDataByDirection}
            />
          </div>
        )}
      </div>
    </div>
  );
}
