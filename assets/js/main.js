const pathDepth = window.location.pathname.includes("/works/") || window.location.pathname.includes("/price/") || window.location.pathname.includes("/contact/") ? ".." : ".";

const state = {
  works: [],
  activeTag: "all",
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

const dataUrl = `${pathDepth}/assets/data/works.json`;

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

async function loadWorks() {
  const response = await fetch(dataUrl);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const works = await response.json();
  return works.map((work) => ({
    ...work,
    thumbnail: resolveAssetPath(work.thumbnail),
    imageLarge: resolveAssetPath(work.imageLarge)
  }));
}

function resolveAssetPath(path) {
  if (path.startsWith("http")) {
    return path;
  }

  const normalized = path.replace(/^\.\.\//, "");
  return `${pathDepth}/${normalized}`;
}

function getFeaturedWorks(works) {
  return works.filter((work) => work.featured).slice(0, 5);
}

function renderFilters(works) {
  if (!selectors.filterGroup) {
    return;
  }

  const tags = ["all", ...new Set(works.flatMap((work) => work.tags))];
  selectors.filterGroup.innerHTML = tags.map((tag) => {
    const label = tag === "all" ? "すべて" : tag;
    const activeClass = tag === state.activeTag ? " c-tag--active" : "";
    return `<button class="c-tag${activeClass}" type="button" data-filter="${tag}">${label}</button>`;
  }).join("");

  selectors.filterGroup.querySelectorAll("[data-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeTag = button.dataset.filter;
      renderFilters(state.works);
      renderWorks(state.works);
    });
  });
}

function renderWorks(works) {
  if (!selectors.worksGrid) {
    return;
  }

  const filtered = state.activeTag === "all"
    ? works
    : works.filter((work) => work.tags.includes(state.activeTag));

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
        <p class="l-section__lead">Featured</p>
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
}

function updateCarousel() {
  if (!selectors.carouselTrack) {
    return;
  }

  selectors.carouselTrack.style.transform = `translateX(-${state.carouselIndex * 100}%)`;
  selectors.carouselDots?.querySelectorAll("[data-carousel-dot]").forEach((dot, index) => {
    dot.classList.toggle("is-active", index === state.carouselIndex);
  });
}

function openModal(work) {
  if (!selectors.modal || !selectors.modalBody) {
    return;
  }

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
        <dl>
          <dt>制作時間</dt>
          <dd>${work.detail.productionTime}</dd>
          <dt>ペルソナ</dt>
          <dd>${work.detail.persona}</dd>
          <dt>サムネイルの目的</dt>
          <dd>${work.detail.purpose}</dd>
          <dt>デザインで意識した点</dt>
          <dd>${work.detail.designPoint}</dd>
          <dt>使用ツール</dt>
          <dd>${work.detail.tools.join(" / ")}</dd>
        </dl>
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

function closeModal() {
  if (!selectors.modal) {
    return;
  }

  selectors.modal.hidden = true;
  document.body.style.overflow = "";
}

function bindGlobalEvents() {
  document.querySelectorAll("[data-modal-close]").forEach((element) => {
    element.addEventListener("click", closeModal);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeModal();
    }
  });
}

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
              <dl class="p-work-detail__meta">
                <div>
                  <dt>制作時間</dt>
                  <dd>${work.detail.productionTime}</dd>
                </div>
                <div>
                  <dt>ペルソナ</dt>
                  <dd>${work.detail.persona}</dd>
                </div>
                <div>
                  <dt>サムネイルの目的</dt>
                  <dd>${work.detail.purpose}</dd>
                </div>
                <div>
                  <dt>デザインで意識した点</dt>
                  <dd>${work.detail.designPoint}</dd>
                </div>
                <div>
                  <dt>使用ツール</dt>
                  <dd>${work.detail.tools.join(" / ")}</dd>
                </div>
              </dl>
            </div>
          </div>
          <aside class="p-work-detail__aside">
            <h2>この作品から相談する</h2>
            <p>このテイストに近いサムネイルを依頼したい場合は、Xまたはメールから相談できます。参考作品として作品名やURLを共有するとスムーズです。</p>
            <div class="p-work-detail__actions">
              <a class="c-button c-button--primary" href="../contact/">お問い合わせページへ</a>
              <a class="c-button c-button--ghost" href="https://x.com/yanmardesign" target="_blank" rel="noreferrer">Xで相談</a>
              <a class="c-button c-button--ghost" href="mailto:yanmaaardesign@gmail.com?subject=${encodeURIComponent(`【制作相談】${work.title}`)}">メールで相談</a>
            </div>
          </aside>
        </div>
      </div>
    `;
  }
}

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

function updateThemeButton(theme) {
  const label = selectors.themeToggle?.querySelector(".c-theme-toggle__label");
  if (label) {
    label.textContent = theme === "dark" ? "Light" : "Dark";
  }
}
