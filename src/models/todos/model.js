'use strict';

module.exports = (sequelizeDB, DataTypes) => {
  return sequelizeDB.define('todos', {
    task: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    author: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    difficulty: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: {
          args: [0],
          msg: 'Difficulty must be greater than 0',
        },
        max: {
          args: [5],
          msg: 'Difficulty must be less than 5',
        },
      },
    },
  });
};
