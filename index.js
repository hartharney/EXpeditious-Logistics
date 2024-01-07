require("dotenv").config();

const Joi = require("joi");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const logger = require("morgan");
const bodyParser = require("body-parser");
const { Sequelize } = require("sequelize");
const { DataTypes } = require("sequelize");
const path = require("path");
const jwt = require("jsonwebtoken");
const MySQLStore = require("express-mysql-session")(session);

// ============
// express and database connection

const options = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

const sessionStore = new MySQLStore(options);
const app = express();
const port = process.env.PORT || 4000;
// const uri = process.env.DB_URI;

const db = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    dialect: "mysql",
    host: process.env.DB_HOST,
    storageEngine: "InnoDB",
    port: parseInt(process.env.DB_PORT),
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  }
);

db.authenticate()
  .then(() => {
    console.log("Database connected successfully");
    return db.sync();
  })
  .catch((error) => {
    console.error("Unable to connect to the database:", error.message);
  });

// ========
// models : user and shipping

const User = db.define("User", {
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  username: { type: DataTypes.STRING, allowNull: false },
});

// models/shipping.js
const Shipping = db.define("Shipping", {
  shipment_number: { type: DataTypes.STRING, allowNull: false },
  sender_email: { type: DataTypes.STRING, allowNull: false, unique: true },
  item_type: { type: DataTypes.STRING, allowNull: false },
  country: { type: DataTypes.STRING, allowNull: false },
  origin_city: { type: DataTypes.STRING, allowNull: false },
  shipping_time: { type: DataTypes.STRING, allowNull: false },
  shipping_date: { type: DataTypes.STRING, allowNull: false },
  sender_name: { type: DataTypes.STRING, allowNull: false },
  sender_address: { type: DataTypes.STRING, allowNull: false },
  shipping_quantity: { type: DataTypes.INTEGER, allowNull: false },
  total_weight: { type: DataTypes.INTEGER, allowNull: false },
  status: { type: DataTypes.STRING, allowNull: false },
  delivery_city: { type: DataTypes.STRING, allowNull: false },
  delivery_date: { type: DataTypes.STRING, allowNull: false },
  recipient_name: { type: DataTypes.STRING, allowNull: false },
  recipient_address: { type: DataTypes.STRING, allowNull: false },
});

// User.hasMany(Shipping, {
//   foreignKey: "userId",
//   constraints: true,
//   onDelete: "CASCADE",
// });
// Shipping.belongsTo(User, {
//   foreignKey: "userId",
//   constraints: true,
//   onDelete: "CASCADE",
// });

// ==========
// Middlewares

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: "your-secret-key",
    key: "session_cookie_name",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(logger("dev"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

const verifyUserMiddleware = (req, res, next) => {
  const token = req.query.token;

  if (!token) {
    return res
      .status(403)
      .json({ message: "Unauthorized access. Token not provided." });
  }

  try {
    const decoded = jwt.verify(token, "iskaba");

    // res.status(200).json({ message: "Token is valid", decoded });

    next();
  } catch (error) {
    return res
      .status(403)
      .json({ message: "Unauthorized access. Token verification failed." });
  }
};

app.use("/users", verifyUserMiddleware);
app.use("/shipping", verifyUserMiddleware);
app.use("/users/:id", verifyUserMiddleware);
app.use("/shipping/:id", verifyUserMiddleware);

// =============
// Routes

app.get("/", (req, res) => {
  const indexPath = path.join(__dirname, "Pages", "index.html");
  return res.sendFile(indexPath);
});
app.get("/packaging", (req, res) => {
  const indexPath = path.join(__dirname, "Pages", "packaging.html");
  res.sendFile(indexPath);
});
app.get("/tracking", (req, res) => {
  const indexPath = path.join(__dirname, "Pages", "tracking.html");
  res.sendFile(indexPath);
});

app.get("/login", (req, res) => {
  const indexPath = path.join(__dirname, "Pages", "login.html");
  res.sendFile(indexPath);
});

app.get("/sign-up", (req, res) => {
  const indexPath = path.join(__dirname, "Pages", "sign-up.html");
  res.sendFile(indexPath);
});

app.get("/not-found", (req, res) => {
  const indexPath = path.join(__dirname, "Pages", "trackb61e.html");
  res.sendFile(indexPath);
});

app.get("/forgot-password", (req, res) => {
  const indexPath = path.join(__dirname, "Pages", "forgot-password.html");
  res.sendFile(indexPath);
});

// user routes
const userSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  username: Joi.string().required(),
});
app.get("/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users", error });
  }
});

app.post("/users", async (req, res) => {
  try {
    const { error } = userSchema.validate(req.body);

    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const { username, email, password } = req.body;
    const newUser = await User.create({ username, email, password });
    res.status(201).json(newUser);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error creating user", error: error.message });
  }
});

app.get("/users/:id", async (req, res) => {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) return res.status(400).send("Invalid ID");
  try {
    const user = await User.findByPk(id);
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user", error });
  }
});

// shipping routes
const shippingSchema = Joi.object({
  shipment_number: Joi.string().required(),
  sender_email: Joi.string().email().required(),
  item_type: Joi.string().required(),
  country: Joi.string().required(),
  origin_city: Joi.string().required(),
  shipping_time: Joi.string().required(),
  shipping_date: Joi.string().required(),
  sender_name: Joi.string().required(),
  sender_address: Joi.string().required(),
  shipping_quantity: Joi.number().required(),
  total_weight: Joi.number().required(),
  status: Joi.string().required(),
  delivery_city: Joi.string().required(),
  delivery_date: Joi.string().required(),
  recipient_name: Joi.string().required(),
  recipient_address: Joi.string().required(),
});

app.get("/shipping/:id", async (req, res) => {
  const { id } = req.params;
  console.log(id);
  try {
    const shipping = await Shipping.findOne({ where: { shipment_number: id } });
    console.log("Shipping details:", shipping);

    if (!shipping) {
      return res.status(404).json({ message: "Shipping not found" });
    }

    res.json(shipping);
  } catch (error) {
    console.error("Error fetching shipping details:", error);
    res.status(500).json({ message: "Error fetching shipping", error });
  }
});

app.post("/shipping", async (req, res) => {
  const { error } = shippingSchema.validate(req.body);

  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  const {
    shipment_number,
    sender_email,
    item_type,
    country,
    origin_city,
    shipping_time,
    shipping_date,
    sender_name,
    sender_address,
    shipping_quantity,
    total_weight,
    status,
    delivery_city,
    delivery_date,
    recipient_name,
    recipient_address,
  } = req.body;
  try {
    const newShipping = await Shipping.create({
      shipment_number,
      sender_email,
      item_type,
      country,
      origin_city,
      shipping_time,
      shipping_date,
      sender_name,
      sender_address,
      shipping_quantity,
      total_weight,
      status,
      delivery_city,
      delivery_date,
      recipient_name,
      recipient_address,
    });
    res.status(201).json(newShipping);
  } catch (error) {
    res.status(400).json({ message: "Error creating shipping", error });
  }
});

app.get("/track", async (req, res) => {
  const { order_track, trackingType } = req.body;

  if (!order_track || !trackingType) {
    const indexPath = path.join(__dirname, "Pages", "trackb61e.html");
    return res.status(404).sendFile(indexPath);
  }

  try {
    const shipping = await Shipping.findOne({ shipment_number: order_track });

    if (!shipping) {
      return res.status(404).json({ message: "Shipping not found" });
    }

    const detailsPath = path.join(__dirname, "Pages", "details.html");

    return res.status(200).render("details", { shipping });
  } catch (error) {
    console.error("Error processing tracking request:", error);
    const indexPath = path.join(__dirname, "Pages", "404.html");
    res.status(500).sendFile(indexPath);
  }
});

app.get("/details", async (req, res) => {
  try {
    const { shipment_number } = req.query;

    const shippingDetails = await Shipping.findOne({
      where: { shipment_number },
    });

    if (!shippingDetails) {
      return res.status(404).send("Shipping details not found");
    }

    const detailsPath = path.join(__dirname, "Pages", "details.html");
    res.status(200).sendFile(detailsPath, { shipping: shippingDetails });
  } catch (error) {
    console.error("Error fetching shipping details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
