import adoptionRepository from '../repositories/adoptionRepository.js';
import heroRepository from '../repositories/heroRepository.js';
import petRepository from '../repositories/petRepository.js';
import Adoption from '../models/adoptionModel.js';

async function getAllAdoptions() {
    const adoptions = await adoptionRepository.getAdoptions();
    const heroes = await heroRepository.getHeroes();
    const pets = await petRepository.getPets();
    return adoptions.map(a => {
        const hero = heroes.find(h => h.id === parseInt(a.heroId));
        const pet = pets.find(p => p.id === parseInt(a.petId));
        return {
            ...a,
            id: parseInt(a.id), // Forzar id numérico
            hero: hero || null,
            pet: pet || null
        };
    });
}

async function addAdoption(adoption, userId) {
    // Convertir heroId y petId a número si vienen como string
    const heroId = parseInt(adoption.heroId);
    const petId = parseInt(adoption.petId);
    if (!heroId || !petId) {
        throw new Error('El id del héroe y de la mascota son requeridos y deben ser números válidos');
    }
    // Buscar héroe y mascota por id
    const heroes = await heroRepository.getHeroes();
    const pets = await petRepository.getPets();
    const hero = heroes.find(h => h.id === heroId);
    const pet = pets.find(p => p.id === petId);
    if (!hero) {
        throw new Error('No existe el héroe con ese id');
    }
    if (!pet) {
        throw new Error('No existe la mascota con ese id');
    }
    // Validar que el héroe pertenezca al usuario autenticado (si userId está presente)
    if (userId && hero.userId && hero.userId.toString() !== userId.toString()) {
        throw new Error('No tienes permiso para adoptar con este héroe');
    }
    const adoptions = await adoptionRepository.getAdoptions();
    // Validar que la mascota no haya sido adoptada antes
    const alreadyAdopted = adoptions.some(a => parseInt(a.petId) === petId);
    if (alreadyAdopted) {
        throw new Error('Esta mascota ya fue adoptada por otro superhéroe');
    }
    const newId = adoptions.length > 0 ? Math.max(...adoptions.map(a => a.id)) + 1 : 1;
    const fechaAdopcion = adoption.fechaAdopcion || new Date().toISOString();
    const newAdoption = { ...adoption, heroId, petId, id: newId, fechaAdopcion };
    adoptions.push(newAdoption);
    await adoptionRepository.saveAdoptions(adoptions);
    return newAdoption;
}

async function getAdoptionsByHero(heroId) {
    const adoptions = await adoptionRepository.getAdoptions();
    const heroes = await heroRepository.getHeroes();
    const pets = await petRepository.getPets();
    return adoptions
        .filter(a => a.heroId === parseInt(heroId))
        .map(a => {
            const hero = heroes.find(h => h.id === parseInt(a.heroId));
            const pet = pets.find(p => p.id === parseInt(a.petId));
            return {
                ...a,
                heroName: hero ? hero.name : null,
                petName: pet ? pet.name : null
            };
        });
}

async function getAdoptionsByPet(petId) {
    const adoptions = await adoptionRepository.getAdoptions();
    const heroes = await heroRepository.getHeroes();
    const pets = await petRepository.getPets();
    const adoption = adoptions.find(a => a.petId === parseInt(petId));
    if (!adoption) return null;
    const hero = heroes.find(h => h.id === parseInt(adoption.heroId));
    const pet = pets.find(p => p.id === parseInt(adoption.petId));
    return {
        ...adoption,
        heroName: hero ? hero.name : null,
        petName: pet ? pet.name : null
    };
}

export default {
    getAllAdoptions,
    addAdoption,
    getAdoptionsByHero,
    getAdoptionsByPet
}; 