export const getBuyCredits = async () => {
    return {
        paymentMethods: [
            {
                name: 'USDC',
                symbol: 'USDC',
                address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
                network: 'base',
                recipient: '0x16b1025cD1A83141bf93E47dBC316f34f27f2e76'
            },
            {
                name: 'USDT',
                symbol: 'USDT',
                address: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',
                network: 'base',
                recipient: '0x16b1025cD1A83141bf93E47dBC316f34f27f2e76'
            }
        ]
    }
}

