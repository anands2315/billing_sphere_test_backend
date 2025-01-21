const JournalVoucher = require("../models/journal_voucher_model");
const Ledger = require("../models/ledger_model");
const PurchaseBillModel = require("../models/purchase_bills_models");
const SalesBillModel = require("../models/sales_bills_model");
const mongoose = require("mongoose");
async function processVendorBill({ bill, parsedAmount, isDebit, session }) {
  if (bill.type === "RP") {
    if (isDebit) {
      bill.dueAmount = parseFloat(bill.dueAmount) - parsedAmount;
    } else {
      bill.dueAmount = parseFloat(bill.dueAmount) - parsedAmount;
    }
  }
  if (bill.type === "PR") {
    if (isDebit) {
      bill.dueAmount = parseFloat(bill.dueAmount) - parsedAmount;
    } else {
      bill.dueAmount = parseFloat(bill.dueAmount) - parsedAmount;
    }
  }
  if (bill.type === "PYMT") {
    if (isDebit) {
      bill.dueAmount = parseFloat(bill.dueAmount) - parsedAmount;
    } else {
      bill.dueAmount = parseFloat(bill.dueAmount) - parsedAmount;
    }
  }
  await bill.save({ session });
}

async function processCustomerBill({ bill, parsedAmount, isDebit, session }) {
  if (bill.type === "BS") {
    if (isDebit) {
      bill.dueAmount = parseFloat(bill.dueAmount) + parsedAmount;
    } else {
      bill.dueAmount = parseFloat(bill.dueAmount) - parsedAmount;
    }
  } else if (bill.type === "RCPT") {
    if (isDebit) {
      bill.dueAmount = parseFloat(bill.dueAmount) - parsedAmount;
    } else {
      bill.dueAmount = parseFloat(bill.dueAmount) - parsedAmount;
    }
  } else if (bill.type === "SR") {
    if (isDebit) {
      bill.dueAmount = parseFloat(bill.dueAmount) - parsedAmount;
    } else {
      bill.dueAmount = parseFloat(bill.dueAmount) - parsedAmount;
    }
  } else {
    console.log("No Bill Type Found");
  }
  await bill.save({ session });
}

// Centralized bill processing logic
async function handleBillProcessing({
  bill,
  parsedAmount,
  ledgerGroupName,
  isDebit,
  session,
}) {
  const processor = billProcessors[ledgerGroupName];
  if (!processor)
    throw new Error(`No processor found for ledger group: ${ledgerGroupName}`);
  await processor({ bill, parsedAmount, isDebit, session });
}

// Mapping ledger groups to their processing logic
const billProcessors = {
  VENDOR: processVendorBill,
  Customers: processCustomerBill,
};

async function processVendorBillBeforeUpdate({
  bill,
  parsedAmount,
  isDebit,
  session,
}) {
  if (bill.type === "RP") {
    if (isDebit) {
      bill.dueAmount = parseFloat(bill.dueAmount) + parsedAmount;
    } else {
      bill.dueAmount = parseFloat(bill.dueAmount) + parsedAmount;
    }
  }
  if (bill.type === "PR") {
    if (isDebit) {
      bill.dueAmount = parseFloat(bill.dueAmount) + parsedAmount;
    } else {
      bill.dueAmount = parseFloat(bill.dueAmount) + parsedAmount;
    }
  }
  if (bill.type === "PYMT") {
    if (isDebit) {
      bill.dueAmount = parseFloat(bill.dueAmount) + parsedAmount;
    } else {
      bill.dueAmount = parseFloat(bill.dueAmount) + parsedAmount;
    }
  }
  await bill.save({ session });
}

async function processCustomerBillBeforeUpdate({
  bill,
  parsedAmount,
  isDebit,
  session,
}) {
  if (bill.type === "BS") {
    if (isDebit) {
      bill.dueAmount = parseFloat(bill.dueAmount) - parsedAmount;
    } else {
      bill.dueAmount = parseFloat(bill.dueAmount) + parsedAmount;
    }
  } else if (bill.type === "RCPT") {
    if (isDebit) {
      bill.dueAmount = parseFloat(bill.dueAmount) + parsedAmount;
    } else {
      bill.dueAmount = parseFloat(bill.dueAmount) + parsedAmount;
    }
  } else if (bill.type === "SR") {
    if (isDebit) {
      bill.dueAmount = parseFloat(bill.dueAmount) + parsedAmount;
    } else {
      bill.dueAmount = parseFloat(bill.dueAmount) + parsedAmount;
    }
  } else {
    console.log("No Bill Type Found");
  }
  await bill.save({ session });
}

// Centralized bill processing logic
async function handleBillProcessingBeforeUpdate({
  bill,
  parsedAmount,
  ledgerGroupName,
  isDebit,
  session,
}) {
  const processor = billProcessorsBeforeUpdate[ledgerGroupName];
  if (!processor)
    throw new Error(`No processor found for ledger group: ${ledgerGroupName}`);
  await processor({ bill, parsedAmount, isDebit, session });
}

// Mapping ledger groups to their processing logic
const billProcessorsBeforeUpdate = {
  VENDOR: processVendorBillBeforeUpdate,
  Customers: processCustomerBillBeforeUpdate,
};

async function createNewBill({
  ledgerGroupName,
  bill,
  journalData,
  parsedAmount,
  session,
  journalVch,
}) {
  let newBillModel;
  if (ledgerGroupName === "VENDOR") {
    newBillModel = new PurchaseBillModel({
      date: journalData.date,
      companyCode: journalData.companyCode,
      name: bill.billName,
      type: "Journal",
      ledger: bill.ledger,
      ref: journalVch._id,
      totalAmount: parsedAmount,
      dueAmount: parsedAmount,
    });
  } else if (ledgerGroupName === "Customers") {
    newBillModel = new SalesBillModel({
      date: journalData.date,
      companyCode: journalData.companyCode,
      name: bill.billName,
      type: "Journal",
      ledger: bill.ledger,
      ref: journalVch._id,
      totalAmount: parsedAmount,
      dueAmount: parsedAmount,
    });
  } else {
    throw new Error("Invalid ledger group name for New Ref.");
  }

  await newBillModel.save({ session });
  return newBillModel._id;
}

const JournalVoucherController = {
  // create Journal Voucher
  createJournalVoucher: async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const journalData = req.body;
      // console.log(journalData);

      journalData.totalamount = parseFloat(journalData.totalamount);
      const journalVch = new JournalVoucher(journalData);

      // for (const entry of journalData.entries) {
      //   const { ledger: ledgerId, debit, credit } = entry;

      //   // Fetch the ledger and populate the ledgerGroup field
      //   const ledger = await Ledger.findById(ledgerId)
      //     .populate("ledgerGroup")
      //     .session(session);
      //   if (!ledger) throw new Error("Ledger not found.");

      //   const ledgerGroupName = ledger.ledgerGroup?.name;
      //   console.log("This is Ledger Group Name: " + ledgerGroupName);

      //   if (!ledgerGroupName) throw new Error("Ledger group not found.");

      //   if (credit) {
      //     ledger.debitBalance += credit;
      //   }
      //   if (debit) {
      //     ledger.debitBalance -= debit;
      //   }

      //   await ledger.save({ session });

      //   // Skip billwise handling for "Cash In Hand" ledger group
      //   if (ledgerGroupName === "Cash In Hand") continue;

      //   // Handle billwise data dynamically
      //   for (const bill of journalData.billwise) {
      //     const { billType, amount, Bill } = bill;
      //     const parsedAmount = parseFloat(amount);

      //     if (billType === "Against Ref.") {
      //       if (!Bill)
      //         throw new Error("Sales Bill ID is required for Against Ref.");

      //       const billEntry =
      //         ledgerGroupName === "VENDOR"
      //           ? await PurchaseBillModel.findById(Bill).session(session)
      //           : await SalesBillModel.findById(Bill).session(session);

      //       if (!billEntry) throw new Error("Bill not found.");
      //       const isDebit = !!debit;
      //       console.log("These is Debit or Credit ....isDebit" + isDebit);

      //       await handleBillProcessing({
      //         bill: billEntry,
      //         parsedAmount,
      //         ledgerGroupName,
      //         isDebit,
      //         session,
      //       });
      //     }
      //     // else if (billType === "New Ref.") {
      //     //   const newBill =
      //     //     ledgerGroupName === "VENDOR"
      //     //       ? new PurchaseBillModel({
      //     //           date: journalData.date,
      //     //           companyCode: journalData.companyCode,
      //     //           name: bill.billName,
      //     //           type: "Journal",
      //     //           ledger: entry.ledger,
      //     //           ref: journalVch._id,
      //     //           totalAmount: parsedAmount,
      //     //           dueAmount: parsedAmount,
      //     //         })
      //     //       : new SalesBillModel({
      //     //           date: journalData.date,
      //     //           companyCode: journalData.companyCode,
      //     //           name: bill.billName,
      //     //           type: "Journal",
      //     //           ledger: entry.ledger,
      //     //           ref: journalVch._id,
      //     //           totalAmount: parsedAmount,
      //     //           dueAmount: parsedAmount,
      //     //         });

      //     //   await newBill.save({ session });

      //     //   const billwiseEntry = journalVch.billwise.find(
      //     //     (b) =>
      //     //       b.billName === bill.billName &&
      //     //       b.billType === "New Ref." &&
      //     //       b.amount === amount
      //     //   );
      //     //   if (billwiseEntry) {
      //     //     billwiseEntry.Bill = newBill._id;
      //     //   }

      //     // }
      //     // else if (billType === "New Ref.") {
      //     //   let newBill;
      //     //   console.log("These is Ledger Group Name" + ledgerGroupName);
      //     //   if (ledgerGroupName === "VENDOR") {
      //     //     // Vendor: Save in PurchaseBillModel
      //     //     console.log("Inside The Vendor");
      //     //     newBill = new PurchaseBillModel({
      //     //       date: journalData.date,
      //     //       companyCode: journalData.companyCode,
      //     //       name: bill.billName,
      //     //       type: "Journal",
      //     //       ledger: entry.ledger,
      //     //       ref: journalVch._id,
      //     //       totalAmount: parsedAmount,
      //     //       dueAmount: parsedAmount,
      //     //     });
      //     //   } else if (ledgerGroupName === "Customers") {
      //     //     // Customer: Save in SalesBillModel
      //     //     console.log("Inside The Customers");

      //     //     newBill = new SalesBillModel({
      //     //       date: journalData.date,
      //     //       companyCode: journalData.companyCode,
      //     //       name: bill.billName,
      //     //       type: "Journal",
      //     //       ledger: entry.ledger,
      //     //       ref: journalVch._id,
      //     //       totalAmount: parsedAmount,
      //     //       dueAmount: parsedAmount,
      //     //     });
      //     //   } else {
      //     //     // Handle unexpected ledger group
      //     //     console.error("Invalid ledger group name:", ledgerGroupName);
      //     //     throw new Error(
      //     //       "Invalid ledger group name. Entry must be either Vendor or Customer."
      //     //     );
      //     //   }

      //     //   console.log("Ledger Group Name:", ledgerGroupName);
      //     //   console.log("Bill Type:", billType);
      //     //   console.log("Parsed Amount:", parsedAmount);

      //     //   // Save the new bill in the correct collection
      //     //   await newBill.save({ session });

      //     //   // Update the billwise entry with the new bill's ID
      //     //   const billwiseEntry = journalVch.billwise.find(
      //     //     (b) =>
      //     //       b.billName === bill.billName &&
      //     //       b.billType === "New Ref." &&
      //     //       b.amount === amount
      //     //   );
      //     //   if (billwiseEntry) {
      //     //     billwiseEntry.Bill = newBill._id;
      //     //   }
      //     // }

      //     else if (billType === "New Ref.") {
      //       const newBillId = await createNewBill({
      //         ledgerGroupName,
      //         bill,
      //         journalData,
      //         parsedAmount,
      //         session,
      //         journalVch,
      //       });

      //       const billwiseEntry = journalVch.billwise.find(
      //         (b) => b.billName === bill.billName && b.billType === "New Ref." && b.amount === amount
      //       );
      //       if (billwiseEntry) {
      //         billwiseEntry.Bill = newBillId;
      //       }
      //     }

      //     else if (billType === "On Account") {
      //       const amount = parsedAmount; // Use the parsed amount directly for debit/credit
      //       const isDebit = !!debit; // Determine if it's debit or credit

      //       if (isDebit) {
      //         // Create a journal voucher entry for debit
      //         console.log(`Creating a debit entry for amount: ${amount}`);

      //         // Reduce the ledger's debit balance by the parsed amount
      //         ledger.debitBalance -= amount;
      //       } else {
      //         // Create a journal voucher entry for credit
      //         console.log(`Creating a credit entry for amount: ${amount}`);

      //         // Increase the ledger's debit balance by the parsed amount
      //         ledger.debitBalance += amount;
      //       }
      //     }
      //   }
      // }
      // Process each ledger entry

      for (const entry of journalData.entries) {
        const { ledger: ledgerId, debit, credit } = entry;

        const ledger = await Ledger.findById(ledgerId)
          .populate("ledgerGroup")
          .session(session);
        if (!ledger) throw new Error("Ledger not found.");

        const ledgerGroupName = ledger.ledgerGroup?.name;
        console.log("This is Ledger Group Name: " + ledgerGroupName);
        if (!ledgerGroupName) throw new Error("Ledger group not found.");

        if (credit) ledger.debitBalance += credit;
        if (debit) ledger.debitBalance -= debit;

        await ledger.save({ session });

        // Skip billwise handling for "Cash In Hand" ledger group
        if (ledgerGroupName === "Cash In Hand") continue;
      }

      // Process each billwise entry independently
      for (const bill of journalData.billwise) {
        const {
          ledger: ledgerId,
          billType,
          amount,
          Bill,
          debit,
          credit,
        } = bill;
        const parsedAmount = parseFloat(amount);

        const ledger = await Ledger.findById(ledgerId)
          .populate("ledgerGroup")
          .session(session);
        if (!ledger) throw new Error("Ledger not found.");

        const ledgerGroupName = ledger.ledgerGroup?.name;
        if (!ledgerGroupName) throw new Error("Ledger group not found.");

        bill.ledgerGroupName = ledgerGroupName;
        console.log(
          `Processing bill with ledgerGroupName: ${ledgerGroupName}, billType: ${billType}`
        );

        if (billType === "Against Ref.") {
          if (!Bill)
            throw new Error("Sales Bill ID is required for Against Ref.");

          const billEntry =
            ledgerGroupName === "VENDOR"
              ? await PurchaseBillModel.findById(Bill).session(session)
              : await SalesBillModel.findById(Bill).session(session);

          if (!billEntry) throw new Error("Bill not found.");

          const isDebit = !!debit;
          await handleBillProcessing({
            bill: billEntry,
            parsedAmount,
            ledgerGroupName,
            isDebit,
            session,
          });
        } else if (billType === "New Ref.") {
          const newBillId = await createNewBill({
            ledgerGroupName,
            bill,
            journalData,
            parsedAmount,
            session,
            journalVch,
          });

          const billwiseEntry = journalVch.billwise.find(
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

          if (isDebit) {
            ledger.debitBalance -= parsedAmount;
          } else {
            ledger.debitBalance += parsedAmount;
          }
        }
      }

      await journalVch.save({ session });

      await session.commitTransaction();
      session.endSession();

      return res.status(201).json({
        success: true,
        message: "Journal voucher created successfully!",
        data: journalVch,
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

  // Fetch All Journal Voucher
  getAllJournal: async (req, res) => {
    try {
      const journal = await JournalVoucher.find({});
      return res.json({ success: true, data: journal });
    } catch (ex) {
      return res.json({ success: false, message: ex });
    }
  },

  // Fetch Journal By Id
  getJournalById: async (req, res) => {
    try {
      const { id } = req.params;

      const journal = await JournalVoucher.findById(id);
      if (!journal) {
        return res
          .status(404)
          .json({ success: false, error: "Entry not found" });
      }
      res.json({ success: true, data: journal });
    } catch (error) {
      res.json({ success: false, message: error });
    }
  },

  deleteJournalVoucher: async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
  
    try {
      const { id } = req.params;
  
      // Fetch the existing journal voucher
      const journalVoucher = await JournalVoucher.findById(id).session(session);
      if (!journalVoucher) {
        throw new Error("Journal Voucher not found.");
      }
  
      // Step 1: Revert `entries`
      for (const entry of journalVoucher.entries) {
        const { ledger: ledgerId, debit, credit } = entry;
  
        const ledger = await Ledger.findById(ledgerId)
          .populate("ledgerGroup")
          .session(session);
        if (!ledger) throw new Error("Ledger not found.");
  
        const ledgerGroupName = ledger.ledgerGroup?.name;
        console.log("Reverting Ledger Group Name: " + ledgerGroupName);
        if (!ledgerGroupName) throw new Error("Ledger group not found.");
  
        // Revert ledger balances
        if (credit) ledger.debitBalance -= credit;
        if (debit) ledger.debitBalance += debit;
  
        await ledger.save({ session });
  
        // Skip `billwise` adjustments for "Cash In Hand"
        if (ledgerGroupName === "Cash In Hand") continue;
      }
  
      // Step 2: Revert `billwise`
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
  
        const ledger = await Ledger.findById(ledgerId)
          .populate("ledgerGroup")
          .session(session);
        if (!ledger) throw new Error("Ledger not found.");
  
        const ledgerGroupName = ledger.ledgerGroup?.name;
  
        if (billType === "Against Ref.") {
          const billEntry =
            ledgerGroupName === "VENDOR"
              ? await PurchaseBillModel.findById(Bill).session(session)
              : await SalesBillModel.findById(Bill).session(session);
  
          if (!billEntry) throw new Error("Bill not found.");
  
          const isDebit = !!debit;
          await handleBillProcessingBeforeUpdate({
            bill: billEntry,
            parsedAmount,
            ledgerGroupName,
            isDebit,
            session,
          });
        } else if (billType === "New Ref." && Bill) {
          const existingBill =
            ledgerGroupName === "VENDOR"
              ? await PurchaseBillModel.findById(Bill).session(session)
              : await SalesBillModel.findById(Bill).session(session);
  
          if (existingBill) {
            const hasBillTypeChanged =
              journalVoucher.billwise.some(
                (b) => b.Bill === Bill && b.billType !== billType
              );
  
            if (hasBillTypeChanged) {
              await existingBill.deleteOne({ session });
              console.log(`Deleted unused bill: ${Bill}`);
            }
          } else {
            console.log("No Bill Found");
          }
        } else if (billType === "On Account") {
          const isDebit = !!debit;
  
          if (isDebit) {
            ledger.debitBalance += parsedAmount;
          } else {
            ledger.debitBalance -= parsedAmount;
          }
  
          await ledger.save({ session });
        }
      }
  
      // Step 3: Delete the journal voucher
      await JournalVoucher.findByIdAndDelete(id, { session });
  
      // Commit the transaction
      await session.commitTransaction();
      session.endSession();
  
      res.status(200).json({
        success: true,
        message: "Journal Voucher deleted",
      });
    } catch (error) {
      // Rollback the transaction on error
      await session.abortTransaction();
      session.endSession();
  
      res.status(400).json({ success: false, message: error.message });
    }
  },
  

  // updateJournalVoucher: async (req, res) => {
  //   const session = await mongoose.startSession();
  //   session.startTransaction();

  //   try {
  //     const { id } = req.params; // Journal Voucher ID from URL
  //     const updateData = req.body; // Extract all fields from the request body

  //     // Fetch existing journal voucher
  //     const existingJournalVch = await JournalVoucher.findById(id).session(
  //       session
  //     );
  //     if (!existingJournalVch) {
  //       throw new Error("Journal Voucher not found.");
  //     }

  //     // Step 1: Revert existing `entries` and `billwise`
  //     for (const entry of existingJournalVch.entries) {
  //       const { ledger: ledgerId, debit, credit } = entry;

  //       const ledger = await Ledger.findById(ledgerId)
  //         .populate("ledgerGroup")
  //         .session(session);
  //       if (!ledger) throw new Error("Ledger not found.");

  //       const ledgerGroupName = ledger.ledgerGroup?.name;
  //       console.log("Reverting Ledger Group Name: " + ledgerGroupName);
  //       if (!ledgerGroupName) throw new Error("Ledger group not found.");

  //       // Revert previous adjustments
  //       if (credit) ledger.debitBalance -= credit; // Undo credit (add it back)
  //       if (debit) ledger.debitBalance += debit; // Undo debit (subtract it)

  //       await ledger.save({ session });

  //       // Skip billwise handling for "Cash In Hand" ledger group
  //       if (ledgerGroupName === "Cash In Hand") continue;
  //     }

  //     for (const bill of existingJournalVch.billwise) {
  //       const {
  //         ledger: ledgerId,
  //         billType,
  //         amount,
  //         Bill,
  //         debit,
  //         credit,
  //       } = bill;
  //       const parsedAmount = parseFloat(amount);

  //       const ledger = await Ledger.findById(ledgerId)
  //         .populate("ledgerGroup")
  //         .session(session);
  //       if (!ledger) throw new Error("Ledger not found.");

  //       const ledgerGroupName = ledger.ledgerGroup?.name;

  //       if (billType === "Against Ref.") {
  //         const billEntry =
  //           ledgerGroupName === "VENDOR"
  //             ? await PurchaseBillModel.findById(Bill).session(session)
  //             : await SalesBillModel.findById(Bill).session(session);

  //         if (!billEntry) throw new Error("Bill not found.");

  //         const isDebit = !!debit;
  //         await handleBillProcessingBeforeUpdate({
  //           bill: billEntry,
  //           parsedAmount: parsedAmount,
  //           ledgerGroupName,
  //           isDebit,
  //           session,
  //         });
  //       } else if (billType === "New Ref." && Bill) {
  //         const billEntry =
  //           ledgerGroupName === "VENDOR"
  //             ? await PurchaseBillModel.findById(Bill).session(session)
  //             : await SalesBillModel.findById(Bill).session(session);

  //         if (!billEntry) throw new Error("Bill not found.");

  //         billEntry.dueAmount -= parsedAmount;
  //         await billEntry.save({ session });
  //       } else if (billType === "On Account") {
  //         const isDebit = !!debit;

  //         if (isDebit) {
  //           ledger.debitBalance += parsedAmount;
  //         } else {
  //           ledger.debitBalance -= parsedAmount;
  //         }
  //       }
  //     }

  //     // Step 2: Update all fields with new data
  //     const allowedFields = [
  //       "no",
  //       "totalamount",
  //       "date",
  //       "narration",
  //       "companyCode",
  //       "chequeDetails",
  //       "entries",
  //       "billwise",
  //     ];

  //     for (const key of allowedFields) {
  //       if (key in updateData) {
  //         existingJournalVch[key] = updateData[key];
  //       }
  //     }

  //     // Step 3: Process new `billwise`

  //     for (const entry of updateData.entries) {
  //       const { ledger: ledgerId, debit, credit } = entry;

  //       const ledger = await Ledger.findById(ledgerId)
  //         .populate("ledgerGroup")
  //         .session(session);
  //       if (!ledger) throw new Error("Ledger not found.");

  //       const ledgerGroupName = ledger.ledgerGroup?.name;
  //       console.log("Updating Ledger Group Name: " + ledgerGroupName);
  //       if (!ledgerGroupName) throw new Error("Ledger group not found.");

  //       // Apply new adjustments
  //       if (credit) ledger.debitBalance += credit;
  //       if (debit) ledger.debitBalance -= debit;
  //       await ledger.save({ session });

  //       // Skip billwise handling for "Cash In Hand" ledger group
  //       if (ledgerGroupName === "Cash In Hand") continue;
  //     }

  //     for (const bill of updateData.billwise || []) {
  //       const {
  //         ledger: ledgerId,
  //         billType,
  //         amount,
  //         Bill,
  //         debit,
  //         date,
  //         billName,
  //         credit,
  //       } = bill;
  //       const parsedAmount = parseFloat(amount);

  //       const ledger = await Ledger.findById(ledgerId)
  //         .populate("ledgerGroup")
  //         .session(session);
  //       if (!ledger) throw new Error("Ledger not found.");

  //       const ledgerGroupName = ledger.ledgerGroup?.name;

  //       if (billType === "Against Ref.") {
  //         const billEntry =
  //           ledgerGroupName === "VENDOR"
  //             ? await PurchaseBillModel.findById(Bill).session(session)
  //             : await SalesBillModel.findById(Bill).session(session);

  //         if (!billEntry) throw new Error("Bill not found.");

  //         const isDebit = !!debit;
  //         await handleBillProcessing({
  //           bill: billEntry,
  //           parsedAmount,
  //           ledgerGroupName,
  //           isDebit,
  //           session,
  //         });
  //       } else if (billType === "New Ref.") {
  //         // Check if a new bill already exists
  //         const existingBill =
  //           ledgerGroupName === "VENDOR"
  //             ? await PurchaseBillModel.findById(Bill).session(session)
  //             : await SalesBillModel.findById(Bill).session(session);

  //         if (existingBill) {
  //           existingBill.date = date;
  //           existingBill.name = billName;
  //           existingBill.dueAmount = parsedAmount;
  //           existingBill.ledger = ledgerId;

  //           // Save the updated bill within the session
  //           await existingBill.save({ session });
  //         } else if (!existingBill) {
  //           // Create a new bill if it doesn't exist
  //           const newBillId = await createNewBill({
  //             ledgerGroupName,
  //             bill,
  //             journalData: existingJournalVch,
  //             parsedAmount,
  //             session,
  //             journalVch: existingJournalVch,
  //           });

  //           if (newBillId) {
  //             console.log("Inside the New Bill Id");
  //             bill.Bill = newBillId.toString();
  //           } else {
  //             throw new Error("Failed to create new bill.");
  //           }
  //         }
  //       } else if (billType === "On Account") {
  //         const isDebit = !!debit;

  //         if (isDebit) {
  //           ledger.debitBalance -= parsedAmount;
  //         } else {
  //           ledger.debitBalance += parsedAmount;
  //         }
  //       }
  //     }

  //     existingJournalVch.billwise = updateData.billwise;

  //     // Save updated journal voucher
  //     await existingJournalVch.save({ session });

  //     await session.commitTransaction();
  //     session.endSession();

  //     return res.status(200).json({
  //       success: true,
  //       message: "Journal voucher updated successfully!",
  //       data: existingJournalVch,
  //     });
  //   } catch (error) {
  //     await session.abortTransaction();
  //     session.endSession();
  //     return res.status(500).json({
  //       success: false,
  //       message: error.message,
  //     });
  //   }
  // },

  updateJournalVoucher: async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { id } = req.params; // Journal Voucher ID from URL
      const updateData = req.body; // Extract all fields from the request body

      // Fetch existing journal voucher
      const existingJournalVch = await JournalVoucher.findById(id).session(
        session
      );
      if (!existingJournalVch) {
        throw new Error("Journal Voucher not found.");
      }

      // Step 1: Revert existing `entries` and `billwise`
      for (const entry of existingJournalVch.entries) {
        const { ledger: ledgerId, debit, credit } = entry;

        const ledger = await Ledger.findById(ledgerId)
          .populate("ledgerGroup")
          .session(session);
        if (!ledger) throw new Error("Ledger not found.");

        const ledgerGroupName = ledger.ledgerGroup?.name;
        console.log("Reverting Ledger Group Name: " + ledgerGroupName);
        if (!ledgerGroupName) throw new Error("Ledger group not found.");

        // Revert previous adjustments
        if (credit) ledger.debitBalance -= credit; // Undo credit (add it back)
        if (debit) ledger.debitBalance += debit; // Undo debit (subtract it)

        await ledger.save({ session });

        // Skip billwise handling for "Cash In Hand" ledger group
        if (ledgerGroupName === "Cash In Hand") continue;
      }

      for (const bill of existingJournalVch.billwise) {
        const {
          ledger: ledgerId,
          billType,
          amount,
          Bill,
          debit,
          credit,
        } = bill;
        const parsedAmount = parseFloat(amount);

        const ledger = await Ledger.findById(ledgerId)
          .populate("ledgerGroup")
          .session(session);
        if (!ledger) throw new Error("Ledger not found.");

        const ledgerGroupName = ledger.ledgerGroup?.name;

        if (billType === "Against Ref.") {
          const billEntry =
            ledgerGroupName === "VENDOR"
              ? await PurchaseBillModel.findById(Bill).session(session)
              : await SalesBillModel.findById(Bill).session(session);

          if (!billEntry) throw new Error("Bill not found.");

          const isDebit = !!debit;
          await handleBillProcessingBeforeUpdate({
            bill: billEntry,
            parsedAmount: parsedAmount,
            ledgerGroupName,
            isDebit,
            session,
          });
        }

        
        else if (billType === "New Ref." && Bill) {
          // Fetch the existing bill based on the ledger group name
          const existingBill =
            ledgerGroupName === "VENDOR"
              ? await PurchaseBillModel.findById(Bill).session(session)
              : await SalesBillModel.findById(Bill).session(session);
        
          const updatedBill =
            updateData.billwise.find(
              (bill) => bill.Bill && bill.Bill.toString() === Bill.toString()
            ) ?? { Bill };
        
          if (existingBill) {
            // Check if billType or ledger has changed
            const hasBillTypeChanged =
              updatedBill.billType !== billType || updatedBill.ledger?.toString() !== existingBill.ledger.toString();
        
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
        }
        
        else if (billType === "On Account") {
          const isDebit = !!debit;

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
          existingJournalVch[key] = updateData[key];
        }
      }

      // Step 3: Process new `billwise`

      for (const entry of updateData.entries) {
        const { ledger: ledgerId, debit, credit } = entry;

        const ledger = await Ledger.findById(ledgerId)
          .populate("ledgerGroup")
          .session(session);
        if (!ledger) throw new Error("Ledger not found.");

        const ledgerGroupName = ledger.ledgerGroup?.name;
        console.log("Updating Ledger Group Name: " + ledgerGroupName);
        if (!ledgerGroupName) throw new Error("Ledger group not found.");

        // Apply new adjustments
        if (credit) ledger.debitBalance += credit;
        if (debit) ledger.debitBalance -= debit;
        await ledger.save({ session });

        // Skip billwise handling for "Cash In Hand" ledger group
        if (ledgerGroupName === "Cash In Hand") continue;
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

        const ledger = await Ledger.findById(ledgerId)
          .populate("ledgerGroup")
          .session(session);
        if (!ledger) throw new Error("Ledger not found.");

        const ledgerGroupName = ledger.ledgerGroup?.name;

        if (billType === "Against Ref.") {
          const billEntry =
            ledgerGroupName === "VENDOR"
              ? await PurchaseBillModel.findById(Bill).session(session)
              : await SalesBillModel.findById(Bill).session(session);

          if (!billEntry) throw new Error("Bill not found.");

          const isDebit = !!debit;
          await handleBillProcessing({
            bill: billEntry,
            parsedAmount,
            ledgerGroupName,
            isDebit,
            session,
          });
        } else if (billType === "New Ref.") {
          const billModel =
            ledgerGroupName === "VENDOR" ? PurchaseBillModel : SalesBillModel;

          let billEntry = await billModel.findById(Bill).session(session);

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
              ledgerGroupName,
              bill,
              journalData: existingJournalVch,
              parsedAmount,
              session,
              journalVch: existingJournalVch,
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

          if (isDebit) {
            ledger.debitBalance -= parsedAmount;
          } else {
            ledger.debitBalance += parsedAmount;
          }
        }
      }

      existingJournalVch.billwise = updateData.billwise;

      // Save updated journal voucher
      await existingJournalVch.save({ session });

      await session.commitTransaction();
      session.endSession();

      return res.status(200).json({
        success: true,
        message: "Journal voucher updated successfully!",
        data: existingJournalVch,
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

module.exports = JournalVoucherController;

// updatePurchaseReturn: async function (req, res) {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//       const purchaseReturnData = req.body;
//       const purchaseReturnId = req.params.id;

//       const existingPurchaseReturn = await PurchaseReturnModel.findById(purchaseReturnId).session(session);
//       if (!existingPurchaseReturn) throw new Error("Purchase Return not found.");

//       const ledger = await Ledger.findById(existingPurchaseReturn.ledger).session(session);
//       if (!ledger) throw new Error("Ledger not found.");

//       for (const entry of existingPurchaseReturn.entries) {
//           const productId = entry.itemName;
//           const quantity = entry.qty;

//           const product = await Items.findById(productId).session(session);
//           if (!product) throw new Error("Product not found.");

//           await Items.updateOne(
//               { _id: productId },
//               { $inc: { maximumStock: quantity } },
//               { session }
//           );
//       }

//       for (const bill of existingPurchaseReturn.billwise) {
//           const billType = bill.billType;
//           const amount = bill.amount;

//           if (billType === "New Ref.") {
//               const purchaseBill = await PurchaseBillModel.findById(bill.purchaseBill).session(session);
//               if (purchaseBill) {
//                   await PurchaseBillModel.deleteOne({ _id: bill.purchaseBill }).session(session);
//               }
//           } else if (billType === "Against Ref.") {
//               const purchaseBill = await PurchaseBillModel.findById(bill.purchaseBill).session(session);
//               if (purchaseBill) {
//                   if (purchaseBill.type === "RP") {
//                       purchaseBill.dueAmount = parseFloat(purchaseBill.dueAmount) + parseFloat(amount);
//                   } else {
//                       purchaseBill.dueAmount = parseFloat(purchaseBill.dueAmount) - parseFloat(amount);
//                   }
//                   await purchaseBill.save({ session });
//               }
//           }
//       }

//       if (existingPurchaseReturn.type === "Debit") {
//           ledger.debitBalance = parseFloat(ledger.debitBalance) - parseFloat(existingPurchaseReturn.totalAmount);
//       }

//       if (existingPurchaseReturn.type === "Cash") {
//           existingPurchaseReturn.cashAmount = 0;
//       }

//       await ledger.save({ session });

//       existingPurchaseReturn.entries = [];
//       existingPurchaseReturn.billwise = [];

//       Object.assign(existingPurchaseReturn, purchaseReturnData);
//       existingPurchaseReturn.totalAmount = parseFloat(purchaseReturnData.totalAmount);
//       existingPurchaseReturn.cashAmount = parseFloat(purchaseReturnData.cashAmount);

//       for (const entry of purchaseReturnData.entries) {
//           const productId = entry.itemName;
//           const quantity = entry.qty;

//           const product = await Items.findById(productId).session(session);
//           if (!product) throw new Error("Product not found.");

//           await Items.updateOne(
//               { _id: productId },
//               { $inc: { maximumStock: -quantity } },
//               { session }
//           );
//       }

//       for (const bill of purchaseReturnData.billwise) {
//           const billType = bill.billType;
//           const amount = bill.amount;

//           if (billType === "New Ref.") {
//               const newPurchaseBill = new PurchaseBillModel({
//                   date: purchaseReturnData.date,
//                   companyCode: purchaseReturnData.companyCode,
//                   name: bill.billName,
//                   type: "PR",
//                   ledger: purchaseReturnData.ledger,
//                   ref: existingPurchaseReturn._id,
//                   totalAmount: amount,
//                   dueAmount: amount,
//               });

//               await newPurchaseBill.save({ session });

//               const billwiseEntry = existingPurchaseReturn.billwise.find(
//                   (b) => b.billName === bill.billName && b.billType === "New Ref." && b.amount === amount
//               );
//               if (billwiseEntry) {
//                   billwiseEntry.purchaseBill = newPurchaseBill._id;
//               }

//           } else if (billType === "Against Ref.") {
//               const purchaseBillId = bill.purchaseBill;

//               if (!purchaseBillId) throw new Error("Purchase Bill ID is required for Against Ref.");

//               const purchaseBill = await PurchaseBillModel.findById(purchaseBillId).session(session);
//               if (!purchaseBill) throw new Error("Purchase Bill not found.");

//               if (purchaseBill.type === "RP") {
//                   purchaseBill.dueAmount = parseFloat(purchaseBill.dueAmount) - parseFloat(amount);
//               } else {
//                   purchaseBill.dueAmount = parseFloat(purchaseBill.dueAmount) + parseFloat(amount);
//               }
//               await purchaseBill.save({ session });
//           }
//       }

//       if (purchaseReturnData.type === "Debit") {
//           ledger.debitBalance = parseFloat(ledger.debitBalance) + parseFloat(purchaseReturnData.totalAmount );
//       }

//       if (purchaseReturnData.type === "Cash") {
//           existingPurchaseReturn.cashAmount = purchaseReturnData.totalAmount;
//       }

//       await ledger.save({ session });
//       await existingPurchaseReturn.save({ session });

//       await session.commitTransaction();
//       session.endSession();

//       return res.json({
//           success: true,
//           message: "Purchase Return entry updated successfully!",
//           data: existingPurchaseReturn,
//       });
//   } catch (ex) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.json({ success: false, message: ex.message });
//   }
// },
