const ContraVoucher = require("../models/contra_voucher_model");
const Ledger = require("../models/ledger_model");
const SalesBillModel = require("../models/sales_bills_model");
const mongoose = require("mongoose");

async function processBill({ bill, parsedAmount, isDebit, session }) {
  if (bill.type === "Contra") {
    if (isDebit) {
      bill.dueAmount = parseFloat(bill.dueAmount) - parsedAmount;
    } else {
      bill.dueAmount = parseFloat(bill.dueAmount) - parsedAmount;
    }
  }
  await bill.save({ session });
}

async function handleBillProcessing({ bill, parsedAmount, isDebit, session }) {
  if (!bill) {
    throw new Error("Invalid bill data for processing.");
  }
  await processBill({ bill, parsedAmount, isDebit, session });
}

async function processBillBeforUpdate({
  bill,
  parsedAmount,
  isDebit,
  session,
}) {
  if (bill.type === "Contra") {
    if (isDebit) {
      bill.dueAmount = parseFloat(bill.dueAmount) + parsedAmount;
    } else {
      bill.dueAmount = parseFloat(bill.dueAmount) + parsedAmount;
    }
  }
  await bill.save({ session });
}

async function handleBillProcessingBeforeUpdate({
  bill,
  parsedAmount,
  isDebit,
  session,
}) {
  if (!bill) {
    throw new Error("Invalid bill data for processing.");
  }
  await processBillBeforUpdate({ bill, parsedAmount, isDebit, session });
}

async function createNewBill({
  bill,
  contraData,
  parsedAmount,
  session,
  contraVch,
}) {
  const newBillModel = new SalesBillModel({
    date: contraData.date,
    companyCode: contraData.companyCode,
    name: bill.billName,
    type: "Contra",
    ledger: bill.ledger,
    ref: contraVch._id,
    totalAmount: parsedAmount,
    dueAmount: parsedAmount,
  });
  await newBillModel.save({ session });
  return newBillModel._id;
}

const ContraVoucherController = {
  // Create Contra
  createContraVoucher: async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const contraData = req.body;
      contraData.totalamount = parseFloat(contraData.totalamount);

      const contraVch = new ContraVoucher(contraData);

      for (const entry of contraData.entries) {
        const { ledger: ledgerId, debit, credit } = entry;
        const ledger = await Ledger.findById(ledgerId).session(session);

        if (!ledger) {
          throw new Error(`Ledger not found for ID: ${ledgerId}`);
        }

        if (credit) ledger.debitBalance += credit;
        if (debit) ledger.debitBalance -= debit;

        await ledger.save({ session });
      }

      for (const bill of contraData.billwise) {
        const {
          ledger: ledgerId,
          billType,
          amount,
          Bill,
          debit,
          credit,
        } = bill;
        const parsedAmount = parseFloat(amount);

        if (billType === "Against Ref.") {
          if (!Bill) {
            throw new Error("Sales Bill ID is required for Against Ref.");
          }

          const billEntry = await SalesBillModel.findById(Bill).session(
            session
          );
          if (!billEntry) throw new Error("Bill not found.");

          const isDebit = !!debit;
          await handleBillProcessing({
            bill: billEntry,
            parsedAmount,
            isDebit,
            session,
          });
        } else if (billType === "New Ref.") {
          const newBillId = await createNewBill({
            bill,
            contraData,
            parsedAmount,
            session,
            contraVch,
          });

          const billwiseEntry = contraVch.billwise.find(
            (b) =>
              b.billName === bill.billName &&
              b.billType === "New Ref." &&
              b.amount === amount
          );

          if (billwiseEntry) {
            billwiseEntry.Bill = newBillId;
            billwiseEntry.ledger = bill.ledger;
          }
        } else if (billType === "On Account") {
          const isDebit = !!debit;
          const ledger = await Ledger.findById(ledgerId).session(session);

          if (!ledger) throw new Error(`Ledger not found for ID: ${ledgerId}`);

          if (isDebit) {
            ledger.debitBalance -= parsedAmount;
          } else {
            ledger.debitBalance += parsedAmount;
          }

          await ledger.save({ session });
        }
      }

      await contraVch.save({ session });
      await session.commitTransaction();
      session.endSession();

      res.status(201).json({
        success: true,
        message: "Contra voucher created successfully!",
        data: contraVch,
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Fetch All Contra Voucher
  getAllContra: async (req, res) => {
    try {
      const contra = await ContraVoucher.find({});
      return res.json({ success: true, data: contra });
    } catch (ex) {
      return res.json({ success: false, message: ex });
    }
  },

  // Fetch Contar By Id
  getContraById: async (req, res) => {
    try {
      const { id } = req.params;

      const contra = await ContraVoucher.findById(id);
      if (!contra) {
        return res
          .status(404)
          .json({ success: false, error: "Entry not found" });
      }
      res.json({ success: true, data: contra });
    } catch (error) {
      res.json({ success: false, message: error });
    }
  },

  // Update Contra Voucher
  updateContraVoucher: async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { id } = req.params; // Contra Voucher ID from URL
      const updateData = req.body; // Extract all fields from the request body

      // Fetch existing contra voucher
      const existingContraVch = await ContraVoucher.findById(id).session(
        session
      );
      if (!existingContraVch) {
        throw new Error("Contra Voucher not found.");
      }

      // Step 1: Revert existing `entries` and `billwise`

      for (const entry of existingContraVch.entries) {
        const { ledger: ledgerId, debit, credit } = entry;
        const ledger = await Ledger.findById(ledgerId).session(session);

        if (!ledger) {
          throw new Error(`Ledger not found for ID: ${ledgerId}`);
        }

        if (credit) ledger.debitBalance -= credit;
        if (debit) ledger.debitBalance += debit;

        await ledger.save({ session });
      }

      for (const bill of existingContraVch.billwise) {
        const {
          ledger: ledgerId,
          billType,
          amount,
          Bill,
          debit,
          credit,
        } = bill;
        const parsedAmount = parseFloat(amount);

        if (billType === "Against Ref.") {
          if (!Bill) {
            throw new Error("Sales Bill ID is required for Against Ref.");
          }

          const billEntry = await SalesBillModel.findById(Bill).session(
            session
          );
          if (!billEntry) throw new Error("Bill not found.");

          const isDebit = !!debit;
          await handleBillProcessingBeforeUpdate({
            bill: billEntry,
            parsedAmount,
            isDebit,
            session,
          });
        } else if (billType === "New Ref." && Bill) {
          // Fetch the existing bill based on the ledger group name
          const existingBill = await SalesBillModel.findById(Bill).session(
            session
          );

          const updatedBill = updateData.billwise.find(
            (bill) => bill.Bill && bill.Bill.toString() === Bill.toString()
          ) ?? { Bill };

          if (existingBill) {
            // Check if billType or ledger has changed
            const hasBillTypeChanged =
              updatedBill.billType !== billType ||
              updatedBill.ledger?.toString() !== existingBill.ledger.toString();

            // Only delete if the billType has changed or if the updated bill is missing
            if (hasBillTypeChanged) {
              await existingBill.deleteOne({ session });
              console.log(`Deleted unused bill: ${Bill}`);
            } else {
              console.log("Bill type has not changed; no deletion needed.");
            }
          } else {
            console.log("No Bill Found");
          }
        } else if (billType === "On Account") {
          const isDebit = !!debit;
          const ledger = await Ledger.findById(ledgerId).session(session);

          if (!ledger) throw new Error(`Ledger not found for ID: ${ledgerId}`);

          if (isDebit) {
            ledger.debitBalance += parsedAmount;
          } else {
            ledger.debitBalance -= parsedAmount;
          }
        }
      }

      // Step 2: Update all fields with new data
      const allowedFields = [
        "no",
        "totalamount",
        "date",
        "narration",
        "companyCode",
        "chequeDetails",
        "entries",
        "billwise",
      ];

      for (const key of allowedFields) {
        if (key in updateData) {
          existingContraVch[key] = updateData[key];
        }
      }

      // Step 3: Process new `billwise`

      for (const entry of existingContraVch.entries) {
        const { ledger: ledgerId, debit, credit } = entry;
        const ledger = await Ledger.findById(ledgerId).session(session);

        if (!ledger) {
          throw new Error(`Ledger not found for ID: ${ledgerId}`);
        }

        if (credit) ledger.debitBalance += credit;
        if (debit) ledger.debitBalance -= debit;

        await ledger.save({ session });
      }

      for (const bill of updateData.billwise || []) {
        const {
          ledger: ledgerId,
          billType,
          amount,
          Bill,
          debit,
          date,
          billName,
          credit,
        } = bill;
        const parsedAmount = parseFloat(amount);

        if (billType === "Against Ref.") {
          if (!Bill) {
            throw new Error("Sales Bill ID is required for Against Ref.");
          }

          const billEntry = await SalesBillModel.findById(Bill).session(
            session
          );
          if (!billEntry) throw new Error("Bill not found.");

          const isDebit = !!debit;
          await handleBillProcessing({
            bill: billEntry,
            parsedAmount,
            isDebit,
            session,
          });
        } else if (billType === "New Ref.") {
          let billEntry = await SalesBillModel.findById(Bill).session(session);

          if (billEntry) {
            // Update existing bill
            billEntry.date = date;
            billEntry.name = billName;
            billEntry.dueAmount = parsedAmount;
            billEntry.ledger = ledgerId;
            await billEntry.save({ session });
            console.log(`Updated bill: ${Bill}`);
          } else {
            // Create a new bill if it doesn't exist
            const newBillId = await createNewBill({
              bill,
              contraData: existingContraVch,
              parsedAmount,
              session,
              contraVch: existingContraVch,
            });

            if (newBillId) {
              bill.Bill = newBillId.toString();
              console.log(`Created new bill: ${newBillId}`);
            } else {
              throw new Error("Failed to create new bill.");
            }
          }
        } else if (billType === "On Account") {
          const isDebit = !!debit;
          const ledger = await Ledger.findById(ledgerId).session(session);

          if (!ledger) throw new Error(`Ledger not found for ID: ${ledgerId}`);

          if (isDebit) {
            ledger.debitBalance -= parsedAmount;
          } else {
            ledger.debitBalance += parsedAmount;
          }

          await ledger.save({ session });
        }
      }

      existingContraVch.billwise = updateData.billwise;

      // Save updated contra voucher
      await existingContraVch.save({ session });

      await session.commitTransaction();
      session.endSession();

      return res.status(200).json({
        success: true,
        message: "Contra voucher updated successfully!",
        data: existingContraVch,
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

  // Delete Contra Voucher
  deleteContraVoucher: async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { id } = req.params;

      // Fetch the existing journal voucher
      const journalVoucher = await ContraVoucher.findById(id).session(session);
      if (!journalVoucher) {
        throw new Error("Contra Voucher not found.");
      }

      // step 1 revert entries
      for (const entry of journalVoucher.entries) {
        const { ledger: ledgerId, debit, credit } = entry;
        const ledger = await Ledger.findById(ledgerId).session(session);

        if (!ledger) {
          throw new Error(`Ledger not found for ID: ${ledgerId}`);
        }

        if (credit) ledger.debitBalance -= credit;
        if (debit) ledger.debitBalance += debit;

        await ledger.save({ session });
      }

      // Step 2 Revert BillWIse
      for (const bill of journalVoucher.billwise) {
        const {
          ledger: ledgerId,
          billType,
          amount,
          Bill,
          debit,
          credit,
        } = bill;
        const parsedAmount = parseFloat(amount);

        if (billType === "Against Ref.") {
          if (!Bill) {
            throw new Error("Sales Bill ID is required for Against Ref.");
          }

          const billEntry = await SalesBillModel.findById(Bill).session(
            session
          );
          if (!billEntry) throw new Error("Bill not found.");

          const isDebit = !!debit;
          await handleBillProcessingBeforeUpdate({
            bill: billEntry,
            parsedAmount,
            isDebit,
            session,
          });
        } else if (billType === "New Ref." && Bill) {
          // Fetch the existing bill based on the ledger group name
          const existingBill = await SalesBillModel.findById(Bill).session(
            session
          );

          await existingBill.deleteOne({ session });
          console.log(`Deleted unused bill: ${Bill}`);
        } else if (billType === "On Account") {
          const isDebit = !!debit;
          const ledger = await Ledger.findById(ledgerId).session(session);

          if (!ledger) throw new Error(`Ledger not found for ID: ${ledgerId}`);

          if (isDebit) {
            ledger.debitBalance += parsedAmount;
          } else {
            ledger.debitBalance -= parsedAmount;
          }
        }
      }

      // Step 3: Delete the journal voucher
      await ContraVoucher.findByIdAndDelete(id, { session });

      // Commit the transaction
      await session.commitTransaction();
      session.endSession();

      res.status(200).json({
        success: true,
        message: "Contra Voucher deleted",
      });
    } catch (error) {
      // Rollback the transaction on error
      await session.abortTransaction();
      session.endSession();

      res.status(400).json({ success: false, message: error.message });
    }
  },
};

module.exports = ContraVoucherController;
