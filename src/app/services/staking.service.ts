import { Injectable } from '@angular/core';
import { WalletService } from './wallet.service';

declare global {
  interface Window {
    ethereum: any;
  }
}

@Injectable()
export class StakingService {
  MAX_INT = BigInt(
    '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
  );

  currentAccount: string;

  constructor(
    private readonly wallet: WalletService,
    private readonly stakeAddress
  ) {}

  async getStakedAmount(): Promise<string> {
    return await this.getStakeContract(true)
      .methods.staked(await this.getAccount())
      .call();
  }

  async getTotalStakedAmount(): Promise<number> {
    return await this.getStakeContract(true)
      .methods.staked(await this.getAccount())
      .call();
  }

  async getTotalStakeForStake(): Promise<number> {
    return await await this.getStakeContract(true)
      .methods.tokenTotalStaked()
      .call();
  }

  async claim(): Promise<void> {
    await this.getStakeContract()
      .methods.claim()
      .send({ from: await this.getAccount() });
  }

  async pendingClaim(): Promise<void> {
    return await this.getStakeContract(true)
      .methods.calculateReward(await this.getAccount())
      .call();
  }

  async deposit(amount: string): Promise<void> {
    await this.getStakeContract()
      .methods.stake(amount)
      .send({ from: await this.getAccount() });
  }

  async withdraw(): Promise<void> {
    await this.getStakeContract()
      .methods.withdraw()
      .send({ from: await this.getAccount(), value: 1000000000000000 });
  }

  async approve(token: string): Promise<void> {
    const account = await this.getAccount();
    const erc20Abi = require('../../assets/abis/erc20.json');
    const erc20Token = new (this.wallet.getWeb3().eth.Contract)(
      erc20Abi,
      token
    );

    await erc20Token.methods
      .approve(this.getStakeAddress(), this.MAX_INT)
      .send({ from: account });
  }

  async approveToken(token: string): Promise<void> {
    const account = await this.getAccount();
    const erc20Abi = require('../../assets/abis/erc20.json');
    const erc20Token = new (this.wallet.getWeb3().eth.Contract)(
      erc20Abi,
      token
    );

    await erc20Token.methods
      .approve(this.getStakeAddress(), this.MAX_INT)
      .send({ from: account });
  }

  async allowed(token: string, amount: number): Promise<boolean> {
    const allowance = await this.allowedToken(token);
    return allowance >= amount * 10 ** 18;
  }

  async allowedToken(token: string): Promise<number> {
    const account = await this.getAccount();
    const erc20Abi = require('../../assets/abis/erc20.json');
    const erc20Token = new (this.wallet.getMaticInfuraWeb3().eth.Contract)(
      erc20Abi,
      token
    );

    return await erc20Token.methods
      .allowance(account, this.getStakeAddress())
      .call();
  }

  async totalSupply(token: string): Promise<string> {
    const erc20Abi = require('../../assets/abis/erc20.json');
    const erc20Token = new (this.wallet.getMaticInfuraWeb3().eth.Contract)(
      erc20Abi,
      token
    );

    return await erc20Token.methods.totalSupply().call();
  }

  async tokenBalance(token: string, account?: string): Promise<number> {
    if (!account) {
      account = await this.getAccount();
    }
    const erc20Abi = require('../../assets/abis/erc20.json');
    const erc20Token = new (this.wallet.getMaticInfuraWeb3().eth.Contract)(
      erc20Abi,
      token
    );

    return await erc20Token.methods.balanceOf(account).call();
  }

  getStakeAddress(): string {
    return this.stakeAddress;
  }

  private getStakeContract(readonly?: boolean): any {
    const abi = require('../../assets/abis/staking.json');

    if (readonly) {
      return new (this.wallet.getMaticInfuraWeb3().eth.Contract)(
        abi,
        this.getStakeAddress()
      );
    }

    return new (this.wallet.getWeb3().eth.Contract)(
      abi,
      this.getStakeAddress()
    );
  }

  private async getAccount(): Promise<string | null> {
    if (!this.currentAccount) {
      this.currentAccount = await this.wallet.getAccount();
    }
    return this.currentAccount;
  }
}
