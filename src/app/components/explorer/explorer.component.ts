import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MarketplaceService } from 'src/app/services/marketplace.service';
import { NftService } from 'src/app/services/nft.service';
import { WalletService } from 'src/app/services/wallet.service';
import { MarketCard } from 'src/app/types/market-card.types';
import { Network } from 'src/app/types/network.enum';

@Component({
  selector: 'app-explorer',
  templateUrl: './explorer.component.html',
  styleUrls: ['./explorer.component.scss'],
})
export class ExplorerComponent implements OnInit {
  static nftListCached: MarketCard[] = null;
  static cacheUntil: Date = null;
  static lastOffset: number;

  nftList: MarketCard[] = null;
  showSwitchToMatic = false;
  digibleNftAddress;
  network: Network;

  loading = false;
  currentOffset = 0;
  endReached = false;
  readonly limit = 12;

  constructor(
    private readonly nft: NftService,
    private readonly market: MarketplaceService,
    private readonly cdr: ChangeDetectorRef,
    private readonly wallet: WalletService,
  ) {}

  ngOnInit(): void {
    this.nft.getNftAddress(true).then((address) => {
      this.digibleNftAddress = address;
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

  async checkNetwork(): Promise<void> {
    this.network = await this.wallet.getNetwork();
    this.cdr.detectChanges();
  }

  async loadData(): Promise<void> {
    if (ExplorerComponent.cacheUntil > new Date() && ExplorerComponent.nftListCached) {
      this.nftList = ExplorerComponent.nftListCached;
      this.currentOffset = ExplorerComponent.lastOffset;
      return;
    }
    this.currentOffset = 0;
    this.endReached = false;
    this.nftList = (await this.market.getLastSales(this.limit)).sales;
    this.setCache();
    this.cdr.detectChanges();
  }

  switchToMatic(): void {
    this.wallet.switchToMatic();
  }

  async loadMore(): Promise<void> {
    this.loading = true;
    this.currentOffset = this.currentOffset + this.limit;
    const newNfts = await this.market.getLastSales(this.limit, this.currentOffset);
    if (newNfts.total < (this.limit + this.currentOffset)) {
      this.endReached = true;
    }
    this.nftList = [...this.nftList, ...newNfts.sales];
    this.setCache();
    this.loading = false;
  }

  private setCache(): void {
    ExplorerComponent.nftListCached = this.nftList;
    ExplorerComponent.lastOffset = this.currentOffset;
    const date = new Date();
    date.setMinutes( date.getMinutes() + 30 );
    ExplorerComponent.cacheUntil = date;
  }
}
