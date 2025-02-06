const SalesBillModel = require("../models/sales_bills_model");
const PurchaseBillModel = require("../models/purchase_bills_models");
const Sales = require("../models/sales_entry_model");
const SalesReturn = require("../models/sales_return_model");
const Purchase = require("../models/purchase_model");
const PurchaseReturn = require("../models/purchase_return_model");
const Journal = require("../models/journal_voucher_model");
const GSTExpense = require("../models/gst_expense_voucher_model");
const CreditNote = require("../models/credit_note_voucher_model");
const DebitNote = require("../models/debit_note_voucher_model");
const Receipt = require("../models/receipt_voucher_model");
const Payment = require("../models/payment_model");
const Ledger = require("../models/ledger_model");
const Item = require("../models/items_model");
const ItemBrand = require("../models/item_brand_model");
const ItemGroup = require("../models/item_group_model");

const moment = require("moment");

const LedgerDeshBoardController = {
  getPendingBills: async (req, res) => {
    try {
      const { ledgerId, companyCode } = req.params;

      // Step 1: Find the ledger document and populate the ledgerGroup field
      const ledger = await Ledger.findById(ledgerId)
        .populate("ledgerGroup")
        .exec();

      if (!ledger) {
        return res.status(404).json({ message: "Ledger not found." });
      }

      // Step 2: Get the ledger group name directly from the populated field
      const ledgerGroupName = ledger.ledgerGroup?.name;

      if (!ledgerGroupName) {
        return res
          .status(404)
          .json({ message: "Ledger group not found or invalid." });
      }

      // Step 3: Query the appropriate collection based on ledgerGroupName
      let pendingBills;
      if (ledgerGroupName == "VENDOR") {
        pendingBills = await PurchaseBillModel.find({
          ledger: ledgerId,
          companyCode: companyCode,
          dueAmount: { $gt: 0 },
        });
      } else if (ledgerGroupName == "Customers") {
        pendingBills = await SalesBillModel.find({
          ledger: ledgerId,
          companyCode: companyCode,
          dueAmount: { $gt: 0 },
        });
      } else {
        return res.status(400).json({ message: "Invalid ledger group name." });
      }

      // Step 4: Return the pending bills
      res.status(200).json({
        message: "Pending bills fetched successfully.",
        data: pendingBills,
      });
    } catch (error) {
      console.error("Error fetching pending bills:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  },

  getRecentTransactions: async (req, res) => {
    try {
      const { ledgerId, companyCode } = req.params;

      // Step 1: Find the ledger document and populate the ledgerGroup field
      const ledger = await Ledger.findById(ledgerId)
        .populate("ledgerGroup")
        .exec();

      if (!ledger) {
        return res.status(404).json({ message: "Ledger not found." });
      }

      const ledgerGroupName = ledger.ledgerGroup?.name;

      if (!ledgerGroupName) {
        return res
          .status(404)
          .json({ message: "Ledger group not found or invalid." });
      }

      // Step 2: Define queries based on ledgerGroupName
      const queries = [];
      if (ledgerGroupName === "Customers") {
        queries.push(
          Sales.find({ party: ledgerId, companyCode })
            .lean()
            .then((records) => records.map((r) => ({ ...r, type: "Sales" }))),
          SalesReturn.find({ ledger: ledgerId, companyCode })
            .lean()
            .then((records) =>
              records.map((r) => ({ ...r, type: "SalesReturn" }))
            ),
          Receipt.find({ "entries.ledger": ledgerId, companyCode })
            .lean()
            .then((records) => records.map((r) => ({ ...r, type: "Receipt" }))),
          Journal.find({ "entries.ledger": ledgerId, companyCode })
            .lean()
            .then((records) => records.map((r) => ({ ...r, type: "Journal" }))),
          GSTExpense.find({ "entries.ledger": ledgerId, companyCode })
            .lean()
            .then((records) =>
              records.map((r) => ({ ...r, type: "GSTExpense" }))
            ),
          CreditNote.find({ "entries.ledger": ledgerId, companyCode })
            .lean()
            .then((records) =>
              records.map((r) => ({ ...r, type: "CreditNote" }))
            ),
          DebitNote.find({ "entries.ledger": ledgerId, companyCode })
            .lean()
            .then((records) =>
              records.map((r) => ({ ...r, type: "DebitNote" }))
            )
        );
      } else if (ledgerGroupName === "VENDOR") {
        queries.push(
          Purchase.find({ ledger: ledgerId, companyCode })
            .lean()
            .then((records) =>
              records.map((r) => ({ ...r, type: "Purchase" }))
            ),
          PurchaseReturn.find({ ledger: ledgerId, companyCode })
            .lean()
            .then((records) =>
              records.map((r) => ({ ...r, type: "PurchaseReturn" }))
            ),
          Payment.find({ "entries.ledger": ledgerId, companyCode })
            .lean()
            .then((records) => records.map((r) => ({ ...r, type: "Payment" }))),
          Journal.find({ "entries.ledger": ledgerId, companyCode })
            .lean()
            .then((records) => records.map((r) => ({ ...r, type: "Journal" }))),
          GSTExpense.find({ "entries.ledger": ledgerId, companyCode })
            .lean()
            .then((records) =>
              records.map((r) => ({ ...r, type: "GSTExpense" }))
            ),
          CreditNote.find({ "entries.ledger": ledgerId, companyCode })
            .lean()
            .then((records) =>
              records.map((r) => ({ ...r, type: "CreditNote" }))
            ),
          DebitNote.find({ "entries.ledger": ledgerId, companyCode })
            .lean()
            .then((records) =>
              records.map((r) => ({ ...r, type: "DebitNote" }))
            )
        );
      } else {
        return res.status(400).json({ message: "Invalid ledger group name." });
      }

      // Step 3: Fetch all transactions in parallel
      const results = await Promise.all(queries);

      // Step 4: Merge all results into a single array
      const transactions = results.flat();

      // Step 5: Sort transactions by date (descending order)
      transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

      // Step 6: Return the response
      res.status(200).json({
        message: "Recent transactions fetched successfully.",
        data: transactions,
      });
    } catch (error) {
      console.error("Error fetching recent transactions:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  },

  getSalesPurchaseSummary: async (req, res) => {
    try {
      const { ledgerId, companyCode } = req.params;
      const { months } = req.query;

      // Set the duration of 1 year
      const endDate = moment(); // Today's date
      // const startDate = moment().subtract(1, "year");
      const startDate = moment().subtract(months || 12, "months");

      // Fetch the ledger and populate the ledger group
      const ledger = await Ledger.findById(ledgerId)
        .populate("ledgerGroup")
        .exec();
      if (!ledger) {
        return res.status(404).json({ message: "Ledger not found." });
      }

      const ledgerGroupName = ledger.ledgerGroup?.name;
      if (!ledgerGroupName) {
        return res
          .status(404)
          .json({ message: "Ledger group not found or invalid." });
      }

      // Define common variables
      const parsedStartDate = startDate.toDate();
      const parsedEndDate = endDate.toDate();

      const dateQuery = {
        $expr: {
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
        },
      };

      const queryMap = {
        Customers: [
          { model: Sales, type: "Sales", field: "party" },
          { model: SalesReturn, type: "SalesReturn", field: "ledger" },
          { model: Receipt, type: "Receipt", field: "entries.ledger" },
        ],
        VENDOR: [
          { model: Purchase, type: "Purchase", field: "ledger" },
          { model: PurchaseReturn, type: "PurchaseReturn", field: "ledger" },
          { model: Payment, type: "Payment", field: "entries.ledger" },
        ],
      };

      const groupQueries = queryMap[ledgerGroupName];
      if (!groupQueries) {
        return res.status(400).json({ message: "Invalid ledger group name." });
      }

      // Execute all queries dynamically
      const queries = groupQueries.map(({ model, type, field }) =>
        model
          .find({ [field]: ledgerId, companyCode, ...dateQuery })
          .lean()
          .then((records) =>
            records.map((record) => ({ ...record, voucherType: type }))
          )
      );

      const results = await Promise.all(queries);
      const allRecords = results.flat();

      // Aggregate data by month
      const monthlySummary = {};

      allRecords.forEach((record) => {
        if (!record.date) return;
        const monthKey = moment(record.date, "DD/MM/YYYY").isValid()
          ? moment(record.date, "DD/MM/YYYY").format("MMMM-YY")
          : "Unknown"; // Handle invalid dates

        if (!monthlySummary[monthKey]) {
          monthlySummary[monthKey] = {
            month: monthKey,
            sales: 0,
            return: 0,
            receipt: 0,
            payment: 0,
          };
        }

        const { voucherType, totalamount, totalAmount } = record;
        const amount = parseFloat(totalamount || totalAmount) || 0;

        if (["Sales", "Purchase"].includes(voucherType)) {
          monthlySummary[monthKey].sales += amount;
        } else if (["SalesReturn", "PurchaseReturn"].includes(voucherType)) {
          monthlySummary[monthKey].return += amount;
        } else if (voucherType === "Receipt") {
          monthlySummary[monthKey].receipt += amount;
        } else if (voucherType === "Payment") {
          monthlySummary[monthKey].payment += amount;
        }
      });

      // Convert the summary object into an array and sort by month (most recent first)
      const summaryArray = Object.values(monthlySummary).sort(
        (a, b) => moment(b.month, "MMMM-YY") - moment(a.month, "MMMM-YY")
      );

      // Send the response
      res.status(200).json({
        message: "Sales/Purchase summary fetched successfully.",
        data: summaryArray,
      });
    } catch (error) {
      console.error("Error fetching sales/purchase summary:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  },

  getItemSummary: async (req, res) => {
    try {
      const { ledgerId, companyCode } = req.params;
      const { filterType, months } = req.query;

      // Set date range
      const endDate = moment(); // Today

      const startDate = moment().subtract(months || 12, "months");

      // Fetch ledger and its group
      const ledger = await Ledger.findById(ledgerId)
        .populate("ledgerGroup")
        .exec();
      if (!ledger) {
        return res.status(404).json({ message: "Ledger not found." });
      }

      const ledgerGroupName = ledger.ledgerGroup?.name;
      if (!ledgerGroupName) {
        return res.status(404).json({ message: "Ledger group not found." });
      }

      // Define date query
      const dateQuery = {
        $expr: {
          $and: [
            {
              $gte: [
                {
                  $dateFromString: { dateString: "$date", format: "%d/%m/%Y" },
                },
                startDate.toDate(),
              ],
            },
            {
              $lte: [
                {
                  $dateFromString: { dateString: "$date", format: "%d/%m/%Y" },
                },
                endDate.toDate(),
              ],
            },
          ],
        },
      };

      // Map ledger group to models
      const queryMap = {
        Customers: [{ model: Sales, field: "party" }],
        VENDOR: [{ model: Purchase, field: "ledger" }],
      };

      const queries = queryMap[ledgerGroupName];
      if (!queries) {
        return res.status(400).json({ message: "Invalid ledger group name." });
      }

      // Fetch data from respective collections
      const itemDataPromises = queries.map(({ model, field }) =>
        model
          .find({ [field]: ledgerId, companyCode, ...dateQuery })
          .select("entries")
          .lean()
      );

      const records = (await Promise.all(itemDataPromises)).flat();

      // Extract all unique item IDs from records
      const itemIds = new Set();
      records.forEach((record) => {
        (record.entries || []).forEach((entry) => {
          if (entry.itemName) itemIds.add(entry.itemName);
        });
      });

      // Fetch all required items in a single query
      const items = await Item.find({ _id: { $in: Array.from(itemIds) } })
        .select("itemGroup itemBrand itemName")
        .lean();

      // Map item data by itemId for quick lookup
      const itemMap = {};
      const itemGroupIds = new Set();
      const itemBrandIds = new Set();
      items.forEach((item) => {
        itemMap[item._id] = item;
        if (item.itemGroup) itemGroupIds.add(item.itemGroup);
        if (item.itemBrand) itemBrandIds.add(item.itemBrand);
      });

      // Fetch all item groups and brands in bulk
      const itemGroups = await ItemGroup.find({
        _id: { $in: Array.from(itemGroupIds) },
      })
        .select("name")
        .lean();
      const itemBrands = await ItemBrand.find({
        _id: { $in: Array.from(itemBrandIds) },
      })
        .select("name")
        .lean();

      // Map item groups and brands for quick lookup
      const itemGroupMap = {};
      itemGroups.forEach((group) => {
        itemGroupMap[group._id] = group.name;
      });

      const itemBrandMap = {};
      itemBrands.forEach((brand) => {
        itemBrandMap[brand._id] = brand.name;
      });

      // Aggregate data
      const itemSummary = {};
      for (const record of records) {
        for (const entry of record.entries || []) {
          const { itemName, qty, amount } = entry;

          if (!itemName || !itemMap[itemName]) {
            // console.warn("Missing or invalid itemId in entry:", entry);
            continue;
          }

          const item = itemMap[itemName];
          if (!itemSummary[itemName]) {
            itemSummary[itemName] = {
              itemId: item._id,
              name: item.itemName,
              itemGroupId: item.itemGroup,
              itemGroupName: itemGroupMap[item.itemGroup] || "Unknown Group",
              itemBrandId: item.itemBrand,
              itemBrandName: itemBrandMap[item.itemBrand] || "Unknown Brand",
              qty: 0,
              amount: 0,
            };
          }

          // Accumulate qty and amount
          itemSummary[itemName].qty += parseFloat(qty || 0);
          itemSummary[itemName].amount += parseFloat(amount || 0);
        }
      }

      // Convert to array
      const summaryArray = Object.values(itemSummary).map((item) => ({
        itemId: item.itemId,
        name: item.name,
        itemGroupId: item.itemGroupId,
        itemGroupName: item.itemGroupName,
        itemBrandId: item.itemBrandId,
        itemBrandName: item.itemBrandName,
        qty: item.qty.toFixed(2),
        amount: item.amount.toFixed(2),
      }));

      // Helper function to aggregate by group or brand
      const aggregateSummary = (summaryArray, groupByField) => {
        const aggregated = {};

        for (const item of summaryArray) {
          const key = item[groupByField + "Id"]; // Use ID for uniqueness
          if (!aggregated[key]) {
            aggregated[key] = {
              name: item[groupByField + "Name"], // Change groupName to name
              qty: 0,
              amount: 0,
            };
          }
          aggregated[key].qty += parseFloat(item.qty);
          aggregated[key].amount += parseFloat(item.amount);
        }

        // Convert back to array
        return Object.keys(aggregated).map((key) => ({
          name: aggregated[key].name, // Change groupName to name
          qty: aggregated[key].qty.toFixed(2),
          amount: aggregated[key].amount.toFixed(2),
        }));
      };

      // Apply grouping based on filter type
      let groupedSummaryArray;
      if (filterType === "1") {
        groupedSummaryArray = aggregateSummary(summaryArray, "itemGroup");
      } else if (filterType === "2") {
        groupedSummaryArray = aggregateSummary(summaryArray, "itemBrand");
      } else if (filterType === "3") {
        groupedSummaryArray = summaryArray;
      } else {
        console.log("No Data");
      }

      // Send response
      res.status(200).json({
        message: "Item summary fetched successfully.",
        data: groupedSummaryArray,
      });
    } catch (error) {
      console.error("Error fetching item summary:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  },
  // getLastEntry: async (req, res) => {
  //   try {
  //     const { ledgerId, companyCode } = req.params;

  //     // Step 1: Fetch the ledger and its group
  //     const ledger = await Ledger.findById(ledgerId)
  //       .populate("ledgerGroup")
  //       .exec();

  //     if (!ledger) {
  //       return res.status(404).json({ message: "Ledger not found." });
  //     }

  //     const ledgerGroupName = ledger.ledgerGroup?.name;

  //     if (!ledgerGroupName) {
  //       return res
  //         .status(404)
  //         .json({ message: "Ledger group not found or invalid." });
  //     }

  //     // Step 2: Define queries for Sales/Receipts or Purchases/Payments
  //     let salesQuery = [];
  //     let receiptQuery = [];

  //     if (ledgerGroupName === "Customers") {
  //       salesQuery = Sales.find({ party: ledgerId, companyCode })

  //         .limit(1) // Get only the most recent
  //         .lean();

  //       receiptQuery = Receipt.find({ "entries.ledger": ledgerId, companyCode })

  //         .limit(1) // Get only the most recent
  //         .lean();
  //     } else if (ledgerGroupName === "VENDOR") {
  //       salesQuery = Purchase.find({ ledger: ledgerId, companyCode })

  //         .limit(1) // Get only the most recent
  //         .lean();

  //       receiptQuery = Receipt.find({ "entries.ledger": ledgerId, companyCode })

  //         .limit(1) // Get only the most recent
  //         .lean();
  //     } else {
  //       return res.status(400).json({ message: "Invalid ledger group name." });
  //     }

  //     // Step 3: Fetch results in parallel
  //     const [salesEntry, receiptEntry] = await Promise.all([
  //       salesQuery,
  //       receiptQuery,
  //     ]);

  //     // Step 4: Sort the entries individually
  //     const sortedSalesEntry =
  //       salesEntry.length > 0
  //         ? salesEntry.sort((a, b) => {
  //             const dateA = new Date(a.date.split("/").reverse().join("-")); // Convert dd/MM/yyyy to yyyy-MM-dd
  //             const dateB = new Date(b.date.split("/").reverse().join("-"));
  //             return dateB - dateA; // Descending order
  //           })[0] // Get the most recent sales entry
  //         : null;

  //     const sortedReceiptEntry =
  //       receiptEntry.length > 0
  //         ? receiptEntry.sort((a, b) => {
  //             const dateA = new Date(a.date.split("/").reverse().join("-")); // Convert dd/MM/yyyy to yyyy-MM-dd
  //             const dateB = new Date(b.date.split("/").reverse().join("-"));
  //             return dateB - dateA; // Descending order
  //           })[0] // Get the most recent receipt entry
  //         : null;

  //     // Step 5: Create the response object
  //     const responseData = {
  //       message: "Last entry fetched successfully.",
  //       salesEntry: sortedSalesEntry,
  //       receiptEntry: sortedReceiptEntry,
  //     };

  //     // Step 6: Send the response
  //     res.status(200).json(responseData);
  //   } catch (error) {
  //     console.error("Error fetching last entries:", error);
  //     res.status(500).json({ message: "Internal server error." });
  //   }
  // },

  getLastEntry: async (req, res) => {
    try {
      const { ledgerId, companyCode } = req.params;

      // Step 1: Find the ledger document and populate the ledgerGroup field
      const ledger = await Ledger.findById(ledgerId)
        .populate("ledgerGroup")
        .exec();

      if (!ledger) {
        return res.status(404).json({ message: "Ledger not found." });
      }

      const ledgerGroupName = ledger.ledgerGroup?.name;

      if (!ledgerGroupName) {
        return res
          .status(404)
          .json({ message: "Ledger group not found or invalid." });
      }

      // Step 2: Define the query based on ledgerGroupName

      if (ledgerGroupName === "Customers") {
        saleQuery = Sales.find({ party: ledgerId, companyCode })
          .lean()
          .then((records) => records.map((r) => ({ ...r, type: "Sales" }))); // Add type field

        receiptQuery = Receipt.find({
          "entries.ledger": ledgerId,
          companyCode,
        })
          .lean()
          .then((records) => records.map((r) => ({ ...r, type: "Receipt" }))); // Add type field for receipts
      } else if (ledgerGroupName === "VENDOR") {
        saleQuery = Purchase.find({
          ledger: ledgerId,
          companyCode,
        })
          .lean()
          .then((records) => records.map((r) => ({ ...r, type: "Purchase" }))); // Add type field for purchases

        receiptQuery = Payment.find({
          "entries.ledger": ledgerId,
          companyCode,
        })
          .lean()
          .then((records) => records.map((r) => ({ ...r, type: "Payment" }))); // Add type field for payments
      } else {
        return res.status(400).json({ message: "Invalid ledger group name." });
      }

      // Step 3: Fetch all entries in parallel
      const [entries, receiptEntries] = await Promise.all([
        saleQuery,
        receiptQuery,
      ]);

      // Handle case where no entries are found
      if (entries.length === 0 && receiptEntries.length === 0) {
        return res
          .status(200)
          .json({
            message: "No entries found for this ledger.",
            data: {
              salesEntry: null,
              receiptEntry: null,
            },
          });
      }

      // Step 4: Sort entries by date in descending order
      const sortedEntries = entries.sort((a, b) => {
        const dateA = new Date(a.date.split("/").reverse().join("-")); // Convert dd/MM/yyyy to yyyy-MM-dd
        const dateB = new Date(b.date.split("/").reverse().join("-"));
        return dateB - dateA; // Sort in descending order
      });

      const sortedReceiptEntries = receiptEntries.sort((a, b) => {
        const dateA = new Date(a.date.split("/").reverse().join("-")); // Convert dd/MM/yyyy to yyyy-MM-dd
        const dateB = new Date(b.date.split("/").reverse().join("-"));
        return dateB - dateA; // Sort in descending order
      });

      // Get the last entry from both sales and receipts/purchases
      const lastSaleEntry = sortedEntries.length > 0 ? sortedEntries[0] : null;
      const lastReceiptEntry =
        sortedReceiptEntries.length > 0 ? sortedReceiptEntries[0] : null;

      // Step 5: Merge the last entries into a single response object
      const data = {
        salesEntry: lastSaleEntry,
        receiptEntry: lastReceiptEntry,
      };

      // Step 6: Return the combined data
      res.status(200).json({
        message: "Last entry fetched successfully.",
        data: data,
      });
    } catch (error) {
      console.error("Error fetching last entry:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  },
};

module.exports = LedgerDeshBoardController;


