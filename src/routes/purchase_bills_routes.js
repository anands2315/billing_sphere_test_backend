const express = require('express');
const purchaseBillRoutes = express.Router();
const PurchaseBillController = require('../controllers/purchase_bills_controllers');

purchaseBillRoutes.get('/get-all', PurchaseBillController.getAllPurchaseBills); 
purchaseBillRoutes.get('/get-by-id/:id', PurchaseBillController.getPurchaseBillById); 
purchaseBillRoutes.post('/create', PurchaseBillController.createPurchaseBill); 
purchaseBillRoutes.put('/update/:id', PurchaseBillController.updatePurchaseBill); 
purchaseBillRoutes.delete('/delete/:id', PurchaseBillController.deletePurchaseBill); 

module.exports = purchaseBillRoutes;
