import { DatePipe, Location } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MarketplaceService } from 'src/app/services/marketplace.service';
import { MathService } from 'src/app/services/math.service';
import { MaticService } from 'src/app/services/matic.service';
import { NftService } from 'src/app/services/nft.service';
import { OffchainService } from 'src/app/services/offchain.service';
import { VerifiedWalletsService } from 'src/app/services/verified-wallets.service';
import { WalletService } from 'src/app/services/wallet.service';
import { Network } from 'src/app/types/network.enum';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.scss'],
})
export class DetailsComponent implements OnInit, OnDestroy {
  @ViewChild('burnTokenModal') burnTokenModal: ElementRef;
  @ViewChild('editDescriptionModal') editDescriptionModal: ElementRef;

  id;
  symbol = environment.stableCoinSymbol;
  name = '...';
  network = '...';
  description: {
    publisher: string,
    edition: string,
    year: string,
    graded: string,
    population: string,
    backCardImage: string,
    description: string
  };
  winner = '...';
  customBorder;
  winnerIsVerified;
  endDate = '...';
  burnDate;
  physical;
  canMintOnMatic;
  auctionId;
  auctionOwner;
  saleId;
  fee;
  highestBid = null;
  address: string;
  fullDescription;
  inputDescription;
  inputPublisher;
  inputEdition;
  inputYear;
  inputGraded;
  inputPopulation;

  networkWherCardIs = '...';
  explorerPrefixOfOwner;
  contractAddress = '...';
  ownerAddress;
  ownerUsername;
  isYours = false;
  lowBid = true;
  explorerPrefix;

  auction = false;
  buy = false;
  price;
  priceDecimals;
  priceBuyNow;
  priceBuyNowDecimals;
  allowed;
  allowedMarket;
  inputAmount;
  hasRoyalty;
  hasRoyaltyOnAuction;
  royaltyFee;
  royaltyFeeAuction;

  lastBids: { amount: string; wallet: string; created: number }[];

  showAllow = false;
  loading = false;
  loadingLastBids = false;
  loadingLastSells = false;
  showMaticApprove = true;
  isInEth = false;
  canMint = false;
  descriptionLoading = false;
  firstSale: boolean;
  firstAuction: boolean;

  lastSells;
  backSideImageExists = false;

  private readonly canGoBack: boolean;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly location: Location,
    private readonly offChain: OffchainService,
    private readonly walletService: WalletService,
    private readonly nft: NftService,
    private readonly cdr: ChangeDetectorRef,
    private readonly math: MathService,
    private readonly market: MarketplaceService,
    private readonly matic: MaticService,
    private readonly verifiedProfiles: VerifiedWalletsService,
    public datepipe: DatePipe
  ) {
    this.canGoBack = !!this.router.getCurrentNavigation()?.previousNavigation;
  }

  ngOnInit(): void {
    this.route.params.subscribe((queryParams) => {
      this.id = queryParams.id;
      if (
        environment.deletedNfts.indexOf(parseInt(this.id, undefined)) !== -1
      ) {
        this.router.navigate(['/']);
        return;
      }
      this.loadData();
    });
    if (window.ethereum) {
      window.ethereum.on('networkChanged', () => {
        location.reload();
      });
    }
  }

  ngOnDestroy(): void {
    if (this.highestBid) {
      clearInterval(this.highestBid);
    }
  }

  async loadData(): Promise<void> {
    this.name = '...';
    this.network = '...';
    this.description = null;
    this.physical = null;
    this.networkWherCardIs = '...';
    this.explorerPrefixOfOwner = null;
    this.contractAddress = '...';
    this.ownerAddress = null;
    this.ownerUsername = null;
    this.explorerPrefix = null;
    this.price = null;
    this.auction = false;
    this.buy = false;
    this.priceBuyNow = null;
    this.auctionId = null;
    this.saleId = null;
    this.lastSells = null;

    if (this.highestBid) {
      clearInterval(this.highestBid);
    }

    this.getCardDetails();
    this.checkNetwork();
    this.loadAuction().then(() => {
      this.getOwner();
    });
    this.loadSale();
    this.getAllowed();
    this.checkApproveMatic();
    this.loadLastSells();
    this.getAddress();

    this.matic.connectPOSClient();

    this.nft.canMint().then((canMint) => {
      this.canMint = canMint;
    });

    this.nft.canMint(undefined, true).then((canMint) => {
      this.canMintOnMatic = canMint;
    });
  }

  async getRoyalty(): Promise<void> {
    this.hasRoyalty = await this.market.hasRoyalty(this.id);
    if (this.hasRoyalty) {
      this.market.getRoyaltyFee(this.id).then((fee) => {
        this.royaltyFee = fee;
      });
    }
    let owner = this.auctionOwner;
    if (!owner) {
      owner = this.ownerAddress;
    }
    this.hasRoyaltyOnAuction = await this.nft.hasRoyalty(this.id);
    if (this.hasRoyaltyOnAuction) {
      this.nft.getRoyaltyFee(this.id).then((fee) => {
        this.royaltyFeeAuction = fee;
      });
    }
  }

  async enableRoyalty(): Promise<void> {
    this.loading = true;

    if (!this.isInEth) {
      alert('You need to move the NFT to the Eth network first');
      this.loading = false;
      return;
    }

    if ((await this.walletService.getNetwork()) !== Network.ETH) {
      alert('Connect to Ethereum network first');
      this.loading = false;
      return;
    }

    this.fee = parseInt(prompt('Input your desired fee %', '5'));

    try {
      await this.market.applyRoyalty(this.id, this.address, this.fee);
    } catch (e) {
      console.error(e);
    }

    this.loadData();
    this.loading = false;
  }

  async enableRoyaltyForAuction(): Promise<void> {
    this.loading = true;

    if (this.isInEth) {
      alert('You need to move the NFT to the Matic network first');
      this.loading = false;
      return;
    }

    if ((await this.walletService.getNetwork()) !== Network.MATIC) {
      alert('Connect to Matic network first');
      this.loading = false;
      return;
    }

    this.fee = parseInt(prompt('Input your desired fee %', '5'));

    try {
      await this.nft.applyRoyalty(this.id, this.address, this.fee);
    } catch (e) {
      console.error(e);
    }
    this.loadData();
    this.loading = false;
  }

  async getAddress(): Promise<void> {
    this.address = await this.walletService.getAccount();
  }

  async checkApproveMatic(): Promise<void> {
    this.showMaticApprove = !(await this.nft.isApprovedForAll(
      await this.walletService.getAccount(),
      environment.maticPredicate
    ));
    this.cdr.detectChanges();
  }

  async loadLastSells(): Promise<void> {
    this.loadingLastSells = true;
    console.log(this.nft)
    console.log(this.id)

    let lastSells = await this.market.lastSells(
      this.id,
      await this.nft.getNftAddress(true)
    );
      console.log(lastSells)
    try {
      lastSells = [
        ...lastSells,
        ...(await this.nft.getLastAuctionPrices(this.id, 4)),
      ];
    } catch (e) {
      console.error(e.message);
    }

    try {
      lastSells = [
        ...lastSells,
        ...(await this.nft.getLastAuctionBuyNows(this.id, 4)),
      ];
    } catch (e) {
      console.error(e);
    }

    this.lastSells = lastSells.sort(
      (a, b) => (a.created > b.created && -1) || 1
    );
    this.loadingLastSells = false;
  }

  async approveMatic(): Promise<void> {
    if ((await this.walletService.getNetwork()) !== Network.ETH) {
      alert('Connect to Ethereum network first');
      return;
    }
    this.loading = true;
    try {
      await this.nft.setApprovalForAll(environment.maticPredicate);
      this.checkApproveMatic();
    } catch (e) {
      console.error(e);
    }
    this.loading = false;
  }

  async sendToMatic(): Promise<void> {
    if ((await this.walletService.getNetwork()) !== Network.ETH) {
      alert('Connect to Ethereum network first');
      return;
    }
    this.loading = true;
    try {
      await this.matic.sendToMatic(this.id);
      alert(
        'Transfer ordered! You will receive your token on Matic in about 10 minutes.'
      );
      this.loadData();
    } catch (e) {
      console.error(e);
    }
    this.loading = false;
  }

  async sendToEthereum(): Promise<void> {
    if ((await this.walletService.getNetwork()) !== Network.MATIC) {
      alert('Connect to Matic network first');
      return;
    }
    this.loading = true;
    try {
      await this.matic.sendToEthereum(this.id);
      alert(
        'Transfer ordered! Change to "Ethereum" network on Metamask and go to your "Profile" section in order to claim your token.'
      );
      this.loadData();
    } catch (e) {
      console.error(e);
    }
    this.loading = false;
  }

  async loadSale(): Promise<void> {
    const sale = await this.market.getSaleForToken(
      await this.nft.getNftAddress(true),
      parseInt(this.id + '', undefined)
    );
    this.firstSale = sale === null;
    if (sale != null && sale.available) {
      this.auction = false;
      this.buy = true;
      this.price = this.math.toHumanValue(sale.price);
      this.priceDecimals = parseInt(sale.price, undefined);
      this.saleId = sale.saleId;
      this.endDate = sale.endDate;
    }
    this.cdr.detectChanges();
  }

  async loadAuction(): Promise<void> {
    const auctionId = await this.nft.getAuctionIdByToken(
      parseInt(this.id + '', undefined)
    );
    this.auctionId = auctionId;
    this.firstAuction = auctionId == null;
    if (auctionId != null) {
      const auction = await this.nft.getAuctionById(auctionId);

      this.auctionOwner = auction.owner;

      if (auction.available) {
        this.auction = true;
        const price = await this.nft.getAuctionPrice(auctionId, auction);
        this.price = this.math.toHumanValue(price.price);
        const winnerName = this.verifiedProfiles.getVerifiedName(price.winner);

        if (
          Notification.permission === 'granted' &&
          price.winner === this.address
        ) {
          this.highestBid = setInterval(async () => {
            const price = await this.nft.getAuctionPrice(auctionId, auction);
            if (price.winner !== this.address) {
              // tslint:disable-next-line: no-unused-expression
              new Notification('You have been outbidded!');
              clearInterval(this.highestBid);
              this.loadData();
            }
          }, 10000);
        }

        if (price.winner === '0x0000000000000000000000000000000000000000') {
          this.winner = null;
          this.winnerIsVerified = false;
        } else if (winnerName) {
          this.winner = winnerName;
          this.winnerIsVerified = true;
        } else {
          this.winner = price.winner;
          this.winnerIsVerified = false;
        }
        
        this.priceBuyNow = this.math.toHumanValue(auction.fixedPrice);
        this.priceBuyNowDecimals = parseInt(auction.fixedPrice, undefined);
        this.endDate = auction.endDate;

        this.getLastBids();
      }
    }
    this.cdr.detectChanges();
  }

  async getLastBids(): Promise<void> {
    this.loadingLastBids = true;
    this.lastBids = null;
    this.lastBids = (await this.nft.getLastBids(this.auctionId, 4)).sort(
      (a, b) => (a.created > b.created && -1) || 1
    );
    this.loadingLastBids = false;
  }

  isJson(string) {
    try {
      JSON.parse(string);
    } catch (error) {
      return false;
    }
    return true;
  }
  async getCardDetails(): Promise<void> {
    let card;
    try {
      card = await this.offChain.getNftData(this.id);
    } catch (e) {
      console.error(e);
      this.router.navigate(['/newest']);
      return;
    }
    this.name = card.name.charAt(0).toUpperCase() + card.name.slice(1).toLowerCase();;
    if (this.isJson(card.description)) {
      const data = JSON.parse(card.description);
      this.description = data.description
    } else {
      this.description = card.description;
    }
  
    this.physical = card.physical;
    this.fillDescriptionFields();
  }

  async getOwner(): Promise<void> {
    const owner = await this.nft.owner(this.id);

    if (
      owner.address.toLowerCase() === environment.auctionAddress.toLowerCase()
    ) {
      owner.address = this.auctionOwner;
    }

    const network = this.getNetworkData(owner.network);
    this.networkWherCardIs = network.name;
    this.isInEth = network.name === 'Ethereum';
    this.explorerPrefixOfOwner = network.prefix;
    this.ownerAddress = owner.address;

    if (owner.address == '0x000000000000000000000000000000000000dEaD') {
      const tx = await this.nft.getBurnTransaction(this.id);

      if (tx[0].blockNumber) {
        const txData = await this.walletService
          .getWeb3()
          .eth.getBlock(tx[0].blockNumber);

        const date = new Date(txData.timestamp * 1000);

        this.burnDate = this.datepipe.transform(date, 'yyyy/MM/dd HH:mm:ss');
      }
    }

    this.ownerUsername = this.verifiedProfiles.getVerifiedName(
      this.ownerAddress
    );

    this.customBorder = this.verifiedProfiles.getCustomBorder(
      this.auctionOwner
    );

    this.isYours = owner.address === (await this.walletService.getAccount());
    this.cdr.detectChanges();
    this.getRoyalty();
  }

  async checkNetwork(): Promise<void> {
    this.walletService.getNetwork().then((network: Network) => {
      const networkData = this.getNetworkData(network);
      this.network = networkData.name;
      this.explorerPrefix = networkData.prefix;
      this.cdr.detectChanges();
    });
    this.contractAddress = await this.nft.getNftAddress(true);
    this.cdr.detectChanges();
  }

  switchToMatic(): void {
    this.walletService.switchToMatic();
  }

  onChangeInput(): void {
    this.showAllow = this.inputAmount * 10 ** 18 > this.allowed;
    this.lowBid = this.inputAmount < this.price;

    if (this.winner !== null) {
      this.lowBid = this.inputAmount <= this.price;
    }
  }

  async getAllowed(): Promise<void> {
    this.allowed = await this.nft.allowedTokenFor(this.nft.getAuctionAddress());
    this.allowedMarket = await this.nft.allowedTokenFor(
      this.market.getMarketplaceAddress()
    );
    this.allowedMarket = parseInt(this.allowedMarket);
  }

  onBlur(evt) {
    if (evt.target.valueAsNumber) {
      this.inputAmount = evt.target.valueAsNumber.toFixed(2);
    }
  }

  async approveMarket(): Promise<void> {
    if ((await this.walletService.getNetwork()) !== Network.ETH) {
      alert('Connect to Ethereum network first');
      return;
    }
    this.loading = true;
    try {
      await this.nft.approve(this.market.getMarketplaceAddress());
    } catch (e) {}
    this.getAllowed();
    this.loading = false;
  }

  async cancelMarket(): Promise<void> {
    if ((await this.walletService.getNetwork()) !== Network.ETH) {
      alert('Connect to Ethereum network first');
      return;
    }
    this.loading = true;
    try {
      await this.market.cancelSale(this.saleId);
    } catch (e) {}
    this.loading = false;
    this.loadData();
  }

  async cancelAuction(): Promise<void> {
    if ((await this.walletService.getNetwork()) !== Network.MATIC) {
      alert('Connect to Matic network first');
      return;
    }
    this.loading = true;

    try {
      await this.nft.cancel(this.auctionId);
    } catch (e) {}
    this.loading = false;
    this.loadData();
  }

  async buyFromMarket(): Promise<void> {
    if ((await this.walletService.getNetwork()) !== Network.ETH) {
      alert('Connect to Ethereum network first');
      return;
    }
    this.loading = true;
    try {
      await this.market.buy(this.saleId);
    } catch (e) {}
    this.loading = false;
    this.loadData();
  }

  async approve(): Promise<void> {
    if ((await this.walletService.getNetwork()) !== Network.MATIC) {
      alert('Connect to Matic network first');
      return;
    }
    this.loading = true;
    try {
      await this.nft.approve(this.nft.getAuctionAddress());
    } catch (e) {
      console.error(e);
    }
    await this.getAllowed();
    this.onChangeInput();
    this.cdr.detectChanges();
    this.loading = false;
  }

  async directBuy(): Promise<void> {
    if ((await this.walletService.getNetwork()) !== Network.MATIC) {
      this.switchToMatic();
      return;
    }
    this.loading = true;
    try {
      await this.nft.directBuy(this.auctionId);
    } catch (e) {}
    this.loading = false;
    this.loadData();
  }

  async bid(): Promise<void> {
    if ((await this.walletService.getNetwork()) !== Network.MATIC) {
      this.switchToMatic();
      return;
    }
    if ((await this.walletService.getAccount()) === null) {
      alert('Connect your wallet first!');
      return;
    }
    this.loading = true;
    try {
      await this.nft.bid(
        this.auctionId,
        this.math.toBlockchainValue(this.inputAmount)
      );
    } catch (e) {
      console.error(e);
    }
    this.loading = false;
    this.loadData();
  }

  async addDescription(): Promise<void> {
    this.descriptionLoading = true;
    try {
      this.fullDescription = JSON.stringify({
        publisher: this.inputPublisher || '',
        edition: this.inputEdition || '',
        year: this.inputYear || '',
        graded: this.inputGraded || '',
        population: this.inputPopulation || '',
        backCardImage: this.description.backCardImage || '',
        description: this.inputDescription || ''
      });

      await this.offChain.addDescrption(
        await this.sign(),
        this.fullDescription,
        this.id,
      );
      await this.getCardDetails();
      alert('Description updated!');
    } catch (e) {
      alert('Error updating.');
      console.error(e);
    }
    this.descriptionLoading = false;
    this.editDescriptionModal.nativeElement.click();
  }

  async sign(): Promise<string> {
    return await this.walletService.signMessage(this.fullDescription);
  }

  private getNetworkData(network: Network): { name: string; prefix: string } {
    if (network === Network.ETH) {
      return {
        name: 'Ethereum',
        prefix: 'https://etherscan.io/address/',
      };
    } else if (network === Network.MATIC) {
      return {
        name: 'Matic',
        prefix: 'https://explorer-mainnet.maticvigil.com/address/',
      };
    } else {
      return {
        name: 'Invalid',
        prefix: '#',
      };
    }
  }

  async burnNFT(id: number): Promise<void> {
    this.loading = true;
    if ((await this.walletService.getNetwork()) !== Network.ETH) {
      alert('Connect to Ethereum network first');
      this.loading = false;
      return;
    }

    this.burnTokenModal.nativeElement.click();
    await this.nft.transfer(id, '0x000000000000000000000000000000000000dEaD');
    this.loadData();
    this.loading = false;
  }

  goBack(): void {
    if (this.canGoBack) {
      this.location.back();
    } else {
      this.router.navigate(['/explorer'], { relativeTo: this.route });
    }
  }

  fillDescriptionFields(): void {
    if (typeof this.description === 'object' && this.description !== null) {
      this.inputPublisher = this.description.publisher;
      this.inputEdition = this.description.edition;
      this.inputYear = this.description.year;
      this.inputGraded = this.description.graded;
      this.inputPopulation = this.description.population;
      this.inputDescription = this.description.description;
    }
  }

  keepOriginalOrder = (a, b) => a.key;
}
