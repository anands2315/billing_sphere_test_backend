const SalesEntry = require("../models/sales_entry_model");
const SalesReturn = require("../models/sales_return_model");
const Purchase = require("../models/purchase_model");
const PurchaseReturn = require("../models/purchase_return_model");
const Receipt = require("../models/receipt_voucher_model");
const Payment = require("../models/payment_model");
const Contra = require("../models/contra_voucher_model");
const Journal = require("../models/journal_voucher_model");
const GstExpense = require("../models/gst_expense_voucher_model");
const CreditNoteWo = require("../models/credit_note_voucher_model");
const DebitNoteWo = require("../models/debit_note_voucher_model");
// const moment = require("moment");

const VoucherRegisterController = {
  getVoucherRegister: async (req, res) => {
    try {
      const { voucherType, companyCode } = req.params; // Extract voucherType and companyCode
      const { startDate, endDate, ledgerId } = req.query;

      // Parse dates directly from the ISO format
      const parsedStartDate = startDate ? new Date(startDate) : null;
      const parsedEndDate = endDate ? new Date(endDate) : null;

      let query = { companyCode };

      const ledgerFieldMapping = {
        "Bill Of Supply": "party",
        "Retail Purchase": "ledger",
        "Sales Return": "ledger",
        "Purchase Return": "ledger",
        Receipt: "entries",
        Payment: "entries",
        Journal: "entries",
        Contra: "entries",
        "GST Expense": "entries",
        "Credit Note wo Stock": "entries",
        "Debit Note wo Stock": "entries",
      };

      const ledgerField = ledgerFieldMapping[voucherType];

      // Handle query for Receipt and Payment (entries array contains ledgerId)
      if (ledgerId) {
        if (ledgerField === "entries") {
          query[ledgerField] = { $elemMatch: { ledger: ledgerId } };
        } else {
          query[ledgerField] = ledgerId;
        }
      }

      // Add date filtering to the query if both dates are provided
      if (parsedStartDate && parsedEndDate) {
        query.$expr = {
          $and: [
            {
              $gte: [
                {
                  $dateFromString: {
                    dateString: "$date",
                    format: "%d/%m/%Y",
                  },
                },
                parsedStartDate,
              ],
            },
            {
              $lte: [
                {
                  $dateFromString: {
                    dateString: "$date",
                    format: "%d/%m/%Y",
                  },
                },
                parsedEndDate,
              ],
            },
          ],
        };
      }

      let entry;
      switch (voucherType) {
        case "Bill Of Supply":
          entry = await SalesEntry.find(query);
          break;
        case "Retail Purchase":
          entry = await Purchase.find(query);
          break;
        case "Sales Return":
          entry = await SalesReturn.find(query);
          break;
        case "Purchase Return":
          entry = await PurchaseReturn.find(query);
          break;
        case "Receipt":
          entry = await Receipt.find(query);
          break;
        case "Payment":
          entry = await Payment.find(query);
          break;
        case "Contra":
          entry = await Contra.find(query);
          break;
        case "Credit Note wo Stock":
          entry = await CreditNoteWo.find(query);
          break;
        case "Debit Note wo Stock":
          entry = await DebitNoteWo.find(query);
          break;
        case "Journal":
          entry = await Journal.find(query);
          break;
        case "GST Expense":
          entry = await GstExpense.find(query);
          break;
        default:
          return res.status(400).json({
            success: false,
            message: "Invalid voucher type provided.",
          });
      }

      console.log(`Fetched Entries Count: ${entry.length}`);

      // Return the fetched entries
      return res.status(200).json({
        success: true,
        data: entry,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  //   getVoucherRegister: async (req, res) => {

  //     try {
  //         const { voucherType, companyCode } = req.params;
  //         const { startDate, endDate, ledgerId, includeDebitCredit } = req.query; // Include checkbox param

  //         const parsedStartDate = startDate ? new Date(startDate) : null;
  //         const parsedEndDate = endDate ? new Date(endDate) : null;

  //         let query = { companyCode };

  //         const ledgerFieldMapping = {
  //             "Bill Of Supply": "party",
  //             "Retail Purchase": "ledger",
  //             "Sales Return": "ledger",
  //             "Purchase Return": "ledger",
  //             Receipt: "entries",
  //             Payment: "entries",
  //             Journal: "entries",
  //             Contra: "entries",
  //             "GST Expense": "entries",
  //             "Credit Note wo Stock": "entries",
  //             "Debit Note wo Stock": "entries",
  //         };

  //         const ledgerField = ledgerFieldMapping[voucherType];

  //         if (ledgerId) {
  //             if (ledgerField === "entries") {
  //                 query[ledgerField] = { $elemMatch: { ledger: ledgerId } };
  //             } else {
  //                 query[ledgerField] = ledgerId;
  //             }
  //         }

  //         if (parsedStartDate && parsedEndDate) {
  //             query.$expr = {
  //                 $and: [
  //                     {
  //                         $gte: [
  //                             { $dateFromString: { dateString: "$date", format: "%d/%m/%Y" } },
  //                             parsedStartDate,
  //                         ],
  //                     },
  //                     {
  //                         $lte: [
  //                             { $dateFromString: { dateString: "$date", format: "%d/%m/%Y" } },
  //                             parsedEndDate,
  //                         ],
  //                     },
  //                 ],
  //             };
  //         }

  //         let entry;
  //         switch (voucherType) {
  //             case "Bill Of Supply":
  //                 entry = await SalesEntry.find(query);
  //                 break;
  //             case "Retail Purchase":
  //                 entry = await Purchase.find(query);
  //                 break;
  //             case "Sales Return":
  //                 entry = await SalesReturn.find(query);
  //                 break;
  //             case "Purchase Return":
  //                 entry = await PurchaseReturn.find(query);
  //                 break;
  //             case "Receipt":
  //                 entry = await Receipt.find(query);
  //                 break;
  //             case "Payment":
  //                 entry = await Payment.find(query);
  //                 break;
  //             case "Contra":
  //                 entry = await Contra.find(query);
  //                 break;
  //             case "Credit Note wo Stock":
  //                 entry = await CreditNoteWo.find(query);
  //                 break;
  //             case "Debit Note wo Stock":
  //                 entry = await DebitNoteWo.find(query);
  //                 break;
  //             case "Journal":
  //                 entry = await Journal.find(query);
  //                 break;
  //             case "GST Expense":
  //                 entry = await GstExpense.find(query);
  //                 break;
  //             default:
  //                 return res.status(400).json({
  //                     success: false,
  //                     message: "Invalid voucher type provided.",
  //                 });
  //         }

  //         console.log(`Fetched Entries Count: ${entry.length}`);

  //         let totalSales = 0;
  //         let totalPurchase = 0;
  //         let customerTotal = 0;
  //         let vendorTotal = 0;

  //         if (includeDebitCredit === "true") {  // Only calculate if checkbox is checked
  //             for (const record of entry) {
  //                 if (voucherType === "Bill Of Supply") {
  //                     totalSales += record.totalamount || 0;
  //                 }
  //                 if (voucherType === "Retail Purchase") {
  //                     totalPurchase += record.totalamount || 0;
  //                 }

  //                 // Ledger-based totals
  //                 if (record.ledgerGroup === "Customers") {
  //                     customerTotal += record.totalamount || 0;
  //                 }
  //                 if (record.ledgerGroup === "Vendors") {
  //                     vendorTotal += record.totalamount || 0;
  //                 }
  //             }
  //         }

  //         return res.status(200).json({
  //             success: true,
  //             data: entry,
  //             totals: {
  //                 sales: totalSales,
  //                 purchase: totalPurchase,
  //                 customers: customerTotal,
  //                 vendors: vendorTotal,
  //             },
  //         });
  //     } catch (error) {
  //         return res.status(500).json({
  //             success: false,
  //             message: error.message,
  //         });
  //     }
  // },
};

module.exports = VoucherRegisterController;
