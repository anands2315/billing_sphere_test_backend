const express = require("express");
const app = express();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const https = require("https");
const helmet = require("helmet");
const morgan = require("morgan");
const cors = require("cors");
const fs = require("fs");
const compression = require('compression');
// const key = fs.readFileSync("private.key");
// const cert = fs.readFileSync("certificate.crt");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(compression());
app.use(bodyParser.json({ limit: "10mb" }));
app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
require("dotenv").config();


// const cred = {
//   key,
//   cert,
// }


// src\index.js


mongoose
  .connect(
    // "mongodb://13.60.61.193:27017/BillingSphere2"
    // "mongodb+srv://johngospel003:LlJ6bdJ35zCzc53O@cluster0.efot3tr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    // "mongodb+srv://billingspherefuerte:VhjtujqeZDbYvn6o@billingsphere.sg7iac6.mongodb.net/billingSphere?retryWrites=true&w=majority"
    // "mongodb+srv://billingspherefuerte:ezMcxwF01Wk2Gv2C@cluster0.e4gsqkd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    "mongodb+srv://anandsinghfuerte:anandsingh2315@cluster0.maywh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    // "mongodb://fdsupermartbd:fuerteretail1313@35.154.157.177:27017/?authSource=test"
    // "mongodb+srv://anandsinghfuerte:anand2315@cluster0.b2kwc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
  )
  .then(() => {
    console.log("Connected to database");
  });


app.get('/', (res, req) => {
  res.send("Hello World")
});

const Items = require("./models/items_model");

// Find duplicate barcodes function
const findDuplicateBarcodes = async () => {
  try {
    const duplicates = await Items.aggregate([
      {
        $group: {
          _id: {
            barcode: "$barcode",
            companyCode: "$companyCode",
          },
          count: { $sum: 1 },
          items: { $push: "$_id" }, // Optional: to track item IDs
        },
      },
      {
        $match: {
          count: { $gt: 1 }, // Filter groups with more than 1 item
        },
      },
      {
        $project: {
          _id: 0, // Exclude MongoDB's default _id field
          barcode: "$_id.barcode",
          companyCode: "$_id.companyCode",
          count: 1,
          items: 1, // Include list of item IDs with the same barcode
        },
      },
    ]);

    return duplicates;
  } catch (error) {
    console.error("Error finding duplicate barcodes:", error);
    throw error;
  }
};

// Expose the findDuplicateBarcodes function as an API endpoint
app.get("/api/items/duplicates", async (req, res) => {
  try {
    const duplicates = await findDuplicateBarcodes();
    res.status(200).json({ success: true, data: duplicates });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error finding duplicates", error });
  }
});



//Routes for creating User
const UserRoutes = require("./routes/user_routes");
app.use("/api/user", UserRoutes);
//Routes for creating product category
const ProductCategoryRoutes = require("./routes/product_category_routes");
app.use("/api/productCategory", ProductCategoryRoutes);

//Routes for hsn code
const HsnCodeRoutes = require("./routes/hsn_code_routes");
app.use("/api/hsnCode", HsnCodeRoutes);
//Routes for measurement limit
const MeasurementLimitRoutes = require("./routes/measurement_limit_routes");
app.use("/api/measurementLimit", MeasurementLimitRoutes);
//Routes for Store location
const StoreLocationRoutes = require("./routes/store_location_routes");
app.use("/api/store", StoreLocationRoutes);
//Routes for tax
const TaxRoutes = require("./routes/tax_routes");
app.use("/api/tax", TaxRoutes);
//Routes for secondary unit
const SecondaryUnitRoutes = require("./routes/secondary_unit_routes");
app.use("/api/secondaryUnit", SecondaryUnitRoutes);

//Routes for price Types
const PriceTypeRoutes = require("./routes/price_type_routes");
app.use("/api/price", PriceTypeRoutes);

//Routes for products
const ProductRoutes = require("./routes/product_routes");
app.use("/api/product", ProductRoutes);

//Routes for Sundry
const SundryRoutes = require("./routes/sundry_routes");
app.use("/api/sundry", SundryRoutes);

//Routes for Ledger
const LedgerRoutes = require("./routes/ledger_routes");
app.use("/api/ledger", LedgerRoutes);

//Routes for Ledger Group
const LedgerGroupRoutes = require("./routes/ledger_group_routes");
app.use("/api/ledger-group", LedgerGroupRoutes);

//Routes for purchasing
const PurchaseRoutes = require("./routes/purchase_routes");
app.use("/api/purchase", PurchaseRoutes);

//Routes for purchase return
const PurchaseReturnRoutes = require("./routes/purchase_return_routes");
app.use("/api/purchase-return",PurchaseReturnRoutes);

//Routes for purchase bills
const PurchaseBillRoutes = require("./routes/purchase_bills_routes");
app.use("/api/purchase-bills",PurchaseBillRoutes);

//Routes for Product Stock
const ProductStockRoutes = require("./routes/product_stock_routes");
app.use("/api/product-stock", ProductStockRoutes);

//Routes for sales
const SalesRoutes = require("./routes/sales_entry_routes");
app.use("/api/sales", SalesRoutes);

//Routes for sales return
const SalesReturnRoutes = require("./routes/sales_return_routes");
app.use("/api/sales-return",SalesReturnRoutes);

//Routes for sales bill
const SalesBillRoutes = require("./routes/sales_bill_routes");
app.use("/api/sales-bill",SalesBillRoutes);

//Routes for items
const ItemRoutes = require("./routes/items_routes");
app.use("/api/items", ItemRoutes);

//Routes for items group
const ItemGroupRoutes = require("./routes/item_group_routes");
app.use("/api/item-group", ItemGroupRoutes);

//Routes for items brand
const ItemBrandRoutes = require("./routes/item_brand_routes");
app.use("/api/item-brand", ItemBrandRoutes);

// Routes for testing Images
// const TestRoutes = require("./routes/test_route");
// app.use("/api/test", TestRoutes);
//Routes for receiveable
const ReceiveableRoutes = require("./routes/receiveable_adjustment_routes");
app.use("/api/receiveable", ReceiveableRoutes);

//Routes for payable
const PayableRoutes = require("./routes/payable_adjustment_routes");
app.use("/api/payable", PayableRoutes);

//Routes for payment
const PaymentRoutes = require("./routes/payment_routes");
app.use("/api/payment", PaymentRoutes);

//Routes for user group
const UserGroupRoutes = require("./routes/user_group_routes");
app.use("/api/user-group", UserGroupRoutes);

//Routes for company
const CompanyRoutes = require("./routes/new_company_routes");
app.use("/api/company", CompanyRoutes);

// Routes for barcode print
const BarcodePrintRoutes = require("./routes/barcode_print_routes");
app.use("/api/barcode-print", BarcodePrintRoutes);

//Routes for receipt
const ReceiptVoucherRoutes = require("./routes/receipt_voucher_routes");
app.use("/api/receipt-voucher", ReceiptVoucherRoutes);

// Routes for inward challan
const InwardChallanRoutes = require("./routes/inward_challan_routes");
app.use("/api/inward-challan", InwardChallanRoutes);

// Routes for delivery challan
const DeliveryChallanRoutes = require("./routes/delivery_challan_routes");
app.use("/api/delivery-challan", DeliveryChallanRoutes);

// Routes for sales pos
const SalesPosRoutes = require("./routes/sales_pos_routes");
app.use("/api/sales-pos", SalesPosRoutes);

const DailyCashRoutes = require("./routes/daily_cash_routes");
app.use("/api/daily-cash", DailyCashRoutes);

const ExcelRoutes = require("./routes/excel_routes");
app.use("/api/excel", ExcelRoutes);

// Routes for New Customer
const NewCustomerRoutes = require("./routes/new_customer_routes");
app.use("/api/new-customer", NewCustomerRoutes);

// Routes for New SalesMan
const NewSalesManRoutes = require("./routes/new_sales_man_routes");
app.use("/api/new-salesman", NewSalesManRoutes);

const PORT = 4567;
app.listen(PORT, () => console.log(`Server started at PORT: ${PORT}`));

// const httpsServer = https.createServer(cred, app);
// httpsServer.listen(8443, () => {
//   console.log("HTTPS Server running on port 443");
// });

