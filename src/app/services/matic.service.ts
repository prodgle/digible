import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { NftService } from './nft.service';
import { WalletService } from './wallet.service';
import { MaticPOSClient } from '@maticnetwork/maticjs';
import { Network } from '../types/network.enum';
import BN from 'bn.js';

@Injectable()
export class MaticService {

    maticPOSClient;

    constructor(
        private readonly wallet: WalletService,
        private readonly nft: NftService,
        
    ) {
    }

    async connectPOSClient(): Promise<void> {
        this.maticPOSClient = new MaticPOSClient({
            network: (environment.testnet) ? 'testnet' : 'mainnet',
            version: (environment.testnet) ? 'mumbai' : 'v1',
            parentProvider: (await this.wallet.getNetwork() === Network.ETH) ? this.wallet.provider : this.wallet.getInfuraWeb3(),
            maticProvider: (await this.wallet.getNetwork() === Network.ETH) ? this.wallet.getMaticInfuraWeb3() : this.wallet.provider
        });
    }

    async sendToMatic(tokenId: number): Promise<void> {
        const depositData = this.wallet.getWeb3().eth.abi.encodeParameter('uint256', this.encodeInt(tokenId));
        await (await this.getMaticContract()).methods.depositFor(
            await this.wallet.getAccount(),
            await this.nft.getNftAddress(),
            depositData,
        ).send({from: await this.wallet.getAccount()});
    }

    async sendToEthereum(tokenId: number): Promise<void> {
        const response = await this.maticPOSClient.burnERC721(
            environment.nftAddressMatic,
            tokenId,
            { from: await this.wallet.getAccount() }
        );

        this.saveTransferHash(tokenId, response.transactionHash);
    }

    async claimTransferredFromMatic(hash: string): Promise<void> {
        try {
            const response = await this.maticPOSClient.exitERC721(
                hash,
                { from: await this.wallet.getAccount() }
            );
            this.removeTransferHash(hash);
            alert('Transfer from Matic complete!');
          } catch (error) {
            if (error.message === 'Burn transaction has not been checkpointed as yet') {
              alert('This transfer claim needs about ~30 min to be approved.');
            }
            else if (error.message.includes('EXIT_ALREADY_PROCESSED')) {
              alert('Already claimed!');
              this.removeTransferHash(hash);
            }
          }
    }

    saveTransferHash(tokenId: number, hash: string): void {
        const localData: string = localStorage.getItem('txHashes');
        const txHashes = (JSON.parse(localData) == null) ? [] : JSON.parse(localData);
        txHashes.push({ tokenId, hash });
        localStorage.setItem('txHashes', JSON.stringify(txHashes));
    }

    removeTransferHash(hash: string): void {
        const localData: string = localStorage.getItem('txHashes');
        const txHashes = (JSON.parse(localData) == null) ? [] : JSON.parse(localData);
        const newTxHashes = [];

        for (const txHash of txHashes) {
          if (txHash.hash !== hash) {
            txHashes.push({ tokenId: txHash.id, hash: txHash.hash });
          }
        }

        localStorage.setItem('txHashes', JSON.stringify(newTxHashes));
    }

    loadTransferHash(): any[] {
        const localData: string = localStorage.getItem('txHashes');
        return (JSON.parse(localData) == null) ? [] : JSON.parse(localData);
    }

    getMaticAddress(): string {
        return environment.maticBridgeAddress;
    }

    private encodeInt(int: BN | string | number): string {
        if (typeof int === 'number') {
            int = new BN(int);
        } else if (typeof int === 'string') {
            if (int.slice(0, 2) === '0x') {
              return int;
            }
            int = new BN(int);
        }
        if (BN.isBN(int)) {
            return '0x' + int.toString(16);
        }
    }

    private async getMaticContract(): Promise<any> {
        const abi = require('../../assets/abis/maticbridge.json');
        return new (this.wallet.getWeb3().eth.Contract)(
          abi,
          environment.maticBridgeAddress
        );
    }

}
