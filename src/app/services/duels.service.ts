import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Duel } from '../types/duel.type';
import { MathService } from './math.service';
import { WalletService } from './wallet.service';

@Injectable()
export class DuelsService {

  MAX_INT = BigInt(
    '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
  );

  private duelsAddress = environment.duelsAddress;
  private zeroAddress = '0x0000000000000000000000000000000000000000';

  currentAccount: string;

  constructor(
    private readonly wallet: WalletService,
    private readonly math: MathService,
  ) {}

  async acceptDuel(duelId: number, tokenId: number): Promise<void> {
    const from = await this.getAccount();
    await (await this.getDuelsContract()).methods
      .accept(duelId, tokenId)
      .send({ from });
  }

  async cancelDuel(duelId: number): Promise<void> {
    const from = await this.getAccount();
    await (await this.getDuelsContract()).methods
      .cancel(duelId)
      .send({ from });
  }

  async createDuel(tokenId: number, amount: string, color: 'GREEN' | 'RED', duration: number): Promise<number> {
    const from = await this.getAccount();
    return await (await this.getDuelsContract()).methods
      .create(tokenId, amount, color === 'GREEN' ? 0 : 1, duration)
      .send({ from });
  }

  async getDuelById(duelId: number): Promise<Duel> {
    const date = new Date();
    const duel = await (await this.getDuelsContract()).methods.duels(duelId).call();
    duel.available = duel.acceptedBy === this.zeroAddress && (date.getTime() / 1000) < parseInt(duel.endDate, undefined);
    duel.color = duel.color === '0' ? 'GREEN' : 'RED';
    return duel;
  }

  async getLastDuels(limit: number): Promise<Duel[]> {
    const duelsContract = (await this.getDuelsContract());
    const total = parseInt(await duelsContract.methods.duelsCount().call(), undefined);
    if (total === 0) {
      return [];
    }

    const duels: Duel[] = [];

    for (let dueldId = total - 1; dueldId > total - limit; dueldId--) {
      if (dueldId < 0) {
        break;
      }
      const duel = await this.getDuelById(dueldId);
      if (!duel.available) {
        continue;
      }
      duels.push(duel);
    }
    return duels;

  }

  getDuelsAddress(): string {
    return this.duelsAddress;
  }

  private async getDuelsContract(): Promise<any> {
    const abi = require('../../assets/abis/duels.json');
    return new (this.wallet.getWeb3().eth.Contract)(
      abi,
      this.getDuelsAddress()
    );
  }

  private async getAccount(): Promise<string | null> {
    if (!this.currentAccount) {
      this.currentAccount = await this.wallet.getAccount();
    }
    return this.currentAccount;
  }
}
