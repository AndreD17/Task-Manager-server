import request from "supertest";
import * as chai from "chai";
import chaiHttp from "chai-http";
import sinon from "sinon";
import sinonChai from "sinon-chai";  // ✅ Import sinon-chai
import Task from "../models/Task.js";
import logger from "../utils/logger.js";
import { getTasks, getTask, postTask, putTask, deleteTask } from "../controllers/taskControllers.js";

// Setup Chai
const { expect } = chai.default || chai;
(chai.default || chai).use(chaiHttp);
(chai.default || chai).use(sinonChai);  // ✅ Use Sinon-Chai


// Mock Express Request & Response
const mockRequest = (user, params = {}, body = {}) => ({
  user,
  params,
  body,
});

const mockResponse = () => {
  const res = {};
  res.status = sinon.stub().returns(res);
  res.json = sinon.stub().returns(res);
  return res;
};

describe("Task Controllers", () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    sandbox.stub(logger, "info");
    sandbox.stub(logger, "warn");
    sandbox.stub(logger, "error");
  });

  afterEach(() => {
    sandbox.restore();
  });

  // ✅ TEST: Get All Tasks
  it("should return all tasks for a user", async () => {
    const req = mockRequest({ id: 1 });
    const res = mockResponse();

    const mockTasks = [{ id: 1, userId: 1, description: "Test Task" }];
    sandbox.stub(Task, "findAll").resolves(mockTasks);

    await getTasks(req, res);

    expect(Task.findAll).to.have.been.calledWith({ where: { userId: 1 } });
    expect(res.status).to.have.been.calledWith(200);
    expect(res.json).to.have.been.calledWith({
      tasks: mockTasks,
      status: true,
      msg: "Tasks found successfully.",
    });
  });

 // ✅ TEST: Get All Tasks (when no tasks exist)
it("should return an empty array if no task has been created", async () => {
  const req = mockRequest({ id: 1 });  // Keep a valid user ID
  const res = mockResponse();

  const mockTasks = [];  // ✅ No tasks available
  sandbox.stub(Task, "findAll").resolves(mockTasks);

  await getTasks(req, res);

  expect(Task.findAll).to.have.been.calledWith({ where: { userId: 1 } });
  expect(res.status).to.have.been.calledWith(404);
  expect(res.json).to.have.been.calledWith({
    tasks: [],
    status: true,
    msg: "No tasks found.",  // ✅ Update message for clarity
  });
});


  // ✅ TEST: Get Single Task
  it("should return a task if it exists", async () => {
    const req = mockRequest({ id: 1 }, { id: 1 });
    const res = mockResponse();

    const mockTask = { id: 1, userId: 1, description: "Test Task" };
    sandbox.stub(Task, "findOne").resolves(mockTask);

    await getTask(req, res);

    expect(Task.findOne).to.have.been.calledWith({ where: { id: 1, userId: 1 } });
    expect(res.status).to.have.been.calledWith(200);
    expect(res.json).to.have.been.calledWith({
      task: mockTask,
      status: true,
      msg: "Task found successfully.",
    });
  });

  // ✅ TEST: Create Task
  it("should create a task and return it", async () => {
    const req = mockRequest({ id: 1 }, {}, { description: "New Task" });
    const res = mockResponse();

    const mockTask = { id: 2, userId: 1, description: "New Task" };
    sandbox.stub(Task, "create").resolves(mockTask);

    await postTask(req, res);

    expect(Task.create).to.have.been.calledWith({ userId: 1, description: "New Task", dueDate: null });
    expect(res.status).to.have.been.calledWith(201);
    expect(res.json).to.have.been.calledWith({
      task: mockTask,
      status: true,
      msg: "Task created successfully.",
    });
  });

  // ✅ TEST: Update Task
  it("should update an existing task", async () => {
    const req = mockRequest({ id: 1 }, { taskId: 1 }, { description: "Updated Task" });
    const res = mockResponse();

    const mockTask = { update: sinon.stub().resolves({ id: 1, userId: 1, description: "Updated Task", dueDate: null }) };
    sandbox.stub(Task, "findOne").resolves(mockTask);

    await putTask(req, res);

    expect(mockTask.update).to.have.been.calledWith({ description: "Updated Task" }, { returning: true });
    expect(res.status).to.have.been.calledWith(200);
    expect(res.json).to.have.been.calledWith({
      task: mockTask,
      status: true,
      msg: "Task updated successfully.",
    });
  });

  it("should return 404 if task to update is not found", async () => {
    const req = mockRequest({ id: 1 }, { taskId: 1 }, { description: "Updated Task" });
    const res = mockResponse();

    sandbox.stub(Task, "findOne").resolves(null);

    await putTask(req, res);

    expect(res.status).to.have.been.calledWith(404);
    expect(res.json).to.have.been.calledWith({
      status: false,
      msg: "Task with given ID not found",
    });
  });

  // ✅ TEST: Delete Task
  it("should delete a task", async () => {
    const req = mockRequest({ id: 1 }, { taskId: 1 });
    const res = mockResponse();

    const mockTask = { destroy: sinon.stub().resolves() };
    sandbox.stub(Task, "findOne").resolves(mockTask);

    await deleteTask(req, res);

    expect(mockTask.destroy).to.have.been.called;
    expect(res.status).to.have.been.calledWith(200);
    expect(res.json).to.have.been.calledWith({
      status: true,
      msg: "Task deleted successfully.",
    });
  });

  it("should return 404 if task to delete is not found", async () => {
    const req = mockRequest({ id: 1 }, { taskId: 1 });
    const res = mockResponse();

    sandbox.stub(Task, "findOne").resolves(null);

    await deleteTask(req, res);

    expect(res.status).to.have.been.calledWith(404);
    expect(res.json).to.have.been.calledWith({
      status: false,
      msg: "Task with given ID not found",
    });
  });
});
