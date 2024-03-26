let express = require("express");
let auth = require("./auth");
let router = express.Router();
let verification = require("./verification");

router.post("/api/v1/register", auth.registerUser);
router.post("/api/v1/login", auth.loginUser);

// endpoint with token

// user endpoint
router.get("/api/v1/profile", verification("user"), auth.endpointProfile);

module.exports = router;
