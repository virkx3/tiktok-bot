const scrape = require('./scrape');
const users = ['its.sahiba2233', 'iamvirk'];

(async () => {
  console.log('✅ Bot started');

  for (const username of users) {
    await scrape(username);
  }

  console.log('✅ Scraping cycle complete. Will recheck in 2 hours.');
  setInterval(async () => {
    for (const username of users) {
      await scrape(username);
    }
  }, 2 * 60 * 60 * 1000); // every 2 hours
})();