import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { database } from "@/firebaseConfig";

const files = collection(database, "files");

export const createRootFolderIfNotExists = async () => {
  try {
    const q = query(
      files,
      where("positionId", "==", "root"), // Root level
      where("folderName", "==", "services_outputs"), // Folder name
      where("isFolder", "==", true)
    );

    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      await addDoc(files, {
        folderName: "services_outputs",
        userId: "Public",
        positionId: "root", // Root level
        isFolder: true,
      });
      console.log("Root folder created successfully");
    } else {
      console.log("Root folder already exists");
    }
  } catch (error) {
    console.log("Error creating root folder:", error);
  }
};
