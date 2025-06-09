import { serve } from "inngest/next";
import { createUserOrder, deleteUserData, inngest, saveUserData, updateUserData } from "@/config/inngest";

// Create an API that serves zero functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    saveUserData,
    updateUserData,
    deleteUserData,
    createUserOrder
  ],
});
