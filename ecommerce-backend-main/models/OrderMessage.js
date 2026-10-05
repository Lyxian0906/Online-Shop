import { DataTypes } from 'sequelize';
import { sequelize } from './index.js';

// One row per message in an order's chat between the customer and the store.
export const OrderMessage = sequelize.define('OrderMessage', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  orderId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  senderId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  senderRole: {
    type: DataTypes.STRING, // 'customer' or 'admin'
    allowNull: false
  },
  text: {
    type: DataTypes.TEXT,
    allowNull: false
  }
});

/*
This file has 5 parts
    Id ones, means the message identity
    orderId, which order each message is from
    senderId, who wrote the message
    senderRole, cutomer or admin duh


*/