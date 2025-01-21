const express = require("express");
const ContraVoucherRoute = express.Router();
const ContraVoucherController = require("../controllers/contra_voucher_controller");
const verifyToken = require("../middleware/verifyToken");

ContraVoucherRoute.post(
  "/create",
  verifyToken,
  ContraVoucherController.createContraVoucher
);

// Get All Journal Routes
ContraVoucherRoute.get(
  "/get-all-contra",
  verifyToken,
  ContraVoucherController.getAllContra
);

// Get a Journal by ID
ContraVoucherRoute.get(
  "/contra/:id",
  verifyToken,
  ContraVoucherController.getContraById
);

ContraVoucherRoute.put(
  "/contra-update/:id",
  verifyToken,
  ContraVoucherController.updateContraVoucher
);

ContraVoucherRoute.delete(
  "/contra-delete/:id",
  verifyToken,
  ContraVoucherController.deleteContraVoucher
);
module.exports = ContraVoucherRoute;
