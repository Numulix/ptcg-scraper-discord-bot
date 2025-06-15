export interface Product {
    storeName: string;
    name: string;
    price: number;
    discountedPrice: number;
    url: string;
    imageUrl?: string;
    inStock: boolean;
}

// TODO: Add an extra type for the list of cities and stores that the product is available in.
// Since the stores can have multiple locations it should also show all the locations the
// product is available in.