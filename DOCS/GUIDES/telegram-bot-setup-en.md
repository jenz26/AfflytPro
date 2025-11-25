# 🤖 Complete Guide: Telegram Bot Setup

> **Estimated time:** 5 minutes
> **Difficulty:** Beginner
> **Last updated:** November 24, 2025

---

## 📋 What You Need

Before starting, make sure you have:

- ✅ An active Telegram account
- ✅ A Telegram channel or group (private is fine)
- ✅ Admin access to the channel/group
- ✅ Active Afflyt Pro account

---

## 🚀 Step 1: Create Bot with BotFather

### 1.1 Open BotFather

1. Open the Telegram app on your device
2. Search for `@BotFather` in the search bar
3. Start the chat by clicking **START**

> 💡 **Note:** BotFather is Telegram's official bot for creating and managing bots

### 1.2 Create your bot

1. Send the command `/newbot` to BotFather
2. BotFather will ask you to choose a **name** for the bot
   - Example: `Afflyt Deal Bot`
3. Then it will ask for a **username**
   - Must end with `bot` (e.g., `AfflytDealBot` or `my_deals_bot`)
   - Must be unique (if taken, try another)

### 1.3 Save the token

Once created, BotFather will reply with a message like this:

```
Done! Congratulations on your new bot. You will find it at
t.me/AfflytDealBot. You can now add a description...

Use this token to access the HTTP API:
1234567890:ABCdefGHIjklMNOpqrsTUVwxyz123456789

Keep your token secure and store it safely, it can be used by
anyone to control your bot.
```

⚠️ **IMPORTANT:**
- **Copy the token** (the string like `1234567890:ABC...`)
- **DO NOT share it with anyone** - it's like a password
- You'll use it in Afflyt configuration

---

## 📢 Step 2: Add Bot to Your Channel

### 2.1 Open channel settings

1. Go to your Telegram channel/group
2. Click on the channel name at the top
3. Select **"Administrators"** or **"Manage channel"**

### 2.2 Add bot as administrator

1. Click **"Add admin"**
2. Search for the bot using the username you created (e.g., `@AfflytDealBot`)
3. Select it from the list

### 2.3 Assign necessary permissions

When adding the bot as admin, make sure to enable:

- ✅ **Post messages**
- ✅ **Edit messages** (optional)
- ⚠️ **DISABLE** all other permissions for security

> 💡 **Tip:** The bot ONLY needs permission to post messages. Don't give it unnecessary permissions.

---

## 🔑 Step 3: Get Channel ID

### 3.1 For public channels

If your channel is public (has a username):

- The Channel ID is simply: `@channel_username`
- Example: `@my_deals_channel`

### 3.2 For private channels

If your channel is private, you need to find the **numeric ID**:

#### Method 1: Using GetIDs bot

1. Temporarily add the `@getidsbot` bot to your channel
2. The bot will automatically send you the Channel ID
3. The format will be like: `-1001234567890`
4. Remove `@getidsbot` from the channel after

#### Method 2: Using Web Telegram

1. Open [web.telegram.org](https://web.telegram.org)
2. Go to your channel
3. Look at the URL in the address bar
4. You'll find a number like: `https://web.telegram.org/#/im?p=c1234567890`
5. The Channel ID is: `-100` + that number = `-1001234567890`

> ⚠️ **Important:** Private Channel IDs ALWAYS start with `-100`

---

## ⚙️ Step 4: Configure in Afflyt Pro

### 4.1 Access configuration

1. Go to Afflyt Pro → **Settings** → **Channels**
2. Click **"Add Channel"**
3. Select **"Telegram"**

### 4.2 Enter credentials

1. **Bot Token:** Paste the token you received from BotFather
   - Example: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`

2. **Channel ID:** Enter your channel ID
   - Public: `@my_channel`
   - Private: `-1001234567890`

3. **Channel Name (descriptive):** Give it a name to easily recognize it
   - Example: "Tech Deals Italy Channel"

### 4.3 Test connection

1. Click **"Test Connection"**
2. Afflyt will send a test message to your channel
3. Check on Telegram that the message arrived
4. If everything is OK, click **"Save"**

---

## ✅ Step 5: Verify and Test

### Final checklist

Before activating automations, verify:

- ✅ Bot is channel administrator
- ✅ Bot has "Post messages" permission
- ✅ Test message arrived correctly
- ✅ Token is saved securely
- ✅ Configuration is active on Afflyt

### Manual test

1. Go to **Automations** → create a test rule
2. Set the Telegram channel you just configured
3. Manually execute the rule
4. Verify that deals are published to the channel

---

## 🎯 Message Format

Messages published by Afflyt will have this format:

```
🔥 HOT DEAL ALERT!

Apple AirPods Pro (2nd gen) with noise cancellation

💰 Price: €159.99 ~€279.00~
💸 Save: €119.01 (-43%)
⭐ Rating: 4.7/5 (12,453 reviews)

👉 [See on Amazon](short.afflyt.io/xyz)

#Ad | Deal found by Afflyt Pro 🤖
```

With:
- ✅ Product image
- ✅ Tracked affiliate link
- ✅ Inline "Go to Amazon" button
- ✅ Always updated data

---

## ❓ Common Troubleshooting

### 🔴 Bot doesn't publish messages

**Possible causes:**
1. ❌ Bot is not administrator → Add as admin
2. ❌ Missing "Post messages" permission → Enable permission
3. ❌ Wrong token → Verify and re-enter token
4. ❌ Wrong Channel ID → Double-check ID (must start with `-100` for private channels)

**Solution:**
```bash
1. Verify bot appears in administrators list
2. Check bot permissions
3. Remove and re-add bot if necessary
4. Test with "Test Connection" command
```

### 🟡 Test message doesn't arrive

**Probable cause:** Telegram cache

**Solution:**
1. Wait 30 seconds
2. Retry test
3. If still not working, remove and re-add bot

### 🟡 "Chat not found" error

**Cause:** Wrong Channel ID

**Solution:**
- For public channels: make sure to use `@username` (with @)
- For private channels: double-check numeric ID (must start with `-100`)

### 🔴 "Bot was blocked by the user" error

**Cause:** Bot was blocked or removed from channel

**Solution:**
1. Re-add bot to channel
2. Make sure it's administrator
3. Retest connection

---

## 🚀 Next Steps

Now that you've configured the Telegram bot:

1. 📊 [Create your first automation](./first-automation.md)
2. ⚙️ [Configure advanced filters](./advanced-filters.md)
3. 📈 [Optimize Deal Score](./deal-score-optimization.md)
4. 💰 [Best practices to maximize conversions](./conversion-optimization.md)

---

## 📞 Need Help?

If you have problems with configuration:

- 💬 **Live Chat:** Available 24/7 for PRO users (< 2 min wait)
- 📧 **Email:** support@afflyt.io (response within 2h)
- 📅 **Video Call:** Book a 1-to-1 support session

---

## 📚 Additional Resources

- [Official Telegram Bot API Documentation](https://core.telegram.org/bots)
- [How to find Channel ID](https://stackoverflow.com/questions/33858927/how-to-obtain-the-chat-id-of-a-private-telegram-channel)
- [Bot security best practices](https://core.telegram.org/bots/faq#general-questions)

---

**Last updated:** November 24, 2025
**Guide version:** 1.0
**Contributors:** Afflyt Pro Team

---

💡 **Have suggestions to improve this guide?** Send us feedback at docs@afflyt.io
