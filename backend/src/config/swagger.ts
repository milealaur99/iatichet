import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";
import path from "path";

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Documentația API",
      version: "1.0.0"
    }
  },
  apis: [path.join(__dirname, "../routes/**/*.yaml")]
};
const swaggerDocs = swaggerJsdoc(swaggerOptions);

export const swagger = (app: Express) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
};
