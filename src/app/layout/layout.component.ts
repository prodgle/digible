import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { NftService } from '../services/nft.service';
import { WalletService } from '../services/wallet.service';
import { Network } from '../types/network.enum';
import { DigiCard } from 'src/app/types/digi-card.types';
import { OffchainService } from 'src/app/services/offchain.service';
import { NewestComponent } from 'src/app/components/newest/newest.component'

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent implements OnInit{
  nftList: DigiCard[] = null;
  unfilteredNftList: DigiCard[] = null;
  
  address;
  network;
  currentTime;
  inputNftName;
  hideNetwork = false;
  canMint = false;
  testnet = environment.testnet;
  isMenuOpened: boolean | null = null;
  newest = false;
  readonly limit = 12;

  constructor(
    private readonly walletService: WalletService,
    private readonly cdr: ChangeDetectorRef,
    private readonly nft: NftService,
    public router: Router,
    private readonly offchain: OffchainService
  ) {}

  ngOnInit(): void {
    this.walletService.init();
    

    if (this.router.url == '/private-sale' || this.router.url == '/sale') {
      this.hideNetwork = true;
    }

    this.walletService.getAccount().then((account) => {
      this.address = account;
    });

    this.nft.canMint().then((canMint) => {
      this.canMint = canMint;
    });

    this.checkNetwork();

    this.currentTime = new Date().toLocaleString();
    
    if (window.ethereum) {
      window.ethereum.on('networkChanged', () => {
        this.checkNetwork();
      });
    }
    if (window.innerWidth < 500) {
      this.isMenuOpened = false;
    }
  }

  async checkNetwork(): Promise<void> {
    this.walletService.getNetwork().then((network: Network) => {
      if (network === Network.ETH) {
        this.network = 'Ethereum';
      } else if (network === Network.MATIC) {
        this.network = 'Matic';
      } else {
        this.network = 'Invalid';
      }
      this.cdr.detectChanges();
    });
  }

  async loadData(): Promise<void> {
    this.nftList = await this.nft.getNewNfts(100, 0);
    this.unfilteredNftList = this.nftList;
    
  }

  onChangeInput(): void {
    // ToDo: Do anithing with the input data (this.inputNftName);
  }

  toggleMenu(): void {
    this.isMenuOpened = !this.isMenuOpened;
  }

  async connectWallet(): Promise<void> {
    this.address = await this.walletService.connectWithMetamask();
  }

  menuCheck(e){
    var menu = document.getElementById("mobMenu");
    var menuOpened = document.getElementById("btnLeft");
    var opened = menuOpened.getAttribute("opened");
    console.log(opened);
    if(opened == 'false'){
      menu.style.display = "grid";
      menuOpened.setAttribute("opened", "true");  
    }else{
      menu.style.display = "none";
      menuOpened.setAttribute("opened", "false");
    }
    
    
  }
  findResult(e){
    if(e.code == "Enter"){
      var inputValue = (<HTMLInputElement>document.getElementById('searchInp')).value;
      document.location.href = "/search?search="+inputValue;
    }
  }
}
