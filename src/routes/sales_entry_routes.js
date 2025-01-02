const SalesEntryRoutes = require("express").Router();
const SalesEntryController = require("../controllers/sales_entry_controller");
const verifyToken = require("../middleware/verifyToken");

SalesEntryRoutes.post("/create", verifyToken, SalesEntryController.createSales);
SalesEntryRoutes.put(
  "/update/:id",
  verifyToken,
  SalesEntryController.updateSales
);
SalesEntryRoutes.get(
  "/fetchAll/:companyCode",
  verifyToken,
  SalesEntryController.fetchAllSales
);

SalesEntryRoutes.get("/get-sales/:companyCode", SalesEntryController.getSales);

SalesEntryRoutes.get("/fetch-sales-by-BillNumber/:billNumber", SalesEntryController.fetchSalesByBillNumber);

SalesEntryRoutes.get("/fetch-sales-by-Party/:party", SalesEntryController.fetchSalesByParty);

SalesEntryRoutes.get("/fetch-sales-by-itemName/:itemNameId", SalesEntryController.fetchSalesByItemName);

SalesEntryRoutes.delete(
  "/delete/:id",
  verifyToken,
  SalesEntryController.deleteSales
);
SalesEntryRoutes.get("/get-all", verifyToken, SalesEntryController.getAllSales);
SalesEntryRoutes.get(
  "/get-single/:id",
  SalesEntryController.getSingleSales
);
// Download receipt
SalesEntryRoutes.get(
  "/download-receipt/:id",
  SalesEntryController.downloadReceipt
);

module.exports = SalesEntryRoutes;
