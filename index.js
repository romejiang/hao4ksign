const path = require('path')
const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const schedule = require('node-schedule')

// 这是一些工具方法，也许用不到，暂时留在这里
const s = (ss) =>
  new Promise((res, rej) => {
    setTimeout(res, ss * 1000)
  })
const s10 = () =>
  new Promise((res, rej) => {
    return setTimeout(res, 10 * 1000)
  })
const s30 = () =>
  new Promise((res, rej) => {
    return setTimeout(res, 30 * 1000)
  })
// 生成随机数
function randomNum(minNum, maxNum) {
  switch (arguments.length) {
    case 1:
      return parseInt(Math.random() * minNum + 1, 10)
      break
    case 2:
      return parseInt(Math.random() * (maxNum - minNum + 1) + minNum, 10)
      break
    default:
      return 0
      break
  }
}
// 格式化日期
Date.prototype.format = function (fmt) {
  var o = {
    'M+': this.getMonth() + 1,
    'd+': this.getDate(),
    'h+': this.getHours(),
    'm+': this.getMinutes(),
    's+': this.getSeconds(),
    'q+': Math.floor((this.getMonth() + 3) / 3),
    S: this.getMilliseconds(),
  }
  if (/(y+)/.test(fmt)) {
    fmt = fmt.replace(RegExp.$1, (this.getFullYear() + '').substr(4 - RegExp.$1.length))
  }
  for (var k in o) {
    if (new RegExp('(' + k + ')').test(fmt)) {
      fmt = fmt.replace(
        RegExp.$1,
        RegExp.$1.length == 1 ? o[k] : ('00' + o[k]).substr(('' + o[k]).length)
      )
    }
  }
  return fmt
}

// 主入口程序
async function play() {
  let browser = null
  const DefaultTimeout = 90 * 1000
  try {
    // 设置浏览器一些默认参数
    puppeteer.use(StealthPlugin())
    const params = {
      headless: false,
      args: [
        // "--proxy-server='direct://'",
        // '--proxy-bypass-list=*',
        '--ignore-certificate-errors',
        '--no-sandbox',
        '--disable-infobars',
        '--disable-setuid-sandbox',
        '--window-size=1300,900',
      ],
      ignoreHTTPSErrors: true,
      timeout: DefaultTimeout,
      userDataDir: './tmp/hao4k2',
    }
    browser = await puppeteer.launch(params)

    const page = await browser.newPage()
    // 设置默认timeout时间
    await page.setDefaultTimeout(DefaultTimeout)
    // 设置窗口大小
    await page.setViewport({ width: 1280, height: 768 })
    // puppeteer内部调用打印日志
    page.on('console', (consoleObj) => {
      if (consoleObj.text().indexOf('inner-') === 0) {
        const key = consoleObj.text().replace('inner-', '')
        console.log(i18n.__(key), new Date().format(' yyyy-MM-dd hh:mm:ss'))
      }
    })

    const loginURL = 'https://www.hao4k.cn/qiandao/'
    console.log('开始打开', loginURL, new Date())
    // 加载页面，并要求完全加载完成
    await page.goto(loginURL)

    console.log('页面加载成功')
    await page.waitForTimeout(1 * 1000)

    // 检查两个页面状态，已判断显示是否签到
    let checklist = [page.waitForSelector('span.btnvisted'), page.waitForSelector('#JD_sign')]


    let champion = await Promise.race(checklist)
    if (champion) {
      const className = await champion.evaluate((node) => node.getAttribute('class'))
      const href = await champion.evaluate((node) => node.getAttribute('href'))
      // console.log(className, href)
      // 检查状态，根据不同的状态打印日志
      if (className.includes('btnvisted')) {
        console.log('今日已签到')
      }
      if (className.includes('J_chkitot')) {
        if (href.includes('login')) {
          console.log('🚫未登陆，请先登录')
          await page.waitForTimeout(120 * 1000)
        } else if (href.includes('sign')) {
          await page.click('#JD_sign')
          console.log('点击签到')
        }
      }
    }
    await page.waitForTimeout(3 * 1000)
  } catch (err) {
    console.log(`❌ Error: ${err}`)
  } finally {
    await browser.close()
  }
}

;(async () => {
  const task = '1 1 * * * *'
  console.log('开始定时任务', task)
  schedule.scheduleJob(task, play)
  // await play()
})()
