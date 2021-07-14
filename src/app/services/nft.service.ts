import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { DigiCard } from '../types/digi-card.types';
import { MarketCard } from '../types/market-card.types';
import { Network } from '../types/network.enum';
import { PendingDigiCard } from '../types/pending-digi-card.types';
import { MathService } from './math.service';
import { VerifiedWalletsService } from './verified-wallets.service';
import { WalletService } from './wallet.service';

@Injectable()
export class NftService {
  MAX_INT = BigInt(
    '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
  );

  private nftAddress = environment.nftAddress;
  private nftAddressMatic = environment.nftAddressMatic;

  private digiAddress = environment.digiAddress;
  private digiAddressMatic = environment.digiAddressMatic;

  private auctionAddress = environment.auctionAddress;

  currentAccount: string;

  constructor(
    private readonly wallet: WalletService,
    private readonly math: MathService,
    private readonly verifiedProfiles: VerifiedWalletsService
  ) {}

  async transfer(tokenId: number, receiver: string): Promise<void> {
    const from = await this.getAccount();
    await (await this.getNftContract()).methods
      .transferFrom(from, receiver, tokenId)
      .send({ from });
  }

  async mint(
    receiver: string,
    cardName: string,
    cardImage: string,
    cardPhysical: boolean,
    
  ): Promise<void> {
    const from = await this.getAccount();
    await (await this.getNftContract()).methods
      .mint(receiver, cardName, cardImage, cardPhysical)
      .send({ from });
     
  }

  async canMint(account?: string, isMatic?: boolean): Promise<boolean> {
    let from;
    if (account) {
      from = account;
    } else {
      from = await this.getAccount();
    }
    if (!from) {
      return false;
    }
    const minterRole =
      '0xf0887ba65ee2024ea881d91b74c2450ef19e1557f03bed3ea9f16b037cbe2dc9';
    return await (await this.getNftContract(true, isMatic)).methods
      .hasRole(minterRole, from)
      .call();
  }

  async isAdmin(account?: string): Promise<boolean> {
    let from;
    if (account) {
      from = account;
    } else {
      from = await this.getAccount();
    }
    if (!from) {
      return false;
    }
    const adminRole =
      '0x0000000000000000000000000000000000000000000000000000000000000000';
    return await (await this.getNftContract(true)).methods
      .hasRole(adminRole, from)
      .call();
  }

  async grantMinterRole(account: string): Promise<void> {
    const minterRole =
      '0xf0887ba65ee2024ea881d91b74c2450ef19e1557f03bed3ea9f16b037cbe2dc9';
    return await (await this.getNftContract()).methods
      .grantRole(minterRole, account)
      .send({ from: await this.getAccount() });
  }

  async revokeMinterRole(account: string): Promise<void> {
    const minterRole =
      '0xf0887ba65ee2024ea881d91b74c2450ef19e1557f03bed3ea9f16b037cbe2dc9';
    return await (await this.getNftContract()).methods
      .revokeRole(minterRole, account)
      .send({ from: await this.getAccount() });
  }

  async getAuctionIdByToken(tokenId: number): Promise<number | null> {
    const auction = parseInt(
      await (await this.getAuctionContract(true)).methods
        .lastAuctionByToken(tokenId)
        .call(),
      undefined
    );
    if (auction === 0 && tokenId !== environment.tokenIdForAuction0) {
      return null;
    }
    return auction;
  }

  async directBuy(auctionId: number): Promise<void> {
    const from = await this.getAccount();
    await (await this.getAuctionContract()).methods
      .directBuy(auctionId)
      .send({ from });
  }

  async getFee(): Promise<number> {
    return parseInt(
      await (await this.getAuctionContract(true)).methods.purchaseFee().call(),
      undefined
    );
  }

  async getRoyaltyFee(tokenId: number): Promise<number> {
    return parseInt(
      (
        await (await this.getAuctionContract(true)).methods
          .royaltiesByToken(tokenId)
          .call()
      ).fee
    );
  }

  async cancel(auctionId: number): Promise<void> {
    const from = await this.getAccount();
    await (await this.getAuctionContract()).methods
      .cancel(auctionId)
      .send({ from });
  }

  async hasRoyalty(tokenId: number, owner?: string): Promise<boolean> {
    if (owner) {
      const wallet = (
        await (await this.getAuctionContract(true)).methods
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
        await (await this.getAuctionContract(true)).methods
          .royaltiesByToken(tokenId)
          .call()
      ).wallet !== '0x0000000000000000000000000000000000000000'
    );
  }

  async createAuction(
    tokenId: number,
    minPrice: string,
    fixedPrice: string,
    duration: number
  ): Promise<void> {
    const from = await this.getAccount();
    await (await this.getAuctionContract()).methods
      .createAuction(tokenId, minPrice, fixedPrice, duration)
      .send({ from });
  }

  async claim(auctionId: number): Promise<void> {
    const from = await this.getAccount();
    await (await this.getAuctionContract()).methods
      .claim(auctionId)
      .send({ from });
  }

  async bid(auctionId: number, amount: string): Promise<void> {
    const from = await this.getAccount();
    await (await this.getAuctionContract()).methods
      .participateAuction(auctionId, amount)
      .send({ from });
  }

  async getAuctionById(auctionId: number): Promise<{
    buyed: boolean;
    endDate: string;
    fixedPrice: string;
    minPrice: string;
    owner: string;
    tokenId: string;
    available: boolean;
  }> {
    const date = new Date();
    const auction = await (await this.getAuctionContract(true)).methods
      .auctions(auctionId)
      .call();
    auction.available =
      !auction.buyed &&
      date.getTime() / 1000 < parseInt(auction.endDate, undefined);
    return auction;
  }

  async isClaimed(auctionId: number): Promise<boolean> {
    return await (await this.getAuctionContract(true)).methods
      .claimedAuctions(auctionId)
      .call();
  }

  async getLastAuctionPrices(
    tokenId: number,
    limit: number
  ): Promise<
    { amount: string; wallet: string; created: number; username: string }[]
  > {
    const fromBlock =
      (await this.wallet.getMaticInfuraWeb3().eth.getBlockNumber()) -
      environment.blocksInEvents;

    return new Promise(async (resolve, reject) => {
      await (
        await this.getAuctionContract(true)
      ).getPastEvents(
        'Claimed',
        {
          filter: {
            tokenId,
          },
          fromBlock,
          toBlock: 'latest',
        },
        (error, events) => {
          if (error) {
            resolve(error);
          } else {
            resolve(
              events
                .map((event) => {
                  event.returnValues.humanAmount = this.math.toHumanValue(
                    event.returnValues.amount
                  );
                  event.returnValues.username =
                    this.verifiedProfiles.getVerifiedName(
                      event.returnValues.wallet
                    );
                  return event.returnValues;
                })
                .slice(0, limit)
            );
          }
        }
      );
    });
  }

  async getLastAuctionBuyNows(
    tokenId: number,
    limit: number
  ): Promise<
    { amount: string; wallet: string; created: number; username: string }[]
  > {
    const fromBlock =
      (await this.wallet.getMaticInfuraWeb3().eth.getBlockNumber()) -
      environment.blocksInEvents;

    return new Promise(async (resolve, reject) => {
      await (
        await this.getAuctionContract(true)
      ).getPastEvents(
        'DirectBuyed',
        {
          filter: {
            tokenId,
          },
          fromBlock,
          toBlock: 'latest',
        },
        (error, events) => {
          if (error) {
            resolve(error);
          } else {
            resolve(
              events
                .map((event) => {
                  event.returnValues.humanAmount = this.math.toHumanValue(
                    event.returnValues.amount
                  );
                  event.returnValues.username =
                    this.verifiedProfiles.getVerifiedName(
                      event.returnValues.wallet
                    );
                  return event.returnValues;
                })
                .slice(0, limit)
            );
          }
        }
      );
    });
  }

  async getLastAuctionBuyNowsByAddress(
    wallet: string,
    limit: number
  ): Promise<
    { amount: string; wallet: string; created: number; username: string }[]
  > {
    const fromBlock =
      (await this.wallet.getMaticInfuraWeb3().eth.getBlockNumber()) -
      environment.blocksInEvents;
    return new Promise(async (resolve, reject) => {
      await (
        await this.getAuctionContract(true)
      ).getPastEvents(
        'DirectBuyed',
        {
          filter: {
            wallet,
          },
          fromBlock,
          toBlock: 'latest',
        },
        (error, events) => {
          if (error) {
            resolve(error);
          } else {
            resolve(
              events
                .map((event) => {
                  event.returnValues.humanAmount = this.math.toHumanValue(
                    event.returnValues.amount
                  );
                  event.returnValues.username =
                    this.verifiedProfiles.getVerifiedName(
                      event.returnValues.wallet
                    );
                  return event.returnValues;
                })
                .slice(0, limit)
            );
          }
        }
      );
    });
  }

  async getLastBids(
    auctionId: number,
    limit: number
  ): Promise<{ amount: string; wallet: string; created: number }[]> {
    const fromBlock =
      (await this.wallet.getMaticInfuraWeb3().eth.getBlockNumber()) -
      environment.blocksInEvents;

    return new Promise(async (resolve, reject) => {
      await (
        await this.getAuctionContract(true)
      ).getPastEvents(
        'NewHighestOffer',
        {
          filter: {
            auctionId,
          },
          fromBlock,
          toBlock: 'latest',
        },
        (error, events) => {
          if (error) {
            resolve(error);
          } else {
            resolve(
              events
                .map((event) => {
                  event.returnValues.amount = this.math.toHumanValue(
                    event.returnValues.amount
                  );
                  event.returnValues.created =
                    event.returnValues.created * 1000;
                  return event.returnValues;
                })
                .slice(0, limit)
            );
          }
        }
      );
    });
  }

  async getLastBidsByUser(
    wallet: string,
    limit: number
  ): Promise<{ amount: string; wallet: string; created: number }[]> {
    const fromBlock =
      (await this.wallet.getMaticInfuraWeb3().eth.getBlockNumber()) -
      environment.blocksInEvents;
    return new Promise(async (resolve, reject) => {
      await (
        await this.getAuctionContract(true)
      ).getPastEvents(
        'NewHighestOffer',
        {
          filter: {
            wallet,
          },
          fromBlock,
          toBlock: 'latest',
        },
        (error, events) => {
          if (error) {
            console.error(error);
            resolve([]);
          } else {
            resolve(
              events
                .map((event) => {
                  event.returnValues.amount = this.math.toHumanValue(
                    event.returnValues.amount
                  );
                  event.returnValues.humanAmount = event.returnValues.amount;
                  event.returnValues.created =
                    event.returnValues.created * 1000;
                  return event.returnValues;
                })
                .slice(0, limit)
            );
          }
        }
      );
    });
  }

  async getAuctionPrice(
    auctionId: number,
    auction: any
  ): Promise<{
    price: string;
    winner: string;
  }> {
    const auctions = await this.getAuctionContract(true);
    const offer = await auctions.methods.highestOffers(auctionId).call();
    let price = offer.offer;
    const winner = offer.buyer;
    if (price === '0') {
      price = auction.minPrice;
    }
    return { price, winner };
  }

  async getLastAuctions(limit: number, offset?: number): Promise<DigiCard[]> {
    if (!offset) {
      offset = 0;
    }
    limit = limit + offset;
    const auctions = await this.getAuctionContract(true);
    const total = parseInt(
      await auctions.methods.auctionCount().call(),
      undefined
    );
    if (total === 0) {
      return [];
    }

    const digiCards: DigiCard[] = [];
    for (
      let auctionId = total - offset;
      auctionId > total - limit;
      auctionId--
    ) {
      if (auctionId < 0) {
        break;
      }
      const auction = await this.getAuctionById(auctionId);
      if (!auction.available) {
        continue;
      }
      if (
        environment.deletedNfts.indexOf(
          parseInt(auction.tokenId, undefined)
        ) !== -1
      ) {
        continue;
      }
      const price = (await this.getAuctionPrice(auctionId, auction)).price;
      digiCards.push({
        id: parseInt(auction.tokenId, undefined),
        auction: true,
        price: this.math.toHumanValue(price),
      });
    }
    return digiCards;
  }

  async pendingAuctions(limit: number): Promise<PendingDigiCard[]> {
    const auctions = await this.getAuctionContract(true);
    const account = await this.getAccount();
    const total = parseInt(
      await auctions.methods.auctionCount().call(),
      undefined
    );
    if (total === 0) {
      return [];
    }

    const digiCards: PendingDigiCard[] = [];

    for (let auctionId = total - 1; auctionId > total - limit; auctionId--) {
      if (auctionId < 0) {
        break;
      }
      const auction = await this.getAuctionById(auctionId);
      const offer = await this.getAuctionPrice(auctionId, auction);
      if (
        (auction.owner === account || offer.winner === account) &&
        !auction.available
      ) {
        if (await this.isClaimed(auctionId)) {
          continue;
        }
        const sold =
          !auction.available &&
          (offer.winner !== '0x0000000000000000000000000000000000000000' ||
            auction.buyed);
        if (!sold) {
          const currentOwner = await (
            await this.getNftContract(true, true)
          ).methods
            .ownerOf(auction.tokenId)
            .call();
          if (
            currentOwner.toLowerCase() !==
            environment.auctionAddress.toLowerCase()
          ) {
            continue;
          }
        }
        digiCards.push({
          id: parseInt(auction.tokenId, undefined),
          auctionId,
          seller: auction.owner === account,
          sold,
        });
      }
    }
    return digiCards;
  }

  async getExternalNftName(nftAddress: string): Promise<string> {
    const abi = require('../../assets/abis/erc721.json');
    const nft = new (this.wallet.getWeb3().eth.Contract)(abi, nftAddress);
    return await nft.methods.name().call();
  }

  async getExternalNftUri(
    nftAddress: string,
    tokenId: number
  ): Promise<string> {
    const abi = require('../../assets/abis/erc721.json');
    const nft = new (this.wallet.getWeb3().eth.Contract)(abi, nftAddress);
    return await nft.methods.tokenURI(tokenId).call();
  }

  async myExternalNFTs(nftAddress: string): Promise<MarketCard[]> {
    const utils = await this.getNftUtilsContract(Network.ETH);
    const account = await this.getAccount();
    const myNFTs: MarketCard[] = [];
    const nfts = await utils.methods.tokensOfOwner(nftAddress, account).call();
    nfts.map((id) => {
      myNFTs.push({
        id,
        address: nftAddress,
      });
    });
    return myNFTs;
  }

  async getBurnTransaction(tokenId: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      await (
        await this.getNftContract(true)
      ).getPastEvents(
        'Transfer',
        {
          filter: {
            tokenId,
            to: '0x000000000000000000000000000000000000dEaD',
          },
          fromBlock: 0,
          toBlock: 'latest',
        },
        (error, events) => {
          if (error) {
            resolve(error);
          } else {
            resolve(events);
          }
        }
      );
    });
  }

  async applyRoyalty(
    tokenId: number,
    beneficiary: string,
    fee: number
  ): Promise<number> {
    const from = await this.getAccount();
    return await (await this.getAuctionContract()).methods
      .setRoyaltyForToken(tokenId, beneficiary, fee)
      .send({ from });
  }

  async myNFTs(account: string, isMatic?: boolean): Promise<DigiCard[]> {
    const utils = await this.getNftUtilsContract(
      isMatic ? Network.MATIC : Network.ETH
    );
    const myNFTs: DigiCard[] = [];
    const nfts = await utils.methods
      .tokensOfOwner(isMatic ? this.nftAddressMatic : this.nftAddress, account)
      .call();
    nfts.map((id) => {
      myNFTs.push({ id });
    });
    return myNFTs;
  }

  async getNewNfts(limit: number, offset?: number): Promise<DigiCard[]> {
    if (!offset) {
      offset = 0;
    }
    limit = limit + offset;
    const nft = await this.getNftContract(true);
    const totalSupply = parseInt(
      await nft.methods.totalSupply().call(),
      undefined
    );
    const digiCards: DigiCard[] = [];

    for (
      let tokenId = totalSupply - offset;
      tokenId > totalSupply - limit;
      tokenId--
    ) {
      if (tokenId <= 0) {
        break;
      }
      if (environment.deletedNfts.indexOf(tokenId) !== -1) {
        continue;
      }
      digiCards.push({
        id: tokenId,
      });
    }
    return digiCards;
  }

  async externalOwner(nftAddress: string, tokenId: number): Promise<string> {
    const abi = require('../../assets/abis/erc721.json');
    const nft = new (this.wallet.getWeb3().eth.Contract)(abi, nftAddress);
    return await nft.methods.ownerOf(tokenId).call();
  }

  async owner(tokenId: number): Promise<{
    address: string;
    network: Network;
  }> {
    try {
      return {
        address: await (await this.getNftContract(true, true)).methods
          .ownerOf(tokenId)
          .call(),
        network: Network.MATIC,
      };
    } catch (e) {}
    return {
      address: await (await this.getNftContract(true)).methods
        .ownerOf(tokenId)
        .call(),
      network: Network.ETH,
    };
  }

  async isApprovedExternalForAll(
    nftAddress: string,
    owner: string,
    operator: string
  ): Promise<boolean> {
    const abi = require('../../assets/abis/erc721.json');
    const nft = new (this.wallet.getWeb3().eth.Contract)(abi, nftAddress);
    return await nft.methods.isApprovedForAll(owner, operator).call();
  }

  async setApprovalExternalForAll(
    nftAddress: string,
    operator: string
  ): Promise<void> {
    const abi = require('../../assets/abis/erc721.json');
    const nft = new (this.wallet.getWeb3().eth.Contract)(abi, nftAddress);
    await nft.methods
      .setApprovalForAll(operator, true)
      .send({ from: await this.getAccount() });
  }

  async isApprovedForAll(owner: string, operator: string): Promise<boolean> {
    return await (await this.getNftContract()).methods
      .isApprovedForAll(owner, operator)
      .call();
  }

  async setApprovalForAll(operator: string): Promise<void> {
    await (await this.getNftContract()).methods
      .setApprovalForAll(operator, true)
      .send({ from: await this.getAccount() });
  }

  async approve(address: string): Promise<void> {
    const account = await this.getAccount();

    await (await this.getStableContract()).methods
      .approve(address, this.MAX_INT)
      .send({ from: account });
  }

  async allowedStable(amount: number, address: string): Promise<boolean> {
    const allowance = await this.allowedTokenFor(address);
    return allowance >= amount * 10 ** 18;
  }

  async allowedTokenFor(address: string): Promise<number> {
    const account = await this.getAccount();

    return await (await this.getStableContract()).methods
      .allowance(account, address)
      .call();
  }

  async stableBalance(account?: string, readonly?: boolean): Promise<number> {
    if (!account) {
      account = await this.getAccount();
    }

    return await (await this.getStableContract(readonly)).methods
      .balanceOf(account)
      .call();
  }

  async digiBalance(account?: string, readonly?: boolean): Promise<number> {
    if (!account) {
      account = await this.getAccount();
    }

    return await (await this.getDigiContract(readonly)).methods
      .balanceOf(account)
      .call();
  }

  async getNftAddress(readOnly?: boolean): Promise<string> {
    if (!readOnly && (await this.wallet.getNetwork()) === Network.MATIC) {
      return this.nftAddressMatic;
    }
    return this.nftAddress;
  }

  getAuctionAddress(): string {
    return this.auctionAddress;
  }

  async getDigiAddress(): Promise<string> {
    if ((await this.wallet.getNetwork()) === Network.MATIC) {
      return this.digiAddressMatic;
    }
    return this.digiAddress;
  }

  private async getNftUtilsContract(network: Network): Promise<any> {
    const abi = require('../../assets/abis/nftutils.json');
    if (network === Network.MATIC) {
      return new (this.wallet.getMaticInfuraWeb3().eth.Contract)(
        abi,
        environment.utilsAddressMatic
      );
    }
    return new (this.wallet.getInfuraWeb3().eth.Contract)(
      abi,
      environment.utilsAddress
    );
  }

  private async getNftContract(
    readonly?: boolean,
    isMatic?: boolean
  ): Promise<any> {
    const abi = require('../../assets/abis/erc721.json');
    if (readonly) {
      if (isMatic) {
        return new (this.wallet.getMaticInfuraWeb3().eth.Contract)(
          abi,
          this.nftAddressMatic
        );
      }
      return new (this.wallet.getInfuraWeb3().eth.Contract)(
        abi,
        this.nftAddress
      );
    }
    return new (this.wallet.getWeb3().eth.Contract)(
      abi,
      await this.getNftAddress()
    );
  }

  private async getAuctionContract(readonly?: boolean): Promise<any> {
    const abi = require('../../assets/abis/auctions.json');
    if (readonly) {
      return new (this.wallet.getMaticInfuraWeb3().eth.Contract)(
        abi,
        this.auctionAddress
      );
    }
    return new (this.wallet.getWeb3().eth.Contract)(abi, this.auctionAddress);
  }

  private async getStableContract(readonly?: boolean): Promise<any> {
    const abi = require('../../assets/abis/erc20.json');
    if (readonly) {
      return new (this.wallet.getInfuraWeb3().eth.Contract)(
        abi,
        environment.stableCoinAddress
      );
    }
    if ((await this.wallet.getNetwork()) === Network.ETH) {
      return new (this.wallet.getWeb3().eth.Contract)(
        abi,
        environment.stableCoinAddressEth
      );
    }
    return new (this.wallet.getWeb3().eth.Contract)(
      abi,
      environment.stableCoinAddress
    );
  }

  private async getDigiContract(readonly?: boolean): Promise<any> {
    const abi = require('../../assets/abis/erc20.json');
    if (readonly) {
      return new (this.wallet.getInfuraWeb3().eth.Contract)(
        abi,
        this.digiAddress
      );
    }
    return new (this.wallet.getWeb3().eth.Contract)(
      abi,
      await this.getDigiAddress()
    );
  }

  private async getAccount(): Promise<string | null> {
    if (!this.currentAccount) {
      this.currentAccount = await this.wallet.getAccount();
    }
    return this.currentAccount;
  }
}
