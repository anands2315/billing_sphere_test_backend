const express = require("express");
const GstExpenseController = require("../controllers/gst_expense_voucher_controller");
const GstExpenseVoucherRoutes = express.Router();
const verifyToken = require("../middleware/verifyToken");

GstExpenseVoucherRoutes.post(
  "/create",
  verifyToken,
  GstExpenseController.createGstExpenseVoucher
);

// Get All Journal Routes
GstExpenseVoucherRoutes.get(
  "/get-all-gst-expense",
  verifyToken,
  GstExpenseController.getAllGstExpense
);

// Get a Journal by ID
GstExpenseVoucherRoutes.get(
  "/gst-expense/:id",
  verifyToken,
  GstExpenseController.getGstExpenseById
);

GstExpenseVoucherRoutes.delete(
  "/gst-expense-delete/:id",
  verifyToken,
  GstExpenseController.deleteGstExpenseVoucher
);

GstExpenseVoucherRoutes.put(
  "/gst-expense-update/:id",
  verifyToken,
  GstExpenseController.updateGstExpenseVoucher
);
module.exports = GstExpenseVoucherRoutes;
