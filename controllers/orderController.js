import orderModel from "../models/orderModel.js";
import crypto from "crypto";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "bakaboompublicidad@gmail.com",
    pass: "bfaf hvxc cwhc cilv",
  },
});

const sendPaymentFailedEmail = async (order, responseCode) => {
  try {
    await transporter.sendMail({
      from: "bakaboompublicidad@gmail.com",
      to: "bakaboompublicidad@gmail.com",
      bcc: "pixel.tech.t@gmail.com",

      subject: `⚠️ Pago fallido - Pedido ${order.orderNumber}`,

      html: `
        <h2>⚠️ Pago fallido</h2>

        <p>
          Redsys ha informado de un intento de pago.
        </p>

        <hr>

        <p>
          <strong>Número de pedido:</strong>
          ${order.orderNumber || "-"}
        </p>

        <p>
          <strong>ID interno:</strong>
          ${order._id}
        </p>

        <p>
          <strong>Pedido Redsys:</strong>
          ${order.redsysOrder || "-"}
        </p>

        <p>
          <strong>Importe:</strong>
          ${order.amount || 0}€
        </p>

        <p>
          <strong>Cliente:</strong>
          ${order.address?.name || "-"}
        </p>

        <p>
          <strong>Email:</strong>
          ${order.address?.email || "-"}
        </p>

        <p>
          <strong>Código de respuesta Redsys:</strong>
          ${responseCode}
        </p>

        <p>
          <strong>Fecha:</strong>
          ${new Date().toLocaleString("es-ES")}
        </p>
      `,
    });

    console.log(
      `Email de pago fallido enviado para el pedido ${order.orderNumber}`,
    );
  } catch (error) {
    console.error(
      "Error enviando email de pago fallido:",
      error,
    );
  }
};

const sendOrderEmail = async (order) => {
  try {
    const cartDetails = order.items || [];

    const shippingInfo = order.address || {};

    // El amount que guardas en Mongo es el total final.
    const total = Number(order.amount || 0);

    // El envío que guardaste al crear el pedido
    const shippingFee = Number(order.delivery_fee || 0);

    // Calculamos el subtotal a partir de los productos
    const subtotal = cartDetails.reduce(
      (sum, item) =>
        sum + Number(item.price || 0) * Number(item.quantity || 0),
      0
    );

    // En tu estructura actual no estás guardando discount.
    // Por ahora lo calculamos para que el total cuadre.
    const discount = Math.max(
      0,
      subtotal + shippingFee - total
    );

    const currency = "€";

    const paymentType = "Tarjeta";

    /*
    |--------------------------------------------------------------------------
    | HTML DEL EMAIL
    |--------------------------------------------------------------------------
    */

    const discountBlock =
      discount > 0
        ? `
          <tr>
            <td style="padding:10px 0;color:#16a34a;">
              Descuento aplicado
            </td>
            <td style="padding:10px 0;text-align:right;color:#16a34a;font-weight:bold;">
              -${discount.toFixed(2)}${currency}
            </td>
          </tr>
        `
        : "";

    const emailContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Gracias por tu compra</title>

      <style>
      body{
          margin:0;
          padding:0;
          background:#f4f6f9;
          font-family:Arial, Helvetica, sans-serif;
      }

      @media only screen and (max-width:600px){
          .container{
              width:100% !important;
          }

          .content{
              padding:20px !important;
          }

          .logo{
              max-width:120px !important;
          }

          .title{
              font-size:24px !important;
          }

          .table-responsive{
              display:block;
              overflow-x:auto;
              white-space:nowrap;
          }

          .product-image{
              width:50px !important;
              height:50px !important;
          }
      }
      </style>
      </head>

      <body>

      <table
        width="100%"
        cellpadding="0"
        cellspacing="0"
        border="0"
        style="background:#f4f6f9;padding:30px 10px;"
      >
      <tr>
      <td align="center">

      <table
        class="container"
        width="800"
        cellpadding="0"
        cellspacing="0"
        border="0"
        style="
          max-width:800px;
          width:100%;
          background:#ffffff;
          border-radius:18px;
          overflow:hidden;
          box-shadow:0 8px 25px rgba(0,0,0,.08);
        "
      >

      <tr>
      <td
        style="
          background:linear-gradient(135deg,#0368B2,#0A84E6);
          padding:40px 20px;
          text-align:center;
        "
      >

      <img
        class="logo"
        src="https://res.cloudinary.com/drb7svbxm/image/upload/v1778849353/logo_bakaboom_fwre6v.png"
        alt="Logo"
        style="
          max-width:150px;
          background:#fff;
          padding:12px;
          border-radius:12px;
        "
      />

      <h1
        class="title"
        style="
          color:#fff;
          margin:20px 0 10px;
          font-size:30px;
        "
      >
        ¡Gracias por tu compra!
      </h1>

      <p style="color:#e9f3ff;margin:0;font-size:16px;">
        Pedido #${order.orderNumber}
      </p>

      </td>
      </tr>

      <!-- CONTENIDO -->

      <tr>
      <td class="content" style="padding:35px;">

      <h2 style="margin-top:0;color:#2c3e50;">
        Hola ${shippingInfo?.name || ""} 👋
      </h2>

      <p style="font-size:16px;color:#555;line-height:1.8;">
        Muchas gracias por tu pedido.
        Estamos emocionados de que esta creación llegue a tus manos.
      </p>

      ${!order.envioPersonal
        ? `
          <div
            style="
              background:#f8fafc;
              border:1px solid #e5e7eb;
              border-radius:12px;
              padding:20px;
              margin:25px 0;
            "
          >

          <h3 style="margin-top:0;color:#0368B2;">
            📦 Dirección de envío
          </h3>

          <p style="margin:0;color:#555;line-height:1.7;">
            ${shippingInfo?.address || ""}<br>
            ${shippingInfo?.province || ""}<br>
            ${shippingInfo?.postalCode || ""}<br>
            ${shippingInfo?.country || ""}
          </p>

          </div>
          `
        : ""
      }

      <div
        style="
          background:#f8fafc;
          border:1px solid #e5e7eb;
          border-radius:12px;
          padding:20px;
          margin-bottom:25px;
        "
      >

      <h3 style="margin-top:0;color:#0368B2;">
        📞 Información de contacto
      </h3>

      <p style="margin:0;color:#555;">
        <strong>Teléfono:</strong>
        ${shippingInfo?.phone || "-"}
      </p>

      </div>

      <h3 style="color:#2c3e50;margin-bottom:15px;">
        🛍️ Detalles del pedido
      </h3>

      <div class="table-responsive">

      <table
        width="100%"
        cellpadding="0"
        cellspacing="0"
        style="
          border-collapse:collapse;
          border:1px solid #e5e7eb;
          border-radius:12px;
          overflow:hidden;
        "
      >

      <thead>

      <tr style="background:#0368B2;color:white;">

      <th style="padding:14px;text-align:left;">
        Producto
      </th>

      <th style="padding:14px;text-align:left;">
        Precio
      </th>

      <th style="padding:14px;text-align:left;">
        Imagen
      </th>

      <th style="padding:14px;text-align:left;">
        Color
      </th>

      <th style="padding:14px;text-align:left;">
        Talla
      </th>

      ${cartDetails.some(
        (item) =>
          item.anos !== null &&
          item.anos !== undefined &&
          item.anos !== ""
      )
        ? `
            <th style="padding:14px;text-align:left;">
              Años
            </th>
          `
        : ""
      }

      ${cartDetails.some(
        (item) => item.textPersonal?.trim()
      )
        ? `
            <th style="padding:14px;text-align:left;">
              Texto
            </th>
          `
        : ""
      }

      </tr>

      </thead>

      <tbody>

      ${cartDetails
        .map(
          (item) => `
            <tr style="border-bottom:1px solid #e5e7eb;">

            <td style="padding:15px;">
              <strong>${item.name || "-"}</strong><br>
              Cantidad: ${item.quantity || 0}
            </td>

            <td style="padding:15px;">
              ${Number(item.price || 0).toFixed(2)}${currency}
            </td>

            <td style="padding:15px;">

              <img
                class="product-image"
                src="${Array.isArray(item.image)
              ? item.image[0]
              : item.image || ""
            }"
                alt="${item.name || ""}"
                style="
                  width:60px;
                  height:60px;
                  object-fit:cover;
                  border-radius:10px;
                  border:1px solid #ddd;
                "
              />

            </td>

            <td style="padding:15px;">
              ${item.color || "-"}
            </td>

            <td style="padding:15px;">
              ${item.size || "-"}
            </td>

            ${item.anos !== null &&
              item.anos !== undefined &&
              item.anos !== ""
              ? `
                  <td style="padding:15px;">
                    ${item.anos}
                  </td>
                `
              : ""
            }

            ${item.textPersonal?.trim()
              ? `
                  <td style="padding:15px;">
                    ${item.textPersonal}
                  </td>
                `
              : ""
            }

            </tr>
          `
        )
        .join("")}

      </tbody>

      </table>

      </div>

      <div
        style="
          margin-top:30px;
          background:#fafafa;
          border:1px solid #ececec;
          border-radius:12px;
          padding:25px;
        "
      >

      <h3 style="margin-top:0;color:#2c3e50;">
        💳 Resumen de pago
      </h3>

      <table width="100%" cellpadding="0" cellspacing="0">

      <tr>

      <td style="padding:10px 0;">
        Subtotal
      </td>

      <td
        style="
          padding:10px 0;
          text-align:right;
          font-weight:bold;
        "
      >
        ${subtotal.toFixed(2)}${currency}
      </td>

      </tr>

      <tr>

      <td style="padding:10px 0;">
        Envío
      </td>

      <td
        style="
          padding:10px 0;
          text-align:right;
          font-weight:bold;
        "
      >
        ${shippingFee.toFixed(2)}${currency}
      </td>

      </tr>

      ${discountBlock}

      <tr>

      <td style="padding:10px 0;">
        Método de pago
      </td>

      <td
        style="
          padding:10px 0;
          text-align:right;
          font-weight:bold;
        "
      >
        ${paymentType}
      </td>

      </tr>

      <tr>

      <td colspan="2">

      <hr
        style="
          border:none;
          border-top:1px solid #ddd;
        "
      >

      </td>

      </tr>

      <tr>

      <td
        style="
          padding-top:15px;
          font-size:24px;
          font-weight:bold;
          color:#0368B2;
        "
      >
        Total
      </td>

      <td
        style="
          padding-top:15px;
          text-align:right;
          font-size:24px;
          font-weight:bold;
          color:#0368B2;
        "
      >
        ${total.toFixed(2)}${currency}
      </td>

      </tr>

      </table>

      </div>

      <div
        style="
          margin-top:25px;
          padding:20px;
          background:#eff6ff;
          border-left:5px solid #0368B2;
          border-radius:8px;
        "
      >

      <h3 style="margin-top:0;">
        🚚 Tiempo estimado de entrega
      </h3>

      <p style="margin-bottom:0;color:#555;">
        Entre 3 y 4 días laborables.
      </p>

      </div>

      <div style="text-align:center;margin-top:35px;">

      <a
        href="https://wa.me/630700424"
        target="_blank"
        style="
          background:#25D366;
          color:#fff;
          padding:15px 35px;
          border-radius:50px;
          text-decoration:none;
          font-weight:bold;
          display:inline-block;
          font-size:16px;
        "
      >
        💬 Contactar por WhatsApp
      </a>

      </div>

      <p
        style="
          margin-top:35px;
          font-size:16px;
          line-height:1.8;
          text-align:center;
          color:#555;
        "
      >
        No olvides compartirnos cómo usas tu nueva pieza.<br>
        ¡Nos encantará verla en acción! ❤️
      </p>

      </td>
      </tr>

      <tr>

      <td
        style="
          background:#f8fafc;
          padding:30px;
          text-align:center;
        "
      >

      <p
        style="
          margin:0;
          font-size:15px;
          color:#555;
          font-weight:bold;
        "
      >
        Gracias por confiar en nosotros
      </p>

      <p
        style="
          margin-top:10px;
          font-size:13px;
          color:#888;
        "
      >
        Si tienes cualquier duda estaremos encantados de ayudarte.
      </p>

      </td>

      </tr>

      </table>

      </td>
      </tr>
      </table>

      </body>
      </html>
    `;

    await transporter.sendMail({
      from: "bakaboompublicidad@gmail.com",
      to: shippingInfo?.email,
      bcc: "pixel.tech.t@gmail.com",
      subject: `Pedido realizado #${order.orderNumber}`,
      html: emailContent,
    });

    console.log(
      `Email de pedido enviado para ${order.orderNumber}`
    );

    return true;

  } catch (error) {
    console.error(
      `Error enviando email del pedido ${order.orderNumber}:`,
      error
    );

    return false;
  }
};

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
  const { orderId } = req.body;

  try {
    if (!orderId) {
      return res.json({
        success: false,
        message: "Order ID is required",
      });
    }

    const order = await orderModel.findById(orderId);

    if (!order) {
      return res.json({
        success: false,
        message: "Order not found",
      });
    }

    // El estado real del pago lo determina la notificación
    // servidor-a-servidor de Redsys.
    if (order.payment === true) {
      return res.json({
        success: true,
        message: "Pago realizado",
        order,
      });
    }

    // El pedido existe pero Redsys todavía no ha confirmado
    // el pago.
    return res.json({
      success: false,
      message: "Pago pendiente",
      paymentStatus: "pending",
      order,
    });

  } catch (error) {
    console.error("Error verificando el pedido:", error);

    return res.json({
      success: false,
      message: error.message,
    });
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

const validateRedsysSignature = (
  merchantParameters,
  redsysOrder,
  receivedSignature,
) => {
  try {
    const expectedSignature = createSignature(
      process.env.REDSYS_SECRET_KEY,
      redsysOrder,
      merchantParameters,
    );

    // Normalizar posibles diferencias de padding Base64
    const normalizedExpected = expectedSignature
      .replace(/=+$/, "");

    const normalizedReceived = receivedSignature
      .replace(/=+$/, "");

    return normalizedExpected === normalizedReceived;
  } catch (error) {
    console.error(
      "Error validando firma de Redsys:",
      error,
    );

    return false;
  }
};

// =====================================
// REDSYS PAYMENT
// =====================================

/*const placeOrderRedsys = async (req, res) => {
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
      redsysOrder,
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
};*/

const placeOrderRedsys = async (req, res) => {
  try {
    const {
      items,
      amount,
      address,
      orderNumber,
      delivery_fee,
      paymentMethod,
    } = req.body;

    const { origin } = req.headers;

    const origin_backend = "https://backend-bakaboom.vercel.app";

    // Generar una sola vez el número de pedido de Redsys
    const redsysOrder =
      "26" + Date.now().toString().slice(-10);

    // Envío gratis
    let adjustedDeliveryFee = delivery_fee;

    if (amount > 40) {
      adjustedDeliveryFee = 0;
    }

    // Crear orden
    const orderData = {
      items,
      address,
      orderNumber,

      // Guardamos el identificador de Redsys
      redsysOrder,

      delivery_fee: adjustedDeliveryFee,

      amount,

      paymentMethod: "card",

      payment: false,

      date: Date.now(),
    };

    const newOrder = new orderModel(orderData);

    await newOrder.save();

    // Importe en céntimos
    const totalAmount = Math.round(amount * 100);

    const merchantParameters = {
      DS_MERCHANT_AMOUNT: totalAmount.toString(),

      DS_MERCHANT_ORDER: redsysOrder,

      DS_MERCHANT_MERCHANTCODE:
        process.env.REDSYS_MERCHANT_CODE,

      DS_MERCHANT_CURRENCY: "978",

      DS_MERCHANT_TRANSACTIONTYPE: "0",

      DS_MERCHANT_TERMINAL:
        process.env.REDSYS_TERMINAL,

      // Notificación servidor-servidor
      DS_MERCHANT_MERCHANTURL:
        `${origin_backend}/api/order/redsys/notification`,

      // Redirecciones del usuario
      DS_MERCHANT_URLOK:
        `${origin}/verify?success=true&orderId=${newOrder._id}`,

      DS_MERCHANT_URLKO:
        `${origin}/verify?success=false&orderId=${newOrder._id}`,

      ...(paymentMethod === "bizum"
        ? { DS_MERCHANT_PAYMETHODS: "z" }
        : {})
    };

    const merchantParametersBase64 = Buffer.from(
      JSON.stringify(merchantParameters),
    ).toString("base64");

    const signature = createSignature(
      process.env.REDSYS_SECRET_KEY,
      redsysOrder,
      merchantParametersBase64,
    );
    console.log("========== REDSYS ==========");
    console.log("MerchantURL:", `${origin_backend}/api/order/redsys/notification`);
    console.log("Order:", redsysOrder);
    console.log("Amount:", Math.round(amount * 100));
    console.log("============================");

    res.json({
      success: true,

      paymentData: {
        action: process.env.REDSYS_URL,

        Ds_SignatureVersion:
          "HMAC_SHA256_V1",

        Ds_MerchantParameters:
          merchantParametersBase64,

        Ds_Signature: signature,
      },
    });
  } catch (error) {
    console.error(error);

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
    const { orderId } = req.body;

    const order = await orderModel.findById(
      orderId
    );

    if (!order) {
      return res.json({
        success: false,
        message: "Pedido no encontrado",
      });
    }

    return res.json({
      success: order.payment === true,
      message: order.payment
        ? "Pago realizado"
        : "Pago pendiente",
      order,
    });

  } catch (error) {

    console.error(
      "Error consultando pedido Redsys:",
      error
    );

    return res.json({
      success: false,
      message: error.message,
    });
  }
};

const redsysNotification = async (req, res) => {
  try {
    const {
      Ds_MerchantParameters,
      Ds_Signature,
    } = req.body;

    if (
      !Ds_MerchantParameters ||
      !Ds_Signature
    ) {
      return res.status(400).send(
        "Missing parameters"
      );
    }

    // =====================================================
    // 1. DECODIFICAR PARÁMETROS
    // =====================================================

    const decodedParameters = Buffer.from(
      Ds_MerchantParameters,
      "base64"
    ).toString("utf8");

    const redsysData = JSON.parse(
      decodedParameters
    );

    // =====================================================
    // 2. OBTENER PEDIDO REDSYS
    // =====================================================

    const redsysOrder =
      redsysData.Ds_Order;

    console.log(
      "Notificación recibida de Redsys:",
      redsysData
    );

    // =====================================================
    // 3. VALIDAR FIRMA
    // =====================================================

    const isValidSignature =
      validateRedsysSignature(
        Ds_MerchantParameters,
        redsysOrder,
        Ds_Signature
      );

    if (!isValidSignature) {
      console.error(
        "Firma de Redsys no válida"
      );

      return res.status(400).send(
        "Invalid signature"
      );
    }

    console.log(
      "Firma Redsys válida:",
      redsysOrder
    );

    // =====================================================
    // 4. CÓDIGO DE RESPUESTA
    // =====================================================

    const responseCode =
      Number(redsysData.Ds_Response);

    console.log(
      "Código respuesta Redsys:",
      responseCode
    );

    // =====================================================
    // 5. BUSCAR PEDIDO
    // =====================================================

    const order =
      await orderModel.findOne({
        redsysOrder,
      });

    if (!order) {
      console.error(
        "Pedido no encontrado:",
        redsysOrder
      );

      return res.status(404).send(
        "Order not found"
      );
    }

    // =====================================================
    // 6. PAGO AUTORIZADO
    // =====================================================

    if (
      responseCode >= 0 &&
      responseCode <= 99
    ) {

      /*
       * IMPORTANTE:
       *
       * Si Redsys vuelve a mandar la notificación,
       * no volvemos a mandar el email.
       */

      if (!order.payment) {

        order.payment = true;

        await order.save();

        console.log(
          `Pago confirmado para ${order.orderNumber}`
        );

        // =================================================
        // ENVIAR EMAIL AUTOMÁTICAMENTE
        // =================================================

        await sendOrderEmail(order);

      } else {

        console.log(
          `Pedido ${order.orderNumber} ya estaba pagado.`
        );

      }

    }

    // =====================================================
    // 7. PAGO RECHAZADO
    // =====================================================

    else {

      // Solo procesamos si todavía no estaba pagado
      if (!order.payment) {

        order.payment = false;

        await order.save();

        await sendPaymentFailedEmail(
          order,
          responseCode
        );

        console.log(
          `Pago rechazado para ${order.orderNumber}`
        );

      } else {

        console.log(
          `Notificación rechazada ignorada porque ${order.orderNumber} ya estaba pagado.`
        );

      }
    }

    // =====================================================
    // 8. RESPONDER A REDSYS
    // =====================================================

    return res.status(200).send("OK");

  } catch (error) {

    console.error(
      "Error procesando notificación Redsys:",
      error
    );

    return res.status(500).send(
      "ERROR"
    );
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

const userOrders = async (req, res) => { };

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

const deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    await orderModel.findByIdAndDelete(orderId);
    res.json({ success: true, message: "Pedido borrado" });
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
  deleteOrder,
  // REDSYS
  placeOrderRedsys,
  verifyOrderRedsys,
  redsysNotification,
};
