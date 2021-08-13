import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MarketplaceService } from 'src/app/services/marketplace.service';
import { MaticService } from 'src/app/services/matic.service';
import { TokensService } from 'src/app/services/tokens.service';
import { VerifiedWalletsService } from 'src/app/services/verified-wallets.service';
import { MarketCard } from 'src/app/types/market-card.types';
import { Profile } from 'src/app/types/profile.type';
import { environment } from 'src/environments/environment';
import { MathService } from '../../services/math.service';
import { NftService } from '../../services/nft.service';
import { WalletService } from '../../services/wallet.service';
import { DigiCard } from '../../types/digi-card.types';
import { Network } from '../../types/network.enum';
import { PendingDigiCard } from '../../types/pending-digi-card.types';
import { OffchainService } from 'src/app/services/offchain.service';
import {
  NgxFileDropEntry,
  FileSystemFileEntry,
  FileSystemDirectoryEntry,
} from 'ngx-file-drop';
import { Console } from 'node:console';



@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {

  @ViewChild('addTokenModal') addTokenModal: ElementRef;

  address;
  displayAddress;
  profile: Profile;
  myCards: DigiCard[];
  otherNfts: MarketCard[];
  pendingAuctions: PendingDigiCard[];
  pendingTransfersFromMatic = [];
  network;
  stableSymbol = environment.stableCoinSymbol;
  digiBalance = '...';
  stableBalance = '...';
  canMint = false;
  isYourProfile = false;
  loading = false;
  activityHistory = null;
  loadFiles;
  tokenName;
  inputAddress;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly walletService: WalletService,
    private readonly nft: NftService,
    private readonly math: MathService,
    private readonly cdr: ChangeDetectorRef,
    private readonly tokens: TokensService,
    private readonly verifieds: VerifiedWalletsService,
    private readonly router: Router,
    private readonly matic: MaticService,
    private readonly marketplace: MarketplaceService,
    private readonly offChain: OffchainService,
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(queryParams => {
      const verifiedAddress = this.verifieds.getVerifiedProfile(queryParams.address);
      if (verifiedAddress) {
        this.address = verifiedAddress;
        this.displayAddress = this.truncate(verifiedAddress, 15, '...');
      } else {
        if (!this.walletService.getWeb3().utils.isAddress(queryParams.address)) {
          this.router.navigate(['/auctions']);
          return;
        }
        this.address = queryParams.address;
        this.displayAddress = this.truncate(queryParams.address, 15, '...');
      }
      this.loadData();
    });
    if (window.ethereum) {
      window.ethereum.on('networkChanged', () => {
        this.loadData();
      });
    }

    this.nft.canMint().then((canMint) => {
      this.canMint = canMint;
    });
  }

  
  async dropped(files: NgxFileDropEntry[]): Promise<void> {
    if (files.length === 0) {
      return;
    }
    this.loadFiles = files;
    this.updateProfile();
  }
  
 async updateProfile(): Promise<void> {

    const droppedFile = this.loadFiles[0];
    //console.log(droppedFile);
    if (droppedFile.fileEntry.isFile) {
      const fileEntry = droppedFile.fileEntry as FileSystemFileEntry;
      fileEntry.file(async (file: File) => {
        this.loading = true;
        try {
            const signature = '0x49c92d11f1cbb03e808d51982140a7b77eae92aac8ab453b44333715a5b471760b175f7112ff6be10a17bcc731024e456762affc3bd510256c758f7720007a7f1c';
            const ipfs = await this.offChain.uploadFile(
                signature,
                file,
                droppedFile.relativePath
            );
            //console.log(ipfs.uri);
            await this.verifieds.updProfileData(this.address, ipfs.uri);
            window.location.reload();
        } catch (e) {
            alert('error: '+e);
        }

        this.loading = false;
      });
    }
  }  

  async loadData(){
    this.profile = await this.verifieds.getFullProfile(this.address);
    this.myCards = null;
    this.otherNfts = null;
    this.pendingAuctions = null;
    this.digiBalance = '...';
    this.stableBalance = '...';
    this.activityHistory = null;
    this.isYourProfile = false;
    this.checkYourProfile();
    this.checkNetwork();
    this.loadNFTs();
    this.loadOtherNFTs();
    this.loadBalances();
    this.matic.connectPOSClient();
    this.loadPendingTransfersFromMatic();
    this.loadActivityHistory();
  }

 
  truncate (fullStr, strLen, separator) {
    if (fullStr.length <= strLen) return fullStr;

    separator = separator || '...';

    var sepLen = separator.length,
        charsToShow = strLen - sepLen,
        frontChars = Math.ceil(charsToShow/2),
        backChars = Math.floor(charsToShow/2);

    return fullStr.substr(0, frontChars) + 
           separator + 
           fullStr.substr(fullStr.length - backChars);
};

  async loadActivityHistory(): Promise<void> {
    const lastBuys = (await this.marketplace.lastBuys(this.address, 5)).map((bid: any) => {
      bid.action = 'buy';
      return bid;
    });

    lastBuys.map((buy) => {
      buy.isDigi = buy.tokenAddress.toLowerCase() === environment.nftAddress.toLowerCase();
    });

    const lastBids = (await this.nft.getLastBidsByUser(this.address, 5)).map((bid: any) => {
      bid.action = 'bid';
      return bid;
    });

    let lastBuyNows = [];

    try {
      lastBuyNows = (await this.nft.getLastAuctionBuyNowsByAddress(this.address, 5)).map((bid: any) => {
        bid.action = 'buy';
        bid.isDigi = true;
        return bid;
      });
    } catch (e) {

    }

    lastBids.map(async (bid) => {
      bid.isDigi = true;
      bid.tokenId = (await this.nft.getAuctionById(bid.auctionId)).tokenId;
    });

    this.activityHistory = [
      ...lastBids,
      ...lastBuys,
      ...lastBuyNows
    ].sort((a, b) => a.created > b.created && -1 || 1);
    this.cdr.detectChanges();
  }

  async checkYourProfile(): Promise<void> {
    this.isYourProfile = this.address.toLowerCase() === (await this.walletService.getAccount()).toLowerCase();
    if (this.isYourProfile) {
      this.loadPendingAuctions();
    }
  }

  async loadPendingAuctions(): Promise<void> {
    this.pendingAuctions = await this.nft.pendingAuctions(30);
    this.cdr.detectChanges();
  }

  async loadOtherNFTs(): Promise<void> {
    for (const address of this.tokens.getTokenAddresses()) {
      const nfts = await this.nft.myExternalNFTs(address);
      if (this.otherNfts === null) {
        this.otherNfts = nfts;
      } else {
        this.otherNfts = [...this.otherNfts, ...nfts];
      }
    }
    if (this.otherNfts === null) {
      this.otherNfts = [];
    }
  }

  async loadNFTs(): Promise<void> {
    let maticNfts = [];
    try {
      maticNfts = await this.nft.myNFTs(this.address, true);
    } catch (e) {
      console.error(e);
    }
    this.myCards = [...await this.nft.myNFTs(this.address), ...maticNfts];
  }

  async onChangeInputAddress(): Promise<void> {
    this.tokenName = null;
    if (!this.walletService.getWeb3().utils.isAddress(this.inputAddress)) {
      console.log('Invalid address');
      return;
    }

    this.tokenName = '...';
    this.tokenName = await this.nft.getExternalNftName(this.inputAddress);
  }

  async addToken(): Promise<void> {
    if (this.tokenName && this.tokenName !== '...') {
      this.tokens.addToken(this.inputAddress);
      this.addTokenModal.nativeElement.click();
      this.loadData();
      return;
    }
  }

  async loadBalances(): Promise<void> {
    let readOnly = false;
    if (await this.walletService.getNetwork() === Network.UNSUPPORTED) {
      readOnly = true;
    }
    this.nft.digiBalance(this.address, readOnly).then((balance) => {
      
      this.digiBalance = this.math.toHumanValue(balance + '', 18) + '';
      
      this.cdr.detectChanges();
    });
    this.nft.stableBalance(this.address, readOnly).then((balance) => {
      this.stableBalance = this.math.toHumanValue(balance + '') + '';
      this.cdr.detectChanges();
    });
  }

  loadPendingTransfersFromMatic(): void {
    this.pendingTransfersFromMatic = this.matic.loadTransferHash();
  }

  async completeTransferFromMatic(hash: string): Promise<void> {
    this.loading = true;

    await this.matic.claimTransferredFromMatic(hash);
    this.loadPendingTransfersFromMatic();
    // TODO: Refresh?

    this.loading = false;
  }
  async cancel(auctionId: number): Promise<void> {
    if ((await this.walletService.getNetwork()) !== Network.MATIC) {
      this.switchToMatic();
      return;
    }
    this.loading = true;
    try {
      await this.nft.cancel(auctionId);
    } catch (e) {

    }
    this.loading = false;
    this.loadData();
  }

  async claim(auctionId: number): Promise<void> {
    if ((await this.walletService.getNetwork()) !== Network.MATIC) {
      this.switchToMatic();
      return;
    }
    this.loading = true;
    try {
      await this.nft.claim(auctionId);
    } catch (e) {

    }
    this.loading = false;
    this.loadData();
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

  switchToMatic(): void {
    this.walletService.switchToMatic();
  }
}
