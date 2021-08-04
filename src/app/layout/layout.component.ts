import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { NftService } from '../services/nft.service';
import { WalletService } from '../services/wallet.service';
import { Network } from '../types/network.enum';
import { DigiCard } from 'src/app/types/digi-card.types';
import { OffchainService } from 'src/app/services/offchain.service';
import { Event } from '@angular/router';
const innerHeight = require('ios-inner-height');

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent implements OnInit {
  nftList: DigiCard[] = null;
  unfilteredNftList: DigiCard[] = null;

  address;
  routeName;
  network;
  currentTime;
  inputNftName;
  hideNetwork = false;
  canMint = false;
  mobileNavIcon = null;
  hideCreateButton = false;
  routesToHideButton = [];
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
    this.toggleTheme();
    this.applyHeaderClass();
    window.onscroll = () => {
      this.applyHeaderClass();
    };

    this.routesToHideButton = ['/stake', '/purchase', '/profile', '/create'];

    this.checkIfNeedToHideCreateButton(this.router.url);

    this.router.events.subscribe((event: Event) => {
      if (event instanceof NavigationStart) {
        this.checkIfNeedToHideCreateButton(event.url);
      }
    });

    if (this.router.url === '/private-sale' || this.router.url === '/sale') {
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

  changeOfRoutes () {
    this.routeName = this.router.url.replace(/^\/+/g, '').replace(/-/g, " ").split('/')[0].split('?')[0];
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
    console.log('called');
    this.isMenuOpened = !this.isMenuOpened;
  }

  async connectWallet(): Promise<void> {
    this.address = await this.walletService.connectWithMetamask();
  }

  findResult(e) {
    if (e.code == 'Enter') {
      const inputValue = (
        document.getElementById('searchInp') as HTMLInputElement
      ).value;
      document.location.href = '/search?search=' + inputValue;
    }
  }

  findMobileResult(e) {
    const mobInpValue = (
      document.getElementById('searchInpMob') as HTMLInputElement
    ).value;
    document.location.href = '/search?search=' + mobInpValue;
  }

  isIos() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(userAgent);
  }

  iosBarNavFix() {
    /* if(('standalone' in window.navigator) && (window.navigator.standalone)) {
      return
    } */
    if (innerHeight() > window.innerHeight) {
      // iOS bottom bar is present
      document.body.classList.add('ios-bar--active');
    } else {
      // iOS bottom bar is NOT present so show footer
      document.body.classList.remove('ios-bar--active');
    }
  }

  mobileMenuToggle() {
    const body = document.body;
    const mq = window.matchMedia('(max-width: 768px)');

    if (!mq.matches) {
      return;
    }
    
    if (body.classList.contains('c-mobile__nav--active')) {
      body.classList.remove('c-mobile__nav--active');
      body.classList.add('c-mobile__nav--in-active');
    } else {
      body.classList.add('c-mobile__nav--active');
      body.classList.remove('c-mobile__nav--in-active');
    }
  }

  applyHeaderClass() {
    const body = document.body;
    if (body.scrollTop > 120 || document.documentElement.scrollTop > 120) {
      if (!body.classList.contains('c-header--active')) {
        body.classList.add('c-header--active');
      }
    } else {
      body.classList.remove('c-header--active');
    }
  }

  toggleTheme() {
    const toggleSwitch = document.querySelector(
      '.theme-switch input[type="checkbox"]'
    ) as HTMLInputElement;
    const currentTheme = localStorage.getItem('theme');

    if (currentTheme) {
      document.body.classList.add(`${currentTheme}-mode`);

      if (currentTheme === 'dark') {
        toggleSwitch.checked = true;
      }
    }

    function switchTheme(e) {
      if (e.target.checked) {
        document.body.classList.add('dark-mode');
        console.log('set dark');
        localStorage.setItem('theme', 'dark');
        console.log(localStorage.getItem('theme'));
      } else {
        console.log('set light');
        document.body.classList.remove('dark-mode');
        localStorage.setItem('theme', 'light');
        console.log(localStorage.getItem('theme'));
      }
    }
    toggleSwitch.addEventListener('change', switchTheme, false);
  }

  checkIfNeedToHideCreateButton(url): void {
    for (const [key, value] of this.routesToHideButton) {
      if (url.match(value)) {
        this.hideCreateButton = true;
        break;
      } else {
        this.hideCreateButton = false;
      }
    }
  }
}
