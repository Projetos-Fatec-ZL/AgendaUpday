const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // O Middleware de proteção!
const Event = require('../models/Event'); // O Modelo que acabamos de criar

// @route   POST /api/events
// @desc    Cria um novo evento para o usuário logado
// @access  Privado (Requer Token JWT)
router.post('/', auth, async (req, res) => {
    // 💡 A mágica está aqui: 'auth' é executado primeiro. 
    // Se o token for válido, req.user terá o ID do usuário.
    try {
        const { title, description, date, category, priority } = req.body;

        // 1. Cria o novo evento, vinculando-o ao ID do usuário logado
        const newEvent = new Event({
            title,
            description,
            date,
            category,
            priority,
            userId: req.user.id // Pega o ID injetado pelo Middleware 'auth'
        });

        // 2. Salva o evento no MongoDB
        const event = await newEvent.save();

        // 3. Retorna o evento criado
        res.status(201).json(event);

    } catch (err) {
        console.error(err.message);
        // Retorna 400 Bad Request se houver erro de validação (ex: título faltando)
        res.status(400).send('Erro ao criar evento: ' + err.message);
    }
});

// @route   GET /api/events
// @desc    Obtém todos os eventos do usuário logado
// @access  Privado (Requer Token JWT)
router.get('/', auth, async (req, res) => {
    try {
        // Busca todos os eventos onde o campo 'userId' é igual ao ID do usuário logado (req.user.id)
        const events = await Event.find({ userId: req.user.id }).sort({ date: 1 });
        
        // 1. O método .find() do Mongoose executa a busca.
        // 2. O .sort({ date: 1 }) organiza os eventos por data ascendente (os mais próximos primeiro).

        res.json(events);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no Servidor');
    }
});

// =======================================================
// @route   PUT /api/events/:id/toggle-completed
// @desc    Alterna o status de conclusão (isCompleted) de um evento.
// @access  Privado (Requer Token JWT e propriedade do evento)
// =======================================================
router.put('/:id/toggle-completed', auth, async (req, res) => {
    try {
        const eventId = req.params.id;
        const userId = req.user.id; // O ID do usuário logado do JWT
        
        // 1. Buscar o evento para verificar o status atual e garantir que pertence ao usuário
        const event = await Event.findOne({ _id: eventId, userId: userId });

        if (!event) {
            return res.status(404).json({ msg: 'Evento não encontrado ou não pertence a este usuário.' });
        }
        
        // 2. Alternar o status e definir a data de conclusão
        const newStatus = !event.isCompleted;
        // Preenche a data se concluído (true), ou limpa (null) se reaberto (false)
        const completedAt = newStatus ? new Date() : null; 
        
        // 3. Atualizar o evento no banco de dados
        const updatedEvent = await Event.findByIdAndUpdate(
            eventId,
            { 
                isCompleted: newStatus,
                completedAt: completedAt,
            },
            { new: true } // Retorna o documento atualizado
        );

        // 4. Retorna o evento atualizado para o frontend
        res.json(updatedEvent);

    } catch (err) {
        console.error('Erro ao alternar status do evento:', err.message);
        // Em caso de ID mal formatado
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ msg: 'ID de evento inválido.' });
        }
        res.status(500).send('Erro no servidor');
    }
});


// @route   PUT /api/events/:id
// @desc    Atualiza um evento existente pelo ID (para edição de detalhes)
// @access  Privado (Requer Token JWT e propriedade do evento)
router.put('/:id', auth, async (req, res) => {
    try {
        // 1. Encontrar o evento pelo ID (do URL)
        let event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ msg: 'Evento não encontrado.' });
        }

        // 2. VERIFICAÇÃO DE PROPRIEDADE CRUCIAL!
        // O ID do evento (event.userId) deve ser igual ao ID do usuário logado (req.user.id)
        if (event.userId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Não autorizado. Você não é o proprietário deste evento.' });
        }

        // 3. Atualizar o evento
        // { new: true } retorna o documento atualizado
        event = await Event.findByIdAndUpdate(
            req.params.id, 
            { $set: req.body }, 
            { new: true }
        );

        res.json(event);

    } catch (err) {
        console.error(err.message);
        // Se o ID for inválido (formatado errado), retorna 400
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ msg: 'ID de evento inválido.' });
        }
        res.status(500).send('Erro no Servidor');
    }
});

// @route   DELETE /api/events/:id
// @desc    Exclui um evento pelo ID
// @access  Privado (Requer Token JWT e propriedade do evento)
router.delete('/:id', auth, async (req, res) => {
    try {
        // 1. Encontrar o evento pelo ID
        let event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ msg: 'Evento não encontrado.' });
        }

        // 2. VERIFICAÇÃO DE PROPRIEDADE CRUCIAL!
        // Garante que o usuário só possa excluir o próprio evento.
        if (event.userId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Não autorizado. Você não é o proprietário deste evento.' });
        }

        // 3. Excluir o evento
        await Event.findByIdAndDelete(req.params.id);

        res.json({ msg: 'Evento removido com sucesso!' });

    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ msg: 'ID de evento inválido.' });
        }
        res.status(500).send('Erro no Servidor');
    }
});


module.exports = router;