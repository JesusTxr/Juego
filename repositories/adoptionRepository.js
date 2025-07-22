import Adoption from '../models/adoptionModel.js';

async function getAdoptions() {
    try {
        return await Adoption.find().populate('heroId').populate('petId');
    } catch (error) {
        console.error('Error obteniendo las adopciones:', error);
        return [];
    }
}

async function saveAdoption(adoptionData) {
    try {
        const adoption = new Adoption(adoptionData);
        const saved = await adoption.save();
        return saved;
    } catch (error) {
        console.error('Error guardando la adopción:', error);
        throw error;
    }
}

async function saveAdoptions(adoptionsArray) {
    try {
        for (const adoptionData of adoptionsArray) {
            await Adoption.updateOne({ id: adoptionData.id }, adoptionData, { upsert: true });
        }
        return true;
    } catch (error) {
        console.error('Error guardando el arreglo de adopciones:', error);
        throw error;
    }
}

export default {
    getAdoptions,
    saveAdoption,
    saveAdoptions
}; 