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

    let filtered = [...VEHICLES_DATA];

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
        countBadge.textContent = `${filtered.length} veículos disponíveis`;
    }

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-car-side"></i>
                <h3>Nenhum veículo encontrado</h3>
                <p>Tente ajustar os filtros de busca ou consulte o Vagner Miyahira diretamente no WhatsApp para veículos sob encomenda.</p>
                <button class="btn btn-primary" onclick="resetVehicleFilters()">
                    <i class="fas fa-undo"></i> Limpar Filtros
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = filtered.map(v => `
        <article class="car-card" data-id="${v.id}">
            <div class="car-media">
                <img src="${v.image}" alt="${v.title}" loading="lazy">
                <span class="category-badge category-${v.category}">${v.categoryLabel}</span>
                ${v.economy > 0 ? `<span class="economy-tag"><i class="fas fa-tag"></i> Economize ${formatBRL(v.economy)}</span>` : ''}
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
                    <button class="btn btn-whatsapp btn-sm" onclick="negotiateCar('${v.id}')">
                        <i class="fab fa-whatsapp"></i> Negociar
                    </button>
                </div>
            </div>
        </article>
    `).join('');
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

    let filtered = [...AUTO_PARTS_DATA];

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
                <p>Nosso estoque físico conta com centenas de componentes. Fale com Vagner no WhatsApp para localizar sua peça imediatamente.</p>
                <button class="btn btn-whatsapp" onclick="requestCustomPart()">
                    <i class="fab fa-whatsapp"></i> Consultar Peça com Vagner
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
                    ${p.specs.slice(0, 2).map(s => `<span>• ${s}</span>`).join('')}
                </div>

                <div class="part-footer">
                    <div class="part-price-block">
                        <span class="part-price-label">Valor à vista:</span>
                        <span class="part-price">${formatBRL(p.price)}</span>
                    </div>
                    <button class="btn btn-whatsapp btn-sm" onclick="orderPart('${p.id}')">
                        <i class="fab fa-whatsapp"></i> Comprar Peça
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
    const vehicle = VEHICLES_DATA.find(v => v.id === vehicleId);
    if (!vehicle) return;

    const modal = document.getElementById('vehicle-modal');
    const modalBody = document.getElementById('modal-vehicle-content');
    if (!modal || !modalBody) return;

    modalBody.innerHTML = `
        <div class="modal-vehicle-grid">
            <div class="modal-gallery">
                <div class="main-modal-img">
                    <img id="modal-main-image" src="${vehicle.image}" alt="${vehicle.title}">
                </div>
                <div class="thumb-list">
                    <img src="${vehicle.image}" class="thumb active" onclick="switchModalImage('${vehicle.image}', this)">
                    <img src="${vehicle.secondaryImage}" class="thumb" onclick="switchModalImage('${vehicle.secondaryImage}', this)">
                    <img src="images/1.png" class="thumb" onclick="switchModalImage('images/1.png', this)">
                    <img src="images/2.png" class="thumb" onclick="switchModalImage('images/2.png', this)">
                </div>

                <div class="laudo-box">
                    <h4><i class="fas fa-clipboard-check"></i> Resumo do Laudo de Procedência</h4>
                    <div class="laudo-items">
                        <div class="laudo-item"><span class="status-ok"><i class="fas fa-check"></i> Estrutura:</span> ${vehicle.laudo.estrutura}</div>
                        <div class="laudo-item"><span class="status-ok"><i class="fas fa-check"></i> Chassi/Motor:</span> ${vehicle.laudo.chassi}</div>
                        <div class="laudo-item"><span class="status-ok"><i class="fas fa-check"></i> Mecânica:</span> ${vehicle.laudo.motor}</div>
                        <div class="laudo-item"><span class="status-ok"><i class="fas fa-check"></i> Documentação:</span> ${vehicle.laudo.documentacao}</div>
                        <div class="laudo-item"><span class="status-ok"><i class="fas fa-check"></i> Origem:</span> ${vehicle.laudo.origem}</div>
                    </div>
                </div>
            </div>

            <div class="modal-info">
                <span class="category-badge category-${vehicle.category}">${vehicle.categoryLabel}</span>
                <h2>${vehicle.title}</h2>
                <p class="modal-desc">${vehicle.description}</p>

                <div class="modal-price-box">
                    <div class="fipe-tag">Tabela FIPE: <strong>${formatBRL(vehicle.fipePrice)}</strong></div>
                    <div class="price-big">${formatBRL(vehicle.price)}</div>
                    ${vehicle.economy > 0 ? `<div class="economy-alert"><i class="fas fa-arrow-down"></i> Você economiza ${formatBRL(vehicle.economy)} abaixo da FIPE</div>` : ''}
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
                    ${vehicle.features.map(f => `<li><i class="fas fa-check-circle"></i> ${f}</li>`).join('')}
                </ul>

                <div class="modal-cta-buttons">
                    <button class="btn btn-whatsapp btn-lg" onclick="negotiateCar('${vehicle.id}')">
                        <i class="fab fa-whatsapp"></i> Falar com Vagner Miyahira no WhatsApp
                    </button>
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

window.switchModalImage = function(src, thumbEl) {
    const mainImg = document.getElementById('modal-main-image');
    if (mainImg) mainImg.src = src;
    document.querySelectorAll('.thumb').forEach(t => t.classList.remove('active'));
    if (thumbEl) thumbEl.classList.add('active');
};

window.negotiateCar = function(vehicleId) {
    const vehicle = VEHICLES_DATA.find(v => v.id === vehicleId);
    if (!vehicle) return;

    const message = `Olá *Vagner Miyahira*, tenho interesse no veículo do estoque:\n\n` +
        `🚗 *Veículo:* ${vehicle.title}\n` +
        `📅 *Ano:* ${vehicle.year} | ⚡ *KM:* ${vehicle.km}\n` +
        `💰 *Valor Anunciado:* ${formatBRL(vehicle.price)} (FIPE: ${formatBRL(vehicle.fipePrice)})\n` +
        `🏷️ *Categoria:* ${vehicle.categoryLabel}\n\n` +
        `Por favor, me informe a disponibilidade, forma de pagamento e se aceita proposta!`;

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
    const part = AUTO_PARTS_DATA.find(p => p.id === partId);
    if (!part) return;

    const message = `Olá *Vagner Miyahira*, gostaria de adquirir a seguinte peça do catálogo de autopeças:\n\n` +
        `⚙️ *Peça:* ${part.title}\n` +
        `🏷️ *Código:* ${part.code}\n` +
        `🚘 *Aplicação:* ${part.compatibility}\n` +
        `💵 *Valor:* ${formatBRL(part.price)}\n\n` +
        `Gostaria de combinar a forma de envio/frete para o meu CEP e pagamento via PIX/Cartão.`;

    window.open(`https://wa.me/${COMPANY_CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
};

window.requestCustomPart = function() {
    const message = `Olá *Vagner Miyahira*, estou procurando uma peça automotiva específica:\n\n` +
        `🚗 *Marca/Modelo/Ano do Veículo:* \n` +
        `⚙️ *Peça Desejada:* \n` +
        `🔢 *Código original (se souber):* \n\n` +
        `Vocês possuem em estoque ou conseguem no pátio de repasse?`;

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

        const message = `Olá *Vagner Miyahira*, gostaria de avaliar meu veículo para VENDA / REPASSE IMEDIATO:\n\n` +
            `👤 *Nome:* ${name}\n` +
            `📱 *Telefone/WhatsApp:* ${phone}\n` +
            `🚗 *Veículo:* ${brandModel}\n` +
            `📅 *Ano/Modelo:* ${year}\n` +
            `⚡ *Quilometragem:* ${km || 'Não informada'}\n` +
            `💰 *Valor Pretendido:* ${price || 'A combinar'}\n` +
            `📝 *Observações/Detalhes:* ${notes || 'Sem observações adicionais'}\n\n` +
            `Aguardo sua proposta à vista via PIX!`;

        showToast('Enviando dados da avaliação para o WhatsApp de Vagner...');
        window.open(`https://wa.me/${COMPANY_CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
        form.reset();
    });
}

// --------------------------------------------------------------------------
// BANCOS PARCEIROS
// --------------------------------------------------------------------------
function renderBankCards() {
    const container = document.getElementById('banks-grid');
    if (!container) return;

    container.innerHTML = PARTNER_BANKS.map(b => `
        <div class="bank-card">
            <div class="bank-badge-icon" style="color: ${b.color}">
                <i class="fas fa-university"></i>
            </div>
            <h4>${b.name}</h4>
            <span class="bank-tag">${b.tag}</span>
            <p class="bank-speed"><i class="fas fa-bolt"></i> ${b.approvalSpeed}</p>
            <span class="bank-highlight">${b.highlight}</span>
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
            <p class="quote">"${t.text}"</p>
            <div class="author-meta">
                <div class="avatar"><i class="fas fa-user-tie"></i></div>
                <div>
                    <strong>${t.name}</strong>
                    <span>${t.role} • ${t.location}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// --------------------------------------------------------------------------
// FAQ ACCORDION
// --------------------------------------------------------------------------
function renderFAQs() {
    const container = document.getElementById('faq-accordion');
    if (!container) return;

    container.innerHTML = FAQS_DATA.map((f, index) => `
        <div class="faq-item ${index === 0 ? 'active' : ''}">
            <button class="faq-question">
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
    document.addEventListener('click', (e) => {
        const questionBtn = e.target.closest('.faq-question');
        if (!questionBtn) return;

        const item = questionBtn.parentElement;
        const isActive = item.classList.contains('active');

        document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
        if (!isActive) {
            item.classList.add('active');
        }
    });
}

// --------------------------------------------------------------------------
// CONTADOR DE ESTATÍSTICAS ANIMADO
// --------------------------------------------------------------------------
function initStatsCounter() {
    const statElements = document.querySelectorAll('.stat-number[data-target]');
    if (!statElements.length) return;

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const target = parseInt(el.dataset.target, 10) || 0;
                const prefix = el.dataset.prefix || '';
                const suffix = el.dataset.suffix || '';
                let count = 0;
                const duration = 1600;
                const stepTime = 25;
                const increment = Math.ceil(target / (duration / stepTime));

                const timer = setInterval(() => {
                    count += increment;
                    if (count >= target) {
                        el.textContent = `${prefix}${target.toLocaleString('pt-BR')}${suffix}`;
                        clearInterval(timer);
                    } else {
                        el.textContent = `${prefix}${count.toLocaleString('pt-BR')}${suffix}`;
                    }
                }, stepTime);

                obs.unobserve(el);
            }
        });
    }, { threshold: 0.3 });

    statElements.forEach(el => observer.observe(el));
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
        msg = "Olá Vagner Miyahira, estou no site da Trade Car e gostaria de ver o estoque completo de REPASSE e oportunidades para lojistas!";
    } else if (type === 'pecas') {
        msg = "Olá Vagner Miyahira, estou no site da Trade Car e preciso de uma peça automotiva original. Vocês têm disponível?";
    } else if (type === 'financiamento') {
        msg = "Olá Vagner Miyahira, estou no site da Trade Car e gostaria de simular um financiamento com aprovação rápida de crédito!";
    } else if (type === 'vender') {
        msg = "Olá Vagner Miyahira, tenho um carro e quero vender/repassar para a Trade Car à vista via PIX!";
    } else {
        msg = "Olá Vagner Miyahira, estou no site oficial da Trade Car - Vendas e Repasse e gostaria de atendimento!";
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
        toggle.addEventListener('click', () => {
            const isActive = nav.classList.toggle('active');
            toggle.classList.toggle('active');
            if (icon) {
                icon.className = isActive ? 'fas fa-times' : 'fas fa-bars';
            }
            document.body.style.overflow = isActive ? 'hidden' : 'auto';
        });

        nav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                nav.classList.remove('active');
                toggle.classList.remove('active');
                if (icon) {
                    icon.className = 'fas fa-bars';
                }
                document.body.style.overflow = 'auto';
            });
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
