const PurchaseReturnModel = require("../models/purchase_return_model");
const mongoose = require("mongoose");
const Items = require("../models/items_model");
const Ledger = require("../models/ledger_model");
const Purchase = require("../models/purchase_model");
const PurchaseBillModel = require("../models/purchase_bills_models");

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

            const ledger = await Ledger.findById(ledgerID).session(session);
            if (!ledger) throw new Error("Ledger not found.");

            const existingPurchase = await PurchaseReturnModel.findOne({ billNumber: req.body.billNumber }).session(session);
            if (existingPurchase) throw new Error("Bill No already exists.");

            await newPurchaseReturnData.save({ session });

            for (const entry of purchaseReturnData.entries) {
                const productId = entry.itemName;
                const quantity = entry.qty;

                const product = await Items.findById(productId).session(session);
                if (!product) throw new Error("Product not found.");

                await Items.updateOne(
                    { _id: productId },
                    { $inc: { maximumStock: -quantity } },
                    { session }
                );
            }

            if (purchaseType !== "Cash") {
                for (const bill of purchaseReturnData.billwise) {
                    const billType = bill.billType;
                    const amount = parseFloat(bill.amount);

                    if (billType === "New Ref.") {
                        const newPurchaseBill = new PurchaseBillModel({
                            date: purchaseReturnData.date,
                            companyCode: purchaseReturnData.companyCode,
                            name: bill.billName,
                            type: "PR",
                            ledger: purchaseReturnData.ledger,
                            ref: newPurchaseReturnData._id,
                            totalAmount: amount,
                            dueAmount: amount,
                            dueDate : bill.dueDate,
                        });

                        await newPurchaseBill.save({ session });

                        const billwiseEntry = newPurchaseReturnData.billwise.find(
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
                            purchaseBill.dueAmount = parseFloat(purchaseBill.dueAmount) - amount;
                        } else {
                            purchaseBill.dueAmount = parseFloat(purchaseBill.dueAmount) + amount;
                        }

                        await purchaseBill.save({ session });
                    }

                    ledger.debitBalance += amount;
                }
            } else {
                newPurchaseReturnData.cashAmount = purchaseReturnData.totalAmount;
            }

            await ledger.save({ session });

            await newPurchaseReturnData.save({ session });

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

    fetchPurchaseReturnByLedger: async function (req, res) {
        try {
            const { ledger } = req.params;
            const ledgerId = new mongoose.Types.ObjectId(ledger);
            const purchaseReturn = await PurchaseReturnModel.find({ ledger: ledgerId });
            if (!purchaseReturn) {
                return res.json({ success: false, message: "Purchase Return entry not found." });
            }
            return res.json({ success: true, data: purchaseReturn });
        } catch (ex) {
            return res.json({ success: false, message: ex });

        }
    },

    updatePurchaseReturn: async function (req, res) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const purchaseReturnData = req.body;
            const purchaseReturnId = req.params.id;

            const existingPurchaseReturn = await PurchaseReturnModel.findById(purchaseReturnId).session(session);
            if (!existingPurchaseReturn) throw new Error("Purchase Return not found.");

            const ledger = await Ledger.findById(existingPurchaseReturn.ledger).session(session);
            if (!ledger) throw new Error("Ledger not found.");

            for (const entry of existingPurchaseReturn.entries) {
                const productId = entry.itemName;
                const quantity = entry.qty;

                const product = await Items.findById(productId).session(session);
                if (!product) throw new Error("Product not found.");

                await Items.updateOne(
                    { _id: productId },
                    { $inc: { maximumStock: quantity } },
                    { session }
                );
            }

            for (const bill of existingPurchaseReturn.billwise) {
                const billType = bill.billType;
                const amount = bill.amount;

                if (billType === "New Ref.") {
                    const purchaseBill = await PurchaseBillModel.findById(bill.purchaseBill).session(session);
                    if (purchaseBill) {
                        await PurchaseBillModel.deleteOne({ _id: bill.purchaseBill }).session(session);
                    }
                } else if (billType === "Against Ref.") {
                    const purchaseBill = await PurchaseBillModel.findById(bill.purchaseBill).session(session);
                    if (purchaseBill) {
                        if (purchaseBill.type === "RP") {
                            purchaseBill.dueAmount = parseFloat(purchaseBill.dueAmount) + parseFloat(amount);
                        } else {
                            purchaseBill.dueAmount = parseFloat(purchaseBill.dueAmount) - parseFloat(amount);
                        }
                        await purchaseBill.save({ session });
                    }
                }
            }

            if (existingPurchaseReturn.type === "Debit") {
                ledger.debitBalance = parseFloat(ledger.debitBalance) - parseFloat(existingPurchaseReturn.totalAmount);
            }

            if (existingPurchaseReturn.type === "Cash") {
                existingPurchaseReturn.cashAmount = 0;
            }

            await ledger.save({ session });

            existingPurchaseReturn.entries = [];
            existingPurchaseReturn.billwise = [];

            Object.assign(existingPurchaseReturn, purchaseReturnData);
            existingPurchaseReturn.totalAmount = parseFloat(purchaseReturnData.totalAmount);
            existingPurchaseReturn.cashAmount = parseFloat(purchaseReturnData.cashAmount);

            for (const entry of purchaseReturnData.entries) {
                const productId = entry.itemName;
                const quantity = entry.qty;

                const product = await Items.findById(productId).session(session);
                if (!product) throw new Error("Product not found.");

                await Items.updateOne(
                    { _id: productId },
                    { $inc: { maximumStock: -quantity } },
                    { session }
                );
            }

            for (const bill of purchaseReturnData.billwise) {
                const billType = bill.billType;
                const amount = bill.amount;

                if (billType === "New Ref.") {
                    const newPurchaseBill = new PurchaseBillModel({
                        date: purchaseReturnData.date,
                        companyCode: purchaseReturnData.companyCode,
                        name: bill.billName,
                        type: "PR",
                        ledger: purchaseReturnData.ledger,
                        ref: existingPurchaseReturn._id,
                        totalAmount: amount,
                        dueAmount: amount,
                        dueDate : bill.dueDate,
                    });

                    await newPurchaseBill.save({ session });

                    const billwiseEntry = existingPurchaseReturn.billwise.find(
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
                        purchaseBill.dueAmount = parseFloat(purchaseBill.dueAmount) - parseFloat(amount);
                    } else {
                        purchaseBill.dueAmount = parseFloat(purchaseBill.dueAmount) + parseFloat(amount);
                    }
                    await purchaseBill.save({ session });
                }
            }

            if (purchaseReturnData.type === "Debit") {
                ledger.debitBalance = parseFloat(ledger.debitBalance) + parseFloat(purchaseReturnData.totalAmount );
            }

            if (purchaseReturnData.type === "Cash") {
                existingPurchaseReturn.cashAmount = purchaseReturnData.totalAmount;
            }

            await ledger.save({ session });
            await existingPurchaseReturn.save({ session });

            await session.commitTransaction();
            session.endSession();

            return res.json({
                success: true,
                message: "Purchase Return entry updated successfully!",
                data: existingPurchaseReturn,
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
            const purchaseReturnId = req.params.id;

            const existingPurchaseReturn = await PurchaseReturnModel.findById(purchaseReturnId).session(session);
            if (!existingPurchaseReturn) throw new Error("Purchase Return not found.");

            const ledger = await Ledger.findById(existingPurchaseReturn.ledger).session(session);
            if (!ledger) throw new Error("Ledger not found.");

            for (const entry of existingPurchaseReturn.entries) {
                const productId = entry.itemName;
                const quantity = entry.qty;

                const product = await Items.findById(productId).session(session);
                if (!product) throw new Error("Product not found.");

                await Items.updateOne(
                    { _id: productId },
                    { $inc: { maximumStock: quantity } },
                    { session }
                );
            }

            for (const bill of existingPurchaseReturn.billwise) {
                const billType = bill.billType;
                const amount = bill.amount;

                if (billType === "New Ref.") {
                    const purchaseBill = await PurchaseBillModel.findById(bill.purchaseBill).session(session);
                    if (purchaseBill) {
                        await PurchaseBillModel.deleteOne({ _id: bill.purchaseBill }).session(session);
                    }
                } else if (billType === "Against Ref.") {
                    const purchaseBill = await PurchaseBillModel.findById(bill.purchaseBill).session(session);
                    if (purchaseBill) {
                        if (purchaseBill.type === "RP") {
                            purchaseBill.dueAmount = parseFloat(purchaseBill.dueAmount) + parseFloat(amount);
                        } else {
                            purchaseBill.dueAmount = parseFloat(purchaseBill.dueAmount) - parseFloat(amount);
                        }
                        await purchaseBill.save({ session });
                    }
                }
            }

            if (existingPurchaseReturn.type === "Debit") {
                ledger.debitBalance = parseFloat(ledger.debitBalance) - parseFloat(existingPurchaseReturn.totalAmount);
            }

            if (existingPurchaseReturn.type === "Cash") {
                existingPurchaseReturn.cashAmount = 0;
            }

            await ledger.save({ session });

            await PurchaseReturnModel.deleteOne({ _id: purchaseReturnId }).session(session);

            await session.commitTransaction();
            session.endSession();

            return res.json({
                success: true,
                message: "Purchase Return entry deleted successfully!",
            });
        } catch (ex) {
            await session.abortTransaction();
            session.endSession();
            return res.json({ success: false, message: ex.message });
        }
    }


}

module.exports = PurchaseReturnController;
