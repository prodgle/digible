import { Component } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Stake } from './stake.type';

@Component({
  selector: 'app-staking',
  templateUrl: './staking.component.html',
  styleUrls: ['./staking.component.scss'],
})
export class StakingComponent {
  stakings: Stake[] = [
    {
      address: environment.digiAddressMatic,
      name: 'DIGI',
      icon: '/assets/images/logo-small.svg',
      decimals: 18,
      stakeAddress: environment.stakeAddress,
      reward: 'DIGI',
    },
  ];
}
