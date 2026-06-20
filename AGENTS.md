# Project Rules

このPJの Health 改善と `fallow` 解消は、今後すべて `責務分離` を主軸に進める。
見かけ上の suppress や広い ignore ではなく、構造改善で解消する。

## Core Policy

- 分割軸は `責務` とする。機能名や見た目だけでは切らない
- 1ファイル1責務を原則にし、UI、状態管理、副作用、変換、永続化、通信を分離する
- 巨大関数をそのまま別ファイルへ移すだけの分割は禁止する
- `route` / `use-case` / `helper` / `parser` / `client API` の責務を混ぜない

## Visibility Policy

- helper / parser / mapper / comparator / formatter は原則 `export` しない
- 同一 feature 内でしか使わない処理は、その feature 配下の非公開実装に留める
- `export` は別モジュールから実使用がある場合のみ許可する
- `_shared` への抽出は複数 feature から実利用が発生した純粋関数・型だけに限定する
- 「将来使うかもしれない」は公開や保持の理由にしない

## Frontend Policy

- UI は `Hook中心` で分割する
- コンポーネントは描画と画面内 orchestration に寄せる
- 条件分岐、比較、データ整形、fetch、ローカル状態遷移は hook または純粋関数に分離する
- custom hook は副作用と状態遷移の束ね役までとし、重い変換ロジックは通常関数へ逃がす
- JSX の見た目単位で部品化してよいが、ロジック分離を優先する

## Server Policy

- `route` は HTTP 入出力、status code、SSE/Response 配線だけ持つ
- `use-case` は業務フローだけ持つ
- 外部API呼び出し、ファイルIO、ポーリング、認証ヘッダ生成、レスポンス正規化は helper / adapter に分ける
- parse / normalize / compare 系は pure function として分離する

## Split Thresholds

- 80行超の関数は分割候補
- UI / IO / 変換 の3責務が同居したら分割必須
- network / fs / timer を触る処理は pure function と分離必須
- 同一関数内に複数のネストした `if` / `map` / `Promise.all` が重なり、読解コストが高い場合は分割必須

## Dead Code Policy

- 未使用 export は suppress せず、削除か非公開化で解消する
- 重複エントリや到達不能ファイルは削除する
- 共有UI部品はファイル削除より先に export 面を縮小する

## Fallow Operation

- `.fallowrc.json` の `dynamicallyLoaded` を正規の到達性設定として維持する
- dead code 判定はこの補正後の結果を基準に扱う
- 目標は常に以下
- `./node_modules/.bin/fallow dead-code --format json --quiet` で `total_issues = 0`
- `./node_modules/.bin/fallow health --format json --quiet --score` で `functions_above_threshold = 0`
- `./node_modules/.bin/fallow --format json --quiet` で総合指摘ゼロ

## Testing Policy

- 分割で切り出した pure function には必要な単体テストを追加する
- route / use-case の既存テストは維持する
- 複雑な分岐を helper に外出しした場合は assertion を増やして守る
- `pnpm test` と `pnpm build` を通してから完了とする
