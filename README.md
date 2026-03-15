# thumbnail-portfolio

サムネイル制作を中心としたポートフォリオサイトです。  
HTML / CSS / JavaScript で構築した静的サイトで、作品データは JSON で管理しています。

## Overview

このサイトには以下のページがあります。

- トップページ兼作品一覧
- 料金表
- お問い合わせページ
- 作品詳細ページ

主な機能:

- おすすめ作品カルーセル
- タグ絞り込み
- モーダルでの作品拡大表示
- 作品詳細ページ
- ダークモード切り替え

## Tech Stack

- HTML
- CSS
- JavaScript
- JSON

CSS は BEM と FLOCSS を意識して構成しています。

## Directory Structure

```text
.
├─ index.html
├─ price/
├─ contact/
├─ works/
├─ assets/
│  ├─ css/
│  ├─ js/
│  ├─ data/
│  └─ images/
├─ robots.txt
└─ sitemap.xml
```

## Local Development

このサイトは `fetch()` で JSON を読み込むため、`file://` ではなくローカルサーバー経由で確認してください。

```bash
python3 -m http.server 8000
```

ブラウザで以下を開きます。

```text
http://localhost:8000
```

## Data Management

作品データは以下で管理しています。

- `assets/data/works.json`

作品を追加する場合は:

1. `works.json` に作品データを追加
2. 一覧用画像を `assets/images/works/thumb/` に配置
3. 詳細表示用画像を `assets/images/works/large/` に配置

## Deployment

GitHub Pages で公開できる構成です。

## Notes

- 公開URLに応じて `site.json`、`robots.txt`、`sitemap.xml` は適宜更新してください
- 画像や作品データは今後の CMS 移行を見据えて分離しています
