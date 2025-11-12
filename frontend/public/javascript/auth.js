// O código é envolto no DOMContentLoaded para garantir que o HTML seja carregado 
// antes de tentar encontrar os elementos.

document.addEventListener('DOMContentLoaded', function() {
    
    // =======================================================
    // VARIÁVEIS DE CONFIGURAÇÃO (BACK-END)
    // =======================================================
    const API_URL = 'http://localhost:5000/api/auth';
    
    
    // =======================================================
    // 1. LÓGICA DE CADASTRO (POST /api/auth/register)
    // =======================================================
    const cadastroForm = document.getElementById("cadastroForm");
    
    // 💡 SÓ TENTA ADICIONAR O LISTENER SE O FORMULÁRIO EXISTIR (evita o TypeError)
    if (cadastroForm) {
        cadastroForm.addEventListener("submit", async function(e) {
            e.preventDefault();

            const nome = document.getElementById("nome").value;
            const email = document.getElementById("email").value;
            const senha = document.getElementById("senha").value;
            const mensagem = document.getElementById("mensagem"); // Elemento para exibir o feedback

            if (!nome || !email || !senha) {
                mensagem.textContent = "⚠️ Preencha todos os campos!";
                mensagem.style.color = "tomato";
                return;
            }

            try {
                // Chama a rota de Cadastro. Nomes dos campos: { nome, email, senha }
                const response = await fetch(`${API_URL}/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nome, email, senha }) 
                });

                if (response.status === 201) {
                    mensagem.textContent = "✅ Conta criada com sucesso! Redirecionando para o login...";
                    mensagem.style.color = "lightgreen";
                    cadastroForm.reset(); // Limpa o formulário
                    
                    // Redireciona após 2 segundos
                    setTimeout(() => { window.location.href = 'login.html'; }, 2000);

                } else {
                    // Trata erros como 400 (Usuário já existe)
                    const errorData = await response.json();
                    mensagem.textContent = `❌ Erro: ${errorData.msg || 'Falha no registro.'}`;
                    mensagem.style.color = "tomato";
                }

            } catch (error) {
                mensagem.textContent = "❌ Erro de conexão. Verifique se o servidor está ativo na porta 5000.";
                mensagem.style.color = "tomato";
                console.error('Erro de rede/API:', error);
            }
        });
    } // FIM DO IF cadastroForm


    // =======================================================
    // 2. LÓGICA DE LOGIN (POST /api/auth/login)
    // =======================================================
    const loginForm = document.getElementById("loginForm");

    // 💡 SÓ TENTA ADICIONAR O LISTENER SE O FORMULÁRIO EXISTIR (evita o TypeError)
    if (loginForm) {
        loginForm.addEventListener("submit", async function(e) {
            e.preventDefault();

            const email = document.getElementById("email").value;
            const senha = document.getElementById("senha").value;
            const mensagem = document.getElementById("mensagem"); // Use o mesmo elemento de mensagem ou crie um novo ID

            if (!email || !senha) {
                mensagem.textContent = "⚠️ Preencha email e senha!";
                mensagem.style.color = "tomato";
                return;
            }

            try {
                // Chama a rota de Login. Nomes dos campos: { email, senha }
                const response = await fetch(`${API_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, senha }) 
                });

                const data = await response.json();

                if (response.status === 200) {
                    // PASSO CRUCIAL: Salvar o Token JWT para todas as requisições futuras
                    localStorage.setItem('x-auth-token', data.token); 
                    
                    mensagem.textContent = "✅ Login bem-sucedido. Redirecionando...";
                    mensagem.style.color = "lightgreen";
                    
                    // Redireciona para a próxima página do aplicativo
                    setTimeout(() => { window.location.href = 'dashboard.html'; }, 500); 

                } else {
                    // Credenciais inválidas (400 Bad Request)
                    mensagem.textContent = `❌ Falha no login: ${data.msg || 'Credenciais inválidas.'}`;
                    mensagem.style.color = "tomato";
                }

            } catch (error) {
                mensagem.textContent = "❌ Erro de conexão. Verifique o servidor.";
                mensagem.style.color = "tomato";
                console.error('Erro de rede/API:', error);
            }
        });
    } // FIM DO IF loginForm

});