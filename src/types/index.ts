import { MultipartFile } from "@fastify/multipart";
import { OrderStatus } from "@prisma/client";

type FormDataField<T = string> = {
  value: T;
};

export type ProductsQuery = {
  categories?: string[];
  page?: number;
  limit?: number;
  searchValue?: string;
  onlyPopular?: boolean;
};
export type OrdersQuery = {
  orderStatuses?: OrderStatus[];
  page?: number;
  limit?: number;
  searchValue?: string;
};

export type UpdateOrderStatusData = {
  newStatus: OrderStatus;
};

export type UpdateProductFormData = CreateProductFormData & {
  id: FormDataField;
};

export type CreateProductFormData = {
  title: FormDataField;
  description: FormDataField;
  price: FormDataField;
  unit: FormDataField;
  minQuantity: FormDataField;
  isPopular: FormDataField;
  categoryId: FormDataField;
  images?: FormDataField<string>;
  files?: MultipartFile | MultipartFile[];
};

export type ProductImage = {
  id: string;
  url: string;
  file?: MultipartFile;
  publicId: string;
  order: number;
};

export type Product = {
  id: string;
  isPopular: boolean;
  minQuantity: number;
  price: number;
  quantity: number;
  title: string;
  unit: string;
};

export type PurchaseRequestBody = {
  order: {
    dateOfOrder: string;
    deliveryType: "delivery" | "pickup";
    email: string;
    name: string;
    postalCode?: string;
    street?: string;
    houseNumber?: string;
    orderedItems: Product[];

    phone: string;
    promoCode?: string;
    totalPrice: number;
  };
};

export type OrderStatusRequestBody = {
  orderId: string;
};
