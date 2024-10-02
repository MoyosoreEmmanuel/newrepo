"use client";

import React, { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "@/lib/utils";
import CustomModal from "./CustomModal";
import Image from 'next/image';

interface Detection {
  class: string;
  confidence: number;
  box: number[];
  visible?: boolean;
}

interface AppleDetectionDialogProps {
  imageUrl: string;
  detections: Detection[];
}

export default function AppleDetectionDialog({
  imageUrl,
  detections,
}: AppleDetectionDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.5);
  const [filteredDetections, setFilteredDetections] = useState<Detection[]>([]);
  const [zoomDetection, setZoomDetection] = useState<Detection | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      console.log("All detection values:", detections);
    }
  }, [isOpen, detections]);

  useEffect(() => {
    setFilteredDetections(
      detections.map((detection) => ({
        ...detection,
        visible: detection.confidence >= confidenceThreshold,
      }))
    );
    setZoomDetection(null);
  }, [confidenceThreshold, detections]);

  const drawDetections = React.useCallback(() => {
    if (imageLoaded && imageRef.current && canvasRef.current) {
      const img = imageRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      const displayedWidth = img.clientWidth;
      const displayedHeight = img.clientHeight;

      canvas.width = displayedWidth;
      canvas.height = displayedHeight;

      ctx?.clearRect(0, 0, canvas.width, canvas.height);

      const scaleX = displayedWidth / img.naturalWidth;
      const scaleY = displayedHeight / img.naturalHeight;

      filteredDetections.forEach((detection) => {
        if (zoomDetection) {
          if (detection === zoomDetection && detection.visible) {
            drawDetection(ctx, detection, scaleX, scaleY);
          }
        } else if (detection.visible) {
          drawDetection(ctx, detection, scaleX, scaleY);
        }
      });
    }
  }, [imageLoaded, filteredDetections, zoomDetection]);

  useEffect(() => {
    if (isOpen && imageLoaded) {
      drawDetections();
    }
  }, [isOpen, imageLoaded, drawDetections]);

  const drawDetection = (
    ctx: CanvasRenderingContext2D | null,
    detection: Detection,
    scaleX: number,
    scaleY: number
  ) => {
    if (!ctx) return;

    const [x, y, width, height] = detection.box;
    const scaledX = x * scaleX;
    const scaledY = y * scaleY;
    const scaledWidth = width * scaleX;
    const scaledHeight = height * scaleY;

    const isApple = detection.class.toLowerCase() === "apple";
    const color = isApple ? "rgba(0, 255, 0, 0.8)" : "rgba(255, 0, 0, 0.8)";

    // Draw bounding box
    ctx.beginPath();
    ctx.rect(scaledX, scaledY, scaledWidth, scaledHeight);
    ctx.lineWidth = 1;
    ctx.strokeStyle = color;
    ctx.stroke();

    // Draw label
    ctx.fillStyle = color;
    ctx.font = "10px Arial";
    const text = `${(detection.confidence * 100).toFixed(1)}%`;
    const textWidth = ctx.measureText(text).width;
    const textHeight = 10;
    const padding = 2;

    ctx.fillRect(
      scaledX,
      scaledY - textHeight - padding,
      textWidth + padding * 2,
      textHeight + padding
    );

    ctx.fillStyle = "white";
    ctx.fillText(text, scaledX + padding, scaledY - 1);
  };

  const toggleVisibility = (index: number) => {
    setFilteredDetections((prevDetections) =>
      prevDetections.map((detection, i) =>
        i === index ? { ...detection, visible: !detection.visible } : detection
      )
    );
    setZoomDetection(null);
  };

  const handleZoom = (detection: Detection) => {
    if (zoomDetection === detection) {
      setZoomDetection(null);
      setFilteredDetections(
        detections.map((det) => ({
          ...det,
          visible: det.confidence >= confidenceThreshold,
        }))
      );
    } else {
      setZoomDetection(detection);
      setFilteredDetections((prevDetections) =>
        prevDetections.map((det) =>
          det === detection
            ? { ...det, visible: true }
            : { ...det, visible: false }
        )
      );
    }
  };

  const reset = () => {
    setZoomDetection(null);
    setConfidenceThreshold(0.5);
    setFilteredDetections(
      detections.map((detection) => ({
        ...detection,
        visible: detection.confidence >= 0.5,
      }))
    );
  };

  useEffect(() => {
    if (zoomDetection && imageRef.current && canvasRef.current) {
      const img = imageRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      const displayedWidth = img.clientWidth;
      const displayedHeight = img.clientHeight;

      canvas.width = displayedWidth;
      canvas.height = displayedHeight;

      ctx?.clearRect(0, 0, canvas.width, canvas.height);

      const scaleX = displayedWidth / img.naturalWidth;
      const scaleY = displayedHeight / img.naturalHeight;

      const [x, y, width, height] = zoomDetection.box;
      const scaledX = x * scaleX;
      const scaledY = y * scaleY;
      const scaledWidth = width * scaleX;
      const scaledHeight = height * scaleY;

      const zoomFactor = 2;
      const offsetX = scaledX - displayedWidth / (2 * zoomFactor);
      const offsetY = scaledY - displayedHeight / (2 * zoomFactor);

      ctx?.scale(zoomFactor, zoomFactor);
      ctx?.translate(-offsetX, -offsetY);

      drawDetection(ctx, zoomDetection, scaleX, scaleY);

      ctx?.setTransform(1, 0, 0, 1, 0, 0);

      img.style.transition = "transform 0.5s ease";
      img.style.transform = `scale(${zoomFactor}) translate(${-offsetX}px, ${-offsetY}px)`;
      img.style.transformOrigin = "top left";
      img.style.zIndex = "10";
      canvas.style.zIndex = "11";
    } else if (imageRef.current && canvasRef.current) {
      imageRef.current.style.transition = "transform 0.5s ease";
      imageRef.current.style.transform = "";
      imageRef.current.style.zIndex = "1";
      canvasRef.current.style.zIndex = "2";
    }
  }, [zoomDetection]);

  return (
    <>
      <Button variant="outline" onClick={() => setIsOpen(true)}>
        View Results
      </Button>
      <CustomModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Apple Detection Results"
      >
        <div className="flex h-full">
          <Card className="w-80 mr-4 overflow-hidden">
            <CardContent className="p-4">
              <div className="flex justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="px-2 py-1">
                    {filteredDetections.filter((d) => d.visible).length}
                  </Badge>
                  <span className="font-semibold">Detections</span>
                </div>
                <Button variant="outline" size="sm" onClick={reset}>
                  Reset
                </Button>
              </div>
              <div className="mb-4 space-y-4">
                <label className="text-sm font-medium">
                  Confidence Threshold: {(confidenceThreshold * 100).toFixed(0)}
                  %
                </label>
                <Slider
                  value={[confidenceThreshold]}
                  onValueChange={([value]) => setConfidenceThreshold(value)}
                  max={1}
                  step={0.01}
                  className="w-full"
                />
              </div>
              <ScrollArea className="h-[calc(95vh-300px)]">
                {filteredDetections.length > 0 ? (
                  filteredDetections.map((detection, index) => (
                    <div
                      key={index}
                      className={cn(
                        "flex items-center justify-between mb-2 p-2 rounded-md transition-colors",
                        detection.visible ? "bg-secondary" : "bg-background"
                      )}
                    >
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            detection.class.toLowerCase() === "apple"
                              ? "bg-green-500"
                              : "bg-red-500",
                            "text-white"
                          )}
                        >
                          {index + 1}
                        </Badge>
                        <span className="text-sm font-medium">
                          {detection.class}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleZoom(detection)}
                          className="h-8 w-8"
                        >
                          {zoomDetection === detection ? (
                            <ZoomOut className="h-4 w-4" />
                          ) : (
                            <ZoomIn className="h-4 w-4" />
                          )}
                        </Button>
                        <Switch
                          checked={detection.visible}
                          onCheckedChange={() => toggleVisibility(index)}
                          className="data-[state=checked]:bg-primary"
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-4">
                    No detections above the confidence threshold.
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
          <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-secondary rounded-lg">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center z-20 bg-background/50">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            )}
            <Image
              src={imageUrl}
              alt="Orchard"
              layout="fill"
              objectFit="contain"
              className={cn(
                "transition-opacity duration-500 ease-in-out",
                imageLoaded ? "opacity-100" : "opacity-0"
              )}
              onLoadingComplete={() => {
                setLoading(false);
                setImageLoaded(true);
                drawDetections();
              }}
              style={{ zIndex: zoomDetection ? 10 : 1 }}
            />
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 right-0 bottom-0 m-auto pointer-events-none transition-opacity duration-500 ease-in-out"
              style={{ zIndex: zoomDetection ? 11 : 2 }}
            />
          </div>
        </div>
      </CustomModal>
    </>
  );
}
