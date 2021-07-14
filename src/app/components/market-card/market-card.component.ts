import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MarketplaceService } from 'src/app/services/marketplace.service';
import { MathService } from 'src/app/services/math.service';
import { NftService } from 'src/app/services/nft.service';
import { OffchainService } from 'src/app/services/offchain.service';
import { TokensService } from 'src/app/services/tokens.service';
import { VerifiedWalletsService } from 'src/app/services/verified-wallets.service';
import { WalletService } from 'src/app/services/wallet.service';
import { Network } from 'src/app/types/network.enum';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-market-card',
  templateUrl: './market-card.component.html',
  styleUrls: ['./market-card.component.scss']
})
export class MarketCardComponent implements OnInit {
  @Input() id: number;
  @Input() price: number = null;
  @Input() address: string;

  owner: string;
  symbol = environment.stableCoinSymbol;

  loading = false;
  allowedMarket;
  saleId;
  priceDecimals;
  isYours = false;

  physical: boolean;
  image = '/assets/images/cards/loading.png';
  name = '...';
  description = '...';

  constructor(
    private offchain: OffchainService,
    private nft: NftService,
    private cdr: ChangeDetectorRef,
    private wallet: WalletService,
    private market: MarketplaceService,
    private math: MathService,
    private tokens: TokensService,
    private router: Router,
    private verifieds: VerifiedWalletsService,
  ) {}

  ngOnInit(): void {
    if ((this.price as any) === '') {
      this.price = null;
    }
    this.loadData();
  }

  async loadData(): Promise<void> {
    this.loadCardData();
    this.loadOwner();
    this.loadSale();
  }

  async loadSale(): Promise<void> {
    this.getAllowed();

    const sale = await this.market.getSaleForToken(this.address, parseInt(this.id + '', undefined));

    if (sale != null && sale.available) {
      this.saleId = sale.saleId;
      this.price = this.math.toHumanValue(sale.price);
      this.priceDecimals = parseInt(sale.price, undefined);
    }
    this.cdr.detectChanges();
  }


  async loadOwner(): Promise<void> {
    this.owner = (await this.nft.externalOwner(this.address, this.id));
    this.isYours = this.owner === await this.wallet.getAccount();
    this.cdr.detectChanges();
  }

  async loadCardData(): Promise<void> {
    const uri = await this.nft.getExternalNftUri(this.address, this.id);
    const data = await this.offchain.getURIInfo(uri);
    this.image = data.image;
    this.name = data.name;
    this.description = data.description;
    this.cdr.detectChanges();
  }

  async getAllowed(): Promise<void> {
    this.allowedMarket = await this.nft.allowedTokenFor(this.market.getMarketplaceAddress());
  }

  async approveMarket(): Promise<void> {
    if (await this.wallet.getNetwork() !== Network.ETH) {
      alert('Connect to Ethereum network first');
      return;
    }
    this.loading = true;
    try {
      await this.nft.approve(this.market.getMarketplaceAddress());
    } catch (e) {
    }
    this.getAllowed();
    this.loading = false;
  }

  async cancelMarket(): Promise<void> {
    if (await this.wallet.getNetwork() !== Network.ETH) {
      alert('Connect to Ethereum network first');
      return;
    }
    this.loading = true;
    try {
      await this.market.cancelSale(this.saleId);
    } catch (e) {
    }
    this.loading = false;
    this.loadData();
  }

  async buyFromMarket(): Promise<void> {
    if (await this.wallet.getNetwork() !== Network.ETH) {
      alert('Connect to Ethereum network first');
      return;
    }
    this.loading = true;
    try {
      await this.market.buy(this.saleId);
      this.tokens.addToken(this.address);
      let username = this.verifieds.getVerifiedName(await this.wallet.getAccount());
      if (!username) {
        username = await this.wallet.getAccount();
      }
      this.router.navigate(['/profile', username]);
    } catch (e) {
    }
    this.loading = false;
    this.loadData();
  }
}
