# `models/Profile.js` — the users table (roles)

## What this file is for
Supabase Auth stores the email and password of each user somewhere I can't edit. My app needs extra information about each user (for now: the **role**). This file describes the **`Profiles` table**, where I keep it.

**Passwords never go here.** Supabase handles all of that.

## The code, piece by piece

**`id`**
```js
id: { type: DataTypes.UUID, primaryKey: true }
```
It is the **same id Supabase gives the user**. There is no `defaultValue`, so I must always provide it. That is what links "the Supabase user" and "my Profile row".

**`email`**: a copy of the email, just so I can see who is who when I open the table. It is not used for login.

**`role`**
```js
role: { type: DataTypes.STRING, allowNull: false, defaultValue: 'customer' }
```
Either `'customer'` or `'admin'`. Everyone starts as customer. To make someone admin I change this value by hand in Supabase. The server reads it in `middleware/auth.js`.

**Timestamps:** I didn't write `createdAt` or `updatedAt` here. Sequelize adds them **automatically** unless you turn that off. (The other models define them by hand, but the result is the same.)

## How the row gets created
Not when someone registers. The first time a logged-in user makes a request, `requireAuth` runs `Profile.findOrCreate(...)` and creates the row with `role: 'customer'`.

## Words I saw
- **`findOrCreate`**: "find this row, and if it doesn't exist, create it".
- **Role**: a label that decides what a user can do.

## Careful
- The role is checked on the **server**. The frontend only reads it to decide what to show.
- If I change a role in the table, the user must log out and in (or reload) so the frontend asks `/api/me` again.

## Build something similar
Keep one small "profile" table next to your login provider: the same id as the user, plus the extra data you need (role, username, avatar...).
