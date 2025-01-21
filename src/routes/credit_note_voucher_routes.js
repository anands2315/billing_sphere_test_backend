const express = require("express");
const CreditNoteController = require("../controllers/credit_note_voucher_controller");
const CreditNoteVoucherRoutes = express.Router();
const verifyToken = require("../middleware/verifyToken");

CreditNoteVoucherRoutes.post(
  "/create",
  verifyToken,
  CreditNoteController.createCreditNoteVoucher
);

// Get All Journal Routes
CreditNoteVoucherRoutes.get(
  "/get-all-credit-note",
  verifyToken,
  CreditNoteController.getAllCreditNote
);

// Get a Journal by ID
CreditNoteVoucherRoutes.get(
  "/credit-note/:id",
  verifyToken,
  CreditNoteController.getCreditNoteById
);

CreditNoteVoucherRoutes.delete(
  "/credit-note-delete/:id",
  verifyToken,
  CreditNoteController.deleteCreditNoteVoucher
);

CreditNoteVoucherRoutes.put(
  "/credit-note-update/:id",
  verifyToken,
  CreditNoteController.updateCreditNoteVoucher
);
module.exports = CreditNoteVoucherRoutes;
