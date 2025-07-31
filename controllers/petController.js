import express from 'express';
import { check, validationResult } from 'express-validator';
import petService from '../services/petServices.js';
import Pet from '../models/petModel.js';
import jwt from 'jsonwebtoken';
import heroService from '../services/heroServices.js';

const router = express.Router();

/**
 * @swagger
 * /pets:
 *   get:
 *     summary: Obtiene todas las mascotas
 *     tags: [Mascotas]
 *     responses:
 *       200:
 *         description: Lista de mascotas
 */
router.get('/pets', async (req, res) => {
    try {
        const pets = await petService.getAllPets();
        res.json(pets);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /pets:
 *   post:
 *     summary: Crea una nueva mascota
 *     tags: [Mascotas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - animal
 *               - superpower
 *             properties:
 *               name:
 *                 type: string
 *               animal:
 *                 type: string
 *               superpower:
 *                 type: string
 *     responses:
 *       201:
 *         description: Mascota creada
 *       400:
 *         description: Datos inválidos
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

// Utilidad para limpiar mascota
function limpiarMascota(pet) {
    if (!pet) return pet;
    const obj = typeof pet.toObject === 'function' ? pet.toObject() : pet;
    const { _id, __v, ...rest } = obj;
    return rest;
}

// GET /pets (protegido)
router.get('/pets', authMiddleware, async (req, res) => {
    try {
        const pets = await petService.getAllPets();
        const userPets = pets.filter(pet => pet.superheroeId && pet.superheroeId.toString() === req.user.id);
        const cleanPets = userPets.map(limpiarMascota);
        res.json(cleanPets);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /pets (protegido)
router.post('/pets', authMiddleware, [
    check('name').not().isEmpty().withMessage('El nombre es requerido'),
    check('animal').not().isEmpty().withMessage('El tipo de animal es requerido'),
    check('superpower').not().isEmpty().withMessage('El superpoder es requerido'),
    check('heroId').isInt().withMessage('El id del héroe es requerido y debe ser un número')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const lastPet = await Pet.findOne().sort({ id: -1 });
        const nextId = lastPet && lastPet.id ? lastPet.id + 1 : 1;
        const { name, animal, superpower, heroId } = req.body;
        const petData = { name, animal, superpower, superheroeId: heroId, id: nextId };
        const addedPet = await petService.addPet(petData);
        const obj = addedPet.toObject ? addedPet.toObject() : addedPet;
        const { __v, ...rest } = obj;
        res.status(201).json(rest);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /pets/{id}:
 *   put:
 *     summary: Actualiza una mascota existente
 *     tags: [Mascotas]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la mascota
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               animal:
 *                 type: string
 *               superpower:
 *                 type: string
 *     responses:
 *       200:
 *         description: Mascota actualizada
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Mascota no encontrada
 */
// PUT /pets/:id (protegido)
router.put('/pets/:id', authMiddleware, [
    check('name').optional().not().isEmpty().withMessage('El nombre no puede estar vacío'),
    check('animal').optional().not().isEmpty().withMessage('El tipo de animal no puede estar vacío'),
    check('superpower').optional().not().isEmpty().withMessage('El superpoder no puede estar vacío')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const pets = await petService.getAllPets();
        const pet = pets.find(p => p.id === parseInt(req.params.id));
        if (!pet) return res.status(404).json({ error: 'Mascota no encontrada' });
        const hero = await heroService.getHeroById(pet.superheroeId);
        if (!hero || hero.userId.toString() !== req.user.id.toString()) {
            return res.status(403).json({ error: 'No tienes permiso para modificar esta mascota' });
        }
        Object.assign(pet, req.body);
        await petService.updatePet(req.params.id, req.body);
        res.json(limpiarMascota(pet));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /pets/{id}:
 *   delete:
 *     summary: Elimina una mascota
 *     tags: [Mascotas]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la mascota
 *     responses:
 *       200:
 *         description: Mascota eliminada
 *       400:
 *         description: ID inválido
 *       404:
 *         description: Mascota no encontrada
 */
// DELETE /pets/:id (protegido)
router.delete('/pets/:id', authMiddleware, async (req, res) => {
    try {
        const pet = await petService.getPetById(req.params.id);
        if (!pet) return res.status(404).json({ error: 'Mascota no encontrada' });
        const hero = await heroService.getHeroById(pet.superheroeId);
        if (!hero || hero.userId.toString() !== req.user.id.toString()) {
            return res.status(403).json({ error: 'No tienes permiso para eliminar esta mascota' });
        }
        const result = await petService.deletePet(req.params.id);
        res.json(limpiarMascota(result));
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
});

/**
 * @swagger
 * /pets/{id}/status:
 *   get:
 *     summary: Obtiene el estado completo de la mascota (juego tipo Pou)
 *     tags: [Mascotas]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la mascota
 *     responses:
 *       200:
 *         description: Estado de la mascota
 *       404:
 *         description: Mascota no encontrada
 */
// GET /pets/:id/status
router.get('/pets/:id/status', authMiddleware, async (req, res) => {
    try {
        const pet = await petService.getPetById(req.params.id);
        if (!pet) return res.status(404).json({ error: 'Mascota no encontrada' });
        const hero = await heroService.getHeroById(pet.superheroeId);
        if (!hero || hero.userId.toString() !== req.user.id.toString()) {
            return res.status(403).json({ error: 'No tienes permiso para ver esta mascota' });
        }
        petService.aplicarPenalizacionEnfermedadSiEsNecesario(pet);
        await petService.updatePet(pet.id, pet);
        res.json(limpiarMascota(pet));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /pets/{id}/activity:
 *   post:
 *     summary: Realiza una actividad con la mascota (alimentar, pasear, bañar, jugar)
 *     tags: [Mascotas]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la mascota
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - actividad
 *             properties:
 *               actividad:
 *                 type: string
 *                 example: alimentar
 *     responses:
 *       200:
 *         description: Estado actualizado de la mascota
 *       400:
 *         description: Actividad requerida
 *       404:
 *         description: Mascota no encontrada
 */
// POST /pets/:id/activity
router.post('/pets/:id/activity', authMiddleware, async (req, res) => {
    const { actividad, effects } = req.body;
    if (!actividad) return res.status(400).json({ error: 'Actividad requerida' });
    try {
        const pets = await petService.getAllPets();
        const pet = pets.find(p => p.id === parseInt(req.params.id));
        if (!pet) return res.status(404).json({ error: 'Mascota no encontrada' });
        
        // Initialize pet stats if they don't exist
        pet.felicidad = pet.felicidad || 100;
        pet.vida = pet.vida || 100;
        pet.hambre = pet.hambre || 0;
        
        // Check for activity cooldown (prevent spam)
        const now = Date.now();
        const lastActivity = pet.lastActivity || {};
        const cooldownTime = 5000; // 5 seconds cooldown
        
        if (lastActivity[actividad] && (now - lastActivity[actividad]) < cooldownTime) {
            return res.status(429).json({ 
                error: 'Espera un poco antes de hacer esta actividad de nuevo',
                cooldown: cooldownTime - (now - lastActivity[actividad])
            });
        }
        
        // Update last activity time
        pet.lastActivity = pet.lastActivity || {};
        pet.lastActivity[actividad] = now;
        
        // Apply base effects to pet stats
        if (effects) {
            if (effects.happiness !== undefined) {
                pet.felicidad = Math.max(0, Math.min(100, pet.felicidad + effects.happiness));
            }
            if (effects.health !== undefined) {
                pet.vida = Math.max(0, Math.min(100, pet.vida + effects.health));
            }
            if (effects.hunger !== undefined) {
                pet.hambre = Math.max(0, Math.min(100, pet.hambre + effects.hunger));
            }
        }
        
        // Apply activity-specific logic for negative effects
        switch (actividad) {
            case 'alimentar':
                // Overfeeding can cause health issues
                if (pet.hambre < 20) {
                    pet.vida = Math.max(0, pet.vida - 5);
                    pet.felicidad = Math.max(0, pet.felicidad - 10);
                }
                break;
            case 'pasear':
                // Over-exercising can cause fatigue
                if (pet.felicidad > 80 && pet.vida < 50) {
                    pet.felicidad = Math.max(0, pet.felicidad - 15);
                }
                break;
            case 'bañar':
                // Over-bathing can cause stress
                if (pet.felicidad > 90) {
                    pet.felicidad = Math.max(0, pet.felicidad - 5);
                }
                break;
            case 'jugar':
                // Over-playing can cause exhaustion
                if (pet.felicidad > 85 && pet.vida < 60) {
                    pet.vida = Math.max(0, pet.vida - 8);
                    pet.felicidad = Math.max(0, pet.felicidad - 12);
                }
                break;
        }
        
        // Natural stat decay over time
        // This simulates the pet getting hungry and less happy over time
        pet.hambre = Math.min(100, pet.hambre + 2);
        if (pet.hambre > 70) {
            pet.felicidad = Math.max(0, pet.felicidad - 1);
        }
        
        // Update pet in database
        await petService.updatePet(pet.id, pet);
        res.json({ pet: limpiarMascota(pet) });
    } catch (error) {
        console.error('Error in activity endpoint:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /pets/{id}/item:
 *   post:
 *     summary: Usa un ítem en la mascota
 *     tags: [Mascotas]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la mascota
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - item
 *             properties:
 *               item:
 *                 type: object
 *                 properties:
 *                   nombre:
 *                     type: string
 *                   tipo:
 *                     type: string
 *                     example: free
 *                   efecto:
 *                     type: string
 *                     example: curar
 *     responses:
 *       200:
 *         description: Estado actualizado de la mascota
 *       400:
 *         description: Ítem requerido
 *       404:
 *         description: Mascota no encontrada
 */
// POST /pets/:id/item
router.post('/pets/:id/item', authMiddleware, async (req, res) => {
    const { itemType, cost } = req.body;
    if (!itemType) return res.status(400).json({ error: 'Tipo de ítem requerido' });
    try {
        const pets = await petService.getAllPets();
        const pet = pets.find(p => p.id === parseInt(req.params.id));
        if (!pet) return res.status(404).json({ error: 'Mascota no encontrada' });
        
        // Define item effects based on itemType
        const itemEffects = {
            comida_basica: { felicidad: 10, hambre: -20 },
            agua: { vida: 5, felicidad: 5 },
            gafas_neon: { felicidad: 15, vida: 5 },
            capa_roja: { felicidad: 25, vida: 10 },
            sombrero_magico: { felicidad: 30, vida: 15 }
        };
        
        const effects = itemEffects[itemType] || {};
        
        // Apply effects to pet
        if (effects.felicidad) {
            pet.felicidad = Math.max(0, Math.min(100, (pet.felicidad || 100) + effects.felicidad));
        }
        if (effects.vida) {
            pet.vida = Math.max(0, Math.min(100, (pet.vida || 100) + effects.vida));
        }
        if (effects.hambre !== undefined) {
            pet.hambre = Math.max(0, Math.min(100, (pet.hambre || 0) + effects.hambre));
        }
        
        // Add item to pet's inventory
        const itemString = `${itemType} - ${new Date().toISOString()}`;
        if (!pet.items) pet.items = [];
        pet.items.push(itemString);
        
        await petService.updatePet(pet.id, pet);
        res.json({ pet: limpiarMascota(pet) });
    } catch (error) {
        console.error('Error in item endpoint:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /pets/{id}/items:
 *   get:
 *     summary: Obtiene los ítems de la mascota
 *     tags: [Mascotas]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la mascota
 *     responses:
 *       200:
 *         description: Lista de ítems de la mascota
 *       404:
 *         description: Mascota no encontrada
 */
// ENDPOINT: Ver ítems
router.get('/pets/:id/items', authMiddleware, async (req, res) => {
    try {
        const pet = await petService.getPetById(req.params.id);
        if (!pet) return res.status(404).json({ error: 'Mascota no encontrada' });
        const hero = await heroService.getHeroById(pet.superheroeId);
        if (!hero || hero.userId.toString() !== req.user.id.toString()) {
            return res.status(403).json({ error: 'No tienes permiso para ver los ítems de esta mascota' });
        }
        res.json({ items: pet.items });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /pets/{id}/sick:
 *   post:
 *     summary: Enferma manualmente a la mascota (para pruebas)
 *     tags: [Mascotas]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la mascota
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - enfermedad
 *             properties:
 *               enfermedad:
 *                 type: string
 *                 example: gripe
 *     responses:
 *       200:
 *         description: Estado actualizado de la mascota
 *       400:
 *         description: Enfermedad requerida
 *       404:
 *         description: Mascota no encontrada
 */
// POST /pets/:id/sick
router.post('/pets/:id/sick', authMiddleware, async (req, res) => {
    const { enfermedad } = req.body;
    if (!enfermedad) return res.status(400).json({ error: 'Enfermedad requerida' });
    try {
        const pets = await petService.getAllPets();
        const pet = pets.find(p => p.id === parseInt(req.params.id));
        if (!pet) return res.status(404).json({ error: 'Mascota no encontrada' });
        const hero = await heroService.getHeroById(pet.superheroeId);
        if (!hero || hero.userId.toString() !== req.user.id.toString()) {
            return res.status(403).json({ error: 'No tienes permiso para modificar esta mascota' });
        }
        if (!pet.enfermedades.includes(enfermedad)) {
            pet.enfermedades.push(enfermedad);
        }
        petService.actualizarPersonalidad(pet);
        await petService.updatePet(pet.id, pet);
        res.json(limpiarMascota(pet));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /pets/{id}/cure:
 *   post:
 *     summary: Cura una enfermedad específica de la mascota
 *     tags: [Mascotas]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la mascota
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - enfermedad
 *             properties:
 *               enfermedad:
 *                 type: string
 *                 example: gripe
 *     responses:
 *       200:
 *         description: Estado actualizado de la mascota
 *       400:
 *         description: Enfermedad requerida
 *       404:
 *         description: Mascota no encontrada
 */
// POST /pets/:id/cure
router.post('/pets/:id/cure', authMiddleware, async (req, res) => {
    const { enfermedad } = req.body;
    if (!enfermedad) return res.status(400).json({ error: 'Enfermedad requerida' });
    try {
        const pets = await petService.getAllPets();
        const pet = pets.find(p => p.id === parseInt(req.params.id));
        if (!pet) return res.status(404).json({ error: 'Mascota no encontrada' });
        const hero = await heroService.getHeroById(pet.superheroeId);
        if (!hero || hero.userId.toString() !== req.user.id.toString()) {
            return res.status(403).json({ error: 'No tienes permiso para modificar esta mascota' });
        }
        pet.enfermedades = pet.enfermedades.filter(e => e !== enfermedad);
        petService.actualizarPersonalidad(pet);
        await petService.updatePet(pet.id, pet);
        res.json(limpiarMascota(pet));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /pets/{id}/personality:
 *   patch:
 *     summary: Cambia la personalidad de la mascota (solo para pruebas)
 *     tags: [Mascotas]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la mascota
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - personalidad
 *             properties:
 *               personalidad:
 *                 type: string
 *                 example: juguetón
 *     responses:
 *       200:
 *         description: Estado actualizado de la mascota
 *       400:
 *         description: Personalidad requerida
 *       404:
 *         description: Mascota no encontrada
 */
// PATCH /pets/:id/personality
router.patch('/pets/:id/personality', authMiddleware, async (req, res) => {
    const { personalidad } = req.body;
    if (!personalidad) return res.status(400).json({ error: 'Personalidad requerida' });
    try {
        const pets = await petService.getAllPets();
        const pet = pets.find(p => p.id === parseInt(req.params.id));
        if (!pet) return res.status(404).json({ error: 'Mascota no encontrada' });
        if (!pet.superheroeId || pet.superheroeId.toString() !== req.user.id) {
            return res.status(403).json({ error: 'No tienes permiso para modificar esta mascota' });
        }
        pet.personalidad = personalidad;
        await petService.updatePet(pet.id, pet);
        res.json(limpiarMascota(pet));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router; 