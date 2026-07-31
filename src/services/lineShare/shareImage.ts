/** 共有処理の結果 */
export type ShareImageResult = 'shared' | 'cancelled' | 'downloaded';

/** Web Share API（ファイル共有）にこの環境が対応しているかどうか */
function canShareFile(file: File): boolean {
  return (
    typeof navigator.share === 'function' &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [file] })
  );
}

/** ファイルをブラウザのダウンロード機能でローカルに保存する（フォールバック用） */
function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/**
 * 共有用画像をLINEへ共有する。
 * Web Share API（ファイル共有）に対応した環境ではOSの共有シートを開き、
 * 対応していない環境では画像をダウンロードする（フォールバック）。
 * ref: docs/04_画面設計.md#9.3 共有方法
 *
 * @param blob 共有対象の画像（PNG）
 * @param fileName 保存・共有時のファイル名
 * @returns 'shared'=共有シートで送信された, 'cancelled'=共有シートが利用者によりキャンセルされた,
 *   'downloaded'=Web Share API非対応のためダウンロードした
 */
export async function shareImage(blob: Blob, fileName: string): Promise<ShareImageResult> {
  const file = new File([blob], fileName, { type: 'image/png' });

  if (canShareFile(file)) {
    try {
      await navigator.share({ files: [file] });
      return 'shared';
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return 'cancelled';
      }
      throw error;
    }
  }

  downloadBlob(blob, fileName);
  return 'downloaded';
}
