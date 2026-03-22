export type CreateCategoryData = Omit<Category, "id">;

export type Category = {
  id: string;
  slug: string;
  title: string;
  showInHeader: boolean;
  order: number;
};
