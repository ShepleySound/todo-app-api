'use strict';

const ModelInterface = require('../model-interface');

module.exports = class TodoInterface extends ModelInterface {
  constructor(model) {
    super(model);
  }

  async getTodosByUser(userId) {
    try {
      const user = await this.model.findAll({
        where: {
          UserId: userId,
        },
      });
      return await user.getTodos({
        attributes: ['id', 'task', 'author', 'difficulty', 'complete'],
      });
    } catch (err) {
      console.error(err.message);
      return err;
    }
  }
};
