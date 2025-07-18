import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import express from 'express';
import heroController from './controllers/heroController.js';
import petController from './controllers/petController.js';
import adoptionController from './controllers/adoptionController.js';
import userController from './controllers/userController.js';
import { swaggerUiServe, swaggerUiSetup } from './swagger.js';

mongoose.connect(process.env.MONGO_URL)
.then(() => console.log('Conectado a MongoDB Atlas'))
.catch(err => console.error('Error de conexión a MongoDB:', err));

const app = express()

app.use(express.json())
app.use('/api', heroController)
app.use('/api', petController)
app.use('/api', adoptionController)
app.use('/api/users', userController);
app.use('/api-docs', swaggerUiServe, swaggerUiSetup);
app.get('/', (req, res) => {
  res.redirect('/api-docs');
});

if (!process.env.JWT_SECRET) {
  console.warn('ADVERTENCIA: JWT_SECRET no está definida en el archivo .env. Por favor, agrégala para la autenticación JWT.');
}

const PORT = 3001
app.listen(PORT, _ => {
    console.log(`Servidor corriendo en el puerto ${PORT}`)
    console.log(`🚀 Servidor corriendo en: http://localhost:${PORT}/api-docs/swagger`);

})