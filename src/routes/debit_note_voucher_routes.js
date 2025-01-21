const express = require("express");
const DebitNoteVoucherController = require("../controllers/debit_note_voucher_controller");
const DebitNoteVoucherRoutes = express.Router();
const verifyToken = require("../middleware/verifyToken");

DebitNoteVoucherRoutes.post(
  "/create",
  verifyToken,
  DebitNoteVoucherController.createDebitNoteVoucher
);

// Get All D Routes
DebitNoteVoucherRoutes.get(
  "/get-all-debit-note",
  verifyToken,
  DebitNoteVoucherController.getAllDebitNote
);

// Get a Journal by ID
DebitNoteVoucherRoutes.get(
  "/debit-note/:id",
  verifyToken,
  DebitNoteVoucherController.getDebitNoteById
);

DebitNoteVoucherRoutes.delete(
  "/debit-note-delete/:id",
  verifyToken,
  DebitNoteVoucherController.deleteDebitNoteVoucher
);

DebitNoteVoucherRoutes.put(
  "/debit-note-update/:id",
  verifyToken,
  DebitNoteVoucherController.updateDebitNoteVoucher
);
module.exports = DebitNoteVoucherRoutes;
