export type ProductsQuery = {
  category?: string;
  page?: number;
  limit?: number;
};

export type CreateProductBody = {
  category: string;
  product: {
    title: string;
    image: string;
    price: number; 
    unit: string;
    description: string;
    minQuantity: number;
    isPopular: boolean;
  };
};

export  type Product = {
  id: string;
  isPopular: boolean;
  minQuantity: number;
  price: number;
  quantity: number;
  title: string;
  unit: string;
};
export  type PurchaseRequestBody = {
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
