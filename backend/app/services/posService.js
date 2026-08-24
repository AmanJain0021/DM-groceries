import mongoose from "mongoose";
import User from "../models/customer.js";
import Order from "../models/order.js";
import Product from "../models/product.js";
import Seller from "../models/seller.js";
import { generatePosReceiptNumber } from "../constants/posConstants.js";
import { reserveStockForItems } from "./stockService.js";
import { generateUniquePublicOrderId } from "./orderIdService.js";

export async function lookupOrCreateCustomer({ phone, name }) {
  let customer = await User.findOne({ phone });
  if (!customer) {
    customer = new User({
      phone,
      name: name || "Walk-in Customer",
      role: "user",
      isVerified: false,
    });
    await customer.save();
  }
  return customer;
}

export async function createPosOrder({
  sellerId,
  items,
  customerInput,
  paymentMode,
  cashReceived = 0,
  onlineAmountPaid = 0,
  discount = 0,
  discountType = "flat",
  note,
}) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const seller = await Seller.findById(sellerId).session(session);
    if (!seller) {
      const err = new Error("Seller not found");
      err.statusCode = 404;
      throw err;
    }

    let customerId = customerInput.customerId;
    let customerName = customerInput.name;
    let customerPhone = customerInput.phone;

    if (!customerId) {
      let customer = await User.findOne({ phone: customerPhone }).session(session);
      if (!customer) {
        customer = new User({
          phone: customerPhone,
          name: customerName || "Walk-in Customer",
          role: "user",
          isVerified: false,
        });
        await customer.save({ session });
      }
      customerId = customer._id;
      customerName = customer.name;
    }

    // Process items and calculate totals
    let productSubtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const productId = item.productId || item.id || item.product;
      const product = await Product.findById(productId).session(session);
      if (!product) {
        const err = new Error(`Product not found: ${productId}`);
        err.statusCode = 404;
        throw err;
      }

      const price = item.price || product.salePrice || product.price;
      const qty = item.quantity;
      productSubtotal += price * qty;

      orderItems.push({
        product: product._id,
        productId: product._id, // Needed for stock reservation
        name: product.name,
        quantity: qty,
        price: price,
        variantSlot: item.variantSku || item.variantSlot,
        variantSku: item.variantSku,
        image: product.mainImage,
      });
    }

    let discountTotal = 0;
    if (discount > 0) {
      if (discountType === "percentage") {
        discountTotal = (productSubtotal * discount) / 100;
      } else {
        discountTotal = discount;
      }
    }

    const grandTotal = productSubtotal - discountTotal;

    let changeReturned = 0;
    if (paymentMode === "CASH" || paymentMode === "MIXED") {
      const amountToCoverWithCash = paymentMode === "CASH" ? grandTotal : (grandTotal - onlineAmountPaid);
      changeReturned = Math.max(0, cashReceived - amountToCoverWithCash);
    }

    const orderId = await generateUniquePublicOrderId({ session });
    const receiptNumber = generatePosReceiptNumber();

    const order = new Order({
      orderId,
      orderType: "POS",
      customer: customerId,
      seller: sellerId,
      items: orderItems,
      address: {
        type: "Other",
        name: customerName || "Walk-in Customer",
        address: seller.shopName || "Shop Counter",
        city: seller.city || "",
        phone: customerPhone || seller.phone,
      },
      posMetadata: {
        walkInCustomerName: customerName,
        walkInCustomerPhone: customerPhone,
        cashReceived,
        changeReturned,
        onlineAmountPaid,
        receiptNumber,
        billedBy: sellerId,
        posPaymentMode: paymentMode, // Save original POS payment mode here for reference
      },
      paymentMode: paymentMode === "ONLINE" ? "ONLINE" : "COD",
      paymentStatus: "PAID",
      status: "delivered",
      orderStatus: "delivered",
      workflowStatus: "DELIVERED",
      settlementStatus: {
        overall: "COMPLETED",
        sellerPayout: "NOT_APPLICABLE",
        riderPayout: "NOT_APPLICABLE",
      },
      placement: { createdFrom: "POS" },
      paymentBreakdown: {
        productSubtotal,
        discountTotal,
        grandTotal,
        sellerPayoutTotal: grandTotal,
        codCollectedAmount:
          paymentMode === "CASH" || paymentMode === "MIXED"
            ? paymentMode === "CASH"
              ? grandTotal
              : cashReceived - changeReturned
            : 0,
      },
      note,
    });

    await reserveStockForItems({
      items: orderItems,
      sellerId,
      orderId: order.orderId,
      session,
      paymentMode,
    });

    await order.save({ session });

    await session.commitTransaction();
    session.endSession();

    return order;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
}

export async function getPosOrders(sellerId, { page = 1, limit = 20, search, fromDate, toDate, paymentMode }) {
  const query = { seller: sellerId, orderType: "POS" };

  if (search) {
    query["posMetadata.receiptNumber"] = { $regex: search, $options: "i" };
  }

  if (fromDate || toDate) {
    query.createdAt = {};
    if (fromDate) query.createdAt.$gte = new Date(fromDate);
    if (toDate) {
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
      query.createdAt.$lte = end;
    }
  }

  if (paymentMode) {
    query.paymentMode = paymentMode;
  }

  const total = await Order.countDocuments(query);
  const orders = await Order.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("customer", "name phone");

  return {
    orders,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getPosStats(sellerId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());

  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const stats = await Order.aggregate([
    { $match: { seller: new mongoose.Types.ObjectId(sellerId), orderType: "POS" } },
    {
      $facet: {
        today: [
          { $match: { createdAt: { $gte: today } } },
          { $group: { _id: null, revenue: { $sum: "$paymentBreakdown.grandTotal" }, count: { $sum: 1 } } }
        ],
        thisWeek: [
          { $match: { createdAt: { $gte: startOfWeek } } },
          { $group: { _id: null, revenue: { $sum: "$paymentBreakdown.grandTotal" }, count: { $sum: 1 } } }
        ],
        thisMonth: [
          { $match: { createdAt: { $gte: startOfMonth } } },
          { $group: { _id: null, revenue: { $sum: "$paymentBreakdown.grandTotal" }, count: { $sum: 1 } } }
        ]
      }
    }
  ]);

  return {
    today: {
      revenue: stats[0].today[0]?.revenue || 0,
      count: stats[0].today[0]?.count || 0
    },
    thisWeek: {
      revenue: stats[0].thisWeek[0]?.revenue || 0,
      count: stats[0].thisWeek[0]?.count || 0
    },
    thisMonth: {
      revenue: stats[0].thisMonth[0]?.revenue || 0,
      count: stats[0].thisMonth[0]?.count || 0
    }
  };
}
