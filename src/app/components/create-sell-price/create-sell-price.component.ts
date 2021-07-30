import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { WalletService } from 'src/app/services/wallet.service';
import { environment } from 'src/environments/environment';
import { MarketplaceService } from '../../services/marketplace.service';
import { MathService } from '../../services/math.service';
import { NftService } from '../../services/nft.service';

@Component({
  selector: 'app-create-sell-price',
  templateUrl: './create-sell-price.component.html',
  styleUrls: ['./create-sell-price.component.scss'],
})
export class CreateSellPriceComponent implements OnInit {
  id;
  address;
  loading = false;
  inputAmount;
  stableSymbol = environment.stableCoinSymbol;
  digibleNftAddress;
  showApprove;
  fee;
  royaltyFee;
  sale;
  selectedDate;
  hasRoyalty = false;

  listingPrice;
  receiveAmount;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly nft: NftService,
    private readonly market: MarketplaceService,
    private readonly math: MathService,
    private readonly router: Router,
    private readonly wallet: WalletService
  ) {}

  ngOnInit(): void {
    const date = new Date();
    date.setDate(date.getDate() + 14); // In two weeks
    this.selectedDate = date;

    this.nft.getNftAddress(true).then((address) => {
      this.digibleNftAddress = address;
      this.checkSale();
      this.checkApprove();
      this.loadHasLoyalty();
    });
    this.route.params.subscribe((queryParams) => {
      this.id = queryParams.id;
      this.address = queryParams.address;
    });
    this.loadFee();
  }

  async checkSale(): Promise<void> {
    const sale = await this.market.getSaleForToken(
      this.address,
      parseInt(this.id, undefined)
    );
    if (sale.available) {
      this.sale = sale;
    }
  }

  async loadFee(): Promise<void> {
    // this.fee = await this.market.getFee();
    this.fee = 10; // 10%
  }

  onChangeInputAmount(): void {
    setTimeout(() => {
      this.listingPrice = (
        this.inputAmount + ((this.inputAmount * this.fee) / 100)
      ).toFixed(2);
      if (this.hasRoyalty) {
        this.receiveAmount =
          this.inputAmount -
          ((this.inputAmount * this.fee) / 100) -
          ((this.inputAmount * this.royaltyFee) / 100);
      } else {
        this.receiveAmount =
          this.inputAmount - ((this.inputAmount * this.fee) / 100);
      }
      this.receiveAmount = this.receiveAmount.toFixed(2);
    }, 100);
  }

  async loadHasLoyalty(): Promise<void> {
    if (this.address.toLowerCase() !== this.digibleNftAddress.toLowerCase()) {
      return;
    }
    this.hasRoyalty = await this.market.hasRoyalty(
      this.id,
      await (
        await this.nft.owner(this.id)
      ).address
    );
    if (this.hasRoyalty) {
      this.royaltyFee = await this.market.getRoyaltyFee(this.id);
    }
  }

  async checkApprove(): Promise<void> {
    if (this.address === this.digibleNftAddress) {
      return;
    }
    this.showApprove = !(await this.nft.isApprovedExternalForAll(
      this.address,
      await this.wallet.getAccount(),
      this.market.getMarketplaceAddress()
    ));
  }

  async approve(): Promise<void> {
    this.loading = true;
    try {
      await this.nft.setApprovalExternalForAll(
        this.address,
        this.market.getMarketplaceAddress()
      );
      this.checkApprove();
    } catch (e) {
      console.error(e);
    }
    this.loading = false;
  }

  async sell(): Promise<void> {
    this.loading = true;

    const endDate = parseInt(
      this.selectedDate.getTime() / 1000 + '',
      undefined
    );
    const currentDate =  parseInt(
      new Date().getTime() / 1000 + '',
      undefined
    );
    const digiBalance = await this.nft.digiBalance();
    if (digiBalance < 3000 * 10 ** 18) {
      alert('You need to hold at least 3,000 $DIGI');
      this.loading = false;
      return;
    }
    try {
      await this.market.createSale(
        this.id,
        this.address,
        this.math.toBlockchainValue(this.listingPrice),
        endDate - currentDate
      );
      this.router.navigate(['/explorer']);
    } catch (e) {
      console.error(e);
    }
    this.loading = false;
  }
}
