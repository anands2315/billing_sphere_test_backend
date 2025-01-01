const mongoose = require("mongoose");

const StockShortageSchema = new mongoose.Schema({

    no: {
        type: String,
        required: true
    },
    companyCode: {
        type: String,
        required: true
    },
    date: {
        type: String,
        required: true,
    },
    ledger: {
        type: mongoose.Schema.ObjectId,
        ref: "Ledger",
        required: true,
    },
    place: {
        type: String,
    },
    remarks: {
        type: String,
    },
    totalAmount: {
        type: String,
    },
    roundoffDiff: { type: Number, default: "0.00" },
    entries: [
        {
            itemName: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Items",
                required: [true, "Please provide a item name for this entry."],
            },
            qty: {
                type: Number,
                required: [true, "Please provide a quantity for this entry."],
            },
            rate: {
                type: Number,
                required: [true, "Please provide a rate for this entry."],
            },
            unit: {
                type: String,
                required: [true, "Please provide a unit for this  entry."],
            },
            amount: {
                type: Number,
                required: [true, "Please provide a amount for this entry."],
            },
            tax: {
                type: String,
                required: [true, "Please provide a tax for this entry."],
            },
            sgst: {
                type: Number,
                required: [true, "Please provide a sgst for this entry."],
            },
            cgst: {
                type: Number,
                required: [true, "Please provide a cgst for this entry."],
            },
            discount: {
                type: Number,
                required: [true, "Please provide a cgst for this entry."],
            },
            igst: {
                type: Number,
                required: [true, "Please provide a igst for this entry."],
            },
            netAmount: {
                type: Number,
                required: [true, "Please provide a net amount for this entry."],
            },
            sellingPrice: {
                type: Number,
                required: [
                    true,
                    "Please provide a selling price for this entry.",
                ],
            },
        },
    ],
    sundry: [
        {
            sundryName: {
                type: String,
                required: [true, "Please provide a ledger for this entry."],
            },
            amount: {
                type: Number,
                required: [true, "Please provide a amount for this entry."],
            },
        },
    ],
});

const StockShortageModel = mongoose.model("StockShortage", StockShortageSchema);

module.exports = StockShortageModel;