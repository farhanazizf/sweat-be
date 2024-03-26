var express = require("express");
var router = express.Router();
let verification = require("../middleware/verification");

let controller = require("../controller");

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
});

router.get("/farhanx", (req, res) => {
  res.send("farhan");
});

router.get("/profile", verification("admin"), controller.showProfileDetails);

router.route("/arena").get(controller.showAllArena);

router.route("/booking/list").get(controller.getBookingTransaction);

router.route("/arena/:id").get(controller.showDetailsArena);

router.post("/arena/add", verification("admin"), controller.addArena);

router.post("/arena/booking", controller.addBookingTransaction);

router.route("/booking/:id_arena/list").get(controller.getBookingTransaction);

// Partner Endpoint
// router.route("/partner/booking/list").get(controller.getBookingByPartner);
// router.route("/partner/booking/status").put(controller.updateStatusBooking);
router.get(
  "/partner/booking/list",
  verification(["PARTNER", "admin"]),
  controller.getBookingByPartner
);

router.put(
  "/partner/booking/status",
  verification(["PARTNER", "admin"]),
  controller.updateStatusBooking
);

router.route("/online-payment").put(controller.confirmOnlinePayment);
// router.put(
//   "/online-payment",
//   verification(["PARTNER", "admin"]),
//   controller.confirmOnlinePayment
// );

router.get(
  "/partner/booking/detail/:id",
  verification(["PARTNER", "admin"]),
  controller.getBookingDetail
);

// router.route("/online-payment").put(controller.confirmOnlinePayment);

// router.route("/partner/booking/verify").get(controller.verifyBookingCode);
// router.get("/arena", verification("admin"), controller.showAllArena);

// router.get("/arena/booking-list", controller.getBookingTransaction);

router.route("/homepage").get(controller.showArenaHomepage);

router.route("/mahasiswa").get(controller.showAllMahasiswa);

// router.route("/mahasiswa/:id").get(controller.showDetailsMahasiswa);
router.get("/mahasiswa/:id", controller.showDetailsMahasiswa);

router.route("/mahasiswa").post(controller.addMahasiswa);

router.route("/mahasiswa").put(controller.editMahasiswa);

// router.get("/api/v1/profile", verification("user"), auth.endpointProfile);

module.exports = router;

// "use strict";

// module.exports = (app) => {
//   let jsonThis = require("./controller");

//   app.route("/").get(jsonThis.index);

//   app.route("/mahasiswa").get(jsonThis.showAllMahasiswa);

//   app.route("/mahasiswa/:id").get(jsonThis.showDetails);
// };
