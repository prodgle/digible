export type Duel = {
    tokenId: string,
    owner: string,
    winner: string,
    amount: string,
    color: 'GREEN' | 'RED',
    acceptedBy: string,
    endDate: number,
    tokenIdAccepted: string,
    available: boolean
};
