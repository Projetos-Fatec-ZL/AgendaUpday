// src/index.js - Foco em Inicialização e Orquestração

const express = require('express');

// Carrega variáveis de ambiente
const dotenv = require('dotenv');
dotenv.config();

const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const eventsRoutes = require('./routes/events');
const startNotificationScheduler = require('./services/notificationScheduler'); 


const app = express();
const PORT = process.env.PORT || 5000;

// Função assíncrona para iniciar todo o servidor
const startServer = async () => {
    try {
        // 1. Conexão Assíncrona com o Banco de Dados
        await connectDB();

        // 2. Middlewares Globais
        app.use(cors()); //ativa o cors antes das rotas
        
        // ===================================================
        // >>> NOVO DEBUG GLOBAL <<<
        app.use((req, res, next) => {
            // Loga apenas a requisição de recuperação para não poluir o terminal
            if (req.url.includes('/api/auth/recovery-email')) {
                console.log(`[DEBUG GLOBAL] Requisição recebida em: ${req.url}`);
            }
            next(); // Crucial para passar para o próximo middleware/rota
        });
        // ===================================================

        // Permite que o servidor entenda requisições no formato JSON
        app.use(express.json({extended: false}));//processa dados json

        // 3. Definição das Rotas
        // Rota Raiz (Check de status)
        app.get('/', (req, res) => {
            res.send('API agendaUpDay Rodando...');
        });
        
        // Rotas de Autenticação (Prefixo: /api/auth)
        app.use('/api/auth', authRoutes);

        // 💡 Rotas de Eventos (Prefixo: /api/events)
        app.use('/api/events', eventsRoutes); 


        // 4. Iniciar Servidor
        app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));

        // INICIA O AGENDADOR DEPOIS QUE O SERVIDOR ESTÁ RODANDO
        startNotificationScheduler(); 
        
    } catch (error) {
        console.error('Falha ao iniciar o servidor:', error.message);
        process.exit(1); // Encerra a aplicação em caso de falha grave na inicialização
    }
};

// Executa a função de inicialização
startServer();