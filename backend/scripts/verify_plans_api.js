const axios = require('axios');

async function testPlansEndpoint() {
  try {
    const res = await axios.get('http://localhost:3001/api/v1/payments/plans');
    console.log('API /payments/plans returned', res.data.length, 'plans:');
    for (const p of res.data) {
      console.log(`\n[${p.name}] - Tier: ${p.tier}, Category: ${p.category}, maxInterests: ${p.maxInterests}`);
      console.log('Features:', JSON.stringify(p.features));
    }
  } catch (err) {
    console.error('API request error:', err.code, err.message, err.response?.status, err.response?.data);
  }
}

testPlansEndpoint();
