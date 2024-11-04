const express  = require("express");
const PurchaseReturnRoutes  = express.Router();
const PurchaseReturnController = require("../controllers/purchase_return_controller");
const verifyToken = require("../middleware/verifyToken");


PurchaseReturnRoutes.post("/create",verifyToken,PurchaseReturnController.createPurchaseReturn);

PurchaseReturnRoutes.get("/get-all",verifyToken,PurchaseReturnController.getAllPurchaseReturn);

PurchaseReturnRoutes.get("/fetch-all/:companyCode",verifyToken,PurchaseReturnController.fetchAllPurchaseReturn);

PurchaseReturnRoutes.get("/fetch-by-id/:companyCode/:id",verifyToken,PurchaseReturnController.fetchPurchaseReturnById);

PurchaseReturnRoutes.put("/update-by-id/:id",verifyToken,PurchaseReturnController.updatePurchaseReturn);

PurchaseReturnRoutes.delete("/delete-by-id/:id",verifyToken,PurchaseReturnController.deletePurchaseReturn);

module.exports = PurchaseReturnRoutes;
