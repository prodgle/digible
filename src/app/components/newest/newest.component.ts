import { Component, OnInit } from '@angular/core';
import { NftService } from 'src/app/services/nft.service';
import { OffchainService } from 'src/app/services/offchain.service';
import { DigiCard } from 'src/app/types/digi-card.types';

@Component({
  selector: 'app-newest',
  templateUrl: './newest.component.html',
  styleUrls: ['./newest.component.scss'],
})
export class NewestComponent implements OnInit {
  filterBy = [
    { name: 'All', id: 'ALL' },
    { name: 'Show Physical', id: 'PHYSICAL' },
    { name: 'Show DIGITAL', id: 'DIGITAL' },
  ];
  static nftListCached: DigiCard[] = null;
  static lastOffset = 0;

  static cacheUntil: Date = null;

  nftList: DigiCard[] = null;
  unfilteredNftList: DigiCard[] = null;
  currentOffset = 0;
  loading = false;
  endReached = false;
  typeFilter = 'ALL';
  readonly limit = 12;

  constructor(
    private readonly nft: NftService,
    private readonly offchain: OffchainService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  async loadData(): Promise<void> {
    if (
      NewestComponent.cacheUntil > new Date() &&
      NewestComponent.nftListCached
    ) {
      this.nftList = NewestComponent.nftListCached;
      this.currentOffset = NewestComponent.lastOffset;
      this.unfilteredNftList = this.nftList;
      return;
    }
    this.currentOffset = 0;
    this.endReached = false;
    this.nftList = await this.nft.getNewNfts(this.limit, 0);
    this.setCache();
    this.unfilteredNftList = this.nftList;
  }

  async loadMore(): Promise<void> {
    this.loading = true;
    this.currentOffset = this.currentOffset + this.limit;
    const newNfts = await this.nft.getNewNfts(this.limit, this.currentOffset);
    if (newNfts.length === 0 || newNfts.length < this.limit) {
      this.endReached = true;
    }
    this.unfilteredNftList = [...this.unfilteredNftList, ...newNfts];
    if (this.typeFilter !== 'ALL') {
      this.changeFilter();
    } else {
      this.nftList = this.unfilteredNftList;
    }
    this.setCache();
    this.loading = false;
  }

  changeFilter(): void {
    this.loading = true;
    setTimeout(async () => {
      if (this.typeFilter === 'ALL') {
        this.nftList = this.unfilteredNftList;
        this.loading = false;
        return;
      }
      const filteredList = [];
      for (const nft of this.unfilteredNftList) {
        let cached = localStorage.getItem('is_physical_' + nft.id);
        if (cached === undefined) {
          cached = (await this.offchain.getNftData(nft.id)).physical
            ? '1'
            : '0';
          localStorage.setItem('is_physical_' + nft.id, cached);
        }
        if (this.typeFilter === 'PHYSICAL') {
          if (cached === '1') {
            filteredList.push(nft);
          }
        } else {
          if (cached === '0') {
            filteredList.push(nft);
          }
        }
      }
      this.nftList = filteredList;
      if (this.nftList.length === 0 && !this.endReached) {
        this.loadMore();
      }
      this.loading = false;
    }, 200);
  }

  public async handleInput(e) {
    this.loadData();
    var inputValue = (<HTMLInputElement>document.getElementById('searchInp'))
      .value;
    var title = document.getElementsByClassName('section-title');
    var searchBlock = document.getElementById('list-result');
    if (e.code == 'Enter') {
      title[0].innerHTML =
        "<span _ngcontent-fet-c62='' class='icon light'></span> RESULT:";
      searchBlock.innerHTML = '';
      var nftResultList = [];
      for (var i = 0; i < this.nftList.length; i++) {
        var info = await this.offchain.getNftData(this.nftList[i].id);
        if (
          info['description'].includes(inputValue) ||
          info['name'].includes(inputValue)
        ) {
          //console.log(info);

          nftResultList.push(info);

          //searchBlock.innerHTML += '<app-digi-card id="'+info.id+'" price="" auction=""></app-digi-card>';
        }
      }
      this.nftList = nftResultList;
    }
  }

  private setCache(): void {
    NewestComponent.nftListCached = this.nftList;
    NewestComponent.lastOffset = this.currentOffset;
    const date = new Date();
    date.setMinutes(date.getMinutes() + 30);
    NewestComponent.cacheUntil = date;
  }
}
