// =======================================================
// DEPENDÊNCIAS (Imports)
// Mantenha todos os 'requires' no topo para Clean Code.
// =======================================================
const express = require('express');
const router = express.Router();

const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken'); 

// Modelos e Middlewares
const User = require('../models/User'); 
const auth = require('../middleware/auth'); // Middleware de autenticação

// =======================================================
// ROTA: POST /api/auth/register (Cadastro de Usuário)
// Status 201: Criado
// =======================================================
router.post('/register', async (req, res) => {
    const { nome, email, senha } = req.body;

    try {
        // 1. Verificar se o usuário já existe
        let user = await User.findOne({ email });

        if (user) {
            return res.status(400).json({ msg: 'Usuário já existe.' });
        }

        // 2. Criar nova instância
        user = new User({
            name: nome, // Garanta que seu modelo User tem o campo 'name'
            email,
            password: senha
        });

        // 3. Hash da senha
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(senha, salt);

        // 4. Salvar o usuário
        await user.save();

        res.status(201).json({ 
            msg: 'Usuário registrado com sucesso!', 
            userId: user._id 
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no Servidor');
    }
});

// =======================================================
// ROTA: POST /api/auth/login (Login de Usuário)
// Status 200: Sucesso (Retorna JWT)
// =======================================================
router.post('/login', async (req, res) => {
    const { email, senha } = req.body;

    try {
        // 1. Verificar usuário e buscar a senha
        // .select('+password') é crucial aqui.
        let user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(400).json({ msg: 'Credenciais inválidas.' });
        }

        // 2. Comparar a senha
        const isMatch = await bcrypt.compare(senha, user.password);

        if (!isMatch) {
            return res.status(400).json({ msg: 'Credenciais inválidas.' });
        }

        // 3. Gerar o JWT
        const payload = {
            user: {
                id: user.id 
            }
        };
        
        // Assina o token e retorna
        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1h' }, // Expiração em 1 hora
            (err, token) => {
                if (err) throw err;
                res.json({ token }); 
            }
        );

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no Servidor');
    }
});


// =======================================================
// ROTA: GET /api/auth (Obter dados do usuário logado)
// Status 200: Sucesso (Retorna objeto do Usuário)
// =======================================================
router.get('/', auth, async (req, res) => {
    try {
        // req.user.id é obtido do Token JWT validado pelo middleware 'auth'
        const user = await User.findById(req.user.id).select('-password'); 
        
        // Esta rota fornece o objeto que o Front-end (fetchUserName) usa para exibir o nome.
        res.json(user); 
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no Servidor');
    }
});

module.exports = router;