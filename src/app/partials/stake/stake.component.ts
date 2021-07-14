import { Component, Input, OnInit } from '@angular/core';
import { Stake } from 'src/app/components/staking/stake.type';
import { StakingService } from 'src/app/services/staking.service';
import { WalletService } from 'src/app/services/wallet.service';
import { Network } from 'src/app/types/network.enum';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-stake',
  templateUrl: './stake.component.html',
  styleUrls: ['./stake.component.scss'],
})
export class StakeComponent implements OnInit {
  @Input()
  stake: Stake;

  address;
  approved = false;
  digiApproved = false;
  loading = false;

  amountInput;

  rewards;
  rewardsNumber;
  rewardsBlock;
  yourStake;
  totalStaked;
  apr;
  balance;

  staking: StakingService;

  constructor(private readonly wallet: WalletService) {}

  ngOnInit(): void {
    this.staking = new StakingService(this.wallet, this.stake.stakeAddress);
    this.loadData();

    this.wallet.loginEvent.subscribe(() => {
      this.loadData();
    });
  }

  async loadData(): Promise<void> {
    this.rewards = '...';
    this.yourStake = '...';
    this.apr = '...';
    this.balance = '...';
    this.address = await this.wallet.getAccount();
    this.getApproved();
    this.getRewards();
    this.getYourStake();
    this.getTotalStaked();
    this.getYourBalance();
    this.getAPR();
  }

  async getYourBalance(): Promise<void> {
    this.balance = parseFloat(
      await this.wallet
        .getWeb3()
        .utils.fromWei(
          await this.staking.tokenBalance(this.stake.address),
          'ether'
        )
    ).toFixed(2);
  }

  async getRewards(): Promise<void> {
    this.rewards = parseFloat(
      await this.wallet
        .getWeb3()
        .utils.fromWei(await this.staking.pendingClaim(), 'ether')
    ).toFixed(2);

    this.rewardsNumber = parseFloat(this.rewards);
  }

  async getYourStake(): Promise<void> {
    this.yourStake = parseFloat(
      await this.wallet
        .getWeb3()
        .utils.fromWei(await this.staking.getStakedAmount(), 'ether')
    ).toFixed(2);
  }

  async getTotalStaked(): Promise<void> {
    this.totalStaked = parseFloat(
      await this.wallet
        .getWeb3()
        .utils.fromWei(await this.staking.getTotalStakeForStake(), 'ether')
    ).toFixed(2);
  }

  async getApproved(): Promise<void> {
    this.approved = await this.staking.allowed(this.stake.address, 1);
  }

  async approveDigi(): Promise<void> {
    this.send(() => this.staking.approveToken(environment.digiAddressMatic));
  }

  async claim(): Promise<void> {
    this.send(() => this.staking.claim());
  }

  async withdraw(): Promise<void> {
    this.send(async () => this.staking.withdraw());
  }

  async deposit(): Promise<void> {
    this.send(() =>
      this.staking.deposit(
        this.wallet.getWeb3().utils.toWei(this.amountInput + '', 'ether')
      )
    );
  }

  async getAPR(): Promise<void> {
    const getTotalStake = parseFloat(
      await this.wallet
        .getWeb3()
        .utils.fromWei(await this.staking.getTotalStakeForStake(), 'ether')
    );
    if (getTotalStake === 0) {
      this.apr = 0;
      return;
    }

    const blocksIn12Months = 10475500;
    this.apr = (getTotalStake * 100).toFixed(0);
  }

  private async send(method: () => Promise<any>): Promise<void> {
    if ((await this.wallet.getNetwork()) !== Network.MATIC) {
      this.switchToMatic();
      return;
    }

    this.loading = true;
    try {
      await method();
      this.loadData();
    } catch (e) {
      console.error(e);
    }
    this.loading = false;
  }

  switchToMatic(): void {
    this.wallet.switchToMatic();
  }
}
