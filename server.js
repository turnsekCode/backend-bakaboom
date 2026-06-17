import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./config/mongodb.js";
import connectCloudinary from "./config/cloudinary.js";
import userRouter from "./routes/userRoute.js";
import productRouter from "./routes/productRoute.js";
import cartRouter from "./routes/cartRoute.js";
import nodemailer from "nodemailer";
import categoryRouter from "./routes/categoryRoute.js";
import orderRoute from "./routes/orderRoute.js";
import bannerRouter from "./routes/bannerRoute.js";
import reviewRouter from "./routes/reviewRoute.js";

// App config
const app = express();
const port = process.env.PORT || 4000;
connectDB();
connectCloudinary();

//middlewares
app.use(express.json());
//app.use(cors({ origin: "*", credentials: true }));
const allowedOrigins = [
  "https://bakaboom.es",
  "https://web.bakaboom.es",
  "https://admin.bakaboom.es",
  "https://admin-bakaboom.vercel.app",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5176",
  "http://localhost:5175",
  "http://192.168.1.142:5176",
  "http://192.168.1.167:5176",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

// Configuración de Nodemailer (reemplaza con tus credenciales)
const transporter = nodemailer.createTransport({
  service: "gmail", // Usa el servicio que prefieras
  auth: {
    user: "pixel.tech.t@gmail.com", // Reemplaza con tu correo
    pass: "uifc sttc klfd qlqq", // Reemplaza con tu contraseña: contraseña pixel: uifc sttc klfd qlqq
  },
});
// Ruta para enviar el correo
app.post("/send-email", (req, res) => {
  const {
    cartDetails,
    subtotal,
    shippingFee,
    total,
    currency,
    orderNumber,
    shippingInfo,
    discount,
    paymentType,
    envioPersonal,
  } = req.body;
  // Verificar si faltan datos obligatorios
  console.log("Datos recibidos para enviar email:", req.body);
  if (
    !cartDetails ||
    !subtotal ||
    !total ||
    !currency ||
    !orderNumber ||
    !shippingInfo ||
    shippingFee === undefined || shippingFee === null || // 👈 Permite el 0
    discount === undefined || discount === null          // 👈 Permite el 0
  ) {
    return res.status(400).json({
      success: false,
      message: "Faltan datos obligatorios en la solicitud.",
    });
  }

  // Generar el bloque de descuento condicional
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
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f6f9;padding:30px 10px;">
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
      ">
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
      Pedido #${orderNumber}
      </p>
      </td>
      </tr>
      <!-- CONTENIDO -->
      <tr>
      <td class="content" style="padding:35px;">
      <h2 style="margin-top:0;color:#2c3e50;">
      Hola ${shippingInfo?.name} 👋
      </h2>
      <p style="font-size:16px;color:#555;line-height:1.8;">
      Muchas gracias por tu pedido.
      Estamos emocionados de que esta creación llegue a tus manos.
      </p>
      ${
        !envioPersonal
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
      ${shippingInfo?.address}<br>
      ${shippingInfo?.province}<br>
      ${shippingInfo?.postalCode}<br>
      ${shippingInfo?.country}
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
      <strong>Teléfono:</strong> ${shippingInfo?.phone}
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
      <th style="padding:14px;text-align:left;">Producto</th>
      <th style="padding:14px;text-align:left;">Precio</th>
      <th style="padding:14px;text-align:left;">Imagen</th>
      <th style="padding:14px;text-align:left;">Color</th>
      <th style="padding:14px;text-align:left;">Talla</th>
      ${
        cartDetails.some((item) => item.anos !== null)
          ? '<th style="padding:14px;text-align:left;">Años</th>'
          : ""
      }
      ${
        cartDetails.some((item) => item.textPersonal?.trim())
          ? '<th style="padding:14px;text-align:left;">Texto</th>'
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
      <strong>${item.name}</strong><br>
      Cantidad: ${item.quantity}
      </td>
      <td style="padding:15px;">
      ${item.price.toFixed(2)}${currency}
      </td>
      <td style="padding:15px;">
      <img
      class="product-image"
      src="${item.image}"
      alt="${item.name}"
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
      ${item.anos !== null ? `<td style="padding:15px;">${item.anos}</td>` : ""}
      ${
        item.textPersonal?.trim()
          ? `<td style="padding:15px;">${item.textPersonal}</td>`
          : ""
      }
      </tr>
      `,
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
      <td style="padding:10px 0;">Subtotal</td>
      <td style="padding:10px 0;text-align:right;font-weight:bold;">
      ${subtotal.toFixed(2)}${currency}
      </td>
      </tr>
      <tr>
      <td style="padding:10px 0;">Envío</td>
      <td style="padding:10px 0;text-align:right;font-weight:bold;">
      ${!envioPersonal ? shippingFee : "0.00€"}
      </td>
      </tr>
      ${discountBlock}
      <tr>
      <td style="padding:10px 0;">Método de pago</td>
      <td style="padding:10px 0;text-align:right;font-weight:bold;">
      ${paymentType}
      </td>
      </tr>
      <tr>
      <td colspan="2">
      <hr style="border:none;border-top:1px solid #ddd;">
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
      href="https://wa.me/34672563452"
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

  // Configuración del correo
  const mailOptions = {
    from: "pixel.tech.t@gmail.com",
    to: shippingInfo?.email, // Correo del cliente
    cc: "pixel.tech.t@gmail.com",
    bcc: "pixel.tech.t@gmail.com", // Copias ocultas
    subject: `Pedido realizado`,
    html: emailContent,
  };

  // Enviar correo
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      //console.log(error);
      return res.status(500).json({ success: false, message: error.message });
    }
    res
      .status(200)
      .json({ success: true, message: "Correo enviado exitosamente" });
  });
});

app.post("/send-email-status", async (req, res) => {
  const { orderId, status, email, orderNumber } = req.body;
  if (!orderId || !status || !email || !orderNumber) {
    return res
      .status(400)
      .json({ success: false, message: "Faltan datos requeridos." });
  }

  // Función para obtener el mensaje según el estado
  const getStatusMessage = (status) => {
    switch (status) {
      case "Empacando":
        return `<h2 style="color: #0368B2;">¡Hola!</h2>
        <p>Tenemos noticias emocionantes de tu pedido: <strong>${orderNumber}</strong></p>
        <p><strong>Nuevo estado:</strong> ${status}</p>
        <p>Empaquetamos con cuidado y detalle, estimamos que llegará a tu dirección en 3 a 4 días hábiles por Correos.
        ¿Tienes alguna pregunta o inquietud? No dudes en hacérnoslo saber. Estamos aquí para ayudarte.</p>
        <p>Gracias por elegirnos.</p>`;
      case "Enviado":
        return `<h2 style="color: #0368B2;">¡Hola!</h2>
        <p>¡Buenas noticias!</p>
        <p>Tu pedido: <strong>${orderNumber}</strong> ya fué enviado y está en camino hacia ti.</p>
        <p><strong>Nuevo estado:</strong> ${status}</p>
        <p>Estimamos que llegará a tu dirección en 3 a 4 días hábiles por Correos. Esperamos que estés emocionado de recibir tu pedido. Si tienes alguna pregunta o inquietud, no dudes en hacérnoslo saber. Estamos aquí para ayudarte.</p>
        <p>Nuevamente, gracias por elegirnos.</p>`;
      default:
        return `<h2 style="color: #0368B2;">¡Hola!</h2>
          <p>Queremos informarte que el estado de tu pedido <strong>${orderNumber}</strong> ha cambiado.</p>
          <p><strong>Nuevo estado:</strong> ${status}</p>
          <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
          <p>Gracias por tu preferencia.</p>`;
    }
  };

  const statusColors = {
    Empacando: "#f59e0b",
    "Preparando pedido": "#3b82f6",
    "En producción": "#8b5cf6",
    Enviado: "#10b981",
    Entregado: "#16a34a",
    Cancelado: "#ef4444",
  };

  const statusColor = statusColors[status] || "#0368B2";
  // Generar el HTML dinámico
  const statusMessage = getStatusMessage(status);

  const emailContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Actualización de pedido</title>
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
        .title{
            font-size:24px !important;
        }

    }
    </style>
    </head>
    <body>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f6f9;padding:30px 10px;">
    <tr>
    <td align="center">
    <table
    class="container"
    width="700"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="
    max-width:700px;
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
    src="https://res.cloudinary.com/drb7svbxm/image/upload/v1778849353/logo_bakaboom_fwre6v.png"
    alt="Logo"
    style="
    max-width:140px;
    background:#ffffff;
    padding:12px;
    border-radius:12px;
    "
    />
    <h1
    class="title"
    style="
    color:#ffffff;
    margin:20px 0 10px;
    font-size:30px;
    "
    >
    Actualización de tu pedido
    </h1>
    <p style="color:#e9f3ff;margin:0;">
    Te mantenemos informado sobre el estado de tu compra
    </p>
    </td>
    </tr>
    <tr>
    <td class="content" style="padding:35px;">
    <p
    style="
    font-size:16px;
    line-height:1.8;
    color:#555;
    "
    >
    Queremos informarte que el estado de tu pedido ha sido actualizado.
    </p>
    <div
    style="
    margin-top:25px;
    background:#eff6ff;
    border-left: 5px solid ${statusColor};
    color: ${statusColor};
    padding:25px;
    border-radius:10px;
    "
    >
    <h3
    style="
    margin-top:0;
    color:#0368B2;
    "
    >
    📦 Estado actual del pedido
    </h3>
    <div
    style="
    font-size:18px;
    font-weight:bold;
    color:#2c3e50;
    margin-top:10px;
    "
    >
    ${statusMessage}
    </div>
    </div>
    <div
    style="
    margin-top:25px;
    background:#fafafa;
    border:1px solid #ececec;
    border-radius:12px;
    padding:20px;
    "
    >
    <p
    style="
    margin:0;
    font-size:15px;
    line-height:1.8;
    color:#555;
    "
    >
    Si tienes cualquier duda acerca de tu pedido, puedes responder a este correo o contactar con nosotros directamente por WhatsApp.
    </p>
    </div>
    <div
    style="
    text-align:center;
    margin-top:35px;
    "
    >
    <a
    href="https://wa.me/34672563452"
    target="_blank"
    style="
    background:#25D366;
    color:#ffffff;
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
    Gracias por confiar en nosotros.<br>
    Seguimos trabajando para que recibas tu pedido lo antes posible ❤️
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
    font-weight:bold;
    color:#555;
    "
    >
    Atentamente
    </p>
    <p
    style="
    margin-top:10px;
    font-size:13px;
    color:#888;
    "
    >
    El equipo de la tienda
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

  const mailOptions = {
    from: "pixel.tech.t@gmail.com",
    to: email,
    cc: "pixel.tech.t@gmail.com",
    bcc: "pixel.tech.t@gmail.com", // Copias ocultas
    subject: `Estado de tu pedido: ${orderNumber}`,
    html: emailContent,
  };

  try {
    await transporter.sendMail(mailOptions);
    res
      .status(200)
      .json({ success: true, message: "Correo enviado con éxito." });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error al enviar el correo.", error });
  }
});

app.post("/send-email-contact", async (req, res) => {
  // 1. Recibir los campos enviados desde el componente React
  const { nombre, telefono, email, tipoCliente, mensaje, website } = req.body;

  if (website && website.trim() !== "") {
    console.log(
      "=> [BOT DETECTADO]: Intento de spam bloqueado silenciosamente.",
    );
    // Devolvemos un éxito ficticio al bot para que deje de reintentar
    return res.status(200).json({
      success: true,
      message: "Correo de contacto enviado con éxito.",
    });
  }

  // 2. Validación de campos obligatorios
  if (!nombre || !telefono || !email || !mensaje) {
    return res.status(400).json({
      success: false,
      message: "Faltan datos requeridos (Nombre, Teléfono, Email o Mensaje).",
    });
  }

  const emailContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
        .title{
            font-size:24px !important;
        }
    }
    </style>
    </head>
    <body>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f6f9;padding:30px 10px;">
    <tr>
    <td align="center">
    <table
    class="container"
    width="700"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="
    max-width:700px;
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
    src="https://res.cloudinary.com/drb7svbxm/image/upload/v1778849353/logo_bakaboom_fwre6v.png"
    alt="Logo"
    style="
    max-width:150px;
    background:#ffffff;
    padding:12px;
    border-radius:12px;
    "
    />
    <h1
    class="title"
    style="
    color:#ffffff;
    margin:20px 0 10px;
    font-size:30px;
    "
    >
    Nuevo mensaje recibido
    </h1>
    <p style="color:#e9f3ff;margin:0;">
    Formulario de contacto web
    </p>
    </td>
    </tr>
    <tr>
    <td class="content" style="padding:35px;">
    <h2 style="margin-top:0;color:#2c3e50;">
    📋 Datos del interesado
    </h2>
    <div
    style="
    background:#f8fafc;
    border:1px solid #e5e7eb;
    border-radius:12px;
    padding:25px;
    margin-top:20px;
    "
    >
    <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
    <td style="padding:10px 0;color:#666;width:35%;">
    <strong>Nombre</strong>
    </td>
    <td style="padding:10px 0;color:#111;">
    ${nombre}
    </td>
    </tr>
    <tr>
    <td style="padding:10px 0;color:#666;">
    <strong>Teléfono</strong>
    </td>
    <td style="padding:10px 0;color:#111;">
    ${telefono}
    </td>
    </tr>
    <tr>
    <td style="padding:10px 0;color:#666;">
    <strong>Email</strong>
    </td>
    <td style="padding:10px 0;">
    <a
    href="mailto:${email}"
    style="
    color:#0368B2;
    text-decoration:none;
    font-weight:bold;
    "
    >
    ${email}
    </a>
    </td>
    </tr>
    <tr>
    <td style="padding:10px 0;color:#666;">
    <strong>Tipo de perfil</strong>
    </td>
    <td style="padding:10px 0;">
    <span
    style="
    display:inline-block;
    background:#e3f2fd;
    color:#0d47a1;
    padding:6px 12px;
    border-radius:20px;
    font-size:12px;
    font-weight:bold;
    "
    >
    ${tipoCliente || "No especificado"}
    </span>
    </td>
    </tr>
    </table>
    </div>
    <h2
    style="
    margin-top:35px;
    color:#2c3e50;
    "
    >
    💬 Mensaje recibido
    </h2>
    <div
    style="
    background:#fafafa;
    border-left:5px solid #0368B2;
    border-radius:10px;
    padding:20px;
    margin-top:15px;
    "
    >
    <p
    style="
    margin:0;
    font-size:15px;
    line-height:1.8;
    color:#444;
    white-space:pre-line;
    "
    >
    ${mensaje}
    </p>
    </div>
    <div
    style="
    margin-top:30px;
    background:#eff6ff;
    border:1px solid #dbeafe;
    border-radius:12px;
    padding:20px;
    "
    >
    <p
    style="
    margin:0;
    font-size:15px;
    color:#1e40af;
    line-height:1.7;
    "
    >
    Este cliente ha enviado una nueva consulta desde el formulario web.
    Puedes responder directamente al correo indicado o contactar por teléfono.
    </p>
    </div>
    <div
    style="
    text-align:center;
    margin-top:35px;
    "
    >
    <a
    href="mailto:${email}"
    style="
    display:inline-block;
    background:#0368B2;
    color:#ffffff;
    padding:14px 30px;
    border-radius:50px;
    text-decoration:none;
    font-weight:bold;
    margin-right:10px;
    "
    >
    Responder Email
    </a>
    <a
    href="tel:${telefono}"
    style="
    display:inline-block;
    background:#25D366;
    color:#ffffff;
    padding:14px 30px;
    border-radius:50px;
    text-decoration:none;
    font-weight:bold;
    "
    >
    Llamar Cliente
    </a>
    </div>
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
    font-size:13px;
    color:#666;
    "
    >
    Este correo ha sido generado automáticamente desde el formulario de contacto de la web.
    </p>
    <p
    style="
    margin-top:10px;
    font-size:12px;
    color:#999;
    "
    >
    © 2026 Bakaboom Shop. Todos los derechos reservados.
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

  // 3. Configuración del correo electrónico
  const mailOptions = {
    from: "pixel.tech.t@gmail.com", // Cuenta emisora (tu servidor)
    to: "pixel.tech.t@gmail.com", // El correo donde quieres RECIBIR los mensajes de tus clientes
    cc: "pixel.tech.t@gmail.com", // Copia de respaldo para ti si lo deseas
    replyTo: email, // Permite que si das clic a "Responder" en tu mail, le responda directo al cliente
    subject: `Nuevo mensaje de contacto: ${nombre} (${tipoCliente || "No especificado"})`,
    // Plantilla HTML adaptada al estilo limpio de Bakaboom
    html: emailContent,
  };

  // 4. Envío real a través del transportador establecido de Nodemailer
  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({
      success: true,
      message: "Correo de contacto enviado con éxito.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error en el servidor al despachar el correo.",
      error,
    });
  }
});

// api endpoints
app.use("/api/user", userRouter);
app.use("/api/product", productRouter);
app.use("/api/cart", cartRouter);
app.use("/api/category", categoryRouter);
app.use("/api/order", orderRoute);
app.use("/api/banner", bannerRouter);
app.use("/api/review", reviewRouter);

app.get("/", (req, res) => {
  res.send("Api working");
});

app.listen(port, "0.0.0.0", () =>
  console.log("Servidor corriendo en puerto:" + port),
);
