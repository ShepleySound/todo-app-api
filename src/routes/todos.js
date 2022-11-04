'use strict';

const express = require('express');
const { todos } = require('../models');
const bearerAuth = require('../auth/middleware/bearer.js');
const permissions = require('../auth/middleware/acl.js');

const router = express.Router();

router.get('/', bearerAuth, handleGetAll);
router.get('/all/:userId', bearerAuth, permissions('user'), getTodosByUser);
router.get('/:id', bearerAuth, permissions('user'), handleGetOne);
router.post('/', bearerAuth, permissions('user'), handleCreate);
router.put('/:id', bearerAuth, permissions('user'), handleUpdate);
router.patch('/:id', bearerAuth, permissions('user'), handleUpdate);
router.delete('/:id', bearerAuth, permissions('user'), handleDelete);

async function handleGetAll(req, res) {
  let records = await todos.get();
  res.status(200).json(records);
}

async function handleGetOne(req, res) {
  const id = req.params.id;
  let record = await todos.get(id);
  res.status(200).json(record);
}

// Gets todos belonging to a specific user
async function getTodosByUser(req, res) {
  const id = req.params.id;
  let userTodos = await todos.getTodosByUser(id);
  res.status(200).json(userTodos);
}

// Creates a todo
async function handleCreate(req, res) {
  let obj = req.body;
  let todo = await todos.create({
    ...obj,
    author: req.user.username,
    UserId: req.user.id,
  });
  res.status(201).json(todo);
}

// Updates a todo's information
async function handleUpdate(req, res) {
  const id = req.params.id;
  const obj = req.body;

  const toChange = await todos.get(id);
  if (!toChange) {
    res.status(400).send('Todo does not exist');
    return;
  }
  if (
    toChange.author === req.user.username ||
    req.user.capabilities.includes('modifyContent')
  ) {
    const updatedRecord = await todos.update(id, obj);
    res.status(200).json(updatedRecord);
  } else {
    res.status(401).send('Unauthorized');
  }
}

async function handleDelete(req, res) {
  const id = req.params.id;

  const toDelete = await todos.get(id);
  if (!toDelete) {
    res.status(400).send('Todo does not exist');
    return;
  }
  if (
    toDelete.author === req.user.username ||
    req.user.capabilities.includes('superuser')
  ) {
    await todos.delete(id);
    res.status(200).send('Delete request received');
  } else {
    res.status(401).send('Unauthorized');
  }
}

module.exports = router;
