"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swagger = void 0;
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const path_1 = __importDefault(require("path"));
const swaggerOptions = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Documentația API",
            version: "1.0.0"
        }
    },
    apis: [path_1.default.join(__dirname, "../routes/**/*.yaml")] // Include fișierele tale cu comentarii
};
console.log([
    path_1.default.join(__dirname, "../*.yaml"),
    path_1.default.join(__dirname, "*.yaml"),
    "*.yaml",
    path_1.default.join(__dirname, "..", "*.yaml")
]);
const swaggerDocs = (0, swagger_jsdoc_1.default)(swaggerOptions);
const swagger = (app) => {
    app.use("/api-docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerDocs));
};
exports.swagger = swagger;
//# sourceMappingURL=swagger.js.map