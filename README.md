# remotion-voisona-example

Next.js 管理画面から VoiSona Talk の text-analysis / TTS / TSML 調整 / Remotion render を試すための学習用サンプル。

https://github.com/user-attachments/assets/368aaad0-d5dc-477d-b181-47dd4b0e2091

## できること

- 管理画面でセリフ行を追加、編集、削除する
- VoiSona Talk REST API に text-analysis を送って TSML を取得する
- `hl` と `chain` を GUI で編集してアクセントを調整する
- 行単位で音声 preview を再生する
- 保存時に全行の音声、duration、timeline を再構築する
- Remotion Player で保存済みデータを preview する
- 管理画面から render を実行し、進行ログを表示する

## セットアップ

1. `cp .env.example .env.local`
2. `.env.local` に VoiSona Talk REST API の接続情報を入れる
3. `pnpm setup`
4. `pnpm dev`

`pnpm` 11 系で `ERR_PNPM_IGNORED_BUILDS` が出る場合:

- `pnpm approve-builds esbuild sharp`
- `pnpm install`

管理画面:

- [http://localhost:3000](http://localhost:3000)

手動 render:

- `pnpm render`

出力先:

- 保存済みデータ: `data/sequences.json`
- render 状態: `data/render-state.json`
- 生成音声: `public/tts`
- 動画: `out/latest.mp4`

## VoiSona API の参考リンク

- [VoiSona Talk REST API チュートリアル](https://manual.voisona.com/ja/talk/pc/2b6e9bc7efb180ea86ccc6c7347e9ca6)
- [VoiSona Talk マニュアル](https://manual.voisona.com/ja/talk/pc)

## ディレクトリの見方

```text
src/
  app/
    api/        API routes
    ui/         管理画面の UI
  lib/          VoiSona, 保存処理, render 状態管理
  remotion/     Composition と render entry
data/           保存済み JSON と render state
public/tts/     生成音声キャッシュ
out/            render 出力
```

## 技術構成

- UI: Next.js App Router
- フォーム状態: React state
- 音声合成: VoiSona Talk REST API
- 動画 preview: `@remotion/player`
- 動画 render: Remotion CLI
- 音声 duration 計測: `mediabunny`
- バリデーション: `zod`

## 実装の考え方

このリポジトリは、編集状態と保存済み状態を分けている。

- 管理画面のフォームは編集中の draft を持つ
- Player は保存済み `data/sequences.json` だけを再生する
- `Save` 実行時に、サーバーが全行の TTS と timeline を再構築する

この分離で、編集中の不完全なデータを Remotion 側へ流さずに済む。render も常に保存済み JSON を入力にするので、preview と render の入力が一致する。

## データフロー

1. ユーザーが管理画面でセリフ、読み、voice を編集する
2. `Analyze` が `/api/voisona/text-analysis` を呼ぶ
3. サーバーが VoiSona に text-analysis を送り、TSML を返す
4. ユーザーが GUI で `hl` と `chain` を調整する
5. `Save` が `/api/sequences` を呼ぶ
6. サーバーが全行を順に音声合成し、duration を計測する
7. サーバーが timeline と `data/sequences.json` を更新する
8. Player と render は保存済み JSON を読む

## 機能ごとの実装解説

### 1. Voice 一覧の取得

- 実装: `src/app/api/voices/route.ts`
- コア処理: `src/lib/voisona.ts`

管理画面の初期表示で `/api/voices` を呼ぶ。サーバーは VoiSona API の候補エンドポイントを順に試し、レスポンスから `voiceName` と `voiceVersion` を抽出する。  
一覧取得に失敗した場合でも、管理画面は開く。TTS 系の操作だけを止める。

```ts
const candidatePaths = ["/voice-libraries", "/voices", "/voice-library-versions"];

for (const candidatePath of candidatePaths) {
  // 利用可能な voice 一覧を取れそうな API を順に試す
  const response = await fetch(`${VOISONA_BASE}${candidatePath}`, {
    headers: getHeaders(),
  });

  if (!response.ok) continue;

  // レスポンスを走査して voiceName / voiceVersion を抽出する
  const options = collectVoiceOptions(await response.json());
  if (options.length > 0) return options;
}
```

### 2. text-analysis と TSML 編集

- 実装: `src/app/api/voisona/text-analysis/route.ts`
- GUI editor: `src/app/ui/tsml-editor.tsx`

text-analysis は `readText` を優先し、未入力なら `text` を使う。改行は VoiSona 向けに正規化する。  
GUI editor は TSML をパースして、各単語の `hl` と単語境界の `chain` だけを編集対象にする。これでアクセント調整に必要な要素へ絞っている。

### 3. 音声 preview

- 実装: `src/app/api/voisona/synthesize/route.ts`
- コア処理: `src/lib/voisona.ts`

`Preview` は単一行だけを合成する。レスポンスで返した `audioSrc` をブラウザの `Audio` で直接再生する。  
合成結果は `public/tts` にキャッシュする。同じ入力なら同じ wav を再利用する。

### 4. 保存時の全件再構築

- 実装: `src/app/api/sequences/route.ts`
- コア処理: `src/lib/project-builder.ts`

`Save` はフォーム内容をそのまま JSON 保存しない。サーバーが全行を検証し、必要なら text-analysis を補完し、全行の音声を生成して duration を計測してから保存する。  
timeline は各行の `durationSec` を順に積み上げて作る。

```ts
const analyzedText =
  item.speech?.analyzedText?.trim() ||
  (await analyzeVoisonaText({ text: readText, language: "ja_JP" })).analyzedText;

// 保存時に音声を確定生成する
const audio = await synthesizeVoisona({
  text: readText,
  analyzedText,
  voiceName: item.voiceName,
  voiceVersion: item.voiceVersion,
});

// duration を順に積み上げて timeline を作る
currentSec += audio.durationSec + AUDIO_PADDING_SECONDS;
```

### 5. Remotion preview

- Player: `src/app/ui/player-pane.tsx`
- Composition: `src/remotion/component.tsx`
- Root: `src/remotion/root.tsx`

Remotion 側は最小構成にしている。保存済み timeline から現在時刻の行を求め、画面中央にテキストを表示する。  
音声は各 timeline 区間に対応する `Audio` を `Sequence` で並べて再生する。

### 6. Render 実行とログ表示

- Render API: `src/app/api/render/route.ts`
- SSE: `src/app/api/render/stream/route.ts`
- 状態管理: `src/lib/render-state.ts`

`Render` ボタンはサーバー側で `pnpm exec remotion render ...` を子プロセス実行する。  
stdout と stderr は render state に追記し、`data/render-state.json` にも保存する。SSE はその state を購読しつつ、ファイルも定期的に読み直してログを管理画面へ流す。

この構成にした理由は、API route ごとにメモリが分離されてもログ配信を壊さないため。

```ts
const child = spawn("pnpm", ["exec", "remotion", "render", ...args], {
  cwd: PROJECT_ROOT,
  env: process.env,
});

pipeOutput(child.stdout, (line) => {
  // CLI の標準出力をそのままログへ積む
  appendLog(line);
});

pipeOutput(child.stderr, (line) => {
  // エラー出力も同じ stream として扱う
  appendLog(line);
});
```

## API 一覧

### `GET /api/voices`

- VoiSona から voice 一覧を取得する
- 返り値は `voiceName`, `voiceVersion`, `displayName`

### `POST /api/voisona/text-analysis`

- 入力: `text`, `language`
- 出力: `analyzedText`

### `POST /api/voisona/synthesize`

- 入力: `text`, `analyzedText?`, `voiceName`, `voiceVersion?`
- 出力: `audioSrc`, `outputPath`, `durationSec`

### `GET /api/sequences`

- 保存済み `data/sequences.json` を返す

### `POST /api/sequences`

- draft を受け取り、音声、duration、timeline を再構築して保存する

### `POST /api/render`

- render を開始する
- 同時実行は 1 本に制限する

### `GET /api/render/stream`

- SSE で render 状態とログを返す

### `GET /api/render/video`

- `out/latest.mp4` を返す
