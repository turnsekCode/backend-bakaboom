import orderModel from "../models/orderModel.js";
import Stripe from "stripe";
import axios from "axios";
import crypto from "crypto";

// global variables
const currency = "eur";
const deliveryCharge = 4;

const CLIENT_ID = process.env.SUMUP_CLIENT_ID;
const CLIENT_SECRET = process.env.SUMUP_CLIENT_SECRET;
const EMAIL_SECRET = process.env.SUMUP_CORREO;
// Stripe config
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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
    //console.log(error)
    res.json({ success: false, message: error.message });
  }
};

// placing orders using stripe metodo

const placeOrderStripe = async (req, res) => {
  try {
    const { items, amount, address, orderNumber, delivery_fee } = req.body;
    const { origin } = req.headers;

    // Verificar si el monto total supera el límite para envío gratis
    let adjustedDeliveryFee = delivery_fee;
    if (amount > 45) {
      adjustedDeliveryFee = 0; // Envío gratis si el monto es mayor a 45
    }

    const orderData = {
      items,
      address,
      orderNumber,
      delivery_fee: adjustedDeliveryFee,
      amount,
      paymentMethod: "Stripe",
      payment: false,
      date: Date.now(),
    };

    const newOrder = new orderModel(orderData);
    await newOrder.save();

    // Convertir el fee ajustado a centavos
    const deliveryFeeInCents = Math.round(adjustedDeliveryFee * 100);

    const line_items = items.map((item) => ({
      price_data: {
        currency: currency, // Asegúrate de usar la moneda correcta
        product_data: {
          name: item.name,
        },
        unit_amount: Math.round(item.price * 100), // Convertir a centavos
      },
      quantity: item.quantity,
    }));

    // Agregar el cargo de envío (solo si no es gratis)
    if (adjustedDeliveryFee > 0) {
      line_items.push({
        price_data: {
          currency: currency, // Asegúrate de usar la moneda correcta
          product_data: {
            name: "Delivery Charge",
          },
          unit_amount: deliveryFeeInCents, // Fee convertido a entero en centavos
        },
        quantity: 1,
      });
    } else {
      console.log("Envío gratis aplicado");
    }

    const session = await stripe.checkout.sessions.create({
      success_url: `${origin}/verify?success=true&orderId=${newOrder._id}`,
      cancel_url: `${origin}/verify?success=false&orderId=${newOrder._id}`,
      line_items,
      mode: "payment",
    });

    res.json({ success: true, session_url: session.url });
  } catch (error) {
    //console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Verify order after payment
const verifyOrder = async (req, res) => {
  const { orderId, success } = req.body;
  //console.log("req.body", req.body);  // Verifica que los datos estén llegando

  try {
    if (success === "true") {
      await orderModel.findByIdAndUpdate(orderId, { payment: true });
      res.json({ success: true, message: "Order placed successfully" });
    } else {
      await orderModel.findByIdAndDelete(orderId);
      res.json({ success: false, message: "Order failed" });
    }
  } catch (error) {
    //console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const placeOrderSumUp = async (req, res) => {
  try {
    const { amount, orderNumber } = req.body;
    //console.log("📝 Recibido:", req.body);

    // Obtener token de acceso de SumUp
    //console.log("🔑 Obteniendo token de acceso de SumUp...");
    const authResponse = await axios.post(
      "https://api.sumup.com/token",
      new URLSearchParams({
        grant_type: "client_credentials",
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } },
    );

    //console.log("🔐 Token recibido:", authResponse.data);
    const accessToken = authResponse.data.access_token;
    //console.log("🔐 Token recibido:", authResponse.data);
    // Crear el checkout en SumUp
    //console.log("💳 Creando checkout en SumUp...");
    const checkoutResponse = await axios.post(
      "https://api.sumup.com/v0.1/checkouts",
      {
        amount,
        currency: "EUR",
        checkout_reference: orderNumber,
        return_url: "http://localhost:4000/webhook/sumup",
        pay_to_email: EMAIL_SECRET,
        returnUrl: "https://frontend-bakaboom.vercel.app/success",
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    //console.log("✅ Checkout creadoo:", checkoutResponse.data);

    // 🔹 Devolver también el ID de la orden creada
    res.json({
      checkoutToken: checkoutResponse.data,
    });
  } catch (error) {
    console.error("❌ Error en el proceso:", error);
    res.status(500).json({ error: "Error al crear el checkout" });
  }
};

// Verify order after payment
const verifyOrderSumUp = async (req, res) => {
  try {
    const { checkoutId, orderData, orderCancel } = req.body;
    const { items, amount, address, orderNumber, delivery_fee } = orderData;

    //console.log("📝 Recibido orderCancel:", orderCancel);

    // Si orderCancel es true, no guardamos la orden y salimos temprano
    if (orderCancel) {
      return res.json({
        success: false,
        message: "El pago ha sido cancelado, no se guarda la orden.",
      });
    }

    let adjustedDeliveryFee = amount > 45 ? 0 : delivery_fee;

    // Si orderCancel es falso, creamos y guardamos la orden
    const newOrder = new orderModel({
      items,
      address,
      orderNumber,
      delivery_fee: adjustedDeliveryFee,
      amount,
      paymentMethod: "Sumup",
      payment: false,
      date: Date.now(),
    });

    await newOrder.save();

    //console.log("✅ Orden guardada con éxito:", newOrder._id);  // <-- Guardamos el ID
    let orderId = newOrder._id;

    // 🔹 Crear y guardar la orden en la base de datos
    //console.log("checkoutId", checkoutId);

    // Obtener token de acceso de SumUp
    const authResponse = await axios.post(
      "https://api.sumup.com/token",
      new URLSearchParams({
        grant_type: "client_credentials",
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } },
    );

    const accessToken = authResponse.data.access_token;

    // Obtener estado del pago desde SumUp
    const response = await axios.get(
      `https://api.sumup.com/v0.1/checkouts/${checkoutId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    //console.log("🔍 Estado del pago:", response.data);

    if (!orderId) {
      return res.status(400).json({ error: "Falta el ID de la orden" });
    }

    // Buscar la orden en la base de datos
    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: "Orden no encontrada" });
    }

    if (response.data.status === "PAID") {
      // ✅ Marcar orden como pagada
      await orderModel.findByIdAndUpdate(orderId, { payment: true });
      res.json({ success: true, message: "Pago confirmado" });
    } else if (response.data.status === "FAILED") {
      // ❌ Eliminar la orden si el pago falló
      await orderModel.findByIdAndDelete(orderId);
      res.json({
        success: false,
        message: "Hubo un problema al procesar el pago",
      });
    } else {
      res.json({ status: "PENDING", message: "Pago en proceso" });
    }
  } catch (error) {
    console.error("❌ Error al verificar el pago:", error);
    res.status(500).json({ error: "Error al verificar el pago" });
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

    console.log("\n========== REDSYS DEBUG ==========\n");

    console.log("REDSYS_SECRET_KEY:", process.env.REDSYS_SECRET_KEY);

    console.log("REDSYS_MERCHANT_CODE:", process.env.REDSYS_MERCHANT_CODE);

    console.log("REDSYS_TERMINAL:", process.env.REDSYS_TERMINAL);

    console.log("REDSYS_URL:", process.env.REDSYS_URL);

    console.log("\nTOTAL AMOUNT:", totalAmount);

    console.log("\nREDSYS ORDER:", redsysOrder);

    console.log("\nMERCHANT PARAMETERS OBJECT:");

    console.log(JSON.stringify(merchantParameters, null, 2));

    console.log("\nMERCHANT PARAMETERS BASE64:");

    console.log(merchantParametersBase64);

    // signature

    const signature = createSignature(
      process.env.REDSYS_SECRET_KEY,
      redsysOrder,
      merchantParametersBase64,
    );
    console.log("\nSIGNATURE:");

    console.log(signature);

    console.log("\n========== END REDSYS DEBUG ==========\n");

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
    console.log(error);

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
      await orderModel.findByIdAndUpdate(orderId, { payment: true });

      res.json({
        success: true,
        message: "Pago realizado",
      });
    } else {
      await orderModel.findByIdAndDelete(orderId);

      res.json({
        success: false,
        message: "Pago cancelado",
      });
    }
  } catch (error) {
    console.log(error);

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
    //console.log(error)
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
    //console.log(error)
    res.json({ success: false, message: error.message });
  }
};

export {
  placeOrder,
  placeOrderStripe,
  allOrders,
  userOrders,
  updateStatus,
  verifyOrder,
  placeOrderSumUp,
  verifyOrderSumUp,
  // REDSYS
  placeOrderRedsys,
  verifyOrderRedsys,
};
