import React, { useRef, useEffect } from "react";

interface Prediction {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  class: string;
}

interface ProcessedImageCanvasProps {
  imageSrc: string;
  predictions: Prediction[];
}

const ProcessedImageCanvas: React.FC<ProcessedImageCanvasProps> = ({
  imageSrc,
  predictions,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.src = imageSrc;

      img.onload = () => {
        if (ctx) {
          // Set canvas dimensions to match the image size
          canvas.width = img.width;
          canvas.height = img.height;

          // Draw the image onto the canvas
          ctx.drawImage(img, 0, 0);

          // Loop through predictions and draw bounding boxes with labels
          predictions.forEach((prediction) => {
            ctx.beginPath();
            ctx.rect(
              prediction.x - prediction.width / 2,
              prediction.y - prediction.height / 2,
              prediction.width,
              prediction.height
            );
            ctx.lineWidth = 2;
            ctx.strokeStyle = "red";
            ctx.stroke();

            // Draw label background
            ctx.fillStyle = "red";
            ctx.fillRect(
              prediction.x - prediction.width / 2,
              prediction.y - prediction.height / 2 - 20,
              ctx.measureText(prediction.class).width + 10,
              20
            );

            // Draw label text
            ctx.fillStyle = "white";
            ctx.fillText(
              `${prediction.class} (${(prediction.confidence * 100).toFixed(
                1
              )}%)`,
              prediction.x - prediction.width / 2 + 5,
              prediction.y - prediction.height / 2 - 5
            );
          });
        }
      };
    }
  }, [imageSrc, predictions]);

  return <canvas ref={canvasRef} className="w-full h-full object-cover" />;
};

export default ProcessedImageCanvas;
