function logRequest(level, req, statusCode) {
  const agent = req.headers['user-agent'] || 'Unknown';
  const ip = req.socket.remoteAddress || 'Unknown';

  console.log(
    `[${level}] ${req.method} ${req.url} | Status: ${statusCode} | Agent: ${agent} | IP: ${ip}`
  );
}

module.exports = { logRequest };
