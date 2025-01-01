const express = require("express");
const SalesBillRoutes = express.Router();
const SalesBillController = require("../controllers/sales_bill_controller");

SalesBillRoutes.get("/get-all", SalesBillController.getAllSalesBills);
SalesBillRoutes.get("/get-by-id/:id", SalesBillController.getSalesBillById);
SalesBillRoutes.get(
    "/get-by-fillter/:companyCode",
    SalesBillController.getAllSalesBillsFillter
);
SalesBillRoutes.get("/get-by-party/:companyCode/:party", SalesBillController.fetchSalesBillsByParty);
SalesBillRoutes.post("/create", SalesBillController.createSalesBill);
SalesBillRoutes.put("/update/:id", SalesBillController.updateSalesBill);
SalesBillRoutes.delete("/delete/:id", SalesBillController.deleteSalesBill);

module.exports = SalesBillRoutes;