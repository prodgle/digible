import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { WalletService } from '../../services/wallet.service';
import { Network } from '../../types/network.enum';
import {
  NgxFileDropEntry,
  FileSystemFileEntry,
  FileSystemDirectoryEntry,
} from 'ngx-file-drop';
import { OffchainService } from '../../services/offchain.service';
import { NftService } from '../../services/nft.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-create-card',
  templateUrl: './create-card.component.html',
  styleUrls: ['./create-card.component.scss'],
})
export class CreateCardComponent implements OnInit {
  showSwitchToEth = false;
  ipfsHash;
  ipfsUri;
  isVideo;

  walletReceiver;
  cardName;
  physical;
  cardPublisher;
  cardEdition;
  cardYear;
  cardGraded;
  cardPopulation;

  loading = false;

  constructor(
    private readonly wallet: WalletService,
    private readonly cdr: ChangeDetectorRef,
    private readonly offchain: OffchainService,
    private readonly nft: NftService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.checkNetwork();
    if (window.ethereum) {
      window.ethereum.on('networkChanged', () => {
        this.checkNetwork();
      });
    }
  }

  async create(): Promise<void> {
    try {
      await this.nft.mint(
        this.walletReceiver,
        this.cardName,
        this.ipfsHash,
        this.physical
      );
      
      this.router.navigate(['/newest']);
    } catch (e) {}
    this.loading = false;
  }

  async dropped(files: NgxFileDropEntry[]): Promise<void> {
    if (files.length === 0) {
      return;
    }
    const droppedFile = files[0];
    if (droppedFile.fileEntry.isFile) {
      const fileEntry = droppedFile.fileEntry as FileSystemFileEntry;
      fileEntry.file(async (file: File) => {
        
        this.loading = true;
        try {
         const signature = await this.sign();
         
         const ipfs = await this.offchain.uploadFile(
           signature,
           file,
           droppedFile.relativePath
         );
         
          this.ipfsHash = ipfs.hash;
          this.isVideo = await this.offchain.isVideo(ipfs.uri);
          this.ipfsUri = ipfs.uri;
          this.walletReceiver = await this.wallet.getAccount();
        } catch (e) {}

        this.loading = false;
      });
    }
  }

  async sign(): Promise<string> {
    return await this.wallet.signMessage('Digible');
  }

  async checkNetwork(): Promise<void> {
    const network = await this.wallet.getNetwork();
    if (network !== Network.ETH) {
      this.showSwitchToEth = true;
    } else {
      this.showSwitchToEth = false;
    }
    this.cdr.detectChanges();
  }
}
