import { Component, OnInit } from '@angular/core';
import { NftService } from 'src/app/services/nft.service';
import { DigiCard } from 'src/app/types/digi-card.types';

@Component({
  selector: 'app-rankings',
  templateUrl: './rankings.component.html',
  styleUrls: ['./rankings.component.scss'],
})
export class RankingsComponent implements OnInit {

  constructor(
  ) {}

  ngOnInit(): void {
  }
}
