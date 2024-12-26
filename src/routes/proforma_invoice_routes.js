const express = require("express");
const ProformaInvoiceRoute = express.Router();
const ProformaInvoiceController = require("../controllers/proforma_invoice_controller");

ProformaInvoiceRoute.post("/create", ProformaInvoiceController.createProformaInvoice);
ProformaInvoiceRoute.get("/get-all", ProformaInvoiceController.getAllProformaInvoices);
ProformaInvoiceRoute.get("/get-by-id/:id", ProformaInvoiceController.getProformaInvoiceById);
ProformaInvoiceRoute.put("/update/:id", ProformaInvoiceController.updateProformaInvoice);
ProformaInvoiceRoute.delete("delete/:id", ProformaInvoiceController.deleteProformaInvoice);

module.exports = ProformaInvoiceRoute;