# 対象設計書

ref: docs/11_PWA化設計.md#4, #5

# ゴール

PWA用アイコン（192×192・512×512のPNG）を生成し、`public/`にコミットする。
将来ロゴを変更した際にも再生成できるよう、生成処理をスクリプト化して残す。

# 変更対象ファイル

- `scripts/generate-pwa-icons.ts`（新規）
- `public/pwa-icon-source.svg`（新規）
- `public/pwa-192x192.png`（新規・生成物）
- `public/pwa-512x512.png`（新規・生成物）
- `package.json`（`sharp`を`devDependencies`に追加）

# 実装範囲（やること）

- `public/favicon.svg`と同じ図案・ブランドカラー（`#3d5a80`）を使い、
  viewBoxをクロップしない（`0 0 512 512`のフルキャンバス）版のSVGを
  `public/pwa-icon-source.svg`として新規作成する
- `sharp`を`devDependencies`に追加する
- `scripts/generate-pwa-icons.ts`を作成し、`pwa-icon-source.svg`から
  `public/pwa-192x192.png`・`public/pwa-512x512.png`を生成する
  （`scripts/seed/`と同様、`tsx`で実行できるワンショットスクリプトとする）
- 上記スクリプトを実行し、生成されたPNG2枚をコミット対象とする

# 実装範囲外（やらないこと・触らないこと）

- maskable icon（安全域を考慮したアイコン）の作成は行わない
  （docs/11_PWA化設計.md#8で対象外と明記）
- `favicon.svg`・`apple-touch-icon.png`等、既存のfavicon関連ファイルは変更しない
- `vite.config.ts`のPWAプラグイン設定（T92の範囲）は行わない
- `package.json`への`npm run`スクリプト登録は必須ではない
  （一度きりの実行手段として`npx tsx scripts/generate-pwa-icons.ts`が使えれば十分）

# 受け入れ条件（完了判定基準）

- `public/pwa-192x192.png`・`public/pwa-512x512.png`が存在し、
  それぞれ指定サイズのPNGとして開ける
- `npm run build`が引き続き成功する
- `npx eslint .`がエラーなく通る（生成スクリプトが対象に含まれる場合）

# 依存タスク

なし
