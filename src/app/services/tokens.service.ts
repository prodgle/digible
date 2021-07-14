import { Injectable } from '@angular/core';

@Injectable()
export class TokensService {

  private readonly key = 'digi_user_tokens';

  getTokenAddresses(): string[] {
    return Object.keys(this.getAll());
  }

  addToken(address: string): void {
    const tokens = this.getAll();
    tokens[address] = true;
    this.save(tokens);
  }

  removeToken(address: string): void {
    const tokens = this.getAll();
    delete tokens[address];
    this.save(tokens);
  }

  getAll(): { [key: string]: boolean; } {
    return this.fromPrimitive(localStorage.getItem(this.key));
  }

  save(data: { [key: string]: boolean; }): void {
    localStorage.setItem(this.key, this.toPrimitive(data));
  }

  private fromPrimitive(data: string): { [key: string]: boolean; } {
    if (data === null) {
      return {};
    }
    return JSON.parse(data);
  }

  private toPrimitive(data: { [key: string]: boolean; }): string {
    return JSON.stringify(data);
  }
}
