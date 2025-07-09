import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Finvy API Documentation',
      version: '1.0.0',
      description: 'API documentation for the Finvy application',
    },
    servers: [
      {
        url: '/api',
        description: 'Local server',
      },
    ],
  },
  apis: ['./backend/handlers/*.ts'], // Path to the API docs
};

const specs = swaggerJsdoc(options);

export { swaggerUi, specs };
