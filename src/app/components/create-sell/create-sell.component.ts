import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MarketplaceService } from '../../services/marketplace.service';
import { NftService } from '../../services/nft.service';
import { WalletService } from '../../services/wallet.service';
import { DigiCard } from '../../types/digi-card.types';
import { Network } from '../../types/network.enum';

@Component({
  selector: 'app-create-sell',
  templateUrl: './create-sell.component.html',
  styleUrls: ['./create-sell.component.scss']
})
export class CreateSellComponent implements OnInit {

  showSwitchToEth;
  myCards: DigiCard[];
  showApprove = true;
  loading = false;
  address;

  constructor(
    private readonly wallet: WalletService,
    private readonly cdr: ChangeDetectorRef,
    private readonly nft: NftService,
    private readonly market: MarketplaceService,
  ) { }

  ngOnInit(): void {
    this.loadData();
    this.checkNetwork();
    if (window.ethereum) {
      window.ethereum.on('networkChanged', () => {
        this.checkNetwork();
        this.loadData();
      });
    }
  }

  async loadData(): Promise<void> {
    const account = await this.wallet.getAccount();
    if (!account) {
      return;
    }
    this.address = await this.nft.getNftAddress(true);
    this.checkApprove();
    this.myCards = await this.nft.myNFTs(account);
  }

  async checkApprove(): Promise<void> {
    this.showApprove = !(await this.nft.isApprovedForAll(await this.wallet.getAccount(), this.market.getMarketplaceAddress()));
    this.cdr.detectChanges();
  }

  async approve(): Promise<void> {
    this.loading = true;
    try {
      await this.nft.setApprovalForAll(this.market.getMarketplaceAddress());
      this.checkApprove();
    } catch (e) {
      console.error(e);
    }
    this.loading = false;
  }

  async checkNetwork(): Promise<void> {
    const network = await this.wallet.getNetwork();
    if (network !== Network.ETH) {
      this.showSwitchToEth = true;
    } else {
      this.showSwitchToEth = false;
    }
    this.cdr.detectChanges();
  }

  switchToMatic(): void {
    this.wallet.switchToMatic();
  }

}
