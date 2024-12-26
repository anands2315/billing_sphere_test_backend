const mongoose = require("mongoose");

const StockPhysicalVerificationSchema = new mongoose.Schema({

    date: {
        type: String,
        required: true,
    },
    remarks: {
        type: String,
    },
    entries: [
        {
            itemGroup: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "ItemGroup",
                required: [true, "Please provide a item group for this sales entry."],
            },
            itemName: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Items",
                required: [true, "Please provide a item name for this sales entry."],
            },
            barcode: {
                type: String,
                // ref: "BarcodePrint",
                required: false,
            },
            rate: {
                type: Number,
                required: [true, "Please provide a rate for this sales entry."],
            },
            systQty: {
                type: Number,
                required: [true, "Please provide a System Quantity for this sales entry."],
            },
            systValue: {
                type: Number,
                required: [true, "Please provide a System Value for this sales entry."],
            },
            phyQty: {
                type: Number,
                required: [true, "Please provide a physical quantity for this sales entry."],
            },
            phyValue: {
                type: Number,
                required: [true, "Please provide a physical value for this sales entry."],
            },
            stkTaken: {
                type: String,
            },
            diffQty: {
                type: Number,
                required: [true, "Please provide a quantity difference for this sales entry."],
            },
            diffValue: {
                type: Number,
                required: [true, "Please provide a value difference for this sales entry."],
            },

        },
    ],

    totalSystQty: {
        type: Number,
        required: [true, "Please provide a total System Quantity for this sales entry."],
    },
    totalSystValue: {
        type: Number,
        required: [true, "Please provide a total System Quantity for this sales entry."],
    },
    totalPhyQty: {
        type: Number,
        required: [true, "Please provide a total System Quantity for this sales entry."],
    },
    totalPhyValue: {
        type: Number,
        required: [true, "Please provide a total System Quantity for this sales entry."],
    },
    totalDiffQty: {
        type: Number,
        required: [true, "Please provide a total System Quantity for this sales entry."],
    },
    totalDiffValue: {
        type: Number,
        required: [true, "Please provide a total System Quantity for this sales entry."],
    },
});

const StockPhysicalVerificationModel = mongoose.model("StockPhysicalVerification", StockPhysicalVerificationSchema);

module.exports = StockPhysicalVerificationModel;