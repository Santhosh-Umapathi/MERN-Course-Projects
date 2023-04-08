require("dotenv").config();
const cors = require("cors");
const express = require("express");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const uuid = require("uuid").v4;

const app = express();

//middleware
app.use(express.json());
app.use(cors());

//routes
app.get("/", (req, res) => res.send("Home Route"));

app.post("/payment", (req, res) => {
  const { product, token } = req.body;
  // console.log("🚀 --- app.post --- token", token);
  // console.log("PRODUCT ", product);
  const idempotencyKey = uuid();

  return stripe.customers
    .create({
      email: token.email,
      source: token.id,
    })
    .then(async (customer) => {
      const result = await stripe.charges.create(
        {
          amount: product.price * 100,
          currency: "usd",
          receipt_email: token.email,
          customer: customer.id,
          description: `purchase of ${product.name}`,
          shipping: {
            name: token.card.name,
            address: {
              country: token.card.address_country,
            },
          },
        },
        {
          idempotencyKey, //This is useful to not charge twice
        }
      );
      console.log("🚀 --- .then --- result", result);
      res.status(200).json(result);
    })
    .catch((err) => {
      console.log("STRIPE ERROR", err);
      res.end();
    });
});

//listen
app.listen(5000, () => console.log("LISTENING AT PORT 5000"));
