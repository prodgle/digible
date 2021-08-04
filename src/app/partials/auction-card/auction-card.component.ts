import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { MarketplaceService } from 'src/app/services/marketplace.service';
import { MathService } from 'src/app/services/math.service';
import { NftService } from 'src/app/services/nft.service';
import { OffchainService } from 'src/app/services/offchain.service';
import { VerifiedWalletsService } from 'src/app/services/verified-wallets.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-digi-card',
  templateUrl: './digi-card.component.html',
  styleUrls: ['./digi-card.component.scss'],
})
export class DigiCardComponent implements OnInit {
  @Input() id: number;
  @Input() price: number = null;
  @Input() auction: boolean;
  @Input() view: string;
  
  customBorder: string;
  owner: string;
  ownerUsername: string;
  auctionOwner: string;
  symbol = environment.stableCoinSymbol;

  physical: boolean;
  image = '/assets/images/cards/loading.png';
  description = '...';
  name = '...';

  isVideo = false;

  constructor(
    private offchain: OffchainService,
    private nft: NftService,
    private math: MathService,
    private cdr: ChangeDetectorRef,
    private market: MarketplaceService,
    private verifiedProfiles: VerifiedWalletsService
  ) {}

  ngOnInit(): void {
    if ((this.price as any) === '') {
      this.price = null;
    }
    this.loadData();
  }

  async loadData(): Promise<void> {
    this.loadOffChainData();
    if (this.price == null) {
      this.loadAuction().then(() => {
        this.loadOwner();
      });
      this.loadSale();
    } else {
      this.loadOwner();
    }
  }

  async loadSale(): Promise<void> {
    const sale = await this.market.getSaleForToken(
      await this.nft.getNftAddress(true),
      parseInt(this.id + '', undefined)
    );

    if (sale != null && sale.available) {
      this.auction = false;
      this.price = this.math.toHumanValue(sale.price);
    }
    this.cdr.detectChanges();
  }

  async loadAuction(): Promise<void> {
    const auctionId = await this.nft.getAuctionIdByToken(
      parseInt(this.id + '', undefined)
    );
    if (auctionId != null) {
      const auction = await this.nft.getAuctionById(auctionId);
      this.auctionOwner = auction.owner;
      if (auction.available) {
        this.auction = true;
        this.price = this.math.toHumanValue(
          (await this.nft.getAuctionPrice(auctionId, auction)).price
        );
      }
    }
    this.cdr.detectChanges();
  }

  async loadOwner(): Promise<void> {
    this.owner = (await this.nft.owner(this.id)).address;
    if (this.owner.toLowerCase() === environment.auctionAddress.toLowerCase() && this.auctionOwner) {
      this.owner = this.auctionOwner;
    }
    this.ownerUsername = this.verifiedProfiles.getVerifiedName(this.owner);
    this.customBorder = this.verifiedProfiles.getCustomBorder(this.owner);
    this.cdr.detectChanges();
  }

  async loadOffChainData(): Promise<void> {
    const card = await this.offchain.getNftData(this.id);
    this.physical = card.physical;
    this.image = card.image;
    this.description = card.description;
    this.name = card.name;
    this.checkType();
    this.cdr.detectChanges();
    localStorage.setItem('is_physical_' + this.id, this.physical ? '1' : '0');
  }

  async checkType(): Promise<void> {
    this.isVideo = await this.offchain.isVideo(this.image);
  }
}
