import { ConstantPool } from '@angular/compiler';
import { Component, OnInit } from '@angular/core';
import { Console } from 'node:console';
import { NftService } from 'src/app/services/nft.service';
import { OffchainService } from 'src/app/services/offchain.service';
import { DigiCard } from 'src/app/types/digi-card.types';
import { Network } from 'src/app/types/network.enum';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
})
export class SearchComponent implements OnInit {
  searchReady = false;
  nftList: DigiCard[] = null;
  unfilteredNftList: DigiCard[] = null;
  newFilteredList = [];
  currentOffset = 0;
  loading = false;
  endReached = false;
  typeSearch = 'ALL';
  filterBy = [
    { name: 'All', id: 'ALL' },
    { name: 'Show Physical', id: 'PHYSICAL' },
    { name: 'Show DIGITAL', id: 'DIGITAL' },
  ];

  readonly limit = 10005;

  constructor(private readonly nft: NftService, private readonly offchain: OffchainService) {}

  ngOnInit(): void {
    this.loadData();
    this.searchReady = false;
  }

  async loadData(): Promise<void> {
    this.currentOffset = 0;
    this.endReached = false;
    this.nftList = await this.nft.getNewNfts(this.limit, 0);
    this.unfilteredNftList = this.nftList;
    this.handleInput();
    //console.log(1);
  }

  async loadMore(): Promise<void> {
    this.loading = true;
    this.currentOffset = this.currentOffset + this.limit;
    const newNfts = await this.nft.getNewNfts(this.limit, this.currentOffset);
    if (newNfts.length === 0 || newNfts.length < this.limit) {
      this.endReached = true;
    }
    this.unfilteredNftList = [...this.unfilteredNftList, ...newNfts];
    if (this.typeSearch !== 'ALL') {
      //this.changeFilter();
    } else {
      this.nftList = this.unfilteredNftList;
      
    }
    this.loading = false;
  }

  changeFilter(): void {
    this.loading = true;
    setTimeout(async () => {
      if (this.typeSearch === 'ALL') {
        this.nftList = this.newFilteredList;
        this.loading = false;
        return;
      }
      const filteredList = [];
      for (const nft of this.newFilteredList) {
        let cached = localStorage.getItem('is_physical_' + nft.id);
        if (cached === undefined) {
          cached = (await this.offchain.getNftData(nft.id)).physical ? '1' : '0';
          localStorage.setItem('is_physical_' + nft.id, cached);
        }
        if (this.typeSearch === 'PHYSICAL') {
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

   handleInput(){
    var params = window
    .location
    .search
    .replace('?','')
    .split('&')
    .reduce(
        function(p,e){
            var a = e.split('=');
            p[ decodeURIComponent(a[0])] = decodeURIComponent(a[1]);
            return p;
        },
        {}
    );
    //console.log(params['search']);

    

    setTimeout(async () => {
      
      const filteredList = [];
      for (const nft of this.unfilteredNftList) {
        let nftData = (await this.offchain.getNftData(nft.id));
        let nftOwner = await this.nft.owner(nft.id);

        let description = nftData['description'].toLowerCase();
        let name = nftData['name'].toLowerCase();
        let address = nftOwner['address'].toLowerCase();
        let network = nftOwner['network'].toLowerCase();

        let search = params['search'].toLowerCase();

        if(description.match(search) || name.match(search) || address.match(search) || network.match(search) ){
          filteredList.push(nft);
        }
      }

      this.nftList = filteredList;
      this.newFilteredList = filteredList;
      this.loading = false;
      this.searchReady = true;
    }, 200);
  }

  private getNetworkData(network: Network): { name: string; prefix: string } {
    if (network === Network.ETH) {
      return {
        name: 'Ethereum',
        prefix: 'https://etherscan.io/address/',
      };
    } else if (network === Network.MATIC) {
      return {
        name: 'Matic',
        prefix: 'https://explorer-mainnet.maticvigil.com/address/',
      };
    } else {
      return {
        name: 'Invalid',
        prefix: '#',
      };
    }
  }
}
