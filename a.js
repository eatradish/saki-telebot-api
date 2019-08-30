const $ = require('cheerio');
const cheerio = require('cheerio')
var axios = require('axios')

var a = async () => {
    const r = await axios.get('https://jandan.net/treehole/')
    if (r.status === 200) return r.data
}

var main = async() => {
    var b = await a()
    var res = cheerio.load(b)
    var list = res.html().split('\n')
    var list2 = []
    var c = '<div class="comments">'
    var d = '<ol class="commentlist" style="list-style-type: none;">'
    var start
    var end
    for (var i = 0; i < list.length; i++) {
        if (list[i].indexOf(d) !== -1) start = i
        else if (list[i].indexOf(c) !== -1) end = i
    }
    console.log(start + ' ' + end)
    for (var i = start; i < end; i++) {
        list2.push(list[i])
    }
    var i = list2.length - 1;
    list2.splice(list2.lastindexOf('</ol>'), 1)
    list2.shift()
    list2.pop()
    var str = list2.join('\n')
    var list3 = str.split('</li>')
    var list4 = []
    for (var i = 0; i < list3.length; i++) {
        list3[i] += '</li>'
        list4.push(cheerio('div', list3[i]).attr('class'))
    }
    for (var i = 0; i < list4.length; i++) {
         console.log(list4[i])
    }
}

main()
