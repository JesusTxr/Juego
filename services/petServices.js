import petRepository from '../repositories/petRepository.js';
import AdoptionRepository from '../repositories/adoptionRepository.js';
import Pet from '../models/petModel.js';

async function getAllPets() {
    return await petRepository.getPets();
}

// Lógica para actualizar personalidad según estado
function actualizarPersonalidad(pet) {
    if (pet.enfermedades.length > 0) {
        pet.personalidad = "triste";
    } else if (pet.felicidad > 80 && pet.vida > 80) {
        pet.personalidad = "feliz";
    } else if (pet.felicidad < 30) {
        pet.personalidad = "triste";
    } else if (pet.felicidad < 50) {
        pet.personalidad = "enojado";
    } else {
        pet.personalidad = "normal";
    }
    // Si no se interactúa en más de 1 día
    const ultima = new Date(pet.ultimaInteraccion);
    const ahora = new Date();
    const horas = (ahora - ultima) / (1000 * 60 * 60);
    if (horas > 24) {
        pet.personalidad = "enojado";
    }
}

// Lógica para agregar enfermedades según acciones y tiempo
function revisarEnfermedades(pet, actividad) {
    const ahora = new Date();
    const ultima = new Date(pet.ultimaInteraccion);
    const horas = (ahora - ultima) / (1000 * 60 * 60);
    // Si no se alimenta en más de 24h
    if (horas > 24 && !pet.enfermedades.includes("debilidad")) {
        pet.enfermedades.push("debilidad");
    }
    // Si se alimenta mucho seguido
    if (actividad === "alimentar") {
        const recientes = pet.historialActividades.filter(a => a.includes("alimentar") && (ahora - new Date(a.split(" - ")[2])) < 2 * 60 * 60 * 1000);
        if (recientes.length > 2 && !pet.enfermedades.includes("dolor de estómago")) {
            pet.enfermedades.push("dolor de estómago");
        }
    }
    // Si no se baña en más de 48h
    const ultimoBanio = pet.historialActividades.filter(a => a.includes("bañar")).sort((a, b) => new Date(b.split(" - ")[2]) - new Date(a.split(" - ")[2]))[0];
    if (ultimoBanio) {
        const horasSinBanio = (ahora - new Date(ultimoBanio.split(" - ")[2])) / (1000 * 60 * 60);
        if (horasSinBanio > 48 && !pet.enfermedades.includes("sarpullido")) {
            pet.enfermedades.push("sarpullido");
        }
    }
    // Si no se pasea en más de 48h
    const ultimoPaseo = pet.historialActividades.filter(a => a.includes("pasear")).sort((a, b) => new Date(b.split(" - ")[2]) - new Date(a.split(" - ")[2]))[0];
    if (ultimoPaseo) {
        const horasSinPaseo = (ahora - new Date(ultimoPaseo.split(" - ")[2])) / (1000 * 60 * 60);
        if (horasSinPaseo > 48 && !pet.enfermedades.includes("tristeza")) {
            pet.enfermedades.push("tristeza");
        }
    }
}

// Lógica para actualizar hambre
function actualizarHambre(pet, actividad) {
    const ahora = new Date();
    // Buscar la última vez que se alimentó
    const ultimoAlimento = pet.historialActividades.filter(a => a.includes("alimentar")).sort((a, b) => new Date(b.split(" - ")[2]) - new Date(a.split(" - ")[2]))[0];
    let horasSinAlimentar = 0;
    if (ultimoAlimento) {
        horasSinAlimentar = (ahora - new Date(ultimoAlimento.split(" - ")[2])) / (1000 * 60 * 60);
    } else {
        horasSinAlimentar = (ahora - new Date(pet.ultimaInteraccion)) / (1000 * 60 * 60);
    }
    // Si han pasado más de 24h sin alimentar, aumenta el hambre
    if (horasSinAlimentar > 24) {
        pet.hambre = Math.min(100, pet.hambre + 10);
    }
    // Si la actividad es alimentar, disminuye el hambre
    if (actividad === "alimentar") {
        pet.hambre = Math.max(0, pet.hambre - 20);
    }
}

// Penalizar vida/felicidad si el hambre es muy alto
function penalizarPorHambre(pet) {
    if (pet.hambre >= 80) {
        pet.vida = Math.max(0, pet.vida - 10);
        pet.felicidad = Math.max(0, pet.felicidad - 20);
    }
}

// Modificar aplicarActividad para actualizar hambre y penalizar si es necesario
function aplicarActividad(pet, actividad) {
    const ahora = new Date();
    let resultado = "";
    switch (actividad) {
        case "alimentar":
            pet.felicidad = Math.min(100, pet.felicidad + 10);
            pet.vida = Math.min(100, pet.vida + 5);
            resultado = "+10 felicidad, +5 vida";
            break;
        case "pasear":
            pet.felicidad = Math.min(100, pet.felicidad + 15);
            pet.vida = Math.min(100, pet.vida + 2);
            resultado = "+15 felicidad, +2 vida";
            break;
        case "bañar":
            pet.felicidad = Math.min(100, pet.felicidad + 5);
            resultado = "+5 felicidad";
            // Curar sarpullido si lo tiene
            pet.enfermedades = pet.enfermedades.filter(e => e !== "sarpullido");
            break;
        case "jugar":
            pet.felicidad = Math.min(100, pet.felicidad + 20);
            resultado = "+20 felicidad";
            break;
        default:
            resultado = "actividad desconocida";
    }
    // Guardar como string en lugar de objeto
    const actividadString = `${actividad} - ${resultado} - ${ahora.toISOString()}`;
    pet.historialActividades.push(actividadString);
    pet.ultimaInteraccion = ahora.toISOString();
    // Revisar enfermedades y personalidad después de la acción
    revisarEnfermedades(pet, actividad);
    actualizarHambre(pet, actividad);
    penalizarPorHambre(pet);
    actualizarPersonalidad(pet);
}

// Modificar addPet para inicializar los nuevos atributos si no existen
async function addPet(pet) {
    if (!pet.name || !pet.animal || !pet.superpower) {
        throw new Error('Todos los campos son requeridos');
    }
    // Crear y guardar usando el modelo de Mongoose
    const pets = await petRepository.getPets();
    const newId = pets.length > 0 ? Math.max(...pets.map(p => p.id)) + 1 : 1;
    const newPet = new Pet({
        ...pet,
        id: newId,
        felicidad: 100,
        vida: 100,
        personalidad: "feliz",
        enfermedades: [],
        items: [],
        historialActividades: [],
        ultimaInteraccion: new Date().toISOString(),
        hambre: 0
    });
    await newPet.save();
    return newPet;
}

async function updatePet(id, updatedPet) {
    // Actualizar usando el modelo de Mongoose
    const pet = await Pet.findOne({ id: parseInt(id) });
    if (!pet) {
        throw new Error('Mascota no encontrada');
    }
    Object.assign(pet, updatedPet);
    await pet.save();
    return pet;
}

async function deletePet(id) {
    // Validar si la mascota está adoptada
    const adoptions = await AdoptionRepository.getAdoptions();
    const adopted = adoptions.some(a => a.petId === parseInt(id));
    if (adopted) {
        throw new Error('No se puede eliminar la mascota porque ya fue adoptada');
    }
    const pets = await petRepository.getPets();
    const index = pets.findIndex(pet => pet.id === parseInt(id));
    if (index === -1) {
        throw new Error('Mascota no encontrada');
    }
    const filteredPets = pets.filter(pet => pet.id !== parseInt(id));
    await petRepository.savePets(filteredPets);
    return { message: 'Mascota eliminada' };
}

// Exportar nuevas funciones para uso futuro
async function getPetById(id) {
    // Buscar por id numérico
    return await Pet.findOne({ id: parseInt(id) });
}

export {
    aplicarActividad,
    actualizarPersonalidad,
    revisarEnfermedades
};

// Penalizar vida y felicidad por enfermedades y hambre al consultar el estado
function aplicarPenalizacionEnfermedadSiEsNecesario(pet) {
    // Penalización por enfermedades
    if (pet.enfermedades && pet.enfermedades.length > 0) {
        const penalizacionVida = 10 * pet.enfermedades.length;
        const penalizacionFelicidad = 20 * pet.enfermedades.length;
        pet.vida = Math.max(0, pet.vida - penalizacionVida);
        pet.felicidad = Math.max(0, pet.felicidad - penalizacionFelicidad);
    }
    // Penalización por hambre
    actualizarHambre(pet, null);
    penalizarPorHambre(pet);
}

export default {
    getAllPets,
    addPet,
    updatePet,
    deletePet,
    getPetById,
    aplicarActividad,
    actualizarPersonalidad,
    revisarEnfermedades,
    aplicarPenalizacionEnfermedadSiEsNecesario
}; 