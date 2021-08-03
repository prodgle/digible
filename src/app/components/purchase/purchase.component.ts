import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { NftService } from 'src/app/services/nft.service';
import { OffchainService } from 'src/app/services/offchain.service';
import { DigiCard } from 'src/app/types/digi-card.types';
import { VerifiedWalletsService } from 'src/app/services/verified-wallets.service';
import { MarketplaceService } from 'src/app/services/marketplace.service';
import { MaticService } from 'src/app/services/matic.service';
import { TokensService } from 'src/app/services/tokens.service';
import { MathService } from '../../services/math.service';
import { WalletService } from '../../services/wallet.service';
import { Network } from '../../types/network.enum';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from 'src/environments/environment';
@Component({
  selector: 'app-newest',
  templateUrl: './purchase.component.html',
  styleUrls: ['./purchase.component.scss'],
})
export class PurchaseComponent implements OnInit {
  static nftListCached: DigiCard[] = null;
  static lastOffset = 0;

  static cacheUntil: Date = null;
  stableBalance = '...';
  digiBalance = '...';
  listUsers = [];
  digi = '';
  stable = '';
  nftList: DigiCard[] = null;
  unfilteredNftList: DigiCard[] = null;
  currentOffset = 0;
  loading = false;
  endReached = false;
  typeFilter = 'ALL';
  searchReady = false;
  readonly limit = 12;

  constructor(
    private readonly nft: NftService,
    private readonly offchain: OffchainService,
    private readonly route: ActivatedRoute,
    private readonly walletService: WalletService,
    private readonly math: MathService,
    private readonly cdr: ChangeDetectorRef,
    private readonly tokens: TokensService,
    private readonly verifieds: VerifiedWalletsService,
    private readonly router: Router,
    private readonly matic: MaticService,
    private readonly marketplace: MarketplaceService,
    
  ) {}

  ngOnInit(): void {
    //this.loadData();
    this.getCollection();
  }

  getCollection(){
    var wallets = new VerifiedWalletsService();
    var walletsArr = wallets.verifiedProfiles;
    this.listUsers = Object.keys(walletsArr).map((key) => [String(key), walletsArr[key]]);
    for(var i=0; i < this.listUsers.length ; i++){
      this.loadBalances(i);
    }
  }

  sortArr(){
    this.listUsers.sort((a, b) => {
      
        if (a[1].digible < b[1].digible) {
          return 1;
        }

        if (a[1].digible > b[1].digible) {
          return -1;
        }

        return 0;
      });
      
      this.searchReady = true;
  }
  
  loadBalances(i){
    var bal = this.nft.digiBalance(this.listUsers[i][0], true);
    var list = this.listUsers[i][1];
    bal.then((balance) => {
      list.digible = this.math.toHumanValue(balance + '', 18) + '';
      list.link = "/profile/"+this.listUsers[i][0];
      if(i == (this.listUsers.length - 1)){
        setTimeout(async () => {
          this.sortArr();
        }, 500);
      }
    })
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
    myCards['cards'] = [...await this.nft.myNFTs(address), ...maticNfts]
  
  }

  async loadData(): Promise<void> {
    if (
      PurchaseComponent.cacheUntil > new Date() &&
      PurchaseComponent.nftListCached
    ) {
      this.nftList = PurchaseComponent.nftListCached;
      this.currentOffset = PurchaseComponent.lastOffset;
      this.unfilteredNftList = this.nftList;
      return;
    }
    this.currentOffset = 0;
    this.endReached = false;
    this.nftList = await this.nft.getNewNfts(this.limit, 0);
    this.setCache();
    this.unfilteredNftList = this.nftList;

    this.getCollection();
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
  
  connectMatic(): void{
    if (environment.testnet) {
      window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: '80001',
            chainName: 'Matic Testnet',
            nativeCurrency: {
              name: 'MATIC',
              symbol: 'MATIC',
              decimals: 18,
            },
            rpcUrls: ['https://rpc-mumbai.maticvigil.com/'],
          },
        ],
      });
    } else {
      window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: '0x89',
            chainName: 'Matic',
            nativeCurrency: {
              name: 'MATIC',
              symbol: 'MATIC',
              decimals: 18,
            },
            rpcUrls: ['https://rpc-mainnet.maticvigil.com/'],
          },
        ],
      });
    }
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
    PurchaseComponent.nftListCached = this.nftList;
    PurchaseComponent.lastOffset = this.currentOffset;
    const date = new Date();
    date.setMinutes(date.getMinutes() + 30);
    PurchaseComponent.cacheUntil = date;
  }
}
