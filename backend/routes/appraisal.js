const express = require("express");

const {
    createAppraisal,
    getMyAppraisals,
    getAppraisal,
    respondToOffer,
    getAdminAppraisals,
    adminReviewAppraisal,
    convertAppraisal
} = require("../controllers/appraisalController");

const {
    isAuthenticatedUser,
    authorizeRoles,
    requireVerified
} = require("../middlewares/auth");

const { uploadAppraisalPhotos } = require("../utils/multer");

const router = express.Router();

// FR 3.1 / FR 3.2: a verified user submits an appraisal with photos.
router.post(
    "/appraisal/new",
    isAuthenticatedUser,
    requireVerified,
    uploadAppraisalPhotos,
    createAppraisal
);

router.get("/appraisals/me", isAuthenticatedUser, getMyAppraisals);
router.get("/appraisal/:id", isAuthenticatedUser, getAppraisal);
router.put("/appraisal/:id/respond", isAuthenticatedUser, respondToOffer);

// FR 3.3: the admin reviews, offers and converts.
router.get(
    "/admin/appraisals",
    isAuthenticatedUser,
    authorizeRoles("admin"),
    getAdminAppraisals
);
router.put(
    "/admin/appraisal/:id",
    isAuthenticatedUser,
    authorizeRoles("admin"),
    adminReviewAppraisal
);
router.post(
    "/admin/appraisal/:id/convert",
    isAuthenticatedUser,
    authorizeRoles("admin"),
    convertAppraisal
);

module.exports = router;
