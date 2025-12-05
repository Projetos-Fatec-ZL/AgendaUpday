console.log("------------------------------------------");
console.log("✅ ARQUIVO AUTH.JS CARREGADO CORRETAMENTE.");
console.log("------------------------------------------");

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
    
    if (cadastroForm) {
        cadastroForm.addEventListener("submit", async function(e) {
            e.preventDefault();

            const nome = document.getElementById("nome").value;
            const email = document.getElementById("email").value;
            const senha = document.getElementById("senha").value;
            const mensagem = document.getElementById("mensagem");

            if (!nome || !email || !senha) {
                mensagem.textContent = "⚠️ Preencha todos os campos!";
                mensagem.style.color = "tomato";
                return;
            }

            try {
                const response = await fetch(`${API_URL}/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nome, email, senha }) 
                });

                if (response.status === 201) {
                    mensagem.textContent = "✅ Conta criada com sucesso! Redirecionando para o login...";
                    mensagem.style.color = "lightgreen";
                    cadastroForm.reset();
                    
                    setTimeout(() => { window.location.href = 'login.html'; }, 2000);

                } else {
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
    }


    // =======================================================
    // 2. LÓGICA DE LOGIN (POST /api/auth/login)
    // =======================================================
    const loginForm = document.getElementById("loginForm");

    if (loginForm) {
        loginForm.addEventListener("submit", async function(e) {
            e.preventDefault();

            const email = document.getElementById("email").value;
            const senha = document.getElementById("senha").value;
            const mensagem = document.getElementById("mensagem");

            if (!email || !senha) {
                mensagem.textContent = "⚠️ Preencha email e senha!";
                mensagem.style.color = "tomato";
                return;
            }

            try {
                const response = await fetch(`${API_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, senha }) 
                });

                const data = await response.json();

                if (response.status === 200) {
                    localStorage.setItem('x-auth-token', data.token); 
                    
                    mensagem.textContent = "✅ Login bem-sucedido. Redirecionando...";
                    mensagem.style.color = "lightgreen";
                    
                    setTimeout(() => { window.location.href = 'dashboard.html'; }, 500); 

                } else {
                    mensagem.textContent = `❌ Falha no login: ${data.msg || 'Credenciais inválidas.'}`;
                    mensagem.style.color = "tomato";
                }

            } catch (error) {
                mensagem.textContent = "❌ Erro de conexão. Verifique o servidor.";
                mensagem.style.color = "tomato";
                console.error('Erro de rede/API:', error);
            }
        });
    }
    
    // =======================================================
    // 3. LISTENERS DE RECUPERAÇÃO DE SENHA (NOVOS)
    // =======================================================
    
    // Elementos do Modal
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    const recoveryModalElement = document.getElementById('recoveryModal');
    const recoveryEmailForm = document.getElementById('recoveryEmailForm');

    // Inicializa a instância do Modal (requer Bootstrap)
    let recoveryModalInstance;
    if (recoveryModalElement && typeof bootstrap !== 'undefined') {
        recoveryModalInstance = new bootstrap.Modal(recoveryModalElement);
    }
    
    // A. Listener para abrir o Modal (Ao clicar em 'Esqueci minha senha')
    if (forgotPasswordLink && recoveryModalInstance) {
        forgotPasswordLink.addEventListener('click', function(e) {
            e.preventDefault(); 
            // LOG CRÍTICO NO FRONTEND: Se este log aparecer, o problema de clique está resolvido.
            console.log("[DEBUG FRONTEND] Link 'Esqueci minha senha' clicado. Abrindo modal.");
            recoveryModalInstance.show();
        });
    }

    // B. Listener para ENVIAR EMAIL DE RECUPERAÇÃO
    if (recoveryEmailForm) {
        recoveryEmailForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // O ID do elemento de mensagem no modal de recuperação deve ser 'modalMessage'
            const messageElementId = 'modalMessage'; 
            
            // Chama a função principal de recuperação que está definida abaixo
            // O terceiro argumento (onSuccessCallback) é passado como null por agora
            window.handleRecoveryEmail(e, messageElementId, null);
        });
    }


    // =======================================================
    // 4. FUNÇÕES DE RECUPERAÇÃO DE SENHA (Expostas para login.html)
    // As funções não precisam ser alteradas.
    // =======================================================
    
    // NOTA: As funções usam argumentos de callback e o ID do elemento de mensagem
    // para interagir com o DOM do login.html após a chamada da API.

    // A função auxiliar para mensagens dentro do modal (VERIFIQUE O ID 'modalMessage' NO SEU HTML)
    window.displayModalMessage = function(msg, isError, messageElementId) {
        const msgElement = document.getElementById(messageElementId || 'modalMessage');
        if (msgElement) {
            msgElement.textContent = msg;
            msgElement.style.color = isError ? 'tomato' : 'lightgreen';
        }
    };

    /**
     * PASSO 1: Envia o email para a API para solicitar o código de recuperação.
     */
    async function handleRecoveryEmail(e, messageElementId, onSuccessCallback) {
        // Log para ver se a função está sendo chamada
        console.log("[DEBUG FRONTEND] Função handleRecoveryEmail iniciada. Fazendo fetch para o backend.");

        const email = document.getElementById('recoveryEmail').value.trim();
        
        if (!email) {
            window.displayModalMessage('Por favor, digite seu e-mail.', true, messageElementId);
            return;
        }

        try {
            const response = await fetch(`${API_URL}/recovery-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (response.ok) {
                window.displayModalMessage(data.msg || 'Código enviado. Verifique seu e-mail/console.', false, messageElementId);
                setTimeout(() => {
                    if (onSuccessCallback) onSuccessCallback();
                }, 1000);
            } else {
                window.displayModalMessage(data.msg || 'Erro ao solicitar código. Tente novamente.', true, messageElementId);
            }

        } catch (err) {
            console.error('Erro de rede:', err);
            window.displayModalMessage('Erro de conexão com o servidor.', true, messageElementId);
        }
    }

    /**
     * PASSO 2: Valida o código de recuperação com a API.
     */
    async function handleValidateCode(e, messageElementId, email, onSuccessCallback) {
        const code = document.getElementById('recoveryCode').value.trim();
        
        if (!code || code.length !== 6) {
            window.displayModalMessage('Código inválido. Deve ter 6 dígitos.', true, messageElementId);
            return;
        }
        
        try {
            const response = await fetch(`${API_URL}/validate-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // A callback de sucesso será chamada pelo login.html para habilitar os campos de senha
                if (onSuccessCallback) onSuccessCallback(code); 
            } else {
                window.displayModalMessage(data.msg || 'Código inválido ou expirado.', true, messageElementId);
            }

        } catch (err) {
            console.error('Erro de rede:', err);
            window.displayModalMessage('Erro de conexão com o servidor.', true, messageElementId);
        }
    }

    /**
     * PASSO 3: Redefine a senha após validação do código.
     */
    async function handleResetPassword(e, messageElementId, email, onSuccessCallback) {
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const code = document.getElementById('recoveryCode').value.trim();

        if (newPassword !== confirmPassword) {
            window.displayModalMessage('As senhas não coincidem.', true, messageElementId);
            return;
        }
        if (newPassword.length < 6) {
            window.displayModalMessage('A nova senha deve ter pelo menos 6 caracteres.', true, messageElementId);
            return;
        }

        try {
            const response = await fetch(`${API_URL}/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code, newPassword })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // A callback de sucesso será chamada pelo login.html para fechar o modal
                if (onSuccessCallback) onSuccessCallback();
            } else {
                window.displayModalMessage(data.msg || 'Falha ao redefinir a senha.', true, messageElementId);
            }

        } catch (err) {
            console.error('Erro de rede:', err);
            window.displayModalMessage('Erro de conexão com o servidor.', true, messageElementId);
        }
    }
    
    // =======================================================
    // EXPOSIÇÃO DAS FUNÇÕES (Para serem usadas pelo login.html)
    // =======================================================
    // Colocamos as funções no objeto 'window' para que fiquem acessíveis 
    // globalmente e possam ser chamadas pelo script do login.html.
    window.handleRecoveryEmail = handleRecoveryEmail;
    window.handleValidateCode = handleValidateCode;
    window.handleResetPassword = handleResetPassword;

});