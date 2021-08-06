// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  infuraId: '11185ce0751941c68277973c6c4151bb',
  offchainApi: 'http://localhost:3000',// 'https://sandbox.arkerlabs.com:4009',
  testnet: true,
  stableCoinAddress: '0xDcF513F3E5358467B1a4ec1a78411169a1Fdc5f3',
  stableCoinAddressEth: '0xe4ffd592b36e92e1a53c01f441728a1e5d953c24',
  stableCoinDecimals: 18,
  stableCoinSymbol: 'USDT',
  tokenIdForAuction0: 4,
  maticBridgeAddress: '0xbbd7cbfa79faee899eaf900f13c9065bf03b1a74',
  maticPredicate: '0x74D83801586E9D3C4dc45FfCD30B54eA9C88cf9b',
  marketplaceAddress: '0x0494460B4db4eD8638eF52b94a4CE6d79e5Bb3b7',
  nftAddress: '0xd68A8ABEb9B7435A2652680A767c382DE857Ed6b',
  nftAddressMatic: '0x413CDed68f898B7E5E2F374a82BFEc731aE74A87',
  digiAddress: '0xDcF513F3E5358467B1a4ec1a78411169a1Fdc5f3',
  digiAddressMatic: '0xd68A8ABEb9B7435A2652680A767c382DE857Ed6b',
  auctionAddress: '0x5Fd2f7A76E508819cd821f903C9CDCeDB2B5583B',
  duelsAddress: '0x08dBC03c64B028135CB2758Ca5089aba08fae96D',
  utilsAddress: '0x6abf03c909c56a19b8c8129f6b4eb1a36dfcbc21',
  utilsAddressMatic: '0x1a22b0BE49D418f4c2304aa356f85Ba0865d790E',
  stakeAddress: '0xdDC0b9F299837441b881c0E4FDF091420fe97AbA',
  deletedNfts: [
    11, 15, 16, 17, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
    31, 32, 33, 34, 35, 37, 38, // 18, 36, 10, 61, 4, 66, 76
  ],
  blocksInEvents: 170000,
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
