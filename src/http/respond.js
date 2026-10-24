// All successful API responses carry their endpoint payload under data.
function success(res, data, status = 200) {
  return res.status(status).json({ data });
}

module.exports = { success };
