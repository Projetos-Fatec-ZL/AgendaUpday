const cron = require('node-cron');
const Event = require('../models/Event');
const User = require('../models/User'); 
const { sendEventNotificationEmail } = require('./notificationService'); 

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
                
                const notificationPromises = eventsToNotify.map(async (event) => {
                    // ✅ 1. CORREÇÃO ID: Usa event.userId para obter o ID de ligação
                    const userIdToFind = event.userId; 
                    
                    // Busca o usuário associado para obter o e-mail
                    const user = await User.findById(userIdToFind).select('email name'); 
                    
                    if (user && user.email) {
                        // 1. Chama o serviço REAL de envio de e-mail
                        await sendEventNotificationEmail(user, event);

                        // 2. Marca o evento como notificado (para evitar reenvio)
                        // 💡 CORREÇÃO VALIDAÇÃO: Força a inclusão do userId e usa a opção 'runValidators: false'
                        await Event.findByIdAndUpdate(
                            event._id, 
                            { 
                                notificationSent: true,
                                userId: event.userId // Garante que o campo obrigatório esteja presente
                            }, 
                            { new: true, runValidators: false } // Desativa validadores para este update simples
                        );
                    } else {
                        // Avisa qual evento falhou
                        console.warn(`[AVISO] Não foi possível notificar evento ${event.title}: Usuário ou e-mail faltando (ID do Evento: ${event._id}).`);
                    }
                });

                // Espera por todas as operações em paralelo
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