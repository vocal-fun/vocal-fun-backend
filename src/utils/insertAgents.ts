import { Agent, AgentVoicePreview } from "../models/agent";

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


export const insertAgentVoicePreviews =async () => {
   
    let voicePreviews = [
        {
          "name": "trump-joker",
          "displayName": "Trump joker",
          "voicePreview": "Make America great again!"
        },
        {
          "name": "buterin",
          "displayName": "Vitaly",
          "voicePreview": "Vitaly here, spreading good vibes!"
        },
        {
          "name": "cz-jailed",
          "displayName": "Jailed CZ",
          "voicePreview": "The market will rise again, mark my words."
        },
        {
          "name": "jeethotline",
          "displayName": "Jeethotline",
          "voicePreview": "Dial me for advice, I’ve got answers."
        },
        {
          "name": "mao",
          "displayName": "Mao",
          "voicePreview": "Power comes from the people!"
        },
        {
          "name": "putin",
          "displayName": "Putin",
          "voicePreview": "Russia will always rise stronger."
        },
        {
          "name": "do-kwon",
          "displayName": "Dokwon",
          "voicePreview": "We’ll build the future, one block at a time."
        },
        {
          "name": "luffy-d",
          "displayName": "luffy D monkey",
          "voicePreview": "I’m going to be the Pirate King!"
        },
        {
          "name": "justin-sun",
          "displayName": "tronman3000",
          "voicePreview": "Tron to the moon!"
        },
        {
          "name": "elon",
          "displayName": "elonmusk",
          "voicePreview": "Let’s make humanity multi-planetary."
        },
        {
          "name": "banks",
          "displayName": "sbf",
          "voicePreview": "The future is decentralized."
        },
        {
          "name": "coinbald",
          "displayName": "coinbald",
          "voicePreview": "Crypto is the future, let's go."
        }
      ]

      let agents: any = await Agent.find();

      voicePreviews.forEach(async (preview) => {
        let agent: any = agents.find((agent: any) => agent.name === preview.displayName);
        const newAgent = new AgentVoicePreview({
            agentId: agent._id,
            text: preview.voicePreview
        });
  
        await newAgent.save();
        console.log(`Inserted: ${agent.name} ${preview.voicePreview}`);
    });
      
}