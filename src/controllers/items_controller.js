const Items = require("../models/items_model");
const BarcodePrint = require("../models/barcode_print_model");
const NodeCache = require("node-cache");
const myCache = new NodeCache({ stdTTL: 100, checkperiod: 120 });

const createItem = async (req, res) => {
  try {
    console.log("create item");
    const newItemData = req.body;
    console.log(newItemData);

    const existingItem = await Items.find({
      companyCode: newItemData["companyCode"],
      codeNo: newItemData["codeNo"],
    });

    if (existingItem.length > 0) {
      console.log("already exist");
      return res.status(400).json({
        success: false,
        message: `Item with codeNo ${codeNo} already exists for companyCode ${companyCode}`,
      });
    }

    console.log("does not exist");

    if (newItemData.images && newItemData.images.length > 0) {
      newItemData.images = newItemData.images.map((image) => ({
        data: Buffer.from(image.data, "base64"),
        contentType: image.contentType,
        filename: image.filename,
      }));
    }

    const newItem = await Items.create(newItemData);
    console.log(newItem);
    res.json({ success: true, data: newItem });
  } catch (ex) {
    res.json({ success: false, message: ex });
  }
};

const fetchAllItems = async (req, res) => {
  try {
    const item = await Items.find();
    return res.json({ success: true, data: item });
  } catch (ex) {
    return res.json({ success: false, message: ex });
  }
};

const getItems = async (req, res) => {
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = req.query.limit ? parseInt(req.query.limit) : 2000;

    // Get companyCode from params
    const { companyCode } = req.params;

    const skip = (page - 1) * (limit || 0); // If limit is null, skip will be 0

    // Cache Key
    const cacheKey = `items_${companyCode}_page_${page}_limit_${limit}`;

    // Check if the data is in the cache
    const cachedData = myCache.get(cacheKey);



    if (cachedData) {
      console.log("Data fetched from cache");
      return res.json({ success: true, data: cachedData });
    }

    // Fetch total count of items
    const totalCount = await Items.countDocuments({ companyCode: companyCode });

    // Calculate total number of pages
    const totalPages = limit ? Math.ceil(totalCount / limit) : 1;

    // Fetch items with or without pagination
    const query = Items.find({ companyCode: companyCode })
      .skip(skip)
      .sort({ _id: -1 });
    if (limit) {
      query.limit(limit);
    }

    const allItems = await query;    

    res.json({ success: true, data: allItems, totalPages });
  } catch (ex) {
    res.json({ success: false, message: ex });
  }
};

const getItemById = async (req, res) => {
  try {
    const item = await Items.findById(req.params.itemId);

    console.log(item.itemName);
    if (item) {
      res.json({ success: true, data: item });
    } else {
      res.json({ success: false, message: "Item not found" });
    }
  } catch (ex) {
    res.json({ success: false, message: ex });
  }
};

const searchItemsByName = async (req, res) => {
  try {
    const companyCode = req.params.companyCode;
    const searchQuery = req.query.query || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    // Perform the search with regex for case-insensitive matching and paginate results
    const items = await Items.find({
      itemName: { $regex: searchQuery, $options: "i" },
      companyCode: companyCode, // Filter by companyCode
    })
      .skip((page - 1) * limit)
      .limit(limit);

    // Get the total number of matching items (for pagination info)
    // const totalItems = await Items.countDocuments({
    //   itemName: { $regex: searchQuery, $options: "i" },
    //   companyCode: companyCode,
    // });

    res.status(200).json({
      success: true,
      // totalItems: totalItems,
      totalItems: items.length,
      currentPage: page,

      // totalPages: Math.ceil(totalItems / limit),
      data: items,
    });
  } catch (error) {
    console.error("Error fetching items:", error);
    res.status(500).json({ success: false, message: "Failed to fetch items" });
  }
};

const getMultipleItemById = async (req, res) => {
  try {
    // Get itemIds from query parameters and split by comma if necessary
    const companyCode = req.params.companyCode;
    const itemIds = req.query.itemIds ? req.query.itemIds.split(",") : [];

    // Validate the itemIds to be ObjectIds
    if (itemIds.length === 0) {
      return res.json({ success: false, message: "No item IDs provided" });
    }

    // Check if each itemId is a valid ObjectId
    const invalidIds = itemIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      return res.json({ success: false, message: `Invalid item IDs: ${invalidIds.join(", ")}` });
    }

    // Fetch all items whose IDs are in the itemIds array
    const items = await Items.find({
      _id: { $in: itemIds.map(id => new mongoose.Types.ObjectId(id)) },  // No need for 'new' if using Types.ObjectId directly
      companyCode: companyCode,
    });

    if (items.length > 0) {
      res.json({ success: true, data: items });
    } else {
      res.json({ success: false, message: "No items found" });
    }
  } catch (ex) {
    res.json({ success: false, message: ex.message || "Error fetching items" });
  }
};

const getUniqueFieldIds = async (req, res) => {
  try {
    // Fetch unique IDs for each field
    const itemGroups = await Items.distinct("itemGroup");
    const itemBrands = await Items.distinct("itemBrand");
    const taxCategories = await Items.distinct("taxCategory");
    const hsns = await Items.distinct("hsnCode");

    res.status(200).json({
      success: true,
      data: {
        itemGroups,
        itemBrands,
        taxCategories,
        hsns,
      },
    });
  } catch (error) {
    console.error("Error fetching unique field IDs:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching data.",
      error: error.message,
    });
  }
};

const groupedItems = async (req, res) => {
  try {
    const { groupBy, companyCode, page = 1, limit = 20, search = "" } = req.query;
    console.log(".........");
    console.log(groupBy);
    console.log(companyCode);
    console.log(search);

    const validGroupFields = ["itemGroup", "itemBrand", "taxCategory", "hsnCode"];
    if (!groupBy || !validGroupFields.includes(groupBy)) {
      return res.status(400).json({
        success: false,
        message: `Invalid or missing groupBy parameter. Allowed values are: ${validGroupFields.join(", ")}`,
      });
    }

    const filter = companyCode ? { companyCode: companyCode } : {};

    if (search) {
      const regex = new RegExp(search, "i"); 
      filter.$or = [
        { itemName: { $regex: regex } }, 
      ];
    }

    // Fetch the items with the filter
    const items = await Items.find(filter);

    if (items.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No items found for companyCode: ${companyCode}`,
      });
    }

    // Group the items by the selected field (groupBy)
    const grouped = items.reduce((result, item) => {
      const key = item[groupBy];
      if (!result[key]) {
        result[key] = [];
      }
      result[key].push(item);
      return result;
    }, {});

    // Flatten the grouped items into a list
    const groupedItems = Object.values(grouped).flat();

    const totalItems = groupedItems.length;
    const totalPages = Math.ceil(totalItems / limit);
    const skip = (page - 1) * limit;

    const paginatedItems = groupedItems.slice(skip, skip + limit);

    res.status(200).json({
      success: true,
      data: paginatedItems,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: totalItems,
        limit: limit,
      },
    });
  } catch (error) {
    console.error("Error fetching grouped items:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching grouped items",
    });
  }
};


// const updateItem = async (req, res) => {
//   try {

//     const newItemData = req.body;

//      // Handle image data if present
//      if (newItemData.images && newItemData.images.length > 0) {
//       newItemData.images = newItemData.images.map((image) => ({
//         data: Buffer.from(image.data, "base64"),
//         contentType: image.contentType,
//         filename: image.filename,
//       }));
//     }

//     const updatedItem = await Items.findByIdAndUpdate(
//       { _id: req.params.itemId },
//       req.body,
//       { new: true, runValidators: true }
//     );
//     if (updatedItem) {
//       res.json({ success: true, data: updatedItem });
//     } else {
//       res.json({ success: false, message: "Item not found" });
//     }
//   } catch (ex) {
//     res.json({ success: false, message: ex });
//   }
// };

const updateItem = async (req, res) => {
  try {
    const newItemData = req.body;

    // Handle image data if present
    if (newItemData.images && newItemData.images.length > 0) {
      newItemData.images = newItemData.images.map((image) => ({
        data: Buffer.from(image.data, "base64"),
        contentType: image.contentType,
        filename: image.filename,
      }));
    }

    const updatedItem = await Items.findByIdAndUpdate(
      req.params.itemId, // Removed unnecessary curly braces
      newItemData, // Changed req.body to newItemData
      { new: true, runValidators: true }
    );
    if (updatedItem) {
      res.json({ success: true, data: updatedItem });
    } else {
      res.json({ success: false, message: "Item not found" });
    }
  } catch (ex) {
    res.json({ success: false, message: ex });
  }
};

// Update item price
const updateItemStock = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { maximumStock } = req.params;

    // Find the item by its ID to get the current maximum stock
    const currentItem = await Items.findById(itemId);

    if (!currentItem) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found" });
    }

    // Subtract the value from the params from the current maximum stock
    const updatedMaximumStock =
      currentItem.maximumStock - parseInt(maximumStock);

    // Update the item with the new maximum stock
    const updatedItem = await Items.findByIdAndUpdate(
      itemId,
      { maximumStock: updatedMaximumStock },
      { new: true }
    );

    // Check if the item was updated
    if (updatedItem) {
      res.json({ success: true, data: updatedItem });
    } else {
      res
        .status(500)
        .json({ success: false, message: "Failed to update item" });
    }
  } catch (ex) {
    // Handle any errors
    res.status(500).json({ success: false, message: ex.message });
  }
};

const deleteItem = async (req, res) => {
  try {
    const deletedItem = await Items.findByIdAndDelete(req.params.itemId);
    if (deletedItem) {
      res.json({ success: true, data: deletedItem });
    } else {
      res.json({ success: false, message: "Item not found" });
    }
  } catch (ex) {
    res.json({ success: false, message: ex });
  }
};

// Function to get Items by barCode
const getItemByBarCode = async (req, res) => {
  try {
    
    const barcodeValue = req.params.barcode;
    console.log(`barcodeValue : ${barcodeValue}`);
    const barcodeDoc = await BarcodePrint.findOne({ barcode: barcodeValue });
    if (barcodeDoc) {
      const item = await Items.find({ barcode: barcodeDoc._id });
      if (item) {
        res.json({ success: true, data: item });
      } else {
        res.json({ success: false, message: "Item not found" });
      }
    } else {
      res.json({ success: false, message: "Barcode not found" });
    }
  } catch (ex) {
    res
      .status(500)
      .json({ success: false, message: "Error finding item by barcode" });
  }
};

// Get Items by Group
const getItemsByGroup = async (req, res) => {
  try {
    const { category } = req.params;
    const items = await Items.find({ itemGroup: category });
    res.json({ success: true, data: items });
  } catch (ex) {
    res.json({ success: false, message: ex });
  }
};

// Get Brands by Group
const getBrandsByGroup = async (req, res) => {
  try {
    const { category } = req.params;
    const items = await Items.find({ itemGroup: category });
    const brands = items.map((item) => item.itemBrand);
    // Remove duplicates, check if the id are the same
    const uniqueBrands = brands.filter(
      (brand, index, self) =>
        index === self.findIndex((t) => t.toString() === brand.toString())
    );
    res.json({ success: true, data: uniqueBrands });
  } catch (ex) {
    res.json({ success: false, message: ex });
  }
};

// Helper Function to Update Specific Fields in All Items, Don't use
// const updateAllItems = async (req, res) => {
//   try {
//     // Extract the fields you want to update from req.body
//     const { dealer, subDealer, openingStock, status } = req.body;

//     // Create an object with only the fields you want to update
//     const updateFields = {};
//     if (dealer !== undefined) updateFields.dealer = dealer;
//     if (subDealer !== undefined) updateFields.subDealer = subDealer;
//     if (openingStock !== undefined) updateFields.openingStock = openingStock;
//     if (status !== undefined) updateFields.status = status;

//     // Generate a unique codeNo for each item
//     const generateCodeNumber = () => Math.floor(Math.random() * 1000);

//     // Get all items from the database
//     const allItems = await Items.find({});

//     // Update each item with a unique codeNo
//     const updatedItemsPromises = allItems.map(async (item) => {
//       // Generate a unique codeNo
//       const newCodeNo = generateCodeNumber().toString();
//       // Update the item with the new codeNo
//       await Items.updateOne({ _id: item._id }, { $set: { codeNo: newCodeNo } });
//     });

//     // Wait for all update operations to complete
//     await Promise.all(updatedItemsPromises);

//     // Use $set operator to update only specified fields
//     const updatedItems = await Items.updateMany(
//       {},
//       { $set: updateFields },
//       {
//         new: true,
//         runValidators: false,
//       }
//     );

//     res.json({ success: true, data: updatedItems });
//   } catch (ex) {
//     res.json({ success: false, message: ex });
//   }
// };

//  Function to Update All Items with a Specific Field, Don't use
const updateAllItems = async (req, res) => {
  try {
    // Extract the field you want to update from req.body
    const { user_id } = req.body;

    // Create an object with only the field you want to update
    const updateFields = {};
    if (user_id !== undefined) updateFields.user_id = user_id;

    // Use $set operator to update only the specified field
    const updatedItems = await Items.updateMany(
      {},
      { $set: updateFields },
      {
        new: true,
        runValidators: false,
      }
    );

    res.json({ success: true, data: updatedItems });
  } catch (ex) {
    res.json({ success: false, message: ex });
  }
};

// Helper Function to Insert Multiple Items into the Database from CSV, Don't use
async function insertItemsIntoDB(req, res, next) {
  const Item = require("../models/items_model");
  const mongoose = require("mongoose");

  const data = req.body.map((item) => {
    const { images, date, user_id, ...rest } = item;
    return rest;
  });

  for (const item of data) {
    try {
      for (const key of Object.keys(item)) {
        if (Item.schema.path(key) instanceof mongoose.Schema.Types.ObjectId) {
          if (key === "hsnCode") {
            const HSNModel = mongoose.model("HSN");
            const hsn = await HSNModel.findOne({ hsn: item[key] });
            if (hsn) {
              item[key] = hsn._id;
            } else {
              console.log(`HSN code '${item[key]}' not found in the database`);
            }
          } else if (key === "taxCategory") {
            let taxRateString = item[key].replace("% GST", "");
            const TaxRateModel = mongoose.model("TaxRate");
            const taxRate = await TaxRateModel.findOne({ rate: taxRateString });
            if (taxRate) {
              item[key] = taxRate._id;
            } else {
              console.log(
                `Tax rate code '${item[key]}' not found in the database`
              );
            }
          } else if (key === "storeLocation") {
            const StoreLocationModel = mongoose.model("StoreLocation");
            const storeLocation = await StoreLocationModel.findOne({
              location: item[key],
            });
            if (storeLocation) {
              item[key] = storeLocation._id;
            } else {
              console.log(
                `Store location code '${item[key]}' not found in the database`
              );
            }
          } else if (key === "measurementUnit") {
            const MeasurementUnitModel = mongoose.model("MeasurementLimit");
            const measurementUnit = await MeasurementUnitModel.findOne({
              measurement: item[key],
            });
            if (measurementUnit) {
              item[key] = measurementUnit._id;
            } else {
              console.log(
                `Measurement unit code '${item[key]}' not found in the database`
              );
            }
          } else if (key === "secondaryUnit") {
            const SecondaryUnitModel = mongoose.model("SecondaryUnit");
            const secondaryUnit = await SecondaryUnitModel.findOne({
              secondaryUnit: item[key],
            });
            if (secondaryUnit) {
              item[key] = secondaryUnit._id;
            } else {
              // If no matching record is found, set the value to the first data in the table
              const firstSecondaryUnit = await SecondaryUnitModel.findOne({});
              if (firstSecondaryUnit) {
                item[key] = firstSecondaryUnit._id;
              } else {
                console.log("No secondary units found in the database");
              }
            }
          } else if (key === "itemBrand") {
            const BrandModel = mongoose.model("ItemsBrand");
            const brand = await BrandModel.findOne({ name: item[key] });
            if (brand) {
              item[key] = brand._id;
            } else {
              console.log(
                `Brand code '${item[key]}' not found in the database`
              );
            }
          } else if (key === "itemGroup") {
            const CategoryModel = mongoose.model("ItemsGroup");
            const category = await CategoryModel.findOne({ name: item[key] });
            if (category) {
              item[key] = category._id;
            } else {
              console.log(
                `Category code '${item[key]}' not found in the database`
              );
            }
          } else if (key === "barcode") {
            const BarcodeModel = mongoose.model("BarcodePrint");
            if (!item[key]) {
              // If barcode is empty, assign the barcode at the 0th index
              const barcode = await BarcodeModel.findOne().sort({
                _id: 1,
              }); // Assuming you want to select the first barcode
              if (barcode) {
                item[key] = barcode._id;
              } else {
                console.log("No barcode found in the database");
              }
            } else {
              // If barcode is not empty, check if it exists in the database
              const barcode = await BarcodeModel.findOne({
                barcode: item[key],
              });
              if (barcode) {
                item[key] = barcode._id;
              } else {
                console.log(
                  `Barcode code '${item[key]}' not found in the database`
                );
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Error:", error);
    }
  }

  try {
    // Insert the modified data into the database
    const insertedItems = await Item.insertMany(data);
    console.log(`${insertedItems.length} items inserted successfully.`);
    res.json({
      success: true,
      message: `${insertedItems.length} items inserted successfully.`,
    });
  } catch (error) {
    console.error("Error inserting items into the database:", error);
  }
}

module.exports = {
  createItem,
  getItems,
  getItemById,
  getItemsByGroup,
  updateItem,
  deleteItem,
  searchItemsByName,
  getMultipleItemById,
  getUniqueFieldIds,
  groupedItems,
  getItemByBarCode,
  insertItemsIntoDB,
  updateAllItems,
  getBrandsByGroup,
  fetchAllItems,
  updateItemStock,
};
