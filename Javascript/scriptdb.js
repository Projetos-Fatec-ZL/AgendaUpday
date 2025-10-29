document.addEventListener("DOMContentLoaded", function() {
    
    // --- Dados Mock (Simulação) ---
    // Adicionei 'id' para identificar cada evento de forma única
    let todosOsEventos = [
        { id: 1, title: "Prova de matemática", time: "15 de outubro, 10:00", completed: true },
        { id: 2, title: "Estudo em grupo de React", time: "15 de outubro, 15:00", completed: true },
        { id: 3, title: "Entregar trabalho de História", time: "16 de outubro, 23:59", completed: false },
        { id: 4, title: "Planejamento de Estudo da semana", time: "17 de outubro, 09:00", completed: false },
        { id: 5, title: "Ir à academia", time: "18 de outubro, 18:00", completed: false },
        { id: 6, title: "Revisar CSS Flexbox", time: "19 de outubro, 14:00", completed: false },
        { id: 7, title: "Comprar pão", time: "19 de outubro, 18:00", completed: true }
    ];

    // --- Elementos do DOM ---
    const previewList = document.getElementById("event-list-preview");
    const modalList = document.getElementById("modal-event-list");
    const viewAllBtn = document.getElementById("view-all-btn");
    const modalOverlay = document.getElementById("modal-overlay");
    const closeModalBtn = document.getElementById("close-modal-btn");

    //modal de add eventos
    const openModalBtn = document.getElementById('add-event-btn');
    const closeAddModalBtn = document.getElementById('btnFecharModal');
    const modal = document.getElementById('novoEventoModal');

    openModalBtn.onclick = function() {
        modal.style.display = 'flex'; // Mostra o modal
    }
    closeAddModalBtn.onclick = function() {
        modal.style.display = 'none'; // Esconde o modal
    }
    modal.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }
    
    //elemento do contador
    const completedTodaySpan = document.getElementById("completed-today");

    
    //Função para ATUALIZAR O CARD de concluídos 
    function updateCompletedCount() {
        // Filtra os eventos concluídos do array principal
        const completedCount = todosOsEventos.filter(event => event.completed).length;
        
        // Atualiza o número no card
        if (completedTodaySpan) {
            completedTodaySpan.textContent = completedCount;
        }
    }

    // Função para criar o HTML de um item de evento 
    function createEventItemHTML(event) {
        
        const iconContent = event.completed ? '<i class="fas fa-check"></i>' : '';
        const iconBgClass = event.completed ? 'completed' : 'pending';
        const titleClass = event.completed ? 'feito' : '';

        return `
            <div class="event-item" data-event-id="${event.id}">
                <div class="event-icon ${iconBgClass}" role="button" data-event-id="${event.id}">
                    ${iconContent}
                </div>
                <div class="event-details">
                    <span class="event-title ${titleClass}">${event.title}</span>
                    <span class="event-time">${event.time}</span>
                </div>
            </div>
        `;
    }

    // --- Função para popular AMBAS as listas 
    function populateLists() {
        previewList.innerHTML = "";
        const previewEvents = todosOsEventos.slice(0, 5);
        previewEvents.forEach(event => {
            previewList.innerHTML += createEventItemHTML(event);
        });

        modalList.innerHTML = "";
        todosOsEventos.forEach(event => {
            modalList.innerHTML += createEventItemHTML(event);
        });

        if (todosOsEventos.length <= 5) {
            viewAllBtn.style.display = "none";
        } else {
            viewAllBtn.style.display = "block";
        }
        
      
        addEventClickListeners();
    }

    
    function addEventClickListeners() {
        const eventIcons = document.querySelectorAll('.event-icon');
        
        eventIcons.forEach(icon => {
          
            icon.addEventListener('click', () => {
             
                const eventId = parseInt(icon.dataset.eventId);
                const event = todosOsEventos.find(e => e.id === eventId);
                if (event) {
                    event.completed = !event.completed;
                }
                populateLists();

                updateCompletedCount();
            });
        });
    }


    //Lógica do Modal
    viewAllBtn.addEventListener("click", function(e) {
        e.preventDefault();
        modalOverlay.classList.remove("hidden");
    });

    closeModalBtn.addEventListener("click", function() {
        modalOverlay.classList.add("hidden");
    });

    modalOverlay.addEventListener("click", function(e) {
        if (e.target === modalOverlay) {
            modalOverlay.classList.add("hidden");
        }
    });
    populateLists();
    updateCompletedCount();
});