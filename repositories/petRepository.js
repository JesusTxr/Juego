import Pet from '../models/petModel.js';
import fs from 'fs-extra';

async function getPets() {
    try {
        return await Pet.find();
    } catch (error) {
        console.error('Error obteniendo las mascotas:', error);
        return [];
    }
}

async function savePet(petData) {
    try {
        const pet = new Pet(petData);
        const saved = await pet.save();
        await syncPetsJson();
        return saved;
    } catch (error) {
        console.error('Error guardando la mascota:', error);
        throw error;
    }
}

// Guarda un arreglo de mascotas (upsert masivo)
async function savePets(petsArray) {
    try {
        for (const petData of petsArray) {
            await Pet.updateOne({ id: petData.id }, petData, { upsert: true });
        }
        await syncPetsJson();
        return true;
    } catch (error) {
        console.error('Error guardando el arreglo de mascotas:', error);
        throw error;
    }
}

// Sincroniza el archivo data/pets.json con la base de datos
async function syncPetsJson() {
    const allPets = await Pet.find();
    await fs.writeJson('./data/pets.json', allPets, { spaces: 2 });
}

export default {
    getPets,
    savePet,
    savePets
}; 