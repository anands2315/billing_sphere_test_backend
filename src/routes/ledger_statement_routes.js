const express = require("express");
const LedgerStatmentRoutes = express.Router();
const verifyToken = require("../middleware/verifyToken");
const LedgerStatementController = require("../controllers/ledger_statement_controller");

LedgerStatmentRoutes.get(
  "/get-ledger-statment/:companyCode/:party",
  verifyToken,
  LedgerStatementController.getLedgerEntries
);

LedgerStatmentRoutes.get(
  "/get-periodic-summary/:companyCode/:party",
  verifyToken,
  LedgerStatementController.getLedgerPeriodicSummary
);


module.exports = LedgerStatmentRoutes;
