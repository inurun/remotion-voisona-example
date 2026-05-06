# remotion-voisona-example

Next.js 管理画面から VoiSona Talk の text-analysis / TTS / TSML 調整 / Remotion render を試すための最小サンプル。

## Demo

- デモ動画: ![demo.mp4](./demo.mp4)

## Setup

1. `cp .env.example .env.local`
2. `.env.local` に VoiSona Talk REST API の接続情報を入れる
3. `pnpm setup`
4. `pnpm dev`

`pnpm` 11 系で `ERR_PNPM_IGNORED_BUILDS` が出る環境では、以下で通す:

- `pnpm approve-builds esbuild sharp`
- `pnpm install`

管理画面:

- [http://localhost:3000](http://localhost:3000)

手動 render:

- `pnpm render`

出力先:

- 保存済みデータ: `data/sequences.json`
- 生成音声: `public/tts`
- 動画: `out/latest.mp4`
