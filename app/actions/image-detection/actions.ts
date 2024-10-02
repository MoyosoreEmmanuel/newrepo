"use server";

import { revalidatePath } from "next/cache";
import axios from "axios";

const AI_API_URL = "https://fruit-detection-yolov9-test-6486616464.us-central1.run.app/predict";

interface DetectionResult {
  detections: Array<{ label: string; confidence: number; bbox: number[] }>;
  visualization: string;
}

interface ImageInput {
  url: string;
  fileName: string;
}

export async function detectObjects(images: ImageInput[]): Promise<{ results: DetectionResult[]; errors: { fileName: string; error: string }[] }> {
  console.log("Starting object detection process");

  const results: DetectionResult[] = [];
  const errors: { fileName: string; error: string }[] = [];

  for (const image of images) {
    try {
      const payload = [
        {
          img: image.url,
          name: image.fileName,
        },
      ];

      console.log(`Sending request to: ${AI_API_URL}`);
      console.log("Payload:", JSON.stringify(payload));

      const { data } = await axios.post(AI_API_URL, payload, {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 300000, // 5 minutes timeout
      });

      console.log("Detection successful. Result:", JSON.stringify(data));
      results.push(data.predictions[0]);
    } catch (error) {
      console.error("Error in detectObjects:", error);
      if (axios.isAxiosError(error)) {
        console.error("Response status:", error.response?.status);
        console.error("Response data:", error.response?.data);
        console.error("Request config:", error.config);
      }
      errors.push({ 
        fileName: image.fileName, 
        error: error instanceof Error ? error.message : "An unexpected error occurred" 
      });
    }
  }

  revalidatePath("/image-detection");
  return { results, errors };
}