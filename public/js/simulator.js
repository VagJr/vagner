// ==========================================================================
// SIMULADOR DE FINANCIAMENTO BANCÁRIO AUTOMOTIVO
// Vagner Miyahira - Automóveis, Repasse & Peças
// ==========================================================================

class FinancingSimulator {
    constructor() {
        this.vehiclePrice = 79900;
        this.downPayment = 16000;
        this.months = 48;
        this.selectedBank = "Melhor Taxa Disponível";
        this.monthlyRate = 0.0129; // 1.29% a.m. média de mercado

        this.init();
    }

    init() {
        this.cacheElements();
        this.bindEvents();
        this.renderBankOptions();
        this.calculate();
    }

    cacheElements() {
        this.priceSlider = document.getElementById('sim-price-slider');
        this.priceInput = document.getElementById('sim-price-input');
        this.entrySlider = document.getElementById('sim-entry-slider');
        this.entryInput = document.getElementById('sim-entry-input');
        this.entryPercentLabel = document.getElementById('sim-entry-percent');
        this.monthsButtons = document.querySelectorAll('.month-btn');
        this.bankSelect = document.getElementById('sim-bank-select');
        
        // Output elements
        this.installmentValueEl = document.getElementById('sim-installment-value');
        this.financedAmountEl = document.getElementById('sim-financed-amount');
        this.totalPlanEl = document.getElementById('sim-total-plan');
        this.monthsDisplayEl = document.getElementById('sim-months-display');
        this.whatsappBtn = document.getElementById('sim-whatsapp-btn');
    }

    bindEvents() {
        if (this.priceSlider && this.priceInput) {
            this.priceSlider.addEventListener('input', (e) => {
                this.vehiclePrice = parseFloat(e.target.value) || 0;
                this.priceInput.value = this.formatCurrencyInput(this.vehiclePrice);
                
                // Adjust entry max if needed
                const maxEntry = this.vehiclePrice * 0.8;
                if (this.entrySlider) {
                    this.entrySlider.max = maxEntry;
                    if (this.downPayment > maxEntry) {
                        this.downPayment = Math.round(this.vehiclePrice * 0.2);
                        this.entrySlider.value = this.downPayment;
                        if (this.entryInput) this.entryInput.value = this.formatCurrencyInput(this.downPayment);
                    }
                }
                this.calculate();
            });

            this.priceInput.addEventListener('change', (e) => {
                const numeric = this.parseCurrency(e.target.value);
                this.vehiclePrice = Math.max(15000, Math.min(500000, numeric));
                this.priceSlider.value = this.vehiclePrice;
                this.priceInput.value = this.formatCurrencyInput(this.vehiclePrice);
                this.calculate();
            });
        }

        if (this.entrySlider && this.entryInput) {
            this.entrySlider.addEventListener('input', (e) => {
                this.downPayment = parseFloat(e.target.value) || 0;
                this.entryInput.value = this.formatCurrencyInput(this.downPayment);
                this.calculate();
            });

            this.entryInput.addEventListener('change', (e) => {
                const numeric = this.parseCurrency(e.target.value);
                this.downPayment = Math.max(0, Math.min(this.vehiclePrice * 0.9, numeric));
                this.entrySlider.value = this.downPayment;
                this.entryInput.value = this.formatCurrencyInput(this.downPayment);
                this.calculate();
            });
        }

        if (this.monthsButtons) {
            this.monthsButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    this.monthsButtons.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.months = parseInt(btn.dataset.months) || 48;
                    this.calculate();
                });
            });
        }

        if (this.bankSelect) {
            this.bankSelect.addEventListener('change', (e) => {
                this.selectedBank = e.target.value;
                this.calculate();
            });
        }

        if (this.whatsappBtn) {
            this.whatsappBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.sendWhatsAppProposal();
            });
        }
    }

    renderBankOptions() {
        if (!this.bankSelect) return;
        this.bankSelect.innerHTML = `
            <option value="Melhor Taxa Vigente de Mercado">✨ Taxa Média Estimada de Mercado (1,29% a.m.)</option>
            <option value="Entrada Reduzida Flexível">⚡ Plano com Entrada Reduzida (20%)</option>
            <option value="Condição Especial para Lojista/Repasse">🚗 Condição Especial Lojista / Repasse</option>
            <option value="Análise de Score sem Entrada">📋 Análise Especial de Score (Sob Consulta)</option>
        `;
    }

    setVehicleForSimulation(price, title = "") {
        this.vehiclePrice = price;
        this.downPayment = Math.round(price * 0.2); // 20% default entry
        
        if (this.priceSlider) this.priceSlider.value = this.vehiclePrice;
        if (this.priceInput) this.priceInput.value = this.formatCurrencyInput(this.vehiclePrice);
        if (this.entrySlider) {
            this.entrySlider.max = this.vehiclePrice * 0.8;
            this.entrySlider.value = this.downPayment;
        }
        if (this.entryInput) this.entryInput.value = this.formatCurrencyInput(this.downPayment);
        
        this.customVehicleTitle = title;
        this.calculate();

        const simSection = document.getElementById('financiamento');
        if (simSection) {
            simSection.scrollIntoView({ behavior: 'smooth' });
        }
    }

    calculate() {
        const principal = Math.max(0, this.vehiclePrice - this.downPayment);
        const percent = this.vehiclePrice > 0 ? ((this.downPayment / this.vehiclePrice) * 100).toFixed(0) : 0;
        
        if (this.entryPercentLabel) {
            this.entryPercentLabel.textContent = `(${percent}% do valor)`;
        }

        let installment = 0;
        if (principal > 0 && this.months > 0) {
            const i = this.monthlyRate;
            const n = this.months;
            installment = principal * ( (i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1) );
        }

        const totalFinanced = (installment * this.months) + this.downPayment;

        if (this.installmentValueEl) {
            this.installmentValueEl.textContent = this.formatBRL(installment);
        }
        if (this.financedAmountEl) {
            this.financedAmountEl.textContent = this.formatBRL(principal);
        }
        if (this.totalPlanEl) {
            this.totalPlanEl.textContent = this.formatBRL(totalFinanced);
        }
        if (this.monthsDisplayEl) {
            this.monthsDisplayEl.textContent = `${this.months}x`;
        }

        this.currentInstallment = installment;
        this.currentPrincipal = principal;
        this.currentTotal = totalFinanced;
    }

    sendWhatsAppProposal() {
        const vehicleText = this.customVehicleTitle ? `🚗 *Veículo Selecionado:* ${this.customVehicleTitle}\n` : '';
        const message = `Olá! Gostaria de falar com um executivo de vendas da *Trade Car - Vendas e Repasse*.\n\n` +
            `Fiz uma simulação estimada de financiamento pelo site oficial:\n\n` +
            vehicleText +
            `💰 *Valor do Veículo:* ${this.formatBRL(this.vehiclePrice)}\n` +
            `💵 *Entrada Estimada:* ${this.formatBRL(this.downPayment)}\n` +
            `📊 *Plano Escolhido:* ${this.months}x de aproximadamente ${this.formatBRL(this.currentInstallment)}\n` +
            `📋 *Perfil:* ${this.selectedBank}\n\n` +
            `Gostaria de verificar as condições e fazer a análise de crédito com a equipe!`;

        const url = `https://wa.me/${COMPANY_CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    }

    formatBRL(val) {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    }

    formatCurrencyInput(val) {
        return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
    }

    parseCurrency(str) {
        if (!str) return 0;
        const clean = str.toString().replace(/[^\d,]/g, '').replace(',', '.');
        return parseFloat(clean) || 0;
    }
}

// Global simulator instance
let globalSimulator = null;
document.addEventListener('DOMContentLoaded', () => {
    globalSimulator = new FinancingSimulator();
});
