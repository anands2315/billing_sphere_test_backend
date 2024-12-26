const mongoose = require("mongoose");
const ProformaInvoiceModel = require("../models/proforma_invoice_model");

const ProformaInvoiceController = {
    // Create a new Proforma Invoice
    createProformaInvoice: async (req, res) => {
        try {
            const data = req.body;

            const proformaInvoice = new ProformaInvoiceModel(data);
            await proformaInvoice.save();

            res.status(201).json({
                success: true,
                message: "Proforma Invoice created successfully",
                data: proformaInvoice,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    },

    // Get all Proforma Invoices
    getAllProformaInvoices: async (req, res) => {
        try {
            const { companyCode } = req.query;
    
            const query = companyCode ? { companyCode } : {};
    
            const proformaInvoices = await ProformaInvoiceModel.find(query);
    
            res.status(200).json({
                success: true,
                data: proformaInvoices,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    },
    

    // Get Proforma Invoice by ID
    getProformaInvoiceById: async (req, res) => {
        try {
            const { id } = req.params;

            const proformaInvoice = await ProformaInvoiceModel.findById(id);

            if (!proformaInvoice) {
                return res.status(404).json({
                    success: false,
                    message: "Proforma Invoice not found",
                });
            }

            res.status(200).json({
                success: true,
                data: proformaInvoice,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    },

    // Update Proforma Invoice
    updateProformaInvoice: async (req, res) => {
        try {
            const { id } = req.params;
            const data = req.body;

            const updatedProformaInvoice = await ProformaInvoiceModel.findByIdAndUpdate(
                id,
                data,
                { new: true }
            );

            if (!updatedProformaInvoice) {
                return res.status(404).json({
                    success: false,
                    message: "Proforma Invoice not found",
                });
            }

            res.status(200).json({
                success: true,
                message: "Proforma Invoice updated successfully",
                data: updatedProformaInvoice,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    },

    // Delete Proforma Invoice
    deleteProformaInvoice: async (req, res) => {
        try {
            const { id } = req.params;

            const deletedProformaInvoice = await ProformaInvoiceModel.findByIdAndDelete(id);

            if (!deletedProformaInvoice) {
                return res.status(404).json({
                    success: false,
                    message: "Proforma Invoice not found",
                });
            }

            res.status(200).json({
                success: true,
                message: "Proforma Invoice deleted successfully",
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    },
};

module.exports = ProformaInvoiceController;
