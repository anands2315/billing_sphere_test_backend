const Payment = require("../models/payment_model");
const PurchaseBill = require("../models/purchase_bills_models");
const mongoose = require("mongoose");
const Ledger = require("../models/ledger_model");

const PaymentController = {


  createPayment: async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const paymentData = req.body;
      console.log(paymentData);

      paymentData.totalamount = parseFloat(paymentData.totalamount);
      const payment = new Payment(paymentData);

      for (const entry of paymentData.entries) {
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
      console.log("Ledgers updated.");

      for (const bill of paymentData.billwise) {
        const { billType, amount, purchaseBill } = bill;
        const parsedAmount = parseFloat(amount);

        if (billType === "Against Ref.") {
          if (!purchaseBill) throw new Error("Purchase Bill ID is required for Against Ref.");

          const billEntry = await PurchaseBill.findById(purchaseBill).session(session);
          if (!billEntry) throw new Error("Purchase Bill not found.");

          if (billEntry.type === "RP") {
            billEntry.dueAmount = parseFloat(billEntry.dueAmount) - parsedAmount;
          } else {
            billEntry.dueAmount = parseFloat(billEntry.dueAmount) + parsedAmount;
          }

          await billEntry.save({ session });
        } else if (billType === "New Ref.") {
          const newBill = new PurchaseBill({
            date: paymentData.date,
            companyCode: paymentData.companyCode,
            name: bill.billName,
            type: "PYMT",
            ledger: paymentData.entries[0]?.ledger,
            ref: payment._id,
            totalAmount: parsedAmount,
            dueAmount: parsedAmount,
            dueDate : bill.dueDate,
          });

          await newBill.save({ session });

          const billwiseEntry = payment.billwise.find(
            (b) => b.billName === bill.billName && b.billType === "New Ref." && b.amount === amount
          );
          if (billwiseEntry) {
            billwiseEntry.purchaseBill = newBill._id;
          }
        }
      }
      console.log("Billwise entries updated.");

      // Save payment record
      await payment.save({ session });

      // Commit transaction
      await session.commitTransaction();
      session.endSession();

      return res.status(201).json({
        success: true,
        message: "Payment created successfully!",
        data: payment,
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

  getPayments: async (req, res) => {
    try {
      const payments = await Payment.find();
      res.json({ success: true, data: payments });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  getPaymentById: async (req, res) => {
    try {
      const { id } = req.params;

      const payment = await Payment.findById(id);
      if (!payment) {
        return res.status(404).json({ success: false, error: "Entry not found" });
      }
      res.json({ success: true, data: payment });
    } catch (error) {
      res.json({ success: false, message: ex });
    }
  },

  updatePayment: async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const paymentId = req.params.id;
      const newPaymentData = req.body;
      console.log("New payment data received:", newPaymentData);

      const existingPayment = await Payment.findById(paymentId).session(session);
      if (!existingPayment) throw new Error("Payment not found.");
      console.log("Existing payment fetched successfully.");


      // Reverse previous ledger adjustments
      for (const entry of existingPayment.entries) {
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

      // Reverse previous billwise adjustments
      for (const bill of existingPayment.billwise) {
        const { billType, amount, purchaseBill } = bill;
        const parsedAmount = parseFloat(amount);

        if (billType === "Against Ref." && purchaseBill) {
          const billEntry = await PurchaseBill.findById(purchaseBill).session(session);
          if (!billEntry) {
            console.error("Purchase Bill not found for ID:", purchaseBill);
            throw new Error("Purchase Bill not found.");
          }
          if (billEntry.type === "RP") {
            console.log(`Reversing RP due amount ${parsedAmount} for bill ID ${purchaseBill}`);

            billEntry.dueAmount = parseFloat(billEntry.dueAmount) + parsedAmount;
          } else {
            console.log(`Reversing non-RP due amount ${parsedAmount} for bill ID ${purchaseBill}`);

            billEntry.dueAmount = parseFloat(billEntry.dueAmount) - parsedAmount;
          }

          await billEntry.save({ session });
        } else if (billType === "New Ref." && purchaseBill) {
          console.log("Deleting new reference bill for ID:", purchaseBill);

          await PurchaseBill.findByIdAndDelete(purchaseBill).session(session);
        }
      }
      console.log("Previous billwise adjustments reversed successfully.");


      newPaymentData.totalamount = parseFloat(newPaymentData.totalamount);

      for (const entry of newPaymentData.entries) {
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

      console.log("New ledger adjustments applied successfully.");


      for (const bill of newPaymentData.billwise) {
        const { billType, amount, purchaseBill } = bill;
        const parsedAmount = parseFloat(amount);

        if (billType === "Against Ref.") {
          if (!purchaseBill) {
            console.error("Purchase Bill ID is missing for Against Ref.");
            throw new Error("Purchase Bill ID is required for Against Ref.");
          }
          const billEntry = await PurchaseBill.findById(purchaseBill).session(session);
          if (!billEntry) {
            console.error("Purchase Bill not found for ID:", purchaseBill);
            throw new Error("Purchase Bill not found.");
          }

          if (billEntry.type === "RP") {
            console.log(`Adjusting RP due amount ${parsedAmount} for bill ID ${purchaseBill}`);

            billEntry.dueAmount = parseFloat(billEntry.dueAmount) - parsedAmount;
          } else {
            console.log(`Adjusting non-RP due amount ${parsedAmount} for bill ID ${purchaseBill}`);

            billEntry.dueAmount = parseFloat(billEntry.dueAmount) + parsedAmount;
          }

          await billEntry.save({ session });
        } else if (billType === "New Ref.") {
          const newBill = new PurchaseBill({
            date: newPaymentData.date,
            companyCode: newPaymentData.companyCode,
            name: bill.billName,
            type: "PYMT",
            ledger: newPaymentData.entries[0]?.ledger,
            ref: paymentId,
            totalAmount: parsedAmount,
            dueAmount: parsedAmount,
            dueDate : bill.dueDate,
          });
          console.log("Creating new bill reference for:", bill.billName);

          await newBill.save({ session });

          const billwiseEntry = newPaymentData.billwise.find(
            (b) => b.billName === bill.billName && b.billType === "New Ref." && b.amount === amount
          );
          if (billwiseEntry) {
            billwiseEntry.purchaseBill = newBill._id;
          }
        }
      }

      console.log("New billwise adjustments applied successfully.");

      console.log("Updating payment record for ID:", paymentId);

      // Update payment record
      await Payment.findByIdAndUpdate(paymentId, newPaymentData, { session });
      console.log("Payment record updated successfully.");

      // Commit transaction
      await session.commitTransaction();
      session.endSession();

      return res.status(200).json({
        success: true,
        message: "Payment updated successfully!",
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


  deletePayment: async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const paymentId = req.params.id;

      const existingPayment = await Payment.findById(paymentId).session(session);
      if (!existingPayment) throw new Error("Payment not found.");

      // Reverse ledger adjustments
      for (const entry of existingPayment.entries) {
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

      // Reverse billwise adjustments
      for (const bill of existingPayment.billwise) {
        const { billType, amount, purchaseBill } = bill;
        const parsedAmount = parseFloat(amount);

        if (billType === "Against Ref." && purchaseBill) {
          const billEntry = await PurchaseBill.findById(purchaseBill).session(session);
          if (!billEntry) throw new Error("Purchase Bill not found.");

          if (billEntry.type === "RP") {
            billEntry.dueAmount = parseFloat(billEntry.dueAmount) + parsedAmount;
          } else {
            billEntry.dueAmount = parseFloat(billEntry.dueAmount) - parsedAmount;
          }

          await billEntry.save({ session });
        } else if (billType === "New Ref." && purchaseBill) {
          await PurchaseBill.findByIdAndDelete(purchaseBill).session(session);
        }
      }

      await Payment.findByIdAndDelete(paymentId).session(session);

      // Commit transaction
      await session.commitTransaction();
      session.endSession();

      return res.status(200).json({
        success: true,
        message: "Payment deleted successfully!",
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


};

module.exports = PaymentController;


