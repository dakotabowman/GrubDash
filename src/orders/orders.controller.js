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
    dishes: dishes.map((dish) => ({
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

function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }
  next({
    status: 404,
    message: `Order not found ${orderId}`,
  });
}

function read(req, res) {
  res.json({ data: res.locals.order });
}

function statusIsValid(req, res, next) {
  const { data: { status } = {} } = req.body;
  if (status === "delivered") {
    next({
      status: 400,
      message: `A delivered order cannot be changed`,
    });
  } else if (
    status !== "pending" &&
    status !== "preparing" &&
    status !== "out-for-delivery" &&
    status !== "delivered"
  ) {
    next({
      status: 400,
      message: ` 	Order must have a status of pending, preparing, out-for-delivery, delivered`,
    });
  }

  next();
}

function idIsValid(req, res, next) {
  const { orderId } = req.params;
  const { data: { id: bodyId } = {} } = req.body;

  if (bodyId && bodyId !== orderId) {
    return next({
      status: 400,
      message: `Order id does not match route id. Order: ${bodyId}, Route: ${orderId}`,
    });
  }

  next();
}

function update(req, res) {
  const { orderId } = req.params;
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;

  const existingOrder = orders.find((order) => order.id === orderId);

  existingOrder.deliverTo = deliverTo;
  existingOrder.mobileNumber = mobileNumber;
  existingOrder.status = status;
  existingOrder.dishes = dishes.map((dish) => ({
    id: dish.id || nextId(),
    name: dish.name,
    description: dish.description,
    image_url: dish.image_url,
    price: dish.price,
    quantity: dish.quantity,
  }));

  res.json({ data: existingOrder });
}

function destroy(req, res, next) {
  const { orderId } = req.params;
  const index = orders.findIndex((order) => order.id === orderId);

  const { status } = orders[index];
  if (status !== "pending") {
    return next({
      status: 400,
      message: `Order status must be pending`,
    });
  }
  orders.splice(index, 1);
  res.sendStatus(204);
}


module.exports = {
  list,
  create: [
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    dishesArrayIsValid,
    create,
  ],
  read: [orderExists, read],
  update: [
    orderExists,
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    bodyDataHas("status"),
    dishesArrayIsValid,
    statusIsValid,
    idIsValid,
    update,
  ],
  delete: [orderExists, destroy],
};
