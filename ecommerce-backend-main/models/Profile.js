import { DataTypes } from 'sequelize';
import { sequelize } from './index.js';

/*
This file "creates" a new table in our database, since Supabase
already stores the user's mail in somewhere u can't acess

The id part is gonna be the same Id that supabase gaves the user

The email, is a copy so u can see who is who when we open the table

The role is for the customer or admin, which I can change by myself
which role I want to have

We don't put passwords here since that's why we have supabase Auth
*/
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

/*
 One row per Supabase user. The id is the same id Supabase Auth gives the user,
 so we never store passwords here - Supabase handles all of that.



*/