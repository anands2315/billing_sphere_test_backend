const DeliveryChallanModel = require("../models/delivery_challan_model");
const ProductStockModel = require("../models/product_stock_model");
const ItemModel = require("../models/items_model");
const PurchaseModel = require("../models/purchase_model");

const createDeliveryChallan = async (req, res) => {
  try {
    // Create a new delivery challan instance from the request body
    const deliveryChallan = new DeliveryChallanModel(req.body);

    // Process each entry in the request body to update stock and track item IDs
    const updatePromises = req.body.entries.map(async (entry) => {
      // Find the item in the current store by its ID
      const item = await ItemModel.findById(entry.itemName);
      console.log(item.companyCode);
      console.log(req.body.companyCode);

      // Decrement the stock of the item in the current store
      item.maximumStock -= entry.qty;
      await item.save();
      console.log(`Decremented maximumStock by ${entry.qty} for item ${item._id}`);

      // Check if the item exists in the target store
      let existingItem = await ItemModel.findOne({
        codeNo: item.codeNo,
        companyCode: req.body.companyCode,
      });

      let itemId;
      if (existingItem) {
        console.log("yes its already there");
        // If the item exists in the target store, update its stock
        existingItem.maximumStock += entry.qty;
        await existingItem.save();
        itemId = existingItem._id;
        console.log("........." + itemId);
      } else {
        const newItem = new ItemModel({
          itemGroup: item.itemGroup,
          itemBrand: item.itemBrand,
          itemName: item.itemName,
          printName: item.printName,
          codeNo: item.codeNo,
          taxCategory: item.taxCategory,
          hsnCode: item.hsnCode,
          barcode: item.barcode,
          storeLocation: item.storeLocation,
          measurementUnit: item.measurementUnit,
          secondaryUnit: item.secondaryUnit,
          minimumStock: item.minimumStock,
          maximumStock: entry.qty,
          monthlySalesQty: item.monthlySalesQty,
          date: item.date,
          dealer: item.dealer,
          subDealer: item.subDealer,
          retail: item.retail,
          mrp: item.mrp,
          price: item.price,
          openingStock: item.openingStock,
          status: item.status,
          images: item.images,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          companyCode: req.body.companyCode,
        });

        await newItem.save();
        itemId = newItem._id;
        // Print the details of the newly created item
        console.log("Created new item:", newItem.toObject());
      }

      // Return the updated entry with the correct item ID for the target store
      return {
        itemName: itemId,
        qty: entry.qty,
        rate: entry.rate,
        unit: entry.unit,
        amount: entry.netAmount,
        tax: 0,
        sgst: 0.0,
        cgst: 0.0,
        discount: 0.0,
        igst: 0.0,
        netAmount: entry.netAmount,
        sellingPrice: entry.rate,
      };
    });

    // Wait for all updates to complete
    const updatedEntries = await Promise.all(updatePromises);

    // Save the delivery challan
    await deliveryChallan.save();

    // Create a purchase entry in the target store
    const purchaseEntry = new PurchaseModel({
      no: req.body.no,
      companyCode: req.body.companyCode,
      date: req.body.date,
      date2: req.body.date2,
      type: "Cash",
      ledger: req.body.ledger,
      place: req.body.place,
      billNumber: req.body.no,
      remarks: "",
      totalamount: req.body.totalamount,
      cashAmount: 0.0,
      dueAmount: 0.0,
      roundoffDiff: 0.0,
      entries: updatedEntries,
      sundry: [],
    });

    // Save the purchase entry
    await purchaseEntry.save();

    // Send the response with the created delivery challan and purchase entry
    res.status(201).send({ deliveryChallan, purchaseEntry });
  } catch (error) {
    console.error(error);
    res.status(400).send(error);
  }
};


const updateDeliveryChallan = async (req, res) => {
  try {
    // Extracting new delivery challan from the request body
    const {
      id,
      entries: newEntries,
      type: newSendingCompany,
      party: newDataReceivingCompany,
      companyCode: newDataStoreOftheReceivingCompany,
      ledger: newDataLedger,
    } = req.body;

    // Fetch previous delivery challan
    const previousDeliveryChallan = await DeliveryChallanModel.findById(id);
    if (!previousDeliveryChallan) {
      return res.status(404).send("Previous Delivery Challan not found");
    }

    const {
      entries: previousEntries,
      type: previousDataSendingCompany,
      party: previousDataReceivingCompany,
      companyCode: previousDataStoreOftheReceivingCompany,
      ledger: previousDataLedger,
    } = previousDeliveryChallan;

    // Decrement stock for previous entries from the receiving store
    await Promise.all(
      previousEntries.map(async (previousEntry) => {
        const item = await ItemModel.findById(previousEntry.itemName);
        if (!item) {
          return;
        }
        const itemForStore = await ItemModel.findOne({
          companyCode: previousDataStoreOftheReceivingCompany,
          codeNo: item.codeNo,
        });
        if (!itemForStore) {
          return;
        }
        itemForStore.maximumStock -= previousEntry.qty;
        await itemForStore.updateOne(itemForStore);
      })
    );

    // Increment stock for previous entries from the sending store
    await Promise.all(
      previousEntries.map(async (previousEntry) => {
        const item = await ItemModel.findById(previousEntry.itemName);
        if (!item) {
          return;
        }
        const itemForStore = await ItemModel.findOne({
          companyCode: previousDataSendingCompany,
          codeNo: item.codeNo,
        });
        if (!itemForStore) {
          return;
        }
        itemForStore.maximumStock += previousEntry.qty;
        await itemForStore.updateOne(itemForStore);
      })
    );

    // Increment stock for new entries from the receiving store
    await Promise.all(
      newEntries.map(async (newEntry) => {
        const item = await ItemModel.findById(newEntry.itemName);
        if (!item) {
          return;
        }
        const itemForStore = await ItemModel.findOne({
          companyCode: newDataStoreOftheReceivingCompany,
          codeNo: item.codeNo,
        });
        if (!itemForStore) {
          return;
        }
        itemForStore.maximumStock += newEntry.qty;
        await itemForStore.updateOne(itemForStore);
      })
    );

    // Decrement stock for new entries from the sending store
    await Promise.all(
      newEntries.map(async (newEntry) => {
        const item = await ItemModel.findById(newEntry.itemName);
        if (!item) {
          return;
        }
        const itemForStore = await ItemModel.findOne({
          companyCode: newSendingCompany,
          codeNo: item.codeNo,
        });
        if (!itemForStore) {
          return;
        }
        itemForStore.maximumStock -= newEntry.qty;
        await itemForStore.updateOne(itemForStore);
      })
    );

    // Update delivery challan with new data
    const updatedDeliveryChallan = await DeliveryChallanModel.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true }
    );

    if (!updatedDeliveryChallan) {
      return res.status(404).send("Inward Challan not found for update");
    }

    res.status(200).send(updatedDeliveryChallan);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send("An error occurred while updating the delivery challan");
  }
};

// For getting all inward challans
const getAllDeliveryChallans = async (req, res) => {
  try {
    const deliveryChallan = await DeliveryChallanModel.find();
    res.json({ success: true, data: deliveryChallan });
  } catch (error) {
    res.status(500).send(error);
  }
};

// For getting a single inward challan
const getDeliveryChallan = async (req, res) => {
  try {
    const deliveryChallan = await DeliveryChallanModel.findById(req.params.id);
    if (!deliveryChallan) {
      return res.status(404).send("Inward Challan not found");
    }
    res.status(200).send(deliveryChallan);
  } catch (error) {
    res.status(500).send(error);
  }
};

const getDeliveryChallanById = async (req, res) => {
  try {
    const deliveryChallan = await DeliveryChallanModel.findById(req.params.id);

    if (deliveryChallan) {
      res.json({ success: true, data: deliveryChallan });
    } else {
      res.json({ success: false, message: "deliveryChallan not found" });
    }
  } catch (ex) {
    res.json({ success: false, message: ex });
  }
};

// // For deleting a inward challan
// const deleteDeliveryChallan = async (req, res) => {
//   try {
//     console.log("req.params.id", req.params.id);

//     const deliveryChallanId = req.params.id;
//     const deliveryChallan = await DeliveryChallanModel.findById(
//       deliveryChallanId
//     );
//     console.log("deliveryChallan", deliveryChallan);

//     const newEntries = deliveryChallan.entries;
//     const newSendingCompany = deliveryChallan.type;
//     const newDataStoreOftheReceivingCompany = deliveryChallan.companyCode;

//     console.log("newSendingCompany", newSendingCompany);
//     console.log(
//       "newDataStoreOftheReceivingCompany",
//       newDataStoreOftheReceivingCompany
//     );

//     // Decrement stock for new entries from the receiving store
//     await Promise.all(
//       newEntries.map(async (newEntry) => {
//         const item = await ItemModel.findById(newEntry.itemName);
//         if (!item) {
//           return;
//         }
//         const itemForStore = await ItemModel.findOne({
//           companyCode: newDataStoreOftheReceivingCompany,
//           codeNo: item.codeNo,
//         });
//         if (!itemForStore) {
//           return;
//         }
//         itemForStore.maximumStock -= newEntry.qty;
//         await itemForStore.updateOne(itemForStore);
//       })
//     );

//     // Increment stock for new entries from the sending store
//     await Promise.all(
//       newEntries.map(async (newEntry) => {
//         const item = await ItemModel.findById(newEntry.itemName);
//         if (!item) {
//           return;
//         }
//         const itemForStore = await ItemModel.findOne({
//           companyCode: newSendingCompany,
//           codeNo: item.codeNo,
//         });
//         if (!itemForStore) {
//           return;
//         }
//         itemForStore.maximumStock += newEntry.qty;
//         await itemForStore.updateOne(itemForStore);

//         // If maximumStock is 0, delete the item
//         if (itemForStore.maximumStock === 0) {
//           await ItemModel.findByIdAndDelete(itemForStore.id);
//         }
//       })
//     );

//     //  Delete the delivery challan
//     await DeliveryChallanModel.findByIdAndDelete(deliveryChallanId);

//     res.status(200).send("Delivery Challan deleted successfully");
//   } catch (error) {
//     res.status(500).send(error);
//   }
// };

const deleteDeliveryChallan = async (req, res) => {
  try {
    // Find the delivery challan by its ID
    const deliveryChallanId = req.params.id;
    const deliveryChallan = await DeliveryChallanModel.findById(deliveryChallanId);

    if (!deliveryChallan) {
      return res.status(404).send("Delivery Challan not found");
    }

    const reversePromises = deliveryChallan.entries.map(async (entry) => {

      const sendingItem = await ItemModel.findById(entry.itemName);

      if (!sendingItem) {
        throw new Error(`Item ${entry.itemName} not found in sending store`);
      }

      // Increment stock in the sending store (undo the decrement from creation)
      sendingItem.maximumStock += entry.qty;
      await sendingItem.save();
      console.log(
        `Incremented maximumStock by ${entry.qty} for item ${sendingItem._id} in sending store`
      );

      // Check if the item exists in the receiving store
      let receivingItem = await ItemModel.findOne({
        codeNo: sendingItem.codeNo,
        companyCode: deliveryChallan.companyCode,
      });

      if (!receivingItem) {
        console.warn(`Item with codeNo ${sendingItem.codeNo} not found in receiving store`);
        return; 
      }

      receivingItem.maximumStock -= entry.qty;
      if (receivingItem.maximumStock <= 0) {
        // If stock is zero or below, delete the item
        await ItemModel.findByIdAndDelete(receivingItem._id);
        console.log(`Deleted item ${receivingItem._id} from receiving store`);
      } else {
        // Otherwise, just save the decremented stock
        await receivingItem.save();
        console.log(
          `Decremented maximumStock by ${entry.qty} for item ${receivingItem._id} in receiving store`
        );
      }
    });

    await Promise.all(reversePromises);

    await DeliveryChallanModel.findByIdAndDelete(deliveryChallanId);

    await PurchaseModel.findOneAndDelete({
      no: deliveryChallan.no, companyCode: deliveryChallan.companyCode,
    });

    res.status(200).send("Delivery Challan deleted and stock reversed successfully");
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while deleting the delivery challan");
  }
};


module.exports = {
  createDeliveryChallan,
  getAllDeliveryChallans,
  getDeliveryChallan,
  getDeliveryChallanById,
  updateDeliveryChallan,
  deleteDeliveryChallan,
};
