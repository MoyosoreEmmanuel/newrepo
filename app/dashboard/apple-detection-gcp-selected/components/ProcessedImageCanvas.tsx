import React, { useRef, useEffect } from "react";

interface Prediction {
  box: [number, number, number, number]; // [x, y, width, height]
  confidence: number;
  class: string; // Changed from class_id to class
}

interface ProcessedImageCanvasProps {
  imageSrc: string;
  predictions: Prediction[];
}

const ProcessedImageCanvas: React.FC<ProcessedImageCanvasProps> = ({
  imageSrc,
  predictions,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const img = imgRef.current;

    if (!canvas || !ctx || !img) return;

    // Draw the image once it loads
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0, img.width, img.height);

      // Now, draw the bounding boxes from predictions
      predictions.forEach((pred) => {
        const [x, y, width, height] = pred.box;

        // Set the color and draw the rectangle (red color)
        ctx.strokeStyle = "red";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width - x, height - y);

        // Draw the confidence score above the box
        ctx.fillStyle = "red";
        ctx.font = "16px Arial";
        ctx.fillText(`Conf: ${(pred.confidence * 100).toFixed(1)}%`, x, y - 10);
      });
    };
  }, [predictions, imageSrc]);

  return (
    <div style={{ position: "relative" }}>
      <img
        ref={imgRef}
        src={imageSrc}
        alt="Detected"
        style={{ display: "none" }}
      />
      <canvas ref={canvasRef} />
    </div>
  );
};

export default ProcessedImageCanvas;
