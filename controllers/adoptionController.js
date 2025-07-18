import express from 'express';
import { check, validationResult } from 'express-validator';
import adoptionService from '../services/adoptionServices.js';
import Adoption from '../models/adoptionModel.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

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

// Utilidad para limpiar adopción
function limpiarAdopcion(adoption) {
    if (!adoption) return adoption;
    
    // Función auxiliar para limpiar cualquier objeto
    function limpiarObjeto(obj) {
        if (!obj) return obj;
        
        // Si es un documento de Mongoose
        if (obj.toObject) {
            const mongooseObj = obj.toObject();
            const { _id, __v, $__, $isNew, _doc, ...rest } = mongooseObj;
            return rest;
        }
        
        // Si es un objeto plano
        const { _id, __v, $__, $isNew, _doc, ...rest } = obj;
        return rest;
    }
    
    // Limpiar el objeto principal
    const adoptionLimpia = limpiarObjeto(adoption);
    
    // Limpiar el héroe si existe
    if (adoptionLimpia.hero) {
        adoptionLimpia.hero = limpiarObjeto(adoptionLimpia.hero);
    }
    
    // Limpiar la mascota si existe
    if (adoptionLimpia.pet) {
        adoptionLimpia.pet = limpiarObjeto(adoptionLimpia.pet);
    }
    
    return adoptionLimpia;
}

/**
 * @swagger
 * /adoptions:
 *   get:
 *     summary: Obtiene todas las adopciones
 *     tags: [Adopciones]
 *     responses:
 *       200:
 *         description: Lista de adopciones
 */
// Proteger el endpoint GET /adoptions para que solo devuelva las adopciones del usuario autenticado
router.get('/adoptions', authMiddleware, async (req, res) => {
    try {
        const adoptions = await adoptionService.getAllAdoptions();
        // Filtrar por userId del token (no id)
        const userAdoptions = adoptions.filter(adoption => {
            // Buscar el héroe asociado a esta adopción
            const hero = adoption.hero;
            return hero && hero.userId && hero.userId.toString() === req.user.userId;
        });
        const cleanAdoptions = userAdoptions.map(limpiarAdopcion);
        res.json(cleanAdoptions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /adoptions:
 *   post:
 *     summary: Crea una nueva adopción
 *     tags: [Adopciones]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - heroId
 *               - petId
 *             properties:
 *               heroId:
 *                 type: integer
 *               petId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Adopción creada
 *       400:
 *         description: Datos inválidos
 */
// Proteger el endpoint POST /adoptions para que solo el usuario autenticado pueda crear adopciones propias
router.post('/adoptions', authMiddleware, [
    check('petId').isInt().withMessage('El id de la mascota es requerido y debe ser un número')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const lastAdoption = await Adoption.findOne().sort({ id: -1 });
        const nextId = lastAdoption && lastAdoption.id ? lastAdoption.id + 1 : 1;
        const { heroId, petId } = req.body;
        const newAdoption = { heroId, petId, id: nextId };
        const addedAdoption = await adoptionService.addAdoption(newAdoption, req.user.userId || req.user.id);
        
        // Obtener la adopción completa con información del héroe y mascota
        const allAdoptions = await adoptionService.getAllAdoptions();
        const completeAdoption = allAdoptions.find(a => a.id === addedAdoption.id);
        
        res.status(201).json(limpiarAdopcion(completeAdoption));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router; 