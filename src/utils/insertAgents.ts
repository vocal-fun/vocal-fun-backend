import { Agent } from "../models/agent";

export const insertAgents = async () => {
    let agents = [
        {
          displayName: 'Trump joker',
          twitter: '@trumpjoker_bot',
          name: 'trump-joker'
        },
        {
          displayName: 'Vitaly',
          twitter: '@vitaly_bot',
          name: 'buterin'
        },
        {
          displayName: 'Jailed CZ',
          twitter: '@jailedcz_bot',
          name: 'cz-jailed'
        },
        {
          displayName: 'Jeethotline',
          twitter: '@jeethotline_bot',
          name: 'jeethotline'
        },{
          displayName: 'Mao',
          twitter: '@mao_bot',
          name: 'mao'
        },
        {
          displayName: 'Putin',
          twitter: '@putin_bot',
          name: 'putin'
        },
        {
          displayName: 'Dokwon',
          twitter: '@dokwon_bot',
          name: 'do-kwon'
        },{
          displayName: 'luffy D monkey',
          twitter: '@luffydmonkey_bot',
          name: 'luffy-d'
        },
        {
          displayName: 'tronman3000',
          twitter: '@tronman_bot',
          name: 'justin-sun'
        },{
          displayName: 'elonmusk',
          twitter: '@dokwon_bot',
          name: 'elon'
        },
        {
          displayName: 'sbf',
          twitter: '@luffydmonkey_bot',
          name: 'banks'
        },
        {
          displayName: 'coinbald',
          twitter: '@tronman_bot',
          name: 'coinbald'
        }
      ];
  
      console.log('MongoDB connected');
  
      // Insert agents into the database with rates set to 1, empty images and twitter
      agents.forEach(async (agent) => {
        let image = `https://vocal-fun.s3.ap-south-1.amazonaws.com/agents_logo/${agent.name}.png`
        const newAgent = new Agent({
            name: agent.displayName,
            image: image,
            rate: 1, 
            twitter: agent.twitter 
        });
  
        await newAgent.save();
        console.log(`Inserted: ${agent.displayName}`);
    });
}