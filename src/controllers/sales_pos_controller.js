const SalesPos = require("../models/sales_pos_model");
const Items = require("../models/items_model");

//For Creating Sales

const createSalesPos = async (req, res) => {
  try {
    console.log("Received request for creating SalesPos");
    console.log(req.body); 

    const salesData = req.body;
    const entries = salesData.entries;

    if (!entries || entries.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Entries are required.",
      });
    }

    salesData.totalAmount = parseFloat(salesData.totalAmount);
    salesData.advance = parseFloat(salesData.advance || 0);
    salesData.addition = parseFloat(salesData.addition || 0);
    salesData.less = parseFloat(salesData.less || 0);
    salesData.roundOff = parseFloat(salesData.roundOff || 0);

    const newsalesData = new SalesPos(salesData);

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];

      const item = await Items.findById(entry.itemName);

      if (!item) {
        return res.status(404).json({
          success: false,
          message: `Item with ID ${entry.itemName} not found`,
        });
      }

      console.log(`Updating stock for item: ${item.name}`);

      const itemQty = item.maximumStock;
      const salesQty = entry.qty;
      const newQty = itemQty - salesQty;

      // if (newQty < 0) {
      //   return res.status(400).json({
      //     success: false,
      //     message: `Not enough stock for item ${item.name}. Available: ${itemQty}, required: ${salesQty}`,
      //   });
      // }

      await Items.findByIdAndUpdate(entry.itemName, {
        maximumStock: newQty,
      });

      console.log(`Updated stock for item ${item.name}. New stock: ${newQty}`);
    }

    await newsalesData.save();

    return res.json({
      success: true,
      message: "Sales created successfully.",
      data: newsalesData,
    });
  } catch (error) {
    console.error("Error creating SalesPos:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
      error: error, 
    });
  }
};

//For Getting All Sales
const getAllSalesPos = async (req, res) => {
  try {
    const salesCode = req.params.code;
    const sales = await SalesPos.find({ companyCode: salesCode });

    return res.json({
      success: true,
      data: sales,
    });
  } catch (error) {
    return res.json({
      success: false,
      message: error.message,
    });
  }
};

// For Getting a Single Sale by ID and Company Code
const getSalesPosById = async (req, res) => {
  try {
    const salesId = req.params.id;
    const companyCode = req.params.companyCode;

    const sales = await SalesPos.findOne({ _id: salesId, companyCode: companyCode });

    if (!sales) {
      return res.status(404).json({
        success: false,
        message: `Sales with ID ${salesId} not found for company ${companyCode}`,
      });
    }

    return res.json({
      success: true,
      data: sales,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


//For Updating Sales
const updateSalesPos = async (req, res) => {
  try {
    console.log(req.body);
    const salesId = req.params.id;
    const salesData = req.body;
    const entries = salesData.entries;

    salesData.totalAmount = parseFloat(salesData.totalAmount);

    const previousSales = await SalesPos.findById(salesId);
    const previousEntries = previousSales.entries;

    for (let i = 0; i < previousEntries.length; i++) {
      const item = await Items.findById(previousEntries[i].itemName);
      const itemQty = item.maximumStock;
      const salesQty = previousEntries[i].qty;
      const newQty = itemQty + salesQty;

      await Items.findByIdAndUpdate(previousEntries[i].itemName, {
        maximumStock: newQty,
      });
    }

    for (let i = 0; i < entries.length; i++) {
      const item = await Items.findById(entries[i].itemName);
      const itemQty = item.maximumStock;
      const salesQty = entries[i].qty;
      const newQty = itemQty - salesQty;

      await Items.findByIdAndUpdate(entries[i].itemName, {
        maximumStock: newQty,
      });
    }

    const updatedSales = await SalesPos.findByIdAndUpdate(salesId, salesData, {
      new: true,
      runValidators: true,
    });

    return res.json({
      success: true,
      message: "Sales entry updated successfully.",
      data: updatedSales,
    });
  } catch (error) {
    // Send an error response in case of failure
    return res.json({
      success: false,
      message: error.message,
    });
  }
};

//For Deleting Sales
const deleteSalesPos = async (req, res) => {
  try {
    const salesId = req.params.id;
    const previousSales = await SalesPos.findById(salesId);
    const previousEntries = previousSales.entries;

    for (let i = 0; i < previousEntries.length; i++) {
      const item = await Items.findById(previousEntries[i].itemName);
      const itemQty = item.maximumStock;
      const salesQty = previousEntries[i].qty;
      const newQty = itemQty + salesQty;

      await Items.findByIdAndUpdate(previousEntries[i].itemName, {
        maximumStock: newQty,
      });
    }


    const sales = await SalesPos.findByIdAndDelete(salesId);

    return res.json({
      success: true,
      message: "Sales deleted successfully.",
    });
  } catch (error) {
    return res.json({
      success: false,
      message: error.message,
    });
  }
};

//Exporting the functions
module.exports = {
  createSalesPos,
  getAllSalesPos,
  updateSalesPos,
  deleteSalesPos,
  getSalesPosById
};
