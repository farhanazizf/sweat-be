"use strict";

const jwt = require("jsonwebtoken");
let uuid = require("uuid");
let moment = require("moment");
let mysql = require("mysql");

let response = require("./res");
let connection = require("./connection");

exports.index = (req, res) => {
  response.ok("Apps REST is running!", res);
};

exports.showProfileDetails = (req, res) => {
  const tokenBearer = req.headers.authorization;

  if (tokenBearer) {
    let token = tokenBearer.split(" ")?.[1];
    let jwtDecode = jwt.decode(token);
    const id = jwtDecode.id_user;
    // console.log("profile", jwtDecode);
    connection.query(
      `SELECT usr.id, usr.name, usr.phone, acc.id as id_acc, acc.email, acc.username, acc.role FROM tbl_account as acc INNER JOIN tbl_user as usr ON acc.id = usr.id_account WHERE acc.id=?`,
      [id],
      (err, rows, fields) => {
        if (err) {
          console.log(err);
        } else {
          response.ok(rows, res);
        }
      }
    );
  }
};

exports.showAllArena = (req, res) => {
  const ITEMS_PER_PAGE = parseInt(req.query.limit) || 10;
  const page = parseInt(req.query.page) || 1;
  const category = req.query.category || undefined;

  // const offset = (page - 1) * ITEMS_PER_PAGE;
  const offset = parseInt(req.query.offset) || 0;

  // const query = "SELECT SUM(1) AS row_count FROM tbl_arena";

  // connection.query(
  //   `SELECT SUM(1) AS row_count FROM tbl_arena`,
  //   [category],
  //   (err, rows, fields) => {
  //     if (err) {
  //       console.log(err);
  //     } else {
  //       const rowCount = rows[0].row_count;
  //       console.log(`Total rows: ${rowCount}`);
  //       res.sendStatus(rowCount);
  //       // response.ok(rows, res, "array");
  //     }
  //   }
  // );

  // console.log("totals", totals);

  connection.query(
    `SELECT id,name,category,image,city FROM tbl_arena ${
      category ? `WHERE category = "${category}"` : ""
    } LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset} `,
    [category],
    (err, rows, fields) => {
      if (err) {
        console.log(err);
      } else {
        const query = "SELECT SUM(1) AS row_count FROM tbl_arena";

        connection.query(query, (errTotals, rowsTotal) => {
          if (errTotals) {
            console.log(errTotals);
          } else {
            const rowCount = rowsTotal[0].row_count;
            // console.log(`Total rows: ${rowCount}`);
            response.ok(rows, res, "array", rowCount);
          }
        });
      }
    }
  );
};

exports.showArenaHomepage = (req, res) => {
  const ITEMS_PER_PAGE = 10;
  const page = parseInt(req.query.page) || 1;
  const offset = (page - 1) * ITEMS_PER_PAGE;

  connection.query(
    `SELECT id, name, image, category, created_at
      FROM (
        SELECT
          id,
          name,
          image,
          created_at,
          category,
          ROW_NUMBER() OVER (PARTITION BY category ORDER BY created_at DESC) as row_num
        FROM tbl_arena
      ) ranked
      WHERE row_num <= 2;
    `,
    (err, rows, fields) => {
      if (err) {
        console.log(err);
      } else {
        const categorizedItems = {};

        rows.forEach((item) => {
          if (!categorizedItems[item.category]) {
            categorizedItems[item.category] = [];
          }
          categorizedItems[item.category].push({
            id: item.id,
            name: item.name,
            image: item.image,
          });
        });

        response.ok({ name: "farjan", ...categorizedItems }, res, "array");
      }
    }
  );
};

exports.showDetailsArena = (req, res) => {
  let id = req.params.id;

  connection.query(
    `SELECT id,name,category,price,city,address,url_location,image,description FROM tbl_arena WHERE id = ?`,
    [id],
    (err, rows, fields) => {
      if (err) {
        console.log(err);
      } else {
        response.ok(rows, res);
      }
    }
  );
};

exports.addArena = (req, res) => {
  const tokenBearer = req.headers.authorization;

  if (tokenBearer) {
    let token = tokenBearer.split(" ")[1];
    let jwtDecode = jwt.decode(token);
    const id = jwtDecode.id_user;

    // if(req.body.city)
    let post = {
      id: uuid.v4(),
      name: req.body.name,
      description: req.body.description,
      city: req.body.city ?? "",
      category: req.body.category?.toUpperCase(),
      price: req.body.price,
      address: req.body.price,
      url_location: req.body.url_location,
      id_user: "c5edb4fd-4537-4e4a-9d0d-9a47ef368b10",
      created_at: new Date(),
    };

    let query = "SELECT name FROM ?? WHERE ??=?";
    let table = ["tbl_arena", "name", post.name];

    query = mysql.format(query, table);

    connection.query(query, (error, rows) => {
      if (error) {
        console.log(error);
      } else {
        if (rows.length === 0) {
          let query1 = "INSERT INTO ?? SET ?";
          let table1 = ["tbl_arena"];
          query1 = mysql.format(query1, table1);

          connection.query(query1, post, (err, rowss) => {
            if (err) {
              response.error(`${err.message}`, res);
            } else {
              response.ok("Success add new arena!", res);
            }
          });
        } else {
          response.ok("Arena already added!", res);
        }
      }
    });
  }
};

exports.getBookingTransaction = (req, res) => {
  const tokenBearer = req.headers.authorization;
  const noToken = tokenBearer === "Bearer" || tokenBearer === undefined;
  let token = !noToken ? tokenBearer.split(" ")[1] : "";
  let jwtDecode = !noToken ? jwt.decode(token) : "";
  const id_user = !noToken
    ? jwtDecode.id_user
    : "7a109f0b-f26e-4a80-ac8c-0038495f9e63"; // default value is guest

  const id_arena = req.params.id_arena;
  const ITEMS_PER_PAGE = parseInt(req.query.limit) || 10;
  const page = parseInt(req.query.page) || 1;
  const category = req.query.category || undefined;
  const bodyDate = req.query.date;
  // const bodyDate = "2023-11-18T01:00:00+07:00";
  const timeType = req.query.time_type; //"hours" || "days" || "month"

  const dateFormat = new Date(bodyDate);

  const dateString = moment(dateFormat).format();
  // const filterHours = `${new Date().toISOString().slice(0, -1)}+07:00`;
  const filterHours = dateFormat.getHours();

  const filterDate = dateString.slice(0, 10);
  // console.log("date", moment(dateFormat).format());

  const filterMonth = dateString.slice(0, 7);
  // console.log("month", filterMonth);
  const filterYear = dateFormat.getFullYear();

  // const timeType = "hours" || "days" || "month";

  const offset = (page - 1) * ITEMS_PER_PAGE;

  const queryHours = `start_time LIKE '${filterDate} ${filterHours}%';`;

  const queryDate = `start_time LIKE '${filterDate + "%"}';`;

  const queryMonth = `start_time LIKE '${filterMonth + "%"}';`;

  const filterQuery = (type) => {
    switch (type) {
      case "hours":
        return queryHours;
      case "month":
        return queryMonth;
      case "date":
      default:
        return queryDate;
    }
  };

  connection.query(
    `SELECT id,booking_name,start_time,end_time,id_arena,status FROM tbl_transaction WHERE id_arena = ? AND status in ('PAID','DONE','VERIFIED') AND ${filterQuery(
      timeType
    )}`,
    [id_arena],
    (err, rows, fields) => {
      if (err) {
        console.log(err);
      } else {
        response.ok(rows, res, "array");
      }
    }
  );
};

exports.addBookingTransaction = (req, res) => {
  const tokenBearer = req.headers.authorization;

  const noToken = tokenBearer === "Bearer";
  // if (tokenBearer) {
  let token = !noToken ? tokenBearer.split(" ")[1] : "";
  let jwtDecode = !noToken ? jwt.decode(token) : "";
  const id_user = !noToken
    ? jwtDecode.id_user
    : "7a109f0b-f26e-4a80-ac8c-0038495f9e63"; // default value is guest

  // if(req.body.city)
  let post = {
    id: uuid.v4(),
    booking_name: req.body.booking_name,
    start_time: new Date(req.body.start_time),
    end_time: new Date(req.body.end_time),
    status: "SUBMITTED",
    id_arena: req.body.id_arena,
    code: req.body.code,
    hours: req.body.hours,
    total: req.body.total,
    phone: req.body.phone,
    created_at: new Date(),
    id_user: id_user,
  };

  let query = "SELECT code FROM ?? WHERE ??=?";
  let table = ["tbl_transaction", "code", post.code];

  query = mysql.format(query, table);

  connection.query(query, (error, rows) => {
    if (error) {
      console.log(error);
    } else {
      if (rows.length === 0) {
        let query1 = "INSERT INTO ?? SET ?";
        let table1 = ["tbl_transaction"];
        query1 = mysql.format(query1, table1);

        connection.query(query1, post, (err, rowss) => {
          if (err) {
            response.error(`${err.message}`, res);
          } else {
            // console.log("res", rowss);
            response.ok([{ id: post.id }], res, "");
          }
        });
      } else {
        response.ok("Arena already added!", res);
      }
    }
  });
  // }
};

// exports.updateBookingTransaction = (req, res) => {
//   // const tokenBearer = req.headers.authorization;

//   // if (tokenBearer) {
//   // let token = tokenBearer.split(" ")[1];
//   // let jwtDecode = jwt.decode(token);
//   // const id_user = jwtDecode.id_user;

//   // if(req.body.city)
//   let post = {
//     id: uuid.v4(),
//     booking_name: req.body.booking_name,
//     start_time: new Date(req.body.start_time),
//     end_time: new Date(req.body.end_time),
//     status: "SUBMITTED",
//     id_arena: req.body.id_arena,
//     code: req.body.code,
//     hours: req.body.hours,
//     total: req.body.total,
//     phone: req.body.phone,
//     created_at: new Date(),
//     // id_user: id_user ?? "c5edb4fd-4537-4e4a-9d0d-9a47ef368b10",
//   };

//   let query = "SELECT code FROM ?? WHERE ??=?";
//   let table = ["tbl_transaction", "code", post.code];

//   query = mysql.format(query, table);

//   connection.query(query, (error, rows) => {
//     if (error) {
//       console.log(error);
//     } else {
//       if (rows.length === 0) {
//         let query1 = "INSERT INTO ?? SET ?";
//         let table1 = ["tbl_transaction"];
//         query1 = mysql.format(query1, table1);

//         connection.query(query1, post, (err, rowss) => {
//           if (err) {
//             response.error(`${err.message}`, res);
//           } else {
//             response.ok(
//               "Success submit booking, please ASAP pay the booking's bill!",
//               res
//             );
//           }
//         });
//       } else {
//         response.ok("Arena already added!", res);
//       }
//     }
//   });
//   // }
// };

exports.showAllMahasiswa = (req, res) => {
  connection.query(
    `SELECT name,id,university,major FROM mahasiswa`,
    (err, rows, fields) => {
      if (err) {
        console.log(err);
      } else {
        response.ok(rows, res);
      }
    }
  );
};

exports.showDetailsMahasiswa = (req, res) => {
  let id = req.params.id;
  connection.query(
    `SELECT name,id,university,major FROM mahasiswa WHERE id = ?`,
    [id],
    (err, rows, fields) => {
      if (err) {
        console.log(err);
      } else {
        response.ok(rows[0], res);
      }
    }
  );
};

exports.getBookingByPartner = (req, res) => {
  const tokenBearer = req.headers.authorization;
  const noToken = tokenBearer === "Bearer" || tokenBearer === undefined;
  let token = !noToken ? tokenBearer.split(" ")[1] : "";
  let jwtDecode = !noToken ? jwt.decode(token) : "";
  const id_user = !noToken
    ? jwtDecode.id_user
    : "7a109f0b-f26e-4a80-ac8c-0038495f9e63"; // default value is guest

  const ITEMS_PER_PAGE = parseInt(req.query.limit ?? "10");
  const page = parseInt(req.query.page ?? "1");

  const offset = (page - 1) * ITEMS_PER_PAGE;

  const code = req.query.code;
  console.log(code);
  connection.query(
    `SELECT a.*, b.id_user as id_partner, b.name as venue FROM tbl_transaction AS a JOIN tbl_arena AS b ON a.id_arena = b.id WHERE b.id_user = ? ${
      code ? `AND a.code = '${code}'` : ""
    } ORDER BY created_at DESC LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset};`,
    [id_user],
    (err, rows, fields) => {
      if (err) {
        console.error(err);
      } else {
        connection.query(
          `SELECT COUNT(b.id_user) as total FROM tbl_transaction AS a JOIN tbl_arena AS b ON a.id_arena = b.id WHERE b.id_user = ? ;`,
          [id_user],
          (errTotal, rowsTotal) => {
            if (errTotal) {
              console.error(errTotal);
            } else {
              response.ok(rows, res, "array", rowsTotal[0].total);
            }
          }
        );
      }
    }
  );
};

exports.updateStatusBooking = (req, res) => {
  const tokenBearer = req.headers.authorization;
  const noToken = tokenBearer === "Bearer" || tokenBearer === undefined;
  let token = !noToken ? tokenBearer.split(" ")[1] : "";
  let jwtDecode = !noToken ? jwt.decode(token) : "";
  // console.log(jwtDecode);
  // const id_user = !noToken
  //   ? jwtDecode.id_user
  //   : "7a109f0b-f26e-4a80-ac8c-0038495f9e63"; // default value is guest

  let status = req.body.status;
  let code = req.body.code;

  const timeNow = moment().format("YYYY-MM-DD HH:mm:ss");

  // const isAdmin = jwtDecode.role === "admin";
  // const selectedStatus = isAdmin ? status : "PAID";

  const byNavbar = status === "DONE";

  if (!noToken && status && code) {
    let query = `SELECT code,id_arena,status FROM tbl_transaction WHERE code=?`;
    let table = [code];

    query = mysql.format(query, table);

    connection.query(query, (error, rows) => {
      if (error) {
        response.error(
          "Internal server error, please try again later",
          res,
          400
        );
      } else {
        if (rows.length > 0 && byNavbar) {
          const isVerified = rows[0].status === "VERIFIED";
          const isDone = rows[0].status === "DONE";

          if (isVerified) {
            connection.query(
              `UPDATE tbl_transaction SET status=? WHERE code=?`,
              ["DONE", code],
              (err) => {
                if (err) {
                  response.error(err.message, res, 400);
                } else {
                  response.ok(
                    {
                      message: "Success edit data!",
                      id_arena: rows[0].id_arena,
                    },
                    res
                  );
                }
              }
            );
          } else if (isDone) {
            response.error(
              "Kode sudah selesai di konfirmasi atau booking sedang berjalan!",
              res,
              400
            );
          } else {
            response.error(
              "Kode belum di verifikasi, Silahkan verifikasi kode terlebih dahulu melalui list Booking!",
              res,
              400
            );
          }
        } else if (rows.length > 0 && !byNavbar) {
          connection.query(
            `UPDATE tbl_transaction SET status=?, paid_at='${timeNow}' WHERE code=?`,
            [status, code],
            (err) => {
              if (err) {
                response.error(err.message, res, 400);
              } else {
                response.ok(
                  {
                    message: "Berhasil melakukan update data!",
                    id_arena: rows[0].id_arena,
                  },
                  res
                );
              }
            }
          );
        } else {
          response.error("Kode booking tidak ditemukan!", res, 400);
        }
      }
    });
  } else {
    response.error(
      "Terjadi kesalahan pada sistem, silahkan coba beberapa saat lagi",
      res,
      !status || !code ? 400 : 401
    );
  }
};

exports.confirmOnlinePayment = (req, res) => {
  // this endpoint just for update status to PAID, use by user who's booking
  const tokenBearer = req.headers.authorization;
  const emptyToken = tokenBearer === "Bearer";

  let status = "PAID";
  let code = req.body.code;

  const timeNow = moment().format("YYYY-MM-DD HH:mm:ss");

  if (emptyToken && status && code) {
    let query = `SELECT code,id_arena FROM tbl_transaction WHERE code=?`;
    let table = [code];

    query = mysql.format(query, table);

    connection.query(query, (error, rows) => {
      if (error) {
        response.error(
          "Internal server error, please try again later",
          res,
          400
        );
      } else {
        if (rows.length > 0) {
          connection.query(
            `UPDATE tbl_transaction SET status=?${
              status === "PAID" ? ` , paid_at='${timeNow}'` : ""
            } WHERE code=?`,
            [status, code],
            (err) => {
              if (err) {
                response.error(err.message, res, 400);
              } else {
                response.ok(
                  {
                    message:
                      "Success payment for booking, wait for verification from partner!",
                    id_arena: rows[0].id_arena,
                  },
                  res
                );
              }
            }
          );
        } else {
          response.error("Booking code not found!", res, 400);
        }
      }
    });
  } else {
    response.error(
      "Internal server error, please try again later",
      res,
      !status || !code ? 400 : 401
    );
  }
};

exports.getBookingDetail = (req, res) => {
  const tokenBearer = req.headers.authorization;
  let code = req.params.id;

  if (code) {
    // let query = `SELECT code,id_arena,booking_name,start_time,end_time,status FROM tbl_transaction WHERE code=?`;
    let query = `SELECT a.*, b.id_user as id_partner, b.name as venue FROM tbl_transaction AS a JOIN tbl_arena AS b ON a.id_arena = b.id WHERE a.code = ?`;
    let table = [code];

    query = mysql.format(query, table);

    connection.query(query, (error, rows) => {
      if (error) {
        response.error(
          "Internal server error, please try again later",
          res,
          400
        );
      } else {
        if (rows.length > 0) {
          response.ok(rows[0], res, "object");
        } else {
          response.error("Booking code not found!", res, 400);
        }
      }
    });
  } else {
    response.error("fail edit!", res, 401);
  }
};

// POST
exports.addMahasiswa = (req, res) => {
  let id = req.body.id;
  let name = req.body.name;
  let major = req.body.major;
  let university = req.body.university;

  connection.query(
    `INSERT INTO mahasiswa (id,name,major,university) VALUES(?,?,?,?)`,
    [id, name, major, university],
    (err, rows, fields) => {
      if (err) {
        console.log(err);
        return err.message;
      } else {
        response.ok("Success add data!", res);
      }
    }
  );
};

// PUT
exports.editMahasiswa = (req, res) => {
  let id = req.body.id;
  let name = req.body.name;
  let major = req.body.major;
  let university = req.body.university;

  connection.query(
    `UPDATE mahasiswa SET name=?, major=?, university=? WHERE id=?`,
    [name, major, university, id],
    (err, rows, fields) => {
      if (err) {
        console.log(err);
        return err.message;
      } else {
        response.ok("Success edit data!", res);
      }
    }
  );
};
