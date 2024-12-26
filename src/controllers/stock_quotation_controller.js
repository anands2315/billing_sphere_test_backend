const StockQuotationModel = require("../models/sales_quotation_model");

const StockQuotationController = {

    createStockQuotation: async (req, res) => {
        try {
            const data = req.body;

            const stockQuotation = new StockQuotationModel(data);
            await stockQuotation.save();

            res.status(201).json({
                success: true,
                message: "Stock Quotation created successfully",
                data: stockQuotation,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    },

    getAllStockQuotation: async (req, res) => {
        try {
            const { companyCode } = req.query;
    
            const query = companyCode ? { companyCode } : {};
    
            const stockQuotation = await StockQuotationModel.find(query);
    
            res.status(200).json({
                success: true,
                data: stockQuotation,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    },
    

    getStockQuotationById: async (req, res) => {
        try {
            const { id } = req.params;

            const stockQuotation = await StockQuotationModel.findById(id);

            if (!stockQuotation) {
                return res.status(404).json({
                    success: false,
                    message: "Stock Quotation not found",
                });
            }

            res.status(200).json({
                success: true,
                data: stockQuotation,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    },

    updateStockQuotation: async (req, res) => {
        try {
            const { id } = req.params;
            const data = req.body;

            const updatedStockQuotation = await StockQuotationModel.findByIdAndUpdate(
                id,
                data,
                { new: true }
            );

            if (!updatedStockQuotation) {
                return res.status(404).json({
                    success: false,
                    message: "Stock Quotation not found",
                });
            }

            res.status(200).json({
                success: true,
                message: "Stock Quotation updated successfully",
                data: updatedStockQuotation,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    },

    deleteStockQuotation: async (req, res) => {
        try {
            const { id } = req.params;

            const deletedStockQuotation = await StockQuotationModel.findByIdAndDelete(id);

            if (!deletedStockQuotation) {
                return res.status(404).json({
                    success: false,
                    message: "Stock Quotation not found",
                });
            }

            res.status(200).json({
                success: true,
                message: "Stock Quotation deleted successfully",
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    },
};

module.exports = StockQuotationController;
