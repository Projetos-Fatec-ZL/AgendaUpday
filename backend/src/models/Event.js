const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
    // 1. Campos principais do Evento
    title: {
        type: String,
        required: [true, 'O título do evento é obrigatório.'],
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    date: {
        type: Date,
        required: [true, 'A data e hora do evento são obrigatórias.'],
    },
    category: {
        type: String,
        enum: ['estudo', 'prova', 'trabalho', 'sono', 'exercicio', 'evento'], // Sugestão de categorias
        default: 'outros',
    },
    priority: {
        type: String,
        enum: ['baixa', 'media', 'alta'], // Sugestão de prioridades
        default: 'media',
    },
    duration: {
        type: Number, 
        // default: 0, 
    },
    
    // 2. Chave de Ligação (Crucial para o JWT Middleware)
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Referencia a coleção 'User'
        required: true,
    },
    
    // 3. Campo de Controle (Mitigação de Riscos/Notificações)
    notificationSent: {
        type: Boolean,
        default: false, // Indica se o lembrete já foi enviado.
    },

    // NOVOS CAMPOS PARA O STATUS DE CONCLUSÃO
    isCompleted: {
        type: Boolean,
        default: false, // Por padrão, o evento não está concluído
        index: true, 
    },
    completedAt: {
        type: Date,
        default: null, // Será preenchido apenas quando isCompleted for true
    },
    // FIM DOS NOVOS CAMPOS
    
    // 4. Metadados
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    }
}, { timestamps: true }); // Adiciona createdAt e updatedAt automaticamente

module.exports = mongoose.model('Event', EventSchema);