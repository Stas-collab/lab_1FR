const config = require('#config/config.js');
const { TASKS } = require('#data/tasks.js');
const { logRequest } = require('#utils/logger.js');
const {
  validatePost,
  validatePatch,
  validateQuery,
  validateParams,
} = require('#validators/taskValidator.js');

function sendResponse(res, req, status, data) {
  res.statusCode = status;
  res.end(JSON.stringify(data));

  if (config.NODE_ENV === 'development') {
    logRequest('INFO', req, status);
  } else if (status >= 400) {
    logRequest('ERROR', req, status);
  }
}

function getTasks(req, res, url) {
  const query = Object.fromEntries(url.searchParams);

  if (!validateQuery(query)) {
    return sendResponse(res, req, 400, {
      error: ajvErrors(validateQuery.errors),
    });
  }

  let result = [...TASKS];

  if (query.priority) {
    result = result.filter((t) => t.priority === query.priority);
  }

  return sendResponse(res, req, 200, result);
}

function createTask(req, res) {
  let body = '';

  req.on('data', (chunk) => (body += chunk.toString()));
  req.on('end', () => {
    try {
      const data = JSON.parse(body);

      if (!validatePost(data)) {
        return sendResponse(res, req, 400, {
          error: ajvErrors(validatePost.errors),
        });
      }

      const newTask = {
        id: TASKS.length ? TASKS[TASKS.length - 1].id + 1 : 1,
        title: data.title,
        done: Boolean(data.done),
        priority: data.priority,
      };

      TASKS.push(newTask);
      return sendResponse(res, req, 201, newTask);
    } catch {
      return sendResponse(res, req, 400, { error: 'Invalid JSON' });
    }
  });
}

function updateTask(req, res, pathname) {
  const id = pathname.split('/')[2];

  if (!validateParams({ id })) {
    return sendResponse(res, req, 400, { error: 'Invalid task id' });
  }

  const numId = Number(id);
  let body = '';

  req.on('data', (chunk) => (body += chunk.toString()));
  req.on('end', () => {
    try {
      const task = TASKS.find((t) => t.id === numId);

      if (!task) {
        return sendResponse(res, req, 404, { error: 'Task not found' });
      }

      const updates = JSON.parse(body);

      if (!validatePatch(updates)) {
        return sendResponse(res, req, 400, {
          error: ajvErrors(validatePatch.errors),
        });
      }

      delete updates.id;
      Object.assign(task, updates);
      return sendResponse(res, req, 200, task);
    } catch {
      return sendResponse(res, req, 400, { error: 'Invalid JSON' });
    }
  });
}

function deleteTask(req, res, pathname) {
  const id = pathname.split('/')[2];

  if (!validateParams({ id })) {
    return sendResponse(res, req, 400, { error: 'Invalid task id' });
  }

  const numId = Number(id);
  const initialLength = TASKS.length;

  const idx = TASKS.findIndex((t) => t.id === numId);

  if (idx === -1) {
    return sendResponse(res, req, 404, { error: 'Task not found' });
  }

  TASKS.splice(idx, 1);
  return sendResponse(res, req, 200, { message: 'Task deleted' });
}

function ajvErrors(errors) {
  return errors.map((e) => `${e.instancePath} ${e.message}`.trim()).join(', ');
}

module.exports = { getTasks, createTask, updateTask, deleteTask };
