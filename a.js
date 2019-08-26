var himalaya = require('himalaya')
var axios = require('axios')

var a = async () => {
    const r = await axios.get('https://jandan.net/treehole/')
    if (r.status === 200) return r.data
}

var main = async() => {
    var b = await a()
    var res = himalaya.parse(b)
    for (var i of res[2].children) {
        if (i.children) {
            
        }
    }
}

main()
