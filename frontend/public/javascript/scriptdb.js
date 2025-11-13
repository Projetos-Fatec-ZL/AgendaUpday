document.addEventListener("DOMContentLoaded", function() {
    
    // --- Configurações e Variáveis Globais ---
    const API_BASE_URL = 'http://localhost:5000/api'; 
    let todosOsEventos = []; 

    // --- Elementos do DOM ---
    const previewList = document.getElementById("event-list-preview"); 
    const completedTodaySpan = document.getElementById("completed-today"); 
    const totalEventsSpan = document.querySelector('.stat-card.blue .card-value'); 
    const plansCountSpan = document.querySelector('.stat-card.purple .card-value'); 
    const greetingSpan = document.querySelector('.greeting'); 
    const logoutBtn = document.getElementById('logout-btn'); 

    // --- Dark Mode Elements e Variáveis ---
    const themeToggleBtn = document.getElementById("theme-toggle-btn");
    const body = document.body;
    const icon = themeToggleBtn ? themeToggleBtn.querySelector('i') : null;

// --- Elementos do Modal de Configurações ---
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const closeSettingsModalBtn = document.getElementById('close-settings-modal-btn');
    const decreaseFontBtn = document.getElementById('font-size-decrease');
    const increaseFontBtn = document.getElementById('font-size-increase');

    // Variáveis de Acessibilidade
    const FONT_STORAGE_KEY = 'fontSizeAdjustmentFactor';
    // Define o "passo" de ajuste (1.1 = 10% por clique)
    const ADJUSTMENT_STEP = 1.1;
    
    // Abrir Modal de Configurações
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            // Usa 'flex' para o modal ser visível (display: none no CSS para começar oculto)
            settingsModal.style.display = 'flex'; 
        });
    }

    // Fechar Modal de Configurações (pelo botão 'X')
    if (closeSettingsModalBtn) {
        closeSettingsModalBtn.addEventListener('click', () => {
            settingsModal.style.display = 'none';
        });
    }

    // Fechar Modal de Configurações (clicando fora)
    if (settingsModal) {
        settingsModal.addEventListener('click', (event) => {
            // Verifica se o clique foi no backdrop (fundo cinza)
            if (event.target === settingsModal) {
                settingsModal.style.display = 'none';
            }
        });
    }
     // --- Lógica de Toggles (Notificações) ---
    const emailToggle = document.getElementById('email-notifications');
    const telegramToggle = document.getElementById('telegram-notifications');

    if (emailToggle && telegramToggle) {
        // 1. Carregar preferências salvas (se existirem)
        // O item 'true' ou 'false' é lido como string, por isso a comparação
        emailToggle.checked = localStorage.getItem('emailNotifications') === 'true';
        telegramToggle.checked = localStorage.getItem('telegramNotifications') === 'true';

        // 2. Salvar preferência ao mudar
        emailToggle.addEventListener('change', (e) => {
            localStorage.setItem('emailNotifications', e.target.checked);
            console.log('Notificações por email salvas:', e.target.checked);
        });
        telegramToggle.addEventListener('change', (e) => {
            localStorage.setItem('telegramNotifications', e.target.checked);
            console.log('Notificações por Telegram salvas:', e.target.checked);
        });
    }

    // Elementos de Modais
    const modalOverlay = document.getElementById("modal-overlay");
    const viewAllBtn = document.getElementById("view-all-btn");
    const modalList = document.getElementById("modal-event-list");
    // NOVO: Elemento da lista de Próximos Eventos
     const upcomingList = document.querySelector(".upcoming-list");
    
    // Modal de Criação/Edição
    const modalAddEvento = document.getElementById('novoEventoModal');
    const openModalBtn = document.getElementById('add-event-btn');
    const closeAddModalBtn = document.getElementById('btnFecharModal');
    const createEventForm = document.getElementById("createEventForm");
    const modalTitle = modalAddEvento.querySelector('h2'); // Seleciona o H2 do modal
    const submitButton = modalAddEvento.querySelector('.create-event-btn'); // Botão de submit
    
    // Variável para armazenar o ID do evento em modo de edição
    let currentEditingEventId = null; 


    // --- FUNÇÕES DE UTILIDADE ---

    // 1. Gerenciamento de Token/Autenticação
    const getToken = () => localStorage.getItem('x-auth-token');
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('x-auth-token'); 
            alert("Você saiu da sua conta.");
            window.location.href = 'login.html'; 
        });
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
                greetingSpan.textContent = `Olá, ${user.name}!`; 
            }
        } catch (error) {
            console.error('Erro de conexão ao buscar usuário:', error);
        }
    }
    
    // 3. Atualiza os Cards
    function updateStats() {
        if (totalEventsSpan) totalEventsSpan.textContent = todosOsEventos.length;

        const completedCount = todosOsEventos.filter(event => event.completed).length;
        if (completedTodaySpan) completedTodaySpan.textContent = completedCount;
        
        const plansCount = todosOsEventos.filter(event => event.category === 'estudo').length;
        if (plansCountSpan) plansCountSpan.textContent = plansCount;
    }

    // 4. Cria o HTML do Item do Evento (Incluindo Botões de Ação)
    function createEventItemHTML(event) {
        let displayTime = '';
        try {
            // Formato de data ISO para o input datetime-local: yyyy-MM-ddTHH:mm
            const dateObj = new Date(event.date);
            displayTime = dateObj.toLocaleDateString('pt-BR', { 
                day: 'numeric', 
                month: 'long', 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        } catch (e) {
            displayTime = 'Data inválida'; 
        }
        
        const isCompleted = event.completed; 
        const iconContent = isCompleted ? '<i class="fas fa-check"></i>' : '<i class="fas fa-calendar-alt"></i>';
        const iconBgClass = isCompleted ? 'completed' : 'pending';
        const titleClass = isCompleted ? 'feito' : ''; 
        
        return `
            <div class="event-item" data-event-id="${event._id}">
                <div class="event-details-main">
                    <div class="event-icon ${iconBgClass}" role="button" data-event-id="${event._id}" data-action="toggle">
                        ${iconContent}
                    </div>
                    <div class="event-details">
                        <span class="event-title ${titleClass}">${event.title}</span>
                        <span class="event-time">${displayTime} - Duração: ${event.duration} min</span>
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
     // 1. Ordena eventos para o Front-end (ex: do mais próximo para o mais distante)
     todosOsEventos.sort((a, b) => new Date(a.date) - new Date(b.date));    
     // Popula Preview (max 5)
     if (previewList) {
         previewList.innerHTML = todosOsEventos.slice(0, 5).map(createEventItemHTML).join('');
     }
     // Popula Modal "Ver Todos"
     if (modalList) {
          modalList.innerHTML = todosOsEventos.map(createEventItemHTML).join('');
     }  
     // --- NOVO: Lógica para Próximos Eventos (FUTUROS e NÃO CONCLUÍDOS) ---
     const now = new Date();
     
     const upcomingEvents = todosOsEventos
         // Filtra: 1. Evento NÃO está concluído E 2. A data do evento é AGORA ou no FUTURO
         .filter(event => !event.completed && new Date(event.date) >= now)
         // Já está ordenado acima, mas garante que os mais próximos apareçam primeiro
         .slice(0, 5); // Limita a visualização a 5 próximos eventos
     
     if (upcomingList) {
         if (upcomingEvents.length > 0) {
             upcomingList.innerHTML = upcomingEvents.map(createEventItemHTML).join('');
         } else {
             // Mensagem padrão quando não há próximos eventos
             upcomingList.innerHTML = '<p> Nenhum evento futuro na agenda. </p>';
         }
     }
     // ------------------------------------------------------------------------    
     // Exibir/Ocultar botão "Ver Todos"
     if (viewAllBtn) {
         viewAllBtn.style.display = todosOsEventos.length > 5 ? "block" : "none";
     }
     
     // Adiciona Listeners de Ação APÓS o HTML ser gerado
     addEventActionListeners(); 
    }
    
    // 6. Funções de Manipulação de Eventos (DELETE, PUT)

    // A. Excluir Evento (DELETE /api/events/:id)
    async function deleteEvent(eventId) {
        if (!confirm('Tem certeza que deseja excluir este evento?')) return;

        const token = getToken();
        try {
            const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
                method: 'DELETE',
                headers: { 'x-auth-token': token }
            });

            if (response.ok) {
                alert("🗑️ Evento excluído com sucesso!");
                // Recarrega a lista para refletir a mudança
                fetchEventsAndPopulate(); 
            } else {
                const errorData = await response.json();
                alert(`❌ Falha ao excluir. Mensagem: ${errorData.msg || "Erro desconhecido"}`);
            }
        } catch (error) {
            console.error('Erro de rede ao excluir:', error);
            alert("❌ Erro de rede ou servidor.");
        }
    }
    
    // B. Alternar status Concluído (PUT /api/events/:id)
    async function toggleCompleted(event) {
        const isCurrentlyCompleted = event.completed;
        const eventId = event._id;

        const token = getToken();
        const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'x-auth-token': token 
            },
            body: JSON.stringify({ completed: !isCurrentlyCompleted })
        });
        
        if (response.ok) {
            // Recarrega a lista para refletir o status atualizado
            fetchEventsAndPopulate();
        } else {
             alert("❌ Falha ao alterar status do evento.");
        }
    }
    
    // C. Abrir Modal para Edição
    function openEditModal(eventId) {
        const event = todosOsEventos.find(e => e._id === eventId);
        if (!event) return alert("Evento não encontrado para edição.");

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
        
        // Preencher Data e Hora: O input 'date' (tipo="date") espera o formato 'yyyy-MM-dd'
        // O input 'datetime-local' espera o formato 'yyyy-MM-ddThh:mm'
        if (event.date) {
             const datePart = new Date(event.date).toISOString().split('T')[0];
             document.getElementById("dataHora").value = datePart; 
             // Se você tiver um campo de hora separado, adicione aqui
        }


        // 3. Abrir o modal
        modalAddEvento.style.display = 'flex';
    }


    // 7. Event Listener Central para Ações (Delete, Edit, Toggle)
    function addEventActionListeners() {
        // Target: Onde o evento está acontecendo (pode ser o preview ou o modal)
        const allEventsContainers = [previewList, modalList];
        
        allEventsContainers.forEach(container => {
            if (!container) return; 

            container.querySelectorAll('[data-action]').forEach(element => {
                // Remove listeners antigos antes de adicionar novos
                element.removeEventListener('click', handleEventAction); 
                element.addEventListener('click', handleEventAction); 
            });
        });
    }

    // Função única para lidar com todos os cliques de ação
    function handleEventAction(e) {
        const element = e.currentTarget;
        const action = element.dataset.action;
        const eventId = element.dataset.eventId;
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
    
    
    // 8. Busca Eventos e Popula
    async function fetchEventsAndPopulate() {
        const token = getToken();
        if (!token) return; 

        try {
            const response = await fetch(`${API_BASE_URL}/events`, {
                method: 'GET',
                headers: { 'x-auth-token': token }
            });

            if (response.ok) {
                todosOsEventos = await response.json(); 
                populateLists();
                updateStats(); 
                
            } else if (response.status === 401) {
                 // Tratar token expirado, etc.
            }
        } catch (error) {
            console.error('Erro de rede ao buscar eventos:', error);
        }
    }


    // --- Lógica de Modais (Adaptação para Reuso) ---
    
    // Abre o Modal (Modo CRIAÇÃO)
    if (openModalBtn) {
         openModalBtn.onclick = function() { 
            // Resetar para modo de Criação antes de abrir
            currentEditingEventId = null;
            modalTitle.textContent = "Criar Novo Evento";
            submitButton.textContent = "Criar Evento";
            createEventForm.reset(); 
            modalAddEvento.style.display = 'flex'; 
        }
    }
    
    // Fecha o Modal
    if (closeAddModalBtn) closeAddModalBtn.onclick = function() { modalAddEvento.style.display = 'none'; }
    if (modalAddEvento) {
        modalAddEvento.onclick = function(event) {
            if (event.target === modalAddEvento) { modalAddEvento.style.display = 'none'; }
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
            const date = document.getElementById("dataHora").value; 
            const duration = document.getElementById("duracao").value;

            // Estrutura de dados para o Backend
            const eventData = {
                title,
                description,
                date,
                category: type, 
                priority,
                duration: parseInt(duration),
                // Não enviamos 'completed' na criação/edição inicial, mas ele existe no modelo
            };

            const token = getToken(); 
            if (!token) { alert("❌ Erro de Autenticação."); return; }

            // Decide se é POST (Criação) ou PUT (Edição)
            const isEditing = currentEditingEventId !== null;
            const url = isEditing ? `${API_BASE_URL}/events/${currentEditingEventId}` : `${API_BASE_URL}/events`;
            const method = isEditing ? 'PUT' : 'POST';
            const successMsg = isEditing ? "✅ Evento atualizado com sucesso!" : "🎉 Evento criado com sucesso!";
            const statusTarget = isEditing ? 200 : 201; // PUT retorna 200, POST retorna 201

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
                    alert(successMsg);
                    
                    modalAddEvento.style.display = 'none'; 
                    createEventForm.reset(); 
                    currentEditingEventId = null; // Zera o modo edição

                    fetchEventsAndPopulate(); // Recarrega a lista
                } else {
                    const errorData = await response.json();
                    alert(`❌ Falha ao processar evento. Mensagem: ${errorData.msg || "Erro desconhecido"}`);
                }

            } catch (error) {
                console.error('Erro de conexão ou requisição:', error);
                alert("❌ Erro de rede ou servidor.");
            }
        });
    }
// Função para aplicar o tema e salvar no localStorage

    function applyTheme(theme) {
        let icon = null;
        if (theme === 'dark') {
            body.classList.add('dark-mode');
            // Mude o ícone para Sol quando estiver no modo escuro
            if (icon) icon.className = 'fas fa-sun'; 
            localStorage.setItem('theme', 'dark');
        } else {
            body.classList.remove('dark-mode');
            // Mude o ícone para Lua quando estiver no modo claro
            if (icon) icon.className = 'fas fa-moon'; 
            localStorage.setItem('theme', 'light');
        }
    }

    // 1. Aplica a preferência salva ao carregar a página
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        applyTheme(savedTheme);
    } else {
        // Opcional: Detecta a preferência do sistema na primeira visita
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            applyTheme('dark');
        } else {
            applyTheme('light');
        }
    }

    // 2. Listener para o clique no botão (alterna o tema)
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = body.classList.contains('dark-mode') ? 'dark' : 'light';
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            applyTheme(newTheme);
        });
    }
// --- FIM: Dark Mode ---

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
    fetchUserName(); 
    fetchEventsAndPopulate(); 
});