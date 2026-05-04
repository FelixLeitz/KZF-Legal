const multer = require('multer');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

// Configuration
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = new Set([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
]);
const ALLOWED_EXTENSIONS = new Set(['.pdf', '.doc', '.docx', '.txt']);

// Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, "../uploads/tmp");
        // Ensure the temp directory exists
        fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    // Generate a cryptographically random filename
    filename: (req, file, cb) => {
        const randomName = crypto.randomBytes(32).toString("hex");
        const ext = path.extname(file.originalname).toLowerCase();
        // Use the random name with the original file extension to prevent filename collisions and maintain file type information
        cb(null, `${randomName}${ext}`);
    },
});

// Multer file filter for validating file types
const fileFilter = (req, file, cb) => {
    // Validate MIME type and file extension against allowed lists to prevent malicious uploads
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
        const error = new Error(`Unsupported MIME type: ${file.mimetype}`);
        error.status = 415;
        error.code = "UNSUPPORTED_FILE_TYPE";
        return cb(error, false);
    }

    // Extract the file extension
    const ext = path.extname(file.originalname).toLowerCase();
    // Validate file extension to prevent files with spoofed MIME types from being uploaded
    if (!ALLOWED_EXTENSIONS.has(ext)) {
        const error = new Error(`Unsupported file extension: ${ext}`);
        error.status = 415;
        error.code = "UNSUPPORTED_FILE_TYPE";
        return cb(
            error,
            false
        );
    }

    // If both MIME type and extension are valid, accept the file
    cb(null, true);
};

// Multer upload configuration
const upload = multer({
    storage,
    fileFilter,
    // Limit file size and number of files to prevent abuse and ensure server stability
    limits: {
        fileSize: MAX_FILE_SIZE_BYTES,
        files: 1,
    },
});

module.exports = { upload, ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES };