/**
 * iOS Safariはcanvasの1辺のサイズに実務上の上限（およそ4096px程度）があり、
 * 参加人数・車台数が多いイベントは行き・帰り両方向をまとめた共有用画像の縦幅が
 * これを超えて画像生成に失敗することがある。そのため、内容の縦幅に応じて
 * scaleを動的に下げ、常にこの上限に収まるようにする（安全マージンを取った値）。
 */
const MAX_CANVAS_DIMENSION_PX = 4000;

/** キャプチャに使うscale。小〜中人数のイベントでは通常のscale（2倍・高精細）を使う */
const DEFAULT_SCALE = 2;

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
  const scale = Math.min(
    DEFAULT_SCALE,
    MAX_CANVAS_DIMENSION_PX / container.scrollHeight
  );
  const canvas = await html2canvas(container, {
    scale,
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
