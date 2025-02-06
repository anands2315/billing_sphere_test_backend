const express = require("express");
const VoucherRegisterRoutes = express.Router();
const VoucherRegisterController = require("../controllers/voucher_register_controller");
const verifyToken = require("../middleware/verifyToken");

VoucherRegisterRoutes.get(
  "/get-voucher-register/:companyCode/:voucherType",
  verifyToken,
  VoucherRegisterController.getVoucherRegister
);

module.exports = VoucherRegisterRoutes;


