const express = require("express");
const Stripe = require("stripe");
const Order = require("../models/orderModel");

require("dotenv").config();

const stripe = Stripe(process.env.STRIPE_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

const router = express.Router();

//* CREATE CHECKOUT SESSION: crea un usuario y una sesión para checkout de la compra (paso necesario de Stripe, no confundir con el usuario loggueado en la página).
router.post("/create-checkout-session", async (req, res) => {
  let { cartItems, userEmail } = req.body;
  let purchase = cartItems.map((e) => {
    return { id: e.id }; //, cartTotalQuantity: e.cartTotalQuantity
  })
  console.log('User Id: ', userEmail)
  console.log("cartItem: ", purchase);
  const customer = await stripe.customers.create({
    metadata: {
      userEmail,
    },
  });
  const line_items = cartItems.map((item) => {
    return {
      price_data: {
        currency: "usd",
        product_data: {
          name: item.id,
          images: [item.image],
          description: item.name,
          metadata: {
            id: item.id,
          },
        },
        unit_amount: item.price * 100, //! Esto está bien?
      },
      quantity: item.cartTotalQuantity,
    };
  });


  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    shipping_address_collection: {
      allowed_countries: ["US", "CA", "VE", "AR"],
    },
    phone_number_collection: {
      enabled: true,
    },
    line_items,
    mode: "payment",
    customer: customer.id,
    metadata: purchase,
    success_url: `${process.env.CLIENT_URL}/checkout/${customer.metadata.userEmail}`, //checkout-success
    cancel_url: `${process.env.CLIENT_URL}/cart`,
  });

  res.send({ url: session.url });
});

//? Qué hace esta ruta? Que action creator la ejecuta?
router.post("/webhook", express.raw({ type: "application/json" }), (req, res) => {
    const sig = req.headers["stripe-signature"];
    console.log("sig: ",sig);
    let data;
    let eventType;

    // Check if webhook signing is configured.
    let endpointSecret;
    endpointSecret = process.env.STRIPE_WEB_HOOK;
    console.log("endpoint: ",endpointSecret);
    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      console.log("event: ", event)
    } catch (err) {
      console.log(`❌ Webhook Error: ${err.message}`);
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }
    // Extract the object from the event.
    data = event.data.object;
    eventType = event.type;

    // Handle the event
    if (eventType === "checkout.session.completed") {
      stripe.customers
        .retrieve(data.customer)
        .then((customer) => {
          stripe.checkout.sessions.listLineItems(
            data.id,
            {},
            function (err, lineItems) {
              console.log("Line_items", lineItems);
              console.log("Data: ", data);
              createOrder(customer, data, lineItems);
            }
          );
        })
        .catch((err) => console.log(err.message));
    }
    
    // Return a 200 res to acknowledge receipt of the event
    //res.send().end();
    res.json({ received: true });
  }
);


// Create Order para utilizar en la ruta anterior
const createOrder = async (customer, data, lineItems) => {

  const newOrder = new Order({
    email: customer.metadata.userEmail,
    //cartItems: customer.metadata.cartItems,
    customerId: data.customer,
    paymentIntentId: data.payment_intent,
    products: lineItems.data,
    subtotal: data.amount_subtotal,
    total: data.amount_total,
    shipping: data.customer_details,
    payment_status: data.payment_status,
  });

  try {
    const savedOrder = await newOrder.save();

    console.log("Processed Order:", savedOrder);
  } catch (err) {
    console.log(err);
  }
};


module.exports = router;
