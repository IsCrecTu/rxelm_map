// algorandAPI.js

export async function fetchAlgorandAssets(walletAddress) {
    const apiUrl = `https://mainnet-api.algonode.cloud/v2/accounts/${walletAddress}`;

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch assets: ${response.statusText}`);
        }
        const data = await response.json();
        
        // Extract ASA IDs from the response where the amount is greater than 0
        const asaIds = data.assets
            .filter(asset => asset.amount > 0) // Only include assets with amount > 0
            .map(asset => asset['asset-id']);
        return asaIds;
    } catch (error) {
        console.error('Error fetching ASAs:', error);
        return [];
    }
}