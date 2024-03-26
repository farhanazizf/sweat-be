let mysql = require("mysql");

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "db_sweat",
});

connection.connect((err) => {
  if (err) {
    console.error("this is error");
    throw err;
  }

  console.log("connection db success");
});

module.exports = connection;
