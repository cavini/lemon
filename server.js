const express = require("express");

const joi = require("joi");
const app = express();
const port = 3000;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const schema = joi.object({
  numeroDoDocumento: joi
    .string()
    .alphanum()
    .max(14)
    .min(11)
    .required()
    .messages({
      "string.alphanum":
        "Formato inválido. Digite somente os números do seu CPF ou CNPJ.",
      "string.max":
        "Formato inválido. O número do seu documento deve conter até 14 dígitos.",
      "string.min":
        "Formato inválido. O número do seu documento deve conter ao menos 11 dígitos.",
      "any.required":
        "Campo obrigatório. Digite somente os números do seu CPF ou CNPJ",
    }),
  tipoDeConexao: joi
    .string()
    .valid("trifasico", "bifasico", "monofasico")
    .required()
    .messages({
      "any.only": "Tipo de conexão não aceita",
    }),
  classeDeConsumo: joi
    .string()
    .valid("comercial", "residencial", "industrial")
    .required()
    .messages({
      "any.only": "Classe de consumo não aceita",
    }),
  modalidadeTarifaria: joi
    .string()
    .valid("convencional", "branca")
    .required()
    .messages({
      "any.only": "Modalidade tarifária não aceita",
    }),
  historicoDeConsumo: joi
    .array()
    .items(joi.number().integer().min(0).max(9999))
    .min(3)
    .max(12)
    .required(),
});

app.post("/verificarEligibilidade", (req, res) => {
  const inputData = req.body;

  const validationResult = schema.validate(inputData, { abortEarly: false });

  if (validationResult.error) {
    const validationErrors = validationResult.error.details.map((detail) => {
      return detail.message || detail.type;
    });

    res.status(400).json({
      elegivel: false,
      razoesDeInelegibilidade: validationErrors,
    });
  } else {
    const { historicoDeConsumo, tipoDeConexao } = inputData;
    const sum = historicoDeConsumo.reduce((acc, value) => acc + value, 0);
    const average = sum / historicoDeConsumo.length;

    let threshold;
    let emissionFactor = 84;

    switch (tipoDeConexao) {
      case "monofasico":
        threshold = 400;
        break;
      case "bifasico":
        threshold = 500;
        break;
      case "trifasico":
        threshold = 750;
        break;
      default:
        threshold = 0;
    }

    if (average < threshold) {
      res.status(400).json({
        elegivel: false,
        razoesDeInelegibilidade: [
          `Tipo de conexão ${tipoDeConexao}: deve possuir uma média anual de consumo maior que ${threshold} kwh`,
        ],
      });
    } else {
      const yearlyEnergyConsumption = average * 12; // Assuming average consumption is monthly
      const yearlyCO2Saved = (yearlyEnergyConsumption / 1000) * emissionFactor;

      res.json({
        elegivel: true,
        economia: `Você economizaria ${yearlyCO2Saved.toFixed(
          2
        )} kilogramas de C02 anualmente utilizando energia limpa.`,
      });
    }
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

module.exports = app;
