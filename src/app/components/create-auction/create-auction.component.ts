import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MathService } from '../../services/math.service';
import { NftService } from '../../services/nft.service';
import { WalletService } from '../../services/wallet.service';
import { Network } from '../../types/network.enum';

@Component({
  selector: 'app-create-auction',
  templateUrl: './create-auction.component.html',
  styleUrls: ['./create-auction.component.scss'],
})
export class CreateAuctionComponent implements OnInit {
  id;
  showSwitchToMatic;
  buyNowOption;
  buyNowPrice;
  minPrice;
  isApproved;
  loading = false;
  selectedDate;
  enoughBalance = true;

  fee;
  royaltyFee;
  hasRoyalty = false;
  listingPrice;
  receiveAmount;
  listingPriceBuyNow;
  receiveAmountBuyNow;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly wallet: WalletService,
    private readonly cdr: ChangeDetectorRef,
    private readonly nft: NftService,
    private readonly router: Router,
    private readonly math: MathService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((queryParams) => {
      this.id = queryParams.id;
    });
    this.loadData();
    this.checkNetwork();
    if (window.ethereum) {
      window.ethereum.on('networkChanged', () => {
        this.loadData();
        this.checkNetwork();
      });
    }
  }

  async loadData(): Promise<void> {
    this.checkApprove();
    this.checkMinAmount();
    this.loadFees();
    this.loadRoyalty();
  }

  async loadFees(): Promise<void> {
    this.fee = await this.nft.getFee();
  }

  async loadRoyalty(): Promise<void> {
    this.hasRoyalty = await this.nft.hasRoyalty(
      this.id,
      await (
        await this.nft.owner(this.id)
      ).address
    );
    if (this.hasRoyalty) {
      this.royaltyFee = await this.nft.getRoyaltyFee(this.id);
    }
  }

  async checkMinAmount(): Promise<void> {
    const digiBalance = await this.nft.digiBalance();
    if (digiBalance < 3000 * 10 ** 18) {
      this.enoughBalance = false;
    } else {
      this.enoughBalance = true;
    }
  }

  async checkApprove(): Promise<void> {
    this.isApproved = await this.nft.isApprovedForAll(
      await this.wallet.getAccount(),
      this.nft.getAuctionAddress()
    );
    this.cdr.detectChanges();
  }

  async approve(): Promise<void> {
    this.loading = true;
    try {
      await this.nft.setApprovalForAll(this.nft.getAuctionAddress());
      this.checkApprove();
    } catch (e) {
      console.error(e);
    }
    this.loading = false;
  }

  onChangeInputAmount(): void {
    setTimeout(() => {
      this.listingPrice = (
        this.minPrice *
        (100 / (100 - this.fee / 2 / 100))
      ).toFixed(2);
      if (this.hasRoyalty) {
        this.receiveAmount =
          this.listingPrice -
          (this.listingPrice * this.fee) / 10000 -
          (this.listingPrice * this.royaltyFee) / 10000;
      } else {
        this.receiveAmount =
          this.listingPrice - (this.listingPrice * this.fee) / 10000;
      }
      this.receiveAmount = this.receiveAmount.toFixed(2);
    }, 100);
  }

  onChangeBuyNowInputAmount(): void {
    setTimeout(() => {
      this.listingPriceBuyNow = (
        this.buyNowPrice *
        (100 / (100 - this.fee / 2 / 100))
      ).toFixed(2);
      if (this.hasRoyalty) {
        // tslint:disable-next-line: max-line-length
        this.receiveAmountBuyNow =
          this.listingPriceBuyNow -
          (this.listingPriceBuyNow * this.fee) / 10000 -
          (this.listingPriceBuyNow * this.royaltyFee) / 10000;
      } else {
        this.receiveAmountBuyNow =
          this.listingPriceBuyNow -
          (this.listingPriceBuyNow * this.fee) / 10000;
      }
      this.receiveAmountBuyNow = this.receiveAmountBuyNow.toFixed(2);
    }, 100);
  }

  async checkNetwork(): Promise<void> {
    const network = await this.wallet.getNetwork();
    if (network !== Network.MATIC) {
      this.showSwitchToMatic = true;
    } else {
      this.showSwitchToMatic = false;
    }
    this.cdr.detectChanges();
  }

  async create(): Promise<void> {
    this.loading = true;

    const currentDate = parseInt(new Date().getTime() / 1000 + '', undefined);

    const endDate = parseInt(
      this.selectedDate.getTime() / 1000 + '',
      undefined
    );

    const duration = endDate - currentDate;

    try {
      let buyNowPrice = '0';
      if (this.buyNowOption) {
        buyNowPrice = this.math.toBlockchainValue(this.listingPriceBuyNow);
      }
      await this.nft.createAuction(
        this.id,
        this.math.toBlockchainValue(this.listingPrice),
        buyNowPrice,
        duration
      );
      this.router.navigate(['/auctions']);
    } catch (e) {
      console.error(e);
    }

    this.loading = false;
  }

  switchToMatic(): void {
    this.wallet.switchToMatic();
  }
}
