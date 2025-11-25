# Changelog - FVD 2: Credential Vault & CRUD (TSK-066)

**Date:** 2025-11-21
**Version:** 0.2.0
**Author:** Antigravity (AI Assistant)

## Summary
This release implements the **Credential Vault** (TSK-066) and **Channels & Connection Wizard** (TSK-067). The Vault provides secure AES-256-GCM encryption for API keys, while the Channels feature allows users to manage publication channels (Telegram, Discord) with a guided 3-step connection wizard.

## 🚀 New Features

### Security (Backend)
- **Encryption Service**: Implemented `SecurityService` using `aes-256-gcm` algorithm.
- **Secure Storage**: API keys are encrypted before being saved to the database.
- **Environmental Safety**: Server startup now enforces the presence of `ENCRYPTION_SECRET`.

### API (Backend)
- **New Routes**:
    - `POST /user/credentials`: Encrypts and saves a new credential.
    - `GET /user/credentials`: Returns a list of credentials with **masked** keys.
    - `DELETE /user/credentials/:id`: Securely removes a credential.
    - `POST /user/channels`: Creates a new channel linked to a credential.
    - `GET /user/channels`: Lists user channels.
    - `DELETE /user/channels/:id`: Removes a channel.
- **Database**: Added `Credential` and `Channel` models to Prisma schema.

### UI/UX (Frontend)
- **Credentials Page**: New page at `/dashboard/settings/credentials`.
- **Channels Page**: New page at `/dashboard/settings/channels` (TSK-067).
- **Visual Identity**:
    - Implemented "Cyber Intelligence" design for the vault and channel list.
    - **Connection Wizard**: 3-Step guided flow for connecting Telegram bots.
    - Masked key display with copy/toggle visibility controls.

## 🛠 Technical Details
- **Dependencies**: Used Node.js built-in `crypto` module.
- **Schema**:
    ```prisma
    model Credential { ... }
    model Channel {
      id           String   @id @default(uuid())
      name         String
      platform     String   // "TELEGRAM", "DISCORD"
      channelId    String
      credentialId String?  // Link to Vault
      status       String   // "CONNECTED", "PENDING"
      ...
    }
    ```
- **Integration**: The Wizard automatically saves the bot token to the Vault (`POST /user/credentials`) before creating the channel, ensuring secure token storage.

## ✅ Verification
- **Security**: Verified that keys are stored as encrypted strings in the DB.
- **API**: Verified that `GET` requests never return the raw key.
- **Flow**: Verified that creating a channel via Wizard creates both a Credential and a Channel record.
- **End-to-End**: Tested complete flow from login → wizard → channel creation → database persistence.

## 🔧 Additional Fixes
- **Login Authentication**: Connected frontend login to backend API (`POST /auth/login`)
- **Token Storage**: Implemented JWT token storage in localStorage
- **CyberButton**: Added `type` and `disabled` props for form submission support
- **User Seed**: Created admin and standard user accounts for testing
- **ENCRYPTION_SECRET**: Fixed lazy loading of SecurityService to prevent startup errors

## 🧪 Test Credentials
- **Admin**: `admin@afflyt.io` / `password123`
- **User**: `user@afflyt.io` / `password123`

