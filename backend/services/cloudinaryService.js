const fs = require('fs');
const path = require('path');
const cloudinary = require('../config/cloudinary');

/**
 * Upload an image file to Cloudinary.
 * @param {string} filePath - Absolute path to the file to upload
 * @returns {Promise<Object>} - Cloudinary response with public_id, secure_url, url
 * @throws {Error} - If file doesn't exist or upload fails
 */
async function uploadImage(filePath) {
  try {
    // Validate file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    // Validate file extension
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const fileExt = path.extname(filePath).toLowerCase();
    if (!validExtensions.includes(fileExt)) {
      throw new Error(
        `Invalid file type: ${fileExt}. Supported types: ${validExtensions.join(', ')}`
      );
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: 'auto',
      folder: 'shades-of-sg',
      use_filename: true,
      unique_filename: true,
    });

    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      url: result.url,
      cloudinary_id: result.public_id,
    };
  } catch (error) {
    throw new Error(`Cloudinary upload failed: ${error.message}`, { cause: error });
  }
}

async function uploadImageBuffer(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new Error('Cloudinary upload failed: image data is required');
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'shades-of-sg/covers', resource_type: 'image' },
      (error, result) => {
        if (error) return reject(new Error(`Cloudinary upload failed: ${error.message}`, { cause: error }));
        return resolve({
          public_id: result.public_id,
          secure_url: result.secure_url,
        });
      }
    );
    stream.end(buffer);
  });
}

/**
 * Delete an image from Cloudinary by public ID.
 * @param {string} publicId - Cloudinary public ID of the image
 * @returns {Promise<Object>} - Cloudinary response with result status
 * @throws {Error} - If deletion fails
 */
async function deleteImage(publicId) {
  try {
    if (!publicId || typeof publicId !== 'string') {
      throw new Error('Invalid public_id: must be a non-empty string');
    }

    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result !== 'ok' && result.result !== 'not_found') {
      throw new Error(`Unexpected result from Cloudinary: ${result.result}`);
    }

    return {
      public_id: publicId,
      result: result.result,
      deleted: result.result === 'ok',
    };
  } catch (error) {
    throw new Error(`Cloudinary deletion failed: ${error.message}`, { cause: error });
  }
}

async function deleteAsset(publicId, resourceType = 'image') {
  if (!publicId || typeof publicId !== 'string') return { deleted: false, result: 'skipped' };
  try {
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    if (!['ok', 'not_found'].includes(result.result)) throw new Error(`Unexpected result from Cloudinary: ${result.result}`);
    return { public_id: publicId, result: result.result, deleted: result.result === 'ok' };
  } catch (error) {
    throw new Error(`Cloudinary deletion failed: ${error.message}`, { cause: error });
  }
}

module.exports = {
  uploadImage,
  uploadImageBuffer,
  deleteImage,
  deleteAsset,
};
