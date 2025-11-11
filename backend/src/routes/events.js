const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { check, validationResult } = require('express-validator');
const Event = require('../models/Event');

// @ROUTE: POST /api/events
// @DESC: Criar um novo evento
// @ACCESS: Privado
router.post(
    '/',
    [
        auth,
        [
            check('title', 'O título é obrigatório').not().isEmpty(),
            check('date', 'A data é obrigatória').not().isEmpty(),
        ]
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { title, description, date, category, priority, duration, completed = false } = req.body;

        try {
            const newEvent = new Event({
                user: req.user.id,
                title,
                description,
                date,
                category,
                priority,
                duration,
                completed
            });

            const event = await newEvent.save();
            res.status(201).json(event);

        } catch (err) {
            console.error(err.message);
            res.status(500).send('Erro no Servidor');
        }
    }
);

// @ROUTE: GET /api/events
// @DESC: Obter todos os eventos do usuário
// @ACCESS: Privado
router.get('/', auth, async (req, res) => {
    try {
        // Busca eventos do usuário autenticado, ordenando pelo mais recente primeiro
        const events = await Event.find({ user: req.user.id }).sort({ date: 1 });
        res.json(events);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no Servidor');
    }
});

// =========================================================================
// ==> NOVAS ROTAS DE DELETE E PUT <==
// =========================================================================

// @ROUTE: PUT /api/events/:id
// @DESC: Atualizar um evento existente
// @ACCESS: Privado
router.put('/:id', auth, async (req, res) => {
    // 1. Receber os campos que podem ser atualizados
    const { title, description, date, category, priority, duration, completed } = req.body;

    // Constrói o objeto com os novos campos
    const eventFields = {};
    if (title) eventFields.title = title;
    if (description) eventFields.description = description;
    if (date) eventFields.date = date;
    if (category) eventFields.category = category;
    if (priority) eventFields.priority = priority;
    if (duration) eventFields.duration = duration;
    // O campo 'completed' pode ser false, então verificamos se foi fornecido
    if (completed !== undefined) eventFields.completed = completed;


    try {
        let event = await Event.findById(req.params.id);

        if (!event) return res.status(404).json({ msg: 'Evento não encontrado' });

        // 2. Garantir que o usuário é o dono do evento
        if (event.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Não autorizado' });
        }

        // 3. Atualizar o evento
        event = await Event.findByIdAndUpdate(
            req.params.id,
            { $set: eventFields }, // Usamos $set para atualizar apenas os campos fornecidos
            { new: true } // Retorna o documento atualizado
        );

        res.json(event);

    } catch (err) {
        console.error(err.message);
        // Se o ID for mal formatado, o findById lança um erro, tratamos como 404/500
        res.status(500).send('Erro no Servidor');
    }
});

// @ROUTE: DELETE /api/events/:id
// @DESC: Excluir um evento
// @ACCESS: Privado
router.delete('/:id', auth, async (req, res) => {
    try {
        let event = await Event.findById(req.params.id);

        if (!event) return res.status(404).json({ msg: 'Evento não encontrado' });

        // 1. Garantir que o usuário é o dono do evento
        if (event.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Não autorizado' });
        }

        // 2. Remover o evento
        await Event.findByIdAndDelete(req.params.id);

        res.json({ msg: 'Evento removido com sucesso' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no Servidor');
    }
});


module.exports = router;