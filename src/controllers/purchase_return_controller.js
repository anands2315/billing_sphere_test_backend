const PurchaseReturnModel = require("../models/purchase_return_model");
const Items = require("../models/items_model");
const Ledger = require("../models/ledger_model");

const PurchaseReturnController = {

    createPurchaseReturn: async function (req, res) {
    const session = await mongoose.startSession(); 
    session.startTransaction(); 

    try {
        const purchaseReturnData = req.body;
        purchaseReturnData.totalAmount = parseFloat(purchaseReturnData.totalAmount);
        purchaseReturnData.cashAmount = parseFloat(purchaseReturnData.cashAmount);
        
        const newPurchaseReturnData = new PurchaseReturnModel(purchaseReturnData);

        const ledgerID = purchaseReturnData.ledger;
        const purchaseType = purchaseReturnData.type;

        if (purchaseType === "Debit") {
            const ledger = await Ledger.findById(ledgerID).session(session);
            if (!ledger) {
                throw new Error("Ledger not found.");
            }
            ledger.debitBalance += purchaseReturnData.totalAmount;
            await ledger.save({ session }); 
        }

        if (purchaseType === "Cash") {
            newPurchaseReturnData.cashAmount = purchaseReturnData.totalAmount;
        }

        const existingPurchase = await PurchaseReturnModel.findOne({
            billNumber: req.body.billNumber,
        }).session(session);

        if (existingPurchase) {
            throw new Error("Bill No already exists.");
        }

        await newPurchaseReturnData.save({ session });

        for (const entry of purchaseReturnData.entries) {
            const productId = entry.itemName;
            const quantity = entry.qty;
            const sellingPrice = entry.sellingPrice;

            const product = await Items.findById(productId).session(session);

            if (!product) {
                throw new Error("Product not found.");
            }

            await Items.updateOne(
                { _id: productId },
                { $inc: { maximumStock: quantity }, price: sellingPrice },
                { session }
            );
        }

        await session.commitTransaction();
        session.endSession(); 

        return res.json({
            success: true,
            message: "Purchase Return entry created successfully!",
            data: newPurchaseReturnData,
        });
    } catch (ex) {
        await session.abortTransaction();
        session.endSession();
        return res.json({ success: false, message: ex.message });
    }
},


    getAllPurchaseReturn: async function (req, res) {
        try {
            const purchase = await PurchaseReturnModel.find({});
            return res.json({ success: true, data: purchase });
        } catch (ex) {
            return res.json({ success: false, message: ex });
        }
    },

    fetchAllPurchaseReturn: async function (req, res) {
        try {
          const { companyCode } = req.params;
          const fetchAllPurchase = await PurchaseReturnModel.find({
            companyCode: companyCode,
          });
          return res.json({ success: true, data: fetchAllPurchase });
        } catch (ex) {
          return res.json({ success: false, message: ex });
        }
      },
}

module.exports = PurchaseReturnController;
