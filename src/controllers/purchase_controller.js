const PurchaseModel = require("../models/purchase_model");
const mongoose = require("mongoose");
const Items = require("../models/items_model");
const Ledger = require("../models/ledger_model");
const PurchaseBillModel = require("../models/purchase_bills_models");


const PurchaseController = {

  createPurchase: async function (req, res) {
    try {
      const purchaseData = req.body;
      purchaseData.totalamount = parseFloat(purchaseData.totalamount);
      purchaseData.cashAmount = parseFloat(purchaseData.cashAmount);
      purchaseData.dueAmount = parseFloat(purchaseData.dueAmount);
      
      const newPurchaseData = new PurchaseModel(purchaseData);
      
      const ledgerID = purchaseData.ledger;
      const purchaseType = purchaseData.type;
      
      if (purchaseType === "Debit") {
        const ledger = await Ledger.findById(ledgerID);
        ledger.debitBalance -= purchaseData.totalamount;
        await ledger.save();
        
        const purchaseBillData = {
          date:purchaseData.date,
          companyCode: purchaseData.companyCode,
          name: `RP# ${purchaseData.no}`, 
          type: 'RP', 
          ledger:purchaseData.ledger,
          ref: newPurchaseData._id, 
          totalAmount: purchaseData.totalamount,
          dueAmount: purchaseData.totalamount,
        };
    
        const newPurchaseBill = new PurchaseBillModel(purchaseBillData);
        await newPurchaseBill.save();
      }
    
      if (purchaseType === "Cash") {
        newPurchaseData.cashAmount = purchaseData.totalamount;
      }
  
      const existingPurchase = await PurchaseModel.findOne({
        $or: [{ billNumber: req.body.billNumber }],
      });
    
      if (existingPurchase) {
        return res.json({
          success: false,
          message: "Bill No already exists.",
        });
      }
    
      await newPurchaseData.save();
    
      for (const entry of purchaseData.entries) {
        const productId = entry.itemName;
        const quantity = entry.qty;
        const sellingPrice = entry.sellingPrice;
    
        const product = await Items.findById(productId);
    
        if (!product) {
          return res.json({
            success: false,
            message: "Product not found.",
          });
        }
    
        await Items.updateOne(
          { _id: productId },
          { $inc: { maximumStock: quantity }, price: sellingPrice }
        );
      }
    
      return res.json({
        success: true,
        message: "Purchase entry created successfully!",
        data: newPurchaseData,
      });
    } catch (ex) {
      return res.json({ success: false, message: ex.message });
    }
  },
  
  

  //  Get all purchase
  getAllpurchase: async function (req, res) {
    try {
      const purchase = await PurchaseModel.find({});
      return res.json({ success: true, data: purchase });
    } catch (ex) {
      return res.json({ success: false, message: ex });
    }
  },

  //For Fetching all Purchase

  fetchAllPurchase: async function (req, res) {
    try {
      const { companyCode } = req.params;
      const fetchAllPurchase = await PurchaseModel.find({
        companyCode: companyCode,
      });
      return res.json({ success: true, data: fetchAllPurchase });
    } catch (ex) {
      return res.json({ success: false, message: ex });
    }
  },

  //For Fetching purchase by id
  fetchPurchseById: async function (req, res) {
    try {
      const id = req.params.id;
      const foundPurchaseById = await PurchaseModel.findById(id);
      if (!foundPurchaseById) {
        return res.json({
          success: false,
          message: "Purchase entry not found.",
        });
      }
      return res.json({ success: true, data: foundPurchaseById });
    } catch (ex) {
      res.json({ success: false, message: ex });
    }
  },

  // For Fetching Purchase by Bill Number
  fetchPurchaseByBillNumber: async function (req, res) {
    try {
      const billNumber = req.params.billNumber;
      const foundPurchaseByBillNumber = await PurchaseModel.findOne({
        billNumber,
      });
      if (!foundPurchaseByBillNumber) {
        return res.json({
          success: false,
          message: "Purchase entry not found.",
        });
      }
      return res.json({ success: true, data: foundPurchaseByBillNumber });
    } catch (ex) {
      res.json({ success: false, message: ex });
    }
  },

   fetchPurchaseByItemName : async (req, res) => {
    const { itemNameId } = req.params;
  
    try {
      if (!mongoose.Types.ObjectId.isValid(itemNameId)) {
        return res.status(400).json({ message: "Invalid itemName ID" });
      }
  
      const purchaseEntries = await PurchaseModel.find({
        entries: {
          $elemMatch: { itemName: itemNameId },
        },
      }); 
  
      res.status(200).json(purchaseEntries);
    } catch (error) {
      console.error("Error fetching purchase entries:", error.message);
      res.status(500).json({ message: "Failed to fetch purchase entries", error: error.message });
    }
  },

  fetchPurchaseByLedger: async function (req, res) {
    try {
      const { ledger } = req.params;

      const ledgerId = new mongoose.Types.ObjectId(ledger);

      const purchase = await PurchaseModel.find({ ledger: ledgerId });
      if (!purchase) {
        return res.json({ success: false, message: "Purchase entry not found." });
      }
      return res.json({ success: true, data: purchase });
    } catch (ex) {
      return res.json({ success: false, message: ex });
    }
  },

  deletePurchase: async function (req, res) {
    try {
      const purchaseId = req.params.id;
  
      const existingPurchase = await PurchaseModel.findById(purchaseId).populate('entries.itemName');
      if (!existingPurchase) {
        return res.json({ success: false, message: "Purchase entry not found." });
      }
  
      if (existingPurchase.type === "Debit") {
        const ledger = await Ledger.findById(existingPurchase.ledger);
        if (ledger) {
          ledger.debitBalance += parseFloat(existingPurchase.totalamount);
          await ledger.save();
  
          await PurchaseBillModel.deleteOne({ ref: purchaseId });
        }
      }
  
      for (const entry of existingPurchase.entries) {
        const product = await Items.findById(entry.itemName._id);
        if (product) {
          await Items.updateOne(
            { _id: entry.itemName._id },
            { $inc: { maximumStock: -entry.qty } }
          );
        }
      }
  
      await PurchaseModel.findByIdAndDelete(purchaseId);
  
      return res.json({ success: true, message: "Purchase entry deleted successfully!" });
    } catch (ex) {
      return res.json({ success: false, message: ex.message });
    }
  },
  
  updatePurchase: async function (req, res) {
    try {
      const purchaseId = req.params.id;
      const updatedPurchaseData = req.body;
  
      const existingPurchase = await PurchaseModel.findById(purchaseId).populate('entries.itemName');
      if (!existingPurchase) {
        return res.json({ success: false, message: "Purchase entry not found." });
      }
  
      const duplicatePurchase = await PurchaseModel.findOne({
        billNumber: updatedPurchaseData.billNumber,
        _id: { $ne: purchaseId },
      });
      if (duplicatePurchase) {
        return res.json({ success: false, message: "Bill number already exists." });
      }
  
      const ledger = await Ledger.findById(existingPurchase.ledger);
      if (!ledger) {
        return res.json({ success: false, message: "Ledger not found." });
      }
  
      if (existingPurchase.type === "Debit") {
        ledger.debitBalance += parseFloat(existingPurchase.totalamount);
        await ledger.save();
  
        await PurchaseBillModel.deleteOne({ ref: purchaseId });
      }
  
      for (const entry of existingPurchase.entries) {
        const product = await Items.findById(entry.itemName._id);
        if (product) {
          await Items.updateOne(
            { _id: entry.itemName._id },
            { $inc: { maximumStock: -entry.qty } }
          );
        }
      }
  
      updatedPurchaseData.totalamount = parseFloat(updatedPurchaseData.totalamount);
      updatedPurchaseData.cashAmount = parseFloat(updatedPurchaseData.cashAmount);
      updatedPurchaseData.dueAmount = parseFloat(updatedPurchaseData.dueAmount);
  
      await PurchaseModel.findByIdAndUpdate(purchaseId, updatedPurchaseData, { new: true });
  
      if (updatedPurchaseData.type === "Debit") {
        ledger.debitBalance -= updatedPurchaseData.totalamount;
        await ledger.save();
  
        const purchaseBillData = {
          date: updatedPurchaseData.date,
          companyCode: updatedPurchaseData.companyCode,
          name: `RP# ${updatedPurchaseData.no}`,
          type: 'RP',
          ledger: updatedPurchaseData.ledger,
          ref: purchaseId,
          totalAmount: updatedPurchaseData.totalamount,
          dueAmount: updatedPurchaseData.totalamount,
        };
  
        const newPurchaseBill = new PurchaseBillModel(purchaseBillData);
        await newPurchaseBill.save();
      } else if (updatedPurchaseData.type === "Cash") {
        updatedPurchaseData.cashAmount = updatedPurchaseData.totalamount;
      }
  
      for (const entry of updatedPurchaseData.entries) {
        const product = await Items.findById(entry.itemName);
        if (product) {
          await Items.updateOne(
            { _id: entry.itemName },
            { $inc: { maximumStock: entry.qty }, price: entry.sellingPrice }
          );
        }
      }
  
      return res.json({ success: true, message: "Purchase entry updated successfully!" });
    } catch (ex) {
      return res.json({ success: false, message: ex.message });
    }
  },
  
};

module.exports = PurchaseController;
