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

const fetchSalesBillsByParty = async (req, res) => {
    try {
      const { party, companyCode } = req.params;
      const { fillterDueAmount } = req.query;
  
      // Fetch sales bills that match the party name and company code
      const query = {
        ledger: party,
        companyCode: companyCode,
      };
  
      if (fillterDueAmount === "true") {
        query.dueAmount = { $ne: 0 };
      }
      // If filterNonZeroDue is false or undefined, fetch all bills regardless of due amount
  
      const salesBills = await SalesBillModel.find(query);
  
      if (salesBills.length === 0) {
        return res.status(404).json({
          success: false,
          message:
            "No sales bills found for the specified party and company code.",
        });
      }
  
      return res.status(200).json({ success: true, data: salesBills });
    } catch (error) {
      console.error("Error fetching sales bills:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch sales bills.",
        error: error.message,
      });
    }
  };
  
  const getAllSalesBillsFillter = async (req, res) => {
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
      filter.dueAmount = { $ne: 0 };
  
      const ledgers = await Ledger.find({ ledgerGroup }); // Assuming ledgerGroupId is in the Ledger collection
  
      const ledgerIds = ledgers.map((ledger) => ledger._id);
  
      if (ledgerIds.length > 0) {
        filter.ledger = { $in: ledgerIds };
      } else {
        return res.status(200).json({
          success: true,
          message: "No sales bills found for the specified filters.",
          data: [],
        });
      }
  
      // Fetch sales bills based on the constructed filter
      const salesBills = await SalesBillModel.find(filter);
  
      if (salesBills.length === 0) {
        return res.status(200).json({
          success: true,
          message: "No sales bills found for the specified filters.",
          data: [],
        });
      }
  
      res.status(200).json({
        success: true,
        message: "Sales Bills fetched successfully.",
        data: salesBills,
      });
    } catch (error) {
      console.error("Error fetching sales bills:", error);
      res.status(500).json({ message: "Failed to fetch sales bills", error });
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
    getAllSalesBillsFillter,
    fetchSalesBillsByParty,
    createSalesBill,
    updateSalesBill,
    deleteSalesBill,
};
