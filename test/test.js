const chai = require("chai");
const chaiHttp = require("chai-http");
const app = require("../server");
const should = chai.should();

chai.use(chaiHttp);

describe("API Tests", () => {
  describe("/POST verificarEligibilidade", () => {
    it("should return a validation error for invalid input", (done) => {
      chai
        .request(app)
        .post("/verificarEligibilidade")
        .send({ invalidField: "invalidValue" })
        .end((err, res) => {
          res.should.have.status(400);
          res.body.should.have.property("error");
          done();
        });
    });

    it("should pass validation and return CO2 savings for valid input", (done) => {
      const validInput = {
        numeroDoDocumento: "12345678901",
        tipoDeConexao: "trifasico",
        classeDeConsumo: "residencial",
        modalidadeTarifaria: "branca",
        historicoDeConsumo: [1000, 2000, 3000],
      };

      chai
        .request(app)
        .post("/verificarEligibilidade")
        .send(validInput)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property("message").eql("Validation passed!");
          res.body.should.have.property("yearlyCO2Saved");
          done();
        });
    });
  });
});
