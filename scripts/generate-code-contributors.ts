import { doRequest } from '../server/helpers/requests'
import { readFileSync } from 'fs-extra'

run()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err)
    process.exit(-1)
  })

async function run () {

  {
    const contributors = await fetchGithub('https://api.github.com/repos/chocobozzz/peertube/contributors')

    console.log('# Code contributors\n')
    for (const contributor of contributors) {
      const contributorUrl = contributor.url.replace('api.github.com/users', 'github.com')
      console.log(` * [${contributor.login}](${contributorUrl})`)
    }
  }

  {
    const zanataConfig = readFileSync(require('os').homedir() + '/.config/zanata.ini').toString()
    const zanataUsername = zanataConfig.match('.username=([^\n]+)')[1]
    const zanataToken = zanataConfig.match('.key=([^\n]+)')[1]

    const translators = await fetchZanata(zanataUsername, zanataToken)

    console.log('\n\n# Translation contributors\n')
    for (const translator of translators) {
      console.log(` * [${translator.username}](https://trad.framasoft.org/zanata/profile/view/${translator.username})`)
    }
  }

  {
    console.log('\n\n# Design\n')
    console.log(' * [Olivier Massain](https://twitter.com/omassain)')

    console.log('\n\n# Icons\n')
    console.log(' * [Robbie Pearce](https://robbiepearce.com/softies/)')
    console.log(' * [Fork-Awesome](https://github.com/ForkAwesome/Fork-Awesome)')
    console.log(' * playlist add by Google')
  }
}

function get (url: string, headers: any = {}) {
  return doRequest<any>({
    uri: url,
    json: true,
    headers: Object.assign(headers, {
      'User-Agent': 'PeerTube-App'
    })
  }).then(res => res.body)
}

async function fetchGithub (url: string) {
  let next = url
  let allResult = []

  let i = 1

  // Hard limit
  while (i < 20) {
    const result = await get(next + '?page=' + i)
    if (result.length === 0) break

    allResult = allResult.concat(result)
    i++
  }

  return allResult
}

async function fetchZanata (zanataUsername: string, zanataPassword: string) {
  const today = new Date().toISOString().split('T')[0]
  const year2018 = `https://trad.framasoft.org/zanata/rest/project/peertube/version/develop/contributors/2018-01-01..2019-01-01`
  const year2019 = `https://trad.framasoft.org/zanata/rest/project/peertube/version/develop/contributors/2019-01-01..${today}`

  const headers = {
    'X-Auth-User': zanataUsername,
    'X-Auth-Token': zanataPassword
  }
  const [ results2018, results2019 ] = await Promise.all([
    get(year2018, headers),
    get(year2019, headers)
  ])

  return results2018.concat(results2019)
}
