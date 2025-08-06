const express = require('express');
const {
  uploadSingleFile,
  uploadMultipleFiles,
  uploadImage,
  uploadDocument,
  getFile,
  deleteUploadedFile,
  getFileList
} = require('../controllers/fileController');

const { 
  uploadSingle, 
  uploadMultiple, 
  validateFileUpload 
} = require('../middleware/upload');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     FileUpload:
 *       type: object
 *       properties:
 *         filename:
 *           type: string
 *           description: Generated filename on server
 *         originalName:
 *           type: string
 *           description: Original filename from client
 *         mimetype:
 *           type: string
 *           description: MIME type of the file
 *         size:
 *           type: number
 *           description: File size in bytes
 *         path:
 *           type: string
 *           description: File path on server
 *         url:
 *           type: string
 *           description: Relative URL to access the file
 *         publicUrl:
 *           type: string
 *           description: Full public URL to access the file
 *         uploadDate:
 *           type: string
 *           format: date-time
 *           description: When the file was uploaded
 */

/**
 * @swagger
 * /api/v1/files:
 *   get:
 *     summary: Get list of all uploaded files
 *     tags: [Files]
 *     responses:
 *       200:
 *         description: List of files retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/FileUpload'
 *                 count:
 *                   type: number
 *       500:
 *         description: Server error
 */
router.get('/', getFileList);

/**
 * @swagger
 * /api/v1/files/single:
 *   post:
 *     summary: Upload a single file
 *     tags: [Files]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: File to upload (max 10MB)
 *     responses:
 *       201:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/FileUpload'
 *                 message:
 *                   type: string
 *       400:
 *         description: No file uploaded or invalid file type
 *       500:
 *         description: Server error
 */
router.post('/single', uploadSingle('file'), validateFileUpload, uploadSingleFile);

/**
 * @swagger
 * /api/v1/files/multiple:
 *   post:
 *     summary: Upload multiple files
 *     tags: [Files]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Files to upload (max 5 files, 10MB each)
 *     responses:
 *       201:
 *         description: Files uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/FileUpload'
 *                 count:
 *                   type: number
 *                 message:
 *                   type: string
 *       400:
 *         description: No files uploaded or invalid file types
 */
router.post('/multiple', uploadMultiple('files', 5), validateFileUpload, uploadMultipleFiles);

/**
 * @swagger
 * /api/v1/files/image:
 *   post:
 *     summary: Upload an image file
 *     tags: [Files]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image file to upload (JPEG, PNG, GIF, WebP - max 10MB)
 *     responses:
 *       201:
 *         description: Image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   allOf:
 *                     - $ref: '#/components/schemas/FileUpload'
 *                     - type: object
 *                       properties:
 *                         type:
 *                           type: string
 *                           example: image
 *                 message:
 *                   type: string
 *       400:
 *         description: No image uploaded or file is not an image
 */
router.post('/image', uploadSingle('image'), validateFileUpload, uploadImage);

/**
 * @swagger
 * /api/v1/files/document:
 *   post:
 *     summary: Upload a document file
 *     tags: [Files]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               document:
 *                 type: string
 *                 format: binary
 *                 description: Document file to upload (PDF, Word, Excel, Text - max 10MB)
 *     responses:
 *       201:
 *         description: Document uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   allOf:
 *                     - $ref: '#/components/schemas/FileUpload'
 *                     - type: object
 *                       properties:
 *                         type:
 *                           type: string
 *                           example: document
 *                 message:
 *                   type: string
 *       400:
 *         description: No document uploaded or file is not a valid document type
 */
router.post('/document', uploadSingle('document'), validateFileUpload, uploadDocument);

/**
 * @swagger
 * /api/v1/files/{filename}:
 *   get:
 *     summary: Download or view a file
 *     tags: [Files]
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *         description: The filename to retrieve
 *     responses:
 *       200:
 *         description: File retrieved successfully
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *           image/*:
 *             schema:
 *               type: string
 *               format: binary
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Invalid filename
 *       404:
 *         description: File not found
 */
router.get('/:filename', getFile);

/**
 * @swagger
 * /api/v1/files/{filename}:
 *   delete:
 *     summary: Delete a file
 *     tags: [Files]
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *         description: The filename to delete
 *     responses:
 *       200:
 *         description: File deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 filename:
 *                   type: string
 *       400:
 *         description: Invalid filename
 *       404:
 *         description: File not found
 *       500:
 *         description: Failed to delete file
 */
router.delete('/:filename', deleteUploadedFile);

module.exports = router;