const PurchaseModel = require("../models/purchase_model");
const mongoose = require("mongoose");
const Items = require("../models/items_model");
const Ledger = require("../models/ledger_model");
const PurchaseBillModel = require("../models/purchase_bills_models");


const PurchaseController = {

  createPurchase: async function (req, res) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const purchaseData = req.body;

        purchaseData.totalamount = parseFloat(purchaseData.totalamount);
        purchaseData.cashAmount = parseFloat(purchaseData.cashAmount);
        purchaseData.dueAmount = parseFloat(purchaseData.dueAmount);

        const newPurchaseData = new PurchaseModel(purchaseData);
        const ledgerID = purchaseData.ledger;
        const purchaseType = purchaseData.type;

        const ledger = await Ledger.findById(ledgerID).session(session);
        if (!ledger) throw new Error("Ledger not found.");

        const existingPurchase = await PurchaseModel.findOne({ billNumber: req.body.billNumber }).session(session);
        if (existingPurchase) throw new Error("Bill No already exists.");

        await newPurchaseData.save({ session });

        for (const entry of purchaseData.entries) {
            const productId = entry.itemName;
            const quantity = entry.qty;
            const sellingPrice = entry.sellingPrice;

            const product = await Items.findById(productId).session(session);
            if (!product) throw new Error("Product not found.");

            await Items.updateOne(
                { _id: productId },
                { $inc: { maximumStock: quantity }, price: sellingPrice },
                { session }
            );
        }

        if (purchaseType !== "Cash") {
            for (const bill of purchaseData.billwise) {
                const billType = bill.billType;
                const amount = parseFloat(bill.amount);

                if (billType === "New Ref.") {
                    const newPurchaseBill = new PurchaseBillModel({
                        date: purchaseData.date,
                        companyCode: purchaseData.companyCode,
                        name: bill.billName,
                        type: "RP",
                        ledger: purchaseData.ledger,
                        ref: newPurchaseData._id,
                        totalAmount: amount,
                        dueAmount: amount,
                        dueDate: bill.dueDate,
                    });

                    await newPurchaseBill.save({ session });

                    const billwiseEntry = newPurchaseData.billwise.find(
                        (b) => b.billName === bill.billName && b.billType === "New Ref." && b.amount === amount
                    );
                    if (billwiseEntry) {
                        billwiseEntry.purchaseBill = newPurchaseBill._id;
                    }
                } else if (billType === "Against Ref.") {
                    const purchaseBillId = bill.purchaseBill;

                    if (!purchaseBillId) throw new Error("Purchase Bill ID is required for Against Ref.");

                    const purchaseBill = await PurchaseBillModel.findById(purchaseBillId).session(session);
                    if (!purchaseBill) throw new Error("Purchase Bill not found.");

                    if (purchaseBill.type === "RP") {
                        purchaseBill.dueAmount = parseFloat(purchaseBill.dueAmount) + amount;
                    } else {
                        purchaseBill.dueAmount = parseFloat(purchaseBill.dueAmount) - amount;
                    }

                    await purchaseBill.save({ session });
                }

                ledger.debitBalance -= amount;
            }
        } else {
            newPurchaseData.cashAmount = purchaseData.totalamount;
        }

        await ledger.save({ session });
        await newPurchaseData.save({ session });

        await session.commitTransaction();
        session.endSession();

        return res.json({
            success: true,
            message: "Purchase entry created successfully!",
            data: newPurchaseData,
        });
    } catch (ex) {
        await session.abortTransaction();
        session.endSession();
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
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        const purchaseId = req.params.id;
        const existingPurchase = await PurchaseModel.findById(purchaseId).session(session);
        if (!existingPurchase) throw new Error("Purchase not found.");

        const ledger = await Ledger.findById(existingPurchase.ledger).session(session);
        if (!ledger) throw new Error("Ledger not found.");

        for (const entry of existingPurchase.entries) {
            await Items.updateOne(
                { _id: entry.itemName },
                { $inc: { maximumStock: -entry.qty } },
                { session }
            );
        }

        for (const bill of existingPurchase.billwise) {
            if (bill.billType === "New Ref.") {
                await PurchaseBillModel.findByIdAndDelete(bill.purchaseBill).session(session);
            } else if (bill.billType === "Against Ref.") {
              const purchaseBillId = bill.purchaseBill;

              if (!purchaseBillId) throw new Error("Purchase Bill ID is required for Against Ref.");

              const purchaseBill = await PurchaseBillModel.findById(purchaseBillId).session(session);
              if (!purchaseBill) throw new Error("Purchase Bill not found.");

              if (purchaseBill.type === "RP") {
                  purchaseBill.dueAmount = parseFloat(purchaseBill.dueAmount) - amount;
              } else {
                  purchaseBill.dueAmount = parseFloat(purchaseBill.dueAmount) + amount;
              }

              await purchaseBill.save({ session });
            }
            ledger.debitBalance += bill.amount;
        }

        await ledger.save({ session });
        await PurchaseModel.findByIdAndDelete(purchaseId).session(session);

        await session.commitTransaction();
        session.endSession();

        return res.json({ success: true, message: "Purchase deleted successfully!" });
    } catch (ex) {
        await session.abortTransaction();
        session.endSession();
        return res.json({ success: false, message: ex.message });
    }
},
  
updatePurchase: async function (req, res) {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
      const purchaseId = req.params.id;
      const updatedData = req.body;
      
      const existingPurchase = await PurchaseModel.findById(purchaseId).session(session);
      if (!existingPurchase) throw new Error("Purchase not found.");

      const ledger = await Ledger.findById(existingPurchase.ledger).session(session);
      if (!ledger) throw new Error("Ledger not found.");

      for (const entry of existingPurchase.entries) {
          await Items.updateOne(
              { _id: entry.itemName },
              { $inc: { maximumStock: -entry.qty } },
              { session }
          );
      }

      for (const bill of existingPurchase.billwise) {
          if (bill.billType === "New Ref.") {
              await PurchaseBillModel.findByIdAndDelete(bill.purchaseBill).session(session);
          } else if (bill.billType === "Against Ref.") {
            const purchaseBillId = bill.purchaseBill;

            if (!purchaseBillId) throw new Error("Purchase Bill ID is required for Against Ref.");

            const purchaseBill = await PurchaseBillModel.findById(purchaseBillId).session(session);
            if (!purchaseBill) throw new Error("Purchase Bill not found.");

            if (purchaseBill.type === "RP") {
                purchaseBill.dueAmount = parseFloat(purchaseBill.dueAmount) - amount;
            } else {
                purchaseBill.dueAmount = parseFloat(purchaseBill.dueAmount) + amount;
            }

            await purchaseBill.save({ session });
          }
          ledger.debitBalance += bill.amount;
      }

      await ledger.save({ session });

      const newPurchaseData = await PurchaseModel.findByIdAndUpdate(purchaseId, updatedData, { new: true, session });

      for (const entry of updatedData.entries) {
          await Items.updateOne(
              { _id: entry.itemName },
              { $inc: { maximumStock: entry.qty } },
              { session }
          );
      }

      for (const bill of updatedData.billwise) {
          if (bill.billType === "New Ref.") {
              const newPurchaseBill = new PurchaseBillModel({
                  date: updatedData.date,
                  companyCode: updatedData.companyCode,
                  name: bill.billName,
                  type: "RP",
                  ledger: updatedData.ledger,
                  ref: newPurchaseData._id,
                  totalAmount: bill.amount,
                  dueAmount: bill.amount,
                  dueDate: bill.dueDate,
              });
              await newPurchaseBill.save({ session });
          } else if (bill.billType === "Against Ref.") {
            const purchaseBillId = bill.purchaseBill;

            if (!purchaseBillId) throw new Error("Purchase Bill ID is required for Against Ref.");

            const purchaseBill = await PurchaseBillModel.findById(purchaseBillId).session(session);
            if (!purchaseBill) throw new Error("Purchase Bill not found.");

            if (purchaseBill.type === "RP") {
                purchaseBill.dueAmount = parseFloat(purchaseBill.dueAmount) + amount;
            } else {
                purchaseBill.dueAmount = parseFloat(purchaseBill.dueAmount) - amount;
            }

            await purchaseBill.save({ session });
          }
          ledger.debitBalance -= bill.amount;
      }

      await ledger.save({ session });
      await newPurchaseData.save({ session });

      await session.commitTransaction();
      session.endSession();

      return res.json({ success: true, message: "Purchase updated successfully!", data: newPurchaseData });
  } catch (ex) {
      await session.abortTransaction();
      session.endSession();
      return res.json({ success: false, message: ex.message });
  }
}

  
};

module.exports = PurchaseController;
