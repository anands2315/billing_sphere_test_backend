const ReceiptVoucher = require("../models/receipt_voucher_model");
const Ledger = require("../models/ledger_model");

const ReceiptVoucherController = {
    createReceiptVoucher: async (req, res) => {
        try {
            const receiptData = req.body;
            const receiptVch = new ReceiptVoucher(receiptData); // Create a new instance of Payment
            await receiptVch.save();
            return res.status(201).json({ success: true, message: 'Receipt saved successfully' });
        } catch (error) {
            return res.status(500).json({ success: false, message: ex.message });
        }
    },

    // createReceiptVoucher : async (req, res) => {
    //     const session = await mongoose.startSession();
    //     session.startTransaction();
    
    //     try {
    //         const receiptData = req.body;
    
    //         receiptData.totalamount = parseFloat(receiptData.totalamount);
    
    //         const receiptVch = new ReceiptVoucher(receiptData);
    
    //         for (const entry of receiptData.entries) {
    //             const { ledger: ledgerId, debit, credit } = entry;
    
    //             const ledger = await Ledger.findById(ledgerId).session(session);
    //             if (!ledger) throw new Error("Ledger not found.");
    
            
    //             if (credit) {
    //                 ledger.debitBalance -= credit; 
    //             }
    //             if (debit) {
    //                 ledger.debitBalance += debit;
    //             }
    
    //             await ledger.save({ session });
    //         }
    
    //         for (const bill of receiptData.billwise) {
    //             const { billType, amount, salesBill } = bill;
    //             const parsedAmount = parseFloat(amount);
    
    //             if (billType === "Against Ref.") {
    //                 if (!salesBill) throw new Error("Sales Bill ID is required for Against Ref.");
    
    //                 const billEntry = await SalesBillModel.findById(salesBill).session(session);
    //                 if (!billEntry) throw new Error("Purchase Bill not found.");
    
    //                 if (billEntry.type === "BS") {
    //                     billEntry.dueAmount -= parsedAmount; 
    //                 } else {
    //                     billEntry.dueAmount += parsedAmount; 
    //                 }
    
    //                 await billEntry.save({ session });
    //             } else if (billType === "New Ref.") {
    //                 const newBill = new SalesBillModel({
    //                     date: receiptData.date,
    //                     companyCode: receiptData.companyCode,
    //                     name: bill.billName,
    //                     type: "RCPT",
    //                     ledger: receiptData.entries[0]?.ledger, // Assuming first entry's ledger is used
    //                     ref: receiptVch._id,
    //                     totalAmount: parsedAmount,
    //                     dueAmount: parsedAmount,
    //                 });
    
    //                 await newBill.save({ session });
    
    //                 // Link new bill to billwise entry
    //                 const billwiseEntry = receiptVch.billwise.find(
    //                     (b) => b.billName === bill.billName && b.billType === "New Ref." && b.amount === amount
    //                 );
    //                 if (billwiseEntry) {
    //                     billwiseEntry.salesBill = newBill._id;
    //                 }
    //             }
    //         }
    
    //         // Save the receipt voucher
    //         await receiptVch.save({ session });
    
    //         await session.commitTransaction();
    //         session.endSession();
    
    //         return res.status(201).json({
    //             success: true,
    //             message: "Receipt voucher created successfully!",
    //             data: receiptVch,
    //         });
    //     } catch (error) {
    //         await session.abortTransaction();
    //         session.endSession();
    //         return res.status(500).json({
    //             success: false,
    //             message: error.message,
    //         });
    //     }
    // },

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

    updateReceiptVoucher: async (req, res) => {
        try {
            const updatedreceiptvoucher = await ReceiptVoucher.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true }
            );
            if (!updatedreceiptvoucher) {
                return res.status(404).json({ error: "ReceiptVoucher not found" });
            }
            res.status(200).json(updatedreceiptvoucher);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    deleteReceiptVoucher: async (req, res) => {
        try {
          const deletedReceiptVoucher = await ReceiptVoucher.findByIdAndDelete(req.params.id);
          if (!deletedReceiptVoucher) {
            return res.status(404).json({ success: false, message: "ReceiptVoucher not found" });
          }
          res.status(200).json({ success: true, message: "ReceiptVoucher deleted successfully" });
        } catch (error) {
          res.status(400).json({ success: false, message: error.message });
        }
      },
      
}


module.exports = ReceiptVoucherController;
