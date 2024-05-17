const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assign IDs when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

function list(req, res) {
  res.json({ data: orders });
}

function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName]) {
      return next();
    }
    next({
      status: 400,
      message: `Order must include a ${propertyName}`,
    });
  };
}

function dishesArrayIsValid(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  if (!dishes) {
    return next({
      status: 400,
      message: `Order must include a dish`,
    });
  } else if (!Array.isArray(dishes) || dishes.length < 1) {
    return next({
      status: 400,
      message: `Order must include at least one dish`,
    });
  } else {
    dishes.forEach((dish, index) => {
      if (!Number.isInteger(dish.quantity) || dish.quantity <= 0) {
        return next({
          status: 400,
          message: `Dish ${index} must have a quantity that is an integer greater than 0`,
        });
      }
      if (!Number.isInteger(dish.price) || dish.price <= 0) {
        return next({
          status: 400,
          message: `Dish ${index} must have a price that is an integer greater than 0`,
        });
      }
    });
    return next();
  }
}

function create(req, res) {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    status,
    dishes: dishes.map(dish => ({
      id: nextId(),
      name: dish.name,
      description: dish.description,
      image_url: dish.image_url,
      price: dish.price,
      quantity: dish.quantity,
    })),
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

module.exports = {
  list,
  create: [
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    bodyDataHas("status"),
    dishesArrayIsValid,
    create,
  ],
};
