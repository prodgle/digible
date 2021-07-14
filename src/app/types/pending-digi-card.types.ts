export type PendingDigiCard = {
  id: number;
  price?: number;
  auction?: boolean;
  auctionId: number;
  seller: boolean;
  sold: boolean;
};
