const { getTasks, createTask, updateTask, deleteTask } = require('#controllers/tasksController.js');

function handleTaskRoutes(req, res, method, pathname, url) {
  if (method === 'GET' && pathname === '/tasks') {
    return getTasks(req, res, url);
  }

  if (method === 'POST' && pathname === '/tasks') {
    return createTask(req, res);
  }

  if (method === 'PATCH' && pathname.startsWith('/tasks/')) {
    return updateTask(req, res, pathname);
  }

  if (method === 'DELETE' && pathname.startsWith('/tasks/')) {
    return deleteTask(req, res, pathname);
  }

  return false;
}

module.exports = { handleTaskRoutes };
