const StockPhysicalVerificationModel = require("../models/stock_physical_verification_model");

const StockPhysicalVerificationController = {

    createStockPhysicalVerification: async (req, res) => {
        try {
            const data = req.body;

            const stockQuotation = new StockPhysicalVerificationModel(data);
            await stockQuotation.save();

            res.status(201).json({
                success: true,
                message: "Stock Physical Verification created successfully",
                data: stockQuotation,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    },

    getAllStockPhysicalVerification: async (req, res) => {
        try {
            const { companyCode } = req.query;
    
            const query = companyCode ? { companyCode } : {};
    
            const stockQuotation = await StockPhysicalVerificationModel.find(query);
    
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
    

    getStockPhysicalVerificationById: async (req, res) => {
        try {
            const { id } = req.params;

            const stockQuotation = await StockPhysicalVerificationModel.findById(id);

            if (!stockQuotation) {
                return res.status(404).json({
                    success: false,
                    message: "Stock Physical Verification not found",
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

    updateStockPhysicalVerification: async (req, res) => {
        try {
            const { id } = req.params;
            const data = req.body;

            const updatedStockPhysicalVerification = await StockPhysicalVerificationModel.findByIdAndUpdate(
                id,
                data,
                { new: true }
            );

            if (!updatedStockPhysicalVerification) {
                return res.status(404).json({
                    success: false,
                    message: "Stock Physical Verification not found",
                });
            }

            res.status(200).json({
                success: true,
                message: "Stock Physical Verification updated successfully",
                data: updatedStockPhysicalVerification,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    },

    deleteStockPhysicalVerification: async (req, res) => {
        try {
            const { id } = req.params;

            const deletedStockPhysicalVerification = await StockPhysicalVerificationModel.findByIdAndDelete(id);

            if (!deletedStockPhysicalVerification) {
                return res.status(404).json({
                    success: false,
                    message: "Stock Physical Verification not found",
                });
            }

            res.status(200).json({
                success: true,
                message: "Stock Physical Verification deleted successfully",
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    },
};

module.exports = StockPhysicalVerificationController;
