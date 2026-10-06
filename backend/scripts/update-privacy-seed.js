const { Client } = require('pg');

async function updateDb() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5433/s2s_matrimony?schema=public'
  });
  await client.connect();

  const res = await client.query("SELECT value FROM settings WHERE key = 'static_pages'");
  let current = {};
  if (res.rows.length > 0 && res.rows[0].value) {
    try {
      current = JSON.parse(res.rows[0].value);
    } catch (e) {}
  }

  const privacyText = `# Core Principles
## Our Privacy Promises to Members
At S2S Community Matrimony, we recognize that matrimonial matchmaking touches the most personal and confidential facets of family life. We operate with strict ethical standards built on three non-negotiable promises:

### No Public Phone Numbers or Contact Harvesting
Your contact number, residential address, and personal email are never indexed by web search engines or made visible to casual site visitors. Your phone number is disclosed solely upon mutual interest acceptance or through authorized verified subscriber permissions configured under your explicit settings.

### Anti-Theft Photo Protection & Granular Visibility
You retain complete authority over your photos. Choose to protect your photographs with anti-theft security watermarks featuring your Member ID, blur images for anonymous browsing, or restrict viewing exclusively to profiles whose connection requests you have accepted.

### Zero Commercial Advertising & No Third-Party Data Sales
We do not sell, rent, lease, or monetize your personal information, biodata, or horoscope charts to external telemarketers, banks, or ad networks. Your information exists exclusively to help you find an authentic, meaningful life partner within our community.

# Section 01
## Information We Collect
To provide an authentic matchmaking experience and safeguard members against fraudulent accounts, S2S Community Matrimony collects personal information when you create an account, complete your matrimonial biodata, or engage with other profiles:

### Basic Account & Identity Credentials
Full name, gender, date of birth, age, primary mobile phone number, email address, relationship of the profile creator (e.g. self, parent, or sibling), and salted password hash.

### Matrimonial Profile & Background Details
Religion, community, caste, sub-caste, mother tongue, marital status, height, weight, body type, complexion, educational degree, college or university, occupation, employer, annual income range, current residential status, city, state, and country.

### Family Information & Lifestyle Preferences
Family type (nuclear or joint), family status, family values, father's name and occupation, mother's name and occupation, sibling counts and marital statuses, native place, diet preferences, smoking and drinking habits, and partner expectations.

### Astrological & Horoscope Data
Rasi (Moon sign), Nakshatram (Birth star), Star Padam, Lagnam (Ascendant), Gothram, Kuladeivam, Dosham indicators (e.g., Chevvai / Raagu Dosham), Dasa balance, birth time, birthplace, and uploaded horoscope charts used for traditional Porutham matching.

### Verification & Audit Records
Mobile OTP tokens, optional Government photo ID documents (e.g., Aadhaar, Voter ID, or Passport) submitted solely for verification badge issuance, fraud prevention, and admin compliance. ID documents are strictly internal and are never visible to other members.

### Technical & Platform Interaction Data
IP address, browser type, device information, operating system, login timestamps, profiles viewed, interests sent and received, and internal chat interaction metadata to enforce platform security and prevent spam.

# Section 02
## How We Use Your Information
All data gathered is utilized strictly for lawful purposes directly related to facilitating matrimonial alliances and preserving safety:

### Matchmaking & Astrological Compatibility Calculations
We analyze your criteria, partner preferences, community parameters, and horoscope coordinates to generate compatible match recommendations and calculate 10-Porutham astrology scores.

### Communication Alerts & Member Notifications
We deliver SMS, WhatsApp, and email alerts when a member expresses interest in your profile, accepts an invitation, sends a chat message, or views your biodata.

### Safety Moderation & Bad Actor Prevention
We actively screen profiles to detect duplicate accounts, identify fraudulent impersonations, prevent harassment, and enforce our Community Code of Conduct.

### Subscription Billing & Customer Assistance
We process membership upgrades via RBI-regulated payment gateways, generate official GST tax invoices, and offer dedicated customer support for profile assistance and queries.

# Section 03
## Your Privacy Settings & Controls
You maintain full sovereignty over your information through our granular Privacy Settings available inside your member dashboard:

### Contact Number Visibility Controls
Configure whether your phone number is visible to all premium verified members, restricted exclusively to members whose connection interest you have explicitly accepted, or completely hidden until requested individually.

### Anti-Theft Photo Watermarking & Anonymous Blur Protection
Uploaded photos can be dynamically stamped with your unique Member ID and platform security branding to prevent unauthorized redistribution or downloads. You can also enable photo blur so only accepted matches see your photo in full resolution.

### Incognito Mode & Temporary Profile Deactivation
If you are actively in discussion with a prospective match or need time off, you can hide your profile from search results instantly with a single toggle, preserving all your account data, chat histories, and favorites without deleting your account.

# Section 04
## Information Sharing & Third-Party Disclosure
We hold a strict policy against selling user data. Your information is shared only under the following controlled parameters:

### Display to Registered Members
Basic matrimonial details (age, height, community, education, occupation, and general city) are displayed on your profile card to registered users for matchmaking purposes.

### Secure Payment Processors
When purchasing a membership plan, transactions are processed directly by PCI-DSS compliant payment gateways (such as Razorpay). We never capture, store, or log raw debit/credit card numbers or UPI PINs on our servers.

### Transactional SMS & Email Gateways
Reputable telecom partners and encrypted transactional mail providers are used solely for OTP delivery, account recovery, and essential platform updates.

### Legal Compliance & Law Enforcement
We disclose member information only when mandated by valid subpoenas, court orders, or statutory legal processes under Indian cyber law to investigate fraud, criminal impersonation, or safety violations.

# Section 05
## Data Security & Encryption Standards
We employ modern security protocols and architectural safeguards to protect your personal information against unauthorized access, loss, or alteration:

### End-to-End Transport Layer Security (TLS / SSL)
All data transmitted between your device and our servers is encrypted using 256-bit TLS/SSL protocols, safeguarding your data against eavesdropping or interception.

### Cryptographic Salted Password Hashing
Account passwords are never stored in plain text. They are hashed using industry-standard Bcrypt algorithms with cryptographic salting, ensuring irreversible protection even in internal storage.

### Role-Based Access Controls (RBAC) & Immutable Audit Logging
Administrative database access is tightly restricted to authorized moderation personnel under strict role-based permission policies. All administrative queries, verifications, and approvals are tracked with immutable audit logs.

### Automated Vulnerability Monitoring
Our infrastructure undergoes regular dependency patch cycles, automated penetration scans, and continuous firewall protection to defend against contemporary cyber threats.

# Section 06
## Your Data Rights & Profile Deletion
Under the Digital Personal Data Protection (DPDP) Act 2023 and global privacy benchmarks, every registered user is entitled to full autonomy over their personal record:

### Right to Access & Rectify
You can review, edit, or update your profile details, family background, photos, and partner preferences at any time directly through your account dashboard.

### Right to Data Portability
You have the right to request a digital export of your submitted matrimonial profile, photos, and interaction records by writing to our support desk.

### Right to Permanent Account Erasure
When you find your life partner or wish to withdraw from the service, you can permanently delete your account from your Profile Settings. Upon deletion, your profile is immediately taken offline and permanently removed from active indexes within 30 calendar days, subject only to statutory financial record retention requirements.

# Section 07
## Grievance Redressal Officer & Contact Information
In compliance with the Information Technology Act 2000 and the Digital Personal Data Protection Act 2023, S2S Community Matrimony has designated a dedicated Grievance Officer to address any privacy concerns, data removal requests, or report unauthorized contact access:

**Designation:** Grievance Redressal & Privacy Officer
**Organization:** S2S Community Matrimony Pvt. Ltd.
**Official Email:** [privacy@s2smatrimony.com](mailto:privacy@s2smatrimony.com) / [support@s2smatrimony.com](mailto:support@s2smatrimony.com)
**Headquarters:** No. 42, Usman Road, T.Nagar, Chennai, Tamil Nadu - 600017, India
**Turnaround Time:** Grievances are acknowledged within 24 business hours and resolved within 15 working days.`;

  current.privacy = privacyText;
  const jsonStr = JSON.stringify(current);

  await client.query(`
    INSERT INTO settings (id, key, value, "group", "isPublic", "updatedAt")
    VALUES (gen_random_uuid(), 'static_pages', $1, 'CMS', true, NOW())
    ON CONFLICT (key) DO UPDATE SET value = $1, "updatedAt" = NOW()
  `, [jsonStr]);

  console.log('✅ static_pages.privacy updated successfully in DB!');
  await client.end();
}

updateDb().catch(e => { console.error(e); process.exit(1); });
