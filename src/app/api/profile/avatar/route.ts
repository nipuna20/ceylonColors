// src/app/api/profile/avatar/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";  // Correct import for named export
import { db } from "@/lib/db";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// POST method to handle avatar upload and update
export async function POST(req: NextRequest) {
  // Get session data
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  const userEmail = session?.user?.email;

  // If the session or user info is missing, return unauthorized error
  if (!session || !userId || !userEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Try to get the form data from the request body
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid form data" },
      { status: 400 }
    );
  }

  // Retrieve the file from the form
  const file = form.get("avatar");
  if (!file || typeof file === "string") {
    return NextResponse.json(
      { error: "Avatar file field 'avatar' is required" },
      { status: 400 }
    );
  }

  // Cast the file to a Blob/File (Edge runtime compatibility)
  const blob = file as unknown as File;
  
  // Read the file as an ArrayBuffer and convert it to Buffer
  const arrayBuffer = await blob.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Generate a file extension or default to 'jpg'
  const ext = blob.name?.split(".").pop() || "jpg";
  
  // Define the file storage path in Firebase Storage
  const objectPath = `users/avatars/${userId}-${Date.now()}.${ext}`;

  // Create a reference to Firebase storage and upload the file
  const storageRef = ref(storage, objectPath);
  try {
    await uploadBytes(storageRef, buffer, {
      contentType: blob.type || "image/jpeg",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to upload avatar to storage" },
      { status: 500 }
    );
  }

  // Get the download URL for the uploaded file
  const url = await getDownloadURL(storageRef);

  // Update the user record in the database with the new avatar URL
  try {
    await db.user.update({
      where: { id: userId },
      data: { avatarUrl: url } as any,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update avatar URL in database" },
      { status: 500 }
    );
  }

  // Return the URL of the uploaded avatar as a response
  return NextResponse.json({ url });
}
