const express = require("express");
const StockQuotationRoutes = express.Router();
const StockQuotationController = require("../controllers/stock_quotation_controller");

StockQuotationRoutes.post("/create", StockQuotationController.createStockQuotation);
StockQuotationRoutes.get("/get-all", StockQuotationController.getAllStockQuotation);
StockQuotationRoutes.get("/get-by-id/:id", StockQuotationController.getStockQuotationById);
StockQuotationRoutes.put("/update/:id", StockQuotationController.updateStockQuotation);
StockQuotationRoutes.delete("delete/:id", StockQuotationController.deleteStockQuotation);

module.exports = StockQuotationRoutes;