'use strict';

process.env.SECRET = 'TEST_SECRET';

const supertest = require('supertest');
const { app } = require('../server');
const { sequelizeDB } = require('../models');
const request = supertest(app);

beforeAll(async () => {
  await sequelizeDB.sync();
});

afterAll(async () => {
  await sequelizeDB.drop();
});

describe('Test API Server', () => {
  test('404 on invalid route', async () => {
    const response = await request.get('/definitelydoesnotexist');
    expect(response.status).toEqual(404);
  });

  test('404 on invalid route', async () => {
    const response = await request.get('/also/does/not/exist');
    expect(response.status).toEqual(404);
  });

  test('Test root route', async () => {
    const response = await request.get('/');
    expect(response.status).toEqual(200);
  });

  // test('500 if name not specified in /users POST', async () => {
  //   const response = await request.post('/api/v1/users').send({
  //     notName: 'Test User',
  //   });
  //   expect(response.status).toEqual(500);
  // });
});

describe('Test admin authentication', () => {
  const testUsername = 'testAdmin';
  const testPassword = 'adminpasswordSuperSecret!';
  const testRole = 'admin';

  test('Admin signup', async () => {
    const response = await request.post('/auth/signup').send({
      username: testUsername,
      password: testPassword,
      role: testRole,
    });
    const { username, role, capabilities, token } = response.body;

    expect(username).toEqual(testUsername);
    expect(role).toEqual(testRole);
    expect(capabilities).toContain('superuser');
    expect(token).toBeTruthy();
  });

  test('Valid admin signin', async () => {
    const encodedAuth = Buffer.from(`${testUsername}:${testPassword}`).toString(
      'base64'
    );

    const response = await request
      .post('/auth/signin')
      .set('Authorization', 'basic ' + encodedAuth);

    const { username, role, capabilities, token } = response.body;

    expect(username).toEqual(testUsername);
    expect(role).toEqual(testRole);
    expect(capabilities).toContain('superuser');
    expect(token).toBeTruthy();
  });

  test('Generic auth error when password is incorrect', async () => {
    const encodedAuth = Buffer.from(
      `${testUsername}:incorrectpassword!`
    ).toString('base64');
    const response = await request
      .post('/auth/signin')
      .set('Authorization', 'basic ' + encodedAuth);

    expect(response.status).toEqual(401);
  });

  test('Generic auth error when username does not exist', async () => {
    const encodedAuth = Buffer.from(
      `Definitelynotarealusername:dontevenbotherwithapassword!`
    ).toString('base64');
    const response = await request
      .post('/auth/signin')
      .set('Authorization', 'basic ' + encodedAuth);

    expect(response.status).toEqual(401);
  });
});

describe('Test user authentication', () => {
  const testUsername = 'testUnverified';
  const testPassword = 'thisisapassworditprobablyisnotverygood';
  const testRole = 'unverified';

  test('User signup', async () => {
    const response = await request.post('/auth/signup').send({
      username: testUsername,
      password: testPassword,
      role: testRole,
    });

    const { username, role, capabilities, token } = response.body;

    expect(username).toEqual(testUsername);
    expect(role).toEqual(testRole);
    expect(capabilities).toContain('read');
    expect(capabilities).not.toContain('superuser');
    expect(token).toBeTruthy();
  });

  test('Valid user signin', async () => {
    const encodedAuth = Buffer.from(`${testUsername}:${testPassword}`).toString(
      'base64'
    );

    const signinResponse = await request
      .post('/auth/signin')
      .set('Authorization', 'basic ' + encodedAuth);

    const { username, role, capabilities, token } = signinResponse.body;

    expect(username).toEqual(testUsername);
    expect(role).toEqual(testRole);
    expect(capabilities).toContain('read');
    expect(capabilities).not.toContain('superuser');
    expect(token).toBeTruthy();
  });
});

describe('Test basic /todo CRUD methods with valid authentication', () => {
  const testUsername = 'testAdmin';
  const testPassword = 'adminpasswordSuperSecret!';

  let token = '';
  beforeAll(async () => {
    const encodedAuth = Buffer.from(`${testUsername}:${testPassword}`).toString(
      'base64'
    );

    const response = await request
      .post('/auth/signin')
      .set('Authorization', 'basic ' + encodedAuth);

    token = response.body.token;
  });

  test('Handle getting all todos', async () => {
    const response = await request
      .get('/api/todos')
      .set('Authorization', 'bearer ' + token);
    expect(response.status).toEqual(200);
  });

  test('Create a todo', async () => {
    let response = await request
      .post('/api/todos')
      .set('Authorization', 'bearer ' + token)
      .send({
        task: 'Test Todo',
        difficulty: 1,
      });
    expect(response.status).toEqual(201);
    expect(response.body.task).toEqual('Test Todo');
    expect(response.body.author).toEqual('testAdmin');
    expect(response.body.difficulty).toEqual(1);
  });

  test('Get a todo by id', async () => {
    let response = await request
      .get('/api/todos/1')
      .set('Authorization', 'bearer ' + token);
    expect(response.status).toEqual(200);
    expect(response.body.task).toEqual('Test Todo');
    expect(response.body.author).toEqual('testAdmin');
    expect(response.body.difficulty).toEqual(1);
  });

  test('Update a todo using PUT', async () => {
    let response = await request
      .put('/api/todos/1')
      .set('Authorization', 'bearer ' + token)
      .send({
        task: 'Updated Test Todo',
      });
    expect(response.status).toEqual(200);
    expect(response.body.task).toEqual('Updated Test Todo');
    expect(response.body.author).toEqual('testAdmin');
    expect(response.body.difficulty).toEqual(1);
  });

  test('Update a todo using PATCH', async () => {
    let response = await request
      .patch('/api/todos/1')
      .set('Authorization', 'bearer ' + token)
      .send({
        task: 'Updated Test Todo',
      });
    expect(response.status).toEqual(200);
    expect(response.body.task).toEqual('Updated Test Todo');
    expect(response.body.author).toEqual('testAdmin');
    expect(response.body.difficulty).toEqual(1);
  });

  test('Delete a todo', async () => {
    let response = await request
      .delete('/api/todos/1')
      .set('Authorization', 'bearer ' + token);
    expect(response.status).toEqual(200);
    expect(response.body?.task).toBeUndefined();
  });
});

describe('Test basic /todos CRUD methods with invalid authentication', () => {
  test('Handle getting all todos', async () => {
    const response = await request.get('/api/todos');
    expect(response.status).toEqual(401);
  });

  test('Create a todo', async () => {
    let response = await request.post('/api/todos').send({
      task: 'Test Todo',
      difficulty: 1,
    });
    expect(response.status).toEqual(401);
  });

  test('Get a todo by id', async () => {
    const response = await request.get('/api/todos/1');
    expect(response.status).toEqual(401);
  });

  test('Update a todo', async () => {
    let response = await request.put('/api/todos/1').send({
      task: 'Updated Test Book',
    });
    expect(response.status).toEqual(401);
  });

  test('Delete a todo', async () => {
    let response = await request.delete('/api/todos/1');
    expect(response.status).toEqual(401);
  });
});

describe('Test role-based access flow', () => {
  const testAdmin = 'testAdmin';
  const testAdminPassword = 'adminpasswordSuperSecret!';
  const testUser = 'testUser2';
  const testUserPassword = 'thisisapassworditisalright';
  const testUnverified = 'testUnverified';
  const testUnverifiedPassword = 'thisisapassworditprobablyisnotverygood';

  let adminToken = '';
  let userToken = '';
  let unverifiedToken = '';
  beforeAll(async () => {
    await request.post('/auth/signup').send({
      username: testUser,
      password: testUserPassword,
      role: 'user',
    });

    const adminEncodedAuth = Buffer.from(
      `${testAdmin}:${testAdminPassword}`
    ).toString('base64');

    const adminSigninResponse = await request
      .post('/auth/signin')
      .set('Authorization', 'basic ' + adminEncodedAuth);

    adminToken = adminSigninResponse.body.token;

    const userEncodedAuth = Buffer.from(
      `${testUser}:${testUserPassword}`
    ).toString('base64');

    const userSigninResponse = await request
      .post('/auth/signin')
      .set('Authorization', 'basic ' + userEncodedAuth);

    userToken = userSigninResponse.body.token;

    const unverifiedEncodedAuth = Buffer.from(
      `${testUnverified}:${testUnverifiedPassword}`
    ).toString('base64');

    const unverifiedSigninResponse = await request
      .post('/auth/signin')
      .set('Authorization', 'basic ' + unverifiedEncodedAuth);

    unverifiedToken = unverifiedSigninResponse.body.token;
  });

  test('All tokens should have values', () => {
    expect(adminToken).toBeTruthy();
    expect(userToken).toBeTruthy();
    expect(unverifiedToken).toBeTruthy();
  });

  test('Create a todo', async () => {
    const response = await request
      .post('/api/todos')
      .set('Authorization', 'bearer ' + adminToken)
      .send({
        task: 'Test Todo',
        difficulty: 1,
      });
    expect(response.status).toEqual(201);
  });

  test('Get a todo by id', async () => {
    const response = await request
      .get('/api/todos/2')
      .set('Authorization', 'bearer ' + adminToken);
    expect(response.status).toEqual(200);
    expect(response.body.task).toEqual('Test Todo');
    expect(response.body.author).toEqual('testAdmin');
    expect(response.body.difficulty).toEqual(1);
  });
});
