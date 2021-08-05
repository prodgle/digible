import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { math } from '../types/math';

@Injectable()
export class MathService {
  toHumanValue(amount: string, decimals?: number): number {
    if (!decimals) {
      decimals = environment.stableCoinDecimals;
    }
    var e = parseFloat(
      math
        .chain(math.bignumber(amount))
        .divide(math.bignumber(10).pow(math.bignumber(decimals)))
        .done()
    );
    return this.toFixedNoRounding(3, parseFloat(
      math
        .chain(math.bignumber(amount))
        .divide(math.bignumber(10).pow(math.bignumber(decimals)))
        .done()
        .toFixed(4)
    ));
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

  public toFixedNoRounding(n:any, d: any) {
    const reg = new RegExp(`^-?\\d+(?:\\.\\d{0,${n}})?`, 'g')
    const a = d.toString().match(reg)[0];
    const dot = a.indexOf('.');
  
    if (dot === -1) {
      return a + '.' + '0'.repeat(n);
    }
  
    const b = n - (a.length - dot) + 1;
  
    return b > 0 ? (a + '0'.repeat(b)) : a;
  }
}
