export interface OfferItemSearchBody {
    itemID: string,
    itemName: string,
    itemCategory: string,
    city: string,
    neighbourhood: string,
    providerID: string
  }

export interface OfferItemSearchResult {
    hits: {
      total: number;
      hits: Array<{
        _source: OfferItemSearchBody;
      }>;
    };
  }