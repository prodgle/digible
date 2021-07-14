import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { math } from '../types/math';

@Injectable()
export class MathService {
  toHumanValue(amount: string, decimals?: number): number {
    if (!decimals) {
      decimals = environment.stableCoinDecimals;
    }
    return parseFloat(
      math
        .chain(math.bignumber(amount))
        .divide(math.bignumber(10).pow(math.bignumber(decimals)))
        .done()
        .toFixed(4)
    );
  }

  toBlockchainValue(amount: string, decimals?: number): string {
    if (!decimals) {
      decimals = environment.stableCoinDecimals;
    }

    return math.format(
      math
        .chain(math.bignumber(amount))
        .multiply(math.bignumber(10).pow(math.bignumber(decimals)))
        .done(),
      { notation: 'fixed' }
    );
  }
}
