const express = require('express')
const path = require('path')
const app = express()
const port = 3030
const USERNAME = require('os').userInfo().username
const fs = require('fs')

var CSVfilePath = path.join(__dirname, './dataSheet/apex Data Sheet.csv')

const logDirPath = path.normalize(
  `C:\\Users\\${USERNAME}\\Saved Games\\Respawn\\Apex\\assets\\temp\\live_api`
)

const getMostRecentFile = (dir) => {
  const files = orderReccentFiles(dir)
  return files.length ? files[0] : undefined
}

const orderReccentFiles = (dir) => {
  return fs
    .readdirSync(dir)
    .filter((file) => fs.lstatSync(path.join(dir, file)).isFile())
    .map((file) => ({ file, mtime: fs.lstatSync(path.join(dir, file)).mtime }))
    .sort((a, b) => b.mtime.getTime() - a.mtime.getTime())
}

const csvData = () => {
  var data = fs.readFileSync(CSVfilePath, { encoding: 'utf8' })

  var rows = data.split('\n')

  var result = []

  for (var rowIndex in rows) {
    var row = rows[rowIndex].split(',')

    var columns = row
    var data = {} // 빈 객체를 생성하고 여기에 데이터를 추가한다.

    for (var columnIndex in columns) {
      // 칼럼 갯수만큼 돌면서 적절한 데이터 추가하기.

      data[columnIndex] = row[columnIndex]
    }

    result.push(data)
  }

  return result
}

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/json', (req, res) => {
  const mostRecentLogFilePath =
    logDirPath + '\\' + getMostRecentFile(logDirPath).file
  console.log(mostRecentLogFilePath)

  fs.readFile(mostRecentLogFilePath, 'utf-8', (err, data) => {
    if (err) return console.log(err)

    const checkEnd = data.charAt(data.length - 3) === ']'
    var uniqueArr = []

    // 파일 읽어와서 JSON 객체 변환
    const parsedData = JSON.parse(checkEnd ? data : data + ']')
      .filter((element) => element.category === 'observerSwitched')
      .map((el, index) => {
        return {
          name: el.observer.name,
          teamId: el.target.teamId,
          squadIndex: el.target.squadIndex,
        }
      })
      .reverse()

    parsedData.forEach((element) => {
      const a = uniqueArr.find((i) => {
        return i.name === element.name
      })
      if (uniqueArr.length < 1) {
        uniqueArr.push(element)
      } else if (a == undefined) {
        uniqueArr.push(element)
      } else {
        uniqueArr.teamId = element.teamId
      }
    })

    let sortedData = uniqueArr.sort(function (a, b) {
      let x = a.name.toLowerCase()
      let y = b.name.toLowerCase()
      if (x < y) {
        return -1
      }
      if (x > y) {
        return 1
      }
      return 0
    })

    res.json(
      sortedData.map((el, index) => {
        const csv = csvData()
        const csvData = csv[(el.teamId - 2) * 3 + el.squadIndex]
        return {
          observerName: el.name,
          teamName: csvData[0],
          playerName: csvData[1],
          thumb: csvData[2],
        }
      })
    )
  })
})

app.get('/csv', (req, res) => {
  res.send(csvData())
})
// custom 404
app.use((req, res, next) => {
  res.status(404).send("Sorry can't find that!")
})

// custom error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).send('Something broke!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
