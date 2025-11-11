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
        enum: ['estudo', 'trabalho', 'pessoal', 'outros'],
        default: 'outros',
    },
    priority: {
        type: String,
        enum: ['baixa', 'media', 'alta'],
        default: 'media',
    },
    // 2. Chave de Ligação CORRIGIDA: Renomeado de 'userId' para 'user'
    user: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', 
        required: true,
    },
    
    // 3. Campo de Controle (Mitigação de Riscos/Notificações)
    notificationSent: {
        type: Boolean,
        default: false, 
    },
    // Adicione o campo 'duration' e 'completed' se eles foram omitidos
    duration: {
        type: Number,
        default: 60,
    },
    completed: {
        type: Boolean,
        default: false,
    },

    // 4. Metadados (Removendo 'timestamps: true' pois você já definiu 'createdAt' e 'updatedAt')
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    }
}, { timestamps: false }); // Mantenha 'timestamps: false' ou remova os campos acima

module.exports = mongoose.model('Event', EventSchema);