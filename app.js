import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import express from 'express';
import heroController from './controllers/heroController.js';
import petController from './controllers/petController.js';
import adoptionController from './controllers/adoptionController.js';
import userController from './controllers/userController.js';
import { swaggerUiServe, swaggerUiSetup } from './swagger.js';
import { swaggerSpec } from './swagger.js';
import cors from 'cors';

mongoose.connect(process.env.MONGODB_URI)

.then(() => console.log('Conectado a MongoDB Atlas'))
.catch(err => console.error('Error de conexión a MongoDB:', err));

const app = express()
// Configuración de CORS permisiva
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
// Handler global para preflight OPTIONS
app.options('*', cors());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});
app.use(express.json())
app.use('/api', heroController)
app.use('/api', petController)
app.use('/api', adoptionController)
app.use('/api/users', userController);
app.use('/api-docs', swaggerUiServe, swaggerUiSetup);

// Endpoint para obtener el archivo JSON de Swagger
app.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

app.get('/', (req, res) => {
  res.redirect('/api-docs');
});

if (!process.env.JWT_SECRET) {
  console.warn('ADVERTENCIA: JWT_SECRET no está definida en el archivo .env. Por favor, agrégala para la autenticación JWT.');
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, _ => {
    console.log(`Servidor corriendo en el puerto ${PORT}`)
    console.log(`🚀 Servidor corriendo en: http://localhost:${PORT}/api-docs/swagger`);
})