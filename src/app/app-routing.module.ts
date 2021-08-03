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
import { HomeComponent } from './components/home/home.component';
import { PrivateSaleComponent } from './components/private-sale/private-sale.component';
import { ProfileComponent } from './components/profile/profile.component';
import { RankingsComponent } from './components/rankings/rankings.component';
import { SearchComponent } from './components/search/search.component';
import { StakingComponent } from './components/staking/staking.component';

// About page components
import { AboutDigiTeamComponent } from './components/about/digi-team/digi-team.component';
import { AboutDigiDuelComponent } from './components/about/digi-duel/digi-duel.component';
import { AboutDigiFarmComponent } from './components/about/digi-farm/digi-farm.component';
import { AboutDigiSafeComponent } from './components/about/digi-safe/digi-safe.component';
import { AboutDigiGradeComponent } from './components/about/digi-grade/digi-grade.component';
import { AboutDigiTrackComponent } from './components/about/digi-track/digi-track.component';
import { AboutDigiRoadMapComponent } from './components/about/road-map/digi-road-map.component';
import { faqComponent } from './components/about/faq/faq.component';
import { TermsAndConditionsComponent } from './components/about/terms-and-conditions/terms-and-conditions.component';
import { PrivacyPolicyComponent } from './components/about/privacy-policy/privacy-policy.component';

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
        component: HomeComponent,
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
      {
        path: 'digi-team',
        component: AboutDigiTeamComponent,
      },
      {
        path: 'digi-duel',
        component: AboutDigiDuelComponent,
      },
      {
        path: 'digi-farm',
        component: AboutDigiFarmComponent,
      },
      {
        path: 'digi-safe',
        component: AboutDigiSafeComponent,
      },
      {
        path: 'digi-grade',
        component: AboutDigiGradeComponent,
      },
      {
        path: 'digi-track',
        component: AboutDigiTrackComponent,
      },
      {
        path: 'digi-road-map',
        component: AboutDigiRoadMapComponent,
      },
      {
        path: 'faq',
        component: faqComponent,
      },
      {
        path: 'terms-and-conditions',
        component: TermsAndConditionsComponent,
      },
      {
        path: 'privacy-policy',
        component: PrivacyPolicyComponent,
      }
    ],
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes,{
    scrollPositionRestoration: 'top'
  })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
