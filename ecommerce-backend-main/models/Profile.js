import { DataTypes } from 'sequelize';
import { sequelize } from './index.js';

// One row per Supabase user. The id is the same id Supabase Auth gives the user,
// so we never store passwords here - Supabase handles all of that.
export const Profile = sequelize.define('Profile', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'customer' // 'customer' or 'admin'
  }
});
