# CMS Migration Notes

## Goal

公開サイトはそのまま維持しつつ、管理者だけがログインして作品を追加・編集できる構成へ移行する。

## Recommended structure

- Public site: current static portfolio
- Admin app: separate admin UI for authenticated updates
- Backend: Supabase
  - Auth: admin login
  - Database: works and taxonomy data
  - Storage: work images

## Security baseline

- Public frontend uses only the public anon key
- Write operations are allowed only for authenticated admin users
- Service role key is never exposed to browser code
- Storage upload policy is restricted to admin users
- Draft works are not returned in public queries

## Data model

Works should move from a flat `tags` array to explicit fields.

- `featured`
- `source_type`
  - `self_made`
  - `trace`
- `genres`
  - `business`
  - `cooking`
  - `entertainment`
  - extendable
- `status`
  - `draft`
  - `published`

## Public site mapping

- Carousel: `featured = true` and `status = published`
- Works list: all `published` works
- Filter 1: source type
- Filter 2: genre

## Rollout plan

1. Create Supabase project
2. Apply SQL schema from `supabase/schema.sql`
3. Create storage bucket for work images
4. Build admin login and CRUD UI
5. Migrate current `works.json` into DB
6. Replace public `works.json` fetch with Supabase public read

## Notes

- Current `works.json` can be used as migration source data
- Admin app can live in a separate repository if stricter separation is preferred
- GitHub Pages can continue hosting the public site while admin is hosted elsewhere
