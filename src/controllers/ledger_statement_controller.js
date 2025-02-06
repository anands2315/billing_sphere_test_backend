const express = require("express");
const router = express.Router();
const Ledger = require("../models/ledger_model");
const SalesEntry = require("../models/sales_entry_model");
const SalesReturn = require("../models/sales_return_model");
const Purchase = require("../models/purchase_model");
const PurchaseReturn = require("../models/purchase_return_model");
const Receipt = require("../models/receipt_voucher_model");
const Payment = require("../models/payment_model");
const Journal = require("../models/journal_voucher_model");
const GstExpense = require("../models/gst_expense_voucher_model");
const CreditNoteWo = require("../models/credit_note_voucher_model");
const DebitNoteWo = require("../models/debit_note_voucher_model");
const mongoose = require("mongoose");

const getLedgerEntries = async (req, res) => {
  const { party, companyCode } = req.params;
  const {
    voucherType,
    entriesType,
    startDate,
    endDate,
    subLedgerId,
    amountGreater,
    amountLess,
    narration,
  } = req.query;

  if (!party) {
    return res.status(400).json({ message: "Ledger ID is required" });
  }

  if (!companyCode) {
    return res.status(400).json({ message: "Company code is required" });
  }

  const parsedStartDate = startDate ? new Date(startDate) : null;
  const parsedEndDate = endDate ? new Date(endDate) : null;

  try {
    const ledger = await Ledger.findById(party).populate("ledgerGroup").exec();
    if (!ledger || !ledger.ledgerGroup?.name) {
      return res
        .status(404)
        .json({ message: "Ledger or Ledger Group not found" });
    }

    const ledgerGroupName = ledger.ledgerGroup.name;

    const queryMap = {
      Customers: [
        {
          model: SalesEntry,
          type: "BILL OF SUPPLY",
          field: "party",
          voucherType: "BS",
        },
        {
          model: SalesReturn,
          type: "Sales Return",
          field: "ledger",
          voucherType: "SR",
        },
        {
          model: Receipt,
          type: "Receipt",
          field: "entries.ledger",
          voucherType: "RCPT",
        },
        {
          model: Journal,
          type: "Journal",
          field: "entries.ledger",
          voucherType: "JRN",
        },
        {
          model: GstExpense,
          type: "GST Expense",
          field: "entries.ledger",
          voucherType: "GEXP",
        },
        {
          model: CreditNoteWo,
          type: "Credit Note wo Stock",
          field: "entries.ledger",
          voucherType: "CNAV",
        },
        {
          model: DebitNoteWo,
          type: "Debit Note wo Stock",
          field: "entries.ledger",
          voucherType: "DNAV",
        },
      ],
      VENDOR: [
        {
          model: Purchase,
          type: "Retail Purchase",
          field: "ledger",
          voucherType: "RP",
        },
        {
          model: PurchaseReturn,
          type: "Purchase Return",
          field: "ledger",
          voucherType: "PR",
        },
        {
          model: Payment,
          type: "Payment",
          field: "entries.ledger",
          voucherType: "PYM",
        },
        {
          model: Journal,
          type: "Journal",
          field: "entries.ledger",
          voucherType: "JRN",
        },
        {
          model: GstExpense,
          type: "GST Expense",
          field: "entries.ledger",
          voucherType: "GEXP",
        },
        {
          model: CreditNoteWo,
          type: "Credit Note wo Stock",
          field: "entries.ledger",
          voucherType: "CNAV",
        },
        {
          model: DebitNoteWo,
          type: "Debit Note wo Stock",
          field: "entries.ledger",
          voucherType: "DNAV",
        },
      ],
    };

    let groupQueries = queryMap[ledgerGroupName];
    if (!groupQueries) {
      return res.status(400).json({ message: "Invalid ledger group name." });
    }

    // Apply voucherType filter if provided
    if (voucherType) {
      groupQueries = groupQueries.filter(
        (entry) => entry.type.toUpperCase() === voucherType.toUpperCase()
      );

      // If no matching voucher type is found, return empty data
      if (groupQueries.length === 0) {
        return res.status(200).json({
          message: "No matching voucher type found",
          data: [],
        });
      }
    }

    const applyEntriesTypeFilter = (query, type) => {
      if (!entriesType || entriesType.toUpperCase() === "ALL") {
        return query; // No filtering for "ALL"
      }

      const isCustomer = ledgerGroupName === "Customers";
      const isVendor = ledgerGroupName === "VENDOR";

      if (entriesType.toUpperCase() === "DEBIT") {
        if (isCustomer && (type === "Receipt" || type === "Sales Return"))
          return null;
        if (isVendor && type === "Retail Purchase") return null;

        if (
          [
            "Journal",
            "GST Expense",
            "Credit Note wo Stock",
            "Debit Note wo Stock",
          ].includes(type)
        ) {
          query["entries"] = {
            $elemMatch: { ledger: party, debit: { $gt: 0 } },
          };
        }
      }

      if (entriesType.toUpperCase() === "CREDIT") {
        if (isCustomer && type === "BILL OF SUPPLY") return null;
        if (isVendor && (type === "Purchase Return" || type === "Payment"))
          return null;

        if (
          [
            "Journal",
            "GST Expense",
            "Credit Note wo Stock",
            "Debit Note wo Stock",
          ].includes(type)
        ) {
          query["entries"] = {
            $elemMatch: { ledger: party, credit: { $gt: 0 } },
          };
        }
        if (subLedgerId) {
          query.entries = {
            $elemMatch: {
              ledger: subLedgerId,
            },
          };
        }
      }

      return query; // Default return query if no filtering applies
    };
    // const applyEntriesTypeFilter = (query, type) => {
    //   if (!entriesType || entriesType.toUpperCase() === "ALL") {
    //     return query; // No filtering for "ALL"
    //   }

    //   const isCustomer = ledgerGroupName === "Customers";
    //   const isVendor = ledgerGroupName === "VENDOR";

    //   // Initialize entry match criteria
    //   let entryMatchCriteria = {};

    //   if (entriesType.toUpperCase() === "DEBIT") {
    //     if (isCustomer && (type === "Receipt" || type === "Sales Return"))
    //       return null;
    //     if (isVendor && type === "Retail Purchase") return null;

    //     entryMatchCriteria = {
    //       account: "Dr",
    //       debit: { $gt: 0 },
    //       ledger: party,
    //     };
    //   }

    //   if (entriesType.toUpperCase() === "CREDIT") {
    //     if (isCustomer && type === "BILL OF SUPPLY") return null;
    //     if (isVendor && (type === "Purchase Return" || type === "Payment"))
    //       return null;

    //     entryMatchCriteria = {
    //       account: "Cr",
    //       credit: { $gt: 0 },
    //       ledger: party,
    //     };
    //   }

    //   // Apply the constructed entry match criteria to the query
    //   if (subLedgerId) {
    //     query.entries = {
    //         $elemMatch: {
    //             ...entryMatchCriteria,
    //             ledger: subLedgerId
    //         }
    //     };
    // }
    //   return query; // Return the updated query
    // };

    const applyDateFilter = (query) => {
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
                new Date(parsedEndDate.getTime() + 86400000), // for lessthen and euql to
              ],
            },
          ],
        };
      }
      return query;
    };

    const applySubLedgerFilter = (query) => {
      if (subLedgerId) {
        query["entries"] = {
          ...query["entries"],
          $elemMatch: { ledger: subLedgerId },
        };
      }
      return query;
    };

    const applyAmountFilter = (query) => {
      if (amountGreater || amountLess) {
        query.$or = [
          {
            $expr: {
              $and: [
                amountGreater
                  ? {
                      $gte: [
                        { $toDouble: "$totalamount" },
                        Number(amountGreater),
                      ],
                    }
                  : {},
                amountLess
                  ? {
                      $lte: [{ $toDouble: "$totalamount" }, Number(amountLess)],
                    }
                  : {},
              ],
            },
          },
          {
            $expr: {
              $and: [
                amountGreater
                  ? {
                      $gte: [
                        { $toDouble: "$totalAmount" },
                        Number(amountGreater),
                      ],
                    }
                  : {},
                amountLess
                  ? {
                      $lte: [{ $toDouble: "$totalAmount" }, Number(amountLess)],
                    }
                  : {},
              ],
            },
          },
        ];
      }
      return query;
    };

    const applyNarrationFilter = (query, type) => {
      if (!narration) return query;

      const searchRegex = new RegExp(narration, "i");

      if (type === "BILL OF SUPPLY") {
        query["remark"] = { $regex: searchRegex, $ne: "" };
      } else if (
        ["Retail Purchase", "Sales Return", "Purchase Return"].includes(type)
      ) {
        query["remarks"] = { $regex: searchRegex, $ne: "" };
      } else if (
        [
          "Receipt",
          "Payment",
          "Journal",
          "GST Expense",
          "Credit Note wo Stock",
          "Debit Note wo Stock",
        ].includes(type)
      ) {
        query["narration"] = { $regex: searchRegex, $ne: "" };
      }

      return query;
    };

    let combinedResults = [];
    for (const { model, field, type, voucherType } of groupQueries) {
      let query = { companyCode, [field]: party };

      query = applyDateFilter(query);
      query = applySubLedgerFilter(query);
      query = applyEntriesTypeFilter(query, type);
      if (!query) continue;
      query = applyAmountFilter(query);
      query = applyNarrationFilter(query, type);

      const records = await model.find(query).lean();

      combinedResults = combinedResults.concat(
        records.map((record) => ({
          ...record,
          type: type,
          voucherType: voucherType,
        }))
      );
    }

    console.log(combinedResults.length + " entries found.");
    res.status(200).json({
      message: "Ledger entries fetched successfully",
      data: combinedResults,
    });
  } catch (error) {
    console.error("Error fetching ledger entries:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// ////Final Code Without the Fillter
// const getLedgerPeriodicSummary = async (req, res) => {
//   const { party, companyCode } = req.params;
//   const { startDate, endDate } = req.query;

//   if (!party || !companyCode) {
//     return res.status(400).json({ message: "Missing required parameters" });
//   }

//   // Parse and format startDate and endDate
//   const parsedStartDate = new Date(startDate);
//   const parsedEndDate = new Date(endDate);

//   // Validate date range
//   if (
//     isNaN(parsedStartDate.getTime()) ||
//     isNaN(parsedEndDate.getTime()) ||
//     parsedStartDate > parsedEndDate
//   ) {
//     return res.status(400).json({ message: "Invalid date range" });
//   }

//   const ledger = await Ledger.findById(party).populate("ledgerGroup").exec();
//   if (!ledger || !ledger.ledgerGroup?.name) {
//     return res
//       .status(404)
//       .json({ message: "Ledger or Ledger Group not found" });
//   }

//   const ledgerGroupName = ledger.ledgerGroup.name;
//   const summary = {};

//   const monthNames = [
//     "Jan",
//     "Feb",
//     "Mar",
//     "Apr",
//     "May",
//     "Jun",
//     "Jul",
//     "Aug",
//     "Sep",
//     "Oct",
//     "Nov",
//     "Dec",
//   ];

//   const models = [
//     { model: Journal, field: "entries.ledger", type: "t" },
//     { model: GstExpense, field: "entries.ledger", type: "t" },
//     { model: CreditNoteWo, field: "entries.ledger", type: "t" },
//     { model: DebitNoteWo, field: "entries.ledger", type: "t" },
//   ];

//   if (ledgerGroupName === "Customers") {
//     models.unshift(
//       { model: SalesEntry, field: "party", type: "debit" },
//       { model: SalesReturn, field: "ledger", type: "credit" },
//       { model: Receipt, field: "entries.ledger", type: "credit" }
//     );
//   } else if (ledgerGroupName === "VENDOR") {
//     models.unshift(
//       { model: Purchase, field: "ledger", type: "credit" },
//       { model: PurchaseReturn, field: "ledger", type: "debit" },
//       { model: Payment, field: "entries.ledger", type: "debit" }
//     );
//   }

//   const applyDateFilter = (query) => {
//     if (parsedStartDate && parsedEndDate) {
//       query.$expr = {
//         $and: [
//           {
//             $gte: [
//               {
//                 $dateFromString: {
//                   dateString: "$date",
//                   format: "%d/%m/%Y",
//                 },
//               },
//               parsedStartDate,
//             ],
//           },
//           {
//             $lte: [
//               {
//                 $dateFromString: {
//                   dateString: "$date",
//                   format: "%d/%m/%Y",
//                 },
//               },
//               parsedEndDate,
//             ],
//           },
//         ],
//       };
//     }
//     return query;
//   };

//   try {
//     const results = await Promise.all(
//       models.map(({ model, field }) => {
//         const query = {
//           companyCode,
//           [field]: party,
//         };
//         const dateFilteredQuery = applyDateFilter(query); // Apply the date filter
//         return model.find(dateFilteredQuery).lean();
//       })
//     );

//     // Initialize summary for each month in the date range
// const monthStart = new Date(
//   parsedStartDate.getFullYear(),
//   parsedStartDate.getMonth(),
//   1
// );
// const monthEnd = new Date(
//   parsedEndDate.getFullYear(),
//   parsedEndDate.getMonth() + 1,
//   0
// );
// const currentDate = new Date(monthStart);

// while (currentDate <= monthEnd) {
//   const year = currentDate.getFullYear();
//   const month = currentDate.getMonth();

//   const monthKey = `${monthNames[month]}-${String(year).slice(-2)}`;

//   const startDate = new Date(year, month, 1);
//   const endDate = new Date(year, month + 1, 0); // Last day of the month

//   summary[monthKey] = {
//     name: monthKey,
//     totalDebit: 0,
//     totalCredit: 0,
//     startDate: startDate.toLocaleDateString("en-GB"),
//     endDate: endDate.toLocaleDateString("en-GB"),
//   };

//   currentDate.setMonth(currentDate.getMonth() + 1);
// }

// results.forEach((entries, i) => {
//   entries.forEach((entry) => {
//     let entryType = models[i].type;

//     if (entryType == "t") {
//       if (entry.entries) {
//         entry.entries.forEach((subEntry) => {
//           if (subEntry.ledger.equals(party)) {
//             const amount = Number(subEntry.debit || subEntry.credit || 0);
//             entryType = subEntry.account === "Dr" ? "debit" : "credit";

//             const dateParts = entry.date.split("/");
//             const monthIndex = parseInt(dateParts[1], 10) - 1;
//             const yearShort = dateParts[2].slice(-2);
//             const key = `${monthNames[monthIndex]}-${yearShort}`;

//             if (summary[key]) {
//               if (entryType === "debit") {
//                 summary[key].totalDebit += amount;
//               } else {
//                 summary[key].totalCredit += amount;
//               }
//             }
//           }
//         });
//       }
//     } else {
//       const amount = Number(entry.totalamount || entry.totalAmount || 0);
//       const dateParts = entry.date.split("/");
//       const monthIndex = parseInt(dateParts[1], 10) - 1; // Month is 0-indexed
//       const yearShort = dateParts[2].slice(-2); // Get the last two digits of the year
//       const key = `${monthNames[monthIndex]}-${yearShort}`;

//       if (summary[key]) {
//         if (entryType === "debit") {
//           summary[key].totalDebit += amount;
//         } else if (entryType === "credit") {
//           summary[key].totalCredit += amount;
//         }
//       }
//     }
//   });
// });

//     // // Log the final summary after processing all entries
//     // console.log("Final Summary:", summary);

//     // Convert summary to an array and sort it by month
//     const sortedSummary = Object.values(summary).sort((a, b) => {
//       const [monthA, yearA] = a.name.split("-");
//       const [monthB, yearB] = b.name.split("-");
//       const monthIndexA = monthNames.indexOf(monthA);
//       const monthIndexB = monthNames.indexOf(monthB);

//       // Compare years first, then months
//       return yearA - yearB || monthIndexA - monthIndexB;
//     });

//     res.status(200).json({
//       message: "Ledger monthly summary fetched successfully",
//       data: sortedSummary,
//     });
//   } catch (error) {
//     console.error("Error fetching ledger monthly summary:", error);
//     res.status(500).json({ message: "Internal server error." });
//   }
// };

// const getLedgerPeriodicSummary = async (req, res) => {
//   const { party, companyCode } = req.params;
//   const { startDate, endDate, type } = req.query; // Accept 'type' as a query parameter

//   if (!party || !companyCode) {
//     return res.status(400).json({ message: "Missing required parameters" });
//   }

//   // Parse and validate start and end dates
//   const parsedStartDate = new Date(startDate);
//   const parsedEndDate = new Date(endDate);

//   if (
//     isNaN(parsedStartDate.getTime()) ||
//     isNaN(parsedEndDate.getTime()) ||
//     parsedStartDate > parsedEndDate
//   ) {
//     return res.status(400).json({ message: "Invalid date range" });
//   }

//   const ledger = await Ledger.findById(party).populate("ledgerGroup").exec();
//   if (!ledger || !ledger.ledgerGroup?.name) {
//     return res
//       .status(404)
//       .json({ message: "Ledger or Ledger Group not found" });
//   }

//   const ledgerGroupName = ledger.ledgerGroup.name;
//   const summary = {};

//   const monthNames = [
//     "Jan",
//     "Feb",
//     "Mar",
//     "Apr",
//     "May",
//     "Jun",
//     "Jul",
//     "Aug",
//     "Sep",
//     "Oct",
//     "Nov",
//     "Dec",
//   ];

//   const models = [
//     { model: Journal, field: "entries.ledger", type: "t" },
//     { model: GstExpense, field: "entries.ledger", type: "t" },
//     { model: CreditNoteWo, field: "entries.ledger", type: "t" },
//     { model: DebitNoteWo, field: "entries.ledger", type: "t" },
//   ];

//   if (ledgerGroupName === "Customers") {
//     models.unshift(
//       { model: SalesEntry, field: "party", type: "debit" },
//       { model: SalesReturn, field: "ledger", type: "credit" },
//       { model: Receipt, field: "entries.ledger", type: "credit" }
//     );
//   } else if (ledgerGroupName === "VENDOR") {
//     models.unshift(
//       { model: Purchase, field: "ledger", type: "credit" },
//       { model: PurchaseReturn, field: "ledger", type: "debit" },
//       { model: Payment, field: "entries.ledger", type: "debit" }
//     );
//   }

//   const applyDateFilter = (query) => {
//     if (parsedStartDate && parsedEndDate) {
//       query.$expr = {
//         $and: [
//           {
//             $gte: [
//               {
//                 $dateFromString: {
//                   dateString: "$date",
//                   format: "%d/%m/%Y",
//                 },
//               },
//               parsedStartDate,
//             ],
//           },
//           {
//             $lte: [
//               {
//                 $dateFromString: {
//                   dateString: "$date",
//                   format: "%d/%m/%Y",
//                 },
//               },
//               parsedEndDate,
//             ],
//           },
//         ],
//       };
//     }
//     return query;
//   };

//   try {
//     const results = await Promise.all(
//       models.map(({ model, field }) => {
//         const query = {
//           companyCode,
//           [field]: party,
//         };
//         const dateFilteredQuery = applyDateFilter(query);
//         return model.find(dateFilteredQuery).lean();
//       })
//     );

//     if (type === "Daily") {
//       // === DAILY SUMMARY LOGIC ===
//       const currentDate = new Date(parsedStartDate);

//       while (currentDate <= parsedEndDate) {
//         const day = String(currentDate.getDate()).padStart(2, "0");
//         const month = monthNames[currentDate.getMonth()];
//         const yearShort = String(currentDate.getFullYear()).slice(-2);
//         const dateKey = `${day}-${month}-${yearShort}`;

//         summary[dateKey] = {
//           name: dateKey,
//           totalDebit: 0,
//           totalCredit: 0,
//           startDate: currentDate.toLocaleDateString("en-GB"),
//           endDate: currentDate.toLocaleDateString("en-GB"),
//         };

//         currentDate.setDate(currentDate.getDate() + 1);
//       }

//       results.forEach((entries, i) => {
//         entries.forEach((entry) => {
//           let entryType = models[i].type;

//           if (entryType == "t") {
//             if (entry.entries) {
//               entry.entries.forEach((subEntry) => {
//                 if (subEntry.ledger.equals(party)) {
//                   const amount = Number(subEntry.debit || subEntry.credit || 0);
//                   entryType = subEntry.account === "Dr" ? "debit" : "credit";

//                   const dateParts = entry.date.split("/");
//                   const dateKey = `${dateParts[0]}-${monthNames[parseInt(dateParts[1], 10) - 1]}-${dateParts[2].slice(-2)}`;

//                   if (summary[dateKey]) {
//                     if (entryType === "debit") {
//                       summary[dateKey].totalDebit += amount;
//                     } else {
//                       summary[dateKey].totalCredit += amount;
//                     }
//                   }
//                 }
//               });
//             }
//           } else {
//             const amount = Number(entry.totalamount || entry.totalAmount || 0);
//             const dateParts = entry.date.split("/");
//             const dateKey = `${dateParts[0]}-${monthNames[parseInt(dateParts[1], 10) - 1]}-${dateParts[2].slice(-2)}`;

//             if (summary[dateKey]) {
//               if (entryType === "debit") {
//                 summary[dateKey].totalDebit += amount;
//               } else if (entryType === "credit") {
//                 summary[dateKey].totalCredit += amount;
//               }
//             }
//           }
//         });
//       });

//     } else {
//       // === MONTHLY SUMMARY LOGIC ===
//       const monthStart = new Date(
//         parsedStartDate.getFullYear(),
//         parsedStartDate.getMonth(),
//         1
//       );
//       const monthEnd = new Date(
//         parsedEndDate.getFullYear(),
//         parsedEndDate.getMonth() + 1,
//         0
//       );
//       const currentDate = new Date(monthStart);
//       while (currentDate <= monthEnd) {
//         const year = currentDate.getFullYear();
//         const month = currentDate.getMonth();

//         const monthKey = `${monthNames[month]}-${String(year).slice(-2)}`;

//         const startDate = new Date(year, month, 1);
//         const endDate = new Date(year, month + 1, 0); // Last day of the month

//         summary[monthKey] = {
//           name: monthKey,
//           totalDebit: 0,
//           totalCredit: 0,
//           startDate: startDate.toLocaleDateString("en-GB"),
//           endDate: endDate.toLocaleDateString("en-GB"),
//         };

//         currentDate.setMonth(currentDate.getMonth() + 1);
//       }

//       results.forEach((entries, i) => {
//         entries.forEach((entry) => {
//           let entryType = models[i].type;

//           if (entryType == "t") {
//             if (entry.entries) {
//               entry.entries.forEach((subEntry) => {
//                 if (subEntry.ledger.equals(party)) {
//                   const amount = Number(subEntry.debit || subEntry.credit || 0);
//                   entryType = subEntry.account === "Dr" ? "debit" : "credit";

//                   const dateParts = entry.date.split("/");
//                   const monthIndex = parseInt(dateParts[1], 10) - 1;
//                   const yearShort = dateParts[2].slice(-2);
//                   const key = `${monthNames[monthIndex]}-${yearShort}`;

//                   if (summary[key]) {
//                     if (entryType === "debit") {
//                       summary[key].totalDebit += amount;
//                     } else {
//                       summary[key].totalCredit += amount;
//                     }
//                   }
//                 }
//               });
//             }
//           } else {
//             const amount = Number(entry.totalamount || entry.totalAmount || 0);
//             const dateParts = entry.date.split("/");
//             const monthIndex = parseInt(dateParts[1], 10) - 1; // Month is 0-indexed
//             const yearShort = dateParts[2].slice(-2); // Get the last two digits of the year
//             const key = `${monthNames[monthIndex]}-${yearShort}`;

//             if (summary[key]) {
//               if (entryType === "debit") {
//                 summary[key].totalDebit += amount;
//               } else if (entryType === "credit") {
//                 summary[key].totalCredit += amount;
//               }
//             }
//           }
//         });
//       });
//     }

//     // Convert summary to array and sort
//     const sortedSummary = Object.values(summary).sort((a, b) => {
//       const [partA, yearA] = a.name.split("-");
//       const [partB, yearB] = b.name.split("-");
//       return yearA - yearB || monthNames.indexOf(partA) - monthNames.indexOf(partB);
//     });

//     console.log(sortedSummary.length);

//     res.status(200).json({
//       message: `Ledger ${type === "daily" ? "daily" : "monthly"} summary fetched successfully`,
//       data: sortedSummary,
//     });

//   } catch (error) {
//     console.error("Error fetching ledger summary:", error);
//     res.status(500).json({ message: "Internal server error." });
//   }
// };

const getLedgerPeriodicSummary = async (req, res) => {
  const { party, companyCode } = req.params;
  const { startDate, endDate, type } = req.query; // Accept 'type' as a query parameter

  if (!party || !companyCode) {
    return res.status(400).json({ message: "Missing required parameters" });
  }

  // Parse and validate start and end dates
  const parsedStartDate = new Date(startDate);
  const parsedEndDate = new Date(endDate);

  if (
    isNaN(parsedStartDate.getTime()) ||
    isNaN(parsedEndDate.getTime()) ||
    parsedStartDate > parsedEndDate
  ) {
    return res.status(400).json({ message: "Invalid date range" });
  }

  const ledger = await Ledger.findById(party).populate("ledgerGroup").exec();
  if (!ledger || !ledger.ledgerGroup?.name) {
    return res
      .status(404)
      .json({ message: "Ledger or Ledger Group not found" });
  }

  const ledgerGroupName = ledger.ledgerGroup.name;
  const summary = {};
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const models = [
    { model: Journal, field: "entries.ledger", type: "t" },
    { model: GstExpense, field: "entries.ledger", type: "t" },
    { model: CreditNoteWo, field: "entries.ledger", type: "t" },
    { model: DebitNoteWo, field: "entries.ledger", type: "t" },
  ];

  if (ledgerGroupName === "Customers") {
    models.unshift(
      { model: SalesEntry, field: "party", type: "debit" },
      { model: SalesReturn, field: "ledger", type: "credit" },
      { model: Receipt, field: "entries.ledger", type: "credit" }
    );
  } else if (ledgerGroupName === "VENDOR") {
    models.unshift(
      { model: Purchase, field: "ledger", type: "credit" },
      { model: PurchaseReturn, field: "ledger", type: "debit" },
      { model: Payment, field: "entries.ledger", type: "debit" }
    );
  }

  const applyDateFilter = (query) => {
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
    return query;
  };

  const initializeSummary = (type) => {
    if (type === "Daily") {
      const currentDate = new Date(parsedStartDate);
      while (currentDate <= parsedEndDate) {
        const day = String(currentDate.getDate()).padStart(2, "0");
        const month = String(currentDate.getMonth() + 1).padStart(2, "0");
        const yearShort = String(currentDate.getFullYear()).slice(-2);
        const dateKey = `${day}-${month}-${yearShort}`;

        summary[dateKey] = {
          name: dateKey,
          totalDebit: 0,
          totalCredit: 0,
          startDate: currentDate.toLocaleDateString("en-GB"),
          endDate: currentDate.toLocaleDateString("en-GB"),
        };

        currentDate.setDate(currentDate.getDate() + 1);
      }
    } else if (type === "Quarterly") {
      const quarterNames = ["Jan-Mar", "Apr-Jun", "Jul-Sep", "Oct-Dec"];
      let startYear = parsedStartDate.getFullYear();
      let endYear = parsedEndDate.getFullYear();

      for (let year = startYear; year <= endYear; year++) {
        for (let i = 0; i < 4; i++) {
          const startMonth = i * 3;
          const endMonth = startMonth + 2;

          const startDate = new Date(year, startMonth, 1);
          const endDate = new Date(year, endMonth + 1, 0);

          if (endDate < parsedStartDate || startDate > parsedEndDate) continue;

          const quarterKey = `${quarterNames[i]}`;
          summary[quarterKey] = {
            name: quarterKey,
            totalDebit: 0,
            totalCredit: 0,
            startDate: startDate.toLocaleDateString("en-GB"),
            endDate: endDate.toLocaleDateString("en-GB"),
          };
        }
      }
    } else {
      const monthStart = new Date(
        parsedStartDate.getFullYear(),
        parsedStartDate.getMonth(),
        1
      );
      const monthEnd = new Date(
        parsedEndDate.getFullYear(),
        parsedEndDate.getMonth() + 1,
        0
      );
      const currentDate = new Date(monthStart);
      while (currentDate <= monthEnd) {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const monthKey = `${monthNames[month]}-${String(year).slice(-2)}`;

        summary[monthKey] = {
          name: monthKey,
          totalDebit: 0,
          totalCredit: 0,
          startDate: new Date(year, month, 1).toLocaleDateString("en-GB"),
          endDate: new Date(year, month + 1, 0).toLocaleDateString("en-GB"),
        };

        currentDate.setMonth(currentDate.getMonth() + 1);
      }
    }
  };

  const processEntries = (entries, entryType) => {
    const getQuarter = (month) => {
      if (month >= 1 && month <= 3) return "Jan-Mar";
      if (month >= 4 && month <= 6) return "Apr-Jun";
      if (month >= 7 && month <= 9) return "Jul-Sep";
      return "Oct-Dec";
    };
    entries.forEach((entry) => {
      if (entryType === "t" && entry.entries) {
        entry.entries.forEach((subEntry) => {
          if (subEntry.ledger.equals(party)) {
            const amount = Number(subEntry.debit || subEntry.credit || 0);
            const transactionType =
              subEntry.account === "Dr" ? "debit" : "credit"; // Renamed 'type' to 'transactionType'

            const dateParts = entry.date.split("/");
            const month = parseInt(dateParts[1], 10);

            const dateKey =
              type === "Daily"
                ? `${String(dateParts[0]).padStart(2, "0")}-${String(
                    dateParts[1]
                  ).padStart(2, "0")}-${dateParts[2].slice(-2)}`
                : type === "Quarterly"
                ? `${getQuarter(month)}`
                : `${
                    monthNames[parseInt(dateParts[1], 10) - 1]
                  }-${dateParts[2].slice(-2)}`;

            if (summary[dateKey]) {
              if (transactionType === "debit") {
                summary[dateKey].totalDebit += amount;
              } else {
                summary[dateKey].totalCredit += amount;
              }
            }
          }
        });
      } else {
        const amount = Number(entry.totalamount || entry.totalAmount || 0);
        const dateParts = entry.date.split("/");
        const month = parseInt(dateParts[1], 10);

        const dateKey =
          type === "Daily"
            ? `${String(dateParts[0]).padStart(2, "0")}-${String(
                dateParts[1]
              ).padStart(2, "0")}-${dateParts[2].slice(-2)}`
            : type === "Quarterly"
            ? `${getQuarter(month)}`
            : `${
                monthNames[parseInt(dateParts[1], 10) - 1]
              }-${dateParts[2].slice(-2)}`;

        if (summary[dateKey]) {
          if (entryType === "debit") {
            summary[dateKey].totalDebit += amount;
          } else if (entryType === "credit") {
            summary[dateKey].totalCredit += amount;
          }
        }
      }
    });
  };

  try {
    const results = await Promise.all(
      models.map(({ model, field }) => {
        const query = {
          companyCode,
          [field]: party,
        };
        const dateFilteredQuery = applyDateFilter(query);
        return model.find(dateFilteredQuery).lean();
      })
    );

    // Initialize the summary for the specified type (Daily or Monthly)
    initializeSummary(type);

    // Process each model's results
    results.forEach((entries, i) => {
      const entryType = models[i].type;
      processEntries(entries, entryType);
    });

    // Convert summary to array and sort
    const sortedSummary = Object.values(summary).sort((a, b) => {
      const extractYear = (name) =>
        parseInt(name.match(/\d{2,4}$/)?.[0] || "0", 10);
      const extractMonthOrQuarter = (name) => {
        if (name.includes("-")) {
          const [part] = name.split("-");
          if (["Jan-Mar", "Apr-Jun", "Jul-Sep", "Oct-Dec"].includes(part)) {
            return ["Jan-Mar", "Apr-Jun", "Jul-Sep", "Oct-Dec"].indexOf(part);
          }
          return monthNames.indexOf(part);
        }
        return NaN;
      };

      const yearA = extractYear(a.name);
      const yearB = extractYear(b.name);
      const partA = extractMonthOrQuarter(a.name);
      const partB = extractMonthOrQuarter(b.name);

      return yearA - yearB || partA - partB;
    });

    res.status(200).json({
      message: `Ledger ${
        type === "Daily" ? "daily" : "monthly"
      } summary fetched successfully`,
      data: sortedSummary,
    });
  } catch (error) {
    console.error("Error fetching ledger summary:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

module.exports = {
  getLedgerEntries,
  getLedgerPeriodicSummary,
};

