const ReceiptVoucher = require("../models/receipt_voucher_model");
const Ledger = require("../models/ledger_model");
const SalesBillModel = require("../models/sales_bills_model");
const mongoose = require("mongoose");

const ReceiptVoucherController = {
    // createReceiptVoucher: async (req, res) => {
    //     try {
    //         const receiptData = req.body;
    //         const receiptVch = new ReceiptVoucher(receiptData); // Create a new instance of Payment
    //         await receiptVch.save();
    //         return res.status(201).json({ success: true, message: 'Receipt saved successfully' });
    //     } catch (error) {
    //         return res.status(500).json({ success: false, message: ex.message });
    //     }
    // },

    createReceiptVoucher: async (req, res) => {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const receiptData = req.body;
            console.log(receiptData);

            receiptData.totalamount = parseFloat(receiptData.totalamount);
            const receiptVch = new ReceiptVoucher(receiptData);

            for (const entry of receiptData.entries) {
                const { ledger: ledgerId, debit, credit } = entry;

                const ledger = await Ledger.findById(ledgerId).session(session);
                if (!ledger) throw new Error("Ledger not found.");


                if (credit) {
                    ledger.debitBalance -= credit;
                }
                if (debit) {
                    ledger.debitBalance += debit;
                }

                await ledger.save({ session });
            }
            console.log("3");

            for (const bill of receiptData.billwise) {
                const { billType, amount, salesBill } = bill;
                const parsedAmount = parseFloat(amount);

                if (billType === "Against Ref.") {
                    if (!salesBill) throw new Error("Sales Bill ID is required for Against Ref.");

                    const billEntry = await SalesBillModel.findById(salesBill).session(session);
                    if (!billEntry) throw new Error("Purchase Bill not found.");

                    if (billEntry.type === "BS") {
                        billEntry.dueAmount = parseFloat(billEntry.dueAmount) - parsedAmount;
                    } else {
                        billEntry.dueAmount = parseFloat(billEntry.dueAmount) + parsedAmount;
                    }

                    await billEntry.save({ session });
                } else if (billType === "New Ref.") {
                    const newBill = new SalesBillModel({
                        date: receiptData.date,
                        companyCode: receiptData.companyCode,
                        name: bill.billName,
                        type: "RCPT",
                        ledger: receiptData.entries[0]?.ledger,
                        ref: receiptVch._id,
                        totalAmount: parsedAmount,
                        dueAmount: parsedAmount,
                    });

                    await newBill.save({ session });

                    const billwiseEntry = receiptVch.billwise.find(
                        (b) => b.billName === bill.billName && b.billType === "New Ref." && b.amount === amount
                    );
                    if (billwiseEntry) {
                        billwiseEntry.salesBill = newBill._id;
                    }
                }
            }
            console.log("4");

            await receiptVch.save({ session });

            await session.commitTransaction();
            session.endSession();

            return res.status(201).json({
                success: true,
                message: "Receipt voucher created successfully!",
                data: receiptVch,
            });
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            return res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    },

    getReceiptVoucher: async (req, res) => {
        try {
            const receiptvoucher = await ReceiptVoucher.find();
            res.json({ success: true, data: receiptvoucher });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    getReceiptVoucherById: async (req, res) => {
        try {
            const { id } = req.params;

            const receiptvoucher = await ReceiptVoucher.findById(id);

            if (!receiptvoucher) {
                return res.status(404).json({ success: false, error: "Entry not found" });
            }
            res.json({ success: true, data: receiptvoucher });
        } catch (error) {
            res.json({ success: false, message: ex });
        }
    },

    // updateReceiptVoucher: async (req, res) => {
    //     try {
    //         const updatedreceiptvoucher = await ReceiptVoucher.findByIdAndUpdate(
    //             req.params.id,
    //             req.body,
    //             { new: true }
    //         );
    //         if (!updatedreceiptvoucher) {
    //             return res.status(404).json({ error: "ReceiptVoucher not found" });
    //         }
    //         res.status(200).json(updatedreceiptvoucher);
    //     } catch (error) {
    //         res.status(400).json({ error: error.message });
    //     }
    // },

    updateReceiptVoucher: async (req, res) => {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const { id } = req.params;
            const updatedData = req.body;
            console.log(updatedData);

            const existingVoucher = await ReceiptVoucher.findById(id).session(session);
            if (!existingVoucher) throw new Error("Receipt voucher not found.");

            // Reverse original ledger and billwise entries
            for (const entry of existingVoucher.entries) {
                const { ledger: ledgerId, debit, credit } = entry;
                const ledger = await Ledger.findById(ledgerId).session(session);
                if (!ledger) throw new Error("Ledger not found.");

                if (credit) {
                    ledger.debitBalance += credit;
                }
                if (debit) {
                    ledger.debitBalance -= debit;
                }
                await ledger.save({ session });
            }

            for (const bill of existingVoucher.billwise) {
                const { billType, amount, salesBill } = bill;

                if (billType === "Against Ref.") {
                    const billEntry = await SalesBillModel.findById(salesBill).session(session);
                    if (!billEntry) throw new Error("Sales Bill not found.");

                    if (billEntry.type === "BS") {
                        billEntry.dueAmount = parseFloat(billEntry.dueAmount) + parseFloat(amount);
                    } else {
                        billEntry.dueAmount = parseFloat(billEntry.dueAmount) - parseFloat(amount);
                    }
                    await billEntry.save({ session });
                } else if (billType === "New Ref.") {
                    // Delete new reference bills
                    await SalesBillModel.findByIdAndDelete(salesBill).session(session);
                }
            }

            // Update with new data
            existingVoucher.entries = updatedData.entries;
            existingVoucher.billwise = updatedData.billwise;
            existingVoucher.totalamount = parseFloat(updatedData.totalamount);
            existingVoucher.date = updatedData.date;

            for (const entry of updatedData.entries) {
                const { ledger: ledgerId, debit, credit } = entry;
                const ledger = await Ledger.findById(ledgerId).session(session);
                if (!ledger) throw new Error("Ledger not found.");

                if (credit) {
                    ledger.debitBalance -= credit;
                }
                if (debit) {
                    ledger.debitBalance += debit; 
                }
                await ledger.save({ session });
            }

            for (const bill of updatedData.billwise) {
                const { billType, amount, salesBill } = bill;
                const parsedAmount = parseFloat(amount);

                if (billType === "Against Ref.") {
                    const billEntry = await SalesBillModel.findById(salesBill).session(session);
                    if (!billEntry) throw new Error("Sales Bill not found.");

                    if (billEntry.type === "BS") {
                        billEntry.dueAmount = parseFloat(billEntry.dueAmount) - parseFloat(amount);
                    } else {
                        console.log(salesBill.dueAmount);
                        billEntry.dueAmount = parseFloat(billEntry.dueAmount) + parseFloat(amount);
                        console.log(salesBill.dueAmount);
                    }
                    await billEntry.save({ session });
                } else if (billType === "New Ref.") {
                    const newBill = new SalesBillModel({
                        date: updatedData.date,
                        companyCode: updatedData.companyCode,
                        name: bill.billName,
                        type: "RCPT",
                        ledger: updatedData.entries[0]?.ledger,
                        ref: existingVoucher._id,
                        totalAmount: parsedAmount,
                        dueAmount: parsedAmount,
                    });

                    await newBill.save({ session });

                    const billwiseEntry = existingVoucher.billwise.find(
                        (b) => b.billName === bill.billName && b.billType === "New Ref." && b.amount === amount
                    );
                    if (billwiseEntry) {
                        billwiseEntry.salesBill = newBill._id;
                    }
                }
            }

            await existingVoucher.save({ session });

            await session.commitTransaction();
            session.endSession();

            return res.status(200).json({
                success: true,
                message: "Receipt voucher updated successfully!",
                data: existingVoucher,
            });
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            return res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    },


    // deleteReceiptVoucher: async (req, res) => {
    //     try {
    //       const deletedReceiptVoucher = await ReceiptVoucher.findByIdAndDelete(req.params.id);
    //       if (!deletedReceiptVoucher) {
    //         return res.status(404).json({ success: false, message: "ReceiptVoucher not found" });
    //       }
    //       res.status(200).json({ success: true, message: "ReceiptVoucher deleted successfully" });
    //     } catch (error) {
    //       res.status(400).json({ success: false, message: error.message });
    //     }
    //   },

    deleteReceiptVoucher: async (req, res) => {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const { id } = req.params;

            const existingVoucher = await ReceiptVoucher.findById(id).session(session);
            if (!existingVoucher) throw new Error("Receipt voucher not found.");

            // Reverse ledger and billwise entries
            for (const entry of existingVoucher.entries) {
                const { ledger: ledgerId, debit, credit } = entry;
                const ledger = await Ledger.findById(ledgerId).session(session);
                if (!ledger) throw new Error("Ledger not found.");

                if (credit) {
                    ledger.debitBalance += credit; // Revert credit
                }
                if (debit) {
                    ledger.debitBalance -= debit; // Revert debit
                }
                await ledger.save({ session });
            }

            for (const bill of existingVoucher.billwise) {
                const { billType, amount, salesBill } = bill;
                const parsedAmount = parseFloat(amount);

                if (billType === "Against Ref.") {
                    const billEntry = await SalesBillModel.findById(salesBill).session(session);
                    if (!billEntry) throw new Error("Sales Bill not found.");

                    if (billEntry.type === "BS") {
                        billEntry.dueAmount = parseFloat(billEntry.dueAmount) + parsedAmount; 
                    } else {
                        billEntry.dueAmount = parseFloat(billEntry.dueAmount) - parsedAmount; 
                    }
                    await billEntry.save({ session });
                } else if (billType === "New Ref.") {
                    // Delete new reference bills
                    await SalesBillModel.findByIdAndDelete(salesBill).session(session);
                }
            }

            await ReceiptVoucher.findByIdAndDelete(id).session(session);

            await session.commitTransaction();
            session.endSession();

            return res.status(200).json({
                success: true,
                message: "Receipt voucher deleted successfully!",
            });
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            return res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    },


}


module.exports = ReceiptVoucherController;
