let connection = require("../connection");
const jwt = require("jsonwebtoken");
const config = require("../config/secret");
const res = require("../res");

const verification = (setRoles) => {
  return (req, rest, next) => {
    // for checking authorization header

    const isMultipleRoles = typeof setRoles !== "string";
    const tokenBearer = req.headers.authorization;
    if (tokenBearer !== "Bearer") {
      let token = tokenBearer.split(" ")[1];
      let jwtDecode = jwt.decode(token);
      // console.log("jwts", jwtDecode);
      const roles = jwtDecode?.rows?.[0]
        ? jwtDecode.rows[0].role
        : jwtDecode.role;

      jwt.verify(token, config.secret, (err, decoded) => {
        if (err) {
          connection.query(
            `DELETE from tbl_token WHERE token=?`,
            [token],
            (err) => {
              if (err) {
                // response.error(err.message, res, 400);
              } else {
                return res.error(
                  `You dont have access to this endpoint!`,
                  rest,
                  404
                );
              }
            }
          );
        } else {
          if (!isMultipleRoles) {
            if (roles === setRoles) {
              req.auth = decoded;

              next();
            } else {
              res.error(`You dont have access to this endpoint!`, rest, 404);
            }
          } else {
            if ([...setRoles].includes(roles)) {
              req.auth = decoded;
              next();
            } else {
              res.error(`You dont have access to this endpoint!`, rest, 404);
            }
          }
        }
      });
    } else {
      res.error(`Invalid Token!`, rest, 404);
    }
  };
};

module.exports = verification;
