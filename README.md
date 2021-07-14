**Most recent branch for both Production and Dev is auctions_v2.**

Admin manual: https://github.com/DubovkaE/digible/blob/master/README.md


# DigibleWeb

dApp for interacting with the digible platform. 

Fixed-Price Sales “buys” (/explore page)  run on the Ethereum chain (ERC20).

Auctions “bids” (/auctions page) run on the Polygon-Matic side chain (Matic). 

Each type of transaction (fixed-sale / auction) utilizes a different blockchain and thus requires different types of digital assets to participate: 
Fixed-Price Sales utilize $ETH & $USDT (ERC20)  | Auctions utilize bridged $MATIC (Matic) & $USDT (Mati)

You must hold: 3,000 $DIGI to create fixed-price sales | 3,000 bridged $DIGI to create auctions

Use the matic bridge to bridge ERC20 tokens onto Matic network which are needed for auctions. 
https://wallet.matic.network/bridge/

## Guides

See the full usage guide at https://docs.google.com/document/d/1ubyA8AP0nESi4djNwaUaHHsfqO_P2pa86oc-2SG0ZAI/edit?usp=sharing. 

Usage video: https://www.youtube.com/watch?v=MjcpcprMSTw

## Updating UI Server
Upgrade/Deploy UI Server Code
SSH TO UI SERVER

```
cd ~/DigibleUI/
git pull
rm -rf dist/
npm install
npm run build -- --prod
cd /var/www
sudo rm -rf dist
cd ~/DigibleUI/
sudo cp -Rf dist/ /var/www
sudo service nginx restart
```

*sometimes you need to purge the clouflare cache to get the changes to update right away on your browser

## Development server

Run `npm start` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files. Uses fev env file /src/enviroments/enviroment.ts (set to use goerli testnet with mumbai matic testnet)



## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build. Uses eth mainnet + matic mainnet 

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).


## Blockchain Addresses

$DIGI (ERC20):
**0x3cbf23c081faa5419810ce0f6bc1ecb73006d848**

$DIGI (Matic):
**0x4d8181f051E617642e233Be09Cea71Cc3308ffD4**
______________________________________________

$MATIC (ERC20): 
**0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0**

$MATIC (Matic):
**0x0000000000000000000000000000000000001010**
______________________________________________

$USDT (ERC20): 
**0xdac17f958d2ee523a2206206994597c13d831ec7**

$USDT (Matic):
**0xc2132D05D31c914a87C6611C10748AEb04B58e8F**

_______________________________________________
**Testnet Addresses:**
dev.digible.io

$DIGI (Mumbai Matic Testnet):
**0xd68A8ABEb9B7435A2652680A767c382DE857Ed6b**
*contact admin@digible.io to request some transferred to you for testing

$DIGI (Goerli Eth Testnet):
**0xDcF513F3E5358467B1a4ec1a78411169a1Fdc5f3**
*contact admin@digible.io to request some transferred to you for testing

_______________________________________________________________________

$USDC (Mumbai Matic Testnet):
**0xDcF513F3E5358467B1a4ec1a78411169a1Fdc5f3**
*contact admin@digible.io to request some transferred to you for testing

$USDC (Goerli Eth Testnet):
**0xE4FfD592b36e92e1a53C01f441728A1E5d953c24**
*contact admin@digible.io to request some transferred to you for testing

_______________________________________________________________________

$MATIC (Mumbai Matic Testnet):
**0x2E623b1328F78bbb1A831eEA0ad5723a2D8E826f**
https://faucet.matic.network/
