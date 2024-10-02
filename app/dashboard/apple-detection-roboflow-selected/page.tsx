"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { database } from "@/firebaseConfig";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AppleIcon,
  CheckIcon,
  Loader2Icon,
  SearchIcon,
  XIcon,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import ProcessedImageCanvas from "./components/ProcessedImageCanvas";

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

interface ProcessedImage {
  file: File;
  image: string;
  output: Prediction[] | null;
  processedImage: string | null;
}

export default function Component() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedImages, setSelectedImages] = useState<ArrayData[]>([]);
  const [processedImages, setProcessedImages] = useState<ProcessedImage[]>([]);
  const [progress, setProgress] = useState<number>(0);
  const { userId } = useAuth();
  const [uploadedImages, setUploadedImages] = useState<ArrayData[]>([]);

  const steps = [
    { title: "Choose images", description: "Select uploaded crop files" },
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

  const handleImageSelect = (image: ArrayData) => {
    setSelectedImages((prev) => {
      if (prev.some((img) => img.id === image.id)) {
        return prev.filter((img) => img.id !== image.id);
      } else {
        return [...prev, image];
      }
    });
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
    setCurrentStep(2);
    setProgress(0);

    const processedImagesPromises = selectedImages.map(async (image) => {
      try {
        const response = await axios.get(image.downloadURL, {
          responseType: "blob",
        });

        const file = new File([response.data], image.fileName, {
          type: response.data.type,
        });

        const base64Image = await encodeImage(file);

        const payload = [
          {
            img: base64Image,
            name: file.name.split(".")[0],
          },
        ];

        const predictionResponse = await axios.post(
          `https://detect.roboflow.com/apple-ifwsc/4`,
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
        const predictions = predictionResponse.data.predictions;
        const blob = new Blob([response.data], { type: "image/jpeg" });
        const imageUrl = URL.createObjectURL(blob);

        return {
          file,
          image: URL.createObjectURL(file),
          output: predictions,
          processedImage: imageUrl,
        };
      } catch (error) {
        console.error("Error detecting image:", error);
        return {
          file: null,
          image: null,
          output: null,
          processedImage: null,
        };
      }
    });

    const processedImages = await Promise.all(processedImagesPromises);
    setProcessedImages(processedImages.filter((img) => img.file !== null));
    setCurrentStep(3);
  };

  const resetWizard = () => {
    setCurrentStep(1);
    setSelectedImages([]);
    setProcessedImages([]);
    setProgress(0);
  };

  const renderUploadedImages = () => {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
        {uploadedImages.map((item) => (
          <Card
            className={`group w-full max-w-[150px] ${
              selectedImages.some((img) => img.id === item.id)
                ? "border-primary"
                : ""
            }`}
            key={item.id}
            style={{
              background: `radial-gradient(63.94% 63.94% at 50% 0%, rgba(255, 99, 71, 0.1) 0%, rgba(132, 204, 22, 0) 100%), rgba(132, 204, 22, 0.01)`,
              backdropFilter: "blur(16px)",
            }}
          >
            <CardContent
              onClick={() => handleImageSelect(item)}
              className="flex flex-col items-center justify-center p-2 cursor-pointer aspect-square"
            >
              <div className="absolute top-[7.1rem] right-0 z-10 opacity-75 bg-rose-200"></div>
              <img
                src={item.downloadURL || "/path-to-placeholder-image.jpg"}
                alt="Image"
                className="object-cover rounded-md"
                style={{ aspectRatio: "500/500", objectFit: "cover" }}
              />
              {selectedImages.some((img) => img.id === item.id) && (
                <div className="absolute inset-0 flex border-custom border-2 rounded-lg items-center justify-center ">
                  <AppleIcon className="text-custom " size={30} />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };
  const renderImageContainer = (image: ProcessedImage) => {
    return (
      <div className="w-full aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden relative">
        {image.processedImage ? (
          <ProcessedImageCanvas
            imageSrc={image.processedImage}
            predictions={image.output || []}
          />
        ) : (
          <img
            src={image.image || "/path-to-placeholder-image.jpg"}
            alt="Selected crop"
            className="w-full h-full object-cover"
          />
        )}
        {currentStep === 2 && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center">
            <Loader2Icon className="animate-spin text-white w-12 h-12 mb-4" />
            <div className="text-white mb-2">{image.file.name}</div>
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
              Select one or more images to start detection.
            </p>
            {renderUploadedImages()}
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Crop Detection</h2>
            <p className="text-muted-foreground">Processing...</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedImages.map((image) => (
                <Card key={image.id} className="relative">
                  {renderImageContainer({
                    file: new File([], image.fileName),
                    image: image.downloadURL,
                    output: null,
                    processedImage: null,
                  })}
                </Card>
              ))}
            </div>
          </div>
        );
      case 3:
        const totalDetections = processedImages.reduce((total, image) => {
          return total + (image.output?.length || 0);
        }, 0);

        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Crop Detection</h2>
            <p className="text-muted-foreground">
              Results {"-->"} Total Apples Detected: {totalDetections}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {processedImages.map((image, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    {/* <div className="flex items-center justify-between mb-4">
                      <span>{image.file.name}</span>
                      <Button variant="outline">Download CSV</Button>
                    </div> */}
                    {renderImageContainer(image)}
                    <div className="flex items-center space-x-2 mt-4">
                      <AppleIcon className="text-primary" />
                      <span className="text-lg font-bold">
                        Apples detected: {image.output?.length || 0}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
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
          disabled={currentStep === 1 || currentStep === 2}
        >
          Previous
        </Button>
        <Button
          onClick={() => {
            if (currentStep === 1 && selectedImages.length > 0) {
              handlePrediction();
            } else if (currentStep === 3) {
              resetWizard();
            } else if (currentStep < steps.length) {
              setCurrentStep(currentStep + 1);
            }
          }}
          disabled={
            currentStep === 2 ||
            (currentStep === 1 && selectedImages.length === 0)
          }
        >
          {currentStep === 3 ? "Finish" : "Next"}
        </Button>
      </div>
    </div>
  );
}
