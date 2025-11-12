// Dentro do document.addEventListener("DOMContentLoaded", function() { ... }

// 1. Obtenha o formulário
const createEventForm = document.getElementById("createEventForm");
const API_URL_EVENTS = 'http://localhost:5000/api/events'; // Rota correta para o CRUD de eventos

if (createEventForm) {
    createEventForm.addEventListener("submit", async function(e) {
        e.preventDefault();

        // 2. Coletar dados do formulário
        const title = document.getElementById("titulo").value;
        const description = document.getElementById("descricao").value;
        const type = document.getElementById("tipo").value;
        const priority = document.getElementById("prioridade").value;
        const date = document.getElementById("dataHora").value; // Este campo retorna a data no formato 'yyyy-mm-dd'
        const duration = document.getElementById("duracao").value;

        // Estruturar o objeto de dados a ser enviado ao Back-end
        const eventData = {
            title,
            description,
            type,
            priority,
            date,
            duration: parseInt(duration) // Garantir que seja um número
        };

        // 3. Fazer a Requisição POST com o Token
        const token = localStorage.getItem('x-auth-token'); // Pega o token salvo no login

        try {
            const response = await fetch(API_URL_EVENTS, { // Assumindo que a rota de criação é POST /api/events
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token // Autenticação
                },
                body: JSON.stringify(eventData)
            });

            if (response.status === 201) {
                alert("🎉 Evento criado com sucesso!");
                // Aqui você deve fechar o modal e atualizar a lista de eventos na dashboard
                // ...
            } else {
                const errorData = await response.json();
                alert(`❌ Erro ao criar evento: ${errorData.msg || response.statusText}`);
            }

        } catch (error) {
            console.error('Erro de conexão:', error);
            alert("❌ Erro de conexão com o servidor. Verifique o console.");
        }
    });
}