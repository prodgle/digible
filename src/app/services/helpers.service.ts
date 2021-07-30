import { Injectable } from '@angular/core';

@Injectable()
export class HelpersService {
  IsJsonString(str): boolean {
    try {
      JSON.parse(str);
    } catch (e) {
      return false;
    }
    return true;
  }
}
