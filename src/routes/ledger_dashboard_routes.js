const express = require("express");
const LedgerDeshBoardController = require("../controllers/ledger_dashboard_controller");
const LedgerDeshBoardRoutes = express.Router();
const verifyToken = require("../middleware/verifyToken");

LedgerDeshBoardRoutes.get(
  "/get-pending-bills/:companyCode/:ledgerId",
  verifyToken,
  LedgerDeshBoardController.getPendingBills
);

LedgerDeshBoardRoutes.get(
  "/get-recent-transaction/:companyCode/:ledgerId",
  verifyToken,
  LedgerDeshBoardController.getRecentTransactions
);

LedgerDeshBoardRoutes.get(
  "/get-last-entry/:companyCode/:ledgerId",
  verifyToken,
  LedgerDeshBoardController.getLastEntry
);
LedgerDeshBoardRoutes.get(
  "/sales-purchase-summary/:companyCode/:ledgerId",
  verifyToken,
  LedgerDeshBoardController.getSalesPurchaseSummary
);

LedgerDeshBoardRoutes.get(
  "/item-summary/:companyCode/:ledgerId",
  verifyToken,
  LedgerDeshBoardController.getItemSummary
);
module.exports = LedgerDeshBoardRoutes;


