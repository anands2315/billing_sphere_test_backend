const mongoose = require('mongoose');

const PurchaseBillSchema = new mongoose.Schema({
    companyCode: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required:true,
    },
    type: {
        type: String,
        required: true,
    },
    ref: {
        
    },
    totalAmount: {
        type: String
    },
    cashAmount: { type: String },
    dueAmount: { type: String },
    roundoffDiff: { type: Number, default: "0.00" },
});

const PurchaseBillModel = mongoose.model("purchaseBill",PurchaseBillSchema);
module.exports = PurchaseBillModel;