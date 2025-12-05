const mongoose = require('mongoose');

// 1. Define o Subdocumento para Preferências de Notificação
const NotificationPreferencesSchema = new mongoose.Schema({
    email: { 
        type: Boolean, 
        default: true 
    },
    telegram: { 
        type: Boolean, 
        default: false 
    },
    advanceTime: { 
        type: Number, 
        default: 24 // Horas de antecedência
    }
});

// 2. Define o Schema Principal do Usuário
const UserSchema = new mongoose.Schema({
    // ... Campos existentes (name, email, password) ...
    name: {
        type: String,
        required: [true, 'O nome é obrigatório.'], 
    },
    email: {
        type: String,
        required: [true, 'O e-mail é obrigatório.'],
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: [true, 'A senha é obrigatória.'],
        select: false
    },
    
    // CAMPOS DE RECUPERAÇÃO DE SENHA (NOVOS)
    resetPasswordCode: {
        type: String,
        required: false, // Não é obrigatório
        default: undefined // Será preenchido apenas durante o processo de recuperação
    },
    resetPasswordExpires: {
        type: Date,
        required: false, // Não é obrigatório
        default: undefined
    },

    notificationPreferences: NotificationPreferencesSchema, // Subdocumento definido acima.
    
    // Campos de metadados
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    }
});

// Atualiza automaticamente o campo 'updatedAt' em cada salvamento
UserSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('User', UserSchema);