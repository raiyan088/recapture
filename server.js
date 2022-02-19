const request = require('request-promise-native')
const poll = require('promise-poller').default
const puppeteer = require('puppeteer-extra')
const express = require('express')
const http = require('http')
const fs = require('fs')

let app = express()

let browser = null
let page = null

let server = http.createServer(app)

server.listen(process.env.PORT || 3000, ()=>{
  console.log("Listening on port 3000...")
})

//6LfQttQUAAAAADuPanA_VZMaZgBAOnHZNuuqUewp

;(async () => {

    browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    page = (await browser.pages())[0]

    const google = '6Le-wvkSAAAAAPBMRTvw0Q4Muexq9bi0DJwx_mJ-'
  
    /*await page.evaluate(() => {
      const div = document.createElement("div")
      div.setAttribute("class", "c-form-group g-recaptcha")
      div.setAttribute("data-sitekey", "6LeTnxkTAAAAAN9QEuDZRpn90WwKk_R1TRW_g-JC")
      document.body.appendChild(div)
    })*/
    await page.goto('https://www.google.com/search?q=my+ip+address&sxsrf=APq-WBsMMG1Z_RkNGVLIX6eTsc8P694IZg%3A1645255923757&ei=85wQYv_0LdqaseMPjY-iwAg&oq=my+i&gs_lcp=Cgdnd3Mtd2l6EAEYADIHCAAQsQMQQzIICAAQsQMQkQIyBAgAEEMyBwgAELEDEEMyBAgAEEMyBAgAEEMyBAgAEEMyCAgAEIAEELEDMggIABCABBCxAzIICC4QgAQQ1AI6BwgAEEcQsAM6BwgAELADEEM6BAgjECc6BQgAEIAEOgoIABCABBCHAhAUOgcIIxDqAhAnOgsIABCABBCxAxCDAToFCAAQkQJKBAhBGABKBAhGGABQjgdYzh5goS1oA3ABeASAAd4BiAH6DpIBAzItOZgBAKABAbABCsgBCsABAQ&sclient=gws-wiz', {waitUntil: 'networkidle2', timeout: 0})

    await page.screenshot({ path: "./image.png" })

})()


app.get('/image', function(req, res) {
    fs.readFile('./image.png', function (err, data) {
      if (err) {
          res.writeHeader(400, {"Content-Type": "text/html"});  
          res.write('error');  
          res.end();
      }else {
          res.writeHeader(200, {"Content-Type": "image/png"});  
          res.write(data);  
          res.end();
      }
  })
})