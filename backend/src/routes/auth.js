// =======================================================
// DEPENDÊNCIAS (Imports)
// Mantenha todos os 'requires' no topo para Clean Code.
// =======================================================
const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator'); // NOVO: Para validação de dados
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken'); 
const crypto = require('crypto'); // NOVO: Para gerar o código de recuperação

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
            name: nome, 
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
        
        res.json(user); 
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no Servidor');
    }
});

// -------------------------------------------------------------------
// --- ROTAS DE RECUPERAÇÃO DE SENHA (NOVAS) ---
// -------------------------------------------------------------------

// ====================================================================
// ROTA 1: POST /api/auth/recovery-email
// Função: Recebe o email, gera um código e salva no banco.
// ====================================================================
router.post('/recovery-email', [
    check('email', 'Por favor, inclua um email válido').isEmail()
], async (req, res) => {
    console.log(`[DEBUG 1] Rota /recovery-email atingida para o email: ${req.body.email}`);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ msg: errors.array()[0].msg });
    }

    const { email } = req.body;

    try {
        // 1. Encontra o usuário pelo e-mail
        let user = await User.findOne({ email });

        if (!user) {
            console.log(`[DEBUG 2] Usuário NÃO ENCONTRADO para ${email}. Retornando 200 OK por segurança.`);
            return res.status(200).json({ msg: 'Instruções de recuperação enviadas (se o email estiver registrado).' });
        }
        
        console.log(`[DEBUG 2] Usuário ENCONTRADO: ${user.name}. Prosseguindo...`);

        // 2. A função randomInt gera um número aleatório seguro de 6 dígitos (100000 até 999999)
        const recoveryCode = crypto.randomInt(100000, 999999).toString();
        
        // 3. Define a expiração (1 hora)
        const expirationTime = Date.now() + 3600000; 

        // 4. Atribui os valores ao objeto Mongoose
        user.resetPasswordCode = recoveryCode;
        user.resetPasswordExpires = expirationTime;
        
        console.log(`[DEBUG 3] Código gerado: ${recoveryCode}. Tentando salvar no DB...`);

        // TENTA SALVAR O USUÁRIO
        await user.save();
        
        console.log(`[DEBUG 4 - SUCESSO DE SAVE] Usuário salvo com o código.`);

        // 5. Simula o envio de e-mail (O CÓDIGO APARECE AQUI)
        console.log(`\n\n[SIMULAÇÃO] Código de recuperação para ${email}: ${recoveryCode}\n\n`);

        return res.status(200).json({ msg: 'Código de recuperação enviado com sucesso.' });

    } catch (err) {
        // SE HOUVER UM ERRO DURANTE user.save(), ESTE LOG DEVE APARECER
        console.error(`\n\n❌ [ERRO CRÍTICO] Falha na execução da rota /recovery-email: ${err.message}\n\n`);
        // O Front-end deve receber um 500, não um 200.
        res.status(500).json({ msg: 'Erro interno do servidor. Consulte o log para detalhes.' });
    }
});

// ====================================================================
// ROTA 2: POST /api/auth/validate-code
// Função: Verifica se o código é válido e não expirou.
// ====================================================================
router.post('/validate-code', [
    check('email', 'Email é obrigatório').isEmail(),
    check('code', 'O código deve ter 6 dígitos').isLength({ min: 6, max: 6 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ msg: errors.array()[0].msg });
    }

    const { email, code } = req.body;

    try {
        let user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ msg: 'Usuário não encontrado.' });
        }

        // 1. Verifica se o código bate E se não expirou
        if (user.resetPasswordCode !== code || user.resetPasswordExpires < Date.now()) {
            // Opcional: Limpa o código para evitar que continue válido após falha na tentativa
            user.resetPasswordCode = undefined;
            user.resetPasswordExpires = undefined;
            await user.save();
            return res.status(400).json({ msg: 'Código inválido ou expirado. Comece novamente.' });
        }

        // Se o código for válido:
        res.status(200).json({ msg: 'Código validado com sucesso.' });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Erro interno do servidor.' });
    }
});

// ====================================================================
// ROTA 3: POST /api/auth/reset-password
// Função: Recebe a nova senha, criptografa e salva.
// ====================================================================
router.post('/reset-password', [
    check('email', 'Email é obrigatório').isEmail(),
    check('code', 'Código é obrigatório').exists(),
    check('newPassword', 'A senha deve ter 6 ou mais caracteres').isLength({ min: 6 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ msg: errors.array()[0].msg });
    }

    const { email, code, newPassword } = req.body;

    try {
        let user = await User.findOne({ email }).select('+password'); // Garante que a senha seja buscada

        if (!user) {
            return res.status(404).json({ msg: 'Usuário não encontrado.' });
        }

        // 1. Revalida o código
        if (user.resetPasswordCode !== code || user.resetPasswordExpires < Date.now()) {
            return res.status(400).json({ msg: 'Código inválido ou expirado. Reinicie o processo.' });
        }

        // 2. Criptografa a nova senha
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        
        // 3. Limpa os campos de recuperação
        user.resetPasswordCode = undefined;
        user.resetPasswordExpires = undefined;
        
        // 4. Salva o usuário com a nova senha
        await user.save();

        res.status(200).json({ msg: 'Senha redefinida com sucesso!' });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Erro interno do servidor.' });
    }
});

module.exports = router;