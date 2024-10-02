"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { database } from "@/firebaseConfig";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckIcon, Loader2Icon, SearchIcon, XIcon } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface Prediction {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  class: string;
}

interface ArrayData {
  id: string;
  fileName: string;
  downloadURL: string;
  fileType: string;
}

export default function CropDetectionWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [output, setOutput] = useState<Prediction[] | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const { userId } = useAuth();
  const [uploadedImages, setUploadedImages] = useState<ArrayData[]>([]);

  const steps = [
    { title: "Choosing crop", description: "Select your crop" },
    { title: "Pick files", description: "Select uploaded crop files" },
    { title: "Process files", description: "Start processing files" },
    { title: "View results", description: "Review results" },
  ];

  useEffect(() => {
    const fetchUploadedImages = async () => {
      if (userId) {
        const filesCollection = collection(database, "files");
        const q = query(
          filesCollection,
          where("userId", "==", userId),
          where("fileType", "==", "image/jpeg")
        );

        const querySnapshot = await getDocs(q);
        const images = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as ArrayData[];
        setUploadedImages(images);
      }
    };

    fetchUploadedImages();
  }, [userId]);

  const handleImageSelect = async (image: ArrayData) => {
    try {
      const response = await axios.get(image.downloadURL, {
        responseType: "blob",
      });

      const downloadedFile = new File([response.data], image.fileName, {
        type: response.data.type,
      });

      setFile(downloadedFile);
      setImage(URL.createObjectURL(downloadedFile));
      setCurrentStep(2);
    } catch (error) {
      console.error("Error downloading the image:", error);
    }
  };

  const encodeImage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result?.toString().split(",")[1] || "");
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handlePrediction = async () => {
    setCurrentStep(3);
    setProgress(0);

    if (file) {
      try {
        // Convert the file to a Base64 string
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = async () => {
          const base64Image = reader.result?.toString().split(",")[1];
          console.log("Base64 encoded image:", base64Image);

          const predictionResponse = await axios.post(
            "https://detect.roboflow.com/apple-ifwsc/4",
            base64Image,
            {
              params: {
                api_key: "8W2hsuWEvMQg48zOnwaf",
              },
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
              onUploadProgress: (progressEvent) => {
                const percentCompleted = Math.round(
                  (progressEvent.loaded * 100) / progressEvent.total!
                );
                console.log("Prediction progress:", percentCompleted, "%");
                setProgress(percentCompleted);
              },
            }
          );
          console.log("Prediction response:", predictionResponse.data);
          setOutput(predictionResponse.data.predictions);

          // Process the image and draw the predictions on it
          const img = new Image();
          img.src = URL.createObjectURL(file);
          img.onload = async () => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            canvas.width = img.width;
            canvas.height = img.height;
            ctx?.drawImage(img, 0, 0);

            predictionResponse.data.predictions.forEach(
              (prediction: Prediction) => {
                ctx?.beginPath();
                ctx?.rect(
                  prediction.x - prediction.width / 2,
                  prediction.y - prediction.height / 2,
                  prediction.width,
                  prediction.height
                );
                ctx!.lineWidth = 2;
                ctx!.strokeStyle = "red";
                ctx!.stroke();
              }
            );
            const processedImageUrl = canvas.toDataURL("image/jpeg");
            console.log("Processed image URL:", processedImageUrl);
            setProcessedImage(processedImageUrl);
          };
          setCurrentStep(4);
        };
      } catch (error) {
        console.error("Error detecting image:", error);
        setOutput(null);
      }
    }
  };

  const resetWizard = () => {
    setCurrentStep(1);
    setFile(null);
    setImage(null);
    setOutput(null);
    setProcessedImage(null);
    setProgress(0);
  };

  const renderUploadedImages = () => {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
        {uploadedImages.map((item) => (
          <Card
            className="group w-full max-w-[150px]"
            key={item.id}
            style={{
              background: `radial-gradient(63.94% 63.94% at 50% 0%, rgba(255, 99, 71, 0.1) 0%, rgba(132, 204, 22, 0) 100%), rgba(132, 204, 22, 0.01)`,
              backdropFilter: "blur(16px)",
            }}
          >
            <CardContent
              onClick={() => handleImageSelect(item)} // Handle image selection on click
              className="flex flex-col items-center justify-center p-2 cursor-pointer aspect-square"
            >
              <div className="absolute top-[7.1rem] right-0 z-10 opacity-75 bg-rose-200"></div>
              <img
                src={item.downloadURL || "/path-to-placeholder-image.jpg"}
                alt="Image"
                className="object-cover rounded-md"
                style={{ aspectRatio: "500/500", objectFit: "cover" }}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderImageContainer = () => {
    return (
      <div className="w-full aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden relative">
        {currentStep === 4 && processedImage ? (
          <img
            src={processedImage}
            alt="Processed with Predictions"
            className="w-full h-full object-cover"
          />
        ) : (
          image && (
            <img
              src={image}
              alt="Selected crop"
              className="w-full h-full object-cover"
            />
          )
        )}
        {currentStep === 3 && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center">
            <Loader2Icon className="animate-spin text-white w-12 h-12 mb-4" />
            <div className="text-white mb-2">{file?.name}</div>
            <div className="text-white mb-4">Processing</div>
            <Progress value={progress} className="w-3/4" />
          </div>
        )}
      </div>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Crop Detection</h2>
            <p className="text-muted-foreground">
              Select an image to start detection.
            </p>
            {renderUploadedImages()}
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Crop Detection</h2>
            <p className="text-muted-foreground">Review selected image</p>
            <div className="grid grid-cols-4 gap-4">
              {file && (
                <Card className="col-span-3 relative">
                  {renderImageContainer()}
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 left-2 h-6 w-6"
                    onClick={resetWizard}
                  >
                    <XIcon className="h-4 w-4" />
                  </Button>
                </Card>
              )}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Crop Detection</h2>
            <p className="text-muted-foreground">Processing...</p>
            {renderImageContainer()}
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Crop Detection</h2>
            <p className="text-muted-foreground">Results</p>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <span>Processed 1 image</span>
                  <Button variant="outline">Download CSV</Button>
                </div>
                {renderImageContainer()}
                <div className="flex items-center space-x-2 mt-4">
                  <SearchIcon className="text-primary" />
                  <span className="text-lg font-bold">
                    Apples detected: {output?.length || 0}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="flex items-center space-x-2">
        {steps.map((step, index) => (
          <React.Fragment key={index}>
            <div
              className={`flex items-center space-x-2 ${
                currentStep > index + 1
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  currentStep > index + 1
                    ? "bg-primary text-primary-foreground"
                    : "border border-muted-foreground"
                }`}
              >
                {currentStep > index + 1 ? (
                  <CheckIcon className="w-4 h-4" />
                ) : (
                  index + 1
                )}
              </div>
              <span>{step.title}</span>
              <span className="sr-only">{step.description}</span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-px ${
                  currentStep > index + 1 ? "bg-primary" : "bg-muted-foreground"
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="mt-8">{renderStepContent()}</div>

      <div className="flex justify-between mt-8">
        <Button
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
          disabled={currentStep === 1 || currentStep === 3}
        >
          Previous
        </Button>
        <Button
          onClick={() => {
            if (currentStep === 2 && file) {
              handlePrediction();
            } else if (currentStep === 4) {
              resetWizard();
            } else if (currentStep < steps.length) {
              setCurrentStep(currentStep + 1);
            }
          }}
          disabled={currentStep === 3 || (currentStep === 2 && !file)}
        >
          {currentStep === 4 ? "Finish" : "Next"}
        </Button>
      </div>
    </div>
  );
}
