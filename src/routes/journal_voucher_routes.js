const express = require("express");
const JournalVoucherController = require("../controllers/journal_voucher_controller");
const JournalVoucherRoutes = express.Router();
const verifyToken = require("../middleware/verifyToken");

JournalVoucherRoutes.post(
  "/create",
  verifyToken,
  JournalVoucherController.createJournalVoucher
);

// Get All Journal Routes
JournalVoucherRoutes.get(
  "/get-all-journal",
  verifyToken,
  JournalVoucherController.getAllJournal
);

// Get a Journal by ID
JournalVoucherRoutes.get(
  "/journal/:id",
  verifyToken,
  JournalVoucherController.getJournalById
);

JournalVoucherRoutes.delete(
  "/journal-delete/:id",
  verifyToken,
  JournalVoucherController.deleteJournalVoucher
);

JournalVoucherRoutes.put(
  "/journal-update/:id",
  verifyToken,
  JournalVoucherController.updateJournalVoucher
);
module.exports = JournalVoucherRoutes;
