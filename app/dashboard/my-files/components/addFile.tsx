import { database, storage } from "@/firebaseConfig";
import { addDoc, collection, getDocs, query, where } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

const uploadFile = (
  file: File,
  setProgress: React.Dispatch<React.SetStateAction<number>>,
  userId: string,
  positionId: string
) => {
  const storageRef = ref(storage, `root/${file.name}`);

  const uploadTask = uploadBytesResumable(storageRef, file);

  uploadTask.on(
    "state_changed",
    (snapshot) => {
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      setProgress(progress);
    },
    (error) => {
      console.log("Error during upload:", error);
      setProgress(0);
    },
    () => {
      getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
        addFile(
          downloadURL,
          file.name,
          userId,
          positionId,
          file.type,
          file.size
        );
        setProgress(100);
      });
    }
  );
};

const files = collection(database, "files");

const addFile = async (
  downloadURL: string,
  fileName: string,
  userId: string,
  positionId: string,
  fileType: string,
  fileSize: number
) => {
  try {
    const fileQuery = query(
      files,
      where("fileName", "==", fileName),
      where("positionId", "==", positionId),
      where("isFolder", "==", false)
    );
    const querySnapshot = await getDocs(fileQuery);

    if (querySnapshot.empty) {
      await addDoc(files, {
        downloadURL,
        fileName,
        userId,
        positionId,
        fileType,
        fileSize,
        isFolder: false,
        createdAt: new Date().toISOString(),
      });
      console.log("File uploaded successfully");
    } else {
      console.log("File already exists in the folder");
    }
  } catch (error) {
    console.log("Error uploading file:", error);
  }
};

export default uploadFile;
