import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'API Superhéroes',
    version: '1.0.0',
    description: 'Documentación de la API de superhéroes, mascotas y adopciones',
  },
  servers: [
    {
      url: 'https://juego-production-6921.up.railway.app/api',
      description: 'Servidor en Railway'
    },
    {
      url: 'http://localhost:3001/api',
      description: 'Servidor local'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [{ bearerAuth: [] }],
};

const options = {
  swaggerDefinition,
  apis: ['./controllers/*.js'], // Buscará los comentarios JSDoc en los controladores
};

const swaggerSpec = swaggerJSDoc(options);

export const swaggerUiServe = swaggerUi.serve;
export const swaggerUiSetup = swaggerUi.setup(swaggerSpec); 