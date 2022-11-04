'use strict';

require('dotenv').config();
const { Sequelize, DataTypes } = require('sequelize');
const TodoInterface = require('./todos/todos-interface');

const DATABASE_URL = process.env.DATABASE_URL || 'sqlite:memory';

const DATABASE_CONFIG =
  process.env.NODE_ENV === 'production'
    ? {
        dialectOptions: {
          ssl: {
            require: true,
            rejectUnauthorized: false,
          },
        },
      }
    : process.env.NODE_ENV === 'test'
    ? {
        logging: false,
      }
    : {};

const sequelizeDB = new Sequelize(DATABASE_URL, DATABASE_CONFIG);

// Require models
const User = require('./users/model')(sequelizeDB, DataTypes);
const Todo = require('./todos/model')(sequelizeDB, DataTypes);

User.hasMany(Todo);
Todo.belongsTo(User);

module.exports = {
  sequelizeDB,
  users: User,
  todos: new TodoInterface(Todo),
};
