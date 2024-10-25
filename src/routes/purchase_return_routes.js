const express  = require("express");
const PurchaseReturnRoutes  = express.Router();
const PurchaseReturnController = require("../controllers/purchase_return_controller");
const verifyToken = require("../middleware/verifyToken");


PurchaseReturnRoutes.post("/create",verifyToken,PurchaseReturnController.createPurchaseReturn);

PurchaseReturnRoutes.get("/get-all",verifyToken,PurchaseReturnController.getAllPurchaseReturn);

PurchaseReturnRoutes.get("/fetch-all/:companyCode",verifyToken,PurchaseReturnController.fetchAllPurchaseReturn);

module.exports = PurchaseReturnRoutes;
