const revealEls = document.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach((el) => revealObserver.observe(el));

    const privacyNotice = document.getElementById('privacyNotice');
    const privacyModal = document.getElementById('privacyModal');
    const privacyAccept = document.getElementById('privacyAccept');
    const privacyMore = document.getElementById('privacyMore');
    const privacyClose = document.getElementById('privacyClose');
    const privacyFooterBtn = document.getElementById('privacyFooterBtn');
    const currentYear = document.getElementById('currentYear');

    if (currentYear) currentYear.textContent = new Date().getFullYear();

    function openPrivacyModal() {
      if (privacyModal.showModal) privacyModal.showModal();
      else privacyModal.setAttribute('open', 'open');
    }

    function closePrivacyModal() {
      privacyModal.close?.();
      privacyModal.removeAttribute?.('open');
    }

    let privacyAcknowledged = false;
    try { privacyAcknowledged = localStorage.getItem('polovinkiPrivacyAcknowledged') === '1'; } catch (e) {}
    if (!privacyAcknowledged) privacyNotice.classList.remove('hidden');

    privacyAccept.addEventListener('click', () => {
      try { localStorage.setItem('polovinkiPrivacyAcknowledged', '1'); } catch (e) {}
      privacyNotice.classList.add('hidden');
    });
    privacyMore.addEventListener('click', openPrivacyModal);
    privacyFooterBtn.addEventListener('click', openPrivacyModal);
    privacyClose.addEventListener('click', closePrivacyModal);
    privacyModal.addEventListener('click', (e) => { if (e.target === privacyModal) closePrivacyModal(); });

    const PRICE_PER_BOX = 250;
    const qtyEl = document.getElementById('qty');
    const totalTextEl = document.getElementById('total-text');
    const qtyTextEl = document.getElementById('qty-text');
    const methodEl = document.getElementById('method');
    const addressRow = document.getElementById('address-row');
    const form = document.getElementById('order-form');
    const statusEl = document.getElementById('form-status');
    const submitBtn = document.getElementById('submit-btn');

    const TG_ENDPOINT = 'https://script.google.com/macros/s/AKfycbyHLwMieXZw_2eAf-A7w_75gO4nTuzbAOGIuZgJdDHdUsIdUlhLtSc9tCZ2zUI15ppZpw/exec';
    const TG_SECRET = 'PolovinkiKmV25';

    function formatRUB(v) {
      try {
        return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(v);
      } catch (e) {
        return Math.round(v) + ' ₽';
      }
    }

    function updateSummary() {
      const qty = parseInt(qtyEl.value, 10) || 1;
      const total = qty * PRICE_PER_BOX;
      totalTextEl.textContent = formatRUB(total);
      qtyTextEl.textContent = String(qty);
    }

    qtyEl.addEventListener('change', updateSummary);
    updateSummary();

    methodEl.addEventListener('change', () => {
      addressRow.classList.toggle('hidden', methodEl.value !== 'delivery');
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('name').value.trim();
      const phone = document.getElementById('phone').value.trim();
      const social = document.getElementById('social').value.trim();
      const qty = parseInt(qtyEl.value, 10) || 1;
      const date = document.getElementById('date').value;
      const time = document.getElementById('time').value;
      const method = methodEl.value;
      const address = (document.getElementById('address').value || '').trim();
      const comment = (document.getElementById('comment').value || '').trim();

      if (!name || !phone || !date) {
        alert('Пожалуйста, заполните имя, телефон и дату получения.');
        return;
      }
      if (method === 'delivery' && !address) {
        alert('Укажите адрес доставки.');
        return;
      }

      const total = qty * PRICE_PER_BOX;
      const payload = {
        product: 'Коробочка орешков (6 шт)',
        unit_price: PRICE_PER_BOX + ' ₽',
        quantity: qty,
        total: total + ' ₽',
        date,
        time,
        method: method === 'pickup' ? 'Самовывоз' : 'Доставка',
        address: method === 'delivery' ? address : '',
        name,
        phone,
        social,
        comment
      };

      submitBtn.disabled = true;
      submitBtn.textContent = 'Отправляем...';
      statusEl.classList.remove('hidden');
      statusEl.textContent = 'Отправляем заказ...';

      try {
        const resp = await fetch('https://formspree.io/f/xgvleerr', {
          method: 'POST',
          headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const tgPayload = { ...payload, secret: TG_SECRET, origin: location.origin };
        fetch(TG_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(tgPayload)
        }).catch((err) => console.error('TG relay failed:', err));

        if (resp.ok) {
          form.reset();
          updateSummary();
          addressRow.classList.add('hidden');
          statusEl.textContent = 'Спасибо за заказ! Мы с вами свяжемся…';
        } else {
          statusEl.textContent = 'Не удалось отправить заказ. Попробуйте ещё раз или свяжитесь с нами.';
        }
      } catch (err) {
        console.error(err);
        statusEl.textContent = 'Сеть недоступна. Проверьте соединение и попробуйте снова.';
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span class="material-symbols-outlined">send</span>Отправить заказ';
      }
    });

    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwAaB9udbz_EHUWPqvSca8Ve3p_D_8thmGDv1MZOLQzJ09vStTb6A89Gizp9zEePdMj/exec';

    const reviewForm = document.getElementById('reviewForm');
    const reviewStatus = document.getElementById('reviewStatus');
    const trackEl = document.getElementById('reviewsTrack');
    const openAllBtn = document.getElementById('openAllBtn');
    const hideAllBtn = document.getElementById('hideAllBtn');

    const reviewModal = document.getElementById('reviewModal');
    const modalName = document.getElementById('modalName');
    const modalStars = document.getElementById('modalStars');
    const modalDate = document.getElementById('modalDate');
    const modalText = document.getElementById('modalText');
    const modalClose = document.getElementById('modalClose');

    const allModal = document.getElementById('allReviewsModal');
    const allClose = document.getElementById('allClose');
    const allContainer = document.getElementById('allReviewsContainer');

    let STRIP_COUNT = window.matchMedia('(min-width:1024px)').matches ? 6 : 5;
    const mq = window.matchMedia('(min-width:1024px)');
    mq.addEventListener?.('change', (e) => { STRIP_COUNT = e.matches ? 6 : 5; });

    function stars(n) {
      n = Math.max(0, Math.min(5, Number(n || 0)));
      return '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n);
    }

    function escapeHtml(s) {
      return String(s || '').replace(/[&<>"']/g, (ch) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[ch]));
    }

    function shortText(s, n = 160) {
      s = String(s || '').trim();
      return s.length > n ? s.slice(0, n - 1) + '…' : s;
    }

    function normalizeName(s = '') {
      return String(s)
        .toLowerCase()
        .replaceAll('ё', 'е')
        .replace(/[^\p{L}\p{N}]+/gu, ' ')
        .trim()
        .replace(/\s+/g, ' ');
    }

    const bannedNames = ['гость', 'аноним', 'анонимна', 'анонимный', 'анонимная', 'anonymous', 'anon'];
    const bannedPatterns = [
      /^гост[ьй]$/u,
      /^аноним(на|ный|ная)?$/u,
      /^anon(ymous)?$/u
    ];

    function openMini(item) {
      modalName.textContent = item.name || 'Гость';
      modalStars.textContent = stars(item.rating || 5);
      modalDate.textContent = new Date(item.createdAt).toLocaleDateString('ru-RU');
      modalText.textContent = item.text || '';
      if (reviewModal.showModal) reviewModal.showModal();
      else reviewModal.setAttribute('open', 'open');
    }

    modalClose.addEventListener('click', () => reviewModal.close?.() || reviewModal.removeAttribute('open'));
    reviewModal.addEventListener('click', (e) => { if (e.target === reviewModal) reviewModal.close?.(); });

    function openAll() {
      hideAllBtn.classList.remove('hidden');
      if (allModal.showModal) allModal.showModal();
      else allModal.setAttribute('open', 'open');
    }

    function closeAll() {
      hideAllBtn.classList.add('hidden');
      allModal.close?.();
      allModal.removeAttribute?.('open');
    }

    openAllBtn.addEventListener('click', openAll);
    hideAllBtn.addEventListener('click', closeAll);
    allClose.addEventListener('click', closeAll);
    allModal.addEventListener('click', (e) => { if (e.target === allModal) closeAll(); });

    async function fetchReviews() {
      trackEl.innerHTML = '<div class="review-card-mini rounded-[1.25rem] bg-white p-5 shadow-soft"><div class="text-base text-on-surface-variant">Загружаю отзывы…</div></div>';
      try {
        const res = await fetch(`${SCRIPT_URL}?limit=200&t=${Date.now()}`, { method: 'GET' });
        const raw = await res.text();
        let data;
        try { data = JSON.parse(raw); } catch (e) { throw new Error('bad json'); }
        const items = (data.items || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const titleSpan = document.getElementById('reviewsTitleText');
        if (titleSpan) titleSpan.textContent = items.length ? `Последние отзывы (${items.length})` : 'Последние отзывы';

        const heroReviewsCount = document.getElementById('heroReviewsCount');
        const heroReviewsLabel = document.getElementById('heroReviewsLabel');
        const openAllBtnLabel = document.getElementById('openAllBtnLabel');
        if (heroReviewsCount) heroReviewsCount.textContent = String(items.length || 0);
        if (heroReviewsLabel) heroReviewsLabel.textContent = items.length ? 'Читать отзывы' : 'Отзывы';
        if (openAllBtnLabel) openAllBtnLabel.textContent = items.length ? `Все отзывы (${items.length})` : 'Все отзывы';

        if (!items.length) {
          trackEl.innerHTML = '<div class="review-card-mini rounded-[1.25rem] bg-white p-5 shadow-soft"><div class="text-base text-on-surface-variant">Пока нет отзывов — оставьте первый!</div></div>';
        } else {
          const stripItems = items.slice(0, STRIP_COUNT);
          trackEl.innerHTML = stripItems.map((o, i) => `
            <button class="review-card-mini rounded-[1.25rem] bg-white p-5 shadow-soft text-left hover:-translate-y-1 transition-transform" type="button" data-idx="${i}" aria-label="Читать отзыв пользователя ${escapeHtml(o.name || 'Гость')}">
              <div class="flex items-center justify-between gap-4 text-sm text-on-surface-variant">
                <span class="font-work-sans font-semibold text-primary">${escapeHtml(o.name || 'Гость')}</span>
                <span class="text-amber-500">${stars(Number(o.rating || 5))}</span>
              </div>
              <div class="mt-3 text-base leading-relaxed text-on-surface-variant">${escapeHtml(shortText(o.text, 160))}</div>
            </button>
          `).join('');

          trackEl.querySelectorAll('.review-card-mini').forEach((btn) => {
            btn.addEventListener('click', () => {
              const idx = Number(btn.getAttribute('data-idx'));
              openMini(stripItems[idx]);
            });
          });
        }

        if (!items.length) {
          allContainer.innerHTML = '<p class="font-work-sans text-sm text-on-surface-variant">Пока нет отзывов — будьте первым!</p>';
        } else {
          allContainer.innerHTML = items.map((o) => `
            <article class="rounded-[1rem] border border-outline-variant/20 bg-surface-container-low p-5 mt-4">
              <div class="flex items-center justify-between gap-4">
                <strong class="font-work-sans text-primary">${escapeHtml(o.name || 'Гость')}</strong>
                <small class="font-work-sans text-on-surface-variant">${new Date(o.createdAt).toLocaleDateString('ru-RU')}</small>
              </div>
              <div class="mt-2 text-amber-500">${stars(Number(o.rating || 5))}</div>
              <p class="mt-3 whitespace-pre-wrap text-lg leading-relaxed text-on-surface-variant">${escapeHtml(o.text)}</p>
            </article>
          `).join('');
        }
      } catch (e) {
        console.error(e);
        const heroReviewsCount = document.getElementById('heroReviewsCount');
        const openAllBtnLabel = document.getElementById('openAllBtnLabel');
        if (heroReviewsCount) heroReviewsCount.textContent = '—';
        if (openAllBtnLabel) openAllBtnLabel.textContent = 'Все отзывы';
        trackEl.innerHTML = '<div class="review-card-mini rounded-[1.25rem] bg-white p-5 shadow-soft"><div class="text-base text-on-surface-variant">Не удалось загрузить отзывы.</div></div>';
        allContainer.innerHTML = '<p class="font-work-sans text-sm text-red-600">Не удалось загрузить отзывы.</p>';
      }
    }

    reviewForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(reviewForm);
      const nameRaw = (fd.get('name') || '');
      const text = (fd.get('text') || '').toString().trim();
      const norm = normalizeName(nameRaw);

      if (!norm) {
        reviewStatus.textContent = 'Введите ваше имя.';
        return;
      }
      const isExactBanned = bannedNames.includes(norm);
      const isPatternBanned = bannedPatterns.some((rx) => rx.test(norm));
      if (isExactBanned || isPatternBanned) {
        reviewStatus.textContent = 'Пожалуйста, представьтесь по-настоящему (не «Гость» и не «Аноним»).';
        return;
      }
      if (!text) {
        reviewStatus.textContent = 'Введите текст отзыва.';
        return;
      }

      const payload = {
        name: String(nameRaw).trim(),
        text,
        rating: Number(fd.get('rating') || 5),
        honeypot: fd.get('company') || ''
      };

      reviewStatus.textContent = 'Отправляем…';
      try {
        const res = await fetch(`${SCRIPT_URL}?t=${Date.now()}`, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload)
        });
        const raw = await res.text();
        let data;
        try { data = JSON.parse(raw); } catch (e) { throw new Error('bad json'); }

        if (data.ok) {
          reviewStatus.textContent = data.approved ? 'Спасибо! Отзыв опубликован.' : 'Спасибо! Отзыв появится после модерации.';
          reviewForm.reset();
          if (data.approved) fetchReviews();
        } else {
          reviewStatus.textContent = 'Ошибка: не удалось сохранить отзыв.';
        }
      } catch (err) {
        console.error(err);
        reviewStatus.textContent = 'Сеть недоступна или сервер недоступен.';
      }
    });

    fetchReviews();
