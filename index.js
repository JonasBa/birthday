const puppeteer = require('puppeteer');

function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function login(page) {
  await page.focus('#email');
  await page.type('MY_EMAIL');

  await page.focus('#pass');
  await page.type('MY_PASS');

  const loginButton = await page.$('#loginbutton input');
  await loginButton.click();

  await page.waitForNavigation()

  await page.screenshot({path: 'login.png'})
}

async function getEntries(page, browser) {
  await page.screenshot({path: 'activity.png'})
  const loops = 5;

  for(var i = 0; i<loops; i++){
    await timeout(2000*i)
    let button = await page.$('.uiBoxLightblue.uiMorePagerPrimary')
    button.click()
  }
  await timeout(2000*(loops+1))

  let postLinks = await page.$$('table > tbody > tr > td.vTop > div > div > span > a')
  let greetings = await page.$$('table > tbody > tr > td.vTop > div > div > div')

  await page.screenshot({path: 'activity_scroll.png'})

  let validMessages = []

  for(var i=0;i<greetings.length; i++){
    const greeting = greetings[i]
    const activeLink = postLinks[i]

    if(activeLink){

      const text = await greeting.evaluate((g) => {
        return g.textContent
      })

      const link = await activeLink.evaluate(l => {
        if(l.textContent === "Timeline") return null
        return l.href
      })

      if(text.indexOf('wrote on your Timeline') > 0 && link){
        validMessages.push({
          link,
          message: text.split(' ')[0]
        })
      }
    }
  }

  // validMessages = [validMessages[1]]

  await handleBirthday(validMessages, 0, browser)
}

async function handleBirthday(messages, index, browser) {
  if(index < messages.length) {
    const message = messages[index]
    const page = await browser.newPage();
    console.log(`handling birthday ${message.message}`)

    await page.goto(message.link);

    const likedButton = await page.$('.UFILikeLink')
    let iLikedThePost = await likedButton.evaluate((e) => {
      return e.getAttribute('aria-pressed')
    })

    console.log('Checking for like', iLikedThePost)

    if(iLikedThePost === "false") {
      console.log('Liking')
      await likedButton.click()

      // await timeout(1000)
      // await page.screenshot({path: 'thanks.png'})

      // await page.goto(message.link);
      // await page.screenshot({path:'thanks_2.png'})

      // const comment = await page.$('.mentionsHidden')
      // await comment.hover()

      // await comment.click({
      //   delay: 100
      // })
      // await page.type(`Hvala ${message.message}!`)
      // page.screenshot({path:'thanks_3.png'})
    }

    await handleBirthday(messages, index+1, browser)
  }
}

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://facebook.com');
  /* Login */
  await login(page)
  /* Go to profile page */
  await page.goto('https://www.facebook.com/jonas.badalic/allactivity')
  /* Check page */
  await page.screenshot({path: 'profile.png'})
  // Entries
  await getEntries(page, browser)
  /* Home */
  browser.close();
})();