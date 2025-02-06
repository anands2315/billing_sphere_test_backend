const mongoose = require("mongoose");

const SalesReturnSchema = new mongoose.Schema({
    no: {
        type: String,
        required: true,
    },
    companyCode: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        required: true,
    },
    date: {
        type: String,
        required: true,
    },
    date2: {
        type: String,
        required: true,
    },
    place: {
        type: String,
        required: true,
    },
    billNumber: { type: String, required: true },
    ledger: {
        type: mongoose.Schema.ObjectId,
        ref: "Ledger",
        required: true,
    },
    remarks: {
        type: String,
    },
    totalAmount: {
        type: String,
        required: true,
    },
    cashAmount: {
        type: String,
    },
    entries: [
        {
            itemName: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Items",
                required: [true, "Please provide a item name for this sales entry."],
            },
            qty: {
                type: Number,
                required: [true, "Please provide a quantity for this sales entry."],
            },
            rate: {
                type: Number,
                required: [true, "Please provide a rate for this sales entry."],
            },
            unit: {
                type: String,
                required: [true, "Please provide a unit for this sales entry."],
            },
            amount: {
                type: Number,
                required: [true, "Please provide a amount for this sales entry."],
            },
            tax: {
                type: String,
                required: [true, "Please provide a tax for this sales entry."],
            },
            sgst: {
                type: Number,
                required: [true, "Please provide a sgst for this sales entry."],
            },
            cgst: {
                type: Number,
                required: [true, "Please provide a cgst for this sales entry."],
            },
            discount: {
                type: Number,
                required: [true, "Please provide a cgst for this sales entry."],
            },
            igst: {
                type: Number,
                required: [true, "Please provide a igst for this sales entry."],
            },
            netAmount: {
                type: Number,
                required: [true, "Please provide a net amount for this sales entry."],
            },
            sellingPrice: {
                type: Number,
                required: [
                    true,
                    "Please provide a selling price for this sales entry.",
                ],
            },
        },
    ],
    billwise: [
        {
            date: {
                type: String,
                required: true,
            },
            salesBill: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "salesBill",
                required: false,
            },
            billType: {
                type: String,
                required: true,
            },
            billName: {
                type: String,
                required: false,
            },
            amount: {
                type: Number,
                required: false,
            },
            dueDate: {
                type: String,
                required: true,
              },
        },
    ],
    sundry: [
        {
          sundryName: {
            type: String,
            required: [true, "Please provide a ledger for this sales entry."],
          },
          amount: {
            type: Number,
            required: [true, "Please provide a amount for this sales entry."],
          },
        },
      ],
});

SalesReturnSchema.path('billwise').required(false);

const SalesReturnModel = mongoose.model("SalesReturn",SalesReturnSchema);

module.exports = SalesReturnModel;
