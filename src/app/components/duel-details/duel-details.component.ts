import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DuelsService } from 'src/app/services/duels.service';
import { WalletService } from 'src/app/services/wallet.service';
import { Duel } from 'src/app/types/duel.type';

declare function $(str: string): any;

@Component({
  selector: 'app-duel-details',
  templateUrl: './duel-details.component.html',
  styleUrls: ['./duel-details.component.scss']
})
export class DuelDetailsComponent implements OnInit {

  duel: Duel;
  id;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly duels: DuelsService,
    private readonly wallet: WalletService,
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(queryParams => {
      this.id = queryParams.id;
      this.loadData();
    });
  }

  async loadData(): Promise<void> {
    this.duel = null;
    try {
      this.duel = await this.duels.getDuelById(this.id);
    } catch (e) {
      console.error(e);
      // Get out
    }
    this.duel = {
      tokenId: '1',
      owner: await this.wallet.getAccount(),
      color: 'GREEN',
      endDate: new Date().getTime() / 1000,
      acceptedBy: '0x0123456789',
      winner: '0x0123456789',
      amount: '100000000000000000000',
      tokenIdAccepted: '2',
      available: false,
    };
    // If available is true, get out

    let winner: 'GREEN' | 'RED' = this.duel.color;

    if (this.duel.winner !== this.duel.owner) {
      winner = this.duel.color === 'GREEN' ? 'RED' : 'GREEN';
    }

    this.spinWheel(winner);
  }

  private spinWheel(winner: 'GREEN' | 'RED'): void {
    for (let i = 0; i < 3; i++) {
      $('.list li').clone().appendTo('.list');
    }
    $('.window').css({
      right: '0'
    });
    $('.list li').css({
        border: '4px solid transparent'
    });
    const x = winner === 'GREEN' ? 65 : 66; // Between 50 and 100
    /*$('.list li:eq(' + x + ')').css({
        border: '4px solid #00ba00'
    }); */
    $('.window').animate({
        right: ((x * 130) + (x * 8 - 12) - 119)
    }, 10000);
  }

}
