const mongoose = require('mongoose');

const PurchaseBillSchema = new mongoose.Schema({
    date: { type: String, required: true },
    companyCode: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        required: true,
    },
    ledger: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Ledger",
        required: true,
    },
    ref: { type: mongoose.Schema.Types.ObjectId, required: true },
    totalAmount: {
        type: String
    },
    dueAmount: { type: String },
    dueDate : {
        type: String,
        required: true,
    }
});

const PurchaseBillModel = mongoose.model("purchaseBill", PurchaseBillSchema);
module.exports = PurchaseBillModel;