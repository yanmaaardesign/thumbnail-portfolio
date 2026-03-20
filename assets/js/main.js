import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { publicConfig } from "./public-config.js";

/* ページ階層に応じた相対パスと、画面全体で使う状態を管理 */
const pathDepth = window.location.pathname.includes("/works/") || window.location.pathname.includes("/price/") || window.location.pathname.includes("/contact/") ? ".." : ".";

const state = {
  works: [],
  filters: {
    sourceType: "all",
    genre: "all"
  },
  carouselIndex: 0
};

const selectors = {
  worksGrid: document.querySelector("[data-works-grid]"),
  worksCount: document.querySelector("[data-works-count]"),
  filterGroup: document.querySelector("[data-filter-group]"),
  modal: document.querySelector("[data-modal]"),
  modalBody: document.querySelector("[data-modal-body]"),
  carouselTrack: document.querySelector("[data-carousel-track]"),
  carouselDots: document.querySelector("[data-carousel-dots]"),
  carouselPrev: document.querySelector("[data-carousel-prev]"),
  carouselNext: document.querySelector("[data-carousel-next]"),
  workTitle: document.querySelector("[data-work-title]"),
  workDetail: document.querySelector("[data-work-detail]"),
  workEmpty: document.querySelector("[data-work-empty]"),
  themeToggle: document.querySelector("[data-theme-toggle]")
};

const dataUrl = `${pathDepth}/${publicConfig.fallbackWorksUrl}`;
const supabase = createPublicClient();

/* 初期表示時にテーマ・共通イベント・作品データ読込をまとめて実行 */
document.addEventListener("DOMContentLoaded", async () => {
  initTheme();
  bindGlobalEvents();

  try {
    state.works = await loadWorks();
  } catch (error) {
    console.error("Failed to load works data.", error);
    return;
  }

  if (selectors.worksGrid) {
    renderFilters(state.works);
    renderWorks(state.works);
    renderCarousel(getFeaturedWorks(state.works));
  }

  if (selectors.workDetail) {
    renderDetailPage(state.works);
  }
});

/* 作品データは Supabase を優先し、取れない場合だけ JSON にフォールバック */
async function loadWorks() {
  const supabaseWorks = await loadWorksFromSupabase();

  if (supabaseWorks.length) {
    return supabaseWorks;
  }

  return loadWorksFromJson();
}

/* 公開画面用の Supabase クライアントを初期化 */
function createPublicClient() {
  if (!publicConfig.supabaseUrl || !publicConfig.supabaseAnonKey) {
    return null;
  }

  return createClient(publicConfig.supabaseUrl, publicConfig.supabaseAnonKey);
}

/* 公開中作品を Supabase から取得して、表示用の形へ整える */
async function loadWorksFromSupabase() {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from(publicConfig.worksTable)
    .select(`
      id,
      title,
      slug,
      description,
      production_time,
      persona,
      purpose,
      design_point,
      tools,
      source_type,
      featured,
      status,
      sort_order,
      thumbnail_image_url,
      large_image_url,
      work_genres (
        genres (
          slug,
          label
        )
      )
    `)
    .eq("status", "published")
    .order("sort_order", { ascending: true });

  if (error) {
    console.warn("Failed to load works from Supabase. Falling back to local JSON.", error);
    return [];
  }

  return (data || []).map(mapSupabaseWorkToPublicWork);
}

/* ローカル JSON を従来形式のまま読み込む */
async function loadWorksFromJson() {
  const response = await fetch(dataUrl);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const works = await response.json();
  return works.map((work) => ({
    ...work,
    sourceType: "",
    genres: [...new Set(work.tags || [])],
    thumbnail: resolveAssetPath(work.thumbnail),
    imageLarge: resolveAssetPath(work.imageLarge)
  }));
}

/* Supabase の作品データを公開画面で使う共通形式へ変換 */
function mapSupabaseWorkToPublicWork(work) {
  const genreLabels = (work.work_genres || [])
    .map((entry) => entry.genres?.label)
    .filter(Boolean);

  const tags = buildPublicTags(work, genreLabels);
  const tools = Array.isArray(work.tools) ? work.tools.filter(Boolean) : [];

  return {
    id: work.id,
    title: work.title,
    slug: work.slug,
    category: "thumbnail",
    featured: Boolean(work.featured),
    sourceType: work.source_type || "",
    genres: genreLabels,
    tags,
    thumbnail: work.thumbnail_image_url || "",
    imageLarge: work.large_image_url || work.thumbnail_image_url || "",
    description: work.description,
    detail: {
      productionTime: work.production_time || "",
      persona: work.persona || "",
      purpose: work.purpose || "",
      designPoint: work.design_point || "",
      tools: tools.length ? tools : ["Photoshop"]
    }
  };
}

/* 制作種別とジャンルから公開画面用タグを組み立てる */
function buildPublicTags(work, genreLabels) {
  const tags = [];

  if (work.source_type === "self_made") {
    tags.push("自主制作");
  } else if (work.source_type === "trace") {
    tags.push("トレース");
  }

  genreLabels.forEach((label) => tags.push(label));

  return [...new Set(tags)];
}

/* 画像パスがローカル相対パスでも動くよう補正 */
function resolveAssetPath(path) {
  if (path.startsWith("http")) {
    return path;
  }

  const normalized = path.replace(/^\.\.\//, "");
  return `${pathDepth}/${normalized}`;
}

/* カルーセル表示用にピックアップ作品だけ最大5件取り出す */
function getFeaturedWorks(works) {
  return works.filter((work) => work.featured).slice(0, 5);
}

/* 制作種別・ジャンルの絞り込み UI を描画 */
function renderFilters(works) {
  if (!selectors.filterGroup) {
    return;
  }

  const sourceTypeOptions = [
    { value: "all", label: "すべて" },
    { value: "self_made", label: "自主制作" },
    { value: "trace", label: "トレース" }
  ].filter((option) => option.value === "all" || works.some((work) => work.sourceType === option.value));

  const genreOptions = [
    { value: "all", label: "すべて" },
    ...[...new Set(works.flatMap((work) => work.genres || []))]
      .filter(Boolean)
      .map((genre) => ({ value: genre, label: genre }))
  ];

  selectors.filterGroup.innerHTML = [
    renderFilterSection("制作種別", "sourceType", sourceTypeOptions),
    renderFilterSection("ジャンル", "genre", genreOptions)
  ].join("");

  selectors.filterGroup.querySelectorAll("[data-filter-group-key][data-filter-value]").forEach((button) => {
    button.addEventListener("click", () => {
      const groupKey = button.dataset.filterGroupKey;
      const value = button.dataset.filterValue;

      if (!groupKey || !Object.prototype.hasOwnProperty.call(state.filters, groupKey)) {
        return;
      }

      state.filters[groupKey] = value;
      renderFilters(state.works);
      renderWorks(state.works);
    });
  });
}

/* フィルターグループ1つ分のHTMLを返す */
function renderFilterSection(label, groupKey, options) {
  return `
    <section class="p-works__filter-group" aria-label="${label}">
      <p class="p-works__filter-label">${label}</p>
      <div class="p-works__filter-buttons">
        ${options.map((option) => {
          const activeClass = state.filters[groupKey] === option.value ? " c-tag--active" : "";
          return `<button class="c-tag${activeClass}" type="button" data-filter-group-key="${groupKey}" data-filter-value="${option.value}">${option.label}</button>`;
        }).join("")}
      </div>
    </section>
  `;
}

/* 作品一覧カードを描画し、モーダル表示イベントを結びつける */
function renderWorks(works) {
  if (!selectors.worksGrid) {
    return;
  }

  const filtered = works.filter((work) => matchesFilters(work));

  selectors.worksGrid.innerHTML = filtered.map((work) => `
    <article class="c-card">
      <button class="c-card__thumb" type="button" data-work-modal="${work.id}" aria-label="${work.title}を拡大表示">
        <img src="${work.thumbnail}" alt="${work.title}" loading="lazy" width="640" height="360">
      </button>
      <div class="c-card__body">
        <h3 class="c-card__title">${work.title}</h3>
        <p class="c-card__description">${work.description}</p>
      </div>
      <div class="c-card__tags">
        ${work.tags.map((tag) => `<span class="c-tag">${tag}</span>`).join("")}
      </div>
      <a class="c-button c-button--ghost" href="${pathDepth}/works/detail.html?slug=${work.slug}">個別ページを見る</a>
    </article>
  `).join("");

  if (selectors.worksCount) {
    selectors.worksCount.textContent = String(filtered.length);
  }

  selectors.worksGrid.querySelectorAll("[data-work-modal]").forEach((button) => {
    button.addEventListener("click", () => {
      const work = state.works.find((item) => item.id === button.dataset.workModal);
      if (work) {
        openModal(work);
      }
    });
  });
}

/* 現在の絞り込み条件に作品が一致するかを判定 */
function matchesFilters(work) {
  const sourceTypeMatches = state.filters.sourceType === "all" || work.sourceType === state.filters.sourceType;
  const genreMatches = state.filters.genre === "all" || (work.genres || []).includes(state.filters.genre);

  return sourceTypeMatches && genreMatches;
}

/* ピックアップ作品のカルーセルを描画 */
function renderCarousel(works) {
  if (!selectors.carouselTrack || !works.length) {
    return;
  }

  selectors.carouselTrack.innerHTML = works.map((work) => `
    <article class="c-carousel__slide">
      <div class="c-carousel__image">
        <img src="${work.imageLarge}" alt="${work.title}" loading="lazy" width="960" height="540">
      </div>
      <div class="c-carousel__content">
        <p class="l-section__lead">Pickup</p>
        <h3 class="c-carousel__title">${work.title}</h3>
        <p class="c-carousel__description">${work.description}</p>
        <div class="c-carousel__tags">
          ${work.tags.map((tag) => `<span class="c-tag">${tag}</span>`).join("")}
        </div>
        <div class="p-modal-work__actions">
          <button class="c-button c-button--primary" type="button" data-work-modal="${work.id}">拡大して見る</button>
          <a class="c-button c-button--ghost" href="${pathDepth}/works/detail.html?slug=${work.slug}">詳細ページへ</a>
        </div>
      </div>
    </article>
  `).join("");

  selectors.carouselDots.innerHTML = works.map((_, index) => `
    <button class="c-carousel__dot${index === 0 ? " is-active" : ""}" type="button" data-carousel-dot="${index}" aria-label="${index + 1}枚目へ"></button>
  `).join("");

  updateCarousel();

  selectors.carouselPrev?.addEventListener("click", () => {
    state.carouselIndex = (state.carouselIndex - 1 + works.length) % works.length;
    updateCarousel();
  });

  selectors.carouselNext?.addEventListener("click", () => {
    state.carouselIndex = (state.carouselIndex + 1) % works.length;
    updateCarousel();
  });

  document.querySelectorAll("[data-carousel-dot]").forEach((dot) => {
    dot.addEventListener("click", () => {
      state.carouselIndex = Number(dot.dataset.carouselDot);
      updateCarousel();
    });
  });

  document.querySelectorAll(".c-carousel [data-work-modal]").forEach((button) => {
    button.addEventListener("click", () => {
      const work = state.works.find((item) => item.id === button.dataset.workModal);
      if (work) {
        openModal(work);
      }
    });
  });

  initCarouselSwipe(works);
}

/* 現在のインデックスに合わせてカルーセル位置とドット状態を更新 */
function updateCarousel() {
  if (!selectors.carouselTrack) {
    return;
  }

  selectors.carouselTrack.style.transform = `translateX(-${state.carouselIndex * 100}%)`;
  selectors.carouselDots?.querySelectorAll("[data-carousel-dot]").forEach((dot, index) => {
    dot.classList.toggle("is-active", index === state.carouselIndex);
  });
}

/* SP のスワイプ操作でカルーセルを送れるようにする */
function initCarouselSwipe(works) {
  const viewport = document.querySelector(".c-carousel__viewport");

  if (!viewport || !works.length) {
    return;
  }

  let startX = 0;
  let endX = 0;

  viewport.addEventListener("touchstart", (event) => {
    startX = event.touches[0].clientX;
  }, { passive: true });

  viewport.addEventListener("touchend", (event) => {
    endX = event.changedTouches[0].clientX;
    const diff = startX - endX;

    if (Math.abs(diff) < 40) {
      return;
    }

    if (diff > 0) {
      state.carouselIndex = (state.carouselIndex + 1) % works.length;
    } else {
      state.carouselIndex = (state.carouselIndex - 1 + works.length) % works.length;
    }

    updateCarousel();
  });
}

/* 作品一覧・カルーセルから開くモーダル詳細を描画 */
function openModal(work) {
  if (!selectors.modal || !selectors.modalBody) {
    return;
  }

  const detailItems = buildDetailItems(work);

  selectors.modalBody.innerHTML = `
    <article class="p-modal-work">
      <div class="p-modal-work__media">
        <img src="${work.imageLarge}" alt="${work.title}" width="960" height="540">
      </div>
      <div class="p-modal-work__header">
        <h2 id="modal-title">${work.title}</h2>
        <div class="p-modal-work__tags">
          ${work.tags.map((tag) => `<span class="c-tag">${tag}</span>`).join("")}
        </div>
        <p class="p-modal-work__description">${work.description}</p>
      </div>
      <button class="c-button c-button--primary" type="button" data-detail-toggle>詳細を確認</button>
      <div class="p-modal-work__detail" data-detail-panel>
        ${detailItems.length ? `<dl>${detailItems.map((item) => `
          <dt>${item.label}</dt>
          <dd>${item.value}</dd>
        `).join("")}</dl>` : `<p class="p-modal-work__empty">詳細情報は準備中です。</p>`}
      </div>
      <div class="p-modal-work__actions">
        <a class="c-button c-button--primary" href="${pathDepth}/contact/">お問い合わせページへ</a>
        <a class="c-button c-button--ghost" href="https://x.com/yanmardesign" target="_blank" rel="noreferrer">X</a>
        <a class="c-button c-button--ghost" href="mailto:yanmaaardesign@gmail.com">メール</a>
        <a class="c-button c-button--ghost" href="${pathDepth}/works/detail.html?slug=${work.slug}">個別ページへ</a>
      </div>
    </article>
  `;

  selectors.modal.hidden = false;
  document.body.style.overflow = "hidden";

  selectors.modalBody.querySelector("[data-detail-toggle]")?.addEventListener("click", (event) => {
    const panel = selectors.modalBody.querySelector("[data-detail-panel]");
    panel?.classList.toggle("is-open");
    event.currentTarget.textContent = panel?.classList.contains("is-open") ? "詳細を閉じる" : "詳細を確認";
  });
}

/* モーダルを閉じてスクロール制御を戻す */
function closeModal() {
  if (!selectors.modal) {
    return;
  }

  selectors.modal.hidden = true;
  document.body.style.overflow = "";
}

/* モーダル・右クリック抑止・ドラッグ抑止など共通イベントを登録 */
function bindGlobalEvents() {
  document.querySelectorAll("[data-modal-close]").forEach((element) => {
    element.addEventListener("click", closeModal);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeModal();
    }
  });

  document.addEventListener("contextmenu", (event) => {
    if (isProtectedImageTarget(event.target)) {
      event.preventDefault();
    }
  });

  document.addEventListener("dragstart", (event) => {
    if (isProtectedImageTarget(event.target)) {
      event.preventDefault();
    }
  });
}

/* 公開画像かどうかを判定して、右クリック保存などを軽く抑止 */
function isProtectedImageTarget(target) {
  if (!(target instanceof Element)) {
    return false;
  }

  return Boolean(target.closest(".c-card__thumb, .c-carousel__image, .p-modal-work__media, .p-work-detail__visual"));
}

/* 個別作品ページ用の本文・相談導線を描画 */
function renderDetailPage(works) {
  const slug = new URLSearchParams(window.location.search).get("slug");
  const work = works.find((item) => item.slug === slug);

  if (!work) {
    selectors.workEmpty?.removeAttribute("hidden");
    return;
  }

  if (selectors.workTitle) {
    selectors.workTitle.textContent = work.title;
  }

  if (selectors.workDetail) {
    const detailItems = buildDetailItems(work);

    selectors.workDetail.innerHTML = `
      <div class="l-section__inner">
        <div class="p-work-detail__layout">
          <div class="p-work-detail__main">
            <div class="p-work-detail__visual">
              <img src="${work.imageLarge}" alt="${work.title}" width="960" height="540">
            </div>
            <div class="p-work-detail__content">
              <div class="p-work-detail__summary">
                <h2>${work.title}</h2>
                <div class="p-work-detail__tags">
                  ${work.tags.map((tag) => `<span class="c-tag">${tag}</span>`).join("")}
                </div>
                <p class="p-work-detail__description">${work.description}</p>
              </div>
              ${detailItems.length ? `
                <dl class="p-work-detail__meta">
                  ${detailItems.map((item) => `
                    <div>
                      <dt>${item.label}</dt>
                      <dd>${item.value}</dd>
                    </div>
                  `).join("")}
                </dl>
              ` : ""}
            </div>
          </div>
          <aside class="p-work-detail__aside">
            <h2>この作品から相談する</h2>
            <p>このテイストに近いサムネイルをご依頼いただける場合は、Xまたはメールからご相談可能です。<br>参考作品として作品名やURLをご共有いただけるとスムーズです。</p>
            <div class="p-work-detail__actions">
              <a class="c-button c-button--primary" href="../contact/">お問い合わせページへ</a>
              <a class="c-button c-button--ghost" href="https://x.com/yanmardesign" target="_blank" rel="noreferrer">Xでご相談</a>
              <a class="c-button c-button--ghost" href="mailto:yanmaaardesign@gmail.com?subject=${encodeURIComponent(`【制作相談】${work.title}`)}">メールでご相談</a>
            </div>
          </aside>
        </div>
      </div>
    `;
  }
}

/* 未入力項目を除きつつ、詳細表示用の項目一覧を作る */
function buildDetailItems(work) {
  const items = [
    { label: "制作時間", value: work.detail.productionTime },
    { label: "ペルソナ", value: work.detail.persona },
    { label: "サムネイルの目的", value: work.detail.purpose },
    { label: "デザインで意識した点", value: work.detail.designPoint }
  ].filter((item) => item.value);

  if (Array.isArray(work.detail.tools) && work.detail.tools.length) {
    items.push({
      label: "使用ツール",
      value: work.detail.tools.join(" / ")
    });
  }

  return items;
}

/* ライト / ダークテーマの初期反映と切り替え処理 */
function initTheme() {
  const savedTheme = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);
  updateThemeButton(savedTheme);

  selectors.themeToggle?.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", nextTheme);
    localStorage.setItem("theme", nextTheme);
    updateThemeButton(nextTheme);
  });
}

/* テーマ切り替えボタンの文言を更新 */
function updateThemeButton(theme) {
  const label = selectors.themeToggle?.querySelector(".c-theme-toggle__label");
  if (label) {
    label.textContent = theme === "dark" ? "ライトモード" : "ダークモード";
  }
}

/* スクロール時のフェード表示を初期化 */
initScrollReveal();

/* 画面に入ったセクションだけ順に表示する */
function initScrollReveal() {
  const targets = document.querySelectorAll(".js-scroll-fade");

  if (!targets.length) {
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.16,
    rootMargin: "0px 0px -40px 0px"
  });

  targets.forEach((target) => observer.observe(target));
}
