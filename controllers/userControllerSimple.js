import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

const router = express.Router();

// Almacenamiento en memoria para usuarios
const users = [];
let nextUserId = 1;

// Registro de usuario
router.post('/register', async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }
    
    try {
        // Verificar si el usuario ya existe
        const existingUser = users.find(user => user.email === email);
        if (existingUser) {
            return res.status(409).json({ error: 'El email ya está registrado' });
        }
        
        // Crear nuevo usuario
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = {
            id: nextUserId++,
            email,
            password: hashedPassword,
            createdAt: new Date()
        };
        
        users.push(newUser);
        
        // Retornar usuario sin contraseña
        const { password: _, ...cleanUser } = newUser;
        res.status(201).json(cleanUser);
        
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Login de usuario
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }
    
    try {
        // Buscar usuario
        const user = users.find(u => u.email === email);
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        // Verificar contraseña
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Contraseña incorrecta' });
        }
        
        // Generar token
        const token = jwt.sign({ 
            id: user.id, 
            email: user.email,
            sessionId: Date.now() + Math.random().toString(36).substr(2, 9)
        }, config.JWT_SECRET, { expiresIn: '24h' });
        
        // Retornar token y usuario sin contraseña
        const { password: _, ...cleanUser } = user;
        res.json({ token, user: cleanUser });
        
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Obtener perfil del usuario
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const user = users.find(u => u.id === req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        const { password, ...cleanUser } = user;
        res.json(cleanUser);
        
    } catch (error) {
        console.error('Error obteniendo perfil:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Middleware para verificar JWT
function authMiddleware(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Token no proporcionado' });
    }
    
    jwt.verify(token, config.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido' });
        }
        req.user = user;
        next();
    });
}

export default router; 