# thumbnail-portfolio-site

サムネイル制作ポートフォリオの静的サイトです。作品データは `assets/data/works.json` に集約してあり、将来CMSへ移行しやすい構成にしています。

## ローカル確認

`fetch()` でJSONを読むため、`file://` 直開きでは動きません。ローカルサーバーで確認してください。

```bash
cd thumbnail-portfolio-site
python3 -m http.server 8000
```

ブラウザで `http://localhost:8000` を開きます。

## GitHub Pages で公開する流れ

1. GitHub で新しいリポジトリを作成
2. このフォルダでリモートを追加
3. `main` を push
4. GitHub の Pages 設定で `main` ブランチを公開元に指定

コマンド例:

```bash
cd thumbnail-portfolio-site
git remote add origin <YOUR_GITHUB_REPO_URL>
git push -u origin main
```

公開URLは通常、`https://<GitHubユーザー名>.github.io/<リポジトリ名>/` 形式です。

公開先URLが確定したら、以下も更新します。

- `assets/data/site.json`
- `robots.txt`
- `sitemap.xml`

## 主な構成

- `index.html`: トップページ兼作品一覧
- `price/index.html`: 料金表
- `contact/index.html`: お問い合わせ
- `works/detail.html`: 作品詳細テンプレート
- `assets/data/works.json`: 作品データ
- `assets/js/main.js`: 一覧描画、絞り込み、カルーセル、モーダル、詳細表示
- `assets/css/`: FLOCSS寄りのCSS分割

## 作品の追加方法

1. `assets/data/works.json` に作品を追加
2. `assets/images/works/thumb/` に一覧用画像を配置
3. `assets/images/works/large/` に詳細用画像を配置
4. `featured: true` を付けるとカルーセル対象になります

## 更新時のコミット手順

更新時は以下で十分です。

```bash
cd thumbnail-portfolio-site
git status
git add .
git commit -m "作品追加や文言更新の内容"
git push
```

よくある更新例:

- 作品追加: `works.json` と画像ファイルを更新してコミット
- 文言修正: HTML や CSS を更新してコミット
- 料金改定: `price/index.html` を更新してコミット

コミットは「1つの変更テーマごと」に分けると履歴が見やすくなります。

例:

- `git commit -m "Add 3 new thumbnail works"`
- `git commit -m "Update contact section copy"`
- `git commit -m "Adjust price page wording"`

## 公開前に差し替える項目

- `assets/data/site.json` の `siteUrl`
- `robots.txt` のサイトURL
- `sitemap.xml` のURL群
- 仮のSVGサンプル画像を実作品に置換
- 必要ならOGP画像を実デザインに差し替え

## 将来拡張

- 問い合わせフォーム追加
- CMS連携
- デザイン作品カテゴリ追加
- 詳細ページの静的生成化
