"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import uploadFile from "../components/addFile";
import addFolder from "../components/addFolder";
import ShowFile from "../components/showFile";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  PlusIcon,
  UploadIcon,
  Loader2,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export default function MyFiles({ params }: { params: { folder: string[] } }) {
  const { userId } = useAuth();
  const [progress, setProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [positionId, setPositionId] = useState("root");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const searchParams = useSearchParams();

  useEffect(() => {
    const queryId = searchParams.get("id");
    if (queryId) {
      setPositionId(queryId);
    }
  }, [searchParams]);

  useEffect(() => {
    if (progress === 100) {
      setUploadSuccess(true);
      setTimeout(() => {
        setProgress(0);
        setUploadSuccess(false);
        setCurrentFileIndex((prevIndex) => prevIndex + 1);
      }, 1000);
    }
  }, [progress]);

  useEffect(() => {
    if (
      isUploading &&
      selectedFiles.length > 0 &&
      currentFileIndex < selectedFiles.length
    ) {
      const currentFile = selectedFiles[currentFileIndex];
      if (userId) {
        uploadFile(currentFile, setProgress, userId, positionId);
      }
    } else if (
      currentFileIndex >= selectedFiles.length &&
      selectedFiles.length > 0
    ) {
      setSelectedFiles([]);
      setPreviews([]);
      setCurrentFileIndex(0);
      setIsUploading(false);
      setIsFileModalOpen(false);
    }
  }, [selectedFiles, currentFileIndex, userId, positionId, isUploading]);

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

  const handleFileUpload = () => {
    setCurrentFileIndex(0);
    setIsUploading(true);
  };

  const handleFolderCreation = () => {
    if (userId && folderName.trim()) {
      addFolder({ folderName, userId, positionId });
      setFolderName("");
      setIsFolderModalOpen(false);
    }
  };

  const handleDeselectAll = useCallback(() => {
    setSelectedFiles([]);
    setPreviews((prevPreviews) => {
      prevPreviews.forEach((preview) => URL.revokeObjectURL(preview));
      return [];
    });
  }, []);

  useEffect(() => {
    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview));
    };
  }, [previews]);

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-background px-4 lg:px-6">
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setIsFolderModalOpen(true)}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Create Folder
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsFileModalOpen(true)}
          >
            <UploadIcon className="mr-2 h-4 w-4" />
            Upload Files
          </Button>
        </div>
      </header>
      <main className="flex-1 p-4 lg:p-6">
        <ShowFile positionId={positionId} />
      </main>

      <Dialog open={isFolderModalOpen} onOpenChange={setIsFolderModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Enter a name for your new folder.
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Folder Name"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsFolderModalOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleFolderCreation}>Create Folder</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isFileModalOpen} onOpenChange={setIsFileModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Upload Files</DialogTitle>
            <DialogDescription>
              Select files to upload to your file manager.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              type="file"
              onChange={handleFileChange}
              multiple
              accept="image/*"
            />
            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium">Selected files:</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeselectAll}
                  >
                    Deselect All
                  </Button>
                </div>
                <ScrollArea className="h-[300px] w-full rounded-md border">
                  <div
                    className="grid grid-cols-2 gap-2 p-4"
                    ref={scrollContainerRef}
                  >
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="relative">
                        <div className="relative aspect-square w-full overflow-hidden rounded-md">
                          <Image
                            src={previews[index]}
                            alt={file.name}
                            layout="fill"
                            objectFit="cover"
                          />
                          {isUploading && index === currentFileIndex && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                              <Progress
                                value={progress}
                                className="w-3/4 h-2"
                              />
                            </div>
                          )}
                          <button
                            onClick={() => handleRemoveFile(index)}
                            className="absolute top-1 right-1 rounded-full bg-red-500 p-1 text-white opacity-0 transition-opacity hover:opacity-100 focus:opacity-100"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                        <p className="mt-1 truncate text-xs">{file.name}</p>
                      </div>
                    ))}
                  </div>
                  <ScrollBar orientation="vertical" />
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </div>
            )}
            {uploadSuccess && (
              <p className="text-center text-sm text-green-600">
                Upload complete!
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFileModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleFileUpload}
              disabled={selectedFiles.length === 0 || isUploading}
            >
              {isUploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <UploadIcon className="mr-2 h-4 w-4" />
              )}
              {isUploading ? "Uploading..." : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
