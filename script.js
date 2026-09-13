(() => {
  'use strict';

  const qs = (selector, context = document) => context.querySelector(selector);
  const qsa = (selector, context = document) => [...context.querySelectorAll(selector)];
  const CART_KEY = 'altincocuk.cart.v1';
  const FAV_KEY = 'altincocuk.favorites.v1';

  const catalog = [
    { id: 'AC-D001', name: 'Kalp Motifli Özel İşçilik Altın Kolye', price: 498900, priceText: '498.900,00 TL', image: 'assets/p1-card.webp', href: 'product-1.html', meta: '14 Ayar · 122,03 gr' },
    { id: 'AC-D002', name: 'Çiçek Desenli Geleneksel Altın Gerdanlık', price: 465900, priceText: '465.900,00 TL', image: 'assets/p2-card.webp', href: 'product-2.html', meta: '14 Ayar · 113,89 gr' },
    { id: 'AC-D003', name: 'Zarif Motifli Altın Kolye', price: 132900, priceText: '132.900,00 TL', image: 'assets/p3-card.webp', href: 'product-3.html', meta: '14 Ayar · 32,39 gr' },
    { id: 'AC-D004', name: 'Minimal Motifli Altın Kolye', price: 117500, priceText: '117.500,00 TL', image: 'assets/p4-card.webp', href: 'product-4.html', meta: '14 Ayar · 28,58 gr' },
    { id: 'AC-D005', name: 'Geleneksel İşçilik Altın Gerdanlık', price: 608900, priceText: '608.900,00 TL', image: 'assets/p5-card.webp', href: 'product-5.html', meta: '14 Ayar · 148,41 gr' }
  ];

  const body = document.body;
  const overlay = qs('#overlay');
  const mobileMenu = qs('#mobilePanel');
  const menuButton = qs('#menuToggle');
  const searchPanel = qs('#searchPanel');
  const cartDrawer = qs('#cartDrawer');

  const money = value => new Intl.NumberFormat('tr-TR', {
    style: 'currency', currency: 'TRY', minimumFractionDigits: 2
  }).format(Number(value || 0)).replace('₺', '').trim() + ' TL';

  const readJSON = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  };

  const writeJSON = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch { /* localStorage may be unavailable in strict privacy mode. */ }
  };

  let cart = readJSON(CART_KEY, []);
  let favorites = readJSON(FAV_KEY, []);

  const cartCount = () => cart.reduce((sum, item) => sum + item.qty, 0);
  const cartTotal = () => cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  function toast(message) {
    let node = qs('#siteToast');
    if (!node) {
      node = document.createElement('div');
      node.id = 'siteToast';
      node.className = 'site-toast';
      node.setAttribute('role', 'status');
      node.setAttribute('aria-live', 'polite');
      body.append(node);
    }
    node.textContent = message;
    node.classList.add('is-visible');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => node.classList.remove('is-visible'), 2200);
  }

  function setOverlay(open) {
    overlay?.classList.toggle('is-open', open);
    body.classList.toggle('no-scroll', open);
  }

  function closeAll() {
    mobileMenu?.classList.remove('is-open');
    searchPanel?.classList.remove('is-open');
    cartDrawer?.classList.remove('is-open');
    qs('#imageLightbox')?.classList.remove('is-open');
    menuButton?.setAttribute('aria-expanded', 'false');
    setOverlay(false);
  }

  function openPanel(panel) {
    closeAll();
    panel?.classList.add('is-open');
    setOverlay(Boolean(panel));
  }

  menuButton?.addEventListener('click', () => {
    const shouldOpen = !mobileMenu?.classList.contains('is-open');
    if (!shouldOpen) return closeAll();
    openPanel(mobileMenu);
    menuButton.setAttribute('aria-expanded', 'true');
  });

  qsa('[data-open-search]').forEach(button => button.addEventListener('click', () => {
    openPanel(searchPanel);
    setTimeout(() => qs('#searchInput')?.focus(), 150);
  }));

  qsa('[data-open-cart]').forEach(button => button.addEventListener('click', () => {
    renderCartDrawer();
    openPanel(cartDrawer);
  }));

  qsa('[data-close]').forEach(button => button.addEventListener('click', closeAll));
  overlay?.addEventListener('click', closeAll);
  qsa('.mobile-panel a').forEach(link => link.addEventListener('click', closeAll));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeAll(); });

  const header = qs('#siteHeader');
  window.addEventListener('scroll', () => header?.classList.toggle('is-scrolled', window.scrollY > 18), { passive: true });

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }), { threshold: 0.12 });
    qsa('.reveal').forEach(element => observer.observe(element));
  } else {
    qsa('.reveal').forEach(element => element.classList.add('is-visible'));
  }

  function updateCartCount() {
    qsa('[data-cart-count]').forEach(node => { node.textContent = String(cartCount()); });
  }

  function persistCart() {
    writeJSON(CART_KEY, cart);
    updateCartCount();
    renderCartDrawer();
    renderCartPage();
    renderCheckout();
  }

  function productFromCard(card) {
    if (!card) return null;
    return {
      id: card.dataset.productId,
      name: card.dataset.name,
      price: Number(card.dataset.price || 0),
      priceText: card.dataset.priceText || money(card.dataset.price),
      image: card.dataset.image,
      href: card.dataset.href,
      meta: card.querySelector('.product-card__note')?.textContent.trim() || ''
    };
  }

  function productFromPage() {
    const page = qs('main[data-product-id]');
    if (!page) return null;
    return {
      id: page.dataset.productId,
      name: page.dataset.name,
      price: Number(page.dataset.price || 0),
      priceText: page.dataset.priceText || money(page.dataset.price),
      image: page.dataset.image,
      href: page.dataset.href,
      meta: qsa('.product-info__meta--rich b').slice(0, 2).map(node => node.textContent.trim()).join(' · '),
      personalization: qs('#personalText')?.value.trim() || ''
    };
  }

  function addToCart(product) {
    if (!product?.id) return;
    const existing = cart.find(item => item.id === product.id && (item.personalization || '') === (product.personalization || ''));
    if (existing) existing.qty += 1;
    else cart.push({ ...product, qty: 1 });
    persistCart();
    toast(`${product.name} sepete eklendi.`);
  }

  function changeQuantity(index, delta) {
    if (!cart[index]) return;
    cart[index].qty += delta;
    if (cart[index].qty <= 0) cart.splice(index, 1);
    persistCart();
  }

  function removeFromCart(index) {
    if (!cart[index]) return;
    const [removed] = cart.splice(index, 1);
    persistCart();
    toast(`${removed.name} sepetten kaldırıldı.`);
  }

  function renderCartDrawer() {
    const holder = qs('#cartDrawer .drawer__body');
    if (!holder) return;
    if (!cart.length) {
      holder.innerHTML = '<div class="drawer__empty"><div class="ring">○</div><h3>Sepetiniz henüz boş.</h3><p>Altın Çocuk koleksiyonlarını keşfedin.</p><a class="btn btn--dark" href="products.html">Ürünleri İncele</a></div>';
      return;
    }
    holder.innerHTML = `<div class="drawer-cart-list">${cart.map((item, index) => `
      <article class="drawer-cart-item">
        <a href="${item.href}"><img src="${item.image}" alt="${item.name}"></a>
        <div><a class="drawer-cart-item__name" href="${item.href}">${item.name}</a><small>${item.meta || ''}${item.personalization ? ` · ${item.personalization}` : ''}</small><div class="drawer-qty"><button type="button" data-cart-minus="${index}" aria-label="Adedi azalt">−</button><span>${item.qty}</span><button type="button" data-cart-plus="${index}" aria-label="Adedi artır">+</button></div></div>
        <strong>${money(item.price * item.qty)}</strong>
      </article>`).join('')}</div>
      <div class="drawer-total"><span>Toplam</span><strong>${money(cartTotal())}</strong></div>
      <div class="drawer-actions"><a class="btn btn--ghost" href="cart.html">Sepeti Gör</a><a class="btn btn--dark" href="checkout.html">Ödemeye Geç</a></div>`;
  }

  function renderCartPage() {
    const holder = qs('#cartItems');
    if (!holder) return;
    if (!cart.length) {
      holder.innerHTML = '<div class="cart-empty-state"><span class="eyebrow">SEPET BOŞ</span><h2>Henüz bir ürün eklemediniz.</h2><p>Seçkinizi inceleyin ve beğendiğiniz parçaları sepete ekleyin.</p><a class="btn btn--dark" href="products.html">Ürünleri İncele</a></div>';
    } else {
      holder.innerHTML = cart.map((item, index) => `
        <article class="cart-item">
          <a class="cart-item__image" href="${item.href}"><img src="${item.image}" alt="${item.name}"></a>
          <div><a class="cart-item__title" href="${item.href}"><h3>${item.name}</h3></a><div class="cart-item__meta">${item.meta || ''}${item.personalization ? ` · Kişiselleştirme: ${item.personalization}` : ''}</div><div class="qty"><button type="button" data-cart-minus="${index}" aria-label="Adedi azalt">−</button><span>${item.qty}</span><button type="button" data-cart-plus="${index}" aria-label="Adedi artır">+</button></div></div>
          <div class="cart-item__price">${money(item.price * item.qty)}<button class="cart-item__remove" type="button" data-cart-remove="${index}">Kaldır</button></div>
        </article>`).join('');
    }
    qsa('[data-cart-subtotal]').forEach(node => { node.textContent = money(cartTotal()); });
    qsa('[data-cart-total]').forEach(node => { node.textContent = money(cartTotal()); });
    const checkoutLink = qs('[data-checkout-link]');
    if (checkoutLink) {
      checkoutLink.classList.toggle('is-disabled', !cart.length);
      checkoutLink.setAttribute('aria-disabled', String(!cart.length));
    }
  }

  function renderCheckout() {
    const holder = qs('#checkoutItems');
    if (!holder) return;
    holder.innerHTML = cart.length ? cart.map(item => `
      <div class="checkout-summary-item"><img src="${item.image}" alt="${item.name}"><div><h3>${item.name}</h3><p>${item.meta || ''} · Adet ${item.qty}${item.personalization ? ` · ${item.personalization}` : ''}</p></div><strong>${money(item.price * item.qty)}</strong></div>`).join('') : '<div class="checkout-empty"><p>Sepetiniz boş.</p><a class="text-link" href="products.html">Ürünleri incele</a></div>';
    qsa('[data-checkout-subtotal]').forEach(node => { node.textContent = money(cartTotal()); });
    qsa('[data-checkout-total]').forEach(node => { node.textContent = money(cartTotal()); });
  }

  document.addEventListener('click', event => {
    const addCard = event.target.closest('[data-add-product]');
    if (addCard) {
      event.preventDefault();
      const card = addCard.closest('[data-product-id]');
      addToCart(productFromCard(card));
      const original = addCard.textContent;
      addCard.textContent = 'Eklendi ✓';
      setTimeout(() => { addCard.textContent = original; }, 1000);
      return;
    }

    const addCurrent = event.target.closest('[data-add-current]');
    if (addCurrent) {
      event.preventDefault();
      addToCart(productFromPage());
      return;
    }

    const plus = event.target.closest('[data-cart-plus]');
    if (plus) return changeQuantity(Number(plus.dataset.cartPlus), 1);
    const minus = event.target.closest('[data-cart-minus]');
    if (minus) return changeQuantity(Number(minus.dataset.cartMinus), -1);
    const remove = event.target.closest('[data-cart-remove]');
    if (remove) return removeFromCart(Number(remove.dataset.cartRemove));

    const favorite = event.target.closest('[data-favorite], .fav');
    if (favorite) {
      event.preventDefault();
      event.stopPropagation();
      const product = favorite.closest('[data-product-id]');
      const id = product?.dataset.productId || qs('main[data-product-id]')?.dataset.productId;
      if (!id) return;
      const active = favorites.includes(id);
      favorites = active ? favorites.filter(item => item !== id) : [...favorites, id];
      writeJSON(FAV_KEY, favorites);
      favorite.textContent = active ? '♡' : '♥';
      favorite.setAttribute('aria-pressed', String(!active));
      favorite.setAttribute('aria-label', active ? 'Favoriye ekle' : 'Favorilerden çıkar');
    }
  });

  function syncFavoriteButtons() {
    qsa('[data-product-id]').forEach(product => {
      const active = favorites.includes(product.dataset.productId);
      qsa('[data-favorite], .fav', product).forEach(button => {
        button.textContent = active ? '♥' : '♡';
        button.setAttribute('aria-pressed', String(active));
      });
    });
    const currentId = qs('main[data-product-id]')?.dataset.productId;
    if (currentId && favorites.includes(currentId)) {
      qsa('.product-cta .fav').forEach(button => { button.textContent = '♥'; button.setAttribute('aria-pressed', 'true'); });
    }
  }

  qsa('.size-options button').forEach(button => button.addEventListener('click', () => {
    qsa('.size-options button', button.parentElement).forEach(item => item.classList.remove('is-active'));
    button.classList.add('is-active');
  }));

  function applyProductFilter(value) {
    qsa('.catalog-grid .product-card, .catalog-grid--demo .product-card').forEach(card => {
      const haystack = `${card.dataset.filter || ''} ${card.dataset.category || ''}`.toLocaleLowerCase('tr-TR');
      card.hidden = value !== 'all' && !haystack.includes(value.toLocaleLowerCase('tr-TR').replace('özel', 'özel'));
    });
  }

  qsa('[data-filter]').forEach(button => button.addEventListener('click', () => {
    const group = button.closest('.category-toolbar__chips');
    qsa('[data-filter]', group).forEach(item => item.classList.remove('is-active'));
    button.classList.add('is-active');
    applyProductFilter(button.dataset.filter || 'all');
  }));

  qs('[data-product-sort]')?.addEventListener('change', event => {
    const grid = qs('.catalog-grid');
    if (!grid) return;
    const cards = qsa('.product-card', grid);
    const mode = event.target.value;
    if (mode === 'price-asc') cards.sort((a, b) => Number(a.dataset.price) - Number(b.dataset.price));
    if (mode === 'price-desc') cards.sort((a, b) => Number(b.dataset.price) - Number(a.dataset.price));
    cards.forEach(card => grid.append(card));
  });

  const searchInput = qs('#searchInput');
  const searchResults = qs('#searchResults');

  function renderSearch(query = '') {
    if (!searchResults) return;
    const normalized = query.trim().toLocaleLowerCase('tr-TR');
    const results = normalized
      ? catalog.filter(item => `${item.name} ${item.meta}`.toLocaleLowerCase('tr-TR').includes(normalized)).slice(0, 5)
      : catalog.slice(0, 3);
    const guideMatch = !normalized || ['rehber', 'ayar', 'ölçü', 'altın'].some(word => word.includes(normalized) || normalized.includes(word));
    searchResults.innerHTML = `${results.map(item => `<a class="search-result" href="${item.href}"><img src="${item.image}" alt=""><span><strong>${item.name}</strong><small>${item.meta} · ${item.priceText}</small></span></a>`).join('')}${guideMatch ? '<a class="search-result search-result--text" href="guide.html"><span><strong>Altın Rehberi</strong><small>Ayar, ölçü, bakım ve seçim rehberleri</small></span></a>' : ''}${!results.length && !guideMatch ? '<p class="search-no-result">Aramanızla eşleşen bir sonuç bulunamadı.</p>' : ''}`;
  }

  searchInput?.addEventListener('input', () => renderSearch(searchInput.value));
  searchInput?.closest('form')?.addEventListener('submit', event => {
    event.preventDefault();
    const first = searchResults?.querySelector('a');
    if (first) window.location.href = first.href;
  });

  qsa('[data-newsletter]').forEach(form => form.addEventListener('submit', event => {
    event.preventDefault();
    const input = form.querySelector('input[type="email"]');
    if (!input?.checkValidity()) return input?.reportValidity();
    form.classList.add('is-success');
    const button = form.querySelector('button');
    if (button) button.textContent = 'Kaydedildi ✓';
    toast('E-posta adresiniz kaydedildi.');
    input.value = '';
  }));

  // Product gallery and personalization.
  qsa('[data-gallery-src]').forEach(button => button.addEventListener('click', () => {
    const mainImage = qs('#mainProductImage');
    if (!mainImage) return;
    qsa('[data-gallery-src]').forEach(item => item.classList.remove('is-active'));
    button.classList.add('is-active');
    mainImage.src = button.dataset.gallerySrc;
    qs('#imageLightbox img')?.setAttribute('src', button.dataset.gallerySrc);
  }));

  const openLightbox = () => {
    const lightbox = qs('#imageLightbox');
    if (!lightbox) return;
    lightbox.classList.add('is-open');
    setOverlay(true);
  };
  qs('#zoomProduct')?.addEventListener('click', openLightbox);
  qs('.product-main-media img')?.addEventListener('dblclick', openLightbox);
  qs('[data-close-lightbox]')?.addEventListener('click', closeAll);
  qs('#imageLightbox')?.addEventListener('click', event => { if (event.target.id === 'imageLightbox') closeAll(); });

  const personalInput = qs('#personalText');
  const engravingPreview = qs('#engravingPreview');
  const charCount = qs('[data-char-count]');
  personalInput?.addEventListener('input', () => {
    if (engravingPreview) engravingPreview.textContent = personalInput.value.trim() || 'Altın Çocuk';
    if (charCount) charCount.textContent = String(personalInput.value.length);
  });
  qsa('.font-choice').forEach(button => button.addEventListener('click', () => {
    qsa('.font-choice').forEach(item => item.classList.remove('is-active'));
    button.classList.add('is-active');
    if (engravingPreview) engravingPreview.dataset.font = button.dataset.font || 'serif';
  }));

  qsa('[data-copy-link]').forEach(button => button.addEventListener('click', async () => {
    try {
      if (navigator.share) await navigator.share({ title: document.title, url: location.href });
      else await navigator.clipboard.writeText(location.href);
      toast('Ürün bağlantısı paylaşmaya hazır.');
    } catch (error) {
      if (error?.name !== 'AbortError') toast('Bağlantı kopyalanamadı.');
    }
  }));

  qs('#checkoutForm')?.addEventListener('submit', event => {
    event.preventDefault();
    const form = event.currentTarget;
    const status = qs('#checkoutStatus');
    if (!form.checkValidity()) return form.reportValidity();
    if (!cart.length) {
      if (status) status.textContent = 'Ödeme için önce sepetinize ürün ekleyin.';
      return;
    }
    if (status) {
      status.textContent = 'Teslimat bilgileriniz doğrulandı. Önizleme ortamında gerçek tahsilat yapılmaz; canlı mağazada güvenli iyzico ödeme ekranı bu adımda açılır.';
      status.classList.add('is-success');
    }
    toast('Ödeme adımı doğrulandı.');
  });

  // Prevent disabled checkout link from navigating when the cart is empty.
  document.addEventListener('click', event => {
    const disabled = event.target.closest('a.is-disabled[aria-disabled="true"]');
    if (disabled) {
      event.preventDefault();
      toast('Sepetiniz henüz boş.');
    }
  });

  // Initialize page state.
  updateCartCount();
  renderCartDrawer();
  renderCartPage();
  renderCheckout();
  syncFavoriteButtons();
  renderSearch();
})();
