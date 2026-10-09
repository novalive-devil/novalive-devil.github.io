(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const toast = $('#toast');
  let toastTimer;

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
  }

  async function copyText(value, successMessage = 'Copied to clipboard!') {
    const text = String(value || '').trim();
    if (!text || text === 'Your transformed text appears here.' || text === 'Your hashtags will appear here.') {
      showToast('Pehle kuch text generate ya enter karo.');
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      showToast(successMessage);
    } catch (_) {
      const helper = document.createElement('textarea');
      helper.value = text;
      helper.style.position = 'fixed';
      helper.style.opacity = '0';
      document.body.appendChild(helper);
      helper.select();
      const copied = document.execCommand('copy');
      helper.remove();
      showToast(copied ? successMessage : 'Copy nahi hua — text select karke copy karo.');
    }
  }

  // Mobile navigation
  const menuToggle = $('#menuToggle');
  const mainNav = $('#mainNav');
  if (menuToggle && mainNav) {
    menuToggle.addEventListener('click', () => {
      const open = mainNav.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', String(open));
      menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    });
    $$('.nav-link', mainNav).forEach(link => link.addEventListener('click', () => {
      mainNav.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
    }));
  }

  // Resource search + category filter
  const resourceSearch = $('#resourceSearch');
  const cards = $$('.resource-card');
  const filterButtons = $$('.filter-btn');
  const emptyState = $('#emptyState');
  let activeFilter = 'all';

  function filterResources() {
    const query = (resourceSearch?.value || '').trim().toLowerCase();
    let visible = 0;
    cards.forEach(card => {
      const categoryMatch = activeFilter === 'all' || card.dataset.category === activeFilter;
      const searchMatch = !query || `${card.dataset.search || ''} ${card.textContent}`.toLowerCase().includes(query);
      const show = categoryMatch && searchMatch;
      card.hidden = !show;
      if (show) visible++;
    });
    if (emptyState) emptyState.hidden = visible !== 0;
  }
  filterButtons.forEach(button => button.addEventListener('click', () => {
    activeFilter = button.dataset.filter || 'all';
    filterButtons.forEach(item => item.classList.toggle('selected', item === button));
    filterResources();
  }));
  // Quick links from the NOVALIVE system directory select a category and jump to files.
  $$('[data-filter-link]').forEach(link => link.addEventListener('click', () => {
    activeFilter = link.dataset.filterLink || 'all';
    filterButtons.forEach(item => item.classList.toggle('selected', (item.dataset.filter || 'all') === activeFilter));
    filterResources();
  }));
  resourceSearch?.addEventListener('input', filterResources);
  document.addEventListener('keydown', event => {
    if (event.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
      event.preventDefault();
      resourceSearch?.focus();
    }
    if (event.key === 'Escape') {
      mainNav?.classList.remove('open');
      menuToggle?.setAttribute('aria-expanded', 'false');
    }
  });

  // Text transformer
  const textInput = $('#textInput');
  const textResult = $('#textResult');
  $$('[data-case]').forEach(button => button.addEventListener('click', () => {
    const source = textInput?.value || '';
    if (!source.trim()) {
      showToast('Pehle text box mein text likho.');
      textInput?.focus();
      return;
    }
    let result = source;
    if (button.dataset.case === 'upper') result = source.toUpperCase();
    if (button.dataset.case === 'lower') result = source.toLowerCase();
    if (button.dataset.case === 'title') result = source.toLowerCase().replace(/(^|[\s\-–—])([\p{L}\p{N}])/gu, match => match.toUpperCase());
    if (textResult) textResult.textContent = result;
  }));
  $('#copyText')?.addEventListener('click', () => copyText(textResult?.textContent, 'Text copied!'));

  // Colour palette generator + click-to-copy swatches
  const paletteSwatches = $('#paletteSwatches');
  const paletteHint = $('#paletteHint');
  function randomHex() {
    return '#' + Math.floor(Math.random() * 0x1000000).toString(16).padStart(6, '0').toUpperCase();
  }
  function generatePalette() {
    if (!paletteSwatches) return;
    paletteSwatches.innerHTML = '';
    for (let i = 0; i < 5; i++) {
      const color = randomHex();
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'swatch';
      button.dataset.color = color;
      button.style.setProperty('--swatch', color);
      button.setAttribute('aria-label', `Copy colour ${color}`);
      const label = document.createElement('span');
      label.textContent = color;
      button.appendChild(label);
      paletteSwatches.appendChild(button);
    }
    if (paletteHint) paletteHint.textContent = 'Click a colour to copy its HEX code.';
  }
  $('#generatePalette')?.addEventListener('click', generatePalette);
  paletteSwatches?.addEventListener('click', event => {
    const swatch = event.target.closest('.swatch');
    if (!swatch) return;
    copyText(swatch.dataset.color, `${swatch.dataset.color} copied!`);
  });

  // Hashtag helper
  const keywordInput = $('#keywordInput');
  const hashtagResult = $('#hashtagResult');
  function makeHashtags() {
    const words = (keywordInput?.value || '').split(/[\s,;]+/).map(word => word.replace(/[^\p{L}\p{N}_]/gu, '')).filter(Boolean);
    if (!words.length) {
      showToast('Keywords likho, jaise gaming, edits, novalive.');
      keywordInput?.focus();
      return;
    }
    const hashtags = [...new Set(words.map(word => '#' + word))];
    if (hashtagResult) hashtagResult.textContent = hashtags.join(' ');
  }
  $('#makeHashtags')?.addEventListener('click', makeHashtags);
  keywordInput?.addEventListener('keydown', event => { if (event.key === 'Enter') makeHashtags(); });
  $('#copyHashtags')?.addEventListener('click', () => copyText(hashtagResult?.textContent, 'Hashtags copied!'));

  // Future social profiles without a supplied URL show a helpful message instead of a dead link.
  $$('.social-placeholder').forEach(button => button.addEventListener('click', () => {
    showToast(`${button.dataset.platform}: apna invite/channel link script.js mein add karna hai.`);
  }));

  // Friendly placeholder mail link warning
  const contactLink = document.querySelector('a[href^="mailto:novalive@example.com"]');
  contactLink?.addEventListener('click', event => {
    event.preventDefault();
    showToast('Contact email placeholder hai — publish karne se pehle apna email set karo.');
  });

  const year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
