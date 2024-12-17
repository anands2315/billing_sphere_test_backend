const PurchaseBillModel = require('../models/purchase_bills_models');
const Ledger = require("../models/ledger_model");

const getAllPurchaseBills = async (req, res) => {
    try {
        const purchaseBills = await PurchaseBillModel.find();
        res.status(200).json({
            success: true,
            message: "Purchase Bills fetched successfully.",
            data: purchaseBills,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching Purchase Bills.",
            error: error.message,
        });
    }
};

// Get purchase bill by ID
const getPurchaseBillById = async (req, res) => {
    try {
        const { id } = req.params;
        const purchaseBill = await PurchaseBillModel.findById(id);
        if (!purchaseBill) {
            return res.status(404).json({
                success: false,
                message: "Purchase Bill not found.",
            });
        }
        res.status(200).json({
            success: true,
            message: "Purchase Bill fetched successfully.",
            data: purchaseBill,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching Purchase Bill.",
            error: error.message,
        });
    }
};

// Create a new purchase bill
const createPurchaseBill = async (req, res) => {
    try {
        const {date, companyCode, name, type, ledger, ref, totalAmount, dueAmount } = req.body;

        const ledgerExists = await Ledger.findById(ledger);
        if (!ledgerExists) {
            return res.status(400).json({
                success: false,
                message: "Ledger with the provided ID does not exist.",
            });
        }

        const newPurchaseBill = new PurchaseBillModel({
            date,
            companyCode,
            name,
            type,
            ledger,  
            ref,     
            totalAmount,
            dueAmount,
        });

        await newPurchaseBill.save();

        res.status(201).json({
            success: true,
            message: "Purchase Bill created successfully.",
            data: newPurchaseBill,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error creating Purchase Bill.",
            error: error.message,
        });
    }
};

// Update a purchase bill by ID
const updatePurchaseBill = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const updatedPurchaseBill = await PurchaseBillModel.findByIdAndUpdate(id, updateData, {
            new: true,
        });

        if (!updatedPurchaseBill) {
            return res.status(404).json({
                success: false,
                message: "Purchase Bill not found.",
            });
        }

        res.status(200).json({
            success: true,
            message: "Purchase Bill updated successfully.",
            data: updatedPurchaseBill,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error updating Purchase Bill.",
            error: error.message,
        });
    }
};

// Delete a purchase bill by ID
const deletePurchaseBill = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedPurchaseBill = await PurchaseBillModel.findByIdAndDelete(id);

        if (!deletedPurchaseBill) {
            return res.status(404).json({
                success: false,
                message: "Purchase Bill not found.",
            });
        }

        res.status(200).json({
            success: true,
            message: "Purchase Bill deleted successfully.",
            data: deletedPurchaseBill,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error deleting Purchase Bill.",
            error: error.message,
        });
    }
};

module.exports = {
    getAllPurchaseBills,
    getPurchaseBillById,
    createPurchaseBill,
    updatePurchaseBill,
    deletePurchaseBill,
};
