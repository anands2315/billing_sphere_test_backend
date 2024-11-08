const express  = require("express");
const SalesReturnRoutes  = express.Router();
const SalesReturnController = require("../controllers/sales_return_controller");
const verifyToken = require("../middleware/verifyToken");

SalesReturnRoutes.post("/create",verifyToken,SalesReturnController.createSalesReturn);

SalesReturnRoutes.get("/get-all",verifyToken,SalesReturnController.getAllSalesReturn);

SalesReturnRoutes.get("/fetch-all/:companyCode",verifyToken,SalesReturnController.fetchAllSalesReturn);

SalesReturnRoutes.get("/fetch-by-id/:companyCode/:id",verifyToken,SalesReturnController.fetchSalesReturnById);

SalesReturnRoutes.put("/update-by-id/:id",verifyToken,SalesReturnController.updateSalesReturn);

SalesReturnRoutes.delete("/delete-by-id/:id",verifyToken,SalesReturnController.deleteSalesReturn);

module.exports = SalesReturnRoutes;
