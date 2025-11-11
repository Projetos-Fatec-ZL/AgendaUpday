const cron = require('node-cron');
const Event = require('../models/Event');
const User = require('../models/User'); // 1. NOVO: Importa o modelo de Usuário
const { sendEventNotificationEmail } = require('./notificationService'); // 2. NOVO: Importa a função REAL de envio

// Define a antecedência em horas para a notificação (ex: 24 horas antes)
const ADVANCE_TIME_HOURS = 24; 

const startNotificationScheduler = () => {
    // Agenda uma tarefa para rodar a CADA MINUTO. 
    cron.schedule('* * * * *', async () => {
        console.log('--- Executando checagem de eventos para notificação ---');
        
        const now = new Date();
        const limitTime = new Date(now.getTime() + ADVANCE_TIME_HOURS * 60 * 60 * 1000);

        try {
            // Busca eventos que: estão dentro da janela de 24h E não foram notificados
            const eventsToNotify = await Event.find({
                date: { $gt: now, $lte: limitTime },
                notificationSent: false
            });

            if (eventsToNotify.length > 0) {
                console.log(`[ALERTA] Encontrados ${eventsToNotify.length} eventos para notificar!`);
                
                // 🚀 Otimização: Mapeia e executa todas as tarefas de notificação em paralelo 🚀
                const notificationPromises = eventsToNotify.map(async (event) => {
                    // Busca o usuário associado para obter o e-mail
                    const user = await User.findById(event.user).select('email name'); 
                    
                    if (user && user.email) {
                        // 1. Chama o serviço REAL de envio de e-mail
                        await sendEventNotificationEmail(user, event);

                        // 2. Marca o evento como notificado (para evitar reenvio)
                        await Event.findByIdAndUpdate(event._id, { notificationSent: true });
                    } else {
                        console.warn(`[AVISO] Não foi possível notificar evento ${event.title}: Usuário ou e-mail faltando (ID: ${event.userId}).`);
                    }
                });

                // Espera por todas as operações em paralelo (resolve o missed execution)
                await Promise.all(notificationPromises); 
                console.log(`[SUCESSO] Notificação e marcação de ${eventsToNotify.length} eventos concluída em paralelo.`);
                
            } else {
                console.log('Nenhum evento pendente para notificação.');
            }

        } catch (error) {
            console.error('❌ ERRO no agendador de notificações:', error.message);
        }
    });

    console.log('✅ Agendador de notificações iniciado.');
};

module.exports = startNotificationScheduler;