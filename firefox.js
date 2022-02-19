const puppeteer = require('puppeteer-extra')
const axios = require('axios')
const https = require('https')


;(async () => {

    const browser = await puppeteer.launch({
        headless: false
        //args: ['--no-sandbox', '--disable-setuid-sandbox']
    })


    const page = (await browser.pages())[0]

    while(true) {
      await page.goto('https://www.google.com/recaptcha/api2/demo')

      const result = await solve(page)
      console.log(result)
       await delay(3000)
    }

})()

async function solve(page) {
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

    while (true) {
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
        await reloadButton.click()
        continue
      }

      const input = await imageFrame.$('#audio-response')
      await input.click()
      await input.type(audioTranscript)

      const verifyButton = await imageFrame.$('#recaptcha-verify-button')
      await verifyButton.click()

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
    console.error(e)
    return null
  }
}

function delay(time) {
  return new Promise(function(resolve) { 
      setTimeout(resolve, time)
  });
}