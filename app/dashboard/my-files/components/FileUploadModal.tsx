"use client";

import React, { useState, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { X, Upload, File, Loader2 } from "lucide-react";
import uploadFile from "../components/addFile";

interface FileUploadModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  positionId: string;
}

export default function FileUploadModal({
  isOpen,
  onOpenChange,
  userId,
  positionId,
}: FileUploadModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files ? Array.from(event.target.files) : [];
      setSelectedFiles((prevFiles) => [...prevFiles, ...files]);

      const newPreviews = files.map((file) => URL.createObjectURL(file));
      setPreviews((prevPreviews) => [...prevPreviews, ...newPreviews]);
    },
    []
  );

  const handleRemoveFile = useCallback((index: number) => {
    setSelectedFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
    setPreviews((prevPreviews) => {
      const newPreviews = prevPreviews.filter((_, i) => i !== index);
      URL.revokeObjectURL(prevPreviews[index]);
      return newPreviews;
    });
  }, []);

  const handleFileUpload = useCallback(async () => {
    setIsUploading(true);
    setCurrentFileIndex(0);

    for (let i = 0; i < selectedFiles.length; i++) {
      setProgress(0);
      await uploadFile(selectedFiles[i], setProgress, userId, positionId);
      setCurrentFileIndex(i + 1);
    }

    setIsUploading(false);
    setSelectedFiles([]);
    setPreviews([]);
    onOpenChange(false);
  }, [selectedFiles, userId, positionId, onOpenChange]);

  useEffect(() => {
    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview));
    };
  }, [previews]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-gray-900 text-white">
        <DialogHeader>
          <DialogTitle>Upload Files</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Button
            onClick={() => document.getElementById("file-input")?.click()}
            variant="outline"
            className="w-full bg-white text-black hover:bg-gray-100"
          >
            Select Files
          </Button>
          <input
            id="file-input"
            type="file"
            onChange={handleFileChange}
            multiple
            className="hidden"
            accept="image/*"
          />
          {selectedFiles.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Selected files:</p>
              <div className="grid grid-cols-3 gap-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="relative group">
                    <div className="relative w-full pt-[100%]">
                      <img
                        src={previews[index]}
                        alt={file.name}
                        className="absolute inset-0 w-full h-full object-cover rounded-md"
                      />
                      {isUploading && index === currentFileIndex && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-md">
                          <Progress value={progress} className="w-3/4 h-2" />
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveFile(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <p className="text-xs truncate mt-1">{file.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            onClick={() => onOpenChange(false)}
            variant="outline"
            disabled={isUploading}
            className="bg-white text-black hover:bg-gray-100"
          >
            Cancel
          </Button>
          <Button
            onClick={handleFileUpload}
            disabled={selectedFiles.length === 0 || isUploading}
            className="bg-blue-500 text-white hover:bg-blue-600"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Filesffffffffff
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
