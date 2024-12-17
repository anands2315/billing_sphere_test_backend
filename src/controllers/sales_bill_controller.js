const SalesBillModel = require('../models/sales_bills_model');
const Ledger = require("../models/ledger_model");

// Get all sales bills
const getAllSalesBills = async (req, res) => {
    try {
        const salesBills = await SalesBillModel.find();
        res.status(200).json({
            success: true,
            message: "Sales Bills fetched successfully.", 
            data: salesBills
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch sales bills", error });
    }
};

// Get sales bill by ID
const getSalesBillById = async (req, res) => {
    try {
        const { id } = req.params;
        const salesBill = await SalesBillModel.findById(id).populate("ledger");
        if (!salesBill) {
            return res.status(404).json({ 
                success: false, 
                message: "Sales bill not found." 
            });
        }
        res.status(200).json({ success: true, data: salesBill });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Failed to fetch sales bill.", 
            error: error.message 
        });
    }
};

// Create a new sales bill
const createSalesBill = async (req, res) => {
    try {
        const { ledger } = req.body;

        // Validate ledger existence
        const existingLedger = await Ledger.findById(ledger);
        if (!existingLedger) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid ledger ID." 
            });
        }

        const newSalesBill = new SalesBillModel(req.body);
        await newSalesBill.save();
        res.status(201).json({ 
            success: true, 
            message: "Sales bill created successfully.", 
            data: newSalesBill 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Failed to create sales bill.", 
            error: error.message 
        });
    }
};

// Update a sales bill by ID
const updateSalesBill = async (req, res) => {
    try {
        const { id } = req.params;
        const { ledger } = req.body;

        // Validate ledger existence if provided
        if (ledger) {
            const existingLedger = await Ledger.findById(ledger);
            if (!existingLedger) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Invalid ledger ID." 
                });
            }
        }

        const updatedSalesBill = await SalesBillModel.findByIdAndUpdate(id, req.body, {
            new: true, // Returns the updated document
            runValidators: true, // Validates the updated data
        });

        if (!updatedSalesBill) {
            return res.status(404).json({ 
                success: false, 
                message: "Sales bill not found." 
            });
        }

        res.status(200).json({ 
            success: true, 
            message: "Sales bill updated successfully.", 
            data: updatedSalesBill 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Failed to update sales bill.", 
            error: error.message 
        });
    }
};

// Delete a sales bill by ID
const deleteSalesBill = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedSalesBill = await SalesBillModel.findByIdAndDelete(id);

        if (!deletedSalesBill) {
            return res.status(404).json({ 
                success: false, 
                message: "Sales bill not found." 
            });
        }

        res.status(200).json({ 
            success: true, 
            message: "Sales bill deleted successfully.", 
            data: deletedSalesBill 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Failed to delete sales bill.", 
            error: error.message 
        });
    }
};

module.exports = {
    getAllSalesBills,
    getSalesBillById,
    createSalesBill,
    updateSalesBill,
    deleteSalesBill,
};
