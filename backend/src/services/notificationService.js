// backend/src/services/notificationService.js

const nodemailer = require('nodemailer');

// 1. Configuração do Transporter (GMAIL)
// O Nodemailer usará as variáveis EMAIL_USER (seu_gmail@gmail.com) e EMAIL_PASS (jewp wjmp qnji roqr) do seu .env
const transporter = nodemailer.createTransport({
    service: 'gmail', // <-- MUDANÇA CRUCIAL: Usa as configurações padrão do Gmail
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS, 
    }
});

/**
 * Envia um e-mail de notificação de evento para o usuário.
 * Esta função é chamada pelo notificationScheduler.
 * @param {Object} user - Objeto do usuário (deve conter 'email' e 'name').
 * @param {Object} event - Objeto do evento.
 */
async function sendEventNotificationEmail(user, event) {
    if (!user || !user.email) {
        console.warn(`Aviso: Usuário associado ao evento ${event.user} não possui e-mail válido.`);
        return;
    }

    // 2. Formatação da Data e Conteúdo do E-mail
    const eventDate = new Date(event.date).toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit',
    });

    const mailOptions = {
        from: `"AgendaUpday" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: `Lembrete: Seu evento "${event.title}" está próximo!`,
        html: `
            <h1>Lembrete de Evento</h1>
            <p>Olá ${user.name || 'usuário'},</p>
            <p>Seu evento <b>${event.title}</b> está agendado para:</p>
            
            <p>📅 <b>Data e Hora:</b> ${eventDate}</p>
            <p>⏳ <b>Duração:</b> ${event.duration} minutos</p>
            
            <p>Atenciosamente, AgendaUpday Team.</p>
        `,
    };

    // 3. Tentativa de Envio
    try {
        let info = await transporter.sendMail(mailOptions);
        console.log(`✅ E-mail de notificação enviado para ${user.email}. ID: ${info.messageId}`);
    } catch (error) {
        // Se a senha do aplicativo (EMAIL_PASS) estiver errada, o erro aparecerá aqui!
        console.error('❌ ERRO FATAL ao enviar e-mail (Verifique EMAIL_PASS):', error.message);
        throw new Error(`Falha ao enviar e-mail: ${error.message}`); 
    }
}

// 4. Exportação Correta
// Exportamos a função dentro de um objeto nomeado, o que resolve o erro "is not a function"
module.exports = {
    sendEventNotificationEmail,
};