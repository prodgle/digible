import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminComponent } from './components/admin/admin.component';
import { AuctionsComponent } from './components/auctions/auctions.component';
import { ClaimCardComponent } from './components/claim-card/claim-card.component';
import { CollectionsComponent } from './components/collections/collections.component';
import { CreateAuctionComponent } from './components/create-auction/create-auction.component';
import { CreateCardComponent } from './components/create-card/create-card.component';
import { CreateSellPriceComponent } from './components/create-sell-price/create-sell-price.component';
import { CreateSellComponent } from './components/create-sell/create-sell.component';
import { DetailsComponent } from './components/details/details.component';
import { DuelDetailsComponent } from './components/duel-details/duel-details.component';
import { DuelsComponent } from './components/duels/duels.component';
import { ExplorerComponent } from './components/explorer/explorer.component';
import { InfoComponent } from './components/info/info.component';
import { LeaderboardComponent } from './components/leaderboard/leaderboard.component';
import { NewestComponent } from './components/newest/newest.component';
import { PrivateSaleComponent } from './components/private-sale/private-sale.component';
import { ProfileComponent } from './components/profile/profile.component';
import { RankingsComponent } from './components/rankings/rankings.component';
import { SearchComponent } from './components/search/search.component';
import { StakingComponent } from './components/staking/staking.component';
import { LayoutComponent } from './layout/layout.component';
import { PurchaseComponent } from './components/purchase/purchase.component';
const routes: Routes = [
  {
    path: 'info',
    component: InfoComponent,
  },
  {
    path: '',
    component: LayoutComponent,
    children: [
      {
        path: 'collections',
        component: CollectionsComponent,
      },
      {
        path: 'collections/leaderboard',
        component: LeaderboardComponent,
      },
      {
        path: 'search',
        component: SearchComponent,
      },
      {
        path: 'explorer',
        component: ExplorerComponent,
      },
      {
        path: 'explorer/create',
        component: CreateSellComponent,
      },
      {
        path: 'explorer/create/:address/:id',
        component: CreateSellPriceComponent,
      },
      {
        path: 'purchase',
        component: PurchaseComponent,
      },
      {
        path: 'stake',
        component: StakingComponent,
      },
      {
        path: '',
        component: NewestComponent,
      },
      {
        path: 'sale',
        component: PrivateSaleComponent,
      },
      {
        path: 'auctions',
        component: AuctionsComponent,
      },
      {
        path: 'auctions/create/:id',
        component: CreateAuctionComponent,
      },
      {
        path: 'rankings',
        component: RankingsComponent,
      },
      {
        path: 'details/:id',
        component: DetailsComponent,
      },
      {
        path: 'claim/:id',
        component: ClaimCardComponent,
      },
      {
        path: 'profile/:address',
        component: ProfileComponent,
      },
      {
        path: 'create',
        component: CreateCardComponent,
      },
      {
        path: 'duels',
        component: DuelsComponent,
      },
      {
        path: 'duel/:id',
        component: DuelDetailsComponent,
      },
      {
        path: 'admin',
        component: AdminComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
