import express from "express";
import { check, validationResult } from 'express-validator';
import heroService from "../services/heroServices.js";
import Hero from "../models/heroModel.js";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = express.Router();

/**
 * @swagger
 * /heroes:
 *   get:
 *     summary: Obtiene todos los superhéroes
 *     tags: [Heroes]
 *     responses:
 *       200:
 *         description: Lista de superhéroes
 */
// Middleware para verificar JWT
function authMiddleware(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token no proporcionado' });
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Token inválido' });
        req.user = user;
        next();
    });
}

// Utilidad para limpiar héroe
function limpiarHeroe(hero) {
    if (!hero) return hero;
    const obj = hero.toObject ? hero.toObject() : hero;
    const { _id, __v, ...rest } = obj;
    return rest;
}

// GET /heroes (protegido)
router.get('/heroes', authMiddleware, async (req, res) => {
    try {
        const heroes = await Hero.find({ userId: req.user.userId });
        const cleanHeroes = heroes.map(limpiarHeroe);
        res.json(cleanHeroes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /heroes:
 *   post:
 *     summary: Crea un nuevo superhéroe
 *     tags: [Heroes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - alias
 *             properties:
 *               name:
 *                 type: string
 *               alias:
 *                 type: string
 *               city:
 *                 type: string
 *               team:
 *                 type: string
 *     responses:
 *       201:
 *         description: Héroe creado
 *       400:
 *         description: Datos inválidos
 */
// Proteger POST /heroes para asociar el superhéroe al usuario autenticado
router.post('/heroes', authMiddleware, [
    check('name').not().isEmpty().withMessage('El nombre es requerido'),
    check('alias').not().isEmpty().withMessage('El alias es requerido')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        // Calcular el id numérico incremental único
        const lastHero = await Hero.findOne().sort({ id: -1 });
        const nextId = lastHero && lastHero.id ? lastHero.id + 1 : 1;
        const { name, alias, city, team } = req.body;
        const newHero = new Hero({ name, alias, city, team, userId: req.user.userId, id: nextId });
        await newHero.save();
        res.status(201).json(limpiarHeroe(newHero));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /heroes/{id}:
 *   put:
 *     summary: Actualiza un superhéroe existente
 *     tags: [Heroes]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del superhéroe
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               alias:
 *                 type: string
 *               city:
 *                 type: string
 *               team:
 *                 type: string
 *     responses:
 *       200:
 *         description: Héroe actualizado
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Héroe no encontrado
 */
// Proteger PUT /heroes/:id para que solo el dueño pueda modificar
router.put('/heroes/:id', authMiddleware, async (req, res) => {
    try {
        const hero = await Hero.findById(req.params.id);
        if (!hero) return res.status(404).json({ error: 'Superhéroe no encontrado' });
        if (hero.userId.toString() !== req.user.userId) {
            return res.status(403).json({ error: 'No tienes permiso para modificar este superhéroe' });
        }
        Object.assign(hero, req.body);
        await hero.save();
        res.json(limpiarHeroe(hero));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /heroes/{id}:
 *   delete:
 *     summary: Elimina un superhéroe
 *     tags: [Heroes]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del superhéroe
 *     responses:
 *       200:
 *         description: Héroe eliminado
 *       400:
 *         description: ID inválido
 *       404:
 *         description: Héroe no encontrado
 */
router.delete('/heroes/:id', async (req, res) => {
    if (isNaN(parseInt(req.params.id))) {
        return res.status(400).json({ error: 'ID inválido' });
    }
    try {
        const result = await heroService.deleteHero(req.params.id);
        res.json(limpiarHeroe(result));
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
});

/**
 * @swagger
 * /heroes/city/{city}:
 *   get:
 *     summary: Obtiene héroes por ciudad
 *     tags: [Heroes]
 *     parameters:
 *       - in: path
 *         name: city
 *         schema:
 *           type: string
 *         required: true
 *         description: Ciudad a buscar
 *     responses:
 *       200:
 *         description: Lista de héroes de la ciudad
 */
router.get('/heroes/city/:city', async (req, res) => {
  try {
    const heroes = await heroService.findHeroesByCity(req.params.city);
    const cleanHeroes = heroes.map(limpiarHeroe);
    res.json(cleanHeroes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /heroes/{id}/enfrentar:
 *   post:
 *     summary: Hace que un superhéroe enfrente a un villano
 *     tags: [Heroes]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del superhéroe
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - villain
 *             properties:
 *               villain:
 *                 type: string
 *     responses:
 *       200:
 *         description: Mensaje de enfrentamiento
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Héroe no encontrado
 */
router.post('/heroes/:id/enfrentar', async (req, res) => {
  if (!req.body.villain || req.body.villain.trim() === "") {
    return res.status(400).json({ error: 'El nombre del villano es requerido' });
  }
  if (isNaN(parseInt(req.params.id))) {
    return res.status(400).json({ error: 'ID inválido' });
  }
  try {
    const result = await heroService.faceVillain(req.params.id, req.body.villain);
    res.json({ message: result });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// Endpoint de registro
router.post('/register', async (req, res) => {
    const { name, alias, city, team, password } = req.body;
    if (!name || !alias || !password) {
        return res.status(400).json({ error: 'Nombre, alias y contraseña son requeridos' });
    }
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newHero = new Hero({ name, alias, city, team, password: hashedPassword });
        await newHero.save();
        res.status(201).json({ message: 'Registro exitoso' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Endpoint de login
router.post('/login', async (req, res) => {
    const { alias, password } = req.body;
    if (!alias || !password) {
        return res.status(400).json({ error: 'Alias y contraseña son requeridos' });
    }
    try {
        const hero = await Hero.findOne({ alias });
        if (!hero) {
            return res.status(404).json({ error: 'Superhéroe no encontrado' });
        }
        const isMatch = await bcrypt.compare(password, hero.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Contraseña incorrecta' });
        }
        const token = jwt.sign({ id: hero._id, alias: hero.alias }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
