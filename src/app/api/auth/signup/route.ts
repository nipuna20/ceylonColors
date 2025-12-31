import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hash } from "bcrypt";
import { z } from "zod";
import { slugifyLocal as slugify } from "@/lib/slug";

// Zod validation for vendor fields, allowing logoUrl, nicFrontUrl, and nicBackUrl to be nullable and optional
const vendorFields = z.object({
  shopName: z.string().min(2),
  phone: z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  taxId: z.string().optional(),
  brn: z.string().optional(),
  website: z
    .string()
    .url()
    .optional()
    .or(z.literal("")),

  // image URLs coming from Firebase (optional)
  logoUrl: z
    .string()
    .url()
    .nullable() // Allow null values
    .optional(),

  nicFrontUrl: z
    .string()
    .url()
    .nullable() // Allow null values
    .optional(),

  nicBackUrl: z
    .string()
    .url()
    .nullable() // Allow null values
    .optional(),

  payoutMethod: z.literal("BANK").optional(),
  bankName: z.string().optional(),
  bankBranch: z.string().optional(),
  bankAccountName: z.string().optional(),
  bankAccountNo: z.string().optional(),
  bankSwift: z.string().optional(),
});

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  role: z.enum(["BUYER", "VENDOR"]).default("BUYER"),
  vendor: vendorFields.optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = bodySchema.parse(body);

    // Check if the email already exists in the database
    const exists = await db.user.findUnique({
      where: { email: data.email },
    });

    if (exists) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 409 }
      );
    }

    // Hash the password
    const passwordHash = await hash(data.password, 10);

    // Create user record in the database
    const user = await db.user.create({
      data: {
        email: data.email,
        name: data.name,
        passwordHash,
        role: data.role,
      },
    });

    // If role is VENDOR, create Vendor record with more details
    if (data.role === "VENDOR") {
      if (!data.vendor) {
        return NextResponse.json(
          { error: "Vendor details required" },
          { status: 400 }
        );
      }

      await db.vendor.create({
        data: {
          ownerId: user.id,
          shopName: data.vendor.shopName,
          slug: slugify(data.vendor.shopName), // Create a slug based on shop name
          description: null, // You may want to allow the vendor to provide a description
          isApproved: false, // Set to false initially
          status: "PENDING", // Vendor status is pending until approved
          phone: data.vendor.phone,
          addressLine1: data.vendor.addressLine1,
          addressLine2: data.vendor.addressLine2,
          city: data.vendor.city,
          taxId: data.vendor.taxId,
          brn: data.vendor.brn,
          website: data.vendor.website,
          payoutMethod: data.vendor.payoutMethod ?? "BANK", // Default to "BANK" if not provided
          bankName: data.vendor.bankName,
          bankBranch: data.vendor.bankBranch,
          bankAccountName: data.vendor.bankAccountName,
          bankAccountNo: data.vendor.bankAccountNo,
          bankSwift: data.vendor.bankSwift,
          kycSubmittedAt: new Date(), // Date when KYC is submitted

          // You can handle image URLs separately (Firebase links here)
        },
      });
    }

    // Respond with a success message
    return NextResponse.json({ ok: true });
  } catch (err) {
    // Catch errors and return an error message
    const message =
      err instanceof Error ? err.message : "Invalid request";
    
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
