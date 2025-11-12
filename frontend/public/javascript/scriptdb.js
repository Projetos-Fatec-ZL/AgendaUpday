document.addEventListener("DOMContentLoaded", function() {
    
    // --- Configurações e Variáveis Globais ---
    // ATENÇÃO: Se você estiver executando o frontend em outro lugar que não seja a mesma origem, 
    // certifique-se de que o backend permita CORS para esta URL.
    const API_BASE_URL = 'http://localhost:5000/api'; 
    let todosOsEventos = []; 

    // --- Elementos do DOM ---
    const previewList = document.getElementById("event-list-preview"); 
    const completedTodaySpan = document.getElementById("completed-today"); 
    const totalEventsSpan = document.querySelector('.stat-card.blue .card-value'); 
    const plansCountSpan = document.querySelector('.stat-card.purple .card-value'); 
    const greetingSpan = document.querySelector('.greeting'); 
    const logoutBtn = document.getElementById('logout-btn'); 

    // Elementos de Modais
    const modalOverlay = document.getElementById("modal-overlay");
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

    // --- FUNÇÕES DE UTILIDADE ---

    // Função substituta para alert/confirm
    function showFeedback(message, type = 'info') {
        // ATENÇÃO: Como não temos um container de notificação na UI, 
        // usaremos o console para logs importantes, mas o ideal é 
        // mostrar uma mensagem na tela para o usuário!
        console.log(`[${type.toUpperCase()}]: ${message}`);

        // Você pode adicionar aqui uma lógica simples para exibir a mensagem na tela.
        // Exemplo: document.getElementById('feedback-message').textContent = message;
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
        
        // Formato ISO: yyyy-MM-ddTHH:mm:ss.sssZ
        // Pegamos os 16 primeiros caracteres para yyyy-MM-ddTHH:mm
        return date.toISOString().slice(0, 16);
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
                    <!-- O ícone agora é o botão de toggle -->
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
        // Usamos window.confirm para simular a confirmação, mas é importante evitar alerts/confirms
        if (!window.confirm('Tem certeza que deseja excluir este evento?')) return; 

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
                // Não precisa enviar body, o backend fará o toggle!
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


    // --- Lógica de Modais (Adaptação para Reuso) ---
    
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
            const date = document.getElementById("dataHora").value; // Formato yyyy-MM-ddThh:mm
            const duration = document.getElementById("duracao").value;

            // Validação de Frontend (opcional, mas bom)
            if (!title || !date || !duration) {
                showFeedback("Por favor, preencha o Título, Data e Duração.", 'error');
                return;
            }

            // Estrutura de dados para o Backend
            const eventData = {
                title,
                description,
                date, 
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


    // --- Inicialização da Dashboard ---
    fetchUserName(); 
    fetchEventsAndPopulate(); 
});