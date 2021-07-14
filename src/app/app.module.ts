import { DatePipe } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import {
  DlDateTimeDateModule,
  DlDateTimePickerModule
} from 'angular-bootstrap-datetimepicker';
import { NgxFileDropModule } from 'ngx-file-drop';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AdminComponent } from './components/admin/admin.component';
import { AuctionsComponent } from './components/auctions/auctions.component';
import { ClaimCardComponent } from './components/claim-card/claim-card.component';
import { CreateAuctionComponent } from './components/create-auction/create-auction.component';
import { CreateCardComponent } from './components/create-card/create-card.component';
import { CreateSellPriceComponent } from './components/create-sell-price/create-sell-price.component';
import { CreateSellComponent } from './components/create-sell/create-sell.component';
import { DetailsComponent } from './components/details/details.component';
import { DuelDetailsComponent } from './components/duel-details/duel-details.component';
import { DuelsComponent } from './components/duels/duels.component';
import { ExplorerComponent } from './components/explorer/explorer.component';
import { HomeComponent } from './components/home/home.component';
import { InfoComponent } from './components/info/info.component';
import { MarketCardComponent } from './components/market-card/market-card.component';
import { NewestComponent } from './components/newest/newest.component';
import { PrivateSaleComponent } from './components/private-sale/private-sale.component';
import { ProfileComponent } from './components/profile/profile.component';
import { RankingsComponent } from './components/rankings/rankings.component';
import { SearchComponent } from './components/search/search.component';
import { StakingComponent } from './components/staking/staking.component';
import { LayoutComponent } from './layout/layout.component';
import { DigiCardComponent } from './partials/digi-card/digi-card.component';
import { LoadingBlockchainComponent } from './partials/loading-blockchain/loading-blockchain.component';
import { LoadingComponent } from './partials/loading/loading.component';
import { StakeComponent } from './partials/stake/stake.component';
import { DuelsService } from './services/duels.service';
import { MarketplaceService } from './services/marketplace.service';
import { MathService } from './services/math.service';
import { MaticService } from './services/matic.service';
import { NftService } from './services/nft.service';
import { OffchainService } from './services/offchain.service';
import { StakingService } from './services/staking.service';
import { TokensService } from './services/tokens.service';
import { VerifiedWalletsService } from './services/verified-wallets.service';
import { WalletService } from './services/wallet.service';
import { CollectionsComponent } from './components/collections/collections.component';
import { LeaderboardComponent } from './components/leaderboard/leaderboard.component';

@NgModule({
  declarations: [
    AppComponent,
    ExplorerComponent,
    NewestComponent,
    DigiCardComponent,
    HomeComponent,
    LayoutComponent,
    LeaderboardComponent,
    LoadingComponent,
    LoadingBlockchainComponent,
    AuctionsComponent,
    RankingsComponent,
    ProfileComponent,
    InfoComponent,
    DetailsComponent,
    MarketCardComponent,
    CreateSellComponent,
    CreateSellPriceComponent,
    CreateCardComponent,
    CreateAuctionComponent,
    DuelsComponent,
    DuelDetailsComponent,
    PrivateSaleComponent,
    ClaimCardComponent,
    AdminComponent,
    SearchComponent,
    StakeComponent,
    StakingComponent,
    CollectionsComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    NgxFileDropModule,
    DlDateTimeDateModule,
    DlDateTimePickerModule,
  ],
  providers: [
    DatePipe,
    WalletService,
    OffchainService,
    NftService,
    MathService,
    MarketplaceService,
    MaticService,
    TokensService,
    DuelsService,
    StakingService,
    VerifiedWalletsService,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
