export interface DelfiResponse {
    data: {
        recordsTotal: number;
        products: DelfiProduct[];
    }
}

interface DelfiProduct {
    title: string;
    priceList: {
        fullPrice: number;
        quantityDiscountPremiumPrice: number;
    }
}