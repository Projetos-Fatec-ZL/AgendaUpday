document.addEventListener("DOMContentLoaded", function() {

    // --- Configurações e Variáveis Globais ---
    const API_BASE_URL = 'http://localhost:5000/api';
    let todosOsEventos = [];

    // --- Elementos do DOM EXISTENTES ---
    const previewList = document.getElementById("event-list-preview");
    const completedTodaySpan = document.getElementById("completed-today");
    const totalEventsSpan = document.querySelector('.stat-card.blue .card-value');
    const plansCountSpan = document.querySelector('.stat-card.purple .card-value');
    const greetingSpan = document.querySelector('.greeting');
    const logoutBtn = document.getElementById('logout-btn');

    // Elementos de Modais
    const modalOverlay = document.getElementById("modal-overlay"); // Modal "Ver Todos"
    const viewAllBtn = document.getElementById("view-all-btn");
    const modalList = document.getElementById("modal-event-list");
    const upcomingList = document.querySelector(".upcoming-list");

    // Elementos do DOM para gráficos
const chartsModal = document.getElementById('charts-modal');
const chartsBtn = document.getElementById('charts-btn');
const closeChartsModalBtn = document.getElementById('close-charts-modal-btn');
const filterBtns = document.querySelectorAll('.filter-btn');

    // Modal de Criação/Edição
    const modalAddEvento = document.getElementById('novoEventoModal');
    const openModalBtn = document.getElementById('add-event-btn');
    const closeAddModalBtn = document.getElementById('btnFecharModal');
    const createEventForm = document.getElementById("createEventForm");
    const modalTitle = modalAddEvento.querySelector('h2');
    const submitButton = modalAddEvento.querySelector('.create-event-btn');


    // Variável para armazenar o ID do evento em modo de edição
    let currentEditingEventId = null;

    // --- NOVO: Elementos de Tema e Configurações ---
    const body = document.body;
    const themeToggleBtn = document.getElementById('theme-toggle-btn'); // Botão no Header
    const settingsBtn = document.getElementById('settings-btn'); // Botão no Header
    const settingsModal = document.getElementById('settings-modal'); // Modal de Configurações
    const closeSettingsModalBtn = document.getElementById('close-settings-modal-btn'); // Botão fechar dentro do Modal
    const themeToggleModalBtn = document.getElementById('theme-toggle-modal-btn');
    const highContrastSwitch = document.getElementById('high-contrast-switch'); // Switch Alto Contraste
    const darkModeSwitch = document.getElementById('dark-mode-switch'); // Switch Dark Mode
    const decreaseFontBtn = document.getElementById('font-size-decrease');
    const increaseFontBtn = document.getElementById('font-size-increase');

     // Variáveis de Acessibilidade
    const FONT_STORAGE_KEY = 'fontSizeAdjustmentFactor';
    // Define o "passo" de ajuste (1.1 = 10% por clique)
    const ADJUSTMENT_STEP = 1.1;

    // =============================================
// CONTROLE DO MODAL DE GRÁFICOS
// =============================================
// Dados de exemplo
const dadosAgenda = {
    eventos: {
        concluidos: 15,
        pendentes: 8,
        cancelados: 2
    },
    categorias: {
        estudo: 5,
        trabalho: 8,
        pessoal: 7,
        prova: 2,
        sono: 4,
        exercicio: 3,
        evento: 1
    },
    prioridades: {
        alta: 6,
        media: 12,
        baixa: 7
    },
    progressoSemanal: [5, 8, 3, 10, 6, 9, 4] // Segunda a Domingo
};

// Variáveis para armazenar as instâncias dos gráficos
let statusChart, categoryChart, progressChart, priorityChart;

// Abrir modal de gráficos
if (chartsBtn) {
    chartsBtn.addEventListener('click', () => {
        console.log('Abrindo modal de gráficos...');
        chartsModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        inicializarGraficos();
    });
}

// Fechar modal de gráficos
if (closeChartsModalBtn) {
    closeChartsModalBtn.addEventListener('click', () => {
        chartsModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    });
}

// Fechar modal clicando fora
if (chartsModal) {
    chartsModal.addEventListener('click', (event) => {
        if (event.target === chartsModal) {
            chartsModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
}

// Fechar com ESC
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && chartsModal.style.display === 'flex') {
        chartsModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
});

// Filtros de período
if (filterBtns.length > 0) {
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active de todos
            filterBtns.forEach(b => b.classList.remove('active'));
            // Adiciona active no clicado
            btn.classList.add('active');
            
            const periodo = btn.dataset.period;
            atualizarGraficos(periodo);
        });
    });
}

// Inicializar todos os gráficos
function inicializarGraficos() {
    criarGraficoStatus();
    criarGraficoCategorias();
    criarGraficoProgresso();
    criarGraficoPrioridades();
}

// Gráfico de Status dos Eventos
function criarGraficoStatus() {
    const ctx = document.getElementById('events-status-chart');
    if (!ctx) return;
    
    // Destruir gráfico existente se houver
    if (statusChart) {
        statusChart.destroy();
    }
    
    statusChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Concluídos', 'Pendentes', 'Cancelados'],
            datasets: [{
                label: 'Quantidade',
                data: [
                    dadosAgenda.eventos.concluidos,
                    dadosAgenda.eventos.pendentes,
                    dadosAgenda.eventos.cancelados
                ],
                backgroundColor: [
                    '#28a745',
                    '#ffc107',
                    '#dc3545'
                ],
                borderColor: [
                    '#218838',
                    '#e0a800',
                    '#c82333'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${context.raw} eventos`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// Gráfico de Categorias
function criarGraficoCategorias() {
    const ctx = document.getElementById('events-category-chart');
    if (!ctx) return;
    
    if (categoryChart) {
        categoryChart.destroy();
    }
    
    categoryChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Estudo', 'Trabalho', 'Pessoal', 'Prova', 'Sono', 'Exercício', 'Evento'],
            datasets: [{
                label: 'Quantidade',
                data: [
                    dadosAgenda.categorias.estudo,
                    dadosAgenda.categorias.trabalho,
                    dadosAgenda.categorias.pessoal,
                    dadosAgenda.categorias.prova,
                    dadosAgenda.categorias.sono,
                    dadosAgenda.categorias.exercicio,
                    dadosAgenda.categorias.evento
                ],
                backgroundColor: [
                    '#007bff',
                    '#6f42c1',
                    '#e83e8c',
                    '#fd7e14',
                    '#17a2b8',
                    '#20c997',
                    '#ffc107'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// Gráfico de Progresso Semanal
function criarGraficoProgresso() {
    const ctx = document.getElementById('weekly-progress-chart');
    if (!ctx) return;
    
    if (progressChart) {
        progressChart.destroy();
    }
    
    progressChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
            datasets: [{
                label: 'Eventos Concluídos',
                data: dadosAgenda.progressoSemanal,
                backgroundColor: '#17a2b8',
                borderColor: '#138496',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// Gráfico de Prioridades
function criarGraficoPrioridades() {
    const ctx = document.getElementById('priority-chart');
    if (!ctx) return;
    
    if (priorityChart) {
        priorityChart.destroy();
    }
    
    priorityChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Alta', 'Média', 'Baixa'],
            datasets: [{
                label: 'Quantidade',
                data: [
                    dadosAgenda.prioridades.alta,
                    dadosAgenda.prioridades.media,
                    dadosAgenda.prioridades.baixa
                ],
                backgroundColor: [
                    '#dc3545',
                    '#ffc107',
                    '#28a745'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// Atualizar gráficos baseado no período selecionado
function atualizarGraficos(periodo) {
    console.log(`Atualizando gráficos para: ${periodo}`);
    
    // Simulando dados diferentes para cada período
    let novosDados = {};
    
    switch(periodo) {
        case 'day':
            novosDados = {
                eventos: { concluidos: 3, pendentes: 2, cancelados: 0 },
                categorias: { estudo: 1, trabalho: 2, pessoal: 1, prova: 0, sono: 1, exercicio: 0, evento: 0 },
                prioridades: { alta: 1, media: 3, baixa: 1 },
                progressoSemanal: [1, 2, 1, 3, 2, 1, 0]
            };
            break;
        case 'week':
            novosDados = {
                eventos: { concluidos: 15, pendentes: 8, cancelados: 2 },
                categorias: { estudo: 5, trabalho: 8, pessoal: 7, prova: 2, sono: 4, exercicio: 3, evento: 1 },
                prioridades: { alta: 6, media: 12, baixa: 7 },
                progressoSemanal: [5, 8, 3, 10, 6, 9, 4]
            };
            break;
        case 'month':
            novosDados = {
                eventos: { concluidos: 45, pendentes: 25, cancelados: 5 },
                categorias: { estudo: 15, trabalho: 25, pessoal: 20, prova: 8, sono: 12, exercicio: 10, evento: 5 },
                prioridades: { alta: 18, media: 35, baixa: 22 },
                progressoSemanal: [20, 25, 18, 30, 22, 15, 10]
            };
            break;
    }
    
    // Atualizar dados
    Object.assign(dadosAgenda, novosDados);
    
    // Recriar gráficos com novos dados
    criarGraficoStatus();
    criarGraficoCategorias();
    criarGraficoProgresso();
    criarGraficoPrioridades();
}

// Inicializar sistema de gráficos quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    console.log('Sistema de gráficos carregado!');
    
    // Verificar se os elementos existem
    if (chartsBtn) {
        console.log('Botão de gráficos encontrado!');
    } else {
        console.error('Botão de gráficos não encontrado!');
    }
    
    if (chartsModal) {
        console.log('Modal de gráficos encontrado!');
    } else {
        console.error('Modal de gráficos não encontrado!');
    }
});

    // --- FUNÇÕES DE UTILIDADE ---

    function showFeedback(message, type = 'info') {
        console.log(`[${type.toUpperCase()}]: ${message}`);
    }

    // 1. Gerenciamento de Token/Autenticação
    const getToken = () => localStorage.getItem('x-auth-token');

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('x-auth-token');
            showFeedback("Você saiu da sua conta.", 'info');
            window.location.href = 'login.html';
        });
    }

    // Função auxiliar para formatar datas no padrão yyyy-MM-ddThh:mm (para input datetime-local)
    function formatToDatetimeLocal(isoString) {
        if (!isoString) return '';
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return '';
        
        // Pega o fuso horário local e formata para o input
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hour = String(date.getHours()).padStart(2, '0');
        const minute = String(date.getMinutes()).padStart(2, '0');

        return `${year}-${month}-${day}T${hour}:${minute}`;
    }

    // 2. Fetch para o Nome do Usuário
    async function fetchUserName() {
        const token = getToken();
        if (!token) return;

        try {
            const response = await fetch(`${API_BASE_URL}/auth`, {
                method: 'GET',
                headers: { 'x-auth-token': token }
            });

            if (response.ok) {
                const user = await response.json();
                if (greetingSpan) greetingSpan.textContent = `Olá, ${user.name}!`;
            }
        } catch (error) {
            console.error('Erro de conexão ao buscar usuário:', error);
        }
    }

    // 3. Atualiza os Cards
    function updateStats() {
        // Garante que o evento está marcado como 'completed' no objeto local, que vem da API como 'isCompleted'
        const activeEvents = todosOsEventos.filter(event => !event.isCompleted);

        if (totalEventsSpan) totalEventsSpan.textContent = todosOsEventos.length;

        // Contar concluídos (usando isCompleted, que é o nome correto da API)
        const completedCount = todosOsEventos.filter(event => event.isCompleted).length;
        if (completedTodaySpan) completedTodaySpan.textContent = completedCount;
        
        // Contar planos ativos
        const plansCount = activeEvents.filter(event => event.category === 'estudo').length;
        if (plansCountSpan) plansCountSpan.textContent = plansCount;
    }

    // 4. Cria o HTML do Item do Evento (Incluindo Botões de Ação)
    function createEventItemHTML(event) {
        let displayTime = '';
        try {
            // Se for concluído, mostra a data de conclusão, senão, a data prevista
            const dateToDisplay = event.isCompleted && event.completedAt ? event.completedAt : event.date;

            const dateObj = new Date(dateToDisplay);
            displayTime = dateObj.toLocaleDateString('pt-BR', { 
                day: 'numeric', 
                month: 'long', 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            
            if (event.isCompleted) {
                displayTime = `Concluído em: ${displayTime}`;
            }

        } catch (e) {
            displayTime = 'Data inválida'; 
        }
        
        const isCompleted = event.isCompleted; 
        // Usamos ícones diferentes para Toggle (check vs undo)
        const iconContent = isCompleted ? '<i class="fas fa-undo"></i>' : '<i class="fas fa-check"></i>'; 
        const iconBgClass = isCompleted ? 'completed-toggle' : 'pending-toggle'; // Nova classe para o toggle
        const titleClass = isCompleted ? 'feito' : ''; 
        
        return `
            <div class="event-item ${isCompleted ? 'completed-item' : ''}" data-event-id="${event._id}">
                <div class="event-details-main">
                    <div class="event-icon ${iconBgClass}" role="button" data-event-id="${event._id}" data-action="toggle">
                        ${iconContent}
                    </div>
                    <div class="event-details">
                        <span class="event-title ${titleClass}">${event.title}</span>
                        <span class="event-time">${displayTime} - Duração: ${event.duration || '?'} min</span>
                    </div>
                </div>
                <div class="event-actions">
                    <button class="action-btn edit-btn" data-event-id="${event._id}" data-action="edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" data-event-id="${event._id}" data-action="delete">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
        `;
    }

    // 5. Popula as Listas e Adiciona Listeners de Ação
    function populateLists() {
        // Ordena: ativos (pela data) e concluídos (do mais recente para o mais antigo, se possível, senão no final)
        todosOsEventos.sort((a, b) => {
            if (a.isCompleted !== b.isCompleted) {
                return a.isCompleted ? 1 : -1; // Coloca concluídos no final
            }
            // Se ambos têm o mesmo status (ambos ativos ou ambos concluídos), ordena por data
            return new Date(a.date) - new Date(b.date);
        });
        
        // --- Lógica de Filtragem ---
        const now = new Date();
        
        // Filtra para obter apenas eventos futuros E NÃO CONCLUÍDOS
        const upcomingEvents = todosOsEventos
            .filter(event => 
                !event.isCompleted && // Filtro CRUCIAL: Exclui eventos concluídos!
                new Date(event.date) >= now
            )
            .slice(0, 5); // Limita aos 5 próximos
        
        
        // --- POPULAR AS SEÇÕES NA DASHBOARD ---
        
        // Popula Preview (Lista "Todos os Eventos" na Dashboard) - MOSTRA TODOS!
        if (previewList) {
            // Agora usamos todosOsEventos. O evento concluído aparecerá riscado graças ao createEventItemHTML.
            previewList.innerHTML = todosOsEventos.slice(0, 5).map(createEventItemHTML).join('');
        }
        
        // Popula Modal "Ver Todos" - MOSTRA TODOS!
        if (modalList) {
            modalList.innerHTML = todosOsEventos.map(createEventItemHTML).join('');
        }
        
        // Popula Próximos Eventos - MOSTRA APENAS OS FILTRADOS (FUTUROS e ATIVOS)
        if (upcomingList) {
            if (upcomingEvents.length > 0) {
                upcomingList.innerHTML = upcomingEvents.map(createEventItemHTML).join('');
            } else {
                upcomingList.innerHTML = '<p class="text-center text-gray-500 py-4"> Nenhum evento futuro na agenda. </p>';
            }
        }
        
        // Exibir/Ocultar botão "Ver Todos"
        if (viewAllBtn) {
            viewAllBtn.style.display = todosOsEventos.length > 5 ? "block" : "none";
        }
        
        // Adiciona Listeners de Ação APÓS o HTML ser gerado
        addEventActionListeners();
    }
    
    // 6. Funções de Manipulação de Eventos (DELETE, PUT, TOGGLE)

    // A. Excluir Evento (DELETE /api/events/:id)
    async function deleteEvent(eventId) {
        const token = getToken();
        try {
            const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
                method: 'DELETE',
                headers: { 'x-auth-token': token }
            });

            if (response.ok) {
                showFeedback("🗑️ Evento excluído com sucesso!", 'success');
                fetchEventsAndPopulate();
            } else {
                const errorData = await response.json();
                showFeedback(`❌ Falha ao excluir. Mensagem: ${errorData.msg || "Erro desconhecido"}`, 'error');
            }
        } catch (error) {
            console.error('Erro de rede ao excluir:', error);
            showFeedback("❌ Erro de rede ou servidor.", 'error');
        }
    }
    
    // B. Alternar status Concluído (PUT /api/events/:id/toggle-completed)
    async function toggleCompleted(event) {
        const eventId = event._id;

        const token = getToken();
        // ** ROTA CORRETA DA API: /api/events/:id/toggle-completed **
        const url = `${API_BASE_URL}/events/${eventId}/toggle-completed`;
        
        try {
            const response = await fetch(url, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-auth-token': token 
                },
            });
            
            if (response.ok) {
                const updatedEvent = await response.json();
                const msg = updatedEvent.isCompleted ? 
                    `🎉 Evento "${updatedEvent.title}" concluído!` : 
                    `↩️ Evento "${updatedEvent.title}" reaberto.`;

                showFeedback(msg, 'success');
                fetchEventsAndPopulate(); // Recarrega a lista para atualizar o estado
            } else {
                const errorData = await response.json();
                showFeedback(`❌ Falha ao alterar status. Mensagem: ${errorData.msg || "Erro desconhecido"}`, 'error');
            }
        } catch (error) {
            console.error('Erro de rede ao alternar status:', error);
            showFeedback("❌ Erro de rede ou servidor.", 'error');
        }
    }
    
    // C. Abrir Modal para Edição
    function openEditModal(eventId) {
        const event = todosOsEventos.find(e => e._id === eventId);
        if (!event) return showFeedback("Evento não encontrado para edição.", 'error');

        // 1. Configurar Modal para EDIÇÃO
        currentEditingEventId = eventId;
        modalTitle.textContent = "Editar Evento";
        submitButton.textContent = "Salvar Alterações";
        
        // 2. Preencher formulário com dados existentes
        document.getElementById("titulo").value = event.title;
        document.getElementById("descricao").value = event.description || '';
        document.getElementById("tipo").value = event.category; 
        document.getElementById("prioridade").value = event.priority;
        document.getElementById("duracao").value = event.duration;
        
        // Preencher Data e Hora: Usa a função auxiliar para o formato 'yyyy-MM-ddThh:mm'
        document.getElementById("dataHora").value = formatToDatetimeLocal(event.date); 

        // 3. Abrir o modal
        modalAddEvento.style.display = 'flex';
    }


    // 7. Event Listener Central para Ações (Delete, Edit, Toggle)
    function addEventActionListeners() {
        // Target: Onde o evento está acontecendo (pode ser o preview ou o modal)
        const allEventsContainers = [previewList, modalList, upcomingList];
        
        allEventsContainers.forEach(container => {
            if (!container) return; 

            // Remove listeners antigos para evitar duplicação (importante)
            container.onclick = null; 

            // Usa delegação de eventos nos containers para garantir que botões dinâmicos funcionem
            container.onclick = function(e) {
                let target = e.target;
                // Procura o elemento pai com data-action, garantindo que o clique em um <i> interno funcione
                while (target && !target.dataset.action && target !== container) {
                    target = target.parentElement;
                }

                if (target && target.dataset.action) {
                    const action = target.dataset.action;
                    const eventId = target.dataset.eventId;
                    const event = todosOsEventos.find(e => e._id === eventId);

                    if (!event) return;

                    switch (action) {
                        case 'toggle':
                            toggleCompleted(event); 
                            break;
                        case 'edit':
                            openEditModal(eventId);
                            break;
                        case 'delete':
                            deleteEvent(eventId);
                            break;
                    }
                }
            };
        });
    }

    // 8. Busca Eventos e Popula
    async function fetchEventsAndPopulate() {
        const token = getToken();
        if (!token) {
            window.location.href = 'login.html';
            return; 
        } 

        try {
            // NOTE: O backend agora retorna o campo 'isCompleted', não 'completed'.
            const response = await fetch(`${API_BASE_URL}/events`, {
                method: 'GET',
                headers: { 'x-auth-token': token }
            });

            if (response.ok) {
                // Mapeia para garantir compatibilidade se a propriedade 'completed' for usada no front
                todosOsEventos = (await response.json()).map(event => ({
                    ...event,
                    completed: event.isCompleted // Garante retrocompatibilidade com o front
                })); 
            } else {
                todosOsEventos = []; 
                console.error('Falha ao buscar eventos. Status:', response.status);
                if (response.status === 401) {
                    showFeedback("Sessão expirada. Faça login novamente.", 'error');
                    localStorage.removeItem('x-auth-token');
                    window.location.href = 'login.html';
                }
            }
            
            populateLists(); 
            updateStats(); 
            
        } catch (error) {
            todosOsEventos = [];
            populateLists(); 
            updateStats(); 
            console.error('Erro de rede ao buscar eventos:', error);
            showFeedback("Erro de rede ao buscar eventos. Verifique se o servidor está online.", 'error');
        }
    }


    // ------------------------------------------------
    // --- LÓGICA DE TEMA E CONFIGURAÇÕES ---
    // ------------------------------------------------

    // ------------------------------------
    // LÓGICA DE DARK MODE (EXISTENTE)
    // ------------------------------------
    function toggleTheme() {
        // Alterna a classe 'dark-mode' no elemento body
        body.classList.toggle('dark-mode');

        // Salva a preferência no Local Storage para persistência
        const isDarkMode = body.classList.contains('dark-mode');
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');

        // O ícone sempre deve mostrar o modo *para o qual* o usuário pode mudar.
        const newIconClass = isDarkMode ? 'fa-sun' : 'fa-moon'; 
        
        // Atualiza o ícone do botão do header
        if (themeToggleBtn) {
             themeToggleBtn.querySelector('i').className = `fas ${newIconClass}`;
        }
        
        // Atualiza o ícone/texto do botão dentro do modal de configurações
        if (themeToggleModalBtn) {
             themeToggleModalBtn.querySelector('i').className = `fas ${newIconClass}`;
        }
        
        // Sincroniza o switch no modal de configurações
        if (darkModeSwitch) {
            darkModeSwitch.checked = isDarkMode;
        }
    }

    // Função para aplicar o tema salvo na inicialização
    function applySavedTheme() {
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        let shouldBeDark = false;

        // Prioriza o tema salvo, se não houver, usa a preferência do sistema
        if (savedTheme === 'dark') {
            shouldBeDark = true;
        } else if (savedTheme === null && prefersDark) {
            shouldBeDark = true;
        }

        if (shouldBeDark) {
            body.classList.add('dark-mode');
        }
        
        // Ajuste o ícone inicial no carregamento
        if (themeToggleBtn) {
            const isCurrentlyDark = body.classList.contains('dark-mode');
            const initialIconClass = isCurrentlyDark ? 'fa-sun' : 'fa-moon'; // Se está dark, mostra sol (para ir para light)
            themeToggleBtn.querySelector('i').className = `fas ${initialIconClass}`;
        }
        
        // Sincroniza o switch do modal de configurações na inicialização
        if (darkModeSwitch) {
            darkModeSwitch.checked = body.classList.contains('dark-mode');
            // Adiciona listener para o switch, que também deve chamar o toggleTheme
            darkModeSwitch.addEventListener('change', toggleTheme);
        }
    }
    
    // ------------------------------------
    // LÓGICA DE ALTO CONTRASTE (NOVA) 🌟
    // ------------------------------------

    /**
     * Alterna a classe 'high-contrast' no body e salva a preferência.
     */
    function toggleHighContrast() {
        // Alterna a classe CSS que aplica o alto contraste
        body.classList.toggle('high-contrast');

        // Salva o estado no Local Storage
        const isHighContrast = body.classList.contains('high-contrast');
        localStorage.setItem('high-contrast', isHighContrast ? 'on' : 'off');
        
        // Se o modo de Alto Contraste for ativado, ele deve desativar o Dark Mode.
        if (isHighContrast && body.classList.contains('dark-mode')) {
            // Desativa Dark Mode e atualiza o estado
            body.classList.remove('dark-mode');
            localStorage.setItem('theme', 'light');
            
            // Atualiza visualmente o toggle do Dark Mode e ícones
            if (darkModeSwitch) darkModeSwitch.checked = false;
            
            // Chama o toggleTheme para reverter os ícones e salvar 'light' (apenas para atualizar o ícone)
            // Se já não estiver dark, ele não fará nada além de atualizar o ícone
            if (themeToggleBtn) toggleTheme(); 
        }
        
        // Sincroniza o switch do modal de configurações
        if (highContrastSwitch) highContrastSwitch.checked = isHighContrast;
    }

    /**
     * Aplica o estado de Alto Contraste salvo no Local Storage na inicialização.
     */
    function applySavedContrast() {
        const savedContrast = localStorage.getItem('high-contrast');
        
        if (savedContrast === 'on') {
            body.classList.add('high-contrast');
            // Garante que o switch no modal de configurações esteja marcado corretamente
            if (highContrastSwitch) {
                highContrastSwitch.checked = true;
            }
            // Se o Alto Contraste for carregado, desativa o Dark Mode, se estiver ativo.
            if (body.classList.contains('dark-mode')) {
                body.classList.remove('dark-mode');
                localStorage.setItem('theme', 'light');
                // Chamamos a lógica do tema para garantir que os ícones reflitam o novo estado 'light'
                applySavedTheme(); 
            }
        } else if (highContrastSwitch) {
            // Garante que o switch esteja desmarcado se a preferência for 'off' ou nula
            highContrastSwitch.checked = false;
        }
    }

    // Listener para o switch de Alto Contraste
    if (highContrastSwitch) {
        highContrastSwitch.addEventListener('change', toggleHighContrast);
    }
    
    // Listener para o botão de Tema no Header
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', toggleTheme);
    }
    
    // Listener para o botão de Tema dentro do Modal (se existir)
    if (themeToggleModalBtn) {
        themeToggleModalBtn.addEventListener('click', toggleTheme);
    }

    // Listener para o botão de Configurações no Header (Abre o Modal)
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            if (settingsModal) {
                // Atualiza o estado dos switches antes de abrir
                if (highContrastSwitch) highContrastSwitch.checked = body.classList.contains('high-contrast');
                if (darkModeSwitch) darkModeSwitch.checked = body.classList.contains('dark-mode');

                settingsModal.style.display = 'flex';
            }
        });
    }

    // Listener para o botão de Fechar no Modal de Configurações
    if (closeSettingsModalBtn) {
        closeSettingsModalBtn.addEventListener('click', () => {
            if (settingsModal) {
                settingsModal.style.display = 'none';
            }
        });
    }

    // Fechar Modal de Configurações clicando no fundo (backdrop)
    if (settingsModal) {
        settingsModal.onclick = function(event) {
            if (event.target === settingsModal) {
                settingsModal.style.display = 'none';
            }
        }
    }


    // --- Lógica de Modais (Criação/Visualização) ---

    // Abre o Modal (Modo CRIAÇÃO)
    if (openModalBtn) {
        openModalBtn.onclick = function() {
            currentEditingEventId = null;
            modalTitle.textContent = "Criar Novo Evento";
            submitButton.textContent = "Criar Evento";
            createEventForm.reset();
            modalAddEvento.style.display = 'flex';
        }
    }
    
    // Abre o Modal de Visualização de Todos (modal-overlay)
    if (viewAllBtn) {
        viewAllBtn.onclick = function(e) {
            e.preventDefault();
            modalOverlay.classList.remove('hidden');
        }
    }

    // Fecha o Modal de Criação/Edição
    if (closeAddModalBtn) closeAddModalBtn.onclick = function() { modalAddEvento.style.display = 'none'; }
    if (modalAddEvento) {
        modalAddEvento.onclick = function(event) {
            if (event.target === modalAddEvento) { modalAddEvento.style.display = 'none'; }
        }
    }
    
    // Fecha o Modal "Ver Todos" (modal-overlay)
    if (document.getElementById("close-modal-btn")) {
          document.getElementById("close-modal-btn").onclick = function() {
              modalOverlay.classList.add('hidden');
          }
    }
    if (modalOverlay) {
        modalOverlay.onclick = function(event) {
            if (event.target === modalOverlay) { 
                modalOverlay.classList.add('hidden'); 
            }
        }
    }

    // Submit do Formulário (Criação ou Edição)
    if (createEventForm) {
        createEventForm.addEventListener("submit", async function(e) {
            e.preventDefault();
            
            // Coleta de dados
            const title = document.getElementById("titulo").value;
            const description = document.getElementById("descricao").value;
            const type = document.getElementById("tipo").value;
            const priority = document.getElementById("prioridade").value;
            const dateInput = document.getElementById("dataHora").value; // Formato yyyy-MM-ddThh:mm
            const duration = document.getElementById("duracao").value;

            // Validação de Frontend (opcional, mas bom)
            if (!title || !dateInput || !duration) {
                showFeedback("Por favor, preencha o Título, Data e Duração.", 'error');
                return;
            }

            // 🌟 CORREÇÃO CRÍTICA PARA NOTIFICAÇÕES 🌟
            // Converte o formato local YYYY-MM-DDTHH:MM (do input) para uma ISO String (UTC/Zulu Time).
            // Isso garante que o MongoDB salve o timestamp correto e que o script de notificação
            // consiga comparar a data com precisão.
            const localDate = new Date(dateInput); 
            const isoDateString = localDate.toISOString(); 
            // ---------------------------------------------
            

            // Estrutura de dados para o Backend
            const eventData = {
                title,
                description,
                date: isoDateString, // AGORA ESTÁ NO FORMATO ISO PADRONIZADO
                category: type, 
                priority,
                duration: parseInt(duration),
            };
            
            const token = getToken(); 
            if (!token) { showFeedback("❌ Erro de Autenticação.", 'error'); return; }

            // Decide se é POST (Criação) ou PUT (Edição)
            const isEditing = currentEditingEventId !== null;
            const url = isEditing ? `${API_BASE_URL}/events/${currentEditingEventId}` : `${API_BASE_URL}/events`;
            const method = isEditing ? 'PUT' : 'POST';
            const successMsg = isEditing ? "✅ Evento atualizado com sucesso!" : "🎉 Evento criado com sucesso!";
            // Nota: O status 200 é esperado para PUT/edição, e 201 para POST/criação.
            const statusTarget = isEditing ? 200 : 201; 

            try {
                const response = await fetch(url, { 
                    method: method,
                    headers: {
                        'Content-Type': 'application/json',
                        'x-auth-token': token 
                    },
                    body: JSON.stringify(eventData)
                });
                
                if (response.status === statusTarget) {
                    showFeedback(successMsg, 'success');
                    
                    modalAddEvento.style.display = 'none'; 
                    createEventForm.reset(); 
                    currentEditingEventId = null; // Zera o modo edição

                    fetchEventsAndPopulate(); // Recarrega a lista
                } else {
                    const errorData = await response.json();
                    
                    console.error('Detalhes do Erro do Backend:', errorData);

                    showFeedback(`❌ Falha ao processar evento. Mensagem: ${errorData.msg || "Erro de servidor (verifique o console para detalhes)"}`, 'error');
                }

            } catch (error) {
                console.error('Erro de conexão ou requisição:', error);
                showFeedback("❌ Erro de rede ou servidor. Servidor offline?", 'error');
            }
        });
    }

    // --- Funções de Acessibilidade de Fonte ---

    // Função 1: Aplica o fator de escala na raiz (<html>) e Salva
    function applyFontSize(factor) {
        document.documentElement.style.fontSize = `${factor * 100}%`; 
        localStorage.setItem(FONT_STORAGE_KEY, factor.toString());
    }

    // Função 2: Carrega o fator salvo ao iniciar a página
    function loadSavedFontSize() {
        let savedFactor = localStorage.getItem(FONT_STORAGE_KEY);
        if (savedFactor) {
            applyFontSize(parseFloat(savedFactor));
        } else {
            applyFontSize(1.0); // Padrão 100%
        }
    }
    // --- Inicialização da Dashboard ---

    loadSavedFontSize(); // ✅ Carrega o tamanho salvo ao iniciar a página

    // ✅ Listeners para Aumentar e Diminuir
    if (decreaseFontBtn && increaseFontBtn) {
        
        // Listener para DIMINUIR
        decreaseFontBtn.addEventListener('click', () => {
            let currentFactor = parseFloat(localStorage.getItem(FONT_STORAGE_KEY)) || 1.0;
            
            // Diminui 10%, com limite mínimo de 80% (0.8)
            let newFactor = Math.max(0.8, currentFactor / ADJUSTMENT_STEP);
            
            applyFontSize(newFactor);
        });

        // Listener para AUMENTAR
        increaseFontBtn.addEventListener('click', () => {
            let currentFactor = parseFloat(localStorage.getItem(FONT_STORAGE_KEY)) || 1.0;

            // Aumenta 10%, com limite máximo de 130% (1.3)
            let newFactor = Math.min(1.3, currentFactor * ADJUSTMENT_STEP);

            applyFontSize(newFactor);
        });
    }


    // --- Inicialização da Dashboard ---
    applySavedTheme(); // Aplica o tema salvo (ou padrão)
    applySavedContrast(); // 🌟 NOVO: Aplica o contraste salvo 🌟
    fetchUserName();
    fetchEventsAndPopulate();
});