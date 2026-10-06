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

  const termsText = `# Key Highlights
## Key Highlights for Members
Before using S2S Community Matrimony, please review these foundational commitments:

### Authentic Matrimonial Profiles Only
Only registered individuals looking for genuine matrimonial alliances are permitted. Commercial solicitation, casual dating, escort services, or fraudulent behavior is strictly prohibited.

### Legal Age & Marital Status Eligibility
Minimum age is 18 years for females and 21 years for males in strict accordance with Indian Law. Members must be legally unmarried, divorced with final court decree, or widowed.

### Strict Privacy & Mutual Safety Protection
Your contact information is never shared without your mutual interest acceptance. All members undergo phone and optional government verification. Report any suspicious conduct immediately.

# Section 01
## Acceptance of Terms
Welcome to S2S Community Matrimony ("S2S Matrimony", "Platform", "we", "our", or "us"). By accessing, registering on, or using our website and matchmaking services, you acknowledge that you have read, understood, and agreed to be legally bound by these Terms and Conditions ("Terms") and our Privacy Policy.

If you do not agree to these Terms, you must not access or use the Platform. These terms apply to all visitors, registered members, premium subscribers, and users across all platforms.

# Section 02
## Eligibility Requirements
To register as a member or use this Platform, you must satisfy the following legal criteria:

### Minimum Legal Marriageable Age
You must be legally eligible to marry under the laws of India or your country of citizenship. For Indian citizens, the minimum legal age of marriage is 18 years for females and 21 years for males.

### Legally Recognized Marital Status
You must be legally unmarried, divorced (with a certified final court decree), widowed, or legally separated. Married individuals seeking extra-marital relationships are strictly prohibited and will be reported.

### Genuine Matrimonial Intent
The Platform is purpose-built strictly for matrimonial alliance search. Casual dating, escort arrangements, commercial marketing, or fraud are criminal offenses and will result in instant account ban and reporting to cyber authorities.

### Truthfulness & Data Authenticity
All personal, astrological, educational, professional, and family details provided on your profile must be truthful, accurate, and authentic.

# Section 03
## Account Security & Verification
When you create an account, you are responsible for maintaining the confidentiality of your login credentials, password, and mobile OTP tokens. You agree to immediately notify S2S Matrimony of any unauthorized use or security breach.

To protect all community members, S2S Matrimony reserves the right to verify member identities through mobile OTP, email verification, Aadhaar/Govt ID verification, or phone screening. Profiles found with fraudulent or misleading information will be permanently deactivated without refund.

# Section 04
## Community Guidelines & Code of Conduct
You agree not to engage in any prohibited activities on the platform:

### Financial Solicitation Strictly Prohibited
Never ask for money, wire transfers, bank account details, luxury gifts, loans, or investments from any member on the platform. Any financial request should be reported to our safety desk immediately.

### Obscene, Defamatory or Abusive Content
Posting obscene photos, sending abusive or sexually explicit messages, making defamatory remarks, or harassing members or their families is strictly forbidden and constitutes a legal offense.

### Impersonation & Unauthorized Registration
Registering on behalf of an individual without their explicit written consent, or misrepresenting marital, family, educational, or financial status, is strictly prohibited.

### Automated Scraping & Data Extraction
Using bots, crawlers, spiders, or automated scripts to extract member profiles, phone numbers, biodata, or photographs is strictly illegal under cyber regulations.

# Section 05
## Membership Plans & Payment Terms
Free members can search profiles, view recommended matches, and receive interest requests. Upgrading to a paid membership tier (Silver, Gold, Elite, Platinum, Diamond) unlocks contact view credits, horoscope downloads, and direct messaging privileges.

All payments are processed through RBI-compliant, 256-bit SSL encrypted payment gateways. Membership fees are non-refundable once contact view credits or premium services have been accessed, except in verified cases of technical duplicate billing.

# Section 06
## Disclaimer & Due Diligence Advice
While S2S Matrimony implements profile verification tools and active moderation filters, users and their families are strongly advised to exercise independent due diligence before finalizing matrimonial alliances. S2S Matrimony is not an investigation agency and cannot guarantee the complete personal background, character, medical health, financial standing, or criminal history of any registrant.

Astrological calculations (Porutham, Rasi, Star, Dosham) provided on the Platform are for cultural guidance only and should be confirmed with family astrologers as per your tradition.

# Section 07
## Termination & Account Deletion
You may deactivate or permanently delete your account at any time from your account settings. S2S Matrimony reserves the right to suspend or permanently terminate accounts found violating community guidelines, indulging in extortion, providing fake credentials, or abusing other members without prior notice.

# Section 08
## Grievance Redressal Officer & Support
In accordance with the Information Technology Act 2000 and rules made thereunder, any complaints, safety concerns, or legal notices can be addressed to our designated Grievance Officer:

**Designation:** Grievance Redressal Officer  
**Organization:** S2S Community Matrimony Pvt. Ltd.  
**Official Email:** [support@s2smatrimony.com](mailto:support@s2smatrimony.com) / [legal@s2smatrimony.com](mailto:legal@s2smatrimony.com)  
**Headquarters:** No. 42, Usman Road, T.Nagar, Chennai, Tamil Nadu - 600017, India  
**Turnaround Time:** Grievances are acknowledged within 24 business hours and resolved within 15 working days.`;

  current.terms = termsText;
  const jsonStr = JSON.stringify(current);

  await client.query(`
    INSERT INTO settings (id, key, value, "group", "isPublic", "updatedAt")
    VALUES (gen_random_uuid(), 'static_pages', $1, 'CMS', true, NOW())
    ON CONFLICT (key) DO UPDATE SET value = $1, "updatedAt" = NOW()
  `, [jsonStr]);

  console.log('✅ static_pages.terms updated successfully in DB!');
  await client.end();
}

updateDb().catch(e => { console.error(e); process.exit(1); });
