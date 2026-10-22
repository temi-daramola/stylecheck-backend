import mongoose from 'mongoose';

export const database = Object.freeze({
  connect: async (uri) => {
    return mongoose.connect(uri);
  },
  disconnect: async () => {
    return mongoose.disconnect();
  },
  isConnected: () => {
    return mongoose.connection.readyState === 1;
  },
});

