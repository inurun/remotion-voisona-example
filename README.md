# remotion-voisona-example

Next.js 管理画面で `page + TTS` を編集し、VoiSona の text-analysis / preview / save / Remotion render まで一通り試せるテンプレ。

https://github.com/user-attachments/assets/7488dc5a-36bd-4a98-8333-38f514935c30

## TODO

- [x] blankページ追加機能
  - [x] 追加ボタンはサイドバーヘッダー右端にアイコンのみ
  - [x] 同時に複製機能、既存プロジェクト右端にアイコンのみのボタン設置、押下で複製
- [x] ページタイプの追加（intro, main, outro）
  - [x] intro, outroはデモ用、とりあえず今はmainと全く同じ構成で良い
  - [x] remotion側も修正、mainの構成をコピーして
  - [x] ページごとにdurationSecを持つように修正
  - [x] ページごとに`padAfterSec`と`padBeforeSec`を追加
  - [x] pad系はページの前後の秒数、padBeforeSecが1sなら、ページが始まる前に1秒の空白期間がある
  - [x] 主にトランジションや余韻とかの表現用、トランジション表現用意できていないので今は0秒デフォルト、設定するUIも不要
  - [x] durationSecはpad系の値を加算した値（総時間として処理）
  - [x] getProjectPlaybackは削除、かわりにremedaの`sumBy()`関数で計算、getProjectPlaybackによる余計な計算コストを減らす
  - [x] remotion側も合わせて修正
- [ ] ページ設定の追加
  - [ ] page-header右端に設定アイコン、ダイアログ
  - [ ] サンプルなのでページタイトルのみ
  - [ ] ページ追加時にダイアログ表示、追加のフロー
  - [ ] ページタイプの変更は不可、設定可能なのは追加時のダイアログだけ
- [ ] アプリケーション設定機能の追加
  - [ ] サイドバー一番下に設定アイコン、ダイアログ
  - [ ] voices再取得、ボイスごとのラベル・ホットキー（ctrl+1, ctrl+2...）、そのほかホットキー設定
  - [ ] 全てLocalStorage管理
- [ ] テーマ切り替え機能の追加
  - [ ] ライト・ダーク
  - [ ] 後段のプロジェクト設定で切り替えられるようにするので、UIは不要
- [ ] プロジェクト設定の追加
  - [ ] ヘッダー右端に設定アイコン、ダイアログ
  - [ ] 横長（デフォルト）、正方形、縦長のプリセットから動画サイズ
  - [ ] レンダー時にもwidth, heigthをちゃんと伝えられるように
  - [ ] プロジェクトタイトル・プロジェクト説明文
- [ ] 立ち絵機能の追加
  - [ ] psdToolkitの導入
  - [ ] psdToolkitで設定可能な項目はここで基本いじれるようにしたい
- [ ] TTS、現状保存時にTSMLが更新されないため、テキストは変わるが音声データが変わらない
  - [ ] readTextの更新時にはanalyzeを実施、TSMLを更新するように修正
- [ ] ページ変更時に、PreviewのPlayerの再生位置を、そのページが始まるタイミングに変更
- [ ] ヘッダーfixedで固定
- [ ] エディタリッチテキスト領域のcollapsibleでたためるように
- [ ] Config、TSMLエディタのUI調整

## できること

- ページ単位で本文をリッチテキスト編集する
- ページ内に複数の TTS 行を追加して並べる
- VoiSona Talk REST API に text-analysis を送り、TSML を調整する
- 行単位で音声 preview を再生する
- 保存時に変更があった TTS だけ再生成する
- Remotion Player で保存済み project を preview する
- 管理画面から render を実行し、進行ログを表示する
- リッチテキストに画像をアップロードして埋め込む

## セットアップ

1. `cp .env.example .env.local`
2. `.env.local` に VoiSona Talk REST API の接続情報を入れる
3. `pnpm setup`
4. `pnpm hooks:install`
5. `pnpm dev`

管理画面:

- [http://localhost:3000](http://localhost:3000)

手動 render:

- `pnpm render`

## 出力先

- 保存済みデータ: `data/project.json`
- render 状態: `data/render-state.json`
- 生成音声: `public/tts`
- アップロード画像: `public/uploads`
- 動画: `out/latest.mp4`

## 技術構成

- App: Next.js App Router
- UI: Tailwind CSS v4 + Base UI + shadcn-style components
- Form: React Hook Form + Zod
- Rich text: Tiptap
- Audio/TTS: VoiSona Talk REST API
- Preview: `@remotion/player`
- Render: Remotion CLI
- Lint/Format: `oxlint` / `oxfmt`
- Hooks: `lefthook`

## データ構造

保存形式は `pages[]` ベース。

```json
{
  "pages": [
    {
      "id": "page-1",
      "type": "main",
      "padBeforeSec": 0,
      "padAfterSec": 0,
      "durationSec": 1.23,
      "richText": "<h1>Title</h1><p>Body</p>",
      "tts": [
        {
          "id": "tts-1",
          "text": "本文",
          "readText": "ほんぶん",
          "voiceName": "Some Voice",
          "voiceVersion": "",
          "durationSec": 1.23,
          "audio": {
            "src": "/tts/xxx.wav"
          },
          "speech": {
            "analyzedText": "<tsml>...</tsml>"
          }
        }
      ]
    }
  ]
}
```

管理画面は draft を持ち、`Save` 時にサーバーが project を確定させる。

- `richText` はページ本文
- `type` はページ種別（`intro`, `main`, `outro`）
- `padBeforeSec`, `padAfterSec` はページ前後の余白秒数
- ページの `durationSec` は `tts[].durationSec` の合計に pad 系を足した総時間
- `tts[]` は読み上げ単位
- 保存時に `readText`, `analyzedText`, `audio`, `durationSec` を再計算する
- 変更がない TTS は前回生成済み音声を再利用する

## API

### `GET /api/project`

- 保存済み `data/project.json` を返す

### `POST /api/project`

- draft project を受け取り、必要な TTS だけ再生成して保存する

### `GET /api/voices`

- VoiSona から voice 一覧を取得する

### `POST /api/voisona/text-analysis`

- 入力: `text`, `language`
- 出力: `analyzedText`

### `POST /api/voisona/synthesize`

- 入力: `text`, `analyzedText?`, `voiceName`, `voiceVersion?`
- 出力: `audioSrc`, `outputPath`, `durationSec`

### `POST /api/uploads/image`

- 画像を `public/uploads` に保存し、公開パスを返す

## テンプレとして置き換える場所

- `src/remotion/component.tsx`
  - 映像表現の本体。今は最小構成
- `src/app/ui/editor-pane.tsx`
  - 管理画面の編集体験
- `src/lib/project-builder.ts`
  - 保存時に何を確定値として持つか
- `data/project.json`
  - 初期サンプル

## 公開リポジトリ運用メモ

- `.env`, `.env.local`, `public/tts`, `public/uploads`, `out`, `data/render-state.json` は Git 管理しない
- フォントや案件固有アセットは同梱しない前提
- 画像アップロードはローカル保存なので、必要なら S3 などに差し替える
