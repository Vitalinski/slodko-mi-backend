import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function seed() {
  // await prisma.category.createMany({
  //   data: [
  //     {
  //       slug: "cakes",
  //       title: "Cakes",
  //       showInHeader: true,
  //       order: 1,
  //     },
  //     {
  //       slug: "cookies",
  //       title: "Cookies",
  //       showInHeader: true,
  //       order: 2,
  //     },
  //     {
  //       slug: "cheesecakes",
  //       title: "Cheesecakes",
  //       showInHeader: true,
  //       order: 3,
  //     },
  //   ],
  // });

  const cakesCategory = await prisma.category.findUnique({
    where: { slug: "cakes" },
  });

  if (!cakesCategory) throw new Error("Category not found");
  const cookiesCategory = await prisma.category.findUnique({
    where: { slug: "cookies" },
  });

  if (!cookiesCategory) throw new Error("Category not found");
  const cheesecakesCategory = await prisma.category.findUnique({
    where: { slug: "cheesecakes" },
  });

  if (!cheesecakesCategory) throw new Error("Category not found");

  await prisma.product.createMany({
    data: [
      {
        title: "Chocolate Cake",
        image: "tort.webp",
        unit: "kg",
        price: 4450,
        description: "Very tasty cake",
        minQuantity: 2,
        isPopular: true,
        categoryId: cakesCategory.id,
      },
      {
        title: "Vanilla Cake",
        image: "popular3.webp",
        unit: "kg",
        price: 400,
        description: "Soft vanilla cake",
        minQuantity: 1,
        isPopular: false,
        categoryId: cakesCategory.id,
      },
      {
        title: "Vanilla Cake1",
        image: "popular3.webp",
        unit: "kg",
        price: 9400,
        description: "Soft vanilla cake",
        minQuantity: 1,
        isPopular: false,
        categoryId: cakesCategory.id,
      },
      {
        title: "Ciastko cookies",
        image: "cookie.webp",
        unit: "szt",
        price: 1200,
        description: "Cookies kupisz i jesteś szczęśliwy",
        minQuantity: 1,
        isPopular: false,
        categoryId: cookiesCategory.id,
      },
      {
        title: "Sernik przepyszny",
        image: "cheesecake.webp",
        unit: "kg",
        price: 11100,
        description:
          "Kremowe i delikatne serniki, które rozpływają się w ustach.",
        minQuantity: 1,
        isPopular: false,
        categoryId: cheesecakesCategory.id,
      },
    ],
  });
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
