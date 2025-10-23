import {
  GoldRushClient,
  StreamingChain,
  StreamingInterval,
  StreamingTimeframe,
} from "@covalenthq/client-sdk";

let clientInstance = null;

export const initializeGoldrushClient = (callbacks = {}) => {
  if (clientInstance) return clientInstance;

  const apiKey = import.meta.env.VITE_GOLDRUSH_API_KEY || import.meta.env.REACT_APP_GOLDRUSH_API_KEY;
  
  if (!apiKey || apiKey === 'your_goldrush_api_key_here') {
    throw new Error('Goldrush API key is missing. Please set VITE_GOLDRUSH_API_KEY in your .env file. Get your API key from: https://goldrush.dev/platform/apikey');
  }

  const defaultCallbacks = {
    onConnecting: () => console.log("🔗 Connecting to GoldRush streaming service..."),
    onOpened: () => {
      console.log("✓ Connected to GoldRush Streaming API!");
      console.log("📡 Monitoring for data...");
    },
    onClosed: () => {
      console.log("✓ Disconnected from GoldRush streaming service");
    },
    onError: (error) => {
      console.error("✗ GoldRush streaming error:", error);
    },
  };

  clientInstance = new GoldRushClient(
    apiKey,
    {},
    {
      ...defaultCallbacks,
      ...callbacks
    }
  );

  return clientInstance;
};

export const getGoldrushClient = () => {
  if (!clientInstance) {
    throw new Error("Goldrush client not initialized. Call initializeGoldrushClient first.");
  }
  return clientInstance;
};

export const disconnectGoldrushClient = async () => {
  if (clientInstance?.StreamingService) {
    await clientInstance.StreamingService.disconnect();
    clientInstance = null;
  }
};