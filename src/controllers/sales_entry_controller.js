const SalesEntry = require("../models/sales_entry_model");
const Items = require("../models/items_model");
const Ledger = require("../models/ledger_model");
const SalesBillModel = require("../models/sales_bills_model");
const fs = require("fs");
const pdfdocument = require("pdfkit");
const pdfTable = require("voilab-pdf-table");

//For Creating Sales
const createSales = async (req, res) => {
  try {
    const salesData = req.body;

    salesData.totalamount = parseFloat(salesData.totalamount);
    salesData.cashAmount = parseFloat(salesData.cashAmount);
    salesData.dueAmount = parseFloat(salesData.dueAmount);

    const newsalesData = new SalesEntry(salesData);
    const ledgerID = salesData.party;
    const saleType = salesData.type;

    console.log(salesData);

    if (saleType === "MULTI MODE") {
      const ledger = await Ledger.findById(ledgerID);
      ledger.debitBalance += salesData.multimode[0].debit;
      await ledger.save();
    }

    if (saleType === "DEBIT") {
      const ledger = await Ledger.findById(ledgerID);
      ledger.debitBalance += salesData.totalamount;
      await ledger.save();
    }

    if (saleType === "CASH") {
      newsalesData.cashAmount = salesData.totalamount;
    }

    await newsalesData.save();

    for (const entry of salesData.entries) {
      const salesId = entry.itemName;
      const quantity = entry.qty;

      const sales = await Items.findById(salesId);

      if (!sales) {
        return res.json({
          success: false,
          message: "Item not found.",
        });
      }

      await Items.updateOne(
        { _id: salesId },
        { $inc: { maximumStock: -quantity } }
      );
    }

    if (saleType === "MULTI MODE" || saleType === "DEBIT") {
      const dueAmount =
        saleType === "MULTI MODE"
          ? salesData.multimode[0]?.debit || 0
          : salesData.totalamount;

      const salesBillData = {
        date: salesData.date,
        companyCode: salesData.companyCode,
        name: `BS# ${salesData.no}`,
        type: "BS",
        ledger: ledgerID,
        ref: newsalesData._id, 
        totalAmount: salesData.totalamount.toString(),
        dueAmount: dueAmount.toString(),
      };

      const salesBill = new SalesBillModel(salesBillData);
      await salesBill.save();
    }

    // Response to the client
    return res.json({
      success: true,
      message: "Sales Created",
      data: newsalesData,
    });
  } catch (ex) {
    return res.json({ success: false, message: ex.message });
  }
};


const updateSales = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;

    // Find the existing sales entry
    const existingSales = await SalesEntry.findById(id);
    if (!existingSales) {
      return res.status(404).json({ success: false, message: "Sales entry not found." });
    }

    // Reverse ledger updates
    const existingLedger = await Ledger.findById(existingSales.party);
    if (existingSales.type === "MULTI MODE") {
      existingLedger.debitBalance -= existingSales.multimode[0]?.debit || 0;
    } else if (existingSales.type === "DEBIT") {
      existingLedger.debitBalance -= parseFloat(existingSales.totalamount);
    }
    await existingLedger.save();

    // Reverse stock changes
    for (const entry of existingSales.entries) {
      await Items.updateOne(
        { _id: entry.itemName },
        { $inc: { maximumStock: entry.qty } }
      );
    }

    // Reverse sales bill entry
    await SalesBillModel.deleteOne({ ref: existingSales._id });

    // Apply updates
    updatedData.totalamount = parseFloat(updatedData.totalamount);
    updatedData.cashAmount = parseFloat(updatedData.cashAmount);
    updatedData.dueAmount = parseFloat(updatedData.dueAmount);

    if (updatedData.type === "MULTI MODE") {
      const updatedLedger = await Ledger.findById(updatedData.party);
      updatedLedger.debitBalance += updatedData.multimode[0]?.debit || 0;
      await updatedLedger.save();
    } else if (updatedData.type === "DEBIT") {
      const updatedLedger = await Ledger.findById(updatedData.party);
      updatedLedger.debitBalance += updatedData.totalamount;
      await updatedLedger.save();
    } else if (updatedData.type === "CASH") {
      updatedData.cashAmount = updatedData.totalamount;
    }

    // Update stock for new entries
    for (const entry of updatedData.entries) {
      await Items.updateOne(
        { _id: entry.itemName },
        { $inc: { maximumStock: -entry.qty } }
      );
    }

    // Add updated sales bill
    if (updatedData.type === "MULTI MODE" || updatedData.type === "DEBIT") {
      const dueAmount =
        updatedData.type === "MULTI MODE"
          ? updatedData.multimode[0]?.debit || 0
          : updatedData.totalamount;

      const salesBillData = {
        date: updatedData.date,
        companyCode: updatedData.companyCode,
        name: `BS# ${updatedData.no}`,
        type: "BS",
        ledger: updatedData.party,
        ref: id,
        totalAmount: updatedData.totalamount.toString(),
        dueAmount: dueAmount.toString(),
      };

      const salesBill = new SalesBillModel(salesBillData);
      await salesBill.save();
    }

    const updatedSales = await SalesEntry.findByIdAndUpdate(id, updatedData, {
      new: true,
    });

    return res.json({
      success: true,
      message: "Sales updated successfully.",
      data: updatedSales,
    });
  } catch (ex) {
    return res.json({ success: false, message: ex.message });
  }
};

const deleteSales = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the sales entry
    const salesEntry = await SalesEntry.findById(id);
    if (!salesEntry) {
      return res.status(404).json({ success: false, message: "Sales entry not found." });
    }

    // Reverse ledger updates
    const ledger = await Ledger.findById(salesEntry.party);
    if (salesEntry.type === "MULTI MODE") {
      ledger.debitBalance -= salesEntry.multimode[0]?.debit || 0;
    } else if (salesEntry.type === "DEBIT") {
      ledger.debitBalance -= parseFloat(salesEntry.totalamount);
    }
    await ledger.save();

    // Reverse stock changes
    for (const entry of salesEntry.entries) {
      await Items.updateOne(
        { _id: entry.itemName },
        { $inc: { maximumStock: entry.qty } }
      );
    }

    // Reverse sales bill entry
    await SalesBillModel.deleteOne({ ref: id });

    // Delete the sales entry
    await SalesEntry.findByIdAndDelete(id);

    return res.json({
      success: true,
      message: "Sales entry deleted successfully.",
    });
  } catch (ex) {
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

    return res.json({success: true,data: fetchSalesByBillNumber});
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
  downloadReceipt,
  fetchAllSales,
  getSales,
};
