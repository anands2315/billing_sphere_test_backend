const express = require("express");
const StockShortageRoutes = express.Router();
const StockShortageController = require("../controllers/stock_shortage_controller");

StockShortageRoutes.post("/create", StockShortageController.createStockShortage);
StockShortageRoutes.get("/get-all", StockShortageController.getAllStockShortages);
StockShortageRoutes.get("/get-by-id/:id", StockShortageController.getStockShortageById);
StockShortageRoutes.put("/update/:id", StockShortageController.updateStockShortage);
StockShortageRoutes.delete("/delete/:id", StockShortageController.deleteStockShortage);

module.exports = StockShortageRoutes;