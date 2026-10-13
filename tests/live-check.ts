import { app } from '../src/app.js';

async function runLiveCheck() {
  console.log('=== START LIVE CHECK AGAINST MYINSTANTS.COM ===\n');

  // 1. Test /recent
  console.log('1. Testing /recent ...');
  const recentRes = await app.request('/recent');
  console.log('Status:', recentRes.status);
  const recentData = await recentRes.json();
  console.log('Data count:', recentData.count);
  if (recentData.data && recentData.data.length > 0) {
    console.log('Sample sound from /recent:', recentData.data[0]);
  }

  // 2. Test /trending?q=id
  console.log('\n2. Testing /trending?q=id ...');
  const trendingRes = await app.request('/trending?q=id');
  console.log('Status:', trendingRes.status);
  const trendingData = await trendingRes.json();
  console.log('Data count:', trendingData.count);
  if (trendingData.data && trendingData.data.length > 0) {
    console.log('Sample sound from /trending:', trendingData.data[0]);
  }

  // 3. Test /search?q=boom
  console.log('\n3. Testing /search?q=boom ...');
  const searchRes = await app.request('/search?q=boom');
  console.log('Status:', searchRes.status);
  const searchData = await searchRes.json();
  console.log('Data count:', searchData.count);
  if (searchData.data && searchData.data.length > 0) {
    console.log('Sample sound from /search:', searchData.data[0]);
  }

  // 4. Test /best?q=id
  console.log('\n4. Testing /best?q=id ...');
  const bestRes = await app.request('/best?q=id');
  console.log('Status:', bestRes.status);
  const bestData = await bestRes.json();
  console.log('Data count:', bestData.count);
  if (bestData.data && bestData.data.length > 0) {
    console.log('Sample sound from /best:', bestData.data[0]);
  }

  // 5. Test /detail?id=<id>&with_duration=true
  if (recentData.data && recentData.data.length > 0) {
    const soundId = recentData.data[0].id;
    console.log(`\n5. Testing /detail?id=${soundId}&with_duration=true ...`);
    const detailRes = await app.request(`/detail?id=${soundId}&with_duration=true`);
    console.log('Status:', detailRes.status);
    const detailData = await detailRes.json();
    console.log('Detail response with duration:', JSON.stringify(detailData, null, 2));
  }

  console.log('\n=== LIVE CHECK COMPLETED SUCCESSFULLY ===');
}

runLiveCheck().catch(console.error);
