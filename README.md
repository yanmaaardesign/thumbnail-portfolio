# thumbnail-portfolio-site

サムネイル制作ポートフォリオの静的サイトです。作品データは `assets/data/works.json` に集約してあり、将来CMSへ移行しやすい構成にしています。

## ローカル確認

`fetch()` でJSONを読むため、`file://` 直開きでは動きません。ローカルサーバーで確認してください。

```bash
cd /Users/masa/Desktop/Codex/thumbnail-portfolio-site
python3 -m http.server 8000
```

ブラウザで `http://localhost:8000` を開きます。

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
