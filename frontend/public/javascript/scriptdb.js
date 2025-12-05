document.addEventListener("DOMContentLoaded", function() {

    // --- Configurações e Variáveis Globais ---
    const API_BASE_URL = 'http://localhost:5000/api';
    const METRICS_API_URL = `${API_BASE_URL}/events/metrics`; // ✅ NOVO ENDPOINT DE MÉTRICAS
    let todosOsEventos = [];
    let pieChart = null; // ✅ Variável global para a instância do gráfico
    
    // ✅ Cores para as Categorias (Chart.js)
    const CATEGORY_COLORS = {
        'estudo': 'rgb(75, 192, 192)', 
        'trabalho': 'rgb(255, 99, 132)', 
        'pessoal': 'rgb(54, 162, 235)', 
        'prova': 'rgb(255, 159, 64)', 
        'sono': 'rgb(153, 102, 255)', 
        'exercicio': 'rgb(152, 216, 172)', 
        'evento': 'rgb(255, 205, 86)', 
        'outros': 'rgb(201, 203, 207)'
    };


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

    // Modal de Criação/Edição
    const modalAddEvento = document.getElementById('novoEventoModal');
    const openModalBtn = document.getElementById('add-event-btn');
    const closeAddModalBtn = document.getElementById('btnFecharModal');
    const createEventForm = document.getElementById("createEventForm");
    const modalTitle = modalAddEvento.querySelector('h2');
    const submitButton = modalAddEvento.querySelector('.create-event-btn');

    // Variável para armazenar o ID do evento em modo de edição
    let currentEditingEventId = null;

    // --- NOVO: Elementos DOM para o Gráfico ---
    const statusFilter = document.getElementById('status-filter');
    const timeframeFilter = document.getElementById('timeframe-filter');
    const chartCanvas = document.getElementById('category-pie-chart');
    const chartMessage = document.getElementById('chart-message');
    

    // --- NOVO: Elementos de Tema e Configurações ---
    const body = document.body;
    const themeToggleBtn = document.getElementById('theme-toggle-btn'); // Botão no Header
    const settingsBtn = document.getElementById('settings-btn'); // Botão no Header
    const settingsModal = document.getElementById('settings-modal'); // Modal de Configurações
    const closeSettingsModalBtn = document.getElementById('close-settings-modal-btn'); // Botão fechar dentro do Modal
    const themeToggleModalBtn = document.getElementById('theme-toggle-modal-btn');
    const highContrastSwitch = document.getElementById('high-contrast-switch'); // Switch Alto Contraste
    // NOTA: O elemento 'dark-mode-switch' não existe no HTML fornecido, usando apenas os botões/toggle.
    // const darkModeSwitch = document.getElementById('dark-mode-switch'); // Switch Dark Mode
    const decreaseFontBtn = document.getElementById('font-size-decrease');
    const increaseFontBtn = document.getElementById('font-size-increase');
    
    // Variáveis de Acessibilidade
    const FONT_STORAGE_KEY = 'fontSizeAdjustmentFactor';
    const ADJUSTMENT_STEP = 1.1;

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
        const activeEvents = todosOsEventos.filter(event => !event.isCompleted);

        if (totalEventsSpan) totalEventsSpan.textContent = todosOsEventos.length;

        const completedCount = todosOsEventos.filter(event => event.isCompleted).length;
        if (completedTodaySpan) completedTodaySpan.textContent = completedCount;
        
        const plansCount = activeEvents.filter(event => event.category === 'estudo').length;
        if (plansCountSpan) plansCountSpan.textContent = plansCount;
    }

    // 4. Cria o HTML do Item do Evento (Incluindo Botões de Ação)
    function createEventItemHTML(event) {
        let displayTime = '';
        try {
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
        const iconContent = isCompleted ? '<i class="fas fa-undo"></i>' : '<i class="fas fa-check"></i>'; 
        const iconBgClass = isCompleted ? 'completed-toggle' : 'pending-toggle'; 
        const titleClass = isCompleted ? 'feito' : ''; 
        
        return `
            <div class="event-item ${isCompleted ? 'completed-item' : ''}" data-event-id="${event._id}">
                <div class="event-details-main">
                    <div class="event-icon ${iconBgClass}" role="button" data-event-id="${event._id}" data-action="toggle">
                        ${iconContent}
                    </div>
                    <div class="event-details">
                        <span class="event-title ${titleClass}">${event.title}</span>
                        <span class="event-time">${displayTime}</span>
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
        todosOsEventos.sort((a, b) => {
            if (a.isCompleted !== b.isCompleted) {
                return a.isCompleted ? 1 : -1; 
            }
            return new Date(a.date) - new Date(b.date);
        });
        
        const now = new Date();
        
        const upcomingEvents = todosOsEventos
            .filter(event => 
                !event.isCompleted && 
                new Date(event.date) >= now
            )
            .slice(0, 5); 
        
        if (previewList) {
            previewList.innerHTML = todosOsEventos.slice(0, 5).map(createEventItemHTML).join('');
        }
        
        if (modalList) {
            modalList.innerHTML = todosOsEventos.map(createEventItemHTML).join('');
        }
        
        if (upcomingList) {
            if (upcomingEvents.length > 0) {
                upcomingList.innerHTML = upcomingEvents.map(createEventItemHTML).join('');
            } else {
                upcomingList.innerHTML = '<p class="text-center text-gray-500 py-4"> Nenhum evento futuro na agenda. </p>';
            }
        }
        
        if (viewAllBtn) {
            viewAllBtn.style.display = todosOsEventos.length > 5 ? "block" : "none";
        }
        
        addEventActionListeners();
    }
    
    // 6. Funções de Manipulação de Eventos (DELETE, PUT, TOGGLE)

    // A. Excluir Evento
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
                loadMetricsAndRenderChart(); // ✅ Recarrega o gráfico após CRUD
            } else {
                const errorData = await response.json();
                showFeedback(`❌ Falha ao excluir. Mensagem: ${errorData.msg || "Erro desconhecido"}`, 'error');
            }
        } catch (error) {
            console.error('Erro de rede ao excluir:', error);
            showFeedback("❌ Erro de rede ou servidor.", 'error');
        }
    }
    
    // B. Alternar status Concluído 
    async function toggleCompleted(event) {
        const eventId = event._id;

        const token = getToken();
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
                fetchEventsAndPopulate(); 
                loadMetricsAndRenderChart(); // ✅ Recarrega o gráfico após CRUD
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

        currentEditingEventId = eventId;
        modalTitle.textContent = "Editar Evento";
        submitButton.textContent = "Salvar Alterações";
        
        document.getElementById("titulo").value = event.title;
        document.getElementById("descricao").value = event.description || '';
        document.getElementById("tipo").value = event.category; 
        document.getElementById("prioridade").value = event.priority;
        document.getElementById("duracao").value = event.duration;
        document.getElementById("dataHora").value = formatToDatetimeLocal(event.date); 

        modalAddEvento.style.display = 'flex';
    }


    // 7. Event Listener Central para Ações (Delete, Edit, Toggle)
    function addEventActionListeners() {
        const allEventsContainers = [previewList, modalList, upcomingList];
        
        allEventsContainers.forEach(container => {
            if (!container) return; 

            container.onclick = null; 

            container.onclick = function(e) {
                let target = e.target;
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
            const response = await fetch(`${API_BASE_URL}/events`, {
                method: 'GET',
                headers: { 'x-auth-token': token }
            });

            if (response.ok) {
                todosOsEventos = (await response.json()).map(event => ({
                    ...event,
                    completed: event.isCompleted 
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

    // =======================================================
    // FUNÇÃO PRINCIPAL: CARREGAR MÉTRICAS E RENDERIZAR GRÁFICO (NOVO)
    // =======================================================

    async function loadMetricsAndRenderChart() {
        const token = getToken();
        
        if (!token) {
            console.warn("Token de autenticação não encontrado. Não é possível carregar o gráfico.");
            if (pieChart) pieChart.destroy();
            if (chartCanvas) chartCanvas.classList.add('hidden');
            if (chartMessage) {
                chartMessage.textContent = "Faça login para visualizar as métricas.";
                chartMessage.classList.remove('hidden');
            }
            return;
        }

        // Obtém os valores dos filtros
        const status = statusFilter ? statusFilter.value : 'all';
        const timeframe = timeframeFilter ? timeframeFilter.value : 'all';

        // Constrói a URL da API, usando o METRICS_API_URL definido
        const url = `${METRICS_API_URL}?status=${status}&timeframe=${timeframe}`;
        
        try {
            const response = await fetch(url, {
                // Usa o cabeçalho 'x-auth-token' do seu projeto
                headers: { 'x-auth-token': token } 
            });
            
            if (!response.ok) {
                throw new Error(`Erro ao carregar métricas: ${response.statusText}`);
            }

            const data = await response.json();

            // 🛑 COLOQUE O LOG AQUI 🛑
            console.log("Dados da API de Métricas:", data);
            
            if (data.length === 0) {
                if (pieChart) pieChart.destroy();
                pieChart = null; 
                if (chartCanvas) chartCanvas.classList.add('hidden');
                if (chartMessage) {
                    chartMessage.textContent = "Nenhum evento encontrado para os filtros selecionados.";
                    chartMessage.classList.remove('hidden');
                }
                return;
            }
            
            if (chartCanvas) chartCanvas.classList.remove('hidden');
            if (chartMessage) chartMessage.classList.add('hidden');

            // Processa os dados
            const labels = data.map(item => item.category.charAt(0).toUpperCase() + item.category.slice(1)); 
            const counts = data.map(item => item.count);
            const backgroundColors = data.map(item => CATEGORY_COLORS[item.category] || 'rgb(201, 203, 207)');

            const chartData = {
                labels: labels,
                datasets: [{
                    label: 'Eventos por Categoria',
                    data: counts,
                    backgroundColor: backgroundColors,
                    hoverOffset: 10 
                }]
            };

            const ChartDataLabels = window.ChartDataLabels; // Acessa o plugin globalmente

            // RENDERIZA OU ATUALIZA O GRÁFICO
            if (pieChart) {
                pieChart.data = chartData;
                pieChart.update();
            } else {
                pieChart = new Chart(chartCanvas, {
                    type: 'doughnut', 
                    data: chartData,
                    options: {
                        responsive: true,
                        maintainAspectRatio: false, 
                        plugins: {
                            legend: {
                                position: 'bottom',
                                labels: {
                                    font: {
                                        size: 14
                                    }
                                }
                            },
                            datalabels: {
                                formatter: (value, ctx) => {
                                    return value;
                                },
                                color: '#fff',
                                font: {
                                    weight: 'bold'
                                }
                            }
                        }
                    },
                    plugins: [ChartDataLabels] 
                });
            }

        } catch (error) {
            console.error("Erro ao buscar dados do gráfico:", error);
            if (chartMessage) {
                chartMessage.textContent = "Erro ao carregar dados do gráfico. Verifique a conexão com o servidor.";
                chartMessage.classList.remove('hidden');
            }
        }
    }


    // ------------------------------------------------
    // --- LÓGICA DE TEMA E CONFIGURAÇÕES ---
    // ------------------------------------------------

    // ------------------------------------
    // LÓGICA DE DARK MODE (EXISTENTE)
    // ------------------------------------
    function toggleTheme() {
        body.classList.toggle('dark-mode');

        const isDarkMode = body.classList.contains('dark-mode');
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');

        const newIconClass = isDarkMode ? 'fa-sun' : 'fa-moon'; 
        
        if (themeToggleBtn) {
             themeToggleBtn.querySelector('i').className = `fas ${newIconClass}`;
        }
        
        if (themeToggleModalBtn) {
             themeToggleModalBtn.querySelector('i').className = `fas ${newIconClass}`;
        }
        
        // Se precisar sincronizar um switch, você faria aqui:
        // if (darkModeSwitch) darkModeSwitch.checked = isDarkMode;
    }

    // Função para aplicar o tema salvo na inicialização
    function applySavedTheme() {
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        let shouldBeDark = false;

        if (savedTheme === 'dark') {
            shouldBeDark = true;
        } else if (savedTheme === null && prefersDark) {
            shouldBeDark = true;
        }

        if (shouldBeDark) {
            body.classList.add('dark-mode');
        }
        
        if (themeToggleBtn) {
            const isCurrentlyDark = body.classList.contains('dark-mode');
            const initialIconClass = isCurrentlyDark ? 'fa-sun' : 'fa-moon'; 
            themeToggleBtn.querySelector('i').className = `fas ${initialIconClass}`;
        }
        
        // if (darkModeSwitch) {
        //     darkModeSwitch.checked = body.classList.contains('dark-mode');
        //     darkModeSwitch.addEventListener('change', toggleTheme);
        // }
    }
    
    // ------------------------------------
    // LÓGICA DE ALTO CONTRASTE (EXISTENTE) 
    // ------------------------------------

    function toggleHighContrast() {
        body.classList.toggle('high-contrast');

        const isHighContrast = body.classList.contains('high-contrast');
        localStorage.setItem('high-contrast', isHighContrast ? 'on' : 'off');
        
        if (isHighContrast && body.classList.contains('dark-mode')) {
            body.classList.remove('dark-mode');
            localStorage.setItem('theme', 'light');
            
            // if (darkModeSwitch) darkModeSwitch.checked = false;
            
            if (themeToggleBtn) toggleTheme(); 
        }
        
        if (highContrastSwitch) highContrastSwitch.checked = isHighContrast;
    }

    function applySavedContrast() {
        const savedContrast = localStorage.getItem('high-contrast');
        
        if (savedContrast === 'on') {
            body.classList.add('high-contrast');
            if (highContrastSwitch) {
                highContrastSwitch.checked = true;
            }
            if (body.classList.contains('dark-mode')) {
                body.classList.remove('dark-mode');
                localStorage.setItem('theme', 'light');
                applySavedTheme(); 
            }
        } else if (highContrastSwitch) {
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
                // if (darkModeSwitch) darkModeSwitch.checked = body.classList.contains('dark-mode');

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
            
            const title = document.getElementById("titulo").value;
            const description = document.getElementById("descricao").value;
            const type = document.getElementById("tipo").value;
            const priority = document.getElementById("prioridade").value;
            const dateInput = document.getElementById("dataHora").value; 
            const duration = document.getElementById("duracao").value;

            if (!title || !dateInput || !duration) {
                showFeedback("Por favor, preencha o Título, Data e Duração.", 'error');
                return;
            }

            const parsedDuration = parseInt(duration);

            if (isNaN(parsedDuration) || parsedDuration < 0) {
                showFeedback("A Duração deve ser um número válido (minutos) e não negativo.", 'error');
                return;
            }

            const localDate = new Date(dateInput); 
            const isoDateString = localDate.toISOString(); 
            
            const eventData = {
                title,
                description,
                date: isoDateString, 
                category: type, 
                priority,
                duration: parsedDuration,
            };
            
            const token = getToken(); 
            if (!token) { showFeedback("❌ Erro de Autenticação.", 'error'); return; }

            const isEditing = currentEditingEventId !== null;
            const url = isEditing ? `${API_BASE_URL}/events/${currentEditingEventId}` : `${API_BASE_URL}/events`;
            const method = isEditing ? 'PUT' : 'POST';
            const successMsg = isEditing ? "✅ Evento atualizado com sucesso!" : "🎉 Evento criado com sucesso!";
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
                    currentEditingEventId = null; 

                    fetchEventsAndPopulate(); 
                    loadMetricsAndRenderChart(); // ✅ Recarrega o gráfico após CRUD
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

    function applyFontSize(factor) {
        document.documentElement.style.fontSize = `${factor * 100}%`; 
        localStorage.setItem(FONT_STORAGE_KEY, factor.toString());
    }

    function loadSavedFontSize() {
        let savedFactor = localStorage.getItem(FONT_STORAGE_KEY);
        if (savedFactor) {
            applyFontSize(parseFloat(savedFactor));
        } else {
            applyFontSize(1.0); 
        }
    }
    
    loadSavedFontSize(); 

    if (decreaseFontBtn && increaseFontBtn) {
        
        decreaseFontBtn.addEventListener('click', () => {
            let currentFactor = parseFloat(localStorage.getItem(FONT_STORAGE_KEY)) || 1.0;
            let newFactor = Math.max(0.8, currentFactor / ADJUSTMENT_STEP);
            applyFontSize(newFactor);
        });

        increaseFontBtn.addEventListener('click', () => {
            let currentFactor = parseFloat(localStorage.getItem(FONT_STORAGE_KEY)) || 1.0;
            let newFactor = Math.min(1.3, currentFactor * ADJUSTMENT_STEP);
            applyFontSize(newFactor);
        });
    }

    // ----------------------------------------------------
    // ✅ NOVO: Listeners para Filtros do Gráfico (dentro do DOMContentLoaded)
    // ----------------------------------------------------
    if (statusFilter && timeframeFilter) {
        statusFilter.addEventListener('change', loadMetricsAndRenderChart);
        timeframeFilter.addEventListener('change', loadMetricsAndRenderChart);
    }
    
    // --- Inicialização da Dashboard ---
    applySavedTheme(); 
    applySavedContrast(); 
    fetchUserName();
    fetchEventsAndPopulate();
    loadMetricsAndRenderChart(); // ✅ CHAMADA INICIAL DO GRÁFICO
});