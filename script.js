(function () {
  const list = document.getElementById('cardsList');
  const items = Array.from(list.querySelectorAll('.card'));
  const searchInput = document.getElementById('search');
  const perPageSelect = document.getElementById('perPage');
  const pager = document.getElementById('pager');
  const rangeInfo = document.getElementById('rangeInfo');

  let state = {
    q: '',
    perPage: parseInt(perPageSelect.value, 10),
    page: 1
  };

  function normalize(str) {
    return str.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '');
  }

  function getTitle(el) {
    const h2 = el.querySelector('h2');
    return h2 ? h2.textContent.trim() : '';
  }

  function getFiltered() {
    if (!state.q) return items;
    const qn = normalize(state.q);
    return items.filter(el => normalize(getTitle(el)).includes(qn));
  }

  function render() {
    const filtered = getFiltered();
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / state.perPage));
    if (state.page > totalPages) state.page = totalPages;
    if (state.page < 1) state.page = 1;

    items.forEach(el => (el.style.display = 'none'));

    const startIdx = (state.page - 1) * state.perPage;
    const endIdx = Math.min(startIdx + state.perPage, total);
    filtered.slice(startIdx, endIdx).forEach(el => (el.style.display = ''));

    if (total === 0) {
      rangeInfo.textContent = 'Tidak ada entri yang cocok.';
    } else {
      rangeInfo.textContent = `Menampilkan ${startIdx + 1}–${endIdx} dari ${total} entri`;
    }

    renderPager(totalPages);
    updateURL();
  }

  function renderPager(totalPages) {
    pager.innerHTML = '';

    const prev = document.createElement('button');
    prev.className = 'page-btn';
    prev.textContent = '‹';
    prev.disabled = state.page === 1;
    prev.addEventListener('click', () => {
      if (state.page > 1) {
        state.page--;
        render();
      }
    });
    pager.appendChild(prev);

    const pages = buildPageList(state.page, totalPages);
    pages.forEach(p => {
      if (p === '...') {
        const span = document.createElement('span');
        span.className = 'page-btn';
        span.textContent = '…';
        span.setAttribute('aria-hidden', 'true');
        span.style.cursor = 'default';
        pager.appendChild(span);
      } else {
        const b = document.createElement('button');
        b.className = 'page-btn';
        b.textContent = String(p);
        if (p === state.page) b.setAttribute('aria-current', 'page');
        b.addEventListener('click', () => {
          state.page = p;
          render();
        });
        pager.appendChild(b);
      }
    });

    const next = document.createElement('button');
    next.className = 'page-btn';
    next.textContent = '›';
    next.disabled = state.page === totalPages;
    next.addEventListener('click', () => {
      if (state.page < totalPages) {
        state.page++;
        render();
      }
    });
    pager.appendChild(next);
  }

  function buildPageList(current, total) {
    const maxButtons = 7;
    const pages = [];
    if (total <= maxButtons) {
      for (let i = 1; i <= total; i++) pages.push(i);
      return pages;
    }
    const showLeft = Math.max(1, current - 2);
    const showRight = Math.min(total, current + 2);

    pages.push(1);
    if (showLeft > 2) pages.push('...');
    for (let i = showLeft; i <= showRight; i++) {
      if (i !== 1 && i !== total) pages.push(i);
    }
    if (showRight < total - 1) pages.push('...');
    if (total > 1) pages.push(total);

    return pages;
  }

  function debounce(fn, ms = 200) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(null, args), ms);
    };
  }

  function updateURL() {
    const url = new URL(window.location);
    url.searchParams.set('q', state.q);
    url.searchParams.set('per', String(state.perPage));
    url.searchParams.set('page', String(state.page));
    history.replaceState(null, '', url);
  }

  function readURL() {
    const url = new URL(window.location);
    const q = url.searchParams.get('q') || '';
    const per = parseInt(url.searchParams.get('per') || String(state.perPage), 10);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    state.q = q;
    state.perPage = [6, 9, 12, 24].includes(per) ? per : state.perPage;
    state.page = Number.isFinite(page) && page > 0 ? page : 1;
    searchInput.value = state.q;
    perPageSelect.value = String(state.perPage);
  }

  searchInput.addEventListener('input', debounce(() => {
    state.q = searchInput.value.trim();
    state.page = 1;
    render();
  }));

  perPageSelect.addEventListener('change', () => {
    state.perPage = parseInt(perPageSelect.value, 10);
    state.page = 1;
    render();
  });

  readURL();
  render();
})();

const searchBtn = document.getElementById('searchBtn');

searchBtn.addEventListener('click', () => {
  state.q = searchInput.value.trim();
  state.page = 1;
  render();
});

searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    state.q = searchInput.value.trim();
    state.page = 1;
    render();
  }
});