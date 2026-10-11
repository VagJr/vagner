// ==========================================================================
// TRADE CAR - VENDAS E REPASSE
// Direção Executiva: Vagner Miyahira
// Dados Oficiais do Catálogo, Veículos, Peças, Parceiros e Financiamento
// ==========================================================================

const COMPANY_CONFIG = {
    name: "Trade Car - Vendas e Repasse",
    shortName: "Trade Car",
    slogan: "Vendas e Repasse",
    director: "Vagner Miyahira",
    phone: "13 99620-2124",
    whatsappNumber: "5513996202124",
    email: "contato@tradecarrepasse.com.br",
    location: "Baixada Santista, SP • Logística e Transporte a Consultar",
    hours: "Segunda a Sábado: 08:00 às 19:00 | Atendimento WhatsApp com Executivos de Vendas",
    stats: {
        vehiclesSold: "+3.200",
        partnerDealers: "+150",
        marketYears: "+16",
        approvalRate: "98.7%"
    }
};

const VEHICLES_DATA = [
    {
        id: "rep-001",
        title: "Renault Duster Iconic 1.6 CVT",
        brand: "Renault",
        model: "Duster",
        year: "2022/2023",
        km: "42.000 km",
        transmission: "Automático CVT",
        fuel: "Flex",
        color: "Preto Nacré",
        category: "repasse",
        categoryLabel: "Repasse Lojista",
        featured: true,
        price: 79900,
        fipePrice: 91500,
        economy: 11600,
        condition: "Excelente",
        plateEnd: "6",
        image: "images/duster.jpg",
        secondaryImage: "images/3.png",
        badges: ["Abaixo da FIPE", "Laudo Aprovado", "Pronta Entrega"],
        description: "Veículo em ótimo estado de conservação, revisão em dia, laudo cautelar 100% aprovado sem restrições. Ideal para margem imediata de revenda ou cliente final exigente.",
        features: [
            "Câmbio Automático CVT X-Tronic",
            "Central Multimídia EasyLink 8'' com Apple CarPlay e Android Auto",
            "Câmera de ré e sensor de estacionamento traseiro",
            "Ar-condicionado digital automático",
            "Controle de tração e estabilidade (ESP)",
            "Chave presencial Cartão Hands-Free",
            "Faróis com assinatura em LED (C-Shape)",
            "Rodas de liga leve diamantadas aro 17''"
        ],
        laudo: {
            estrutura: "Aprovado sem avarias estruturais",
            chassi: "Original e íntegro",
            motor: "Sem vazamentos, compressão padrão",
            documentacao: "IPVA 2026 Pago, Licenciado, Sem Multas/Restrições",
            origem: "Veículo de Repasse / Frota selecionada"
        }
    },
    {
        id: "rep-002",
        title: "Chevrolet Onix Plus Premier 1.0 Turbo",
        brand: "Chevrolet",
        model: "Onix Plus",
        year: "2023/2023",
        km: "28.500 km",
        transmission: "Automático",
        fuel: "Flex",
        color: "Branco Summit",
        category: "seminovos",
        categoryLabel: "Seminovo Premium",
        featured: true,
        price: 84500,
        fipePrice: 94800,
        economy: 10300,
        condition: "Impecável",
        plateEnd: "3",
        image: "images/3.png",
        secondaryImage: "images/1.png",
        badges: ["Único Dono", "Garantia de Fábrica", "Top de Linha"],
        description: "Versão topo de linha Premier, motor turbo econômico e potente, carregador wireless para celular, assistente de ponto cego e estacionamento semiautônomo.",
        features: [
            "Motor 1.0 Turbo 116cv",
            "Easy Park (Estacionamento automático)",
            "Alerta de ponto cego nos retrovisores",
            "Carregador de celular por indução",
            "Wi-Fi nativo e OnStar",
            "Bancos em couro bi-tom",
            "6 Airbags frontais, laterais e de cortina",
            "Partida remota do motor na chave"
        ],
        laudo: {
            estrutura: "100% Original de Fábrica",
            chassi: "Aprovado sem qualquer ressalva",
            motor: "Revisões em concessionária",
            documentacao: "Recibo em branco, pronto para transferência",
            origem: "Particular / Selecionado"
        }
    },
    {
        id: "rep-003",
        title: "Renault Sandero Stepway 1.6 Flex",
        brand: "Renault",
        model: "Stepway",
        year: "2022/2022",
        km: "51.000 km",
        transmission: "Manual 5m",
        fuel: "Flex",
        color: "Cinza Cassiopée",
        category: "repasse",
        categoryLabel: "Repasse Lojista",
        featured: false,
        price: 58900,
        fipePrice: 67200,
        economy: 8300,
        condition: "Muito Bom",
        plateEnd: "7",
        image: "images/3.png",
        secondaryImage: "images/2.png",
        badges: ["Margem para Lojista", "Laudo 100%", "Econômico"],
        description: "Excelente oportunidade para revendedores ou motoristas de aplicativo. Carro robusto, suspensão elevada, mecânica confiável com baixo custo de manutenção.",
        features: [
            "Suspensão elevada tipo Crossover",
            "Central Media Nav com Bluetooth e GPS",
            "Sensor de estacionamento",
            "Direção eletro-hidráulica progressiva",
            "Ar-condicionado e vidros elétricos nas 4 portas",
            "Faróis de neblina e rack de teto funcional",
            "Airbags frontais e laterais",
            "Espaço interno amplo e porta-malas de 320L"
        ],
        laudo: {
            estrutura: "Aprovada sem sinistro",
            chassi: "Conforme padrão montadora",
            motor: "Funcionamento perfeito e revisado",
            documentacao: "Documentos 100% regularizados",
            origem: "Repasse Direto Trade Car"
        }
    },
    {
        id: "rep-004",
        title: "Fiat Uno Attractive 1.0 Fire EVO",
        brand: "Fiat",
        model: "Uno",
        year: "2021/2021",
        km: "64.000 km",
        transmission: "Manual",
        fuel: "Flex",
        color: "Branco Banchisa",
        category: "repasse",
        categoryLabel: "Repasse Frotas / Lote",
        featured: false,
        price: 39900,
        fipePrice: 47500,
        economy: 7600,
        condition: "Bom",
        plateEnd: "1",
        image: "images/1.png",
        secondaryImage: "images/2.png",
        badges: ["Super Preço", "Ideal para Empresa", "Baixo Consumo"],
        description: "Ideal para empresas, frotistas ou primeiro carro. Consumo excelente na cidade e estrada, manutenção mais barata do mercado brasileiro.",
        features: [
            "Ar-condicionado gelando perfeitamente",
            "Direção hidráulica",
            "Vidros e travas elétricas",
            "Freios ABS com EBD",
            "Airbag duplo frontal",
            "Computador de bordo",
            "Pneus em ótimo estado (mais de 70% de borracha)",
            "Pintura e lataria bem preservadas"
        ],
        laudo: {
            estrutura: "Aprovado sem colisão",
            chassi: "Íntegro",
            motor: "Econômico e revisado",
            documentacao: "Quitado e sem débitos",
            origem: "Frota Corporativa Desmobilizada"
        }
    },
    {
        id: "rep-005",
        title: "Toyota Hilux SRV 2.8 4x4 Diesel Aut.",
        brand: "Toyota",
        model: "Hilux",
        year: "2021/2022",
        km: "78.000 km",
        transmission: "Automático 6m",
        fuel: "Diesel",
        color: "Prata Névoa",
        category: "seminovos",
        categoryLabel: "Seminovo Premium",
        featured: true,
        price: 198000,
        fipePrice: 224000,
        economy: 26000,
        condition: "Impecável",
        plateEnd: "0",
        image: "images/2.png",
        secondaryImage: "images/1.png",
        badges: ["Diesel 4x4", "Garantia Mecânica", "Super Oferta"],
        description: "Picape de altíssima liquidez, tração 4x4 com reduzida, motor turbo diesel de 204cv. Interior impecável, bancos em couro elétricos e tração perfeita.",
        features: [
            "Motor 2.8 Turbodiesel 204cv e 50,9 kgfm",
            "Tração 4x4 com seletor eletrônico e bloqueio de diferencial",
            "Bancos em couro com ajuste elétrico para o motorista",
            "Central multimídia com GPS e espelhamento",
            "Faróis Bi-LED com DRL",
            "Capota marítima e protetor de caçamba",
            "Controle de descida (DAC) e subida (HAC)",
            "7 Airbags para proteção máxima"
        ],
        laudo: {
            estrutura: "Aprovada 100%",
            chassi: "Perfeito sem pontos de corrosão",
            motor: "Diesel revisado em dia",
            documentacao: "Tudo pago e liberado",
            origem: "Particular"
        }
    },
    {
        id: "rep-006",
        title: "Fiat Fiorino Endurance 1.4 EVO",
        brand: "Fiat",
        model: "Fiorino",
        year: "2022/2023",
        km: "48.000 km",
        transmission: "Manual",
        fuel: "Flex",
        color: "Branco Ambiente",
        category: "utilitarios",
        categoryLabel: "Utilitário / Carga",
        featured: false,
        price: 64900,
        fipePrice: 73800,
        economy: 8900,
        condition: "Excelente",
        plateEnd: "4",
        image: "images/1.png",
        secondaryImage: "images/2.png",
        badges: ["Pronta Entrega", "Furgão Impecável", "Ideal p/ Logística"],
        description: "A melhor ferramenta de trabalho do Brasil. Baú de carga intacto com capacidade de 650kg e 3.300 litros. Pronta para trabalhar hoje mesmo no transporte e e-commerce.",
        features: [
            "Capacidade volumétrica de 3,3 m³ e carga de 650 kg",
            "Ar-condicionado e direção hidráulica",
            "Controle de estabilidade (ESC) e tração (TC)",
            "Assistente de partida em rampa (Hill Holder)",
            "Portas traseiras com abertura de até 180°",
            "Protetor de cárter de série",
            "Iluminação interna no compartimento de carga",
            "Manutenção ultra econômica"
        ],
        laudo: {
            estrutura: "Estrutura do baú e cabine íntegras",
            chassi: "Original",
            motor: "Revisado com troca de correia e óleo",
            documentacao: "Licenciado 2026",
            origem: "Frota Leve de Logística"
        }
    },
    {
        id: "rep-007",
        title: "Jeep Compass Longitude 1.3 Turbo Flex",
        brand: "Jeep",
        model: "Compass",
        year: "2022/2022",
        km: "39.000 km",
        transmission: "Automático 6m",
        fuel: "Flex",
        color: "Cinza Granite",
        category: "seminovos",
        categoryLabel: "Seminovo Premium",
        featured: true,
        price: 129900,
        fipePrice: 144500,
        economy: 14600,
        condition: "Impecável",
        plateEnd: "9",
        image: "images/3.png",
        secondaryImage: "images/2.png",
        badges: ["T270 Turbo", "Painel Digital", "Oportunidade"],
        description: "SUV mais desejado do mercado. Motor T270 com 185cv, painel 100% digital de 7'', multimídia de 10.1'' flutuante e bancos em couro legítimo.",
        features: [
            "Motor 1.3 Turbo T270 Flex (185 cv)",
            "Central Multimídia de 10.1 polegadas com Apple CarPlay sem fio",
            "Quadro de instrumentos digital de 7'' configurável",
            "Faróis Full LED com acendimento automático",
            "Bancos em couro premium com regulagem de altura",
            "Freio de estacionamento eletrônico com Auto Hold",
            "Ar-condicionado Dual Zone digital",
            "Rodas diamantadas aro 18'' com pneus novos"
        ],
        laudo: {
            estrutura: "Aprovada sem retoques graves",
            chassi: "Laudo Dekra / Super Visão Aprovado",
            motor: "Excelente resposta e 100% seco",
            documentacao: "IPVA quitado",
            origem: "Seminovo Selecionado"
        }
    },
    {
        id: "rep-008",
        title: "Fiat Strada Freedom 1.3 Cabine Plus",
        brand: "Fiat",
        model: "Strada",
        year: "2023/2023",
        km: "34.000 km",
        transmission: "Manual",
        fuel: "Flex",
        color: "Prata Bari",
        category: "utilitarios",
        categoryLabel: "Utilitário / Picape",
        featured: false,
        price: 74900,
        fipePrice: 83900,
        economy: 9000,
        condition: "Excelente",
        plateEnd: "2",
        image: "images/1.png",
        secondaryImage: "images/3.png",
        badges: ["Picape Campeã", "Capota Marítima", "Excelente Margem"],
        description: "Líder absoluta de vendas. Picape econômica, caçamba espaçosa com protetor e capota, pronta para serviço pesado ou uso diário.",
        features: [
            "Motor 1.3 Firefly 4 cilindros flex",
            "Direção elétrica progressiva",
            "Ar-condicionado e computador de bordo",
            "Sensor de pressão dos pneus (iTPMS)",
            "Caçamba com capacidade para 1.354 litros e 720 kg",
            "Vidros e travas elétricas",
            "Controle de estabilidade com TC+",
            "Capota marítima original"
        ],
        laudo: {
            estrutura: "Aprovado 100%",
            chassi: "Original",
            motor: "Revisado",
            documentacao: "Sem débitos, pronto para faturar",
            origem: "Repasse Selecionado Trade Car"
        }
    }
];

const AUTO_PARTS_DATA = [
    {
        id: "peca-001",
        title: "Motor Parcial Renault 1.6 16v SCe",
        category: "motores",
        categoryLabel: "Motores & Câmbios",
        code: "RN-SCE16-044",
        compatibility: "Duster, Sandero, Logan, Captur (2018 a 2024)",
        warranty: "90 Dias de Garantia com Nota Fiscal e Baixa Detran",
        condition: "Seminovo Testado / 100% Revisado",
        price: 6800,
        image: "images/pecas_hero.jpg",
        badges: ["Com Baixa Detran", "Nota Fiscal", "Testado em Bancada"],
        specs: [
            "Bloco com pistões, bielas, virabrequim e cabeçote",
            "Testado em dinamômetro e bancada de pressão",
            "Sem vazamentos, compressão original de fábrica",
            "Pronto para cadastramento no Detran do seu Estado"
        ]
    },
    {
        id: "peca-002",
        title: "Câmbio Automático CVT X-Tronic",
        category: "cambios",
        categoryLabel: "Motores & Câmbios",
        code: "CVT-XT-2022",
        compatibility: "Renault Duster, Captur / Nissan Kicks, Versa",
        warranty: "90 Dias de Garantia Mecânica",
        condition: "Seminovo Original com Fluido Novo",
        price: 7500,
        image: "images/pecas_hero.jpg",
        badges: ["Original de Montadora", "Conversor Incluso", "Pronta Entrega"],
        specs: [
            "Conjunto completo com conversor de torque",
            "Cintas e polias cônicas em estado impecável",
            "Corpo de válvulas testado eletronicamente",
            "Compatível com motores 1.6 16V"
        ]
    },
    {
        id: "peca-003",
        title: "Farol Dianteiro Full LED Original GM Onix Premier",
        category: "iluminacao",
        categoryLabel: "Faróis & Lanternas",
        code: "GM-LED-ONX23",
        compatibility: "Chevrolet Onix Premier / Tracker (2020 a 2024)",
        warranty: "Garantia de Funcionamento e Estanqueidade",
        condition: "Original GM com Lente Cristalina",
        price: 1850,
        image: "images/pecas_hero.jpg",
        badges: ["Original GM", "Lente 100% Cristal", "Sem Travas Quebradas"],
        specs: [
            "Farol original com DRL integrado e máscara negra",
            "Todas as travas de fixação originais e intactas",
            "Lente polida e tratada contra raios UV",
            "Conector padrão plug & play original"
        ]
    },
    {
        id: "peca-004",
        title: "Kit Frente Completa (Capô, Para-choque, Grade e Para-lamas)",
        category: "lataria",
        categoryLabel: "Lataria & Funilaria",
        code: "LAT-DUST-FRT",
        compatibility: "Renault Duster (2021 a 2024)",
        warranty: "Alinhamento Perfeito Garantido",
        condition: "Original de Fábrica sem Massa ou Recuperação",
        price: 4900,
        image: "images/pecas_hero.jpg",
        badges: ["Peças Originais", "Alinhamento Perfeito", "Envio Seguro"],
        specs: [
            "Capô dianteiro original com manta térmica",
            "Para-choque com grade e suporte dos milhas",
            "Para-lamas esquerdo e direito originais",
            "Sem amassados estruturais, pronto para pintura"
        ]
    },
    {
        id: "peca-005",
        title: "Módulo de Injeção Eletrônica ECU Bosch Programado",
        category: "eletronica",
        categoryLabel: "Módulos & Eletrônica",
        code: "ECU-BSH-ME17",
        compatibility: "Linha Fiat Firefly 1.0 / 1.3 (Argo, Cronos, Strada, Pulse)",
        warranty: "90 Dias com Certificado Eletrônico",
        condition: "Testado, Desbloqueado / Pronto para Reset",
        price: 1400,
        image: "images/pecas_hero.jpg",
        badges: ["Testado em Scanner", "Desbloqueado", "Garantia"],
        specs: [
            "Módulo original Bosch testado em bancada",
            "Mapeamento de parâmetros originais de injeção",
            "Pronto para pareamento com imobilizador",
            "Suporte técnico para codificação"
        ]
    },
    {
        id: "peca-006",
        title: "Jogo de Rodas Liga Leve Aro 18'' Original Jeep Compass",
        category: "rodas",
        categoryLabel: "Rodas & Suspensão",
        code: "WHL-JEEP-18D",
        compatibility: "Jeep Compass, Renegade, Commander / Fiat Toro",
        warranty: "Garantia de Balanceamento e Estrutura",
        condition: "Diamantadas Originais sem Trincas ou Soldas",
        price: 3600,
        image: "images/pecas_hero.jpg",
        badges: ["Sem Soldas", "Diamantação Nova", "Furação 5x110"],
        specs: [
            "Jogo com 4 rodas diamantadas com fundo grafite",
            "Aferidas em máquina de balanceamento sem empenos",
            "Furação original 5x110 com bicos novos",
            "Opção com pneus meia-vida ou novos sob consulta"
        ]
    }
];

const PARTNER_BANKS = [
    {
        name: "Santander Auto",
        tag: "Taxas a partir de 1,19% a.m.",
        maxMonths: 60,
        approvalSpeed: "Em até 15 minutos",
        highlight: "Líder em Financiamento Automotivo",
        color: "#EC0000"
    },
    {
        name: "BV Financeira",
        tag: "Aprovação facilitada para Repasse",
        maxMonths: 60,
        approvalSpeed: "Análise imediata de CPF/CNPJ",
        highlight: "Parceiro especialista em Seminovos",
        color: "#0066CC"
    },
    {
        name: "Itaú Financiamentos",
        tag: "Até 100% financiado para correntistas",
        maxMonths: 60,
        approvalSpeed: "Crédito digital instantâneo",
        highlight: "Primeira parcela para até 90 dias",
        color: "#EC7000"
    },
    {
        name: "Bradesco Financiamentos",
        tag: "Planos especiais para PF e PJ",
        maxMonths: 60,
        approvalSpeed: "Sem burocracia",
        highlight: "Condições diferenciadas p/ lojistas",
        color: "#CC092F"
    },
    {
        name: "Banco PAN",
        tag: "Crédito flexível com entrada reduzida",
        maxMonths: 60,
        approvalSpeed: "Aprovação ágil",
        highlight: "Excelente aceitação de score",
        color: "#0088CC"
    },
    {
        name: "Safra Financeira",
        tag: "Condições exclusivas para veículos premium",
        maxMonths: 60,
        approvalSpeed: "Atendimento corporativo",
        highlight: "Estruturação sob medida",
        color: "#C59B27"
    }
];

const TESTIMONIALS_DATA = [
    {
        name: "Carlos Eduardo Mendes",
        role: "Proprietário de Revenda de Veículos (Lojista)",
        location: "Campinas / SP",
        text: "Trabalho com a Trade Car há mais de 4 anos comprando lotes de repasse para a minha loja. Atendimento extremamente profissional pelo executivo de vendas, o que combinam na negociação é exatamente o que é entregue. Margem excelente e documentação redonda.",
        rating: 5
    },
    {
        name: "Marcos Vinícius Sampaio",
        role: "Comprador de Veículo Seminovo",
        location: "Santos / SP",
        text: "Comprei um Renault Duster na Trade Car com o executivo de vendas. Além de economizar mais de R$ 11.000 em relação à tabela FIPE, o financiamento foi conduzido pela equipe no mesmo dia com uma parcela que coube com folga no meu bolso.",
        rating: 5
    },
    {
        name: "Roberto Silveira Rocha",
        role: "Centro Automotivo & Retífica Rocha",
        location: "São Paulo / SP",
        text: "Compramos motores e caixas de câmbio na Trade Car com frequência. Todas as peças chegam com nota fiscal eletrônica, procedência de leilão/baixa no Detran e garantia real. Parceria de total confiança.",
        rating: 5
    }
];

const FAQS_DATA = [
    {
        question: "O que é um veículo de repasse na Trade Car e quais as vantagens?",
        answer: "O veículo de repasse na Trade Car é um automóvel negociado com valores expressivamente inferiores à Tabela FIPE (geralmente entre 10% e 25% abaixo). É a modalidade mais vantajosa para lojistas que desejam margem de revenda ou compradores finais que buscam economizar dezenas de milhares de reais com total transparência quanto ao estado do veículo."
    },
    {
        question: "Como funciona a entrega para outros estados e cidades?",
        answer: "A Trade Car assessora toda a logística de despacho através de transportadoras parceiras e carretas cegonha credenciadas. O frete e os prazos são cotados sob consulta de acordo com a sua cidade e estado, sempre com seguro total de transporte."
    },
    {
        question: "As peças automotivas possuem nota fiscal e garantia?",
        answer: "Sim! 100% das nossas peças automotivas (motores, câmbios, lataria, componentes elétricos) são comercializadas em total conformidade com a legislação, acompanhadas de Nota Fiscal Eletrônica e documentação de baixa no Detran para cadastro imediato no seu veículo."
    },
    {
        question: "Como funciona o financiamento bancário para os veículos?",
        answer: "Trabalhamos em parceria com as principais financeiras e bancos do mercado. Você pode realizar a simulação estimada diretamente em nosso site e nos enviar a proposta pelo WhatsApp para que nosso executivo de vendas realize a análise cadastral e busque a aprovação das melhores condições."
    },
    {
        question: "Como posso vender ou avaliar meu veículo com a Trade Car?",
        answer: "Basta preencher o formulário 'Envie os Dados do Seu Veículo' em nosso site ou chamar diretamente no WhatsApp (13 99620-2124) com fotos, ano, modelo e valor pretendido. Nossa equipe técnica realiza a análise de mercado e histórico pericial sob consulta para formular a melhor proposta de repasse ou intermediação com segurança."
    }
];

// ==========================================================================
// TRADECAR STORAGE MANAGER (SINCRONIZAÇÃO EM TEMPO REAL)
// ==========================================================================
const DEFAULT_PRESET_TEMPLATES = [
    {
        id: "tpl-1",
        title: "Apresentação & Boas-Vindas",
        category: "Atendimento",
        text: "Olá! Sou executivo de vendas da *Trade Car - Vendas e Repasse*. Seja muito bem-vindo! Como posso te ajudar hoje? Temos oportunidades exclusivas de repasse, seminovos e peças automotivas com procedência garantida."
    },
    {
        id: "tpl-2",
        title: "Envio de Ficha de Carro de Repasse",
        category: "Vendas",
        text: "Olá! Segue a oportunidade disponível em nosso estoque na Trade Car:\n\n🚗 *{veiculo}*\n📅 *Ano/Mod:* {ano}\n🛣️ *KM:* {km}\n💰 *Valor de Repasse:* {preco}\n📊 *Tabela FIPE:* {fipe} ({economia})\n🔍 *Laudo Cautelar:* 100% Aprovado\n\nPodemos agendar sua visita ao pátio ou formalizar a reserva do veículo agora?"
    },
    {
        id: "tpl-3",
        title: "Avaliação de Carro (Sob Consulta / Análise Técnica)",
        category: "Compra/Repasse",
        text: "Olá! Agradecemos o envio das informações do seu veículo para análise na *Trade Car*.\n\nNossa equipe técnica e de perícia já recebeu sua ficha e iniciou o estudo de viabilidade, histórico cautelar e mercado sob consulta.\n\nEsse procedimento leva de 24 a 48 horas úteis para estruturarmos uma negociação segura e justa. Retornaremos com o posicionamento assim que a checagem for concluída!"
    },
    {
        id: "tpl-4",
        title: "Simulação Estimada de Financiamento",
        category: "Financiamento",
        text: "Olá! Recebemos sua simulação aproximada de financiamento na Trade Car:\n\n💰 *Valor do Veículo:* {valor}\n💵 *Entrada Estimada:* {entrada}\n📊 *Plano:* {parcelas}\n\nPara que nosso executivo de vendas faça a análise oficial de crédito junto às financeiras parceiras, por gentileza me envie:\n1) Nome completo\n2) CPF\n3) Data de nascimento\n4) Possui CNH? (Sim/Não)"
    },
    {
        id: "tpl-5",
        title: "Consulta de Peça Automotiva",
        category: "Peças",
        text: "Olá! Recebemos sua solicitação de peça automotiva na *Trade Car Autopeças*.\n\n⚙️ *Item Solicitado:* {peca}\n\nNossas peças acompanham Nota Fiscal Eletrônica, garantia e baixa oficial no Detran. Estamos conferindo o estoque físico no galpão e já retornamos com fotos reais e a cotação do frete sob consulta para sua localidade."
    },
    {
        id: "tpl-6",
        title: "Condições de Atacado para Lojistas",
        category: "Lojistas",
        text: "Olá amigo lojista! Na *Trade Car* somos especialistas em repasse com margem real para revenda e giro acelerado.\n\nTodos os nossos veículos possuem laudo cautelar e documentação pronta para transferência imediata. Você tem interesse em adquirir lote fechado ou unidade avulsa?"
    },
    {
        id: "tpl-7",
        title: "Chave PIX para Sinal de Reserva",
        category: "Financeiro",
        text: "Perfeito! Para garantir a reserva imediata do veículo e suspender os anúncios públicos, solicitamos o envio do comprovante de sinal de reserva:\n\n🏦 *Chave PIX:* 13996202124 (Trade Car)\n\nAssim que o comprovante for enviado, nosso executivo de vendas emitirá o Termo Formal de Reserva do Veículo em seu nome."
    },
    {
        id: "tpl-8",
        title: "Agendamento de Vistoria Presencial",
        category: "Pátio",
        text: "Excelente! Você é nosso convidado para realizar uma vistoria detalhada no veículo em nosso pátio na Baixada Santista.\n\nTrabalhamos com horário pré-agendado para que um de nossos executivos de vendas dedique atenção exclusiva a você e o veículo esteja pronto para demonstração. Qual o melhor dia e horário para você?"
    },
    {
        id: "tpl-9",
        title: "Logística e Frete Sob Consulta",
        category: "Logística",
        text: "Olá! A respeito do envio do veículo para a sua cidade:\n\nA Trade Car assessora todo o transporte via caminhão cegonha e guinchos credenciados com seguro total de carga. O valor e o prazo de entrega são calculados sob consulta conforme sua localidade. Qual o seu CEP ou cidade/estado para cotarmos agora?"
    }
];


const TradeCarStorage={
 vehicles:[],parts:[],
 getVehicles(){return this.vehicles},getParts(){return this.parts},
 async refresh(){
  try{const res=await fetch('/api/catalog');const result=await res.json();if(!res.ok)throw Error();
   COMPANY_CONFIG.whatsappNumber=result.business.whatsapp;COMPANY_CONFIG.hours=result.business.hours;COMPANY_CONFIG.location=result.business.location;
   const safe=v=>typeof v==='string'?v.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])):Array.isArray(v)?v.map(safe):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[k,safe(x)])):v;
   const mapped=result.products.map(p=>{const d=p.data,kind=p.kind;return safe({id:p.id,status:p.status,title:p.title,price:p.price/100,...d,categoryLabel:d.category==='repasse'?'Repasse Lojista':d.category==='seminovos'?'Seminovo':kind==='part'?'Autopeça':'Veículo disponível',fipePrice:d.fipePrice||0,economy:Math.max((d.fipePrice||0)-p.price/100,0),features:d.features||[],specs:d.specs||[],badges:d.badges||[],warranty:d.warranty||'Condições sob consulta',condition:d.condition||'Consulte a equipe',plateEnd:d.plateEnd||'Consultar',images:[d.image,...(d.images||[])].filter(Boolean),laudo:{estrutura:d.inspection||'Consulte o laudo individual',chassi:'Consulte a equipe',motor:'Consulte a equipe',documentacao:d.documentation||'Consulte a documentação individual',origem:'Informação na ficha do veículo'}})});
   this.vehicles=mapped.filter(p=>result.products.find(x=>x.id===p.id)?.kind==='vehicle');this.parts=mapped.filter(p=>result.products.find(x=>x.id===p.id)?.kind==='part');
   window.dispatchEvent(new CustomEvent('tradecar_stock_updated'));
  }catch{this.vehicles=[];this.parts=[];window.dispatchEvent(new CustomEvent('tradecar_stock_updated'));}
 }
};
TradeCarStorage.refresh();setInterval(()=>TradeCarStorage.refresh(),60000);
