const mongoose = require("mongoose");

const SalesBillSchema = new mongoose.Schema({
    date: {
        type: String,
        required: true,
    },
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
        type: mongoose.Schema.ObjectId,
        required: true,
    },
    ref: {
        type: mongoose.Schema.ObjectId,
        required: true,
    },
    totalAmount: {
        type: String,
        required: true,
    },
    dueAmount: {
        type: String,
        required: true,
    },
    dueDate : {
        type: String,
        required: true,
    }
})

const SalesBillModel =  mongoose.model("salesBill", SalesBillSchema);

module.exports = SalesBillModel;