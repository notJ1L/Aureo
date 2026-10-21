const Order = require("../models/order");
const Product = require("../models/product");
const Appraisal = require("../models/appraisal");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../utils/catchAsyncErrors");

// FR 4.4: the admin dashboard aggregates the sales, the expenses, the order
// counts and the current inventory. The date range filter narrows the sales
// figures and the chart.
const getDashboard = catchAsyncErrors(async (req, res, next) => {
    const { from, to } = req.query;

    const dateFilter = {};

    if (from) {
        const fromDate = new Date(from);

        if (Number.isNaN(fromDate.getTime())) {
            return next(new ErrorHandler("The from date is not valid", 400));
        }

        dateFilter.$gte = fromDate;
    }

    if (to) {
        const toDate = new Date(to);

        if (Number.isNaN(toDate.getTime())) {
            return next(new ErrorHandler("The to date is not valid", 400));
        }

        // The whole end day is included.
        toDate.setHours(23, 59, 59, 999);
        dateFilter.$lte = toDate;
    }

    const hasDateFilter = Object.keys(dateFilter).length > 0;

    // Sales: the total of the orders that are paid or later.
    const soldStatuses = ["Paid", "Shipped", "Completed"];

    const salesOrders = await Order.find(
        hasDateFilter
            ? { status: { $in: soldStatuses }, createdAt: dateFilter }
            : { status: { $in: soldStatuses } }
    ).select("orderItems status createdAt");

    const sales = salesOrders.reduce((total, order) => {
        return (
            total +
            order.orderItems.reduce(
                (sum, item) => sum + item.price * item.quantity,
                0
            )
        );
    }, 0);

    // Expenses: the accepted appraisal offers (assumption 1, the service costs
    // stay excluded until a service cost field exists).
    const expenses = await Appraisal.find({ status: "Accepted" }).select(
        "offerPrice"
    );

    const totalExpenses = expenses.reduce(
        (sum, appraisal) => sum + (Number(appraisal.offerPrice) || 0),
        0
    );

    // Orders: the count per status.
    const allOrders = await Order.find().select("status createdAt");

    const orderCounts = {
        Pending: 0,
        Paid: 0,
        Shipped: 0,
        Completed: 0,
        Cancelled: 0
    };

    const scopedOrders = hasDateFilter
        ? allOrders.filter((order) => {
              const created = new Date(order.createdAt).getTime();
              return (
                  (!dateFilter.$gte || created >= dateFilter.$gte.getTime()) &&
                  (!dateFilter.$lte || created <= dateFilter.$lte.getTime())
              );
          })
        : allOrders;

    scopedOrders.forEach((order) => {
        if (orderCounts[order.status] !== undefined) {
            orderCounts[order.status] += 1;
        }
    });

    // Inventory: the active products and the units that are in stock.
    const activeProducts = await Product.find({ isActive: true }).select(
        "condition stock"
    );

    const inventory = {
        totalProducts: activeProducts.length,
        inStock: activeProducts.filter((product) => product.stock > 0).length,
        newWatches: activeProducts.filter(
            (product) => product.condition === "new"
        ).length,
        secondHandWatches: activeProducts.filter(
            (product) => product.condition === "second-hand"
        ).length,
        totalUnits: activeProducts.reduce(
            (sum, product) => sum + product.stock,
            0
        )
    };

    // The chart series: the sales per month of the selected range.
    const monthlySalesMap = new Map();

    salesOrders.forEach((order) => {
        const date = new Date(order.createdAt);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

        const total = order.orderItems.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
        );

        monthlySalesMap.set(key, (monthlySalesMap.get(key) || 0) + total);
    });

    const monthlySales = Array.from(monthlySalesMap.entries())
        .map(([month, total]) => ({ month, total }))
        .sort((a, b) => a.month.localeCompare(b.month));

    res.status(200).json({
        success: true,
        range: {
            from: from || null,
            to: to || null
        },
        sales,
        expenses: totalExpenses,
        profit: sales - totalExpenses,
        orderCounts,
        totalOrders: scopedOrders.length,
        inventory,
        monthlySales
    });
});

module.exports = { getDashboard };
