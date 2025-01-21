const CreditNoteVoucher = require("../models/credit_note_voucher_model");
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
  if (bill.type === "Journal") {
    if (isDebit) {
      bill.dueAmount = parseFloat(bill.dueAmount) - parsedAmount;
    } else {
      bill.dueAmount = parseFloat(bill.dueAmount) - parsedAmount;
    }
  }
  if (bill.type === "Credit Note w/o Stock") {
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
  } else if (bill.type === "Journal") {
    if (isDebit) {
      bill.dueAmount = parseFloat(bill.dueAmount) - parsedAmount;
    } else {
      bill.dueAmount = parseFloat(bill.dueAmount) - parsedAmount;
    }
  } else if (bill.type === "Credit Note w/o Stock") {
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
  if (bill.type === "Journal") {
    if (isDebit) {
      bill.dueAmount = parseFloat(bill.dueAmount) + parsedAmount;
    } else {
      bill.dueAmount = parseFloat(bill.dueAmount) + parsedAmount;
    }
  }
  if (bill.type === "Credit Note w/o Stock") {
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
  } else if (bill.type === "Journal") {
    if (isDebit) {
      bill.dueAmount = parseFloat(bill.dueAmount) + parsedAmount;
    } else {
      bill.dueAmount = parseFloat(bill.dueAmount) + parsedAmount;
    }
  } else if (bill.type === "Credit Note w/o Stock") {
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
      type: "Credit Note w/o Stock",
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
      type: "Credit Note w/o Stock",
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

const CreditNoteVoucherController = {
  // create Credit Note Voucher
  createCreditNoteVoucher: async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const journalData = req.body;
      // console.log(journalData);

      journalData.totalamount = parseFloat(journalData.totalamount);
      const journalVch = new CreditNoteVoucher(journalData);

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
        message: "Credit Note voucher created successfully!",
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
  getAllCreditNote: async (req, res) => {
    try {
      const creditNote = await CreditNoteVoucher.find({});
      return res.json({ success: true, data: creditNote });
    } catch (ex) {
      return res.json({ success: false, message: ex });
    }
  },

    // Fetch Journal By Id
    getCreditNoteById: async (req, res) => {
      try {
        const { id } = req.params;

        const creditNote = await CreditNoteVoucher.findById(id);
        if (!creditNote) {
          return res
            .status(404)
            .json({ success: false, error: "Entry not found" });
        }
        res.json({ success: true, data: creditNote });
      } catch (error) {
        res.json({ success: false, message: error });
      }
    },

    deleteCreditNoteVoucher: async (req, res) => {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        const { id } = req.params;

        // Fetch the existing Credit Note voucher
        const creditNoteVoucher = await CreditNoteVoucher.findById(id).session(session);
        if (!creditNoteVoucher) {
          throw new Error("Credit Note Voucher not found.");
        }

        // Step 1: Revert `entries`
        for (const entry of creditNoteVoucher.entries) {
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
        for (const bill of creditNoteVoucher.billwise) {
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
                creditNoteVoucher.billwise.some(
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
        await CreditNoteVoucher.findByIdAndDelete(id, { session });

        // Commit the transaction
        await session.commitTransaction();
        session.endSession();

        res.status(200).json({
          success: true,
          message: "Credit Note Voucher deleted",
        });
      } catch (error) {
        // Rollback the transaction on error
        await session.abortTransaction();
        session.endSession();

        res.status(400).json({ success: false, message: error.message });
      }
    },

    updateCreditNoteVoucher: async (req, res) => {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        const { id } = req.params; // Journal Voucher ID from URL
        const updateData = req.body; // Extract all fields from the request body

        // Fetch existing journal voucher
        const existingVch = await CreditNoteVoucher.findById(id).session(
          session
        );
        if (!existingVch) {
          throw new Error("Credit Note Voucher not found.");
        }

        // Step 1: Revert existing `entries` and `billwise`
        for (const entry of existingVch.entries) {
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

        for (const bill of existingVch.billwise) {
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
            existingVch[key] = updateData[key];
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
                journalData: existingVch,
                parsedAmount,
                session,
                journalVch: existingVch,
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

        existingVch.billwise = updateData.billwise;

        // Save updated journal voucher
        await existingVch.save({ session });

        await session.commitTransaction();
        session.endSession();

        return res.status(200).json({
          success: true,
          message: "Credit Note voucher updated successfully!",
          data: existingVch,
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

module.exports = CreditNoteVoucherController;
