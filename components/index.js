const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
const sharp = require("sharp");
const {GoogleAuth} = require("google-auth-library");

admin.initializeApp();

const COLLECTION_AI_REQUESTS = "aiRequests";
const AI_API_URL = "https://fruit-detection-yolov9-xr4rlo3iba-uc.a.run.app/predict";

const STORAGE_FOLDER = "firefolder"; // The folder in the bucket where processed images will be stored

/**
 * Updates a Firestore document with the given data.
 * @param {FirebaseFirestore.DocumentReference} docRef - The document reference.
 * @param {Object} data - The data to update.
 * @return {Promise<void>}
 */
async function updateFirestore(docRef, data) {
  await docRef.set(data, {merge: true});
}

/**
 * Encodes an image buffer to base64.
 * @param {Buffer} imageBuffer - The image buffer to encode.
 * @return {Promise<string>} The base64 encoded image.
 */
async function encodeImage(imageBuffer) {
  const img = sharp(imageBuffer);
  const metadata = await img.metadata();

  const newWidth = Math.floor(metadata.width / 32) * 32;
  const newHeight = Math.floor(metadata.height / 32) * 32;

  const resizedBuffer = await img
      .resize(newWidth, newHeight)
      .toFormat("jpeg")
      .toBuffer();

  return resizedBuffer.toString("base64");
}

/**
 * Gets an identity token for authentication.
 * @return {Promise<string>} The identity token.
 */
async function getIdentityToken() {
  const auth = new GoogleAuth({
    scopes: "https://www.googleapis.com/auth/cloud-platform",
  });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  return token.token;
}

/**
 * Processes an image using the AI API.
 * @param {string} imageUrl - The URL of the image to process.
 * @param {string} fileName - The name of the image file.
 * @return {Promise<Object>} The processing result.
 */
async function processImage(imageUrl, fileName) {
  try {
    const response = await axios.get(imageUrl, {responseType: "arraybuffer"});
    const imageBuffer = Buffer.from(response.data, "binary");
    const encodedImage = await encodeImage(imageBuffer);

    const payload = [{
      img: encodedImage,
      name: fileName,
    }];

    console.log(
        `Sending request for file: ${fileName}, ` +
      `payload size: ${JSON.stringify(payload).length} bytes`,
    );

    const identityToken = await getIdentityToken();

    const {data} = await axios.post(AI_API_URL, payload, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${identityToken}`,
      },
      timeout: 300000, // 5 minutes timeout
    });

    console.log(`Received response for file: ${fileName}`);
    return data;
  } catch (error) {
    console.error(`Error processing image ${fileName}:`, error.message);
    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
    }
    throw error;
  }
}

/**
 * Converts base64 to image and uploads to Firebase Storage.
 * @param {string} base64Image - The base64 encoded image.
 * @param {string} fileName - The name of the image file.
 * @return {Promise<string>} The public URL of the uploaded image.
 */
async function uploadImageToStorage(base64Image, fileName) {
  const bucket = admin.storage().bucket(); // Use default bucket
  const imageBuffer = Buffer.from(base64Image, 'base64');
  const file = bucket.file(`${STORAGE_FOLDER}/${fileName}`);

  await file.save(imageBuffer, {
    metadata: {
      contentType: 'image/jpeg',
    },
  });

  await file.makePublic();

  return file.publicUrl(); // Use the built-in method to get the public URL
}

exports.processAiRequest = functions
    .runWith({memory: "1GB", timeoutSeconds: 540}) // 9 minutes timeout
    .firestore.document(`${COLLECTION_AI_REQUESTS}/{requestId}`)
    .onCreate(async (snap, context) => {
      const {requestId} = context.params;
      const requestData = snap.data();
      const {fileName, downloadURL, tokenId} = requestData;

      console.log(
          `AI request received. Request ID: ${requestId}, ` +
          `File Name: ${fileName}, Token ID: ${tokenId}`
      );

      const docRef = snap.ref;

      try {
        await updateFirestore(docRef, {
          status: "processing",
          processingStartTime: admin.firestore.FieldValue.serverTimestamp(),
        });

        const result = await processImage(downloadURL, fileName);

        let processedResult = null;
        if (result && result.predictions && result.predictions.length > 0) {
          const prediction = result.predictions[0];
          
          // Upload the visualization image to Storage
          const visualizationUrl = await uploadImageToStorage(prediction.visualization, `${fileName}_processed.jpg`);

          processedResult = {
            name: prediction.name,
            detections: prediction.detections,
            visualization: visualizationUrl, // Store the URL instead of base64
          };
        }

        await updateFirestore(docRef, {
          status: "completed",
          processingResults: processedResult,
          processingEndTime: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log(`Processing completed for: ${requestId}, File Name: ${fileName}`);
      } catch (error) {
        console.error(
            `Error processing: ${requestId}, File Name: ${fileName}`,
            error,
        );
        await updateFirestore(docRef, {
          status: "error",
          error: error.message,
          processingEndTime: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    });

