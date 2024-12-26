const express = require("express");
const StockPhysicalVerificationRoutes = express.Router();
const StockPhysicalVerificationController = require("../controllers/stock_physical_verification_controller");

StockPhysicalVerificationRoutes.post("/create", StockPhysicalVerificationController.createStockPhysicalVerification);
StockPhysicalVerificationRoutes.get("/get-all", StockPhysicalVerificationController.getAllStockPhysicalVerification);
StockPhysicalVerificationRoutes.get("/get-by-id/:id", StockPhysicalVerificationController.getStockPhysicalVerificationById);
StockPhysicalVerificationRoutes.put("/update/:id", StockPhysicalVerificationController.updateStockPhysicalVerification);
StockPhysicalVerificationRoutes.delete("delete/:id", StockPhysicalVerificationController.deleteStockPhysicalVerification);

module.exports = StockPhysicalVerificationRoutes;