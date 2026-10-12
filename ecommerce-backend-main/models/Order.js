import { DataTypes } from 'sequelize';
import { sequelize } from './index.js';

export const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  orderTimeMs: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  userId: {
    type: DataTypes.UUID
  },
  totalCostCents: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  // 'paid' for every order that went through the (fake) payment.
  // Older orders get 'paid' too, so nothing looks unpaid by mistake.
  paymentStatus: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'paid'
  },
  // The fake receipt number, like MOCK-1A2B3C4D (empty for older orders)
  paymentReference: {
    type: DataTypes.STRING
  },
  products: {
    type: DataTypes.JSON,
    allowNull: false
  },
  createdAt: {
    type: DataTypes.DATE(3)
  },
  updatedAt: {
    type: DataTypes.DATE(3)
  },
}, {
  defaultScope: {
    order: [['createdAt', 'ASC']]
  }
});
