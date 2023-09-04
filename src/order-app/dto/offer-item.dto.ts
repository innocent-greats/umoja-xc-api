export class OfferItemRequestDTO {
  authToken: string
  itemName: string
  itemCategory: string
  providerID: string;
  offeringStatus: string;
  quantity: string;
  commodityWeight: string;
  price: string;
  description: string;
  trendingStatus: string;
  publishStatus: string;
}

export class OfferItemImage {
  imageID: string;
  url: string;
}