// src/api/zora_api_integration.js
require('dotenv').config();
const fetch = require('node-fetch');

const ZORA_API_ENDPOINT = 'https://api.zora.co/graphql';
const ZORA_API_KEY = process.env.ZORA_API_KEY;

async function fetchNFTsByCollection(collectionAddress) {
  try {
    const query = `
      query {
        tokens(where: { collectionAddresses: ["${collectionAddress}"] }) {
          nodes {
            tokenId
            name
            image
            owner
            tokenUrl
          }
        }
      }
    `;
    const response = await fetch(ZORA_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ZORA_API_KEY}`,
      },
      body: JSON.stringify({ query }),
    });
    const data = await response.json();
    if (data.errors) throw new Error(data.errors[0].message);
    const nfts = data.data.tokens.nodes;
    console.log('Fetched NFTs:', nfts);
    return nfts;
  } catch (error) {
    console.error('Error fetching Zora NFTs:', error);
    throw error;
  }
}

async function getFluxNFTRecommendation(collectionAddress) {
  try {
    const nfts = await fetchNFTsByCollection(collectionAddress);
    return nfts.length
      ? `Hot on Zora: "${nfts[0].name}" (ID: ${nfts[0].tokenId}). Style it in FX1 Digital Runway! ${nfts[0].tokenUrl}`
      : 'No NFTs found. Mint a neon-punk look on Zora: https://zora.co/@fx1_hubs!';
  } catch (error) {
    console.error('Error in Flux recommendation:', error);
    return 'Explore surreal styles on Zora: https://zora.co/@fx1_hubs!';
  }
}

module.exports = { fetchNFTsByCollection, getFluxNFTRecommendation };
