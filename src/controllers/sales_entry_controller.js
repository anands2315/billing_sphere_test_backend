const SalesEntry = require("../models/sales_entry_model");
const Items = require("../models/items_model");
const Ledger = require("../models/ledger_model");
const mongoose = require('mongoose');
const fs = require("fs");
const pdfdocument = require("pdfkit");
const pdfTable = require("voilab-pdf-table");
const SalesBillModel = require("../models/sales_bills_model");


//For Creating Sales
const createSales = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const salesData = req.body;

    salesData.totalamount = parseFloat(salesData.totalamount);
    salesData.cashAmount = parseFloat(salesData.cashAmount);
    salesData.dueAmount = parseFloat(salesData.dueAmount);

    const newsalesData = new SalesEntry(salesData);
    const ledgerID = salesData.party;
    const saleType = salesData.type;

    console.log(salesData);

    const ledger = await Ledger.findById(ledgerID).session(session);
    if (!ledger) throw new Error("Ledger not found.");

    if (saleType === "MULTI MODE") {
      ledger.debitBalance += salesData.multimode[0].debit;
    } else if (saleType === "DEBIT") {
      ledger.debitBalance += salesData.totalamount;
    } else if (saleType === "CASH") {
      newsalesData.cashAmount = salesData.totalamount;
    }

    await ledger.save({ session });

    // Update stock based on sales entries
    for (const entry of salesData.entries) {
      const salesId = entry.itemName;
      const quantity = entry.qty;

      const sales = await Items.findById(salesId).session(session);
      if (!sales) throw new Error("Item not found.");

      await Items.updateOne(
        { _id: salesId },
        { $inc: { maximumStock: -quantity } },
        { session }
      );
    }

    for (const bill of salesData.billwise) {
      const { billType, amount, salesBill } = bill;
      const parsedAmount = parseFloat(amount);

      if (billType === "Against Ref.") {
        if (!salesBill) throw new Error("Sales Bill ID is required for Against Ref.");

        const billRef = await SalesBillModel.findById(salesBill).session(session);
        if (!billRef) throw new Error("Sales Bill not found.");

        if (billRef.type === "BS") {
          billRef.dueAmount = parseFloat(billRef.dueAmount) + parsedAmount;
        } else {
          billRef.dueAmount = parseFloat(billRef.dueAmount) - parsedAmount;
        }

        await billRef.save({ session });
      } else if (billType === "New Ref.") {
        const salesBillData = {
          date: salesData.date,
          companyCode: salesData.companyCode,
          name: bill.billName,
          type: "BS",
          ledger: ledgerID,
          ref: newsalesData._id,
          totalAmount: salesData.totalamount.toString(),
          dueAmount: parsedAmount.toString(),
          dueDate : bill.dueDate,
        };

        const newSalesBill = new SalesBillModel(salesBillData);
        await newSalesBill.save({ session });

        const billwiseEntry = newsalesData.billwise.find(
          (b) => b.billName === bill.billName && b.billType === "New Ref." && b.amount === amount
      );
      if (billwiseEntry) {
          billwiseEntry.salesBill = newSalesBill._id;
      }
      }
    }

    await newsalesData.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.json({
      success: true,
      message: "Sales Created Successfully",
      data: newsalesData,
    });
  } catch (ex) {
    await session.abortTransaction();
    session.endSession();
    return res.json({ success: false, message: ex.message });
  }
};

const updateSales = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const updatedSalesData = req.body;
    console.log(updatedSalesData);

    const existingSales = await SalesEntry.findById(id).session(session);
    if (!existingSales) throw new Error("Sales entry not found.");

    // Reverse ledger balance update
    const ledger = await Ledger.findById(existingSales.party).session(session);
    if (!ledger) throw new Error("Ledger not found.");

    if (existingSales.type === "MULTI MODE") {
      ledger.debitBalance -= existingSales.multimode[0].debit;
    } else if (existingSales.type === "DEBIT") {
      ledger.debitBalance -= existingSales.totalamount;
    }

    await ledger.save({ session });

    // Reverse stock update
    for (const entry of existingSales.entries) {
      await Items.updateOne(
        { _id: entry.itemName },
        { $inc: { maximumStock: entry.qty } },
        { session }
      );
    }

    // Reverse Billwise adjustments
    for (const bill of existingSales.billwise) {
      const { billType, amount, salesBill } = bill;
      const parsedAmount = parseFloat(amount);

      if (billType === "Against Ref.") {
        if (!salesBill) throw new Error("Sales Bill ID is required for Against Ref.");

        const billRef = await SalesBillModel.findById(salesBill).session(session);
        if (!billRef) throw new Error("Sales Bill not found.");

        if (billRef.type === "BS") {
          billRef.dueAmount -= parsedAmount;
        } else {
          billRef.dueAmount += parsedAmount;
        }

        await billRef.save({ session });
      } else if (billType === "New Ref.") {
        await SalesBillModel.findByIdAndDelete(salesBill).session(session);
      }
    }

    // Apply new sales data
    updatedSalesData.totalamount = parseFloat(updatedSalesData.totalamount);
    updatedSalesData.cashAmount = parseFloat(updatedSalesData.cashAmount);
    updatedSalesData.dueAmount = parseFloat(updatedSalesData.dueAmount);

    if (updatedSalesData.type === "MULTI MODE") {
      ledger.debitBalance += updatedSalesData.multimode[0].debit;
    } else if (updatedSalesData.type === "DEBIT") {
      ledger.debitBalance += updatedSalesData.totalamount;
    }

    await ledger.save({ session });

    for (const entry of updatedSalesData.entries) {
      await Items.updateOne(
        { _id: entry.itemName },
        { $inc: { maximumStock: -entry.qty } },
        { session }
      );
    }

    for (const bill of updatedSalesData.billwise) {
      const { billType, amount, salesBill } = bill;
      const parsedAmount = parseFloat(amount);

      if (billType === "Against Ref.") {
        const billRef = await SalesBillModel.findById(salesBill).session(session);
        if (!billRef) throw new Error("Sales Bill not found.");

        if (billRef.type === "BS") {
          billRef.dueAmount += parsedAmount;
        } else {
          billRef.dueAmount -= parsedAmount;
        }

        await billRef.save({ session });
      } else if (billType === "New Ref.") {
        const newSalesBill = new SalesBillModel({
          date: updatedSalesData.date,
          companyCode: updatedSalesData.companyCode,
          name: bill.billName,
          type: "BS",
          ledger: updatedSalesData.party,
          ref: id,
          totalAmount: updatedSalesData.totalamount.toString(),
          dueAmount: parsedAmount.toString(),
          dueDate: bill.dueDate,
        });

        await newSalesBill.save({ session });

        const billwiseEntry = updatedSalesData.billwise.find(
          (b) => b.billName === bill.billName && b.billType === "New Ref." && b.amount === amount
        );
        if (billwiseEntry) {
          billwiseEntry.salesBill = newSalesBill._id;
        }
      }
    }

    await SalesEntry.findByIdAndUpdate(id, updatedSalesData, { session });

    await session.commitTransaction();
    session.endSession();

    return res.json({ success: true, message: "Sales updated successfully" });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return res.json({ success: false, message: error.message });
  }
};

const deleteSales = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const existingSales = await SalesEntry.findById(id).session(session);
    if (!existingSales) throw new Error("Sales entry not found.");

    const ledger = await Ledger.findById(existingSales.party).session(session);
    if (!ledger) throw new Error("Ledger not found.");

    // Reverse ledger balance changes
    if (existingSales.type === "MULTI MODE") {
      ledger.debitBalance -= existingSales.multimode[0].debit;
    } else if (existingSales.type === "DEBIT") {
      ledger.debitBalance -= existingSales.totalamount;
    }
    await ledger.save({ session });

    // Reverse stock changes
    for (const entry of existingSales.entries) {
      await Items.updateOne(
        { _id: entry.itemName },
        { $inc: { maximumStock: entry.qty } },
        { session }
      );
    }

    // Reverse billwise adjustments
    for (const bill of existingSales.billwise) {
      if (bill.billType === "Against Ref.") {
        const billRef = await SalesBillModel.findById(bill.salesBill).session(session);
        if (billRef) {
          if (billRef.type === "BS") {
            billRef.dueAmount -= parseFloat(bill.amount);
          } else {
            billRef.dueAmount += parseFloat(bill.amount);
          }
          await billRef.save({ session });
        }
      } else if (bill.billType === "New Ref.") {
        await SalesBillModel.findByIdAndDelete(bill.salesBill).session(session);
      }
    }

    await SalesEntry.findByIdAndDelete(id).session(session);
    
    await session.commitTransaction();
    session.endSession();

    return res.json({
      success: true,
      message: "Sales Deleted Successfully",
    });
  } catch (ex) {
    await session.abortTransaction();
    session.endSession();
    return res.json({ success: false, message: ex.message });
  }
};


//For Deleting Sales
// const deleteSales = async (req, res) => {
//   try {
//     const sales = await SalesEntry.deleteOne({ _id: req.params.id });
//     if (!sales) {
//       return res.json({ success: false, message: "Sales Entry not found" });
//     }
//     return res.json({
//       success: true,
//       message: "Sales Entry Deleted Successfully!",
//     });
//   } catch (ex) {
//     return res.json({ success: false, message: ex });
//   }
// };

//  Get all sales
const getAllSales = async (req, res) => {
  try {
    const sales = await SalesEntry.find({});
    return res.json({ success: true, data: sales });
  } catch (ex) {
    return res.json({ success: false, message: ex });
  }
};

const fetchAllSales = async (req, res) => {
  try {
    const { companyCode } = req.params;
    const fetchAllSale = await SalesEntry.find({
      companyCode: companyCode,
    });
    return res.json({ success: true, data: fetchAllSale });
  } catch (ex) {
    return res.json({ success: false, message: ex });
  }
};

const fetchSalesByBillNumber = async (req, res) => {
  try {
    const dcNo = req.params.billNumber;

    const fetchSalesByBillNumber = await SalesEntry.findOne({
      dcNo: dcNo
    });

    if (!fetchSalesByBillNumber) {
      return res.json({
        success: false,
        message: "Sales entry not found",
      });
    }

    return res.json({ success: true, data: fetchSalesByBillNumber });
  } catch (ex) {
    res.json({ success: false, message: ex });
  }
}

const fetchSalesByParty = async (req, res) => {
  try {
    const party = req.params.party;

    const salesEntries = await SalesEntry.find({ party: party });

    if (salesEntries.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No sales entries found for the specified party",
      });
    }

    return res.status(200).json({ success: true, data: salesEntries });
  } catch (ex) {
    console.error("Error fetching sales entries:", ex);
    return res.status(500).json({ success: false, message: ex.message });
  }
};

const fetchSalesByItemName = async (req, res) => {
  const { itemNameId } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(itemNameId)) {
      return res.status(400).json({ message: "Invalid itemName ID" });
    }

    const salesEntries = await SalesEntry.find({
      entries: {
        $elemMatch: { itemName: itemNameId },
      },
    });

    res.status(200).json(salesEntries);
  } catch (error) {
    console.error("Error fetching sales entries:", error.message);
    res.status(500).json({ message: "Failed to fetch sales entries", error: error.message });
  }
};

//pagination
const getSales = async (req, res) => {
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 12;

    // Get companyCode from params
    const { companyCode } = req.params;

    const skip = (page - 1) * limit;

    // Fetch total count of items
    const totalCount = await SalesEntry.countDocuments({});

    // Calculate total number of pages
    const totalPages = Math.ceil(totalCount / limit);

    // Fetch items with pagination
    const allSales = await SalesEntry.find({ companyCode: companyCode })
      .skip(skip)
      .limit(limit);
    res.json({ success: true, data: allSales, totalPages });
  } catch (ex) {
    res.json({ success: false, message: ex });
  }
};

// Download Receipt
const downloadReceipt = async (req, res) => {
  try {
    const sales = await SalesEntry.findOne({ _id: req.params.id });
    if (!sales) {
      return res.json({ success: false, message: "Sales Entry not found" });
    }

    generateReceiptPDF(sales, (filePath) => {
      // Send the PDF file as a download response
      res.download(filePath, `receipt_${sales._id}.pdf`, (err) => {
        if (err) {
          return res
            .status(500)
            .json({ success: false, message: "Error downloading PDF" });
        }
        fs.unlinkSync(filePath);
      });
    });
  } catch (ex) {
    return res.status(500).json({ success: false, message: ex });
  }
};

const generateReceiptPDF = async (salesData, callback) => {
  const doc = new pdfdocument({
    autoFirstPage: false,
  });

  const table = new pdfTable(doc, {
    bottomMargin: 30,
  });

  table
    .addPlugin(
      new (require("voilab-pdf-table/plugins/fitcolumn"))({
        column: "description",
      })
    )
    .setColumnsDefaults({
      headerBorder: "B",
      align: "right",
    })
    .addColumns([
      {
        id: "itemName",
        header: "Item Name",
        align: "left",
        width: 300,
      },
      {
        id: "qty",
        header: "Quantity",
        width: 50,
      },
      {
        id: "rate",
        header: "Rate",
        width: 50,
      },
      {
        id: "amount",
        header: "Amount",
        width: 50,
      },
    ])
    .onPageAdded(function (tb) {
      tb.addHeader();
    });

  doc.addPage();
  const populatedEntries = await Promise.all(
    salesData.entries.map(async (entry) => {
      const item = await Items.findById(entry.itemName);
      if (item) {
        return { ...entry.toObject(), itemName: item.itemName };
      }
      return entry;
    })
  );

  table.addBody(populatedEntries);

  const buffers = [];
  doc.on("data", buffers.push.bind(buffers));
  doc.on("end", () => {
    const pdfData = Buffer.concat(buffers);

    const fileName = `receipt_${salesData._id}.pdf`;
    const filePath = `${__dirname}/${fileName}`;
    fs.writeFileSync(filePath, pdfData);

    callback(filePath);
  });

  doc.end();
};

const getSingleSales = async (req, res) => {
  try {
    const sales = await SalesEntry.findOne({ _id: req.params.id });
    if (!sales) {
      return res.json({ success: false, message: "Sales Entry not found" });
    }
    return res.json({ success: true, data: sales });
  } catch (ex) {
    return res.json({ success: false, message: ex });
  }
};

module.exports = {
  createSales,
  updateSales,
  deleteSales,
  getAllSales,
  fetchSalesByBillNumber,
  fetchSalesByParty,
  getSingleSales,
  fetchSalesByItemName,
  downloadReceipt,
  fetchAllSales,
  getSales,
};
