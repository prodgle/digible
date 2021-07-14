import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { WalletService } from '../../services/wallet.service';
import { Network } from '../../types/network.enum';
import { OffchainService } from '../../services/offchain.service';
import { NftService } from '../../services/nft.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {

  showSwitchToEth = false;

  address;

  loading = false;
  minter: boolean = null;
  minterMatic: boolean = null;

  constructor(
    private readonly wallet: WalletService,
    private readonly cdr: ChangeDetectorRef,
    private readonly offchain: OffchainService,
    private readonly nft: NftService,
    private readonly router: Router,
  ) { }

  ngOnInit(): void {
    this.checkIfAdmin();
    this.checkNetwork();
    if (window.ethereum) {
      window.ethereum.on('networkChanged', () => {
        this.checkNetwork();
      });
    }
  }

  async checkIfAdmin(): Promise<void> {
    this.loading = true;
    if (!(await this.wallet.getAccount()) || !await this.nft.isAdmin()) {
      this.router.navigate(['/']);
      return;
    }
    this.loading = false;
  }

  async revoke(matic?: boolean): Promise<void> {
    if (matic && await this.wallet.getNetwork() !== Network.MATIC) {
      alert('Connect to matic chain');
      return;
    } else if (!matic && await this.wallet.getNetwork() !== Network.ETH) {
      alert('Connect to eth chain');
      return;
    }
    this.loading = true;
    try {
      await this.nft.revokeMinterRole(this.address);
      this.onChangeInputAddress();
    } catch (e) {
      console.error(e);
    }
    this.loading = false;
  }

  async grantMinter(matic?: boolean): Promise<void> {
    if (matic && await this.wallet.getNetwork() !== Network.MATIC) {
      alert('Connect to matic chain');
      return;
    } else if (!matic && await this.wallet.getNetwork() !== Network.ETH) {
      alert('Connect to eth chain');
      return;
    }
    this.loading = true;
    try {
      await this.nft.grantMinterRole(this.address);
      this.onChangeInputAddress();
    } catch (e) {
      console.error(e);
    }
    this.loading = false;
  }

  async onChangeInputAddress(): Promise<void> {
    setTimeout(async () => {
      this.minter = null;
      if (!this.wallet.getWeb3().utils.isAddress(this.address)) {
        console.log('Invalid address');
        return;
      }
      this.minter = await this.nft.canMint(this.address);
      this.minterMatic = await this.nft.canMint(this.address, true);
    }, 200);
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
