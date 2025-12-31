import { PrismaClient, Role } from "@prisma/client";
import { hash } from "bcrypt";

const db = new PrismaClient();

async function main() {
  // Create admin user
  const admin = await db.user.upsert({
    where: { email: "admin@malpra.lk" },
    update: {},
    create: {
      email: "admin@malpra.lk",
      name: "Admin",
      role: Role.ADMIN,
      passwordHash: await hash("Admin@123", 10),
    },
  });

  // Create vendor user
  const vendorUser = await db.user.upsert({
    where: { email: "vendor@malpra.lk" },
    update: {},
    create: {
      email: "vendor@malpra.lk",
      name: "Malpra Vendor",
      role: Role.VENDOR,
      passwordHash: await hash("Vendor@123", 10),
    },
  });

  // Create vendor shop
  const vendor = await db.vendor.upsert({
    where: { ownerId: vendorUser.id },
    update: { isApproved: true, shopName: "Malpra Vendor Shop", slug: "malpra-vendor-shop" },
    create: {
      ownerId: vendorUser.id,
      isApproved: true,
      shopName: "Malpra Vendor Shop",
      slug: "malpra-vendor-shop",
    },
  });

  // Create categories
  const flowers = await db.category.upsert({
    where: { slug: "flowers" },
    update: {},
    create: { name: "Flowers", slug: "flowers" },
  });
  const cakes = await db.category.upsert({
    where: { slug: "cakes" },
    update: {},
    create: { name: "Cakes", slug: "cakes" },
  });
  const perfumes = await db.category.upsert({
    where: { slug: "perfumes" },
    update: {},
    create: { name: "Perfumes", slug: "perfumes" },
  });

  // Create a sample product
  await db.product.upsert({
    where: { slug: "red-rose-bouquet" },
    update: {},
    create: {
      vendorId: vendor.id,
      title: "Red Rose Bouquet",
      slug: "red-rose-bouquet",
      description: "A bouquet of 12 fresh red roses.",
      priceCents: 4500,
      stock: 20,
      categoryId: flowers.id,
      images: {
        create: [
          { url: "https://picsum.photos/seed/rose/800/800", sort: 0 },
        ],
      },
    },
  });

  console.log("Database seeded successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    db.$disconnect();
  });