import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { NftService } from 'src/app/services/nft.service';
import { WalletService } from 'src/app/services/wallet.service';
import { DigiCard } from 'src/app/types/digi-card.types';
import { Network } from 'src/app/types/network.enum';

@Component({
  selector: 'app-auctions',
  templateUrl: './auctions.component.html',
  styleUrls: ['./auctions.component.scss'],
})
export class AuctionsComponent implements OnInit {
  static nftListCached: DigiCard[] = null;
  static cacheUntil: Date = null;
  static lastOffset: number;

  nftList: DigiCard[] = null;
  showSwitchToMatic = false;
  loading = false;
  currentOffset = 0;
  endReached = false;
  readonly limit = 12;


  constructor(
    private readonly nft: NftService,
    private readonly wallet: WalletService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
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
    const network = await this.wallet.getNetwork();
    if (network !== Network.MATIC) {
      this.showSwitchToMatic = true;
    } else {
      this.showSwitchToMatic = false;
    }
    this.cdr.detectChanges();
  }

  async loadData(): Promise<void> {

    if (AuctionsComponent.cacheUntil > new Date() && AuctionsComponent.nftListCached) {
      this.nftList = AuctionsComponent.nftListCached;
      this.currentOffset = AuctionsComponent.lastOffset;
      return;
    }

    this.nftList = null;
    this.currentOffset = 0;
    this.endReached = false;
    this.nftList = await this.nft.getLastAuctions(this.limit);
    if (this.nftList.length === 0) {
      this.endReached = true;
    }
    this.setCache();
    this.cdr.detectChanges();
  }

  switchToMatic(): void {
    this.wallet.switchToMatic();
  }

  async loadMore(): Promise<void> {
    this.loading = true;
    this.currentOffset = this.currentOffset + this.limit;
    const newNfts = await this.nft.getLastAuctions(this.limit, this.currentOffset);
    if (newNfts.length === 0 || newNfts.length < this.limit) {
      this.endReached = true;
    }
    this.nftList = [...this.nftList, ...newNfts];
    this.setCache();
    this.loading = false;
  }

  private setCache(): void {
    AuctionsComponent.nftListCached = this.nftList;
    AuctionsComponent.lastOffset = this.currentOffset;
    const date = new Date();
    date.setMinutes( date.getMinutes() + 30 );
    AuctionsComponent.cacheUntil = date;
  }

}
