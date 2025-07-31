import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/userModel.js';
import Hero from '../models/heroModel.js';
import Pet from '../models/petModel.js';
import Adoption from '../models/adoptionModel.js';

dotenv.config();

// Conectar a MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Conectado a MongoDB Atlas'))
    .catch(err => console.error('Error de conexión a MongoDB:', err));

// Datos de ejemplo
const sampleUsers = [
    {
        email: 'player1@game.com',
        password: '$2a$10$rQZ8K9mN2pL1vX3yW4uI5oP6qR7sT8uV9wX0yZ1aB2cD3eF4gH5iJ6kL7mN8oP9',
        id: 1
    },
    {
        email: 'player2@game.com',
        password: '$2a$10$rQZ8K9mN2pL1vX3yW4uI5oP6qR7sT8uV9wX0yZ1aB2cD3eF4gH5iJ6kL7mN8oP9',
        id: 2
    }
];

const sampleHeroes = [
    {
        name: 'Clark Kent',
        alias: 'Superman',
        city: 'Metrópolis',
        team: 'Justice League',
        userId: 1,
        id: 1
    },
    {
        name: 'Bruce Wayne',
        alias: 'Batman',
        city: 'Gotham City',
        team: 'Justice League',
        userId: 1,
        id: 2
    },
    {
        name: 'Peter Parker',
        alias: 'Spider-Man',
        city: 'Nueva York',
        team: 'Avengers',
        userId: 2,
        id: 3
    }
];

const samplePets = [
    {
        name: 'Krypto',
        animal: 'perro',
        superpower: 'vuelo',
        superheroeId: 1,
        felicidad: 85,
        vida: 90,
        personalidad: 'feliz',
        enfermedades: [],
        items: ['Juguete Básico', 'Pelota'],
        historialActividades: [
            'alimentar - +10 felicidad, +5 vida - 2024-01-15T10:30:00.000Z',
            'pasear - +15 felicidad, +2 vida - 2024-01-15T14:20:00.000Z'
        ],
        ultimaInteraccion: new Date(),
        hambre: 15,
        id: 1
    },
    {
        name: 'Ace',
        animal: 'gato',
        superpower: 'invisibilidad',
        superheroeId: 2,
        felicidad: 75,
        vida: 80,
        personalidad: 'normal',
        enfermedades: [],
        items: ['Juguete Básico'],
        historialActividades: [
            'jugar - +20 felicidad - 2024-01-15T09:15:00.000Z'
        ],
        ultimaInteraccion: new Date(),
        hambre: 25,
        id: 2
    }
];

const sampleAdoptions = [
    {
        heroId: 1,
        petId: 1,
        id: 1
    },
    {
        heroId: 2,
        petId: 2,
        id: 2
    }
];

async function initializeData() {
    try {
        console.log('Inicializando datos del juego...');

        // Limpiar datos existentes
        await User.deleteMany({});
        await Hero.deleteMany({});
        await Pet.deleteMany({});
        await Adoption.deleteMany({});

        console.log('Datos anteriores eliminados.');

        // Insertar usuarios
        const users = await User.insertMany(sampleUsers);
        console.log(`${users.length} usuarios creados.`);

        // Insertar héroes
        const heroes = await Hero.insertMany(sampleHeroes);
        console.log(`${heroes.length} héroes creados.`);

        // Insertar mascotas
        const pets = await Pet.insertMany(samplePets);
        console.log(`${pets.length} mascotas creadas.`);

        // Insertar adopciones
        const adoptions = await Adoption.insertMany(sampleAdoptions);
        console.log(`${adoptions.length} adopciones creadas.`);

        console.log('✅ Datos inicializados exitosamente!');
        console.log('\n📋 Datos de prueba:');
        console.log('Usuario 1: player1@game.com (contraseña: password123)');
        console.log('Usuario 2: player2@game.com (contraseña: password123)');
        console.log('\n🎮 Puedes acceder al juego en: http://localhost:3001/game');

    } catch (error) {
        console.error('❌ Error al inicializar datos:', error);
    } finally {
        mongoose.connection.close();
    }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
    initializeData();
}

export default initializeData; 