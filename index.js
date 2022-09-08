const moment = require("moment");
const fs = require('fs')
const {Octokit} = require("@octokit/rest");
const {size, isEmpty, isArray} = require("lodash");
const Bluebird = require('bluebird')
const path = require('path')

const GIT_TOKEN = process.env.GIT_TOKEN
if (!GIT_TOKEN) {
    throw new Error("GIT_TOKEN env not provided")
}

const reposEnv = process.env.GIT_REPOSITORIES
if (!reposEnv) {
    throw new Error("GIT_REPOSITORIES env not provided")
}
const REPOSITORIES = reposEnv.split(',')

const dateStartEnv = process.env.DATE_START
const dateEndEnv = process.env.DATE_END

const DATE_END = dateEndEnv ? moment(dateEndEnv) : moment().endOf("month")
const DATE_START = dateStartEnv ? moment(dateStartEnv) : moment().startOf("month")

const API = new Octokit({auth: GIT_TOKEN});
const AUTHORS = new Set()

const configJson = JSON.stringify({
    REPOSITORIES,
    DATE_START,
    DATE_END,
}, null, '  ')

async function main() {
    console.log(`Checking committers: ${configJson}`)
    await Bluebird.map(REPOSITORIES, countRepositoryAuthors, { concurrency: 5 })
    const result = {
        amount: size(AUTHORS),
        data: [...AUTHORS],
    }
    const resultJson = JSON.stringify(result, null, '  ')
    const resultPath = path.resolve('./result.json')
    fs.writeFileSync(resultPath, resultJson, 'utf-8')
    console.log()
    console.log('-----')
    console.log()
    console.log('Result:')
    console.log(resultJson)
    console.log()
    console.log('-----')
    console.log()
    console.log(`Result file can be found on path: ${resultPath}`)
}

async function countRepositoryAuthors(repository) {
    console.log(`Counting commit authors for repo: ${repository}`)
    const [owner, repo] = repository.split('/');
    let hasNext = false
    let page = 1
    do {
        console.log('-----')
        console.log(`${repository} :: page ${page} -- Getting commits`)
        const result = await API.rest.repos.listCommits({
            repo,
            owner,
            per_page: 100,
            since: DATE_START,
            until: DATE_END,
            page,
        });
        if (!(result.status >= 200 || result.status <= 299)) {
            throw new Error(`${repository} :: page ${page} -- Github returned non 200 status: ${result.status}`)
        }
        if (!result.data || !isArray(result.data)) {
            throw new Error(`${repository} :: page ${page} -- Github returned empty data for commits request`)
        }
        if (isEmpty(result.data)) {
            console.log(`${repository} :: page ${page} -- Empty array of commits (last page or no results)`)
            return
        }
        console.log(`${repository} :: page ${page} -- Processing commits`);
        for (const commit of result.data) {
            AUTHORS.add(commit.commit.author.email)
        }
        console.log(`${repository} :: page ${page} -- Unique commit authors: ${size(AUTHORS)}`)
        console.log('-----')

        if (result.headers && result.headers.link) {
            hasNext = true
            page+=1
        } else {
            hasNext = false
        }
    } while (hasNext)
}

main()
    .then()
    .catch(console.error);
