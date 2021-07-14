import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { MarketCard } from '../types/market-card.types';
import { MathService } from './math.service';
import { VerifiedWalletsService } from './verified-wallets.service';
import { WalletService } from './wallet.service';

@Injectable()
export class MarketplaceService {
  MAX_INT = BigInt(
    '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
  );

  private marketplaceAddress = environment.marketplaceAddress;

  currentAccount: string;

  constructor(
    private readonly wallet: WalletService,
    private readonly math: MathService,
    private readonly verifiedProfiles: VerifiedWalletsService
  ) {}

  async buy(saleId: number): Promise<void> {
    const from = await this.getAccount();
    await (await this.getMarketplaceContract()).methods
      .buy(saleId)
      .send({ from });
  }

  async cancelSale(saleId: number): Promise<void> {
    const from = await this.getAccount();
    await (await this.getMarketplaceContract()).methods
      .cancelSale(saleId)
      .send({ from });
  }

  async createSale(
    tokenId: number,
    tokenAddress: string,
    price: string,
    duration: number
  ): Promise<number> {
    const from = await this.getAccount();
    return await (await this.getMarketplaceContract()).methods
      .createSale(tokenId, tokenAddress, price, duration)
      .send({ from });
  }

  async getFee(): Promise<number> {
    return parseInt(
      await (await this.getMarketplaceContract(true)).methods
        .purchaseFee()
        .call(),
      undefined
    );
  }

  async getRoyaltyFee(tokenId: number): Promise<number> {
    return parseInt(
      (
        await (await this.getMarketplaceContract(true)).methods
          .royaltiesByToken(tokenId)
          .call()
      ).fee,
      undefined
    );
  }

  async applyRoyalty(
    tokenId: number,
    beneficiary: string,
    fee: number
  ): Promise<number> {
    const from = await this.getAccount();
    return await (await this.getMarketplaceContract()).methods

      .setRoyaltyForToken(tokenId, beneficiary, fee)
      .send({ from });
  }

  async hasRoyalty(tokenId: number, owner?: string): Promise<boolean> {
    if (owner) {
      const wallet = (
        await (await this.getMarketplaceContract(true)).methods
          .royaltiesByToken(tokenId)
          .call()
      ).wallet;
      return (
        wallet !== '0x0000000000000000000000000000000000000000' &&
        wallet !== owner
      );
    }
    return (
      (
        await (await this.getMarketplaceContract(true)).methods
          .royaltiesByToken(tokenId)
          .call()
      ).wallet !== '0x0000000000000000000000000000000000000000'
    );
  }

  async getSaleForToken(
    address: string,
    tokenId: number
  ): Promise<null | {
    tokenId: string;
    tokenAddress: string;
    owner: string;
    price: string;
    buyed: boolean;
    endDate: string;
    available: boolean;
    saleId: number;
  }> {
    const saleId = parseInt(
      await (await this.getMarketplaceContract(true)).methods
        .lastSaleByToken(address, tokenId)
        .call(),
      undefined
    );
    if (
      saleId === 0 &&
      localStorage.getItem('sale0') &&
      tokenId !== parseInt(localStorage.getItem('sale0'), undefined)
    ) {
      return null;
    }
    const sale = await this.getSaleById(saleId);
    if (parseInt(sale.tokenId, undefined) !== tokenId) {
      return null;
    }
    if (saleId === 0) {
      localStorage.setItem('sale0', tokenId + '');
    }
    return { saleId, ...sale };
  }

  async getSaleById(saleId: number): Promise<{
    tokenId: string;
    tokenAddress: string;
    owner: string;
    price: string;
    buyed: boolean;
    endDate: string;
    available: boolean;
  }> {
    const date = new Date();
    const sale = await (await this.getMarketplaceContract(true)).methods
      .sales(saleId)
      .call();
    sale.available =
      !sale.buyed && date.getTime() / 1000 < parseInt(sale.endDate, undefined);
    return sale;
  }

  async lastSells(
    tokenId: string,
    tokenAddress: string
  ): Promise<
    { amount: string; created: number; wallet: string; username: string }[]
  > {
    const market = await await this.getMarketplaceContract(true);

    return new Promise(async (resolve, reject) => {
      await market.getPastEvents(
        'SaleBuyed',
        {
          filter: { tokenId, tokenAddress },
          fromBlock: 0,
          toBlock: 'latest',
        },
        (error, events) => {
          if (error) {
            reject(error);
          } else {
            resolve(
              events.map((eventFiltered) => {
                eventFiltered.returnValues.humanAmount = this.math.toHumanValue(
                  eventFiltered.returnValues.amount
                );
                eventFiltered.returnValues.username =
                  this.verifiedProfiles.getVerifiedName(
                    eventFiltered.returnValues.wallet
                  );
                eventFiltered.returnValues.created =
                  eventFiltered.returnValues.created;
                return eventFiltered.returnValues;
              })
            );
          }
        }
      );
    });
  }

  async lastBuys(
    wallet: string,
    limit: number
  ): Promise<
    { amount: string; created: number; wallet: string; username: string }[]
  > {
    const market = await await this.getMarketplaceContract(true);
    return new Promise(async (resolve, reject) => {
      await market.getPastEvents(
        'SaleBuyed',
        {
          filter: { wallet },
          fromBlock: 0,
          toBlock: 'latest',
        },
        (error, events) => {
          if (error) {
            reject(error);
          } else {
            resolve(
              events
                .map((eventFiltered) => {
                  eventFiltered.returnValues.humanAmount =
                    this.math.toHumanValue(eventFiltered.returnValues.amount);
                  eventFiltered.returnValues.username =
                    this.verifiedProfiles.getVerifiedName(
                      eventFiltered.returnValues.wallet
                    );
                  eventFiltered.returnValues.created =
                    eventFiltered.returnValues.created * 1000;
                  return eventFiltered.returnValues;
                })
                .slice(0, limit)
            );
          }
        }
      );
    });
  }

  async getLastSales(
    limit: number,
    offset?: number
  ): Promise<{ sales: MarketCard[]; total: number }> {
    if (!offset) {
      offset = 0;
    }
    limit = limit + offset;
    const market = await this.getMarketplaceContract(true);
    const total = parseInt(await market.methods.salesCount().call(), undefined);
    if (total === 0) {
      return { sales: [], total: 0 };
    }
    const cards: MarketCard[] = [];

    for (
      let auctionId = total - offset;
      auctionId > total - limit;
      auctionId--
    ) {
      if (auctionId < 0) {
        break;
      }

      const sale = await this.getSaleById(auctionId);
      if (!sale.available) {
        continue;
      }
      let found = false;
      for (const card of cards) {
        if (parseInt(sale.tokenId, undefined) === card.id) {
          found = true;
          continue;
        }
      }
      if (found) {
        continue;
      }

      if (
        sale.tokenAddress === environment.nftAddress &&
        environment.deletedNfts.indexOf(parseInt(sale.tokenId, undefined)) !==
          -1
      ) {
        continue;
      }
      cards.push({
        id: parseInt(sale.tokenId, undefined),
        auction: false,
        price: this.math.toHumanValue(sale.price),
        address: sale.tokenAddress,
      });
    }
    return {
      sales: cards,
      total,
    };
  }

  getMarketplaceAddress(): string {
    return this.marketplaceAddress;
  }

  private async getMarketplaceContract(readonly?: boolean): Promise<any> {
    const abi = require('../../assets/abis/marketplace.json');
    if (readonly) {
      return new (this.wallet.getInfuraWeb3().eth.Contract)(
        abi,
        this.getMarketplaceAddress()
      );
    }
    return new (this.wallet.getWeb3().eth.Contract)(
      abi,
      this.getMarketplaceAddress()
    );
  }

  private async getAccount(): Promise<string | null> {
    if (!this.currentAccount) {
      this.currentAccount = await this.wallet.getAccount();
    }
    return this.currentAccount;
  }
}
