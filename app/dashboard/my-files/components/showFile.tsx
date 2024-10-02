import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AiFillFolder } from "react-icons/ai";
import { IoDocumentTextOutline } from "react-icons/io5";
import { useAuth } from "@clerk/nextjs";
import Image from "next/image";
import {
  collection,
  onSnapshot,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { database, storage } from "@/firebaseConfig";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface ArrayData {
  id: string;
  positionId: string;
  email?: string;
  folderName?: string;
  isFolder?: boolean;
  downloadURL?: string;
  fileName?: string;
  fileType?: string;
  createdAt?: string;
  fileSize?: number;
}

interface ShowFileProps {
  positionId: string;
}

const files = collection(database, "files");

const ShowFile = ({ positionId, }: ShowFileProps) => {
  const { userId } = useAuth();
  const [data, setData] = useState<ArrayData[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentFolderId = searchParams.get("id");
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    try {
      let combinedData: ArrayData[] = [];

      if (!currentFolderId) {
        const servicesOutputsQuery = query(
          files,
          where("positionId", "==", "root"),
          where("folderName", "==", "services_outputs"),
          where("isFolder", "==", true)
        );

        const servicesOutputsSnapshot = await getDocs(servicesOutputsQuery);
        const servicesOutputsFolder = servicesOutputsSnapshot.docs.map(
          (doc) => {
            const data = doc.data() as ArrayData;
            return { ...data, id: doc.id };
          }
        )[0];

        if (servicesOutputsFolder) {
          combinedData.push(servicesOutputsFolder);
        }
      }

      const userQuery = query(files, where("userId", "==", userId));

      const unsubscribe = onSnapshot(userQuery, (response) => {
        const userData = response.docs
          .map((doc) => {
            const data = doc.data() as ArrayData;
            return { ...data, id: doc.id };
          })
          .filter((item) => item.positionId === positionId);

        const updatedData = [...combinedData, ...userData];
        setData(updatedData);
      });

      return unsubscribe;
    } catch (error) {
      console.error("Error fetching data: ", error);
    }
  }, [userId, positionId, currentFolderId]);

  useEffect(() => {
    if (userId) {
      fetchData();
    } else {
      router.push("/");
    }
  }, [fetchData, userId, router]);

  const handleFolderClick = (folderId: string) => {
    router.push(`/dashboard/my-files/folder?id=${folderId}`);
  };

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return "";
    return format(new Date(dateStr), "dd/MM/yyyy HH:mm:ss");
  };

  const formatSize = (size: number | undefined) => {
    if (size === undefined) return "";
    const i = Math.floor(Math.log(size) / Math.log(1024));
    const formattedSize = size / Math.pow(1024, i);
    return `${formattedSize.toFixed(2)} ${["B", "kB", "MB", "GB", "TB"][i]}`;
  };

  const handleDelete = async (
    id: string,
    name: string,
    isFolder: boolean,
    downloadURL?: string
  ) => {
    try {
      if (isFolder) {
        const folderContents = await getFolderContents(id);
        if (folderContents.length > 0) {
          toast({
            title: "Error",
            description:
              "Folder is not empty. Please delete all the files first.",
            variant: "destructive",
          });
          return;
        }
        // If the folder is empty, proceed with deletion
        await deleteDoc(doc(database, "files", id));
        toast({
          title: "Folder Deleted",
          description: `${name} has been successfully deleted.`,
        });
      } else {
        if (downloadURL) {
          await deleteFileFromStorage(downloadURL);
        }
        await deleteDoc(doc(database, "files", id));
        toast({
          title: "File Deleted",
          description: `${name} has been successfully deleted.`,
        });
      }

      // Update the local state to remove the deleted item
      setData((prevData) => prevData.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Error deleting item:", error);
      toast({
        title: "Error",
        description: `Failed to delete ${name}. Please try again.`,
        variant: "destructive",
      });
    }
  };

  const getFolderContents = async (folderId: string) => {
    const q = query(
      collection(database, "files"),
      where("positionId", "==", folderId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs;
  };

  const deleteFileFromStorage = async (downloadURL: string) => {
    const storageRef = ref(storage, downloadURL);
    await deleteObject(storageRef);
  };

  return (
    <main className="flex-1 p-4 lg:p-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
        {data.map((item) => (
          <Card
            className="group w-full max-w-[150px] relative"
            key={item.id}
            style={{
              background: `radial-gradient(63.94% 63.94% at 50% 0%, rgba(255, 99, 71, 0.1) 0%, rgba(132, 204, 22, 0) 100%), rgba(132, 204, 22, 0.01)`,
              backdropFilter: "blur(16px)",
            }}
          >
            {item.isFolder ? (
              <CardContent
                onClick={() => handleFolderClick(item.id)}
                className="flex items-center justify-center p-2 cursor-pointer aspect-square"
              >
                <div className="flex flex-col items-center gap-2">
                  <AiFillFolder className="h-12 w-12 text-muted-foreground" />
                  <div className="text-sm font-medium">{item.folderName}</div>
                  <div className="text-xs text-gray-500">
                    {formatDate(item.createdAt)}
                  </div>
                </div>
              </CardContent>
            ) : (
              <CardContent
                onClick={() => window.open(item.downloadURL)}
                className="flex flex-col items-center justify-center p-2 cursor-pointer aspect-square"
              >
                {item.fileType === "image/jpeg" ? (
                  <>
                    <div className="absolute top-[7.1rem] right-0 z-10 opacity-75 bg-rose-200">
                      <Badge className="px-2 py-1 truncate text-xs rounded-sm w-[132px]">
                        {item.fileName}
                      </Badge>
                    </div>
                    <Image
                      src={item.downloadURL || "/path-to-placeholder-image.jpg"}
                      alt="Image"
                      width={300}
                      height={300}
                      className="object-cover rounded-md"
                      style={{ aspectRatio: "500/500", objectFit: "cover" }}
                    />
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <IoDocumentTextOutline className="h-12 w-12 text-muted-foreground" />
                    <div className="text-sm font-medium">{item.fileName}</div>
                  </div>
                )}
                <div className="flex flex-col items-center justify-center mt-2">
                  <div className="text-xs text-gray-800 dark:text-gray-300">
                    {formatDate(item.createdAt)}
                  </div>
                  <div className="text-xs text-gray-800 dark:text-gray-300">
                    {formatSize(item.fileSize)}
                  </div>
                </div>
              </CardContent>
            )}
            {item.folderName !== "services_outputs" && (
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(
                    item.id,
                    item.folderName || item.fileName || "",
                    item.isFolder || false,
                    item.downloadURL
                  );
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </Card>
        ))}
      </div>
    </main>
  );
};

export default ShowFile;
