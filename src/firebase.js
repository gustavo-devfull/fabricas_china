import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { firebaseConfig } from "./firebaseConfig";

const app = initializeApp(firebaseConfig);

const handleSubmitFactory = async (e) => {
  e.preventDefault();
  if (!name || !contact || !location || !segment) return alert("Preencha todos os campos.");
  
  await addDoc(collection(db, "factories"), {
    name, contact, location, segment,
  });

  setName(""); setContact(""); setLocation(""); setSegment("");
  setShowForm(false);
  fetchFactories();
};

export const db = getFirestore(app);
