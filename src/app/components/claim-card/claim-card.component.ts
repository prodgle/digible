import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { WalletService } from '../../services/wallet.service';
import { Network } from '../../types/network.enum';
import { OffchainService } from '../../services/offchain.service';
import { NftService } from '../../services/nft.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-claim-card',
  templateUrl: './claim-card.component.html',
  styleUrls: ['./claim-card.component.scss'],
})
export class ClaimCardComponent implements OnInit {
  showSwitchToEth = false;
  id;

  address;
  email;

  loading = false;
  burned = false;
  claimed = false;

  constructor(
    private readonly wallet: WalletService,
    private readonly cdr: ChangeDetectorRef,
    private readonly offchain: OffchainService,
    private readonly nft: NftService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((queryParams) => {
      this.id = queryParams.id;
      this.loadData();
      this.claimed = localStorage.getItem('is_claimed_' + this.id) === '1';
    });
  }

  async loadData(): Promise<void> {
    this.burned =
      (await (await this.nft.owner(this.id)).address) ===
      '0x000000000000000000000000000000000000dEaD';
  }

  async burn(): Promise<void> {
    if (!confirm('WARNING! Only burn the card if you already confirmed the shipment information via email.')) {
      return;
    }
    this.loading = true;
    const owner = await this.nft.owner(this.id);
    if (owner.network === Network.ETH && await this.wallet.getNetwork() !== Network.ETH) {
      alert('Connect to eth network first!');
      this.loading = false;
      return;
    }
    if (owner.network === Network.MATIC && await this.wallet.getNetwork() !== Network.MATIC) {
      alert('Connect to Matic network first!');
      this.loading = false;
      return;
    }
    try {
      await this.nft.transfer(
        this.id,
        '0x000000000000000000000000000000000000dEaD'
      );
      alert('Your card has been burned!');
      this.router.navigate(['/']);
    } catch (e) {}
    this.loading = false;
  }

  async claim(): Promise<void> {
    this.loading = true;
    try {
      await this.offchain.claimCard(
        await this.sign(),
        this.email,
        this.address,
        this.id
      );
      alert('You claimed your card. You will receive an email soon!');
      localStorage.setItem('is_claimed_' + this.id, '1');
      this.claimed = true;
    } catch (e) {
      console.error(e);
      alert('Error claiming. Try again in a few minutes.');
    }
    this.loading = false;
  }

  async sign(): Promise<string> {
    return await this.wallet.signMessage(
      'Digible - ' + this.id + ' - ' + this.email + ' - ' + this.address
    );
  }
}
