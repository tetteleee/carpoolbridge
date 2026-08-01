import type { CSSProperties } from 'react';

/**
 * LINE共有の共有用画像（html2canvasキャプチャ）でCardを使う場合に、box-shadowの代わりに
 * 使う「影のリング」のスタイル。html2canvasはCanvas2Dのshadow*がclip()と併用されると
 * 描画できない制約があり、Cardのbox-shadowがそのままでは一切表示されないため、
 * 背景色を塗ったリングをCardの外側にpaddingとして敷くことで代替する（配車画面本体では使わない）。
 */
export function getCaptureShadowRingStyle(dense: boolean): CSSProperties | undefined {
  return dense
    ? {
        borderRadius: '18px',
        background: 'rgba(0, 0, 0, 0.14)',
        padding: '1px 1px 4px',
      }
    : undefined;
}
