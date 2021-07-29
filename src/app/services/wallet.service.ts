import { EventEmitter, Injectable, Output } from '@angular/core';
import { environment } from 'src/environments/environment';
import Web3 from 'web3';
import { Network } from '../types/network.enum';

declare global {
  interface Window {
    ethereum: any;
  }
}

@Injectable({
  providedIn: 'root',
})
export class WalletService {
  web3;
  web3Infura;
  web3InfuraMatic;
  provider;

  digiTokenAddress = '0x3cbf23c081faa5419810ce0f6bc1ecb73006d848';
  digiPublicSaleAddress = '0xabe5df074162904842e899a9119e72baef04c64d';

  constructor() {
    this.provider = window['ethereum'];
    this.web3 = new Web3(window['ethereum']);
  }

  @Output() loginEvent = new EventEmitter<void>();

  init(): void {
    if (window.ethereum) {
      this.web3 = new Web3(window.ethereum);
    }
  }

  async tokenBalance(token: string): Promise<string> {
    const account = await this.getAccount();
    const erc20Abi = require('./erc20abi.json');
    const erc20Token = new (this.getWeb3().eth.Contract)(erc20Abi, token);

    return await erc20Token.methods.balanceOf(account).call();
  }

  isMetamaskInstalled(): boolean {
    if (window.ethereum) {
      return true;
    }
    return false;
  }

  getWeb3(): any {
    if (!this.web3) {
      throw new Error('Call init() first and make sure metamask is installed');
    }
    return this.web3;
  }

  getMaticInfuraWeb3(): any {
    if (!this.web3InfuraMatic) {
      let provider = 'https://polygon-mumbai.infura.io/v3/34d8dfc0582a4ed2942bde94f39a0a1e';
      if (!environment.testnet) {
        provider = 'https://polygon-mainnet.infura.io/v3/34d8dfc0582a4ed2942bde94f39a0a1e';
      }
      this.web3InfuraMatic = new Web3(
        new Web3.providers.HttpProvider(provider)
      );
    }
    return this.web3InfuraMatic;
  }

  getInfuraWeb3(): any {
    if (!this.web3Infura) {
      let prefix = 'mainnet';
      if (environment.testnet) {
        prefix = 'goerli';
      }
      this.web3Infura = new Web3(
        new Web3.providers.HttpProvider(
          'https://' + prefix + '.infura.io/v3/' + environment.infuraId
        )
      );
    }
    return this.web3Infura;
  }

  async getNetwork(): Promise<Network> {
    const networkId = await this.getWeb3().eth.net.getId();

    if (!environment.testnet) {
      if (networkId === 1) {
        return Network.ETH;
      } else if (networkId === 137) {
        return Network.MATIC;
      }
      return Network.UNSUPPORTED;
    } else {
      if (networkId === 5) {
        return Network.ETH;
      } else if (networkId === 80001) {
        return Network.MATIC;
      }
      return Network.UNSUPPORTED;
    }
  }

  async signMessage(message: string): Promise<string> {
    return await this.getWeb3().eth.personal.sign(
      this.getWeb3().utils.fromUtf8(message),
      await this.getAccount()
    );
  }

  async switchToMatic(): Promise<void> {
    if (!window.ethereum) {
      return;
    }
    if (environment.testnet) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: '0x13881',
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
      await window.ethereum.request({
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

  async switchToEth(): Promise<void> {
    if (!window.ethereum) {
      return;
    }
    if (environment.testnet) {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [
          {
            chainId: '0x5',
          },
        ],
      });
    } else {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [
          {
            chainId: '0x1',
          },
        ],
      });
    }
  }

  async getBalance(account?: string): Promise<string> {
    if (!account) {
      account = await this.getAccount();
    }
    const data = await this.getWeb3().eth.getBalance(account);
    return this.web3.utils.fromWei(data, 'ether');
  }

  async getAccount(): Promise<string | null> {
    if (!this.web3) {
      return null;
    }
    const accounts = await this.getWeb3().eth.getAccounts();
    if (accounts.length === 0) {
      return null;
    }
    return accounts[0];
  }

  async connectWithMetamask(): Promise<string> {
    this.web3 = new Web3(window.ethereum);

    return new Promise((resolve, reject) => {
      window.ethereum.enable().then((account) => {
        if (account !== null) {
          resolve(account[0]);
        }

        reject('No accounts found');
      });
    });
  }
}
