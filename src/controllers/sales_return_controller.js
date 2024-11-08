const mongoose = require("mongoose");
const Items = require("../models/items_model");
const Ledger = require("../models/ledger_model");
const SalesReturnModel = require("../models/sales_return_model");
const Sales = require("../models/sales_entry_model");
const { parse } = require("dotenv");


const SalesReturnController = {

    createSalesReturn: async function (req, res) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const salesReturnData = req.body;
            console.log(salesReturnData);
            salesReturnData.totalAmount = parseFloat(salesReturnData.totalAmount);
            salesReturnData.cashAmount = parseFloat(salesReturnData.cashAmount);

            const newSalesReturnData = new SalesReturnModel(salesReturnData);
            const ledgerID = salesReturnData.ledger;
            const salesType = salesReturnData.type;

            if (salesType === "Debit") {
                const ledger = await Ledger.findById(ledgerID).session(session);
                if (!ledger) throw new Error("Ledger not found.");

                ledger.debitBalance -= salesReturnData.totalAmount;
                await ledger.save({ session });
            }

            if (salesReturnData === "Cash") {
                newSalesReturnData.cashAmount = salesReturnData.totalAmount;
            }

            const existingSales = await SalesReturnModel.findOne({ billNumber: req.body.billNumber }).session(session);
            if (existingSales) throw new Error("Bill No already exists.");

            await newSalesReturnData.save({ session });

            for (const entry of salesReturnData.entries) {
                const productId = entry.itemName;
                const quantity = entry.qty;
                const sellingPrice = entry.sellingPrice;

                const product = await Items.findById(productId).session(session);
                if (!product) throw new Error("Product not found.");

                product.maximumStock += quantity;
                product.price = sellingPrice;
                await product.save({ session });
            }

            for (const bill of salesReturnData.billwise) {
                const salesId = bill.sales;
                const amount = bill.amount;

                const sales = await Sales.findById(salesId).session(session);
                if (!sales) throw new Error("Sales not found.");

                sales.dueAmount -= amount;
                await sales.save({ session });
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
            const { id } = req.params;
            const newSalesReturnData = req.body;

            const existingSalesReturn = await SalesReturnModel.findById(id).session(session);
            if (!existingSalesReturn) throw new Error("Sales Return entry not found.");

            if (existingSalesReturn.type === "Debit") {
                const ledger = await Ledger.findById(existingSalesReturn.ledger).session(session);
                if (!ledger) throw new Error("Ledger not found.");
                ledger.debitBalance += parseFloat(existingSalesReturn.totalAmount);
                await ledger.save({ session });
            }

            for (const entry of existingSalesReturn.entries) {
                const product = await Items.findById(entry.itemName).session(session);
                if (!product) throw new Error("Product not found.");

                await Items.updateOne(
                    { _id: entry.itemName },
                    { $inc: { maximumStock: -entry.qty } },
                    { session }
                );
            }

            for (const bill of existingSalesReturn.billwise) {
                const sales = await Sales.findById(bill.sales).session(session);
                if (!sales) throw new Error("Sales not found.");
            
                const billAmount = parseFloat(bill.amount); 
                const dueAmountBeforeUpdate = parseFloat(sales.dueAmount) || 0; 
            
                console.log(`bill amount: ${billAmount}`);
                console.log(`due amount before update: ${dueAmountBeforeUpdate}`);
            
                sales.dueAmount = dueAmountBeforeUpdate + billAmount; 
            
                console.log(`due amount after update: ${sales.dueAmount}`);
            
                await sales.save({ session });
            }
            

            newSalesReturnData.totalAmount = parseFloat(newSalesReturnData.totalAmount);
            newSalesReturnData.cashAmount = parseFloat(newSalesReturnData.cashAmount);

            if (newSalesReturnData.type === "Debit") {
                const ledger = await Ledger.findById(newSalesReturnData.ledger).session(session);
                if (!ledger) throw new Error("Ledger not found.");
                ledger.debitBalance -= newSalesReturnData.totalAmount;
                await ledger.save({ session });
            }

            for (const entry of newSalesReturnData.entries) {
                const product = await Items.findById(entry.itemName).session(session);
                if (!product) throw new Error("Product not found.");

                await Items.updateOne(
                    { _id: entry.itemName },
                    {
                        $inc: { maximumStock: entry.qty },
                        $set: { price: entry.sellingPrice }
                    },
                    { session }
                );
            }

            for (const bill of newSalesReturnData.billwise) {
                const sales = await Sales.findById(bill.sales).session(session);
                if (!sales) throw new Error("Sales not found.");
                sales.dueAmount -= bill.amount;
                await sales.save({ session });
            }

            const updatedSalesReturnData = await SalesReturnModel.findByIdAndUpdate(
                id,
                newSalesReturnData,
                { new: true, session }
            );

            await session.commitTransaction();
            session.endSession();

            return res.json({
                success: true,
                message: "Sales Return entry updated successfully!",
                data: updatedSalesReturnData,
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
            const { id } = req.params;

            const existingSalesReturn = await SalesReturnModel.findById(id).session(session);
            if (!existingSalesReturn) throw new Error("Sales Return entry not found.");

            if (existingSalesReturn.type === "Debit") {
                const ledger = await Ledger.findById(existingSalesReturn.ledger).session(session);
                if (!ledger) throw new Error("Ledger not found.");
                ledger.debitBalance += parseFloat(existingSalesReturn.totalAmount);
                await ledger.save({ session });
            }

            for (const entry of existingSalesReturn.entries) {
                const product = await Items.findById(entry.itemName).session(session);
                if (!product) throw new Error("Product not found.");

                await Items.updateOne(
                    { _id: entry.itemName },
                    { $inc: { maximumStock: -entry.qty } },
                    { session }
                );
            }

            for (const bill of existingSalesReturn.billwise) {
                const sales = await Sales.findById(bill.sales).session(session);
                if (!sales) throw new Error("Sales not found.");
            
                const billAmount = parseFloat(bill.amount); 
                const dueAmountBeforeUpdate = parseFloat(sales.dueAmount) || 0; 
            
                sales.dueAmount = dueAmountBeforeUpdate + billAmount; 
            
                await sales.save({ session });
            }

            await SalesReturnModel.findByIdAndDelete(id).session(session);

            await session.commitTransaction();
            session.endSession();

            return res.json({
                success: true,
                message: "Sales Return entry deleted successfully and previous values restored!",
            });
        } catch (ex) {
            await session.abortTransaction();
            session.endSession();
            return res.json({ success: false, message: ex.message });
        }
    },

}

module.exports = SalesReturnController;
