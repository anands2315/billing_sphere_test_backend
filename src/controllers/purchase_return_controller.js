const PurchaseReturnModel = require("../models/purchase_return_model");
const mongoose = require("mongoose");
const Items = require("../models/items_model");
const Ledger = require("../models/ledger_model");
const Purchase = require("../models/purchase_model");
const PurchseReturnModel = require("../models/purchase_return_model");

const PurchaseReturnController = {

    createPurchaseReturn: async function (req, res) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const purchaseReturnData = req.body;
            purchaseReturnData.totalAmount = parseFloat(purchaseReturnData.totalAmount);
            purchaseReturnData.cashAmount = parseFloat(purchaseReturnData.cashAmount);

            const newPurchaseReturnData = new PurchaseReturnModel(purchaseReturnData);
            const ledgerID = purchaseReturnData.ledger;
            const purchaseType = purchaseReturnData.type;

            if (purchaseType === "Debit") {
                const ledger = await Ledger.findById(ledgerID).session(session);
                if (!ledger) throw new Error("Ledger not found.");

                ledger.debitBalance -= purchaseReturnData.totalAmount;
                await ledger.save({ session });
            }

            if (purchaseType === "Cash") {
                newPurchaseReturnData.cashAmount = purchaseReturnData.totalAmount;
            }

            const existingPurchase = await PurchaseReturnModel.findOne({ billNumber: req.body.billNumber }).session(session);
            if (existingPurchase) throw new Error("Bill No already exists.");

            await newPurchaseReturnData.save({ session });

            for (const entry of purchaseReturnData.entries) {
                const productId = entry.itemName;
                const quantity = entry.qty;
                const sellingPrice = entry.sellingPrice;

                const product = await Items.findById(productId).session(session);
                if (!product) throw new Error("Product not found.");

                product.maximumStock -= quantity;
                product.price = sellingPrice;
                await product.save({ session });
            }

            for (const bill of purchaseReturnData.billwise) {
                const purchaseId = bill.purchase;
                const amount = bill.amount;

                const purchase = await Purchase.findById(purchaseId).session(session);
                if (!purchase) throw new Error("Purchase not found.");

                purchase.dueAmount -= amount;
                await purchase.save({ session });
            }

            await session.commitTransaction();
            session.endSession();

            return res.json({
                success: true,
                message: "Purchase Return entry created successfully!",
                data: newPurchaseReturnData,
            });
        } catch (ex) {
            await session.abortTransaction();
            session.endSession();
            return res.json({ success: false, message: ex.message });
        }
    },


    getAllPurchaseReturn: async function (req, res) {
        try {
            const purchase = await PurchaseReturnModel.find({});
            return res.json({ success: true, data: purchase });
        } catch (ex) {
            return res.json({ success: false, message: ex });
        }
    },

    fetchAllPurchaseReturn: async function (req, res) {
        try {
            const { companyCode } = req.params;
            const fetchAllPurchase = await PurchaseReturnModel.find({
                companyCode: companyCode,
            });
            return res.json({ success: true, data: fetchAllPurchase });
        } catch (ex) {
            return res.json({ success: false, message: ex });
        }
    },

    fetchPurchaseReturnById: async function (req, res) {
        try {
            const { companyCode, id } = req.params;
            const fetchPurchaseReturnById = await PurchaseReturnModel.findOne({ companyCode, _id: id });
            return res.json({ success: true, data: fetchPurchaseReturnById });
        } catch (ex) {
            return res.json({ success: false, message: ex });

        }
    },

    updatePurchaseReturn: async function (req, res) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const { id } = req.params;
            const updatedData = req.body;
            console.log(updatedData);

            const existingPurchaseReturn = await PurchaseReturnModel.findById(id).session(session);
            if (!existingPurchaseReturn) throw new Error("Purchase return not found.");

            const ledgerID = existingPurchaseReturn.ledger;
            const purchaseType = existingPurchaseReturn.type;

            if (purchaseType === "Debit") {
                const ledger = await Ledger.findById(ledgerID).session(session);
                if (!ledger) throw new Error("Ledger not found.");
                console.log(existingPurchaseReturn.totalAmount);
                console.log(`before update ledger debit balance : ${ledger.debitBalance}`);
                ledger.debitBalance += parseFloat(existingPurchaseReturn.totalAmount);
                console.log(`updated ledger debit balance : ${ledger.debitBalance}`);
                await ledger.save({ session });
            }

            for (const entry of existingPurchaseReturn.entries) {
                const productId = entry.itemName;
                const product = await Items.findById(productId).session(session);
                if (!product) throw new Error("Product not found.");

                await Items.updateOne(
                    { _id: productId },
                    { $inc: { maximumStock: entry.qty } },
                    { session }
                );
            }

            for (const bill of existingPurchaseReturn.billwise) {
                const purchaseId = bill.purchase;
                const purchase = await Purchase.findById(purchaseId).session(session);
                if (!purchase) throw new Error("Purchase not found.");
                purchase.dueAmount += bill.amount;
                await purchase.save({ session });
            }

            updatedData.totalAmount = parseFloat(updatedData.totalAmount);
            updatedData.cashAmount = parseFloat(updatedData.cashAmount);

            if (updatedData.type === "Debit") {
                const ledger = await Ledger.findById(updatedData.ledger).session(session);
                if (!ledger) throw new Error("Ledger not found.");
                console.log(updatedData.totalAmount);
                console.log(ledger.debitBalance);
                ledger.debitBalance -= updatedData.totalAmount;
                console.log(ledger.debitBalance);
                await ledger.save({ session });
            }

            if (updatedData.type === "Cash") {
                updatedData.cashAmount = updatedData.totalAmount;
            }

            for (const entry of updatedData.entries) {
                const productId = entry.itemName;
                const product = await Items.findById(productId).session(session);
                if (!product) throw new Error("Product not found.");

                await Items.updateOne(
                    { _id: productId },
                    {
                        $inc: { maximumStock: -entry.qty },
                        $set: { price: entry.sellingPrice }
                    },
                    { session }
                );
            }

            for (const bill of updatedData.billwise) {
                const purchaseId = bill.purchase;
                const purchase = await Purchase.findById(purchaseId).session(session);
                if (!purchase) throw new Error("Purchase not found.");
                purchase.dueAmount -= bill.amount;
                await purchase.save({ session });
            }

            const updatedPurchaseReturn = await PurchaseReturnModel.findByIdAndUpdate(id, updatedData, { session, new: true });

            await session.commitTransaction();
            session.endSession();

            return res.json({
                success: true,
                message: "Purchase Return entry updated successfully!",
                data: updatedPurchaseReturn,
            });
        } catch (ex) {
            await session.abortTransaction();
            session.endSession();
            return res.json({ success: false, message: ex.message });
        }
    },

    deletePurchaseReturn: async function (req, res) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const { id } = req.params;
            const existingPurchaseReturn = await PurchaseReturnModel.findById(id).session(session);
            if (!existingPurchaseReturn) throw new Error("Purchase return not found.");

            const ledgerID = existingPurchaseReturn.ledger;
            const purchaseType = existingPurchaseReturn.type;

            if (purchaseType === "Debit") {
                const ledger = await Ledger.findById(ledgerID).session(session);
                if (!ledger) throw new Error("Ledger not found.");

                ledger.debitBalance += parseFloat(existingPurchaseReturn.totalAmount);

                await ledger.save({ session });
            }

            for (const entry of existingPurchaseReturn.entries) {
                const productId = entry.itemName;
                const product = await Items.findById(productId).session(session);
                if (!product) throw new Error("Product not found.");

                await Items.updateOne(
                    { _id: productId },
                    { $inc: { maximumStock: entry.qty } },
                    { session }
                );
            }

            for (const bill of existingPurchaseReturn.billwise) {
                const purchaseId = bill.purchase;
                const purchase = await Purchase.findById(purchaseId).session(session);
                if (!purchase) throw new Error("Purchase not found.");

                purchase.dueAmount += bill.amount;
                await purchase.save({ session });
            }

            await PurchaseReturnModel.findByIdAndDelete(id).session(session);

            await session.commitTransaction();
            session.endSession();

            return res.json({
                success: true,
                message: "Purchase return deleted successfully."
            });
        } catch (ex) {
            await session.abortTransaction();
            session.endSession();
            return res.json({ success: false, message: ex.message });
        }
    }

}

module.exports = PurchaseReturnController;
