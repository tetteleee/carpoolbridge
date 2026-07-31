/**
 * 指定したDOM要素をPNG画像（Blob）に変換する。
 * LINE共有の共有用画像は、ShareImageLayoutを画面外に描画した要素をこの関数で
 * キャプチャして生成する（04_画面設計.md#9.1）。
 *
 * html2canvasは共有モーダルを開いたときにしか使わないため、配車画面（メイン）の
 * 初期表示バンドルを肥大化させないよう動的importにしている。
 *
 * @param container キャプチャ対象の要素（ShareImageLayoutのルート要素）
 */
export async function generateShareImage(container: HTMLElement): Promise<Blob> {
  const { default: html2canvas } = await import('html2canvas');
  const canvas = await html2canvas(container, {
    scale: 2,
    backgroundColor: '#ffffff',
  });

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('画像の生成に失敗しました'));
      }
    }, 'image/png');
  });
}
