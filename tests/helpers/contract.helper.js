// Shared PR-012 response assertions for API integration suites.
function data(response, status = 200) {
  expect(response.status).toBe(status);
  expect(response.headers["content-type"]).toMatch(/application\/json/);
  expect(Object.keys(response.body)).toEqual(["data"]);
  return response.body.data;
}

function error(response, status, message = expect.any(String)) {
  expect(response.status).toBe(status);
  expect(response.headers["content-type"]).toMatch(/application\/json/);
  expect(response.body).toEqual({ error: message });
}

module.exports = { data, error };
