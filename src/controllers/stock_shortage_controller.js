const mongoose = require("mongoose");
const StockShortageModel = require("../models/stock_shortage_model");
const Items = require("../models/items_model");
const Ledger = require("../models/ledger_model");

const StockShortageController = {

    createStockShortage: async function (req, res) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const data = req.body;
            const ledgerID = data.ledger;

            const ledger = await Ledger.findById(ledgerID).session(session);
            if (!ledger) {
                throw new Error("Ledger not found.");
            }

            ledger.debitBalance += parseFloat(data.totalAmount);
            await ledger.save({ session });

            for (const entry of data.entries) {
                const productID = entry.itemName;
                const quantity = entry.qty;

                const product = await Items.findById(productID).session(session);
                if (!product) {
                    throw new Error(`Product with ID ${productID} not found.`);
                }

                await Items.updateOne(
                    { _id: productID },
                    { $inc: { maximumStock: -quantity } },
                    { session }
                );
            }

            const newStockShortageData = new StockShortageModel(data);
            await newStockShortageData.save({ session });

            await session.commitTransaction();
            session.endSession();

            return res.json({
                success: true,
                message: "Stock Shortage created successfully!",
                data: newStockShortageData,
            });
        } catch (ex) {
            await session.abortTransaction();
            session.endSession();

            return res.json({ success: false, message: ex.message });
        }
    },

    getAllStockShortages: async function (req, res) {
        try {
            const { companyCode } = req.query;
            const query = companyCode ? { companyCode } : {};

            const stockShortages = await StockShortageModel.find(query);
            return res.json({ success: true, data: stockShortages });
        } catch (ex) {
            return res.json({ success: false, message: ex.message });
        }
    },

    getStockShortageById: async function (req, res) {
        try {
            const id = req.params.id;
            const stockShortage = await StockShortageModel.findById(id);
            if (!stockShortage) {
                return res.json({ success: false, message: "Stock Shortage not found." });
            }
            return res.json({ success: true, data: stockShortage });
        } catch (ex) {
            return res.json({ success: false, message: ex.message });
        }
    },

    updateStockShortage: async function (req, res) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const id = req.params.id;
            const newData = req.body;
            console.log(newData);

            const existingStockShortage = await StockShortageModel.findById(id).session(session);
            if (!existingStockShortage) {
                throw new Error("Stock Shortage not found.");
            }

            const ledger = await Ledger.findById(existingStockShortage.ledger).session(session);
            if (!ledger) {
                throw new Error("Ledger not found.");
            }

            ledger.debitBalance -= parseFloat(existingStockShortage.totalAmount);
            await ledger.save({ session });

            for (const entry of existingStockShortage.entries) {
                const productID = entry.itemName;
                const quantity = entry.qty;

                await Items.updateOne(
                    { _id: productID },
                    { $inc: { maximumStock: quantity } },
                    { session }
                );
            }

            ledger.debitBalance += parseFloat(newData.totalAmount);
            await ledger.save({ session });

            for (const entry of newData.entries) {
                const productID = entry.itemName;
                const quantity = entry.qty;

                await Items.updateOne(
                    { _id: productID },
                    { $inc: { maximumStock: -quantity } },
                    { session }
                );
            }

            existingStockShortage.set(newData);
            await existingStockShortage.save({ session });

            await session.commitTransaction();
            session.endSession();

            return res.json({
                success: true,
                message: "Stock Shortage updated successfully!",
                data: existingStockShortage,
            });
        } catch (ex) {
            await session.abortTransaction();
            session.endSession();

            return res.json({ success: false, message: ex.message });
        }
    },

    deleteStockShortage: async function (req, res) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const id = req.params.id;

            const stockShortage = await StockShortageModel.findById(id).session(session);
            if (!stockShortage) {
                throw new Error("Stock Shortage not found.");
            }

            // Reverse ledger and items
            const ledger = await Ledger.findById(stockShortage.ledger).session(session);
            if (!ledger) {
                throw new Error("Ledger not found.");
            }

            ledger.debitBalance -= parseFloat(stockShortage.totalAmount);
            await ledger.save({ session });

            for (const entry of stockShortage.entries) {
                const productID = entry.itemName;
                const quantity = entry.qty;

                await Items.updateOne(
                    { _id: productID },
                    { $inc: { maximumStock: +quantity } },
                    { session }
                );
            }

            await stockShortage.deleteOne({ session });

            await session.commitTransaction();
            session.endSession();

            return res.json({
                success: true,
                message: "Stock Shortage deleted successfully!",
            });
        } catch (ex) {
            await session.abortTransaction();
            session.endSession();

            return res.json({ success: false, message: ex.message });
        }
    },
};

module.exports = StockShortageController;
