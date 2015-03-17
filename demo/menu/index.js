
import Menu from '../../lib/context-menu.js'

var React = require('react')
  , output = document.getElementById('output')

function makeMenu(e) {
    e.preventDefault()
    Menu.show([
        {title: 'hello'},
        {title: 'awesome', action: log.bind(null, 'Custom action')},
        {title: 'One'},
        {title: 'Two'},
        {title: 'Three', children: [
            {title: 'Three One'},
            {title: 'Three Two', children: [
                {title: 'awesome', action: log.bind(null, 'Custom action')},
                {title: 'One'},
                {title: 'Two some is more and things are here it is long'},
            ]},
        ]},
        {title: 'Four'},
    ], e.pageX, e.pageY, logItem)
}

window.something.addEventListener('contextmenu', makeMenu)

function showmenu() {
    Menu.show([
        {title: 'hello'},
        {title: 'awesome', action: log.bind(null, 'Custom action')},
    ], 100, 100, logItem)
}

function logItem(item) {
    log('Clicked ' + item.title)
}

function log(text) {
    output.innerHTML += text + '<br/>';
}

Menu.show([
    {title: 'One'},
    {title: 'Two'},
    {title: 'Three', children: [
        {title: 'Three One'},
        {title: 'Three Two'},
    ]},
    {title: 'Four'},
], 300, 300, logItem)



