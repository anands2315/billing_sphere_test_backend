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

const fetchPurchaseBillsByParty = async (req, res) => {
    try {
      const { ledger, companyCode } = req.params;
      const { fillterDueAmount } = req.query;
  
      // Fetch sales bills that match the party name and company code
      const query = {
        ledger: ledger,
        companyCode: companyCode,
      };
  
      if (fillterDueAmount === "true") {
        query.dueAmount = { $ne: 0 };
      }
      // If filterNonZeroDue is false or undefined, fetch all bills regardless of due amount
  
      const purchaseBills = await PurchaseBillModel.find(query);
  
      if (purchaseBills.length === 0) {
        return res.status(404).json({
          success: false,
          message:
            "No purchase bills found for the specified party and company code.",
        });
      }
  
      return res.status(200).json({ success: true, data: purchaseBills });
    } catch (error) {
      console.error("Error fetching sales bills:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch sales bills.",
        error: error.message,
      });
    }
  };
  
  const getAllPurchaseBillsFillter = async (req, res) => {
    try {
      const { companyCode } = req.params;
      const { ledgerGroup, type } = req.query;
      const filter = {};
  
      // Check if ledgerGroup is null or empty
      if (!ledgerGroup || ledgerGroup.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Ledger group is empty.",
        });
      }
  
      // If type is provided and not empty, add it to the filter
      if (type && type.trim() !== "") {
        filter.type = type;
      }
  
      // If companyCode is provided, add it to the filter
      if (companyCode) {
        filter.companyCode = companyCode;
      }
  
      // Always include dueAmount filter
      // filter.dueAmount = { $ne: 0 };
  
      const ledgers = await Ledger.find({ ledgerGroup }); // Assuming ledgerGroupId is in the Ledger collection
  
      const ledgerIds = ledgers.map((ledger) => ledger._id);
  
      if (ledgerIds.length > 0) {
        filter.ledger = { $in: ledgerIds };
      } else {
        return res.status(200).json({
          success: true,
          message: "No purchase bills found for the specified filters.",
          data: [],
        });
      }
  
      // Fetch purchase bills based on the constructed filter
      const purchaseBills = await PurchaseBillModel.find(filter);
  
      if (purchaseBills.length === 0) {
        return res.status(200).json({
          success: true,
          message: "No Purchase bills found for the specified filters.",
          data: [],
        });
      }
  
      res.status(200).json({
        success: true,
        message: "Purchase Bills fetched successfully.",
        data: purchaseBills,
      });
    } catch (error) {
      console.error("Error fetching purchase bills:", error);
      res.status(500).json({ message: "Failed to fetch purchase bills", error });
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
    fetchPurchaseBillsByParty,
    getAllPurchaseBillsFillter,
    updatePurchaseBill,
    deletePurchaseBill,
};
