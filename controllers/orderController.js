import orderModel from "../models/orderModel.js";
import crypto from "crypto";

// placing orders using COD metodo
const placeOrder = async (req, res) => {
  try {
    const { items, amount, address, orderNumber } = req.body;

    const orderData = {
      items,
      address,
      orderNumber,
      amount,
      paymentMethod: "WhatsApp",
      payment: false,
      date: Date.now(),
    };

    const newOrder = new orderModel(orderData);
    await newOrder.save();

    res.json({ success: true, message: "Order placed" });
  } catch (error) {
    ////console.log(error)
    res.json({ success: false, message: error.message });
  }
};

// Verify order after payment
const verifyOrder = async (req, res) => {
  const { orderId, success } = req.body;
  ////console.log("req.body", req.body);  // Verifica que los datos estén llegando

  try {
    if (success === "true") {
      await orderModel.findByIdAndUpdate(orderId, { payment: true });
      res.json({ success: true, message: "Order placed successfully" });
    } else {
      await orderModel.findByIdAndDelete(orderId);
      res.json({ success: false, message: "Order failed" });
    }
  } catch (error) {
    ////console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// =====================================
// REDSYS FUNCTIONS
// =====================================

// =====================================
// REDSYS FUNCTIONS (CORREGIDAS)
// =====================================

const encrypt3DES = (message, key) => {
  // 1. Redsys requiere que el mensaje sea múltiplo de 8 bytes (ZeroPadding)
  const cipherBuffer = Buffer.from(message, "utf8");
  const blockSize = 8;
  const paddingSize = blockSize - (cipherBuffer.length % blockSize);
  
  // Si no es múltiplo de 8, añadimos bytes de ceros (0x00)
  const paddedBuffer = paddingSize < blockSize 
    ? Buffer.concat([cipherBuffer, Buffer.alloc(paddingSize, 0)]) 
    : cipherBuffer;

  const cipher = crypto.createCipheriv(
    "des-ede3-cbc",
    Buffer.from(key, "base64"),
    Buffer.alloc(8, 0), // IV lleno de ceros
  );

  // 2. IMPORTANTE: Desactivar el auto-padding de Node.js
  cipher.setAutoPadding(false);

  let encrypted = cipher.update(paddedBuffer, null, "base64");
  encrypted += cipher.final("base64");

  return encrypted;
};

const createSignature = (secretKey, order, merchantParameters) => {
  // Generar la clave única para este pedido
  const key = encrypt3DES(order, secretKey);

  // Crear el HMAC SHA256
  const hmac = crypto.createHmac("sha256", Buffer.from(key, "base64"));
  hmac.update(merchantParameters, "utf8");

  const digest = hmac.digest("base64");

  // 3. Convertir a Base64 URL Safe (Requisito de Redsys)
  return digest
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
};

// =====================================
// REDSYS PAYMENT
// =====================================

const placeOrderRedsys = async (req, res) => {
  try {
    const { items, amount, address, orderNumber, delivery_fee } = req.body;

    const { origin } = req.headers;

    // envio gratis

    let adjustedDeliveryFee = delivery_fee;

    if (amount > 45) {
      adjustedDeliveryFee = 0;
    }

    // crear orden

    const orderData = {
      items,
      address,
      orderNumber,

      delivery_fee: adjustedDeliveryFee,

      amount,

      paymentMethod: "Redsys",

      payment: false,

      date: Date.now(),
    };

    const newOrder = new orderModel(orderData);

    await newOrder.save();

    // Redsys amount in cents

    const totalAmount = Math.round(amount * 100);

    // Redsys order
    // max 12 chars

    const redsysOrder = "26" + Date.now().toString().slice(-10);

    // merchant params

    const merchantParameters = {
      DS_MERCHANT_AMOUNT: totalAmount.toString(),

      DS_MERCHANT_ORDER: redsysOrder,

      DS_MERCHANT_MERCHANTCODE: process.env.REDSYS_MERCHANT_CODE,

      DS_MERCHANT_CURRENCY: "978",

      DS_MERCHANT_TRANSACTIONTYPE: "0",

      DS_MERCHANT_TERMINAL: process.env.REDSYS_TERMINAL,

      DS_MERCHANT_MERCHANTURL: `${origin}/api/order/redsys/notification`,

      DS_MERCHANT_URLOK: `${origin}/verify?success=true&orderId=${newOrder._id}`,

      DS_MERCHANT_URLKO: `${origin}/verify?success=false&orderId=${newOrder._id}`,
    };

    // encode base64

    const merchantParametersBase64 = Buffer.from(
      JSON.stringify(merchantParameters),
    ).toString("base64");

    //console.log("\n========== REDSYS DEBUG ==========\n");

    //console.log("REDSYS_SECRET_KEY:", process.env.REDSYS_SECRET_KEY);

    //console.log("REDSYS_MERCHANT_CODE:", process.env.REDSYS_MERCHANT_CODE);

    //console.log("REDSYS_TERMINAL:", process.env.REDSYS_TERMINAL);

    //console.log("REDSYS_URL:", process.env.REDSYS_URL);

    //console.log("\nTOTAL AMOUNT:", totalAmount);

    //console.log("\nREDSYS ORDER:", redsysOrder);

    //console.log("\nMERCHANT PARAMETERS OBJECT:");

    //console.log(JSON.stringify(merchantParameters, null, 2));

    //console.log("\nMERCHANT PARAMETERS BASE64:");

    //console.log(merchantParametersBase64);

    // signature

    const signature = createSignature(
      process.env.REDSYS_SECRET_KEY,
      redsysOrder,
      merchantParametersBase64,
    );
    //console.log("\nSIGNATURE:");

    //console.log(signature);

    //console.log("\n========== END REDSYS DEBUG ==========\n");

    res.json({
      success: true,

      paymentData: {
        action: process.env.REDSYS_URL,

        Ds_SignatureVersion: "HMAC_SHA256_V1",

        Ds_MerchantParameters: merchantParametersBase64,

        Ds_Signature: signature,
      },
    });
  } catch (error) {
    //console.log(error);

    res.json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================
// VERIFY REDSYS
// =====================================

const verifyOrderRedsys = async (req, res) => {
  try {
    const { orderId, success } = req.body;

    if (success === "true") {
      const order = await orderModel.findByIdAndUpdate(
        orderId,
        { payment: true },
        { new: true } // 👈 IMPORTANTE: devuelve el pedido actualizado
      );
      //console.log("Orden actualizada:", order);
      return res.json({
        success: true,
        message: "Pago realizado",
        order, // 👈 AÑADIDO
      });
    } else {
      await orderModel.findByIdAndDelete(orderId);

      return res.json({
        success: false,
        message: "Pago cancelado",
      });
    }
  } catch (error) {
    //console.log(error);

    res.json({
      success: false,
      message: error.message,
    });
  }
};

// All orders using to admin panel

const allOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({});
    res.json({ success: true, orders });
  } catch (error) {
    ////console.log(error)
    res.json({ success: false, message: error.message });
  }
};

// User orders data for frontend

const userOrders = async (req, res) => {};

// update order status for admin panel

const updateStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;
    await orderModel.findOneAndUpdate({ _id: orderId }, { status });
    res.json({ success: true, message: "Order status updated" });
  } catch (error) {
    ////console.log(error)
    res.json({ success: false, message: error.message });
  }
};

export {
  placeOrder,
  allOrders,
  userOrders,
  updateStatus,
  verifyOrder,
  // REDSYS
  placeOrderRedsys,
  verifyOrderRedsys,
};
