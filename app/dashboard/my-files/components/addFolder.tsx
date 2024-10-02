import { database } from "@/firebaseConfig";
import { addDoc, collection, getDocs, query, where } from "firebase/firestore";

const files = collection(database, "files");

const addFolder = async (payload: {
  folderName: string;
  userId: string;
  positionId: string;
}) => {
  try {
    // Check if a folder with the same name and position already exists
    const folderQuery = query(
      files,
      where("folderName", "==", payload.folderName),
      where("positionId", "==", payload.positionId),
      where("isFolder", "==", true)
    );
    const querySnapshot = await getDocs(folderQuery);

    if (querySnapshot.empty) {
      // If no existing folder, add the folder with a timestamp
      await addDoc(files, {
        ...payload,
        isFolder: true,
        createdAt: new Date().toISOString(), // Add creation date
      });
      console.log("Folder created successfully");
    } else {
      console.log("Folder already exists");
    }
  } catch (error) {
    console.log("Error creating folder:", error);
  }
};

export default addFolder;
