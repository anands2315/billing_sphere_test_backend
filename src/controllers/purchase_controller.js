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
        ledger.debitBalance += purchaseData.totalamount;
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

  //For Deleting Purchase Entry
  deletePurchaseById: async function (req, res) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const id = req.params.id;
  
      const getPurchase = await PurchaseModel.findById(id).session(session);
      if (!getPurchase) {
        return res.json({ success: false, message: "Purchase entry not found." });
      }
  
      const ledgerID = getPurchase.ledger;
      const purchaseType = getPurchase.type;
      const purchaseTotalAmount = parseFloat(getPurchase.totalamount);
  
      for (const entry of getPurchase.entries) {
        const productId = entry.itemName;
        const quantity = entry.qty;
  
        const product = await Items.findById(productId).session(session);
        if (!product) {
          await session.abortTransaction();
          session.endSession();
          return res.json({ success: false, message: "Product not found." });
        }
  
        await Items.updateOne(
          { _id: productId },
          { $inc: { maximumStock: -quantity } }
        ).session(session);
      }
  
      if (purchaseType === "Debit") {
        const ledger = await Ledger.findById(ledgerID).session(session);
        if (ledger) {
          ledger.debitBalance -= purchaseTotalAmount;
          await ledger.save();
        }
      }
  
      const deletedPurchase = await PurchaseModel.findByIdAndDelete(id).session(session);
      if (!deletedPurchase) {
        await session.abortTransaction();
        session.endSession();
        return res.json({ success: false, message: "Purchase not found" });
      }
  
      await session.commitTransaction();
      session.endSession();
      return res.json({ success: true, message: "Deleted Successfully!" });
    } catch (ex) {
      await session.abortTransaction();
      session.endSession();
      return res.json({ success: false, message: ex.message });
    }
  },
  


  //For updating Purchase Entry
  updatePurchase: async function (req, res) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const { id } = req.params;
      const updatedData = req.body;

      const existingPurchase = await PurchaseModel.findById(id).session(session);
      if (!existingPurchase) throw new Error("Purchase Entry not found.");

      const ledgerID = existingPurchase.ledger;
      const purchaseType = existingPurchase.type;
      const purchaseTotalAmount = parseFloat(existingPurchase.totalamount);

      if (purchaseType === "Debit") {
        const ledger = await Ledger.findById(ledgerID).session(session);
        if (ledger) {
          ledger.debitBalance -= purchaseTotalAmount;
          await ledger.save();
        }
      }

      for (const entry of existingPurchase.entries) {
        const productId = entry.itemName;
        const quantity = entry.qty;

        await Items.updateOne(
          { _id: productId },
          { $inc: { maximumStock: -quantity } }
        ).session(session);
      }

      updatedData.totalamount = parseFloat(updatedData.totalamount);
      updatedData.cashAmount = parseFloat(updatedData.cashAmount);
      updatedData.dueAmount = parseFloat(updatedData.dueAmount);

      const newLedger = await Ledger.findById(updatedData.ledger).session(session);
      if (updatedData.type === "Debit" && newLedger) {
        newLedger.debitBalance += updatedData.totalamount;
        await newLedger.save();
      }
      if (updatedData.type === "Cash") {
        updatedData.cashAmount = updatedData.totalamount;
      }

      for (const entry of updatedData.entries) {
        const productId = entry.itemName;
        const quantity = entry.qty;
        const sellingPrice = entry.sellingPrice;

        await Items.updateOne(
          { _id: productId },
          { $inc: { maximumStock: quantity }, price: sellingPrice }
        ).session(session);
      }

      const updatedPurchase = await PurchaseModel.findByIdAndUpdate(
        id,
        updatedData,
        { new: true, session }
      );

      await session.commitTransaction();
      session.endSession();

      return res.json({
        success: true,
        message: "Purchase entry updated successfully!",
        data: updatedPurchase,
      });
    } catch (ex) {
      await session.abortTransaction();
      session.endSession();
      return res.json({ success: false, message: ex.message });
    }
  },


};

module.exports = PurchaseController;
