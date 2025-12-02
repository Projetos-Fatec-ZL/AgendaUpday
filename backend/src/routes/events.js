const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); 
const Event = require('../models/Event');
const mongoose = require('mongoose');

// Função auxiliar para calcular as datas de início e fim com base no timeframe
const getTimeRange = (timeframe) => {
    const now = new Date();
    const start = new Date(now);
    let end = new Date(now);
    
    // Configura o ponto inicial (start)
    switch (timeframe) {
        case 'day':
            start.setHours(0, 0, 0, 0); 
            end.setHours(23, 59, 59, 999);
            break;
        case 'week':
            // Ajusta para o início da semana (Domingo).
            start.setDate(now.getDate() - now.getDay()); 
            start.setHours(0, 0, 0, 0);
            end = new Date(start);
            end.setDate(end.getDate() + 6); // Fim da semana (Sábado)
            end.setHours(23, 59, 59, 999);
            break;
        case 'month':
            start.setDate(1); 
            start.setHours(0, 0, 0, 0);
            
            // Calcula o último dia do mês atual
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            end.setHours(23, 59, 59, 999);
            break;
        case 'year':
            start.setMonth(0); 
            start.setDate(1); 
            start.setHours(0, 0, 0, 0);

            // Último dia do ano atual
            end = new Date(now.getFullYear(), 11, 31);
            end.setHours(23, 59, 59, 999);
            break;
        case 'all':
        default:
            // Para 'all' ou indefinido, queremos todos os eventos.
            // Retorna shouldApplyFilter: false para ignorar o filtro de data na rota /metrics.
            return { start: new Date(1900, 0, 1), end: new Date(2100, 0, 1), shouldApplyFilter: false };
    }
    
    return { start, end, shouldApplyFilter: true };
};


// =======================================================
// @route   GET /api/events/metrics
// @desc    Obtém dados agregados para gráficos (Contagem de Eventos por Categoria com Filtros)
// @access  Privado
// =======================================================
router.get('/metrics', auth, async (req, res) => {
    try {
        const userId = req.user.id; 
        const { timeframe, status } = req.query; 

        // --- 1. CONSTRUÇÃO DO FILTRO $match ---
        const matchStage = { userId: new mongoose.Types.ObjectId(userId) };
        
        // a) Filtro de Status
        // O filtro de status só é aplicado se for 'concluido' ou 'pendente' (e não 'todos')
        if (status && status !== 'todos') { 
            if (status === 'concluido') {
                matchStage.isCompleted = true;
            } else if (status === 'pendente') {
                matchStage.isCompleted = false;
            }
        }

        // b) Filtro de Tempo (Baseado no campo 'date')
        if (timeframe) {
            const { start, end, shouldApplyFilter } = getTimeRange(timeframe);
            
            if (shouldApplyFilter) {
                 // Aplica o filtro de data SOMENTE se shouldApplyFilter for true
                 matchStage.date = { $gte: start, $lte: end };
            }
        }
        
        // --- 2. PIPELINE DE AGREGAÇÃO ---
        const pipeline = [
            // $match: Filtra os documentos
            { $match: matchStage },
            
            // $group: Agrupa pelo campo 'category' e conta.
            {
                $group: {
                    _id: '$category', 
                    count: { $sum: 1 } 
                }
            },
            
            // $project: Formata o resultado para o frontend
            {
                $project: {
                    _id: 0, 
                    category: '$_id', 
                    count: '$count'
                }
            }
        ];

        const metrics = await Event.aggregate(pipeline);

        res.json(metrics);

    } catch (err) {
        console.error('Erro na agregação de métricas:', err); 
        res.status(500).send('Erro no Servidor ao buscar métricas.');
    }
});


// As outras rotas (POST, GET, PUT, DELETE) permanecem inalteradas
router.post('/', auth, async (req, res) => {
    try {
        const { title, description, date, category, priority } = req.body;
        const newEvent = new Event({
            title, description, date, category, priority,
            userId: req.user.id
        });
        const event = await newEvent.save();
        res.status(201).json(event);
    } catch (err) {
        console.error(err.message);
        res.status(400).send('Erro ao criar evento: ' + err.message);
    }
});

router.get('/', auth, async (req, res) => {
    try {
        const events = await Event.find({ userId: req.user.id }).sort({ date: 1 });
        res.json(events);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no Servidor');
    }
});

router.put('/:id/toggle-completed', auth, async (req, res) => {
    try {
        const eventId = req.params.id;
        const userId = req.user.id; 
        const event = await Event.findOne({ _id: eventId, userId: userId });

        if (!event) {
            return res.status(404).json({ msg: 'Evento não encontrado ou não pertence a este usuário.' });
        }
        
        const newStatus = !event.isCompleted;
        const completedAt = newStatus ? new Date() : null; 
        
        const updatedEvent = await Event.findByIdAndUpdate(
            eventId,
            { 
                isCompleted: newStatus,
                completedAt: completedAt,
            },
            { new: true } 
        );

        res.json(updatedEvent);
    } catch (err) {
        console.error('Erro ao alternar status do evento:', err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ msg: 'ID de evento inválido.' });
        }
        res.status(500).send('Erro no servidor');
    }
});


router.put('/:id', auth, async (req, res) => {
    try {
        let event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ msg: 'Evento não encontrado.' });
        }

        if (event.userId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Não autorizado. Você não é o proprietário deste evento.' });
        }

        event = await Event.findByIdAndUpdate(
            req.params.id, 
            { $set: req.body }, 
            { new: true }
        );

        res.json(event);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ msg: 'ID de evento inválido.' });
        }
        res.status(500).send('Erro no Servidor');
    }
});

router.delete('/:id', auth, async (req, res) => {
    try {
        let event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ msg: 'Evento não encontrado.' });
        }

        if (event.userId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Não autorizado. Você não é o proprietário deste evento.' });
        }

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