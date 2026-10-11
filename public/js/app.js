// ==========================================================================
// VAGNER MIYAHIRA - APLICAÇÃO PRINCIPAL & INTERATIVIDADE
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    initTheme();
    renderVehicles('all');
    renderAutoParts('all');
    renderBankCards();
    renderTestimonials();
    renderFAQs();
    initFiltersAndSearch();
    initVehicleModal();
    initPartsModal();
    initSellCarForm();
    initFAQAccordion();
    initStatsCounter();
    initFloatingWhatsApp();
    initMobileMenu();
    initSmoothScroll();
    initStorageSync();
}

// --------------------------------------------------------------------------
// SINCRONIZAÇÃO EM TEMPO REAL COM O PAINEL DE GESTÃO (PDV)
// --------------------------------------------------------------------------
function initStorageSync() {
    window.addEventListener('tradecar_stock_updated', () => {
        const activeFilter = document.querySelector('.filter-btn.active');
        const cat = activeFilter ? activeFilter.dataset.category : 'all';
        renderVehicles(cat);
        const activePartFilter = document.querySelector('.parts-filter-btn.active');
        const partCat = activePartFilter ? activePartFilter.dataset.partsCat : 'all';
        renderAutoParts(partCat);
    });

    window.addEventListener('storage', (e) => {
        if (e.key === 'tradecar_vehicles_v2' || e.key === 'tradecar_parts_v2') {
            const activeFilter = document.querySelector('.filter-btn.active');
            const cat = activeFilter ? activeFilter.dataset.category : 'all';
            renderVehicles(cat);
            const activePartFilter = document.querySelector('.parts-filter-btn.active');
            const partCat = activePartFilter ? activePartFilter.dataset.partsCat : 'all';
            renderAutoParts(partCat);
        }
    });
}

// --------------------------------------------------------------------------
// TEMA DARK / LIGHT
// --------------------------------------------------------------------------
function initTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    const savedTheme = localStorage.getItem('miyahira_theme') || 'dark';
    
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('miyahira_theme', newTheme);
            updateThemeIcon(newTheme);
            showToast(`Modo ${newTheme === 'dark' ? 'Escuro' : 'Claro'} ativado`);
        });
    }
}

function updateThemeIcon(theme) {
    const icon = document.getElementById('theme-toggle-icon');
    if (!icon) return;
    if (theme === 'dark') {
        icon.className = 'fas fa-sun';
    } else {
        icon.className = 'fas fa-moon';
    }
}

// --------------------------------------------------------------------------
// RENDERIZAÇÃO DO CATÁLOGO DE VEÍCULOS
// --------------------------------------------------------------------------
function renderVehicles(category = 'all', searchQuery = '', sortBy = 'default') {
    const container = document.getElementById('vehicles-grid');
    const countBadge = document.getElementById('vehicles-count');
    if (!container) return;

    let filtered = [...TradeCarStorage.getVehicles()];

    if (category !== 'all') {
        filtered = filtered.filter(v => v.category === category);
    }

    if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(v => 
            v.title.toLowerCase().includes(q) ||
            v.brand.toLowerCase().includes(q) ||
            v.model.toLowerCase().includes(q) ||
            v.year.toLowerCase().includes(q)
        );
    }

    if (sortBy === 'price-asc') {
        filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
        filtered.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'economy') {
        filtered.sort((a, b) => b.economy - a.economy);
    } else if (sortBy === 'year') {
        filtered.sort((a, b) => parseInt(b.year) - parseInt(a.year));
    }

    if (countBadge) {
        countBadge.textContent = `${filtered.length} veículos no catálogo`;
    }

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-car-side"></i>
                <h3>Nenhum veículo encontrado</h3>
                <p>Tente ajustar os filtros de busca ou consulte um executivo de vendas diretamente no WhatsApp para veículos sob encomenda.</p>
                <button class="btn btn-primary" onclick="resetVehicleFilters()">
                    <i class="fas fa-undo"></i> Limpar Filtros
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = filtered.map(v => {
        const isSold = v.status === 'sold';
        const isReserved = v.status === 'reserved';
        const statusBadge = isSold ? `<span class="category-badge" style="background:#dc2626; color:#fff;"><i class="fas fa-check-circle"></i> Vendido</span>` :
                            isReserved ? `<span class="category-badge" style="background:#d97706; color:#fff;"><i class="fas fa-clock"></i> Reservado</span>` :
                            `<span class="category-badge category-${v.category}">${v.categoryLabel}</span>`;

        const photoCountBadge = (v.images && Array.isArray(v.images) && v.images.length > 1)
            ? `<span class="photo-count-badge"><i class="fas fa-camera"></i> ${v.images.length} fotos</span>`
            : '';

        return `
        <article class="car-card ${isSold ? 'car-sold' : ''}" data-id="${v.id}">
            <div class="car-media">
                <img src="${v.image}" alt="${v.title}" loading="lazy">
                ${statusBadge}
                ${photoCountBadge}
                ${v.economy > 0 && !isSold ? `<span class="economy-tag"><i class="fas fa-tag"></i> Economize ${formatBRL(v.economy)}</span>` : ''}
            </div>
            
            <div class="car-content">
                <div class="car-header">
                    <span class="car-brand">${v.brand}</span>
                    <h3 class="car-title">${v.title}</h3>
                </div>

                <div class="car-specs-grid">
                    <div class="spec-item"><i class="far fa-calendar-alt"></i> <span>${v.year}</span></div>
                    <div class="spec-item"><i class="fas fa-tachometer-alt"></i> <span>${v.km}</span></div>
                    <div class="spec-item"><i class="fas fa-cogs"></i> <span>${v.transmission}</span></div>
                    <div class="spec-item"><i class="fas fa-gas-pump"></i> <span>${v.fuel}</span></div>
                </div>

                <div class="fipe-comparison">
                    <div class="fipe-row">
                        <span class="label">Tabela FIPE:</span>
                        <span class="fipe-val">${formatBRL(v.fipePrice)}</span>
                    </div>
                    <div class="price-row">
                        <span class="label">Valor Repasse / Especial:</span>
                        <span class="main-price">${formatBRL(v.price)}</span>
                    </div>
                </div>

                <div class="car-actions">
                    <button class="btn btn-outline btn-sm" onclick="openVehicleDetails('${v.id}')">
                        <i class="fas fa-info-circle"></i> Ver Laudo & Detalhes
                    </button>
                    ${isSold ? `
                        <button class="btn btn-outline btn-sm" disabled style="opacity:0.6; cursor:not-allowed;">
                            <i class="fas fa-lock"></i> Indisponível
                        </button>
                    ` : `
                        <button class="btn btn-whatsapp btn-sm" onclick="negotiateCar('${v.id}')">
                            <i class="fab fa-whatsapp"></i> Negociar
                        </button>
                    `}
                </div>
            </div>
        </article>
        `;
    }).join('');
}

function resetVehicleFilters() {
    const searchInput = document.getElementById('vehicle-search');
    const categoryBtns = document.querySelectorAll('.filter-btn[data-category]');
    if (searchInput) searchInput.value = '';
    categoryBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === 'all');
    });
    renderVehicles('all');
}

// --------------------------------------------------------------------------
// FILTROS E BUSCA DE VEÍCULOS
// --------------------------------------------------------------------------
function initFiltersAndSearch() {
    const categoryBtns = document.querySelectorAll('.filter-btn[data-category]');
    const searchInput = document.getElementById('vehicle-search');
    const sortSelect = document.getElementById('vehicle-sort');

    let currentCategory = 'all';
    let currentSearch = '';
    let currentSort = 'default';

    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            categoryBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = btn.dataset.category;
            renderVehicles(currentCategory, currentSearch, currentSort);
        });
    });

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearch = e.target.value;
            renderVehicles(currentCategory, currentSearch, currentSort);
        });
    }

    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            currentSort = e.target.value;
            renderVehicles(currentCategory, currentSearch, currentSort);
        });
    }

    // Filtros de peças
    const partsCategoryBtns = document.querySelectorAll('.parts-filter-btn[data-parts-cat]');
    const partsSearchInput = document.getElementById('parts-search');

    if (partsCategoryBtns) {
        partsCategoryBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                partsCategoryBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                renderAutoParts(btn.dataset.partsCat, partsSearchInput ? partsSearchInput.value : '');
            });
        });
    }

    if (partsSearchInput) {
        partsSearchInput.addEventListener('input', (e) => {
            const activeBtn = document.querySelector('.parts-filter-btn.active');
            const cat = activeBtn ? activeBtn.dataset.partsCat : 'all';
            renderAutoParts(cat, e.target.value);
        });
    }
}

// --------------------------------------------------------------------------
// RENDERIZAÇÃO DO CATÁLOGO DE AUTOPEÇAS
// --------------------------------------------------------------------------
function renderAutoParts(category = 'all', searchQuery = '') {
    const container = document.getElementById('parts-grid');
    if (!container) return;

    let filtered = [...TradeCarStorage.getParts()];

    if (category !== 'all') {
        filtered = filtered.filter(p => p.category === category);
    }

    if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(p => 
            p.title.toLowerCase().includes(q) ||
            p.compatibility.toLowerCase().includes(q) ||
            p.code.toLowerCase().includes(q)
        );
    }

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-cogs"></i>
                <h3>Peça não listada no catálogo online</h3>
                <p>Nosso galpão conta com centenas de componentes físicos. Fale com nosso executivo de vendas no WhatsApp para verificar a peça no galpão imediatamente.</p>
                <button class="btn btn-whatsapp" onclick="requestCustomPart()">
                    <i class="fab fa-whatsapp"></i> Consultar com Executivo de Vendas
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = filtered.map(p => `
        <article class="part-card">
            <div class="part-media">
                <img src="${p.image}" alt="${p.title}" loading="lazy">
                <span class="part-category-tag">${p.categoryLabel}</span>
                <span class="part-code-tag">Cód: ${p.code}</span>
            </div>
            
            <div class="part-body">
                <h4 class="part-title">${p.title}</h4>
                <p class="part-compatibility"><i class="fas fa-check-circle"></i> <strong>Compatibilidade:</strong> ${p.compatibility}</p>
                <p class="part-warranty"><i class="fas fa-shield-alt"></i> ${p.warranty}</p>

                <div class="part-specs-list">
                    ${(p.specs || []).slice(0, 2).map(s => `<span>• ${s}</span>`).join('')}
                </div>

                <div class="part-footer">
                    <div class="part-price-block">
                        <span class="part-price-label">Valor à vista:</span>
                        <span class="part-price">${formatBRL(p.price)}</span>
                    </div>
                    <button class="btn btn-whatsapp btn-sm" onclick="orderPart('${p.id}')">
                        <i class="fab fa-whatsapp"></i> Consultar / Comprar
                    </button>
                </div>
            </div>
        </article>
    `).join('');
}

// --------------------------------------------------------------------------
// MODAL DE DETALHES DO VEÍCULO COM LAUDO
// --------------------------------------------------------------------------
function initVehicleModal() {
    const modal = document.getElementById('vehicle-modal');
    const closeBtn = document.getElementById('modal-close');

    if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
        });
    }
}

window.openVehicleDetails = function(vehicleId) {
    const vehicle = TradeCarStorage.getVehicles().find(v => v.id === vehicleId);
    if (!vehicle) return;

    const modal = document.getElementById('vehicle-modal');
    const modalBody = document.getElementById('modal-vehicle-content');
    if (!modal || !modalBody) return;

    const laudo = vehicle.laudo || {
        estrutura: "Aprovado sem avarias",
        chassi: "Original e íntegro",
        motor: "Revisado e testado",
        documentacao: "Pronta para transferência",
        origem: "Procedência comprovada"
    };

    const isSold = vehicle.status === 'sold';
    const isReserved = vehicle.status === 'reserved';

    const galleryImages = (vehicle.images && Array.isArray(vehicle.images) && vehicle.images.length > 0)
        ? vehicle.images
        : [vehicle.image, vehicle.secondaryImage, 'images/1.png', 'images/2.png'].filter(Boolean);

    currentModalGallery = galleryImages;

    modalBody.innerHTML = `
        <div class="modal-vehicle-grid">
            <div class="modal-gallery">
                <div class="main-modal-img">
                    <img id="modal-main-image" src="${galleryImages[0]}" alt="${vehicle.title}">
                </div>
                <div class="thumb-list">
                    ${galleryImages.map((imgSrc, idx) => `
                        <img src="${imgSrc}" class="thumb ${idx === 0 ? 'active' : ''}" onclick="switchModalGalleryImage(${idx})" alt="Foto ${idx + 1}">
                    `).join('')}
                </div>

                <div class="laudo-box">
                    <h4><i class="fas fa-clipboard-check"></i> Resumo do Laudo de Procedência</h4>
                    <div class="laudo-items">
                        <div class="laudo-item"><span class="status-ok"><i class="fas fa-check"></i> Estrutura:</span> ${laudo.estrutura}</div>
                        <div class="laudo-item"><span class="status-ok"><i class="fas fa-check"></i> Chassi/Motor:</span> ${laudo.chassi}</div>
                        <div class="laudo-item"><span class="status-ok"><i class="fas fa-check"></i> Mecânica:</span> ${laudo.motor}</div>
                        <div class="laudo-item"><span class="status-ok"><i class="fas fa-check"></i> Documentação:</span> ${laudo.documentacao}</div>
                        <div class="laudo-item"><span class="status-ok"><i class="fas fa-check"></i> Origem:</span> ${laudo.origem}</div>
                    </div>
                </div>
            </div>

            <div class="modal-info">
                <div style="display:flex; gap:8px; align-items:center; margin-bottom:10px;">
                    <span class="category-badge category-${vehicle.category}">${vehicle.categoryLabel}</span>
                    ${isSold ? `<span class="category-badge" style="background:#dc2626; color:#fff;"><i class="fas fa-check-circle"></i> Vendido</span>` : ''}
                    ${isReserved ? `<span class="category-badge" style="background:#d97706; color:#fff;"><i class="fas fa-clock"></i> Reservado</span>` : ''}
                </div>
                <h2>${vehicle.title}</h2>
                <p class="modal-desc">${vehicle.description || 'Veículo inspecionado e pronto para negociação.'}</p>

                <div class="modal-price-box">
                    <div class="fipe-tag">Tabela FIPE: <strong>${formatBRL(vehicle.fipePrice)}</strong></div>
                    <div class="price-big">${formatBRL(vehicle.price)}</div>
                    ${vehicle.economy > 0 && !isSold ? `<div class="economy-alert"><i class="fas fa-arrow-down"></i> Você economiza ${formatBRL(vehicle.economy)} abaixo da FIPE</div>` : ''}
                </div>

                <div class="modal-specs-table">
                    <div><strong>Marca:</strong> ${vehicle.brand}</div>
                    <div><strong>Modelo:</strong> ${vehicle.model}</div>
                    <div><strong>Ano:</strong> ${vehicle.year}</div>
                    <div><strong>KM:</strong> ${vehicle.km}</div>
                    <div><strong>Câmbio:</strong> ${vehicle.transmission}</div>
                    <div><strong>Combustível:</strong> ${vehicle.fuel}</div>
                    <div><strong>Cor:</strong> ${vehicle.color}</div>
                    <div><strong>Final de Placa:</strong> ${vehicle.plateEnd}</div>
                </div>

                <h4>Itens e Opcionais</h4>
                <ul class="features-list">
                    ${(vehicle.features || []).map(f => `<li><i class="fas fa-check-circle"></i> ${f}</li>`).join('')}
                </ul>

                <div class="modal-cta-buttons">
                    ${isSold ? `
                        <button class="btn btn-secondary btn-lg" disabled style="opacity:0.6; cursor:not-allowed;">
                            <i class="fas fa-lock"></i> Veículo Já Vendido
                        </button>
                    ` : `
                        <button class="btn btn-whatsapp btn-lg" onclick="negotiateCar('${vehicle.id}')">
                            <i class="fab fa-whatsapp"></i> Falar com Executivo de Vendas
                        </button>
                    `}
                    <button class="btn btn-secondary btn-lg" onclick="simulateThisVehicle(${vehicle.price}, '${vehicle.title}')">
                        <i class="fas fa-calculator"></i> Simular Financiamento Deste Veículo
                    </button>
                </div>
            </div>
        </div>
    `;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
};

let currentModalGallery = [];

window.switchModalGalleryImage = function(index) {
    if (currentModalGallery[index]) {
        const mainImg = document.getElementById('modal-main-image');
        if (mainImg) mainImg.src = currentModalGallery[index];
        document.querySelectorAll('.thumb-list .thumb').forEach((t, i) => {
            t.classList.toggle('active', i === index);
        });
    }
};

window.switchModalImage = function(src, thumbEl) {
    const mainImg = document.getElementById('modal-main-image');
    if (mainImg) mainImg.src = src;
    document.querySelectorAll('.thumb').forEach(t => t.classList.remove('active'));
    if (thumbEl) thumbEl.classList.add('active');
};

window.negotiateCar = function(vehicleId) {
    const vehicle = TradeCarStorage.getVehicles().find(v => v.id === vehicleId);
    if (!vehicle) return;

    const message = `Olá! Gostaria de falar com um executivo de vendas da *Trade Car - Vendas e Repasse*.\n\n` +
        `Tenho interesse no seguinte veículo do estoque:\n` +
        `🚗 *Veículo:* ${vehicle.title}\n` +
        `📅 *Ano:* ${vehicle.year} | ⚡ *KM:* ${vehicle.km}\n` +
        `💰 *Valor Anunciado:* ${formatBRL(vehicle.price)} (FIPE: ${formatBRL(vehicle.fipePrice)})\n` +
        `🏷️ *Categoria:* ${vehicle.categoryLabel}\n\n` +
        `Por favor, me informe a disponibilidade, detalhes da documentação e formas de pagamento!`;

    window.open(`https://wa.me/${COMPANY_CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
};

window.simulateThisVehicle = function(price, title) {
    const modal = document.getElementById('vehicle-modal');
    if (modal) modal.classList.remove('active');
    document.body.style.overflow = 'auto';

    if (window.globalSimulator) {
        window.globalSimulator.setVehicleForSimulation(price, title);
    }
};

// --------------------------------------------------------------------------
// MODAL DE PEÇAS & PEDIDO
// --------------------------------------------------------------------------
function initPartsModal() {
    //
}

window.orderPart = function(partId) {
    const part = TradeCarStorage.getParts().find(p => p.id === partId);
    if (!part) return;

    const message = `Olá! Gostaria de falar com um executivo de vendas da *Trade Car - Vendas e Repasse*.\n\n` +
        `Gostaria de consultar/adquirir a seguinte peça do catálogo:\n` +
        `⚙️ *Peça:* ${part.title}\n` +
        `🏷️ *Código OEM:* ${part.code}\n` +
        `🚘 *Aplicação:* ${part.compatibility}\n` +
        `💵 *Valor:* ${formatBRL(part.price)}\n\n` +
        `Gostaria de verificar fotos reais do galpão e combinar o frete sob consulta para meu CEP.`;

    window.open(`https://wa.me/${COMPANY_CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
};

window.requestCustomPart = function() {
    const message = `Olá! Gostaria de falar com um executivo de vendas da *Trade Car*.\n\n` +
        `Estou procurando uma peça automotiva específica:\n` +
        `🚗 *Marca/Modelo/Ano do Veículo:* \n` +
        `⚙️ *Peça Desejada:* \n` +
        `🔢 *Código original (se souber):* \n\n` +
        `Vocês possuem em estoque físico ou conseguem localizar para mim?`;

    window.open(`https://wa.me/${COMPANY_CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
};

// --------------------------------------------------------------------------
// FORMULÁRIO VENDA SEU CARRO / REPASSE
// --------------------------------------------------------------------------
function initSellCarForm() {
    const form = document.getElementById('sell-car-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const name = document.getElementById('sell-name').value.trim();
        const phone = document.getElementById('sell-phone').value.trim();
        const brandModel = document.getElementById('sell-brand-model').value.trim();
        const year = document.getElementById('sell-year').value.trim();
        const km = document.getElementById('sell-km').value.trim();
        const price = document.getElementById('sell-price').value.trim();
        const notes = document.getElementById('sell-notes').value.trim();

        if (!name || !brandModel || !year) {
            showToast('Por favor, preencha os dados principais do veículo.', 'error');
            return;
        }

        const message = `Olá! Gostaria de solicitar uma avaliação técnica para o meu veículo na *Trade Car*:\n\n` +
            `👤 *Nome:* ${name}\n` +
            `📱 *WhatsApp:* ${phone}\n` +
            `🚗 *Veículo:* ${brandModel}\n` +
            `📅 *Ano/Modelo:* ${year}\n` +
            `⚡ *Quilometragem:* ${km || 'Não informada'}\n` +
            `💰 *Valor Pretendido:* ${price || 'A combinar'}\n` +
            `📝 *Observações:* ${notes || 'Sem detalhes adicionais'}\n\n` +
            `Gostaria de agendar a análise pericial e verificar a proposta sob consulta!`;

        TradeCarStorage.saveLead({
            type: 'Avaliação de Veículo',
            name,
            phone,
            brandModel,
            year,
            km,
            price,
            notes
        });

        showToast('Enviando ficha para o WhatsApp do executivo de vendas...');
        window.open(`https://wa.me/${COMPANY_CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
        form.reset();
    });
}

// --------------------------------------------------------------------------
// PROCESSO DE FINANCIAMENTO (FLUXO TRANSPARENTE SEM MARCAS DE BANCOS)
// --------------------------------------------------------------------------
function renderBankCards() {
    const container = document.getElementById('banks-grid');
    if (!container) return;

    const steps = [
        {
            icon: "fa-calculator",
            step: "Passo 1",
            title: "Simulação Estimada",
            desc: "Ajuste o valor do veículo e entrada no simulador acima para estimar as parcelas aproximadas.",
            badge: "Online e Instantâneo",
            color: "#f97316"
        },
        {
            icon: "fa-paper-plane",
            step: "Passo 2",
            title: "Envio da Proposta",
            desc: "Envie a ficha pré-formatada diretamente no WhatsApp para nosso executivo de vendas.",
            badge: "Sem Burocracia",
            color: "#10b981"
        },
        {
            icon: "fa-user-check",
            step: "Passo 3",
            title: "Análise Cadastral",
            desc: "Nossa equipe submete seu cadastro junto às principais financeiras parceiras com as melhores taxas.",
            badge: "Conduzido pela Equipe",
            color: "#3b82f6"
        },
        {
            icon: "fa-key",
            step: "Passo 4",
            title: "Aprovação & Retirada",
            desc: "Crédito liberado com segurança jurídica e laudo cautelar aprovado para retirada ou envio do carro.",
            badge: "Agilidade Total",
            color: "#8b5cf6"
        }
    ];

    container.innerHTML = steps.map(s => `
        <div class="bank-card">
            <div class="bank-badge-icon" style="color: ${s.color}">
                <i class="fas ${s.icon}"></i>
            </div>
            <span style="font-size:0.75rem; text-transform:uppercase; letter-spacing:1px; color:var(--text-muted); font-weight:700;">${s.step}</span>
            <h4 style="margin:4px 0 8px;">${s.title}</h4>
            <p style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:12px; line-height:1.4;">${s.desc}</p>
            <span class="bank-highlight" style="background:rgba(255,255,255,0.05); color:${s.color}; border:1px solid rgba(255,255,255,0.1);">${s.badge}</span>
        </div>
    `).join('');
}

// --------------------------------------------------------------------------
// DEPOIMENTOS E PROVA SOCIAL
// --------------------------------------------------------------------------
function renderTestimonials() {
    const container = document.getElementById('testimonials-grid');
    if (!container) return;

    container.innerHTML = TESTIMONIALS_DATA.map(t => `
        <div class="testimonial-card">
            <div class="stars">
                ${'<i class="fas fa-star"></i>'.repeat(t.rating)}
            </div>
            <p class="testimonial-text">"${t.text}"</p>
            <div class="testimonial-author">
                <div class="author-avatar"><i class="fas fa-user"></i></div>
                <div>
                    <strong>${t.name}</strong>
                    <span>${t.role} • ${t.location}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// --------------------------------------------------------------------------
// PERGUNTAS FREQUENTES (FAQ ACCORDION)
// --------------------------------------------------------------------------
function renderFAQs() {
    const container = document.getElementById('faq-accordion');
    if (!container) return;

    container.innerHTML = FAQS_DATA.map((f, i) => `
        <div class="faq-item ${i === 0 ? 'active' : ''}">
            <button class="faq-question" aria-expanded="${i === 0}">
                <span>${f.question}</span>
                <i class="fas fa-chevron-down"></i>
            </button>
            <div class="faq-answer">
                <p>${f.answer}</p>
            </div>
        </div>
    `).join('');
}

function initFAQAccordion() {
    const container = document.getElementById('faq-accordion');
    if (!container) return;

    container.addEventListener('click', (e) => {
        const questionBtn = e.target.closest('.faq-question');
        if (!questionBtn) return;

        const item = questionBtn.parentElement;
        const isActive = item.classList.contains('active');

        document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));

        if (!isActive) {
            item.classList.add('active');
            questionBtn.setAttribute('aria-expanded', 'true');
        } else {
            questionBtn.setAttribute('aria-expanded', 'false');
        }
    });
}

// --------------------------------------------------------------------------
// CONTADORES NUMÉRICOS ANIMADOS
// --------------------------------------------------------------------------
function initStatsCounter() {
    const stats = document.querySelectorAll('.stat-number');
    let triggered = false;

    const checkScroll = () => {
        if (triggered) return;
        const triggerPos = window.innerHeight * 0.85;

        stats.forEach(stat => {
            const rect = stat.getBoundingClientRect();
            if (rect.top <= triggerPos) {
                triggered = true;
                animateNumbers();
            }
        });
    };

    window.addEventListener('scroll', checkScroll);
    checkScroll();
}

function animateNumbers() {
    const stats = document.querySelectorAll('.stat-number');
    stats.forEach(el => {
        const target = parseInt(el.dataset.target) || 0;
        const prefix = el.dataset.prefix || '';
        const suffix = el.dataset.suffix || '';
        let current = 0;
        const duration = 1500;
        const stepTime = 20;
        const stepVal = target / (duration / stepTime);

        const timer = setInterval(() => {
            current += stepVal;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            el.textContent = `${prefix}${Math.round(current).toLocaleString('pt-BR')}${suffix}`;
        }, stepTime);
    });
}

// --------------------------------------------------------------------------
// WIDGET FLUTUANTE DE WHATSAPP
// --------------------------------------------------------------------------
function initFloatingWhatsApp() {
    const floatBtn = document.getElementById('whatsapp-floating-btn');
    const popup = document.getElementById('whatsapp-popup');
    const closeBtn = document.getElementById('whatsapp-popup-close');

    if (floatBtn && popup) {
        floatBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            popup.classList.toggle('active');
        });

        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                popup.classList.remove('active');
            });
        }

        document.addEventListener('click', (e) => {
            if (!popup.contains(e.target) && e.target !== floatBtn) {
                popup.classList.remove('active');
            }
        });
    }
}

window.quickWhatsAppChat = function(type) {
    let msg = "";
    if (type === 'repasse') {
        msg = "Olá! Gostaria de falar com um executivo de vendas da Trade Car. Quero consultar o estoque de veículos de REPASSE e oportunidades!";
    } else if (type === 'pecas') {
        msg = "Olá! Gostaria de falar com um executivo de vendas da Trade Car para consultar a disponibilidade de uma autopeça.";
    } else if (type === 'financiamento') {
        msg = "Olá! Gostaria de falar com um executivo de vendas da Trade Car para fazer uma simulação e análise de crédito para financiamento.";
    } else if (type === 'vender') {
        msg = "Olá! Gostaria de falar com um executivo de vendas da Trade Car para avaliação e intermediação/repasse do meu veículo sob consulta.";
    } else {
        msg = "Olá! Gostaria de falar com um executivo de vendas da Trade Car - Vendas e Repasse.";
    }

    window.open(`https://wa.me/${COMPANY_CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank');
};

// --------------------------------------------------------------------------
// MENU MOBILE E SMOOTH SCROLL
// --------------------------------------------------------------------------
function initMobileMenu() {
    const toggle = document.getElementById('mobile-menu-toggle');
    const nav = document.getElementById('main-nav');
    const icon = toggle ? toggle.querySelector('i') : null;

    if (toggle && nav) {
        toggle.setAttribute('aria-controls', 'main-nav');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.addEventListener('click', () => {
            const isActive = nav.classList.toggle('active');
            toggle.classList.toggle('active');
            toggle.setAttribute('aria-expanded', String(isActive));
            toggle.setAttribute('aria-label', isActive ? 'Fechar menu mobile' : 'Abrir menu mobile');
            if (icon) {
                icon.className = isActive ? 'fas fa-times' : 'fas fa-bars';
            }
            document.body.style.overflow = isActive ? 'hidden' : 'auto';
        });

        nav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                nav.classList.remove('active');
                toggle.classList.remove('active');
                toggle.setAttribute('aria-expanded', 'false');
                toggle.setAttribute('aria-label', 'Abrir menu mobile');
                if (icon) {
                    icon.className = 'fas fa-bars';
                }
                document.body.style.overflow = 'auto';
            });
        });
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && nav.classList.contains('active')) {
                toggle.click();
                toggle.focus();
            }
        });
    }
}

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#' || href.length < 2) return;
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

// --------------------------------------------------------------------------
// SISTEMA DE TOAST NOTIFICATIONS
// --------------------------------------------------------------------------
function showToast(text, type = 'success') {
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    toast.className = `toast-message toast-${type}`;
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i> <span>${text}</span>`;

    toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('visible');
    }, 10);

    setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}

// --------------------------------------------------------------------------
// UTILS
// --------------------------------------------------------------------------
function formatBRL(val) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
}
