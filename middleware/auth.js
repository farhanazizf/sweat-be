let connection = require("../connection");
let mysql = require("mysql");
let md5 = require("md5");
let response = require("../res");
let jwt = require("jsonwebtoken");
let config = require("../config/secret");
let uuid = require("uuid");

exports.registerUser = (req, res) => {
  let post = {
    id: uuid.v4(),
    username: req.body.username,
    email: req.body.email,
    password: md5(req.body.password),
    role: req.body.role,
    registration_date: new Date(),
  };

  let query = "SELECT email FROM ?? WHERE ??=?";
  let table = ["tbl_account", "email", post.email];

  query = mysql.format(query, table);

  connection.query(query, (error, rows) => {
    if (error) {
      console.log(error);
    } else {
      if (rows.length === 0) {
        let query = "INSERT INTO ?? SET ?";
        let table = ["tbl_account"];
        query = mysql.format(query, table);

        connection.query(query, post, (err, rows) => {
          if (err) {
            console.log(err);
          } else {
            let users = {
              id: uuid.v4(),
              id_account: post.id,
              name: req.body.name,
              phone: req.body.phone,
              address: req.body.address,
              city: req.body.city,
              arena_name: req.body.arena_name,
              updated_at: new Date(),
            };

            let query2 = "INSERT INTO ?? SET ?";
            let table2 = ["tbl_user"];
            query2 = mysql.format(query2, table2);

            connection.query(query2, users, (errs, rowss) => {
              if (errs) {
                console.log(errs);
              } else {
                response.ok("Success add new user!", res);
              }
            });
          }
        });
      } else {
        response.ok("Email already registered!", res);
      }
    }
  });
};

exports.loginUser = (req, res) => {
  // console.log(req.body);
  let post = {
    email: req.body.email,
    password: req.body.password,
  };

  let query = `SELECT id,email,password,role FROM ?? WHERE ??=? AND ??=?`;
  let table = [
    "tbl_account",
    "password",
    md5(post.password),
    "email",
    post.email,
  ];

  query = mysql.format(query, table);

  connection.query(query, (error, rows) => {
    if (error) {
      response.error(`${error.message}`, res);
    } else {
      if (rows.length === 1) {
        // console.log(rows);
        let id_account = rows[0].id;
        let role = rows[0].role;

        let queryGetProfile = `SELECT id,name FROM ?? WHERE id_account='${id_account}'`;
        queryGetProfile = mysql.format(queryGetProfile, ["tbl_user"]);

        connection.query(queryGetProfile, (e, result) => {
          let data = {
            id_account,
            id_user: result[0].id,
            role,
            // ip_address: ip.address(),
          };

          let token = jwt.sign({ ...data }, config.secret, {
            expiresIn: "1d",
          });

          let queryToken = `INSERT INTO ?? SET ?`;
          let tables = ["tbl_token"];

          queryToken = mysql.format(queryToken, tables);

          connection.query(queryToken, { id_account, token }, (err, rowss) => {
            if (err) {
              response.error(`${err.message}`, res);
            } else {
              // console.log("RES", result[0].id);
              res.json({
                success: true,
                message: "Success generate token!",
                token,
                account: data.id_account,
                user: result[0].id,
                role,
                name: result[0].name,
              });
            }
          });
        });
      } else {
        response.error(`Please check again your email or password`, res);
      }
    }
  });
};

exports.endpointProfile = (req, res) => {
  // jwt.decode(req.authorization);
  response.ok(`access granted`, res);
};
