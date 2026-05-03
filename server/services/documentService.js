const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Document = require("../models/Document");
const { from_file } = require("file-type");
const logger = require("../utils/logger");
const { ALLOWED_MIME_TYPES } = require('../middleware/upload');

// Detect duplicate documents by computing a checksum of the file content
const _computeChecksum = (filePath) =>
    new Promise((resolve, reject) => {
        // Use a streaming approach to compute the checksum for large files without loading them entirely into memory
        const hash = crypto.createHash("sha256");
        const stream = fs.createReadStream(filePath);
        stream.on("data", (chunk) => hash.update(chunk));
        stream.on("end", () => resolve(hash.digest("hex")));
        stream.on("error", reject);
    });

// Move the file from temporary storage to permanent storage and return the new URL
const _moveToPermStorage = async (tmpPath, filename) => {
    const destDir = path.join(__dirname, "../uploads/documents");
    fs.mkdirSync(destDir, { recursive: true });
    const destPath = path.join(destDir, filename);
    await fs.promises.rename(tmpPath, destPath);
    return `/uploads/documents/${filename}`;
};

// File deletion utility to remove files from disk
const _deleteFileFromDisk = async (relativeStorageUrl) => {
    const absolutePath = path.join(__dirname, "..", relativeStorageUrl);
    try {
        await fs.promises.unlink(absolutePath);
    } catch (err) {
        logger.warn(
            { err, storageUrl: relativeStorageUrl },
            "Could not delete file from disk — it may have already been removed"
        );
    }
};

const createDocument = async ({ file, userId }) => {
    const tmpPath = file.path;

    try {
        const detectedType = await fromFile(tmpPath);
        // Definitive file type check, the fileFilter in upload.js is a preliminary gate based on the client-reported Content-Type.
        if (!detectedType || !ALLOWED_MIME_TYPES.has(detectedType.mime)) {
            const error = new Error(`File content does not match an allowed type. Detected: ${detectedType?.mime ?? "unknown"}`);
            error.status = 415;
            error.code = "UNSUPPORTED_FILE_TYPE";
            throw error;
        }

        // Duplicate detection using checksum
        const checksum = await _computeChecksum(tmpPath);

        const duplicate = await Document.findOne({ user: userId, checksum });
        if (duplicate) {
            const error = new Error("Duplicate document detected");
            error.status = 409;
            error.code = "DOCUMENT_ALREADY_EXISTS";
            throw error;
        }

        // Move file to permanent storage
        const storageUrl = await _moveToPermStorage(tmpPath, file.filename);

        // Create document record in database
        const document = await Document.create({
            user: userId,
            filename: file.originalname,
            mimeType: detectedType.mime,
            size: file.size,
            storageUrl,
            checksum,
            status: "pending",
        });

        return document;
    } catch (err) {
        // Clean up the temp file in case of any error to prevent orphaned files consuming disk space
        try {
            await fs.promises.unlink(tmpPath);
        } catch (cleanupErr) {
            logger.warn(
                { err: cleanupErr, tmpPath },
                "Failed to clean up temporary file after error"
            );
        }
        throw err;
    }
};

// Remove a document, ensuring that only the owner can delete it and that the file is removed from disk
const removeDocument = async ({ documentId, userId }) => {
    // Verify that the document exists and belongs to the user before attempting deletion
    const document = await Document.findOne({ _id: documentId, user: userId });

    // If the document doesn't exist or doesn't belong to the user, return a 404 Not Found error to prevent unauthorized access
    if (!document) {
        const error = new Error("Document not found");
        error.status = 404;
        error.code = "NOT_FOUND";
        throw error;
    }

    // Delete the file from disk
    await _deleteFileFromDisk(document.storageUrl);

    // Remove the document record from the database
    await Document.deleteOne({ _id: documentId });
};

// Retrieve all documents for a user, excluding sensitive fields like storageUrl and extractedText to optimize response size and protect sensitive information. Documents are sorted by creation date in descending order for better UX in the UI.
const getDocumentsByUser = async (userId) => {
    return Document.find({ user: userId })
        .select("-storageUrl -extractedText -checksum")
        .sort({ createdAt: -1 });
};

module.exports = { createDocument, removeDocument, getDocumentsByUser };