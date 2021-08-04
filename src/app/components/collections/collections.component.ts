import { Component, OnInit } from '@angular/core';
import { NftService } from 'src/app/services/nft.service';
import { OffchainService } from 'src/app/services/offchain.service';
import { DigiCard } from 'src/app/types/digi-card.types';
import { Network } from 'src/app/types/network.enum';
import { VerifiedWalletsService } from 'src/app/services/verified-wallets.service';
@Component({
  selector: 'app-search',
  templateUrl: './collections.component.html',
  styleUrls: ['./collections.component.scss'],
})
export class CollectionsComponent implements OnInit {
  searchReady = false;
  nftList: DigiCard[] = null;
  nftCollectionList: DigiCard[] = null;
  unfilteredNftList: DigiCard[] = null;
  newFilteredList = [];
  currentOffset = 0;
  endReached = false;
  typeSearch = 'ALL';
  collectionsCard = [];
  leaders = [];

  readonly limit = 10005;

  constructor(
    private readonly nft: NftService,
    private readonly offchain: OffchainService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  async loadData(): Promise<void> {
    this.currentOffset = 0;
    this.endReached = false;
    this.nftList = await this.nft.getNewNfts(this.limit, 0);
    this.unfilteredNftList = this.nftList;
    console.log(this.unfilteredNftList);

    this.getCollection();
  }

  getCollection() {
    var wallets = new VerifiedWalletsService();
    var walletsArr = wallets.verifiedProfiles;
    var result = Object.keys(walletsArr).map((key) => [
      String(key),
      walletsArr[key],
    ]);

    for (var i = 0; i < result.length; i++) {
      var name = result[i][1];
      this.loadNFTs(result[i][0], i, result.length, name['username']);
    }
  }

  async loadNFTs(address, i, len, name): Promise<void> {
    let maticNfts = [];
    try {
      maticNfts = await this.nft.myNFTs(address, true);
    } catch (e) {
      console.error(e);
    }
    var myCards = [];
    myCards['username'] = name;
    myCards['cards'] = [...(await this.nft.myNFTs(address)), ...maticNfts];
    this.collectionsCard.push(myCards);
    if (i == len - 1) {
      this.handleInput();
    }
  }

  handleInput() {
    this.searchReady = false;
    setTimeout(async () => {
      var i = 0;
      for (const col of this.collectionsCard) {
        var cards = col['cards'];
        this.leaders.push({
          username: col['username'],
          countNFT: cards.length,
          link: '/profile/' + col['username'],
        });
        this.leaders.sort((a, b) => (a.countNFT > b.countNFT ? -1 : 1));
        i++;
      }
      this.leaders = this.leaders.slice(0, 10);
      console.log(this.leaders);
    }, 200);

    /* setTimeout(async () => {
      
      let nftData = [];
      let nftOld = [];
      nftOld['cards'] = [];
      for (const col of this.collectionsCard) {
        var cards = col['cards'];
        nftData[col['username']] = [];
          for(var j = 0; j < cards.length; j++){
            var cardID = cards[j]['id'];
            nftData[col['username']][j] = (await this.offchain.getNftData(cardID));
          }        
      }
      nftData = Object.entries(nftData);
      var datas = [];
      for(var k=0; k < nftData.length; k++){
        if(nftData[k][1].length != 0){
          datas.push(nftData[k]);
        }
      }
      this.nftList = datas;
      
    }, 200); */
    this.loading();
  }

  loading() {
    setTimeout(async () => {
      this.searchReady = true;
    }, 1500);
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
