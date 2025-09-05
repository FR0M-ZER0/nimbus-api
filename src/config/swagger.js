import swaggerJsDoc from 'swagger-jsdoc'

const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'Nimbus API',
            version: '1.0.0',
            description: 'Documentação da API do Nimbus',
        },
        servers: [
            {
                url: process.env.SERVER_ADDRESS,
            },
        ],
    },
    apis: ['./src/routes/*.js'],
}

export const swaggerDocs = swaggerJsDoc(swaggerOptions)