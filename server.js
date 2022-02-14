const request = require('request-promise-native')
const poll = require('promise-poller').default
const puppeteer = require('puppeteer-extra')
const express = require('express')
const http = require('http')

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
        defaultViewport: null,
        slowMo:10,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    page = (await browser.pages())[0]

    const google = '6Le-wvkSAAAAAPBMRTvw0Q4Muexq9bi0DJwx_mJ-'
    
    //await page.goto('https://www.google.com/recaptcha/api2/demo', {waitUntil: 'networkidle2', timeout: 0})

    console.log('Solved')
    /*const requestId = await initiateCaptchaRequest()

    console.log(requestId)

    const response = await pollForRequestResults(requestId);

    console.log(response)

    await page.evaluate(`document.getElementById("g-recaptcha-response").innerHTML="${response}";`);
*/
    //await page.click('#register-form button[type=submit]');
})()


app.get('/recapture', function(req, res) {
  
    if(req.query) {
        const key = req.query.key
        if(key) {
            const html = '<html>'
                        +'  <head>'
                        +'    <title>reCAPTCHA demo: Simple page</title>'
                        +'    <script src="https://www.google.com/recaptcha/api.js" async defer></script>'
                        +'  </head>'
                        +'  <body>'
                        +'     <div class="g-recaptcha" data-sitekey="'+key+'"></div>'
                        +'  </body>'
                        +'</html>'
            res.send(html)
        } else {
            res.send('error')
        }
    } else{
        res.send('error')
    }
})


async function initiateCaptchaRequest(siteKey) {
    const formData = {
      method: 'userrecaptcha',
      googlekey: siteKey,
      key: '72840c3f39a6cdac651f594bec54969d',
      pageurl: 'https://old.reddit.com/login',
      json: 1
    };
    const response = await request.post('http://2captcha.com/in.php', {form: formData});
    return JSON.parse(response).request;
}

async function pollForRequestResults(id, retries = 30, interval = 1500, delay = 15000) {
    await timeout(delay);
    return poll({
      taskFn: requestCaptchaResults('72840c3f39a6cdac651f594bec54969d', id),
      interval,
      retries
    });
}


function requestCaptchaResults(apiKey, requestId) {
    const url = `http://2captcha.com/res.php?key=${apiKey}&action=get&id=${requestId}&json=1`;
    return async function() {
      return new Promise(async function(resolve, reject){
        const rawResponse = await request.get(url);
        const resp = JSON.parse(rawResponse);
        console.log(resp)
        if (resp.status === 0) return reject(resp.request);
        resolve(resp.request);
      });
    }
  }
  
const timeout = millis => new Promise(resolve => setTimeout(resolve, millis))