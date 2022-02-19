const puppeteer = require('puppeteer-extra')
const express = require('express')
const http = require('http')
const fs = require('fs')
const axios = require('axios')
const https = require('https')

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
        headless: true,
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

    //await page.setViewport({ width: 400, height: 326 })

    await page.setUserAgent('Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.0 Mobile Safari/537.36')

    await page.goto('https://www.google.com/recaptcha/api2/demo', {waitUntil: 'networkidle2', timeout: 0})

    try {
      await page.waitForFunction(() => {
        const iframe = document.querySelector('iframe[src*="api2/anchor"]')
        if (!iframe) return false
  
        return !!iframe.contentWindow.document.querySelector('#recaptcha-anchor')
      })
  
      let frames = await page.frames()
      const recaptchaFrame = frames.find(frame => frame.url().includes('api2/anchor'))
  
      const checkbox = await recaptchaFrame.$('#recaptcha-anchor')
      await checkbox.click()
  
      
      await page.waitForFunction(() => {
        const iframe = document.querySelector('iframe[src*="api2/bframe"]')
        if (!iframe) return false
  
        const img = iframe.contentWindow.document.querySelector('.rc-image-tile-wrapper img')
        return img && img.complete
      })
  
      frames = await page.frames()
      const imageFrame = frames.find(frame => frame.url().includes('api2/bframe'))
      const audioButton = await imageFrame.$('#recaptcha-audio-button')
      await audioButton.click()
      await delay(5000)

      await page.screenshot({ path: './image.png' })
      

      while (false) {
        try {
          await page.waitForFunction(() => {
            const iframe = document.querySelector('iframe[src*="api2/bframe"]')
            if (!iframe) return false
  
            return !!iframe.contentWindow.document.querySelector('.rc-audiochallenge-tdownload-link')
          }, { timeout: 5000 })
        } catch (e) {
          console.error(e)
          continue
        }
  
        const audioLink = await page.evaluate(() => {
          const iframe = document.querySelector('iframe[src*="api2/bframe"]')
          return iframe.contentWindow.document.querySelector('#audio-source').src
        })
  
        const audioBytes = await page.evaluate(audioLink => {
          return (async () => {
            const response = await window.fetch(audioLink)
            const buffer = await response.arrayBuffer()
            return Array.from(new Uint8Array(buffer))
          })()
        }, audioLink)
  
        const httsAgent = new https.Agent({ rejectUnauthorized: false })
        const response = await axios({
          httsAgent,
          method: 'post',
          url: 'https://api.wit.ai/speech?v=2021092',
          data: new Uint8Array(audioBytes).buffer,
          headers: {
            Authorization: 'Bearer JVHWCNWJLWLGN6MFALYLHAPKUFHMNTAC',
            'Content-Type': 'audio/mpeg3'
          }
        })
  
        let audioTranscript = null;
  
        try{
          audioTranscript = response.data.match('"text": "(.*)",')[1].trim()
        } catch(e){
          const reloadButton = await imageFrame.$('#recaptcha-reload-button')
          await reloadButton.click({ delay: rdn(30, 150) })
          continue
        }
  
        const input = await imageFrame.$('#audio-response')
        await input.click({ delay: rdn(30, 150) })
        await input.type(audioTranscript, { delay: rdn(30, 75) })
  
        const verifyButton = await imageFrame.$('#recaptcha-verify-button')
        await verifyButton.click({ delay: rdn(30, 150) })
  
        try {
          await page.waitForFunction(() => {
            const iframe = document.querySelector('iframe[src*="api2/anchor"]')
            if (!iframe) return false
  
            return !!iframe.contentWindow.document.querySelector('#recaptcha-anchor[aria-checked="true"]')
          }, { timeout: 5000 })
  
          return page.evaluate(() => document.getElementById('g-recaptcha-response').value)
        } catch (e) {
          console.error(e)
          continue
        }
      }

    } catch (e) {
      console.log('Error: ',e)
    }

    
})()


app.get('/image', function(req, res) {
    fs.readFile('./image.png', function (err, data) {
      if (err) {
          const error = page.content()
          res.writeHeader(400, {"Content-Type": "text/html"});  
          res.write(error)
          res.end();
      }else {
          res.writeHeader(200, {"Content-Type": "image/png"});  
          res.write(data);  
          res.end();
      }
  })
})

function delay(time) {
  return new Promise(function(resolve) { 
      setTimeout(resolve, time)
  });
}