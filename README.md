# 📅 AgendApp - Sistema de Gestão de Eventos

Este projeto é um sistema completo de gerenciamento de eventos pessoais e profissionais, construído com arquitetura de Backend e Frontend separados. 
Ele utiliza a **MERN Stack** (MongoDB, Express, Node.js) para a API e **JavaScript Vanilla** para a interface.

---

## 🚀 Tecnologias Utilizadas

A aplicação é dividida em dois componentes principais:

### 1. Backend (API RESTful)
* **Node.js & Express:** Ambiente de execução e Framework para criar o servidor e o roteamento da API.
* **MongoDB & Mongoose:** Banco de dados NoSQL (hospedado no Atlas) e biblioteca ODM (Object Data Modeling) para modelagem de dados.
* **JWT (JSON Web Tokens):** Tecnologia de segurança utilizada para autenticação e autorização de usuários.

### 2. Frontend (Interface do Usuário)
* **HTML, CSS, JavaScript (Vanilla):** Base da Interface do Usuário, incluindo a lógica do cliente e as chamadas AJAX.
* **Chart.js:** Biblioteca JavaScript utilizada para a visualização de dados (Análise de Eventos por Categoria) no dashboard.

---

## ⚙️ Pré-requisitos

Para executar o projeto, você precisa ter as seguintes ferramentas instaladas:

1.  **Node.js:** Versão 16.x ou superior (inclui o npm).
2.  **Git:** Para clonar o repositório.

---

## 1. Configuração do Ambiente e Instalação

### 1.1 Clonagem do Repositório

Abra o terminal e clone o projeto. O comando irá criar a pasta raiz `PI-AGENDAUPDAY`:

# Substitua pelo link real do seu GitHub
git clone <LINK_DO SEU REPOSITÓRIO NO GITHUB>
cd PI-AGENDAUPDAY 
1.2 Instalação das Dependências
As dependências são necessárias somente para o backend.

Navegue para a pasta backend:

cd backend


Instale os pacotes npm:

npm install


2. Conexão com o Banco de Dados (MongoDB Atlas)
O Backend requer as variáveis de ambiente para se conectar ao seu cluster no Atlas e para gerenciar a segurança da autenticação.

2.1 Configuração do Arquivo .env
Na pasta backend, crie um arquivo chamado .env e insira as variáveis secretas:


# Conteúdo do arquivo .env

# 1. String de Conexão do Atlas (Obtida no painel 'Connect' -> 'Drivers').
# Inclua o usuário e a senha do seu usuário do MongoDB.
MONGO_URI=<SUA STRING DE CONEXÃO DO ATLAS AQUI>

PORT=5000
MONGODB_URI="mongodb+srv://kelvindutra_db_user:SBz44XrTTb2EOydU@agendaupday.1bzutwd.mongodb.net/agendaUpDay"
# chave secreta (usada para assinar e verificar tokens JWT)
JWT_SECRET="sua_chave_secreta_muito_longa_e_aleatoria" 


# 2. Chave Secreta JWT. Use uma string longa e aleatória para segurança.
JWT_SECRET=<UMA CHAVE SECRETA FORTE AQUI>

# Configuração de Notificações de E-mail (Outlook/Hotmail)
EMAIL_USER=agendaupday@gmail.com
EMAIL_PASS=jewpwjmpqnjiroqr


3. Execução do Projeto
O projeto é iniciado em duas etapas. O servidor Backend deve estar rodando antes de abrir o Frontend.

3.1 Iniciar o Backend (API)
Verifique se você está na pasta backend (cd PI-AGENDAUPDAY/backend).

Execute o servidor Node.js a partir do ponto de entrada:

node src/index.js
O console deve confirmar que o servidor foi iniciado na porta 5000 e está conectado ao MongoDB. Mantenha este terminal aberto.


3.2 Abrir o Frontend (Interface do Usuário)
Navegue para a pasta frontend no seu explorador de arquivos.

Dê dois cliques no arquivo login.html para abrir o sistema no seu navegador padrão.


💡 Primeiros Passos no Sistema
Ao acessar a interface, use a opção de Cadastro (Register) para criar um novo usuário no banco de dados.

Após o cadastro, use suas credenciais para fazer o Login.

Você será redirecionado para o dashboard para gerenciar seus eventos.
