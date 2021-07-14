import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { WalletService } from 'src/app/services/wallet.service';
import bcrypt from 'bcryptjs';

@Component({
  selector: 'app-private-sale',
  templateUrl: './private-sale.component.html',
  styleUrls: ['./private-sale.component.scss'],
})
export class PrivateSaleComponent implements OnInit {
  constructor(
    public router: Router,
    private readonly wallet: WalletService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ethBalance = '0';
  digiBalance = '0';
  estimatedEth = '0';
  estimatedDigi = '0';

  loading: boolean = false;
  digiTokenAddress;
  digiPublicSaleAddress;

  /* accessGranted = false;
  passwordHash = '$2a$10$iOxf2wnh0MGdV5uc4caYq.tnnRICrp2nWBFm1Pu/RTiL8FtfTFNpK'; */

  account: string;

  tokensPerEth = 81666;

  ethInputValue: number;
  digiInputValue: number;

  address;

  ngOnInit(): void {
    this.wallet.init();

    this.loadData();
    this.wallet.getAccount().then((address) => {
      this.address = address;
    });
  }

  async connectWallet(): Promise<void> {
    this.address = await this.wallet.connectWithMetamask();
    this.account = this.address;
  }

  async loadData() {
    this.digiTokenAddress = this.wallet.digiTokenAddress;
    this.digiPublicSaleAddress = this.wallet.digiPublicSaleAddress;
    this.account = await this.wallet.getAccount();
    this.address = this.account;

    if (this.account) {
      this.ethBalance = parseFloat(await this.wallet.getBalance()).toFixed(4);

      this.digiBalance = parseFloat(
        await this.wallet
          .getWeb3()
          .utils.fromWei(
            await this.wallet.tokenBalance(this.wallet.digiTokenAddress),
            'ether'
          )
      ).toFixed(4);

      this.estimatedEth = (
        parseFloat(this.digiBalance) / this.tokensPerEth
      ).toFixed(4);

      this.estimatedDigi = (
        parseFloat(this.ethBalance) * this.tokensPerEth
      ).toFixed(4);
    }
    this.cdr.detectChanges();
  }

  async buy(): Promise<void> {
    const networkId = await this.wallet.getWeb3().eth.net.getId();

    if (networkId != 1) {
      alert('Change to Ethereum Network');
      return;
    }

    if (this.account) {
      this.loading = true;

      try {
        await this.wallet.getWeb3().eth.sendTransaction({
          from: this.account,
          to: this.wallet.digiPublicSaleAddress,
          value: this.wallet
            .getWeb3()
            .utils.toWei(this.ethInputValue.toString(), 'ether'),
        });
      } catch (e) {
        console.error(e);
      }

      this.loading = false;
      this.loadData();
    }
  }

  onEthInputChange(ethAmount: number): void {
    this.ethInputValue = ethAmount;
    this.digiInputValue = ethAmount * this.tokensPerEth;
  }

  onDigiInputChange(digiAmount: number): void {
    this.digiInputValue = digiAmount;
    this.ethInputValue = digiAmount / this.tokensPerEth;
  }

  /* async checkPrivateSalePassword(password: string) {
    const result = bcrypt.compareSync(password, this.passwordHash);

    if (result) {
      this.accessGranted = true;
    } else {
      alert('Incorrect Password!');
    }
  } */
}
