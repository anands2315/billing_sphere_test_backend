const mongoose = require("mongoose");
const Items = require("../models/items_model");
const Ledger = require("../models/ledger_model");
const SalesReturnModel = require("../models/sales_return_model");
const SalesBillModel = require("../models/sales_bills_model");
const Sales = require("../models/sales_entry_model");
const { parse } = require("dotenv");


const SalesReturnController = {

    createSalesReturn: async function (req, res) {
        const session = await mongoose.startSession();
        session.startTransaction();
    
        try {
            const salesReturnData = req.body;
            salesReturnData.totalAmount = parseFloat(salesReturnData.totalAmount);
            salesReturnData.cashAmount = parseFloat(salesReturnData.cashAmount);
    
            const newSalesReturnData = new SalesReturnModel(salesReturnData);
            const ledgerID = salesReturnData.ledger;
            const salesType = salesReturnData.type;
    
            const ledger = await Ledger.findById(ledgerID).session(session);
            if (!ledger) throw new Error("Ledger not found.");
    
            const existingSales = await SalesReturnModel.findOne({ billNumber: req.body.billNumber }).session(session);
            if (existingSales) throw new Error("Bill No already exists.");
    
            await newSalesReturnData.save({ session });
    
            if (salesType === "Debit") {
                for (const bill of salesReturnData.billwise) {
                    const billType = bill.billType;
                    const amount = parseFloat(bill.amount);
    
                    if (billType === "New Ref.") {
                        const newSalesBill = new SalesBillModel({
                            date: salesReturnData.date,
                            companyCode: salesReturnData.companyCode,
                            name: bill.billName,
                            type: "SR",
                            ledger: salesReturnData.ledger,
                            ref: newSalesReturnData._id,
                            totalAmount: amount,
                            dueAmount: amount,
                        });
    
                        await newSalesBill.save({ session });
    
                        const billwiseEntry = newSalesReturnData.billwise.find(
                            (b) => b.billName === bill.billName && b.billType === "New Ref." && b.amount === amount
                        );
                        if (billwiseEntry) {
                            billwiseEntry.salesBill = newSalesBill._id;
                        }
                    } else if (billType === "Against Ref.") {
                        const salesBillId = bill.salesBill;
    
                        if (!salesBillId) throw new Error("Sales Bill ID is required for Against Ref.");
    
                        const salesBill = await SalesBillModel.findById(salesBillId).session(session);
                        if (!salesBill) throw new Error("Sales Bill not found.");
    
                        if (salesBill.type === "BS") {
                            salesBill.dueAmount = parseFloat(salesBill.dueAmount) - amount;
                        } else {
                            salesBill.dueAmount = parseFloat(salesBill.dueAmount) + amount;
                        }
    
                        await salesBill.save({ session });
                    }
                }
                ledger.debitBalance -= parseFloat(salesReturnData.totalAmount);
            } else if (salesType === "Cash") {
                newSalesReturnData.cashAmount = salesReturnData.totalAmount;
            }
    
            await ledger.save({ session });

            await newSalesReturnData.save({ session });
    
            for (const entry of salesReturnData.entries) {
                const productId = entry.itemName;
                const quantity = entry.qty;
                const sellingPrice = entry.sellingPrice;
    
                const product = await Items.findById(productId).session(session);
                if (!product) throw new Error("Product not found.");
    
                await Items.updateOne(
                    { _id: productId },
                    {
                        $inc: { maximumStock: quantity },
                    },
                    { session }
                );
            }
    
            await session.commitTransaction();
            session.endSession();
    
            return res.json({
                success: true,
                message: "Sales Return entry created successfully!",
                data: newSalesReturnData,
            });
        } catch (ex) {
            await session.abortTransaction();
            session.endSession();
            return res.json({ success: false, message: ex.message });
        }
    },
    
    
    getAllSalesReturn: async function (req, res) {
        try {
            const sales = await SalesReturnModel.find({});
            return res.json({ success: true, data: sales });
        } catch (ex) {
            return res.json({ success: false, message: ex });
        }
    },

    fetchAllSalesReturn: async function (req, res) {
        try {
            const { companyCode } = req.params;
            const fetchAllSales = await SalesReturnModel.find({
                companyCode: companyCode,
            });
            return res.json({ success: true, data: fetchAllSales });
        } catch (ex) {
            return res.json({ success: false, message: ex });
        }
    },

    fetchSalesReturnById: async function (req, res) {
        try {
            const { companyCode, id } = req.params;
            const fetchSalesReturnById = await SalesReturnModel.findOne({ companyCode, _id: id });
            return res.json({ success: true, data: fetchSalesReturnById });
        } catch (ex) {
            return res.json({ success: false, message: ex });

        }
    },

    updateSalesReturn: async function (req, res) {
        const session = await mongoose.startSession();
        session.startTransaction();
    
        try {
            const salesReturnId = req.params.id;
            const updatedData = req.body;
    
            const existingSalesReturn = await SalesReturnModel.findById(salesReturnId).session(session);
            if (!existingSalesReturn) throw new Error("Sales Return not found.");
    
            // Reverse previous operations
            const ledger = await Ledger.findById(existingSalesReturn.ledger).session(session);
            if (!ledger) throw new Error("Ledger not found.");
    
            if (existingSalesReturn.type === "Debit") {
                for (const bill of existingSalesReturn.billwise) {
                    const amount = bill.amount;
    
                    if (bill.billType === "Against Ref.") {
                        const salesBill = await SalesBillModel.findById(bill.salesBill).session(session);
                        if (!salesBill) throw new Error("Sales Bill not found.");
    
                        if (salesBill.type === "BS") {
                            salesBill.dueAmount = parseFloat(salesBill.dueAmount) + parseFloat(amount); 
                        } else {
                            salesBill.dueAmount = parseFloat(salesBill.dueAmount) + parseFloat(amount); 
                        }
    
                        await salesBill.save({ session });
                    } else if (bill.billType === "New Ref.") {
                        await SalesBillModel.deleteOne({ _id: bill.salesBill }, { session });
                    }
                }
    
                ledger.debitBalance += parseFloat(existingSalesReturn.totalAmount);
            }
    
            for (const entry of existingSalesReturn.entries) {
                const productId = entry.itemName;
                const quantity = entry.qty;
    
                await Items.updateOne(
                    { _id: productId },
                    {
                        $inc: { maximumStock: -quantity },
                    },
                    { session }
                );
            }
    
            await ledger.save({ session });
    
            // Apply new updates
            updatedData.totalAmount = parseFloat(updatedData.totalAmount);
            updatedData.cashAmount = parseFloat(updatedData.cashAmount);
    
            if (updatedData.type === "Debit") {
                for (const bill of updatedData.billwise) {
                    const amount = parseFloat(bill.amount);
    
                    if (bill.billType === "New Ref.") {
                        const newSalesBill = new SalesBillModel({
                            date: updatedData.date,
                            companyCode: updatedData.companyCode,
                            name: bill.billName,
                            type: "SR",
                            ledger: updatedData.ledger,
                            ref: salesReturnId,
                            totalAmount: amount,
                            dueAmount: amount,
                        });
    
                        await newSalesBill.save({ session });
                        bill.salesBill = newSalesBill._id;
                    } else if (bill.billType === "Against Ref.") {
                        const salesBill = await SalesBillModel.findById(bill.salesBill).session(session);
                        if (!salesBill) throw new Error("Sales Bill not found.");
    
                        if (salesBill.type === "BS") {
                            salesBill.dueAmount = parseFloat(salesBill.dueAmount) - parseFloat(amount); 
                        } else {
                            salesBill.dueAmount = parseFloat(salesBill.dueAmount) + parseFloat(amount); 
                        }
    
                        await salesBill.save({ session });
                    }
                }
    
                ledger.debitBalance -= parseFloat(updatedData.totalAmount);
            }
    
            for (const entry of updatedData.entries) {
                const productId = entry.itemName;
                const quantity = entry.qty;
    
                await Items.updateOne(
                    { _id: productId },
                    {
                        $inc: { maximumStock: quantity },
                    },
                    { session }
                );
            }
    
            await ledger.save({ session });
    
            // Update Sales Return data
            await SalesReturnModel.updateOne({ _id: salesReturnId }, updatedData, { session });
    
            await session.commitTransaction();
            session.endSession();
    
            return res.json({
                success: true,
                message: "Sales Return updated successfully!",
            });
        } catch (ex) {
            await session.abortTransaction();
            session.endSession();
            return res.json({ success: false, message: ex.message });
        }
    },
    

    deleteSalesReturn: async function (req, res) {
        const session = await mongoose.startSession();
        session.startTransaction();
    
        try {
            const salesReturnId = req.params.id;
    
            const existingSalesReturn = await SalesReturnModel.findById(salesReturnId).session(session);
            if (!existingSalesReturn) throw new Error("Sales Return not found.");
    
            // Reverse previous operations
            const ledger = await Ledger.findById(existingSalesReturn.ledger).session(session);
            if (!ledger) throw new Error("Ledger not found.");
    
            if (existingSalesReturn.type === "Debit") {
                for (const bill of existingSalesReturn.billwise) {
                    const amount = bill.amount;
    
                    if (bill.billType === "Against Ref.") {
                        const salesBill = await SalesBillModel.findById(bill.salesBill).session(session);
                        if (!salesBill) throw new Error("Sales Bill not found.");
    
                        if (salesBill.type === "BS") {
                            salesBill.dueAmount = parseFloat(salesBill.dueAmount) + parseFloat(amount); 
                        } else {
                            salesBill.dueAmount = parseFloat(salesBill.dueAmount) - parseFloat(amount); 
                        }
    
                        await salesBill.save({ session });
                    } else if (bill.billType === "New Ref.") {
                        await SalesBillModel.deleteOne({ _id: bill.salesBill }, { session });
                    }
                }
    
                ledger.debitBalance += parseFloat(existingSalesReturn.totalAmount);
            }
    
            for (const entry of existingSalesReturn.entries) {
                const productId = entry.itemName;
                const quantity = entry.qty;
    
                await Items.updateOne(
                    { _id: productId },
                    {
                        $inc: { maximumStock: -quantity },
                    },
                    { session }
                );
            }
    
            await ledger.save({ session });
    
            // Delete the Sales Return entry
            await SalesReturnModel.deleteOne({ _id: salesReturnId }, { session });
    
            await session.commitTransaction();
            session.endSession();
    
            return res.json({
                success: true,
                message: "Sales Return deleted successfully!",
            });
        } catch (ex) {
            await session.abortTransaction();
            session.endSession();
            return res.json({ success: false, message: ex.message });
        }
    },
    
}

module.exports = SalesReturnController;
