// ==========================================================================
// TRADE CAR - PAINEL DE GESTÃO & PDV INTEGRADO
// Lógica Completa de Controle de Estoque, WhatsApp, Leads e Impressão
// ==========================================================================

const ADMIN_CREDENTIALS = {
    user: 'admin',
    pass: 'tradecar2026'
};

document.addEventListener('DOMContentLoaded', () => {
    initAdminApp();
});

let currentEditingVehicleId = null;
let currentEditingPartId = null;
let currentWhatsAppClientPhone = '';
let currentVehicleImages = [];
let currentPartImage = 'images/pecas_hero.jpg';

// --------------------------------------------------------------------------
// COMPRESSOR & OTIMIZADOR DE IMAGENS (CANVAS)
// Permite upload direto do celular (câmera/galeria) e computador,
// ajustando perfeitamente a resolução e evitando exceder cotas do navegador.
// --------------------------------------------------------------------------
function compressAndReadImage(file, maxWidth = 1280, maxHeight = 960, quality = 0.82) {
    return new Promise((resolve, reject) => {
        if (!file || !file.type.startsWith('image/')) {
            return reject(new Error('O arquivo selecionado não é uma imagem válida.'));
        }
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Erro ao ler o arquivo da imagem.'));
        reader.onload = (e) => {
            const img = new Image();
            img.onerror = () => reject(new Error('Falha ao processar arquivo de imagem.'));
            img.onload = () => {
                let w = img.width;
                let h = img.height;

                if (w > maxWidth || h > maxHeight) {
                    const ratio = Math.min(maxWidth / w, maxHeight / h);
                    w = Math.round(w * ratio);
                    h = Math.round(h * ratio);
                }

                const canvas = document.createElement('canvas');
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, w, h);

                const dataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(dataUrl);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}


function initAdminApp() {
    checkAuth();
    setupNavigation();
    setupDashboard();
    setupVehiclesManager();
    setupPartsManager();
    setupWhatsAppSuite();
    setupDocumentGenerator();
    setupMarketingSuite();
    setupLeadsManager();
    setupSettings();
    setupLiveSync();
}

// --------------------------------------------------------------------------
// AUTENTICAÇÃO & SESSÃO
// --------------------------------------------------------------------------
function checkAuth() {
    const isLogged = sessionStorage.getItem('tradecar_logged') === 'true' || 
                     localStorage.getItem('tradecar_logged') === 'true';

    const loginScreen = document.getElementById('login-screen');
    const appShell = document.getElementById('app-shell');

    if (isLogged) {
        if (loginScreen) loginScreen.style.display = 'none';
        if (appShell) appShell.style.display = 'flex';
        refreshAllViews();
    } else {
        if (loginScreen) loginScreen.style.display = 'flex';
        if (appShell) appShell.style.display = 'none';
    }

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const user = document.getElementById('adm-user').value.trim();
            const pass = document.getElementById('adm-pass').value.trim();
            const remember = document.getElementById('adm-remember').checked;

            const savedPass = localStorage.getItem('tradecar_custom_pass') || ADMIN_CREDENTIALS.pass;

            if (user === ADMIN_CREDENTIALS.user && pass === savedPass) {
                if (remember) {
                    localStorage.setItem('tradecar_logged', 'true');
                } else {
                    sessionStorage.setItem('tradecar_logged', 'true');
                }
                showAdminToast('Acesso autorizado com sucesso!');
                if (loginScreen) loginScreen.style.display = 'none';
                if (appShell) appShell.style.display = 'flex';
                refreshAllViews();
            } else {
                showAdminToast('Usuário ou senha incorretos!', 'error');
            }
        });
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('tradecar_logged');
            sessionStorage.removeItem('tradecar_logged');
            location.reload();
        });
    }
}

// --------------------------------------------------------------------------
// NAVEGAÇÃO ENTRE ABAS
// --------------------------------------------------------------------------
function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-item-btn[data-view]');
    const views = document.querySelectorAll('.view-panel');
    const titleEl = document.getElementById('top-bar-view-title');

    const viewTitles = {
        'dashboard': '<i class="fas fa-chart-line" style="color:var(--brand-orange)"></i> Visão Geral & Indicadores',
        'vehicles': '<i class="fas fa-car" style="color:var(--brand-orange)"></i> Gestão de Estoque de Veículos (PDV)',
        'parts': '<i class="fas fa-tools" style="color:var(--brand-orange)"></i> Departamento de Autopeças',
        'whatsapp': '<i class="fab fa-whatsapp" style="color:var(--brand-green)"></i> Central de Respostas Rápidas WhatsApp',
        'documents': '<i class="fas fa-file-invoice-dollar" style="color:var(--brand-blue)"></i> Gerador de Propostas & Recibos de Sinal',
        'marketing': '<i class="fas fa-bullhorn" style="color:var(--brand-purple)"></i> Divulgação Rápida & Redes Sociais',
        'leads': '<i class="fas fa-inbox" style="color:var(--brand-orange)"></i> Fichas & Avaliações Recebidas',
        'settings': '<i class="fas fa-cog" style="color:var(--text-muted)"></i> Configurações & Backup'
    };

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const viewName = btn.dataset.view;
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            views.forEach(v => {
                v.classList.toggle('active', v.id === `view-${viewName}`);
            });

            if (titleEl && viewTitles[viewName]) {
                titleEl.innerHTML = viewTitles[viewName];
            }

            // Atualizações contextuais ao abrir aba
            if (viewName === 'dashboard') updateDashboardMetrics();
            if (viewName === 'vehicles') renderAdminVehiclesTable();
            if (viewName === 'parts') renderAdminPartsTable();
            if (viewName === 'leads') renderAdminLeadsTable();
            if (viewName === 'documents') populateDocVehicleSelect();
            if (viewName === 'marketing') populateMarketingVehicleSelect();
        });
    });

    // Mobile sidebar toggle
    const menuToggle = document.getElementById('sidebar-mobile-toggle');
    const sidebar = document.querySelector('.sidebar');
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }
}

function refreshAllViews() {
    updateDashboardMetrics();
    renderAdminVehiclesTable();
    renderAdminPartsTable();
    renderWhatsAppTemplates();
    renderAdminLeadsTable();
    populateDocVehicleSelect();
    populateMarketingVehicleSelect();
}

function setupLiveSync() {
    window.addEventListener('tradecar_stock_updated', () => {
        refreshAllViews();
    });
}

// --------------------------------------------------------------------------
// DASHBOARD & INDICADORES
// --------------------------------------------------------------------------
function setupDashboard() {
    updateDashboardMetrics();
}

function updateDashboardMetrics() {
    const vehicles = TradeCarStorage.getVehicles();
    const parts = TradeCarStorage.getParts();
    const leads = TradeCarStorage.getLeads();

    const availableCars = vehicles.filter(v => v.status !== 'sold' && v.status !== 'reserved').length;
    const reservedCars = vehicles.filter(v => v.status === 'reserved').length;
    const soldCars = vehicles.filter(v => v.status === 'sold').length;

    let totalStockValue = 0;
    let totalMargin = 0;

    vehicles.forEach(v => {
        const price = parseFloat(v.price) || 0;
        const cost = parseFloat(v.costPrice) || (price * 0.82); // estimativa se não houver custo
        totalStockValue += price;
        totalMargin += (price - cost);
    });

    const elTotal = document.getElementById('metric-total-cars');
    const elAvailable = document.getElementById('metric-available-cars');
    const elParts = document.getElementById('metric-total-parts');
    const elValue = document.getElementById('metric-total-value');
    const elLeads = document.getElementById('metric-pending-leads');

    if (elTotal) elTotal.textContent = vehicles.length;
    if (elAvailable) elAvailable.textContent = `${availableCars} (${reservedCars} res / ${soldCars} vend)`;
    if (elParts) elParts.textContent = parts.length;
    if (elValue) elValue.textContent = formatCurrency(totalStockValue);
    if (elLeads) elLeads.textContent = leads.filter(l => l.status === 'Novo').length;

    // Badges na sidebar
    const badgeCars = document.getElementById('sidebar-badge-cars');
    const badgeParts = document.getElementById('sidebar-badge-parts');
    const badgeLeads = document.getElementById('sidebar-badge-leads');
    if (badgeCars) badgeCars.textContent = vehicles.length;
    if (badgeParts) badgeParts.textContent = parts.length;
    if (badgeLeads) badgeLeads.textContent = leads.filter(l => l.status === 'Novo').length;

    // Recent items on dashboard
    renderDashboardRecentList(vehicles);
}

function renderDashboardRecentList(vehicles) {
    const listContainer = document.getElementById('dashboard-recent-cars');
    if (!listContainer) return;

    const recent = [...vehicles].slice(0, 5);
    listContainer.innerHTML = recent.map(v => {
        const statusBadge = v.status === 'sold' ? '<span class="status-pill sold">Vendido</span>' :
                            v.status === 'reserved' ? '<span class="status-pill reserved">Reservado</span>' :
                            '<span class="status-pill available">Disponível</span>';

        return `
            <tr>
                <td>
                    <div class="car-thumb-cell">
                        <img src="${v.image}" alt="${v.title}">
                        <div>
                            <strong>${v.title}</strong>
                            <span>${v.brand} • ${v.year}</span>
                        </div>
                    </div>
                </td>
                <td><span class="category-badge category-${v.category}">${v.categoryLabel || v.category}</span></td>
                <td><strong>${formatCurrency(v.price)}</strong></td>
                <td>${statusBadge}</td>
                <td>
                    <button class="action-icon-btn" onclick="openEditVehicleModal('${v.id}')" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// --------------------------------------------------------------------------
// MÓDULO DE VEÍCULOS (PDV & ESTOQUE)
// --------------------------------------------------------------------------
function setupVehiclesManager() {
    const searchInput = document.getElementById('adm-vehicle-search');
    const statusFilter = document.getElementById('adm-vehicle-status-filter');
    const catFilter = document.getElementById('adm-vehicle-cat-filter');
    const newCarBtn = document.getElementById('btn-new-vehicle');

    if (searchInput) {
        searchInput.addEventListener('input', () => renderAdminVehiclesTable());
    }
    if (statusFilter) {
        statusFilter.addEventListener('change', () => renderAdminVehiclesTable());
    }
    if (catFilter) {
        catFilter.addEventListener('change', () => renderAdminVehiclesTable());
    }

    if (newCarBtn) {
        newCarBtn.addEventListener('click', () => openNewVehicleModal());
    }

    // Modal de Veículo
    const vehicleForm = document.getElementById('vehicle-form');
    if (vehicleForm) {
        vehicleForm.addEventListener('submit', handleSaveVehicle);
    }

    // Auto-cálculo de economia FIPE no modal
    const priceInput = document.getElementById('form-car-price');
    const fipeInput = document.getElementById('form-car-fipe');
    const economyDisplay = document.getElementById('form-car-economy-calc');

    const updateEco = () => {
        const p = parseFloat(priceInput.value) || 0;
        const f = parseFloat(fipeInput.value) || 0;
        const eco = Math.max(0, f - p);
        if (economyDisplay) {
            economyDisplay.textContent = `Margem de Economia FIPE: ${formatCurrency(eco)} (${f > 0 ? ((eco/f)*100).toFixed(1) : 0}% abaixo)`;
        }
    };

    if (priceInput && fipeInput) {
        priceInput.addEventListener('input', updateEco);
        fipeInput.addEventListener('input', updateEco);
    }

    // Upload de fotos do dispositivo (celular / PC)
    const fileInput = document.getElementById('form-car-file-input');
    const uploadZone = document.getElementById('car-upload-zone');

    if (fileInput) {
        fileInput.addEventListener('change', async (e) => {
            const files = Array.from(e.target.files || []);
            if (files.length === 0) return;

            showAdminToast(`Processando ${files.length} foto(s) do dispositivo...`);

            let addedCount = 0;
            for (const file of files) {
                try {
                    const compressed = await compressAndReadImage(file);
                    currentVehicleImages.push(compressed);
                    addedCount++;
                } catch (err) {
                    console.error('Erro ao processar imagem:', err);
                }
            }

            renderVehicleGalleryPreview();
            fileInput.value = '';
            showAdminToast(`${addedCount} foto(s) adicionada(s) com ajuste perfeito!`);
        });
    }

    if (uploadZone) {
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.classList.add('drag-over');
        });
        ['dragleave', 'dragend'].forEach(ev => {
            uploadZone.addEventListener(ev, () => uploadZone.classList.remove('drag-over'));
        });
        uploadZone.addEventListener('drop', async (e) => {
            e.preventDefault();
            uploadZone.classList.remove('drag-over');
            const files = Array.from(e.dataTransfer.files || []).filter(f => f.type.startsWith('image/'));
            if (files.length === 0) return;

            showAdminToast(`Processando ${files.length} foto(s)...`);
            let addedCount = 0;
            for (const file of files) {
                try {
                    const compressed = await compressAndReadImage(file);
                    currentVehicleImages.push(compressed);
                    addedCount++;
                } catch (err) {
                    console.error('Erro no arquivo:', err);
                }
            }
            renderVehicleGalleryPreview();
            showAdminToast(`${addedCount} foto(s) adicionada(s) ao veículo!`);
        });
    }
}

function renderAdminVehiclesTable() {
    const tbody = document.getElementById('adm-vehicles-tbody');
    if (!tbody) return;

    const vehicles = TradeCarStorage.getVehicles();
    const query = (document.getElementById('adm-vehicle-search')?.value || '').toLowerCase();
    const statusF = document.getElementById('adm-vehicle-status-filter')?.value || 'all';
    const catF = document.getElementById('adm-vehicle-cat-filter')?.value || 'all';

    let filtered = [...vehicles];

    if (statusF !== 'all') {
        filtered = filtered.filter(v => (v.status || 'available') === statusF);
    }
    if (catF !== 'all') {
        filtered = filtered.filter(v => v.category === catF);
    }
    if (query) {
        filtered = filtered.filter(v => 
            v.title.toLowerCase().includes(query) ||
            v.brand.toLowerCase().includes(query) ||
            v.model.toLowerCase().includes(query) ||
            (v.plateEnd && v.plateEnd.includes(query))
        );
    }

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center; padding:30px; color:var(--text-dim);">
                    Nenhum veículo encontrado com os filtros atuais.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filtered.map(v => {
        const isSold = v.status === 'sold';
        const isReserved = v.status === 'reserved';
        const statusBadge = isSold ? `<span class="status-pill sold"><i class="fas fa-check-circle"></i> Vendido</span>` :
                            isReserved ? `<span class="status-pill reserved"><i class="fas fa-clock"></i> Reservado</span>` :
                            `<span class="status-pill available"><i class="fas fa-check"></i> Disponível</span>`;

        const economy = (v.fipePrice && v.fipePrice > v.price) ? (v.fipePrice - v.price) : (v.economy || 0);

        return `
            <tr>
                <td>
                    <div class="car-thumb-cell">
                        <img src="${v.image}" alt="${v.title}">
                        <div>
                            <strong>${v.title}</strong>
                            <span>${v.brand} • ${v.year} • ${v.km} • Placa: final ${v.plateEnd || '-'}</span>
                        </div>
                    </div>
                </td>
                <td><span class="category-badge category-${v.category}">${v.categoryLabel || v.category}</span></td>
                <td>
                    <strong>${formatCurrency(v.price)}</strong>
                    ${v.fipePrice ? `<div style="font-size:0.75rem; color:var(--text-dim);">FIPE: ${formatCurrency(v.fipePrice)}</div>` : ''}
                </td>
                <td>
                    <span style="color:${economy > 0 ? 'var(--brand-green)' : 'var(--text-dim)'}; font-weight:700;">
                        ${economy > 0 ? formatCurrency(economy) : 'No valor'}
                    </span>
                </td>
                <td>
                    <div class="dropdown-status-wrap">
                        <select class="adm-select" onchange="changeVehicleStatus('${v.id}', this.value)" style="padding:4px 8px; font-size:0.78rem;">
                            <option value="available" ${v.status === 'available' || !v.status ? 'selected' : ''}>Disponível</option>
                            <option value="reserved" ${v.status === 'reserved' ? 'selected' : ''}>Reservado</option>
                            <option value="sold" ${v.status === 'sold' ? 'selected' : ''}>Vendido</option>
                        </select>
                    </div>
                </td>
                <td>
                    <div class="table-actions">
                        <button class="action-icon-btn" onclick="openEditVehicleModal('${v.id}')" title="Editar Veículo">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-icon-btn" onclick="generateAdForVehicle('${v.id}')" title="Gerar Anúncio Rápido">
                            <i class="fas fa-bullhorn"></i>
                        </button>
                        <button class="action-icon-btn" onclick="generateReceiptForVehicle('${v.id}')" title="Gerar Proposta/Recibo">
                            <i class="fas fa-file-invoice"></i>
                        </button>
                        <button class="action-icon-btn danger" onclick="deleteVehicleConfirm('${v.id}')" title="Excluir">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

window.changeVehicleStatus = function(vehicleId, newStatus) {
    const vehicles = TradeCarStorage.getVehicles();
    const idx = vehicles.findIndex(v => v.id === vehicleId);
    if (idx !== -1) {
        vehicles[idx].status = newStatus;
        TradeCarStorage.saveVehicles(vehicles);
        showAdminToast(`Status do veículo alterado para: ${newStatus.toUpperCase()}`);
        updateDashboardMetrics();
    }
};

// --------------------------------------------------------------------------
// GERENCIAMENTO DA GALERIA DE FOTOS DO VEÍCULO
// --------------------------------------------------------------------------
function renderVehicleGalleryPreview() {
    const container = document.getElementById('vehicle-gallery-preview');
    const countEl = document.getElementById('vehicle-photos-count');
    const mainInput = document.getElementById('form-car-image');
    if (!container) return;

    if (countEl) {
        countEl.textContent = `${currentVehicleImages.length} ${currentVehicleImages.length === 1 ? 'foto' : 'fotos'}`;
    }

    if (mainInput && currentVehicleImages.length > 0) {
        mainInput.value = currentVehicleImages[0];
    }

    if (currentVehicleImages.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align:center; padding:16px; color:var(--text-dim); font-size:0.82rem; background:rgba(0,0,0,0.25); border-radius:var(--radius-sm); border:1px dashed var(--adm-border);">
                <i class="fas fa-images" style="font-size:1.5rem; margin-bottom:6px; display:block; opacity:0.5;"></i>
                Nenhuma foto selecionada. Use o botão acima para adicionar fotos do celular ou computador.
            </div>
        `;
        return;
    }

    container.innerHTML = currentVehicleImages.map((src, index) => {
        const isMain = index === 0;
        return `
            <div class="gallery-preview-item ${isMain ? 'is-main' : ''}">
                <img src="${src}" alt="Foto ${index + 1}">
                ${isMain 
                    ? `<span class="main-badge"><i class="fas fa-star"></i> Capa</span>` 
                    : `<span class="order-badge">#${index + 1}</span>`
                }
                <button type="button" class="btn-remove-thumb" onclick="removeVehicleGalleryImage(${index})" title="Excluir foto">
                    <i class="fas fa-times"></i>
                </button>
                ${!isMain ? `
                    <button type="button" class="btn-make-cover" onclick="setAsVehicleCover(${index})" title="Definir como foto principal de capa">
                        Definir Capa
                    </button>
                ` : ''}
            </div>
        `;
    }).join('');
}

window.removeVehicleGalleryImage = function(index) {
    if (index >= 0 && index < currentVehicleImages.length) {
        currentVehicleImages.splice(index, 1);
        renderVehicleGalleryPreview();
        showAdminToast('Foto removida da galeria.');
    }
};

window.setAsVehicleCover = function(index) {
    if (index > 0 && index < currentVehicleImages.length) {
        const [selected] = currentVehicleImages.splice(index, 1);
        currentVehicleImages.unshift(selected);
        renderVehicleGalleryPreview();
        showAdminToast('Foto definida como principal de capa!');
    }
};

window.addVehicleImagePreset = function(path) {
    if (!currentVehicleImages.includes(path)) {
        currentVehicleImages.push(path);
        renderVehicleGalleryPreview();
        showAdminToast('Foto do pátio adicionada à galeria!');
    } else {
        showAdminToast('Essa imagem já está na galeria.');
    }
};

window.openNewVehicleModal = function() {
    currentEditingVehicleId = null;
    const form = document.getElementById('vehicle-form');
    if (form) form.reset();
    document.getElementById('vehicle-modal-title').textContent = 'Cadastrar Novo Veículo no Estoque';
    document.getElementById('form-car-status').value = 'available';
    currentVehicleImages = ['images/duster.jpg', 'images/1.png', 'images/2.png'];
    renderVehicleGalleryPreview();
    document.getElementById('adm-vehicle-modal').classList.add('active');
};

window.openEditVehicleModal = function(vehicleId) {
    currentEditingVehicleId = vehicleId;
    const vehicle = TradeCarStorage.getVehicles().find(v => v.id === vehicleId);
    if (!vehicle) return;

    document.getElementById('vehicle-modal-title').textContent = `Editar Veículo: ${vehicle.title}`;
    document.getElementById('form-car-title').value = vehicle.title || '';
    document.getElementById('form-car-brand').value = vehicle.brand || '';
    document.getElementById('form-car-model').value = vehicle.model || '';
    document.getElementById('form-car-year').value = vehicle.year || '';
    document.getElementById('form-car-km').value = vehicle.km || '';
    document.getElementById('form-car-transmission').value = vehicle.transmission || 'Automático';
    document.getElementById('form-car-fuel').value = vehicle.fuel || 'Flex';
    document.getElementById('form-car-color').value = vehicle.color || '';
    document.getElementById('form-car-plate').value = vehicle.plateEnd || '';
    document.getElementById('form-car-category').value = vehicle.category || 'repasse';
    document.getElementById('form-car-price').value = vehicle.price || '';
    document.getElementById('form-car-fipe').value = vehicle.fipePrice || '';
    document.getElementById('form-car-cost').value = vehicle.costPrice || '';
    document.getElementById('form-car-status').value = vehicle.status || 'available';
    document.getElementById('form-car-features').value = (vehicle.features || []).join(', ');
    document.getElementById('form-car-desc').value = vehicle.description || '';

    if (vehicle.images && Array.isArray(vehicle.images) && vehicle.images.length > 0) {
        currentVehicleImages = [...vehicle.images];
    } else {
        currentVehicleImages = [vehicle.image, vehicle.secondaryImage].filter(Boolean);
        if (currentVehicleImages.length === 0) currentVehicleImages = ['images/duster.jpg'];
    }
    renderVehicleGalleryPreview();

    document.getElementById('adm-vehicle-modal').classList.add('active');
};

window.closeVehicleModal = function() {
    document.getElementById('adm-vehicle-modal').classList.remove('active');
};

function handleSaveVehicle(e) {
    e.preventDefault();

    const title = document.getElementById('form-car-title').value.trim();
    const brand = document.getElementById('form-car-brand').value.trim();
    const model = document.getElementById('form-car-model').value.trim();
    const year = document.getElementById('form-car-year').value.trim();
    const km = document.getElementById('form-car-km').value.trim();
    const transmission = document.getElementById('form-car-transmission').value;
    const fuel = document.getElementById('form-car-fuel').value;
    const color = document.getElementById('form-car-color').value.trim();
    const plateEnd = document.getElementById('form-car-plate').value.trim();
    const category = document.getElementById('form-car-category').value;
    const price = parseFloat(document.getElementById('form-car-price').value) || 0;
    const fipePrice = parseFloat(document.getElementById('form-car-fipe').value) || price;
    const costPrice = parseFloat(document.getElementById('form-car-cost').value) || (price * 0.85);
    const status = document.getElementById('form-car-status').value;
    const featuresRaw = document.getElementById('form-car-features').value;
    const description = document.getElementById('form-car-desc').value.trim();

    // Resolver galeria de imagens
    const rawImage = document.getElementById('form-car-image')?.value?.trim();
    let images = currentVehicleImages.length > 0 ? [...currentVehicleImages] : (rawImage ? [rawImage] : ['images/duster.jpg']);
    const image = images[0];
    const secondaryImage = images[1] || images[0];

    const features = featuresRaw.split(',').map(s => s.trim()).filter(Boolean);
    const economy = Math.max(0, fipePrice - price);

    const categoryLabels = {
        'repasse': 'Repasse Lojista',
        'seminovos': 'Seminovo Selecionado',
        'oportunidade': 'Oportunidade Única'
    };

    const vehicles = TradeCarStorage.getVehicles();

    if (currentEditingVehicleId) {
        // Atualizar existente
        const idx = vehicles.findIndex(v => v.id === currentEditingVehicleId);
        if (idx !== -1) {
            vehicles[idx] = {
                ...vehicles[idx],
                title, brand, model, year, km, transmission, fuel, color, plateEnd,
                category, categoryLabel: categoryLabels[category] || category,
                price, fipePrice, costPrice, economy, status,
                image, secondaryImage, images, features, description
            };
            TradeCarStorage.saveVehicles(vehicles);
            showAdminToast(`Veículo "${title}" atualizado com sucesso!`);
        }
    } else {
        // Novo veículo
        const newVehicle = {
            id: 'car-' + Date.now(),
            title, brand, model, year, km, transmission, fuel, color, plateEnd,
            category, categoryLabel: categoryLabels[category] || category,
            price, fipePrice, costPrice, economy, status,
            image, secondaryImage, images, features, description,
            laudo: {
                estrutura: "Aprovado sem avarias estruturais",
                chassi: "Original e íntegro",
                motor: "Revisado e testado",
                documentacao: "Pronta para transferência",
                origem: "Procedência comprovada"
            }
        };
        vehicles.unshift(newVehicle);
        TradeCarStorage.saveVehicles(vehicles);
        showAdminToast(`Veículo "${title}" adicionado ao estoque!`);
    }

    closeVehicleModal();
    renderAdminVehiclesTable();
    updateDashboardMetrics();
}

window.deleteVehicleConfirm = function(vehicleId) {
    const vehicles = TradeCarStorage.getVehicles();
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return;

    if (confirm(`Tem certeza que deseja excluir o veículo "${vehicle.title}" do estoque?`)) {
        const updated = vehicles.filter(v => v.id !== vehicleId);
        TradeCarStorage.saveVehicles(updated);
        showAdminToast(`Veículo excluído com sucesso.`);
        renderAdminVehiclesTable();
        updateDashboardMetrics();
    }
};

// --------------------------------------------------------------------------
// MÓDULO DE AUTOPEÇAS
// --------------------------------------------------------------------------
function setupPartsManager() {
    const searchInput = document.getElementById('adm-parts-search');
    const catFilter = document.getElementById('adm-parts-cat-filter');
    const newPartBtn = document.getElementById('btn-new-part');

    if (searchInput) searchInput.addEventListener('input', () => renderAdminPartsTable());
    if (catFilter) catFilter.addEventListener('change', () => renderAdminPartsTable());
    if (newPartBtn) newPartBtn.addEventListener('click', () => openNewPartModal());

    const partForm = document.getElementById('part-form');
    if (partForm) {
        partForm.addEventListener('submit', handleSavePart);
    }

    // Upload de foto da peça pelo dispositivo (celular / computador)
    const partFileInput = document.getElementById('form-part-file-input');
    const partUploadZone = document.getElementById('part-upload-zone');

    if (partFileInput) {
        partFileInput.addEventListener('change', async (e) => {
            const file = (e.target.files || [])[0];
            if (!file) return;

            showAdminToast('Processando foto da peça...');
            try {
                const compressed = await compressAndReadImage(file);
                updatePartPreviewUI(compressed);
                showAdminToast('Foto da peça carregada com ajuste perfeito!');
            } catch (err) {
                showAdminToast('Erro ao processar imagem da peça.', 'error');
            }
            partFileInput.value = '';
        });
    }

    if (partUploadZone) {
        partUploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            partUploadZone.classList.add('drag-over');
        });
        ['dragleave', 'dragend'].forEach(ev => {
            partUploadZone.addEventListener(ev, () => partUploadZone.classList.remove('drag-over'));
        });
        partUploadZone.addEventListener('drop', async (e) => {
            e.preventDefault();
            partUploadZone.classList.remove('drag-over');
            const file = Array.from(e.dataTransfer.files || []).find(f => f.type.startsWith('image/'));
            if (!file) return;

            showAdminToast('Processando foto da peça...');
            try {
                const compressed = await compressAndReadImage(file);
                updatePartPreviewUI(compressed);
                showAdminToast('Foto da peça carregada com sucesso!');
            } catch (err) {
                showAdminToast('Erro ao processar imagem da peça.', 'error');
            }
        });
    }
}

function renderAdminPartsTable() {
    const tbody = document.getElementById('adm-parts-tbody');
    if (!tbody) return;

    const parts = TradeCarStorage.getParts();
    const query = (document.getElementById('adm-parts-search')?.value || '').toLowerCase();
    const catF = document.getElementById('adm-parts-cat-filter')?.value || 'all';

    let filtered = [...parts];

    if (catF !== 'all') {
        filtered = filtered.filter(p => p.category === catF);
    }
    if (query) {
        filtered = filtered.filter(p => 
            p.title.toLowerCase().includes(query) ||
            p.code.toLowerCase().includes(query) ||
            (p.compatibility && p.compatibility.toLowerCase().includes(query))
        );
    }

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center; padding:30px; color:var(--text-dim);">
                    Nenhuma peça encontrada com os filtros atuais.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filtered.map(p => {
        const stockQty = p.stockQty !== undefined ? p.stockQty : 1;

        return `
            <tr>
                <td>
                    <div class="car-thumb-cell">
                        <img src="${p.image || 'images/pecas_hero.jpg'}" alt="${p.title}">
                        <div>
                            <strong>${p.title}</strong>
                            <span>Cód: <code>${p.code}</code> • ${p.categoryLabel || p.category}</span>
                        </div>
                    </div>
                </td>
                <td><small style="color:var(--text-muted);">${p.compatibility}</small></td>
                <td><strong>${formatCurrency(p.price)}</strong></td>
                <td>
                    <div style="display:flex; align-items:center; gap:8px;">
                        <button class="action-icon-btn" style="width:24px; height:24px;" onclick="adjustPartStock('${p.id}', -1)">-</button>
                        <strong style="min-width:20px; text-align:center;">${stockQty}</strong>
                        <button class="action-icon-btn" style="width:24px; height:24px;" onclick="adjustPartStock('${p.id}', 1)">+</button>
                    </div>
                </td>
                <td>
                    <span class="status-pill available">
                        <i class="fas fa-certificate"></i> Com Baixa Detran
                    </span>
                </td>
                <td>
                    <div class="table-actions">
                        <button class="action-icon-btn" onclick="openEditPartModal('${p.id}')" title="Editar Peça">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-icon-btn" onclick="sendPartWhatsAppScript('${p.id}')" title="Script WhatsApp da Peça">
                            <i class="fab fa-whatsapp"></i>
                        </button>
                        <button class="action-icon-btn danger" onclick="deletePartConfirm('${p.id}')" title="Excluir">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

window.adjustPartStock = function(partId, delta) {
    const parts = TradeCarStorage.getParts();
    const idx = parts.findIndex(p => p.id === partId);
    if (idx !== -1) {
        const cur = parts[idx].stockQty !== undefined ? parts[idx].stockQty : 1;
        parts[idx].stockQty = Math.max(0, cur + delta);
        TradeCarStorage.saveParts(parts);
        renderAdminPartsTable();
        updateDashboardMetrics();
    }
};

function updatePartPreviewUI(src) {
    currentPartImage = src || 'images/pecas_hero.jpg';
    const preview = document.getElementById('form-part-image-preview');
    const hiddenInput = document.getElementById('form-part-image');
    const statusEl = document.getElementById('part-image-status');
    if (preview) preview.src = currentPartImage;
    if (hiddenInput) hiddenInput.value = currentPartImage;
    if (statusEl) {
        statusEl.innerHTML = '<i class="fas fa-check-circle"></i> Imagem pronta para exibição';
    }
}

window.openNewPartModal = function() {
    currentEditingPartId = null;
    const form = document.getElementById('part-form');
    if (form) form.reset();
    document.getElementById('part-modal-title').textContent = 'Cadastrar Nova Autopeça';
    updatePartPreviewUI('images/pecas_hero.jpg');
    document.getElementById('adm-part-modal').classList.add('active');
};

window.openEditPartModal = function(partId) {
    currentEditingPartId = partId;
    const part = TradeCarStorage.getParts().find(p => p.id === partId);
    if (!part) return;

    document.getElementById('part-modal-title').textContent = `Editar Peça: ${part.title}`;
    document.getElementById('form-part-title').value = part.title || '';
    document.getElementById('form-part-code').value = part.code || '';
    document.getElementById('form-part-category').value = part.category || 'motores';
    document.getElementById('form-part-compatibility').value = part.compatibility || '';
    document.getElementById('form-part-price').value = part.price || '';
    document.getElementById('form-part-cost').value = part.costPrice || '';
    document.getElementById('form-part-qty').value = part.stockQty !== undefined ? part.stockQty : 1;
    document.getElementById('form-part-warranty').value = part.warranty || '90 Dias com Nota Fiscal';
    updatePartPreviewUI(part.image || 'images/pecas_hero.jpg');

    document.getElementById('adm-part-modal').classList.add('active');
};

window.closePartModal = function() {
    document.getElementById('adm-part-modal').classList.remove('active');
};

function handleSavePart(e) {
    e.preventDefault();

    const title = document.getElementById('form-part-title').value.trim();
    const code = document.getElementById('form-part-code').value.trim();
    const category = document.getElementById('form-part-category').value;
    const compatibility = document.getElementById('form-part-compatibility').value.trim();
    const price = parseFloat(document.getElementById('form-part-price').value) || 0;
    const costPrice = parseFloat(document.getElementById('form-part-cost').value) || (price * 0.6);
    const stockQty = parseInt(document.getElementById('form-part-qty').value) || 1;
    const warranty = document.getElementById('form-part-warranty').value.trim();
    const image = currentPartImage || document.getElementById('form-part-image').value.trim() || 'images/pecas_hero.jpg';

    const catLabels = {
        'motores': 'Motores & Câmbios',
        'iluminacao': 'Faróis & Lanternas',
        'lataria': 'Lataria & Funilaria',
        'eletronica': 'Módulos & Eletrônica',
        'rodas': 'Rodas & Suspensão'
    };

    const parts = TradeCarStorage.getParts();

    if (currentEditingPartId) {
        const idx = parts.findIndex(p => p.id === currentEditingPartId);
        if (idx !== -1) {
            parts[idx] = {
                ...parts[idx],
                title, code, category, categoryLabel: catLabels[category] || category,
                compatibility, price, costPrice, stockQty, warranty, image
            };
            TradeCarStorage.saveParts(parts);
            showAdminToast(`Peça "${title}" atualizada!`);
        }
    } else {
        const newPart = {
            id: 'peca-' + Date.now(),
            title, code, category, categoryLabel: catLabels[category] || category,
            compatibility, price, costPrice, stockQty, warranty, image,
            badges: ["Com Baixa Detran", "Nota Fiscal", "Testado"],
            specs: ["Peça original inspecionada", "Pronta para envio seguro"]
        };
        parts.unshift(newPart);
        TradeCarStorage.saveParts(parts);
        showAdminToast(`Peça "${title}" adicionada com sucesso!`);
    }

    closePartModal();
    renderAdminPartsTable();
    updateDashboardMetrics();
}

window.deletePartConfirm = function(partId) {
    const parts = TradeCarStorage.getParts();
    const part = parts.find(p => p.id === partId);
    if (!part) return;

    if (confirm(`Deseja remover a peça "${part.title}" do estoque?`)) {
        const updated = parts.filter(p => p.id !== partId);
        TradeCarStorage.saveParts(updated);
        showAdminToast('Peça removida.');
        renderAdminPartsTable();
        updateDashboardMetrics();
    }
};

window.sendPartWhatsAppScript = function(partId) {
    const part = TradeCarStorage.getParts().find(p => p.id === partId);
    if (!part) return;

    const script = `Olá! Confirmamos a disponibilidade da seguinte peça em nosso estoque na Trade Car:\n\n` +
        `⚙️ *Peça:* ${part.title}\n` +
        `🏷️ *Código OEM:* ${part.code}\n` +
        `🚘 *Aplicação:* ${part.compatibility}\n` +
        `💵 *Valor à vista:* ${formatCurrency(part.price)}\n` +
        `🛡️ *Garantia:* ${part.warranty}\n\n` +
        `Acompanha Nota Fiscal Eletrônica e documentação de baixa no Detran. Posso cotar o frete para seu CEP?`;

    copyTextToClipboard(script);
    showAdminToast('Script da peça copiado para a área de transferência!');
};

// --------------------------------------------------------------------------
// CENTRAL WHATSAPP (TEMPLATES & RESPOSTAS PRÉ-SETADAS)
// --------------------------------------------------------------------------
function setupWhatsAppSuite() {
    renderWhatsAppTemplates();

    const catButtons = document.querySelectorAll('.tpl-cat-btn[data-cat]');
    catButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            catButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderWhatsAppTemplates(btn.dataset.cat);
        });
    });

    const searchInput = document.getElementById('adm-tpl-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            renderWhatsAppTemplates('all', e.target.value);
        });
    }

    const newTplBtn = document.getElementById('btn-new-template');
    if (newTplBtn) {
        newTplBtn.addEventListener('click', openNewTemplateModal);
    }
}

function renderWhatsAppTemplates(category = 'all', query = '') {
    const container = document.getElementById('whatsapp-templates-list');
    if (!container) return;

    const templates = TradeCarStorage.getTemplates();
    let filtered = [...templates];

    if (category !== 'all') {
        filtered = filtered.filter(t => t.category.toLowerCase() === category.toLowerCase());
    }

    if (query.trim()) {
        const q = query.toLowerCase();
        filtered = filtered.filter(t => t.title.toLowerCase().includes(q) || t.text.toLowerCase().includes(q));
    }

    container.innerHTML = filtered.map(t => `
        <div class="template-card" data-tpl-id="${t.id}">
            <div class="template-header">
                <h3><i class="fab fa-whatsapp" style="color:var(--brand-green);"></i> ${t.title}</h3>
                <span class="template-category-tag">${t.category}</span>
            </div>
            <div class="template-body-text" id="tpl-text-${t.id}">${escapeHTML(t.text)}</div>
            <div class="template-actions">
                <button class="btn btn-secondary btn-sm" onclick="copyTemplateText('${t.id}')">
                    <i class="fas fa-copy"></i> Copiar Texto
                </button>
                <button class="btn btn-success btn-sm" onclick="openWhatsAppDispatchModal('${t.id}')">
                    <i class="fab fa-whatsapp"></i> Disparar p/ Cliente
                </button>
            </div>
        </div>
    `).join('');
}

window.copyTemplateText = function(tplId) {
    const tplEl = document.getElementById(`tpl-text-${tplId}`);
    if (!tplEl) return;
    copyTextToClipboard(tplEl.innerText);
    showAdminToast('Texto copiado com sucesso para a área de transferência!');
};

window.openWhatsAppDispatchModal = function(tplId) {
    const templates = TradeCarStorage.getTemplates();
    const tpl = templates.find(t => t.id === tplId);
    if (!tpl) return;

    const phone = prompt("Digite o WhatsApp do cliente (com DDD, ex: 13999999999):", currentWhatsAppClientPhone || "");
    if (!phone) return;

    const cleanPhone = phone.replace(/\D/g, '');
    const finalPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

    const url = `https://wa.me/${finalPhone}?text=${encodeURIComponent(tpl.text)}`;
    window.open(url, '_blank');
};

function openNewTemplateModal() {
    const title = prompt("Título do novo script pré-setado:");
    if (!title) return;
    const category = prompt("Categoria (ex: Atendimento, Vendas, Peças, Repasse):", "Atendimento");
    const text = prompt("Texto da mensagem no WhatsApp:");
    if (!text) return;

    const templates = TradeCarStorage.getTemplates();
    templates.push({
        id: 'tpl-' + Date.now(),
        title,
        category: category || 'Geral',
        text
    });
    TradeCarStorage.saveTemplates(templates);
    renderWhatsAppTemplates();
    showAdminToast('Novo script adicionado com sucesso!');
}

// --------------------------------------------------------------------------
// GERADOR DE PROPOSTAS & RECIBOS (PDV IMPRESSÃO)
// --------------------------------------------------------------------------
function setupDocumentGenerator() {
    populateDocVehicleSelect();

    const carSelect = document.getElementById('doc-car-select');
    const buyerName = document.getElementById('doc-buyer-name');
    const buyerDoc = document.getElementById('doc-buyer-doc');
    const buyerPhone = document.getElementById('doc-buyer-phone');
    const buyerCity = document.getElementById('doc-buyer-city');
    const dealPrice = document.getElementById('doc-deal-price');
    const depositAmount = document.getElementById('doc-deposit-amount');
    const paymentMethod = document.getElementById('doc-payment-method');
    const docTerms = document.getElementById('doc-terms');

    const inputs = [carSelect, buyerName, buyerDoc, buyerPhone, buyerCity, dealPrice, depositAmount, paymentMethod, docTerms];
    inputs.forEach(el => {
        if (el) el.addEventListener('input', updateDocPreview);
    });

    if (carSelect) {
        carSelect.addEventListener('change', () => {
            const vehicle = TradeCarStorage.getVehicles().find(v => v.id === carSelect.value);
            if (vehicle && dealPrice) {
                dealPrice.value = vehicle.price;
                if (depositAmount) depositAmount.value = Math.round(vehicle.price * 0.1);
                updateDocPreview();
            }
        });
    }

    const printBtn = document.getElementById('btn-print-doc');
    if (printBtn) {
        printBtn.addEventListener('click', () => {
            window.print();
        });
    }
}

function populateDocVehicleSelect() {
    const select = document.getElementById('doc-car-select');
    if (!select) return;

    const vehicles = TradeCarStorage.getVehicles();
    select.innerHTML = '<option value="">Selecione um veículo do estoque...</option>' +
        vehicles.map(v => `<option value="${v.id}">${v.title} (${v.year}) - ${formatCurrency(v.price)}</option>`).join('');
}

function updateDocPreview() {
    const previewContainer = document.getElementById('doc-live-preview');
    if (!previewContainer) return;

    const vehicleId = document.getElementById('doc-car-select')?.value;
    const vehicle = TradeCarStorage.getVehicles().find(v => v.id === vehicleId) || {
        title: "Veículo Não Selecionado",
        year: "---",
        brand: "---",
        km: "---",
        plateEnd: "-"
    };

    const buyerName = document.getElementById('doc-buyer-name')?.value || "_________________________________";
    const buyerDoc = document.getElementById('doc-buyer-doc')?.value || "___.___.___-__";
    const buyerPhone = document.getElementById('doc-buyer-phone')?.value || "(  ) _____-____";
    const buyerCity = document.getElementById('doc-buyer-city')?.value || "Baixada Santista / SP";

    const dealPrice = parseFloat(document.getElementById('doc-deal-price')?.value) || 0;
    const deposit = parseFloat(document.getElementById('doc-deposit-amount')?.value) || 0;
    const balance = Math.max(0, dealPrice - deposit);
    const payMethod = document.getElementById('doc-payment-method')?.value || "PIX / Transferência";
    const terms = document.getElementById('doc-terms')?.value || "Veículo vendido no estado de conservação em que se encontra, com laudo cautelar e procedência jurídica garantida. O saldo restante deverá ser liquidado na entrega do veículo.";

    previewContainer.innerHTML = `
        <div class="printable-receipt-header">
            <div>
                <h2>TRADE CAR - VENDAS E REPASSE</h2>
                <p>Direção Executiva: Vagner Miyahira • CNPJ Operacional Credenciado</p>
                <p>Baixada Santista / SP • Contato Comercial: (13) 99620-2124</p>
            </div>
            <div style="text-align:right;">
                <strong style="font-size:1.1rem; color:var(--brand-orange);">RECIBO & TERMO DE RESERVA</strong>
                <p>Data: ${new Date().toLocaleDateString('pt-BR')}</p>
                <p>Nº Controle: TC-${Date.now().toString().slice(-6)}</p>
            </div>
        </div>

        <div style="margin-bottom:20px;">
            <h4 style="border-bottom:1px solid #ddd; padding-bottom:4px; margin-bottom:10px;">1. DADOS DO COMPRADOR / PROPONENTE</h4>
            <p><strong>Nome Completo / Razão Social:</strong> ${buyerName}</p>
            <p><strong>CPF / CNPJ:</strong> ${buyerDoc} &nbsp;|&nbsp; <strong>Telefone:</strong> ${buyerPhone}</p>
            <p><strong>Cidade / UF:</strong> ${buyerCity}</p>
        </div>

        <div style="margin-bottom:20px;">
            <h4 style="border-bottom:1px solid #ddd; padding-bottom:4px; margin-bottom:10px;">2. DADOS DO VEÍCULO OBJETO DE NEGOCIAÇÃO</h4>
            <p><strong>Veículo / Modelo:</strong> ${vehicle.title}</p>
            <p><strong>Ano / Modelo:</strong> ${vehicle.year} &nbsp;|&nbsp; <strong>KM Atual:</strong> ${vehicle.km || 'Inspecionado'} &nbsp;|&nbsp; <strong>Placa Final:</strong> ${vehicle.plateEnd || '-'}</p>
        </div>

        <div style="margin-bottom:20px;">
            <h4 style="border-bottom:1px solid #ddd; padding-bottom:4px; margin-bottom:10px;">3. CONDIÇÕES COMERCIAIS & PAGAMENTO</h4>
            <table style="width:100%; border-collapse:collapse; margin-top:8px;">
                <tr style="background:#f8f9fa;">
                    <td style="padding:8px; border:1px solid #ddd;"><strong>Valor Total Acordado:</strong></td>
                    <td style="padding:8px; border:1px solid #ddd; text-align:right;"><strong>${formatCurrency(dealPrice)}</strong></td>
                </tr>
                <tr>
                    <td style="padding:8px; border:1px solid #ddd;"><strong>Sinal de Reserva Recebido:</strong></td>
                    <td style="padding:8px; border:1px solid #ddd; text-align:right; color:#10b981;"><strong>${formatCurrency(deposit)}</strong> (${payMethod})</td>
                </tr>
                <tr style="background:#f8f9fa;">
                    <td style="padding:8px; border:1px solid #ddd;"><strong>Saldo Restante a Quitar:</strong></td>
                    <td style="padding:8px; border:1px solid #ddd; text-align:right; color:#ef4444;"><strong>${formatCurrency(balance)}</strong></td>
                </tr>
            </table>
        </div>

        <div style="margin-bottom:30px; font-size:0.82rem; color:#444; background:#fbfbfb; padding:12px; border-left:3px solid var(--brand-orange);">
            <strong>Termos e Condições:</strong> ${terms}
        </div>

        <div style="display:flex; justify-content:space-between; margin-top:50px; padding-top:20px;">
            <div style="text-align:center; width:45%; border-top:1px solid #333; padding-top:8px;">
                <p><strong>TRADE CAR - VENDAS E REPASSE</strong></p>
                <small>Executivo de Vendas / Direção</small>
            </div>
            <div style="text-align:center; width:45%; border-top:1px solid #333; padding-top:8px;">
                <p><strong>${buyerName}</strong></p>
                <small>Comprador / Proponente</small>
            </div>
        </div>
    `;
}

window.generateReceiptForVehicle = function(vehicleId) {
    const navBtn = document.querySelector('.nav-item-btn[data-view="documents"]');
    if (navBtn) navBtn.click();

    setTimeout(() => {
        const carSelect = document.getElementById('doc-car-select');
        if (carSelect) {
            carSelect.value = vehicleId;
            carSelect.dispatchEvent(new Event('change'));
        }
    }, 100);
};

// --------------------------------------------------------------------------
// GERADOR DE DIVULGAÇÃO & MARKETING (REDES SOCIAIS)
// --------------------------------------------------------------------------
function setupMarketingSuite() {
    populateMarketingVehicleSelect();

    const carSelect = document.getElementById('mkt-car-select');
    if (carSelect) {
        carSelect.addEventListener('change', generateMarketingCopies);
    }
}

function populateMarketingVehicleSelect() {
    const select = document.getElementById('mkt-car-select');
    if (!select) return;

    const vehicles = TradeCarStorage.getVehicles();
    select.innerHTML = '<option value="">Selecione um veículo do estoque...</option>' +
        vehicles.map(v => `<option value="${v.id}">${v.title} (${v.year}) - ${formatCurrency(v.price)}</option>`).join('');
}

function generateMarketingCopies() {
    const vehicleId = document.getElementById('mkt-car-select')?.value;
    if (!vehicleId) return;

    const vehicle = TradeCarStorage.getVehicles().find(v => v.id === vehicleId);
    if (!vehicle) return;

    const eco = (vehicle.fipePrice && vehicle.fipePrice > vehicle.price) ? (vehicle.fipePrice - vehicle.price) : 0;
    const phone = COMPANY_CONFIG.phone;

    // 1. WhatsApp Grupos de Lojistas de Repasse
    const copyWhatsapp = `🚨 *OPORTUNIDADE DE REPASSE - TRADE CAR* 🚨\n\n` +
        `🚗 *${vehicle.title.toUpperCase()}*\n` +
        `📅 Ano/Mod: *${vehicle.year}*\n` +
        `🛣️ KM: *${vehicle.km}*\n` +
        `⚙️ Câmbio: *${vehicle.transmission}*\n` +
        `⛽ Combustível: *${vehicle.fuel}*\n` +
        `🎨 Cor: *${vehicle.color}*\n` +
        `🔒 Placa: final *${vehicle.plateEnd || '-'}*\n\n` +
        `📊 *Tabela FIPE:* ${formatCurrency(vehicle.fipePrice)}\n` +
        `🔥 *VALOR REPASSE:* ${formatCurrency(vehicle.price)} à vista\n` +
        (eco > 0 ? `💰 *ECONOMIZE:* ${formatCurrency(eco)} ABAIXO DA FIPE!\n\n` : '\n') +
        `✅ Laudo Cautelar 100% Aprovado\n` +
        `✅ Documentação liberada para transferência imediata\n` +
        `✅ Frete e logística sob consulta\n\n` +
        `📲 *Chame agora no WhatsApp com Executivo de Vendas:* (13) 99620-2124\n` +
        `📍 Baixada Santista / SP`;

    // 2. Instagram & Facebook Feed
    const copySocial = `🔥 NOVIDADE NO ESTOQUE TRADE CAR 🔥\n\n` +
        `Procurando qualidade, procedência e a melhor oportunidade do mercado?\n\n` +
        `🚗 ${vehicle.title}\n` +
        `📅 Ano ${vehicle.year} | ${vehicle.km}\n` +
        `⚙️ ${vehicle.transmission} | ${vehicle.fuel}\n\n` +
        (eco > 0 ? `💥 Economia real de ${formatCurrency(eco)} em relação à Tabela FIPE!\n\n` : '') +
        `Opcionais & Destaques:\n` +
        (vehicle.features || []).slice(0, 5).map(f => `✔️ ${f}`).join('\n') + `\n\n` +
        `📋 Laudo cautelar aprovado e documentação pronta.\n` +
        `💳 Financiamento bancário facilitado sob consulta cadastral.\n` +
        `🚚 Logística e transporte a combinar para sua cidade.\n\n` +
        `📲 Fale com um de nossos executivos de vendas pelo link da bio ou WhatsApp:\n` +
        `👉 (13) 99620-2124\n\n` +
        `#TradeCar #RepasseAutomotivo #Seminovos #CarrosDeRepasse #BaixadaSantista #CarrosAVenda`;

    // 3. Portais (OLX / Marketplace)
    const copyPortal = `${vehicle.title} - Laudo Aprovado - Oportunidade Trade Car\n\n` +
        `Veículo em excelente estado de conservação, rigorosamente inspecionado pela equipe Trade Car.\n\n` +
        `Ano: ${vehicle.year}\n` +
        `Quilometragem: ${vehicle.km}\n` +
        `Câmbio: ${vehicle.transmission}\n` +
        `Combustível: ${vehicle.fuel}\n` +
        `Cor: ${vehicle.color}\n\n` +
        `VALOR ESPECIAL: ${formatCurrency(vehicle.price)}\n` +
        (eco > 0 ? `Valor Tabela FIPE: ${formatCurrency(vehicle.fipePrice)} (Economia de ${formatCurrency(eco)})\n\n` : '\n') +
        `Destaques do veículo:\n` +
        (vehicle.features || []).map(f => `- ${f}`).join('\n') + `\n\n` +
        `Observações: ${vehicle.description || 'Documentação em ordem para transferência imediata.'}\n\n` +
        `Atendimento comercial direto com Executivo de Vendas Trade Car:\n` +
        `WhatsApp: (13) 99620-2124\n` +
        `Atendemos lojistas e clientes particulares.`;

    const elWp = document.getElementById('copy-output-whatsapp');
    const elSoc = document.getElementById('copy-output-social');
    const elPort = document.getElementById('copy-output-portals');

    if (elWp) elWp.value = copyWhatsapp;
    if (elSoc) elSoc.value = copySocial;
    if (elPort) elPort.value = copyPortal;
}

window.generateAdForVehicle = function(vehicleId) {
    const navBtn = document.querySelector('.nav-item-btn[data-view="marketing"]');
    if (navBtn) navBtn.click();

    setTimeout(() => {
        const carSelect = document.getElementById('mkt-car-select');
        if (carSelect) {
            carSelect.value = vehicleId;
            generateMarketingCopies();
        }
    }, 100);
};

window.copyMarketingBox = function(elementId) {
    const el = document.getElementById(elementId);
    if (!el) return;
    copyTextToClipboard(el.value);
    showAdminToast('Texto do anúncio copiado!');
};

// --------------------------------------------------------------------------
// MÓDULO DE LEADS & AVALIAÇÕES
// --------------------------------------------------------------------------
function setupLeadsManager() {
    renderAdminLeadsTable();
}

function renderAdminLeadsTable() {
    const tbody = document.getElementById('adm-leads-tbody');
    if (!tbody) return;

    const leads = TradeCarStorage.getLeads();

    if (leads.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center; padding:30px; color:var(--text-dim);">
                    Nenhuma ficha ou lead recebido pelo site ainda. Os formulários preenchidos no site aparecerão aqui automaticamente.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = leads.map(l => {
        return `
            <tr>
                <td><small style="color:var(--text-dim);">${l.date || '-'}</small></td>
                <td>
                    <strong>${l.name}</strong>
                    <div style="font-size:0.75rem; color:var(--text-dim);">${l.phone}</div>
                </td>
                <td>
                    <strong>${l.brandModel || 'Veículo'}</strong>
                    <div style="font-size:0.75rem; color:var(--text-muted);">${l.year || ''} • ${l.km || ''}</div>
                </td>
                <td><strong style="color:var(--brand-orange);">${l.price || 'A combinar'}</strong></td>
                <td><small style="max-width:200px; display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${l.notes || ''}">${l.notes || 'Sem observações'}</small></td>
                <td>
                    <select class="adm-select" onchange="changeLeadStatus('${l.id}', this.value)" style="padding:4px 8px; font-size:0.78rem;">
                        <option value="Novo" ${l.status === 'Novo' ? 'selected' : ''}>Novo</option>
                        <option value="Em Contato" ${l.status === 'Em Contato' ? 'selected' : ''}>Em Contato</option>
                        <option value="Em Análise" ${l.status === 'Em Análise' ? 'selected' : ''}>Em Análise</option>
                        <option value="Concluído" ${l.status === 'Concluído' ? 'selected' : ''}>Concluído</option>
                        <option value="Descartado" ${l.status === 'Descartado' ? 'selected' : ''}>Descartado</option>
                    </select>
                </td>
                <td>
                    <div class="table-actions">
                        <button class="action-icon-btn" onclick="openLeadWhatsApp('${l.phone}', '${l.name}', '${l.brandModel || ''}')" title="Chamar no WhatsApp">
                            <i class="fab fa-whatsapp" style="color:var(--brand-green)"></i>
                        </button>
                        <button class="action-icon-btn danger" onclick="deleteLeadConfirm('${l.id}')" title="Remover Lead">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

window.changeLeadStatus = function(leadId, newStatus) {
    TradeCarStorage.updateLeadStatus(leadId, newStatus);
    showAdminToast(`Status do lead alterado para: ${newStatus}`);
    updateDashboardMetrics();
};

window.openLeadWhatsApp = function(phone, name, car) {
    const clean = phone.replace(/\D/g, '');
    const num = clean.startsWith('55') ? clean : `55${clean}`;
    const msg = `Olá ${name}! Sou executivo de vendas da *Trade Car*. Recebemos sua solicitação de avaliação para o veículo *${car}*. Estamos dando início à análise técnica sob consulta!`;
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, '_blank');
};

window.deleteLeadConfirm = function(leadId) {
    if (confirm("Remover este lead da lista?")) {
        TradeCarStorage.deleteLead(leadId);
        showAdminToast('Lead removido.');
        renderAdminLeadsTable();
        updateDashboardMetrics();
    }
};

// --------------------------------------------------------------------------
// CONFIGURAÇÕES & BACKUP
// --------------------------------------------------------------------------
function setupSettings() {
    const btnExport = document.getElementById('btn-export-backup');
    const btnImport = document.getElementById('btn-import-backup');
    const fileImport = document.getElementById('file-import-backup');
    const btnReset = document.getElementById('btn-reset-defaults');
    const formPass = document.getElementById('form-change-password');

    if (btnExport) {
        btnExport.addEventListener('click', () => {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(TradeCarStorage.exportBackup());
            const a = document.createElement('a');
            a.setAttribute("href", dataStr);
            a.setAttribute("download", `tradecar_backup_${new Date().toISOString().slice(0,10)}.json`);
            document.body.appendChild(a);
            a.click();
            a.remove();
            showAdminToast('Backup exportado com sucesso!');
        });
    }

    if (btnImport && fileImport) {
        btnImport.addEventListener('click', () => fileImport.click());
        fileImport.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (evt) => {
                const ok = TradeCarStorage.importBackup(evt.target.result);
                if (ok) {
                    showAdminToast('Backup restaurado com sucesso!');
                    refreshAllViews();
                } else {
                    showAdminToast('Arquivo de backup inválido!', 'error');
                }
            };
            reader.readAsText(file);
        });
    }

    if (btnReset) {
        btnReset.addEventListener('click', () => {
            if (confirm("ATENÇÃO: Deseja restaurar o estoque inicial padrão da Trade Car? Quaisquer dados personalizados serão substituídos.")) {
                TradeCarStorage.resetToDefaults();
                showAdminToast('Estoque padrão restaurado com sucesso!');
                refreshAllViews();
            }
        });
    }

    if (formPass) {
        formPass.addEventListener('submit', (e) => {
            e.preventDefault();
            const newPass = document.getElementById('new-admin-pass').value.trim();
            if (newPass.length < 4) {
                showAdminToast('A senha deve ter pelo menos 4 caracteres.', 'error');
                return;
            }
            localStorage.setItem('tradecar_custom_pass', newPass);
            showAdminToast('Senha alterada com sucesso!');
            formPass.reset();
        });
    }
}

// --------------------------------------------------------------------------
// UTILITÁRIOS & TOAST
// --------------------------------------------------------------------------
function formatCurrency(val) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
}

function copyTextToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
    } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
    }
}

function showAdminToast(message, type = 'success') {
    let container = document.getElementById('adm-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'adm-toast-container';
        container.style.cssText = 'position:fixed; top:20px; right:20px; z-index:10000; display:flex; flex-direction:column; gap:10px;';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const color = type === 'error' ? 'var(--brand-red)' : 'var(--brand-orange)';
    const icon = type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle';

    toast.style.cssText = `
        background: var(--adm-surface);
        border: 1px solid ${color};
        color: #fff;
        padding: 12px 20px;
        border-radius: var(--radius-md);
        box-shadow: 0 10px 25px rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 0.88rem;
        font-weight: 500;
        animation: fadeIn 0.3s ease;
    `;

    toast.innerHTML = `<i class="fas ${icon}" style="color:${color};"></i> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3200);
}

function escapeHTML(str) {
    return (str || '').replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}
