/**
 * Cardápio Digital Inteligente
 * Suporta dados locais (menu-data.json) e sincronização com Google Sheets CSV
 */

let menuData = null;
let currentCategory = 'all';
let searchQuery = '';

// Cores para as badges de pratos
const BADGE_COLORS = {
  amber: 'bg-amber-500 text-black',
  emerald: 'bg-emerald-500 text-white',
  red: 'bg-rose-600 text-white',
  purple: 'bg-purple-600 text-white',
  blue: 'bg-blue-600 text-white'
};

// Formatação monetária (Real Brasileiro BRL)
const formatPrice = (val) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
};

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
  await loadMenuData();
  setupEventListeners();
  updateQrCode();
});

// Carrega os dados (tenta Google Sheets se configurado, ou usa menu-data.json)
async function loadMenuData() {
  try {
    const res = await fetch('menu-data.json');
    menuData = await res.json();

    // Se tiver URL do Google Sheets preenchida em CSV, busca da nuvem
    if (menuData.restaurant.googleSheetCsvUrl && menuData.restaurant.googleSheetCsvUrl.trim() !== '') {
      try {
        const sheetData = await fetchGoogleSheet(menuData.restaurant.googleSheetCsvUrl);
        if (sheetData && sheetData.items && sheetData.items.length > 0) {
          menuData.items = sheetData.items;
          if (sheetData.categories && sheetData.categories.length > 0) {
            menuData.categories = sheetData.categories;
          }
        }
      } catch (err) {
        console.warn('Não foi possível carregar da planilha Google, usando dados locais:', err);
      }
    }

    renderRestaurantInfo();
    renderCategories();
    renderMenuItems();
    lucide.createIcons();
  } catch (error) {
    console.error('Erro ao carregar cardápio:', error);
  }
}

// Renderiza dados institucionais (Header, WhatsApp, Instagram, Wi-Fi)
function renderRestaurantInfo() {
  const r = menuData.restaurant;
  document.title = `${r.name} - Cardápio Digital`;
  document.getElementById('header-banner').src = r.banner;
  document.getElementById('header-logo').src = r.logo;
  document.getElementById('restaurant-name').textContent = r.name;
  document.getElementById('restaurant-tagline').textContent = r.tagline;
  document.getElementById('restaurant-hours').textContent = r.hours;
  document.getElementById('restaurant-address').textContent = r.address;

  // Configuração WhatsApp
  const phone = (r.social.whatsapp || '').replace(/\D/g, '');
  const msg = encodeURIComponent(r.social.whatsappMessage || 'Olá!');
  const whatsappUrl = `https://wa.me/${phone}?text=${msg}`;
  
  const btnWa = document.getElementById('btn-whatsapp');
  btnWa.href = whatsappUrl;
  const floatWa = document.getElementById('floating-whatsapp');
  floatWa.href = whatsappUrl;

  // Configuração Instagram
  const btnIg = document.getElementById('btn-instagram');
  btnIg.href = r.social.instagram || '#';

  // Wi-Fi
  document.getElementById('wifi-network').textContent = r.wifi.network;
  document.getElementById('wifi-password').textContent = r.wifi.password;
}

// Renderiza abas horizontais de categorias
function renderCategories() {
  const bar = document.getElementById('category-bar');
  bar.innerHTML = '';

  // Botão "Todos"
  const allBtn = document.createElement('button');
  allBtn.className = getCategoryBtnClass(currentCategory === 'all');
  allBtn.innerHTML = `<span>✨</span><span>Todos</span>`;
  allBtn.onclick = () => selectCategory('all');
  bar.appendChild(allBtn);

  menuData.categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = getCategoryBtnClass(currentCategory === cat.id);
    btn.innerHTML = `<span>${cat.icon || '🍽️'}</span><span>${cat.name}</span>`;
    btn.onclick = () => selectCategory(cat.id);
    bar.appendChild(btn);
  });
}

function getCategoryBtnClass(isActive) {
  return `px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
    isActive 
      ? 'bg-amber-500 text-gray-950 shadow-md shadow-amber-500/20 scale-105' 
      : 'bg-gray-900 text-gray-400 hover:text-white hover:bg-gray-800 border border-gray-800/80'
  }`;
}

function selectCategory(catId) {
  currentCategory = catId;
  renderCategories();
  renderMenuItems();
  lucide.createIcons();
}

// Renderiza a lista de pratos
function renderMenuItems() {
  const container = document.getElementById('menu-sections');
  const noResults = document.getElementById('no-results');
  container.innerHTML = '';

  let filtered = menuData.items.filter(item => item.available !== false);

  // Filtro por busca
  if (searchQuery.trim() !== '') {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(item => 
      item.name.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      (item.tags && item.tags.some(t => t.toLowerCase().includes(query)))
    );
  }

  // Filtro por categoria
  if (currentCategory !== 'all') {
    filtered = filtered.filter(item => item.categoryId === currentCategory);
  }

  if (filtered.length === 0) {
    noResults.classList.remove('hidden');
    return;
  } else {
    noResults.classList.add('hidden');
  }

  // Se 'all' e não tem busca, agrupa por categoria com títulos
  if (currentCategory === 'all' && searchQuery.trim() === '') {
    menuData.categories.forEach(cat => {
      const itemsInCat = filtered.filter(i => i.categoryId === cat.id);
      if (itemsInCat.length > 0) {
        const section = document.createElement('section');
        section.id = `cat-${cat.id}`;
        section.className = 'space-y-3';
        
        section.innerHTML = `
          <div class="flex items-center gap-2 pb-1 border-b border-gray-800">
            <span class="text-lg">${cat.icon || '🍽️'}</span>
            <h2 class="text-base font-bold text-gray-200 tracking-wide">${cat.name}</h2>
            <span class="text-xs text-gray-500 ml-auto font-mono">${itemsInCat.length}</span>
          </div>
          <div class="grid grid-cols-1 gap-3">
            ${itemsInCat.map(renderItemCard).join('')}
          </div>
        `;
        container.appendChild(section);
      }
    });
  } else {
    // Lista plana (com busca ou categoria selecionada)
    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-1 gap-3';
    grid.innerHTML = filtered.map(renderItemCard).join('');
    container.appendChild(grid);
  }

  lucide.createIcons();
}

// Cria o HTML do Card individual de cada prato
function renderItemCard(item) {
  const badgeHtml = item.badge 
    ? `<span class="absolute top-2.5 left-2.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${BADGE_COLORS[item.badgeColor] || 'bg-amber-500 text-black'} shadow-md">${item.badge}</span>`
    : '';

  return `
    <article onclick="openItemModal('${item.id}')" 
             class="group bg-gray-900/70 hover:bg-gray-900 border border-gray-800/80 hover:border-gray-700/80 rounded-2xl p-3 sm:p-4 flex gap-3.5 transition-all duration-200 cursor-pointer shadow-sm active:scale-[0.99]">
      <!-- Imagem do Prato -->
      <div class="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden shrink-0 bg-gray-950">
        <img src="${item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80'}" 
             alt="${item.name}" 
             loading="lazy" 
             class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
        ${badgeHtml}
      </div>

      <!-- Detalhes do Prato -->
      <div class="flex flex-col justify-between flex-1 min-w-0">
        <div>
          <h3 class="font-bold text-sm sm:text-base text-gray-100 group-hover:text-amber-400 transition-colors line-clamp-1">${item.name}</h3>
          <p class="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">${item.description}</p>
        </div>

        <div class="mt-2.5 flex items-center justify-between">
          <span class="text-sm sm:text-base font-extrabold text-amber-400 tracking-tight">${formatPrice(item.price)}</span>
          <span class="text-[11px] font-semibold text-gray-500 group-hover:text-gray-300 flex items-center gap-0.5 transition-colors">
            Ver detalhes <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
          </span>
        </div>
      </div>
    </article>
  `;
}

// Configura os listeners de busca
function setupEventListeners() {
  const searchInput = document.getElementById('search-input');
  const clearBtn = document.getElementById('clear-search');
  const feedback = document.getElementById('search-feedback');
  const feedbackText = document.getElementById('search-feedback-text');

  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    if (searchQuery.length > 0) {
      clearBtn.classList.remove('hidden');
      feedback.classList.remove('hidden');
      feedbackText.textContent = `Buscando por: "${searchQuery}"`;
    } else {
      clearBtn.classList.add('hidden');
      feedback.classList.add('hidden');
    }
    renderMenuItems();
  });
}

function clearSearch() {
  const searchInput = document.getElementById('search-input');
  searchInput.value = '';
  searchQuery = '';
  document.getElementById('clear-search').classList.add('hidden');
  document.getElementById('search-feedback').classList.add('hidden');
  renderMenuItems();
}

// Modal de Detalhes
function openItemModal(itemId) {
  const item = menuData.items.find(i => String(i.id) === String(itemId));
  if (!item) return;

  document.getElementById('modal-image').src = item.image;
  document.getElementById('modal-title').textContent = item.name;
  document.getElementById('modal-description').textContent = item.description;
  document.getElementById('modal-price').textContent = formatPrice(item.price);

  const badgeEl = document.getElementById('modal-badge');
  if (item.badge) {
    badgeEl.textContent = item.badge;
    badgeEl.className = `absolute bottom-3 left-3 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${BADGE_COLORS[item.badgeColor] || 'bg-amber-500 text-black'}`;
    badgeEl.classList.remove('hidden');
  } else {
    badgeEl.classList.add('hidden');
  }

  // Tags
  const tagsContainer = document.getElementById('modal-tags');
  tagsContainer.innerHTML = '';
  if (item.tags && item.tags.length > 0) {
    item.tags.forEach(t => {
      const span = document.createElement('span');
      span.className = 'text-[10px] font-semibold bg-gray-800 text-gray-300 px-2 py-0.5 rounded-full border border-gray-700';
      span.textContent = t;
      tagsContainer.appendChild(span);
    });
  }

  // Link para perguntar sobre este prato específico no WhatsApp
  const phone = (menuData.restaurant.social.whatsapp || '').replace(/\D/g, '');
  const askMsg = encodeURIComponent(`Olá! Gostaria de saber mais sobre o prato "${item.name}" que vi no cardápio.`);
  document.getElementById('modal-whatsapp-ask').href = `https://wa.me/${phone}?text=${askMsg}`;

  document.getElementById('item-modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  lucide.createIcons();
}

function closeItemModal() {
  document.getElementById('item-modal').classList.add('hidden');
  document.body.style.overflow = '';
}

function closeItemModalOnBackdrop(e) {
  if (e.target.id === 'item-modal') closeItemModal();
}

// Modal Wi-Fi
function openWifiModal() {
  document.getElementById('wifi-modal').classList.remove('hidden');
}
function closeWifiModal() {
  document.getElementById('wifi-modal').classList.add('hidden');
}
function closeWifiModalOnBackdrop(e) {
  if (e.target.id === 'wifi-modal') closeWifiModal();
}
function copyWifiPassword() {
  const pwd = document.getElementById('wifi-password').textContent;
  navigator.clipboard.writeText(pwd);
  const btn = document.getElementById('btn-copy-wifi');
  btn.innerHTML = `<i data-lucide="check" class="w-3 h-3 text-emerald-400"></i><span class="text-emerald-400 font-semibold">Copiado!</span>`;
  lucide.createIcons();
  setTimeout(() => {
    btn.innerHTML = `<i data-lucide="copy" class="w-3 h-3"></i><span>Copiar</span>`;
    lucide.createIcons();
  }, 2000);
}

// Modal QR Code
function openQrModal() {
  document.getElementById('qr-modal').classList.remove('hidden');
  updateQrCode();
}
function closeQrModal() {
  document.getElementById('qr-modal').classList.add('hidden');
}
function closeQrModalOnBackdrop(e) {
  if (e.target.id === 'qr-modal') closeQrModal();
}

function updateQrCode() {
  const currentUrl = window.location.href.split('#')[0];
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(currentUrl)}&margin=10`;
  const qrImg = document.getElementById('qr-image');
  const urlLabel = document.getElementById('current-page-url');
  if (qrImg) qrImg.src = qrUrl;
  if (urlLabel) urlLabel.textContent = currentUrl;
}

// Parser simples para Google Sheets em formato CSV público
async function fetchGoogleSheet(csvUrl) {
  const response = await fetch(csvUrl);
  const text = await response.text();
  const rows = text.split('\n').map(r => r.split(',').map(cell => cell.trim().replace(/^"|"$/g, '')));
  if (rows.length < 2) return null;

  const headers = rows[0].map(h => h.toLowerCase());
  const items = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row[0] || row[0] === '') continue;

    const item = {
      id: String(i),
      categoryId: row[headers.indexOf('categoria')] || 'outros',
      name: row[headers.indexOf('nome')] || '',
      description: row[headers.indexOf('descricao')] || '',
      price: parseFloat(row[headers.indexOf('preco')]) || 0,
      image: row[headers.indexOf('fotourl')] || '',
      badge: row[headers.indexOf('destaque')] || '',
      badgeColor: 'amber',
      available: (row[headers.indexOf('disponivel')] || 'sim').toLowerCase() !== 'não'
    };
    items.push(item);
  }

  return { items };
}
