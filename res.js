"use strict";

exports.ok = (val, res, type, total) => {
  const isMultiRows = val.length > 1 || type === "array";
  let data = {
    status: 200,
    data: isMultiRows ? val : typeof val === "string" ? val : val[0] ?? val,
    meta: isMultiRows ? { total } : null,
  };

  res.json(data);
  res.end();
};

exports.error = (val, res, status) => {
  let data = {
    status: status ?? 401,
    data:
      typeof val === "string"
        ? { message: val, success: false }
        : { ...val, success: false },
  };

  if (status) {
    res.status(status).send(data);
  } else {
    res.status(400).send(data);
    // res.json(data);
  }
  res.end();
};
