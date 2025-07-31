import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import { config } from '../config.js';

const router = express.Router();

/**
 * @swagger
 * /users/register:
 *   post:
 *     summary: Registro de usuario
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: superman@gmail.com
 *               password:
 *                 type: string
 *                 example: superman123
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *       400:
 *         description: Email y contraseña son requeridos
 *       409:
 *         description: El email ya está registrado
 */
// Registro de usuario
router.post('/register', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ error: 'El email ya está registrado' });
        }
        // Calcular el id numérico incremental único
        const lastUser = await User.findOne().sort({ id: -1 });
        const nextId = lastUser && lastUser.id ? lastUser.id + 1 : 1;
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ email, password: hashedPassword, id: nextId });
        await newUser.save();
        // Generar token para el nuevo usuario
        const token = jwt.sign({ 
            id: newUser.id, 
            email: newUser.email,
            sessionId: Date.now() + Math.random().toString(36).substr(2, 9)
        }, config.JWT_SECRET, { expiresIn: '24h' });
        
        // Solo usar .toObject si existe
        const userObj = typeof newUser.toObject === 'function' ? newUser.toObject() : newUser;
        const { _id, __v, password: pw, ...cleanUser } = userObj;
        res.status(201).json({ token, user: cleanUser });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: Login de usuario
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: superman@gmail.com
 *               password:
 *                 type: string
 *                 example: superman123
 *     responses:
 *       200:
 *         description: Token JWT
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       400:
 *         description: Email y contraseña son requeridos
 *       404:
 *         description: Usuario no encontrado
 *       401:
 *         description: Contraseña incorrecta
 */
// Login de usuario
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Contraseña incorrecta' });
        }
        const token = jwt.sign({ 
            id: user.id, 
            email: user.email,
            sessionId: Date.now() + Math.random().toString(36).substr(2, 9)
        }, config.JWT_SECRET, { expiresIn: '24h' });
        const userObj = typeof user.toObject === 'function' ? user.toObject() : user;
        const { _id, __v, password: userPassword, ...cleanUser } = userObj;
        res.json({ token, user: cleanUser });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /users/profile:
 *   get:
 *     summary: Obtiene el perfil del usuario autenticado
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil del usuario
 *       401:
 *         description: No autorizado
 */
// Obtener perfil del usuario
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const user = await User.findOne({ id: req.user.id });
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        const userObj = typeof user.toObject === 'function' ? user.toObject() : user;
        const { _id, __v, password, ...cleanUser } = userObj;
        res.json(cleanUser);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Middleware para verificar JWT
function authMiddleware(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token no proporcionado' });
    jwt.verify(token, config.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Token inválido' });
        req.user = user;
        next();
    });
}

export default router; 